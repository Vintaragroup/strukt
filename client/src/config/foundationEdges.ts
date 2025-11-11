/**
 * Foundation Edges - Intelligent Node Association System
 *
 * This system:
 * 1. Defines parent-child association rules based on node type
 * 2. Evaluates current graph state to find optimal connections
 * 3. Auto-generates edges based on hierarchy rules
 * 4. Suggests missing intermediate (R2) nodes when needed
 * 5. Handles fallback strategies for edge cases
 *
 * Rules:
 * - R0 (center) → R1 (classifications)
 * - R1 (classifications) → R2 (domain parents) - MUST CREATE IF MISSING
 * - R2 (domain parents) → R3+ (feature nodes)
 * - No direct R1 → R3 connections (must go through R2)
 */

import { Node, Edge } from '@xyflow/react'

export interface NodeAssociationRule {
  nodeTypes: string[]
  idealParent: {
    type: string
    label: string
    domain: string
    ring: number
  }
  fallbackParents?: Array<{
    type: string
    label: string
    domain: string
    ring: number
  }>
  createIntermediateIfMissing?: boolean
}

export interface SuggestedIntermediateNode {
  id: string
  label: string
  type: string
  domain: string
  ring: number
  reason: string
}

export interface EdgeEvaluationResult {
  currentEdges: Edge[]
  optimalEdges: Edge[]
  suggestedIntermediateNodes: SuggestedIntermediateNode[]
  issues: Array<{
    nodeId: string
    nodeLabel: string
    issue: string
    suggestion: string
  }>
}

/**
 * Association rules by node type
 * Defines ideal parent hierarchy and fallback strategies
 */
