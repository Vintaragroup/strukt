// @ts-nocheck
import type { Node as RFNode } from '@xyflow/react'

export type Rect = { id: string; x: number; y: number; w: number; h: number }
export type OverlapPair = { a: string; b: string }

const DEFAULT_NODE_WIDTH = 280
const DEFAULT_NODE_HEIGHT = 200
const DEFAULT_CENTER_DIMENSIONS = { width: 360, height: 240 }

function parseDimension(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function getFallbackDims(node: RFNode): { width: number; height: number } {
  if (node?.type === 'center') return DEFAULT_CENTER_DIMENSIONS
  return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
}

function getDims(node: RFNode, measure?: Record<string, { width: number; height: number }>): { width: number; height: number } {
  const cached = measure?.[node.id]
  const fallback = getFallbackDims(node)
  const width = parseDimension(cached?.width) ?? parseDimension((node as any).width) ?? parseDimension((node as any).style?.width) ?? fallback.width
  const height = parseDimension(cached?.height) ?? parseDimension((node as any).height) ?? parseDimension((node as any).style?.height) ?? fallback.height
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) }
}

function isFixedNode(n: RFNode | undefined | null): boolean {
  if (!n) return false
  // Treat center and pinned nodes as fixed (immovable) during relaxation
  // Center can be identified by id or type
  const isCenter = n.id === 'center' || (n as any).type === 'center'
  const isPinned = Boolean((n as any)?.data?.pinned === true)
  return isCenter || isPinned
}

export function rectsFromNodes(nodes: RFNode[], measure?: Record<string, { width: number; height: number }>): Rect[] {
  return nodes.map((n) => {
    const { width, height } = getDims(n, measure)
    return { id: n.id, x: n.position?.x ?? 0, y: n.position?.y ?? 0, w: width, h: height }
  })
}

function aabbOverlap(a: Rect, b: Rect, padding: number): boolean {
  return (
    a.x < b.x + b.w + padding &&
    a.x + a.w + padding > b.x &&
    a.y < b.y + b.h + padding &&
    a.y + a.h + padding > b.y
  )
}

export function findOverlaps(rects: Rect[], padding: number = 12): OverlapPair[] {
  const overlaps: OverlapPair[] = []
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (aabbOverlap(rects[i], rects[j], padding)) {
        overlaps.push({ a: rects[i].id, b: rects[j].id })
      }
    }
  }
  return overlaps
}

