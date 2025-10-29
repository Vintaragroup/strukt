import { describe, it, expect } from 'vitest'
import seed from '@/fixtures/collision_seed.json'
import type { Node } from '@xyflow/react'
import { applyDomainRadialLayout } from '@/utils/domainLayout'
import { resolveCollisions, rectsFromNodes, findOverlaps } from '@/utils/collision'

function toNodes(raw: any): Node[] {
  return (raw.nodes as any[]).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    style: n.style,
    data: n.data,
  }))
}

describe('Deterministic radial layout + collision resolver', () => {
  it('produces zero overlaps on the seed with 12px padding', () => {
    const nodes = toNodes(seed)

    const layouted = applyDomainRadialLayout(nodes, {
      centerNodeId: 'center',
      viewMode: 'radial',
      viewportDimensions: { width: 1600, height: 1000 },
    })

    // Provide measurement map synthesized from style to avoid pendingMeasurement in test
    const measure: Record<string, { width: number; height: number }> = {}
    for (const n of nodes) {
      const w = (n as any).style?.width
      const h = (n as any).style?.height
      if (typeof w === 'number' && typeof h === 'number') measure[n.id] = { width: w, height: h }
    }

    const relaxedInfo = resolveCollisions(layouted, { padding: 12, maxPasses: 10, measure })
    expect(relaxedInfo.pendingMeasurement).toBe(false)

    const rects = rectsFromNodes(relaxedInfo.nodes, measure)
    const overlaps = findOverlaps(rects, 12)

    expect(overlaps.length).toBe(0)
  })
})
