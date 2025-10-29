// @ts-nocheck
// Optional d3-force post-layout relaxation, disabled by default via VITE_FEATURE_D3_RELAX
import type { Node as RFNode, Edge as RFEdge } from '@xyflow/react'

export async function relaxLayoutWithD3(nodes: RFNode[], _edges: RFEdge[], opts?: { maxTicks?: number }): Promise<RFNode[]> {
  const maxTicks = Math.max(1, opts?.maxTicks ?? 100)

  // Dynamic import to keep it optional
  const d3 = await import('d3-force')
  const simNodes = nodes.map((n) => ({
    id: n.id,
    x: n.position?.x ?? 0,
    y: n.position?.y ?? 0,
    vx: 0,
    vy: 0,
    width: (n as any).width ?? (n as any).style?.width ?? 280,
    height: (n as any).height ?? (n as any).style?.height ?? 200,
    fixed: n.id === 'center' || n.type === 'center',
  }))

  const simulation = d3.forceSimulation(simNodes as any)
    .force('charge', d3.forceManyBody().strength(-200))
    .force('collide', d3.forceCollide().radius((d: any) => Math.max(40, (Number(d.width) || 280) / 2 + 24)).iterations(2))
    // no link/center forces by default to preserve radial sectors
    .stop()

  for (let i = 0; i < maxTicks; i++) simulation.tick()

  // Write back positions deterministically (round to int to avoid subpixel jitter)
  const idToPos = new Map(simNodes.map((d) => [d.id, { x: Math.round(d.x || 0), y: Math.round(d.y || 0) }]))
  return nodes.map((n) => {
    if (n.id === 'center' || n.type === 'center') return n
    const pos = idToPos.get(n.id)
    if (!pos) return n
    return { ...n, position: { x: pos.x, y: pos.y } }
  })
}