export function resolveCollisions(
  nodes: RFNode[],
  opts?: { padding?: number; maxPasses?: number; measure?: Record<string, { width: number; height: number }>; fixedIds?: string[] }
): { nodes: RFNode[]; pendingMeasurement: boolean; movedCount: number; totalDelta: number } {
  const padding = opts?.padding ?? 12
  const maxPasses = Math.max(1, opts?.maxPasses ?? 10)
  const measure = opts?.measure
  const fixedSet = new Set<string>(opts?.fixedIds ?? [])

  // Work on a copy to avoid mutating callers unexpectedly
  const idToIndex = new Map(nodes.map((n, i) => [n.id, i]))
  const original: RFNode[] = nodes.map((n) => ({ ...n }))
  const out: RFNode[] = nodes.map((n) => ({ ...n, position: { ...(n.position ?? { x: 0, y: 0 }) } }))

  // Ensure we have measured width/height (graph units) for all nodes except fixed center
  const missingDims = out.some((n) => {
    if (n.id === 'center' || n.type === 'center') return false
    const w = (n as any).width
    const h = (n as any).height
    const hasMeasured = typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0
    if (hasMeasured) return false
    // Allow explicit measure override passed in opts
    const m = measure?.[n.id]
    if (m && typeof m.width === 'number' && typeof m.height === 'number') return false
    return true
  })
  if (missingDims) {
    return { nodes, pendingMeasurement: true, movedCount: 0, totalDelta: 0 }
  }

  // Helper to compute rect for a node id
  const rectFor = (id: string): Rect => {
    const idx = idToIndex.get(id)!
    const node = out[idx]
    const { width, height } = getDims(node, measure)
    return { id, x: node.position.x, y: node.position.y, w: width, h: height }
  }

  // Pre-pass: clear collisions with fixed center by pushing others directly away from it
  const fixedCenter = out.find((n) => n.id === 'center' || n.type === 'center')
  if (fixedCenter) {
    const centerRect = rectFor(fixedCenter.id)
    for (const n of out) {
      if (n.id === fixedCenter.id) continue
      // Do not move pinned nodes in the pre-pass either
      if (isFixedNode(n) || fixedSet.has(n.id)) continue
      const r = rectFor(n.id)
      if (!aabbOverlap(centerRect, r, padding)) continue

      const overlapX1 = centerRect.x + centerRect.w + padding - r.x
      const overlapX2 = r.x + r.w + padding - centerRect.x
      const pushX = Math.min(overlapX1, overlapX2)

      const overlapY1 = centerRect.y + centerRect.h + padding - r.y
      const overlapY2 = r.y + r.h + padding - centerRect.y
      const pushY = Math.min(overlapY1, overlapY2)

      const moveAlongX = pushX <= pushY
      const minimalPush = Math.max(1, Math.round(moveAlongX ? pushX : pushY))

      const idx = idToIndex.get(n.id)!
      if (moveAlongX) {
        // Push away from center along X
        if (r.x >= centerRect.x) out[idx].position.x += minimalPush
        else out[idx].position.x -= minimalPush
      } else {
        // Push away from center along Y
        if (r.y >= centerRect.y) out[idx].position.y += minimalPush
        else out[idx].position.y -= minimalPush
      }
    }
  }

  for (let pass = 0; pass < maxPasses; pass++) {
    const rects = rectsFromNodes(out, measure)
    const pairs = findOverlaps(rects, padding)
    if (pairs.length === 0) break

    // Ensure deterministic ordering of resolution
    pairs.sort((p1, p2) => (p1.a + '|' + p1.b).localeCompare(p2.a + '|' + p2.b))

    let movedThisPass = 0

    for (const pair of pairs) {
      const aRect = rectFor(pair.a)
      const bRect = rectFor(pair.b)

      // Re-check overlap as nodes may have moved this pass
      if (!aabbOverlap(aRect, bRect, padding)) continue

      // Compute minimal push distance along x or y
      const overlapX1 = aRect.x + aRect.w + padding - bRect.x
      const overlapX2 = bRect.x + bRect.w + padding - aRect.x
      const pushX = Math.min(overlapX1, overlapX2)

      const overlapY1 = aRect.y + aRect.h + padding - bRect.y
      const overlapY2 = bRect.y + bRect.h + padding - aRect.y
      const pushY = Math.min(overlapY1, overlapY2)

  const moveAlongX = pushX <= pushY
  const minimalPush = Math.max(1, Math.round(moveAlongX ? pushX : pushY))
  const halfPush = Math.max(1, Math.round(minimalPush / 2))

      const idxA = idToIndex.get(pair.a)!
      const idxB = idToIndex.get(pair.b)!
      const nodeA = out[idxA]
      const nodeB = out[idxB]

  const aIsFixed = isFixedNode(nodeA) || fixedSet.has(nodeA.id)
  const bIsFixed = isFixedNode(nodeB) || fixedSet.has(nodeB.id)

      if (moveAlongX) {
        // Decide push directions deterministically using id ordering
        const leftId = aRect.x <= bRect.x ? nodeA.id : nodeB.id
        const rightId = leftId === nodeA.id ? nodeB.id : nodeA.id

        // If one is fixed, push the other the full minimal distance to clear overlap in one step
        const pushAmountLeft = (aIsFixed && nodeA.id === leftId) || (bIsFixed && nodeB.id === leftId) ? minimalPush : halfPush
        const pushAmountRight = (aIsFixed && nodeA.id === rightId) || (bIsFixed && nodeB.id === rightId) ? minimalPush : halfPush

        if (!aIsFixed && nodeA.id === leftId) out[idxA].position.x -= pushAmountLeft
        if (!bIsFixed && nodeB.id === leftId) out[idxB].position.x -= pushAmountLeft
        if (!aIsFixed && nodeA.id === rightId) out[idxA].position.x += pushAmountRight
        if (!bIsFixed && nodeB.id === rightId) out[idxB].position.x += pushAmountRight
      } else {
        const topId = aRect.y <= bRect.y ? nodeA.id : nodeB.id
        const bottomId = topId === nodeA.id ? nodeB.id : nodeA.id

        const pushAmountTop = (aIsFixed && nodeA.id === topId) || (bIsFixed && nodeB.id === topId) ? minimalPush : halfPush
        const pushAmountBottom = (aIsFixed && nodeA.id === bottomId) || (bIsFixed && nodeB.id === bottomId) ? minimalPush : halfPush

        if (!aIsFixed && nodeA.id === topId) out[idxA].position.y -= pushAmountTop
        if (!bIsFixed && nodeB.id === topId) out[idxB].position.y -= pushAmountTop
        if (!aIsFixed && nodeA.id === bottomId) out[idxA].position.y += pushAmountBottom
        if (!bIsFixed && nodeB.id === bottomId) out[idxB].position.y += pushAmountBottom
      }

      movedThisPass++
    }

    if (movedThisPass === 0) break
  }

  // Last-chance greedy sweep if overlaps remain after allotted passes
  {
    const rects = rectsFromNodes(out, measure)
    const pairs = findOverlaps(rects, padding)
    if (pairs.length > 0) {
      // Deterministic order
      pairs.sort((p1, p2) => (p1.a + '|' + p1.b).localeCompare(p2.a + '|' + p2.b))
      for (const pair of pairs) {
        const idxA = idToIndex.get(pair.a)!
        const idxB = idToIndex.get(pair.b)!
        const nA = out[idxA]
        const nB = out[idxB]
  const aIsFixed = isFixedNode(nA) || fixedSet.has(nA.id)
  const bIsFixed = isFixedNode(nB) || fixedSet.has(nB.id)
        const aRect = rectFor(pair.a)
        const bRect = rectFor(pair.b)
        if (!aabbOverlap(aRect, bRect, padding)) continue
        const overlapX1 = aRect.x + aRect.w + padding - bRect.x
        const overlapX2 = bRect.x + bRect.w + padding - aRect.x
        const pushX = Math.min(overlapX1, overlapX2)
        const overlapY1 = aRect.y + aRect.h + padding - bRect.y
        const overlapY2 = bRect.y + bRect.h + padding - aRect.y
        const pushY = Math.min(overlapY1, overlapY2)
        const moveAlongX = pushX <= pushY
        const minimalPush = Math.max(1, Math.round(moveAlongX ? pushX : pushY))

        if (moveAlongX) {
          if (!aIsFixed && aRect.x <= bRect.x) out[idxA].position.x -= minimalPush
          if (!bIsFixed && bRect.x <= aRect.x) out[idxB].position.x -= minimalPush
          if (!aIsFixed && aRect.x > bRect.x) out[idxA].position.x += minimalPush
          if (!bIsFixed && bRect.x > aRect.x) out[idxB].position.x += minimalPush
        } else {
          if (!aIsFixed && aRect.y <= bRect.y) out[idxA].position.y -= minimalPush
          if (!bIsFixed && bRect.y <= aRect.y) out[idxB].position.y -= minimalPush
          if (!aIsFixed && aRect.y > bRect.y) out[idxA].position.y += minimalPush
          if (!bIsFixed && bRect.y > aRect.y) out[idxB].position.y += minimalPush
        }
      }
    }
  }

  // Final targeted sweep: if any node still overlaps the fixed center, push it directly away
  {
    const center = out.find((n) => n.id === 'center' || n.type === 'center')
    if (center) {
      const cRect = rectFor(center.id)
      for (const n of out) {
        if (n.id === center.id) continue
        // Do not move pinned nodes in the final sweep
  if (isFixedNode(n) || fixedSet.has(n.id)) continue
        const r = rectFor(n.id)
        if (!aabbOverlap(cRect, r, padding)) continue
        const overlapX1 = cRect.x + cRect.w + padding - r.x
        const overlapX2 = r.x + r.w + padding - cRect.x
        const pushX = Math.min(overlapX1, overlapX2)
        const overlapY1 = cRect.y + cRect.h + padding - r.y
        const overlapY2 = r.y + r.h + padding - cRect.y
        const pushY = Math.min(overlapY1, overlapY2)
        const moveAlongX = pushX <= pushY
        const minimalPush = Math.max(1, Math.round(moveAlongX ? pushX : pushY))
        const idx = idToIndex.get(n.id)!
        if (moveAlongX) {
          if (r.x >= cRect.x) out[idx].position.x += minimalPush
          else out[idx].position.x -= minimalPush
        } else {
          if (r.y >= cRect.y) out[idx].position.y += minimalPush
          else out[idx].position.y -= minimalPush
        }
      }
    }
  }

  // Metrics
  let movedCount = 0
  let totalDelta = 0
  for (let i = 0; i < out.length; i++) {
    const before = original[i]
    const after = out[i]
    if (!before?.position || !after?.position) continue
    const dx = Math.round(after.position.x - before.position.x)
    const dy = Math.round(after.position.y - before.position.y)
    if (dx !== 0 || dy !== 0) movedCount++
    totalDelta += Math.abs(dx) + Math.abs(dy)
  }

  // Optional: if still overlapping, log for diagnostics (test env captures console)
  try {
    const remaining = findOverlaps(rectsFromNodes(out, measure), padding)
    if (remaining.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`[collision] Remaining overlaps after relax: ${remaining.length} pairs ->`, remaining.slice(0, 8))
    }
  } catch {}

  // Snap final positions to integer pixels to reduce visual jitter
  const snapped = out.map((n) => ({
    ...n,
    position: { x: Math.round(n.position?.x ?? 0), y: Math.round(n.position?.y ?? 0) },
  }))
  return { nodes: snapped, pendingMeasurement: false, movedCount, totalDelta }
}

