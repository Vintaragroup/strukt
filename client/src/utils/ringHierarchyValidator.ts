/**
 * Ring Hierarchy Validator
 * 
 * Validates that all nodes adhere to ring hierarchy constraints:
 * - Center node is R0
 * - Direct children of center are R1
 * - All other nodes follow ring = parent.ring + 1
 * - No orphan nodes (except center and R1)
 * - No ring reversions (e.g., R3 → R1)
 * - Classification nodes are always R1
 */

import { WorkspaceNode, WorkspaceEdge } from '../types/index'

export interface RingViolation {
  nodeId: string
  nodeTitle: string
  ring: number
  expectedRing: number
  parentId?: string
  parentTitle?: string
  issue: string
  severity: 'error' | 'warning'
}

export interface RingValidationResult {
  isValid: boolean
  violations: RingViolation[]
  summary: string
  stats: {
    totalNodes: number
    validNodes: number
    invalidNodes: number
    byRing: Record<number, number>
  }
}

/**
 * Validate entire ring hierarchy
 */
export function validateRingHierarchy(
  nodes: WorkspaceNode[],
  edges: WorkspaceEdge[]
): RingValidationResult {
  const violations: RingViolation[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const edgeMap = new Map<string, string[]>() // node -> children

  // Build parent-child relationships from edges
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, [])
    }
    edgeMap.get(edge.source)!.push(edge.target)
  })

  // Rule 1: Center node must be R0
  const centerNode = nodes.find(n => n.id === 'center' || n.data?.type === 'root')
  if (centerNode) {
    if (centerNode.data?.ring !== 0) {
      violations.push({
        nodeId: centerNode.id,
        nodeTitle: centerNode.data?.title || 'Center',
        ring: centerNode.data?.ring || 0,
        expectedRing: 0,
        issue: 'Center node must be ring 0 (R0)',
        severity: 'error',
      })
    }
  }

  // Rule 2: Check each node's ring relative to its parents
  nodes.forEach(node => {
    const ring = node.data?.ring
    if (ring === undefined || ring === null) {
      violations.push({
        nodeId: node.id,
        nodeTitle: node.data?.title || node.id,
        ring: -1,
        expectedRing: 1, // Default should be at least R1
        issue: 'Node has no ring assigned',
        severity: 'error',
      })
      return
    }

    // Find all parents of this node
    const parents = edges
      .filter(e => e.target === node.id)
      .map(e => nodeMap.get(e.source))
      .filter((n): n is WorkspaceNode => n !== undefined)

    if (parents.length === 0) {
      // No parents - only center should have no parents
      if (node.id !== 'center' && node.data?.type !== 'root') {
        // Check if this is a classification node (R1)
        if (!isClassificationNode(node)) {
          violations.push({
            nodeId: node.id,
            nodeTitle: node.data?.title || node.id,
            ring,
            expectedRing: 1,
            issue: 'Node has no parent (orphaned). Should connect to center or classification.',
            severity: 'warning',
          })
        }
      }
    } else {
      // Has parents - check ring is parent.ring + 1
      parents.forEach(parent => {
        const parentRing = parent.data?.ring ?? 0
        const expectedRing = parentRing + 1

        if (ring !== expectedRing) {
          violations.push({
            nodeId: node.id,
            nodeTitle: node.data?.title || node.id,
            ring,
            expectedRing,
            parentId: parent.id,
            parentTitle: parent.data?.title,
            issue: `Ring should be parent ring (${parentRing}) + 1 = ${expectedRing}, but is ${ring}`,
            severity: 'error',
          })
        }
      })
    }

    // Rule 3: Classification nodes must be R1
    if (isClassificationNode(node)) {
      if (ring !== 1) {
        violations.push({
          nodeId: node.id,
          nodeTitle: node.data?.title || node.id,
          ring,
          expectedRing: 1,
          issue: 'Classification node must be ring 1 (R1)',
          severity: 'error',
        })
      }
    }

    // Rule 4: Domain parent nodes should be R2
    if (isDomainParentNode(node)) {
      if (ring !== 2) {
        violations.push({
          nodeId: node.id,
          nodeTitle: node.data?.title || node.id,
          ring,
          expectedRing: 2,
          issue: 'Domain parent node should be ring 2 (R2)',
          severity: 'warning',
        })
      }
    }

    // Rule 5: Check for ring reversion (edge going to lower ring)
    const children = edgeMap.get(node.id) || []
    children.forEach(childId => {
      const child = nodeMap.get(childId)
      if (child) {
        const childRing = child.data?.ring ?? 0
        if (childRing <= ring) {
          violations.push({
            nodeId: node.id,
            nodeTitle: node.data?.title || node.id,
            ring,
            expectedRing: ring,
            issue: `Ring reversion detected: has edge to ${child.data?.title} (R${childRing}) but this node is R${ring}`,
            severity: 'error',
          })
        }
      }
    })
  })

  // Generate statistics
  const stats = {
    totalNodes: nodes.length,
    validNodes: nodes.length - new Set(violations.map(v => v.nodeId)).size,
    invalidNodes: new Set(violations.map(v => v.nodeId)).size,
    byRing: {} as Record<number, number>,
  }

  nodes.forEach(n => {
    const ring = n.data?.ring ?? -1
    stats.byRing[ring] = (stats.byRing[ring] || 0) + 1
  })

  const isValid = violations.every(v => v.severity !== 'error')

  return {
    isValid,
    violations,
    summary: generateSummary(violations, nodes.length),
    stats,
  }
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: RingValidationResult): string {
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('  RING HIERARCHY VALIDATION REPORT')
  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('')

  // Summary
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`)
  lines.push(`Total Nodes: ${result.stats.totalNodes}`)
  lines.push(`Valid Nodes: ${result.stats.validNodes}`)
  lines.push(`Invalid Nodes: ${result.stats.invalidNodes}`)
  lines.push('')

  // Stats by ring
  lines.push('Nodes by Ring:')
  Object.entries(result.stats.byRing)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([ring, count]) => {
      lines.push(`  R${ring}: ${count} nodes`)
    })
  lines.push('')

  // Violations
  if (result.violations.length === 0) {
    lines.push('✅ No violations found!')
  } else {
    lines.push(`⚠️  ${result.violations.length} violations:`)
    lines.push('')

    // Group by severity
    const errors = result.violations.filter(v => v.severity === 'error')
    const warnings = result.violations.filter(v => v.severity === 'warning')

    if (errors.length > 0) {
      lines.push('🔴 ERRORS:')
      errors.forEach(v => {
        lines.push(`  • ${v.nodeTitle} (${v.nodeId})`)
        lines.push(`    - ${v.issue}`)
        lines.push(`    - Current: R${v.ring}, Expected: R${v.expectedRing}`)
        if (v.parentTitle) {
          lines.push(`    - Parent: ${v.parentTitle}`)
        }
        lines.push('')
      })
    }

    if (warnings.length > 0) {
      lines.push('🟡 WARNINGS:')
      warnings.forEach(v => {
        lines.push(`  • ${v.nodeTitle} (${v.nodeId})`)
        lines.push(`    - ${v.issue}`)
        lines.push(`    - Current: R${v.ring}, Expected: R${v.expectedRing}`)
        lines.push('')
      })
    }
  }

  lines.push('═══════════════════════════════════════════════════════════')
  lines.push(result.summary)
  lines.push('═══════════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Check if node is a classification node (R1 parent)
 */
function isClassificationNode(node: WorkspaceNode): boolean {
  const id = node.id || ''
  const type = node.data?.type || ''
  
  return (
    id.startsWith('classification-') ||
    type === 'classification' ||
    type === 'domain-parent' ||
    (node.data?.title || '').includes('Classification')
  )
}

/**
 * Check if node is a domain parent node (R2)
 */
function isDomainParentNode(node: WorkspaceNode): boolean {
  const type = node.data?.type || ''
  const title = node.data?.title || ''

  return (
    type === 'domain-parent' ||
    type === 'r2-parent' ||
    title.includes('& Platform') ||
    title.includes('& UI') ||
    title.includes('& APIs') ||
    title.includes('& AI')
  )
}

/**
 * Generate summary text
 */
function generateSummary(violations: RingViolation[], totalNodes: number): string {
  const errors = violations.filter(v => v.severity === 'error').length
  const warnings = violations.filter(v => v.severity === 'warning').length
  const validCount = totalNodes - new Set(violations.map(v => v.nodeId)).size

  if (violations.length === 0) {
    return `✅ Perfect! All ${totalNodes} nodes follow ring hierarchy rules.`
  }

  let summary = ''
  if (errors > 0) {
    summary += `❌ ${errors} ERROR${errors !== 1 ? 'S' : ''} - Ring hierarchy violated!\n`
  }
  if (warnings > 0) {
    summary += `⚠️  ${warnings} warning${warnings !== 1 ? 's' : ''} - Check node structure\n`
  }
  summary += `${validCount} of ${totalNodes} nodes are valid.`

  return summary
}

/**
 * Get violations for a specific node
 */
export function getNodeViolations(
  nodeId: string,
  result: RingValidationResult
): RingViolation[] {
  return result.violations.filter(v => v.nodeId === nodeId)
}

/**
 * Get violations by severity
 */
export function getViolationsBySeverity(
  severity: 'error' | 'warning',
  result: RingValidationResult
): RingViolation[] {
  return result.violations.filter(v => v.severity === severity)
}

/**
 * Get all nodes with errors
 */
export function getNodesWithErrors(result: RingValidationResult): Set<string> {
  return new Set(
    result.violations
      .filter(v => v.severity === 'error')
      .map(v => v.nodeId)
  )
}
