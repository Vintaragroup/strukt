// @ts-nocheck
import type { Node } from '@xyflow/react'

export type NodeDim = { width: number; height: number }

// Align defaults with layout utilities
const DEFAULT_NODE_WIDTH = 280
const DEFAULT_NODE_HEIGHT = 200

function parseDimension(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function captureNodeDimensions(nodes: Node[]): Record<string, NodeDim> {
  if (!Array.isArray(nodes)) return {}
  const out: Record<string, NodeDim> = {}
  for (const n of nodes) {
    if (!n || !n.id) continue
    const width =
      parseDimension((n as any).width) ??
      parseDimension((n as any).style?.width)
    const height =
      parseDimension((n as any).height) ??
      parseDimension((n as any).style?.height)
    // Never return null/zero; enforce sane fallbacks and clamp to >= 1
    out[n.id] = {
      width: Math.max(1, Math.round(width ?? DEFAULT_NODE_WIDTH)),
      height: Math.max(1, Math.round(height ?? DEFAULT_NODE_HEIGHT)),
    }
  }
  return out
}
