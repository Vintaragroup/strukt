/**
 * Radial Layout Engine
 *
 * Positions nodes in concentric circles based on ring level:
 * - R0: Center (0, 0)
 * - R1: Circle at radius 200px
 * - R2: Circle at radius 400px
 * - R3+: Circle at radius 600px+
 *
 * Uses angle distribution to spread nodes evenly around each ring
 */

import type { Node, XYPosition } from '@xyflow/react'

export interface RadialLayoutConfig {
  centerX: number
  centerY: number
  baseRadius: number
  radiusIncrement: number
  minAngleDiff: number
}

export interface NodeData {
  label?: string
  ring?: number
  domain?: string
  parentId?: string
  [key: string]: unknown
}

export const DEFAULT_RADIAL_CONFIG: RadialLayoutConfig = {
  centerX: 400,
  centerY: 300,
  baseRadius: 180, // R1 starts at 180px
  radiusIncrement: 180, // Each ring is 180px further out
  minAngleDiff: 15, // Minimum degrees between nodes on same ring
}

/**
 * Calculate position for a node on a ring
 */
export function getRadialPosition(
  ring: number,
  nodeIndexOnRing: number,
  totalNodesOnRing: number,
  config: RadialLayoutConfig
): XYPosition {
  // Special case: R0 is at center
  if (ring === 0) {
    return {
      x: config.centerX,
      y: config.centerY,
    }
  }

  // Calculate radius for this ring
  const radius = config.baseRadius + (ring - 1) * config.radiusIncrement

  // Calculate angle for this node (spread evenly around circle)
  const totalAngle = 360
  const anglePerNode = totalAngle / totalNodesOnRing
  const angle = (nodeIndexOnRing * anglePerNode) * (Math.PI / 180) // Convert to radians

  // Calculate x, y using polar coordinates
  const x = config.centerX + radius * Math.cos(angle)
  const y = config.centerY + radius * Math.sin(angle)

  return { x, y }
}

/**
 * Generate radial layout for all nodes
 * Groups nodes by ring, then positions each
 */
export function generateRadialLayout(
  nodes: Node[],
  config: RadialLayoutConfig = DEFAULT_RADIAL_CONFIG
): Node[] {
  // Group nodes by ring
  const nodesByRing: Map<number, Node[]> = new Map()

  nodes.forEach((node) => {
    const ring = (node.data as NodeData).ring ?? 3
    if (!nodesByRing.has(ring)) {
      nodesByRing.set(ring, [])
    }
    nodesByRing.get(ring)!.push(node)
  })

  // Position each node
  const positionedNodes: Node[] = []

  // Sort rings to process them in order
  const sortedRings = Array.from(nodesByRing.keys()).sort((a, b) => a - b)

  sortedRings.forEach((ring) => {
    const nodesOnRing = nodesByRing.get(ring)!
    const totalNodesOnRing = nodesOnRing.length

    nodesOnRing.forEach((node, index) => {
      const position = getRadialPosition(ring, index, totalNodesOnRing, config)

      positionedNodes.push({
        ...node,
        position,
        data: {
          ...node.data,
          ring, // Ensure ring is set
        },
      })
    })
  })

  return positionedNodes
}

/**
 * Generate visual hierarchy info for layout
 */
export function generateLayoutStats(nodes: Node[]) {
  const nodesByRing: Record<number, number> = {}
  const nodesByDomain: Record<string, number> = {}

  nodes.forEach((node) => {
    const ring = (node.data as NodeData).ring ?? 3
    const domain = (node.data as NodeData).domain ?? 'unknown'

    nodesByRing[ring] = (nodesByRing[ring] ?? 0) + 1
    nodesByDomain[domain] = (nodesByDomain[domain] ?? 0) + 1
  })

  return {
    totalNodes: nodes.length,
    nodesByRing: Object.fromEntries(Object.entries(nodesByRing).sort()),
    nodesByDomain,
  }
}

/**
 * Generate ASCII visualization of layout
 */
export function visualizeRadialLayout(nodes: Node[]): string {
  const lines: string[] = []
  const stats = generateLayoutStats(nodes)

  lines.push('╔══════════════════════════════════════════════════════════╗')
  lines.push('║         RADIAL LAYOUT VISUALIZATION                     ║')
  lines.push('╚══════════════════════════════════════════════════════════╝\n')

  lines.push(`Total Nodes: ${stats.totalNodes}\n`)

  lines.push('Ring Distribution:')
  Object.entries(stats.nodesByRing).forEach(([ring, count]) => {
    const barLength = Math.ceil(count / 10)
    const bar = '█'.repeat(barLength)
    lines.push(`  R${ring} (${count.toString().padStart(3)} nodes): ${bar}`)
  })

  lines.push('\nDomain Distribution:')
  Object.entries(stats.nodesByDomain).forEach(([domain, count]) => {
    const barLength = Math.ceil(count / 10)
    const bar = '█'.repeat(barLength)
    lines.push(`  ${domain.padEnd(12)} (${count.toString().padStart(3)} nodes): ${bar}`)
  })

  lines.push('\nHierarchy Structure:')
  lines.push('          R0: Center (1 node)')
  lines.push('           │')
  lines.push('          R1: Classifications')
  lines.push('           │')
  lines.push('          R2: Intermediates')
  lines.push('           │')
  lines.push('          R3: Features')

  lines.push('\nRadial Spacing:')
  lines.push('  ┌─────────────────────────────────────┐')
  lines.push('  │           CENTER (R0)               │')
  lines.push('  │          Radius: 0px                │')
  lines.push('  │     ┌─────────────────────┐         │')
  lines.push('  │     │  R1 CIRCLE          │         │')
  lines.push('  │     │  Radius: 180px      │         │')
  lines.push('  │     │  ┌────────────────┐ │         │')
  lines.push('  │     │  │ R2 CIRCLE      │ │         │')
  lines.push('  │     │  │ Radius: 360px  │ │         │')
  lines.push('  │     │  │  ┌──────────┐  │ │         │')
  lines.push('  │     │  │  │ R3 CIRCLE│  │ │         │')
  lines.push('  │     │  │  │ 600px    │  │ │         │')
  lines.push('  │     │  │  └──────────┘  │ │         │')
  lines.push('  │     │  └────────────────┘ │         │')
  lines.push('  │     └─────────────────────┘         │')
  lines.push('  └─────────────────────────────────────┘')

  return lines.join('\n')
}