const ASSOCIATION_RULES: Record<string, NodeAssociationRule> = {
  // BACKEND NODES
  'backend-api-server': {
    nodeTypes: ['backend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Backend & APIs',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'backend-server': {
    nodeTypes: ['backend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Backend & APIs',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'backend-domain-services': {
    nodeTypes: ['backend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Backend & APIs',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'backend-authentication': {
    nodeTypes: ['backend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Backend & APIs',
      domain: 'tech',
      ring: 2,
    },
    fallbackParents: [
      {
        type: 'domain-parent',
        label: 'Security & Compliance',
        domain: 'tech',
        ring: 2,
      },
    ],
    createIntermediateIfMissing: true,
  },
  'backend-identity-provider': {
    nodeTypes: ['backend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Security & Compliance',
      domain: 'tech',
      ring: 2,
    },
    fallbackParents: [
      {
        type: 'domain-parent',
        label: 'Backend & APIs',
        domain: 'tech',
        ring: 2,
      },
    ],
    createIntermediateIfMissing: true,
  },

  // FRONTEND NODES
  'frontend-app-shell': {
    nodeTypes: ['frontend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Frontend & UI',
      domain: 'product',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'frontend-mobile-app': {
    nodeTypes: ['frontend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Frontend & UI',
      domain: 'product',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'frontend-state-management': {
    nodeTypes: ['frontend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Frontend & UI',
      domain: 'product',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },

  // DATA NODES
  'data-warehouse': {
    nodeTypes: ['backend', 'data'],
    idealParent: {
      type: 'domain-parent',
      label: 'Data & AI',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'data-pipeline': {
    nodeTypes: ['backend', 'data'],
    idealParent: {
      type: 'domain-parent',
      label: 'Data & AI',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },

  // INFRASTRUCTURE NODES
  'infrastructure-kubernetes': {
    nodeTypes: ['infrastructure'],
    idealParent: {
      type: 'domain-parent',
      label: 'Infrastructure & Platform',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },
  'infrastructure-database': {
    nodeTypes: ['infrastructure'],
    idealParent: {
      type: 'domain-parent',
      label: 'Infrastructure & Platform',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },

  // OBSERVABILITY NODES
  'observability-monitoring': {
    nodeTypes: ['infrastructure'],
    idealParent: {
      type: 'domain-parent',
      label: 'Observability & Monitoring',
      domain: 'tech',
      ring: 2,
    },
    fallbackParents: [
      {
        type: 'domain-parent',
        label: 'Infrastructure & Platform',
        domain: 'tech',
        ring: 2,
      },
    ],
    createIntermediateIfMissing: true,
  },

  // SECURITY NODES
  'security-compliance': {
    nodeTypes: ['backend'],
    idealParent: {
      type: 'domain-parent',
      label: 'Security & Compliance',
      domain: 'tech',
      ring: 2,
    },
    createIntermediateIfMissing: true,
  },

  // CATCH-ALL RULES FOR REMAINING FOUNDATION NODES
  // These match by nodeType and provide intelligent parent selection
}

/**
 * Get association rule by node type when ID-based lookup fails
 * Returns a rule with sensible defaults for foundation template categories
 */
function getDefaultRuleByNodeType(
  nodeType: string | undefined,
  nodeId: string
): NodeAssociationRule | null {
  // Map foundation node types to their ideal parents
  switch (nodeType) {
    case 'frontend':
      return {
        nodeTypes: ['frontend'],
        idealParent: {
          type: 'domain-parent',
          label: 'Frontend & UI',
          domain: 'product',
          ring: 2,
        },
        createIntermediateIfMissing: true,
      }

    case 'backend':
      // Distinguish between backend types by name
      if (nodeId.includes('auth') || nodeId.includes('identity') || nodeId.includes('security')) {
        return {
          nodeTypes: ['backend'],
          idealParent: {
            type: 'domain-parent',
            label: 'Security & Compliance',
            domain: 'tech',
            ring: 2,
          },
          fallbackParents: [
            {
              type: 'domain-parent',
              label: 'Backend & APIs',
              domain: 'tech',
              ring: 2,
            },
          ],
          createIntermediateIfMissing: true,
        }
      }
      return {
        nodeTypes: ['backend'],
        idealParent: {
          type: 'domain-parent',
          label: 'Backend & APIs',
          domain: 'tech',
          ring: 2,
        },
        createIntermediateIfMissing: true,
      }

    case 'data':
      return {
        nodeTypes: ['data'],
        idealParent: {
          type: 'domain-parent',
          label: 'Data & AI',
          domain: 'tech',
          ring: 2,
        },
        createIntermediateIfMissing: true,
      }

    // REQUIREMENT TYPE - needs parent based on category prefix
    case 'requirement': {
      // Infer category from node ID prefix
      if (nodeId.startsWith('frontend-') || nodeId.includes('frontend')) {
        return {
          nodeTypes: ['requirement'],
          idealParent: {
            type: 'domain-parent',
            label: 'Frontend & UI',
            domain: 'product',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (
        nodeId.startsWith('backend-') ||
        nodeId.includes('backend') ||
        nodeId.startsWith('data-') ||
        nodeId.includes('queue') ||
        nodeId.includes('cache') ||
        nodeId.includes('store') ||
        nodeId.includes('bus') ||
        nodeId.includes('webhook') ||
        nodeId.includes('payment') ||
        nodeId.includes('job') ||
        nodeId.includes('gateway') ||
        nodeId.includes('mesh')
      ) {
        return {
          nodeTypes: ['requirement'],
          idealParent: {
            type: 'domain-parent',
            label: 'Backend & APIs',
            domain: 'tech',
            ring: 2,
          },
          fallbackParents: [
            {
              type: 'domain-parent',
              label: 'Data & AI',
              domain: 'tech',
              ring: 2,
            },
          ],
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.startsWith('data-') || nodeId.includes('data') || nodeId.includes('warehouse')) {
        return {
          nodeTypes: ['requirement'],
          idealParent: {
            type: 'domain-parent',
            label: 'Data & AI',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (
        nodeId.startsWith('infra-') ||
        nodeId.includes('infra') ||
        nodeId.includes('container') ||
        nodeId.includes('kubernetes') ||
        nodeId.includes('cicd') ||
        nodeId.includes('deployment')
      ) {
        return {
          nodeTypes: ['requirement'],
          idealParent: {
            type: 'domain-parent',
            label: 'Infrastructure & Platform',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (
        nodeId.startsWith('obs-') ||
        nodeId.includes('observability') ||
        nodeId.includes('logging') ||
        nodeId.includes('metric') ||
        nodeId.includes('tracing') ||
        nodeId.includes('monitoring') ||
        nodeId.includes('alert') ||
        nodeId.includes('dashboard')
      ) {
        return {
          nodeTypes: ['requirement'],
          idealParent: {
            type: 'domain-parent',
            label: 'Observability & Monitoring',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (
        nodeId.startsWith('sec-') ||
        nodeId.includes('security') ||
        nodeId.includes('audit') ||
        nodeId.includes('compliance') ||
        nodeId.includes('privacy') ||
        nodeId.includes('encryption') ||
        nodeId.includes('zerotrust') ||
        nodeId.includes('threat')
      ) {
        return {
          nodeTypes: ['requirement'],
          idealParent: {
            type: 'domain-parent',
            label: 'Security & Compliance',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      // Default for unknown requirements
      return {
        nodeTypes: ['requirement'],
        idealParent: {
          type: 'domain-parent',
          label: 'Backend & APIs',
          domain: 'tech',
          ring: 2,
        },
        createIntermediateIfMissing: true,
      }
    }

    // DOC TYPE - documentation nodes
    case 'doc':
      // Docs get assigned to relevant parent based on name
      if (nodeId.includes('governance') || nodeId.includes('data')) {
        return {
          nodeTypes: ['doc'],
          idealParent: {
            type: 'domain-parent',
            label: 'Data & AI',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('infra') || nodeId.includes('iac')) {
        return {
          nodeTypes: ['doc'],
          idealParent: {
            type: 'domain-parent',
            label: 'Infrastructure & Platform',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('privacy') || nodeId.includes('security') || nodeId.includes('compliance')) {
        return {
          nodeTypes: ['doc'],
          idealParent: {
            type: 'domain-parent',
            label: 'Security & Compliance',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      // Default for documentation
      return {
        nodeTypes: ['doc'],
        idealParent: {
          type: 'domain-parent',
          label: 'Backend & APIs',
          domain: 'tech',
          ring: 2,
        },
        createIntermediateIfMissing: true,
      }

    // FEATURE TYPE - generic feature/implementation nodes
    case 'feature': {
      // Route based on domain if provided in node ID or content
      if (nodeId.includes('frontend') || nodeId.includes('ui') || nodeId.includes('web') || nodeId.includes('auth-ui') || nodeId.includes('dashboard') || nodeId.includes('form')) {
        return {
          nodeTypes: ['feature'],
          idealParent: {
            type: 'domain-parent',
            label: 'Frontend & UI',
            domain: 'product',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('backend') || nodeId.includes('api') || nodeId.includes('service') || nodeId.includes('handler') || nodeId.includes('gateway') || nodeId.includes('middleware')) {
        return {
          nodeTypes: ['feature'],
          idealParent: {
            type: 'domain-parent',
            label: 'Backend & APIs',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('data') || nodeId.includes('ml') || nodeId.includes('analytics') || nodeId.includes('pipeline') || nodeId.includes('warehouse') || nodeId.includes('etl')) {
        return {
          nodeTypes: ['feature'],
          idealParent: {
            type: 'domain-parent',
            label: 'Data & AI',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('infra') || nodeId.includes('kubernetes') || nodeId.includes('docker') || nodeId.includes('cluster') || nodeId.includes('load-balancer') || nodeId.includes('storage') || nodeId.includes('database')) {
        return {
          nodeTypes: ['feature'],
          idealParent: {
            type: 'domain-parent',
            label: 'Infrastructure & Platform',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('monitoring') || nodeId.includes('logging') || nodeId.includes('tracing') || nodeId.includes('prometheus') || nodeId.includes('grafana') || nodeId.includes('alert') || nodeId.includes('metric')) {
        return {
          nodeTypes: ['feature'],
          idealParent: {
            type: 'domain-parent',
            label: 'Observability & Monitoring',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      if (nodeId.includes('security') || nodeId.includes('encryption') || nodeId.includes('auth') || nodeId.includes('compliance') || nodeId.includes('access') || nodeId.includes('certificate')) {
        return {
          nodeTypes: ['feature'],
          idealParent: {
            type: 'domain-parent',
            label: 'Security & Compliance',
            domain: 'tech',
            ring: 2,
          },
          createIntermediateIfMissing: true,
        }
      }
      // Default feature to tech domain
      return {
        nodeTypes: ['feature'],
        idealParent: {
          type: 'domain-parent',
          label: 'Backend & APIs',
          domain: 'tech',
          ring: 2,
        },
        createIntermediateIfMissing: true,
      }
    }

    default:
      return null
  }
}

/**
 * Find ideal parent for a node
 * Returns the best parent ID from current graph, or suggests one to create
 */
export function findOptimalParent(
  nodeId: string,
  nodes: Node[],
  _edges: Edge[],
  nodeType?: string
): {
  parentId: string | null
  parentNode?: Node
  needsNewIntermediate: boolean
  suggestedIntermediate?: SuggestedIntermediateNode
} {
  let rule = ASSOCIATION_RULES[nodeId]

  // If no ID-based rule, try node type-based fallback
  if (!rule) {
    rule = getDefaultRuleByNodeType(nodeType, nodeId)
  }

  if (!rule) {
    return { parentId: null, needsNewIntermediate: false }
  }

  // Try to find ideal parent
  const idealParent = nodes.find(
    n =>
      (n.data as any)?.type === rule.idealParent.type &&
      (n.data as any)?.label === rule.idealParent.label
  )

  if (idealParent) {
    return {
      parentId: idealParent.id,
      parentNode: idealParent,
      needsNewIntermediate: false,
    }
  }

  // Try fallback parents
  if (rule.fallbackParents) {
    for (const fallback of rule.fallbackParents) {
      const fallbackParent = nodes.find(
        n =>
          (n.data as any)?.type === fallback.type &&
          (n.data as any)?.label === fallback.label
      )
      if (fallbackParent) {
        return {
          parentId: fallbackParent.id,
          parentNode: fallbackParent,
          needsNewIntermediate: false,
        }
      }
    }
  }

  // If no parent found and we should create intermediate
  if (rule.createIntermediateIfMissing) {
    return {
      parentId: null,
      needsNewIntermediate: true,
      suggestedIntermediate: {
        id: `${rule.idealParent.type}-${Date.now()}`,
        label: rule.idealParent.label,
        type: rule.idealParent.type,
        domain: rule.idealParent.domain,
        ring: rule.idealParent.ring,
        reason: `Intermediate parent needed for ${nodeId}`,
      },
    }
  }

  return { parentId: null, needsNewIntermediate: false }
}

/**
 * Evaluate entire graph and find missing connections
 */
export function evaluateEdges(
  nodes: Node[],
  edges: Edge[]
): EdgeEvaluationResult {
  const optimalEdges: Edge[] = []
  const suggestedIntermediateNodes: EdgeEvaluationResult['suggestedIntermediateNodes'] = []
  const issues: EdgeEvaluationResult['issues'] = []

  // Find all R3+ nodes without parents
  const r3PlusNodes = nodes.filter(
    n => typeof n.data?.ring === 'number' && n.data.ring >= 3
  )

  for (const node of r3PlusNodes) {
    const hasParentEdge = edges.some(e => e.target === node.id)

    if (!hasParentEdge) {
      // Find optimal parent
      const nodeType = (node.data as any)?.type as string | undefined
      const optimal = findOptimalParent(
        node.id,
        nodes,
        edges,
        nodeType
      )

      if (optimal.parentId) {
        // Create edge to existing parent
        optimalEdges.push({
          id: `edge-${optimal.parentId}-${node.id}`,
          source: optimal.parentId,
          target: node.id,
          type: 'custom',
          data: { relation: 'depends_on' },
        })
      } else if (optimal.suggestedIntermediate) {
        // Need to create intermediate R2 node
        suggestedIntermediateNodes.push(optimal.suggestedIntermediate)

        // Create edge from intermediate to this node (will connect to R1 later)
        optimalEdges.push({
          id: `edge-${optimal.suggestedIntermediate.id}-${node.id}`,
          source: optimal.suggestedIntermediate.id,
          target: node.id,
          type: 'custom',
          data: { relation: 'depends_on' },
        })

        const nodeLabel = (node.data as any)?.label as string | undefined || node.id
        issues.push({
          nodeId: node.id,
          nodeLabel,
          issue: `Missing parent node "${optimal.suggestedIntermediate.label}" (R2)`,
          suggestion: `Create intermediate R2 node: ${optimal.suggestedIntermediate.label}`,
        })
      } else {
        const nodeLabel = (node.data as any)?.label as string | undefined || node.id
        issues.push({
          nodeId: node.id,
          nodeLabel,
          issue: 'No parent association rule found',
          suggestion: `Define association rule for node type: ${nodeType}`,
        })
      }
    }
  }

  return {
    currentEdges: edges,
    optimalEdges,
    suggestedIntermediateNodes,
    issues,
  }
}

/**
 * Generate missing intermediate (R2) nodes
 * Deduplicates by label to ensure only one of each intermediate type is created
 */
export function generateMissingIntermediateNodes(
  nodes: Node[],
  suggestedIntermediates: EdgeEvaluationResult['suggestedIntermediateNodes']
): Node[] {
  const newNodes: Node[] = []
  const seenLabels = new Set<string>()

  for (const intermediate of suggestedIntermediates) {
    // Skip if we've already created this intermediate
    if (seenLabels.has(intermediate.label)) {
      continue
    }

    // Check if this intermediate already exists in graph
    const exists = nodes.some(
      n =>
        (n.data as any)?.label === intermediate.label &&
        (n.data as any)?.ring === intermediate.ring
    )

    if (!exists) {
      seenLabels.add(intermediate.label)
      newNodes.push({
        id: intermediate.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // Layout engine will position
        data: {
          title: intermediate.label,
          type: intermediate.type,
          domain: intermediate.domain,
          ring: intermediate.ring,
          tags: ['auto-generated', 'intermediate'],
          summary: `Auto-generated intermediate node for ${intermediate.label}`,
        },
      })
    }
  }

  return newNodes
}

/**
 * Create edges between R1 classifications and R2 intermediates
 */
export function connectIntermediateToClassifications(
  nodes: Node[],
  intermediates: Node[]
): Edge[] {
  const edges: Edge[] = []

  for (const intermediate of intermediates) {
    // Find matching R1 classification
    // Match by domain and type hints
    const domain = (intermediate.data as any)?.domain as string | undefined
    const label = ((intermediate.data as any)?.title as string | undefined) || ''

    // Find center node
    const center = nodes.find(n => (n.data as any)?.ring === 0)
    if (!center) continue

    // Try to find R1 classification that matches this intermediate's domain
    const classification = nodes.find(
      n => {
        const nRing = (n.data as any)?.ring as number | undefined
        const nDomain = (n.data as any)?.domain as string | undefined
        const nLabel = (n.data as any)?.label as string | undefined
        return (
          nRing === 1 &&
          (nDomain === domain ||
            (label && nLabel && label.toLowerCase().includes(nLabel.toLowerCase())))
        )
      }
    )

    if (classification) {
      edges.push({
        id: `edge-${classification.id}-${intermediate.id}`,
        source: classification.id,
        target: intermediate.id,
        type: 'custom',
        data: { relation: 'depends_on' },
      })
    } else {
      // Fallback: connect to center if no classification found
      edges.push({
        id: `edge-${center.id}-${intermediate.id}`,
        source: center.id,
        target: intermediate.id,
        type: 'custom',
        data: { relation: 'depends_on' },
      })
    }
  }

  return edges
}

/**
 * Process foundation nodes and generate all necessary edges
 * This is the main entry point
 */
export function processFoundationEdges(
  nodes: Node[],
  edges: Edge[]
): {
  nodesToCreate: Node[]
  edgesToCreate: Edge[]
  report: {
    newIntermediates: number
    newEdges: number
    issues: Array<{ nodeId: string; issue: string; suggestion: string }>
  }
} {
  // Step 1: Evaluate current state
  const evaluation = evaluateEdges(nodes, edges)

  // Step 2: Generate missing intermediate nodes
  const newIntermediates = generateMissingIntermediateNodes(
    nodes,
    evaluation.suggestedIntermediateNodes
  )

  // Step 3: Connect intermediates to classifications
  const intermediateEdges = connectIntermediateToClassifications(
    [...nodes, ...newIntermediates],
    newIntermediates
  )

  // Step 4: Combine all edges
  const allNewEdges = [...evaluation.optimalEdges, ...intermediateEdges]

  return {
    nodesToCreate: newIntermediates,
    edgesToCreate: allNewEdges,
    report: {
      newIntermediates: newIntermediates.length,
      newEdges: allNewEdges.length,
      issues: evaluation.issues,
    },
  }
}

/**
 * Format report for display
 */
export function formatEdgeReport(report: {
  newIntermediates: number
  newEdges: number
  issues: Array<{ nodeId: string; issue: string; suggestion: string }>
}): string {
  const lines: string[] = []

  lines.push('╔════════════════════════════════════════════════════════════════╗')
  lines.push('║  Foundation Edges - Processing Report                         ║')
  lines.push('╚════════════════════════════════════════════════════════════════╝')
  lines.push('')

  lines.push(`New Intermediate Nodes (R2): ${report.newIntermediates}`)
  lines.push(`New Edges Created: ${report.newEdges}`)
  lines.push('')

  if (report.issues.length > 0) {
    lines.push('Issues Found:')
    report.issues.forEach(issue => {
      lines.push(
        `  ⚠️  ${issue.nodeId} (${issue.issue})`
      )
      lines.push(`      → ${issue.suggestion}`)
    })
  } else {
    lines.push('✅ All foundation nodes properly connected!')
  }

  return lines.join('\n')
}