// Thin wrapper to match requested API name in domainLayout
export function relaxCollisions(nodes: RFNode[], opts?: { padding?: number; maxPasses?: number; measure?: Record<string, { width: number; height: number }> }): { nodes: RFNode[]; pendingMeasurement: boolean; movedCount: number; totalDelta: number } {
  return resolveCollisions(nodes, opts)
}

// DEV overlay: outline nodes that currently overlap in the DOM
export function devOutlineCollisions(padding: number = 12): void {
  try {
    const root = document?.querySelector?.('.react-flow') as HTMLElement | null
    if (!root) return

    // Clear previous outlines
    root.querySelectorAll('.react-flow__node').forEach((el) => {
      ;(el as HTMLElement).style.outline = 'none'
      ;(el as HTMLElement).style.boxShadow = 'none'
    })

    const entries = Array.from(root.querySelectorAll('.react-flow__node')) as HTMLElement[]
    const rects: { id: string; el: HTMLElement; rect: DOMRect }[] = entries.map((el) => ({
      id: el.getAttribute('data-id') || '',
      el,
      rect: el.getBoundingClientRect(),
    }))

    const offenders = new Set<string>()
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].rect
        const b = rects[j].rect
        const overlaps = a.left < b.right + padding && a.right + padding > b.left && a.top < b.bottom + padding && a.bottom + padding > b.top
        if (overlaps) {
          rects[i].el.style.outline = '2px solid #ef4444'
          rects[j].el.style.outline = '2px solid #ef4444'
          rects[i].el.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.35) inset'
          rects[j].el.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.35) inset'
          offenders.add(rects[i].id)
          offenders.add(rects[j].id)
        }
      }
    }

    if (offenders.size > 0) {
      // eslint-disable-next-line no-console
      console.warn(`[layout] Overlaps detected: ${Array.from(offenders).join(', ')}`)
    }
  } catch (e) {
    // Ignore in environments without DOM
  }
}
