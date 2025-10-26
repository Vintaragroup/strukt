/**
 * Workspace Validation Utilities
 * 
 * Validates AI-generated workspaces before displaying to ensure:
 * - Valid schema and required fields
 * - No cycles in the directed graph
 * - Proper node positioning (no overlaps)
 * - Valid node types
 * - Realistic coordinate ranges
 */

export type NodeType = 'root' | 'frontend' | 'backend' | 'requirement' | 'doc'
export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationMessage {
  severity: ValidationSeverity
  message: string
  nodeId?: string
}

export interface ValidationResult {
  isValid: boolean
  messages: ValidationMessage[]
  nodeCount: number
  edgeCount: number
  hasCycles: boolean
  hasOverlaps: boolean
}

export interface WorkspaceNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: {
    title: string
    summary?: string
    stackHint?: string
  }
}

export interface WorkspaceEdge {
  id: string
  source: string
  target: string
}

export interface Workspace {
  nodes: WorkspaceNode[]
  edges: WorkspaceEdge[]
}

/**
 * Main validation function - runs all validators and aggregates results
 */
export function validateWorkspace(workspace: unknown): ValidationResult {
  const messages: ValidationMessage[] = []

  // Type safety check
  if (!workspace || typeof workspace !== 'object') {
    return {
      isValid: false,
      messages: [{ severity: 'error', message: 'Workspace is not a valid object' }],
      nodeCount: 0,
      edgeCount: 0,
      hasCycles: false,
      hasOverlaps: false,
    }
  }

  const ws = workspace as any

  // Basic structure validation
  if (!Array.isArray(ws.nodes)) {
    messages.push({ severity: 'error', message: 'Workspace must contain a nodes array' })
  }

  if (!Array.isArray(ws.edges)) {
    messages.push({ severity: 'error', message: 'Workspace must contain an edges array' })
  }

  // If structure is invalid, return early
  if (messages.length > 0) {
    return {
      isValid: false,
      messages,
      nodeCount: 0,
      edgeCount: 0,
      hasCycles: false,
      hasOverlaps: false,
    }
  }

  const nodes: WorkspaceNode[] = ws.nodes
  const edges: WorkspaceEdge[] = ws.edges

  // Run all validators
  validateNodeSchema(nodes, messages)
  validateNodeTypes(nodes, messages)
  validateNodePositions(nodes, messages)
  validateEdgeSchema(edges, messages)
  validateEdgeReferences(nodes, edges, messages)

  const hasCycles = detectCycles(nodes, edges, messages)
  const hasOverlaps = detectPositionOverlaps(nodes, messages)

  const isValid = messages.every(m => m.severity !== 'error')

  return {
    isValid,
    messages,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    hasCycles,
    hasOverlaps,
  }
}

/**
 * Validates that all nodes have required fields
 */
function validateNodeSchema(nodes: WorkspaceNode[], messages: ValidationMessage[]): void {
  nodes.forEach((node, index) => {
    if (!node.id) {
      messages.push({
        severity: 'error',
        message: `Node ${index} is missing required field: id`,
      })
    }

    if (!node.type) {
      messages.push({
        severity: 'error',
        message: `Node ${node.id || index} is missing required field: type`,
        nodeId: node.id,
      })
    }

    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      messages.push({
        severity: 'error',
        message: `Node ${node.id || index} has invalid position`,
        nodeId: node.id,
      })
    }

    if (!node.data || typeof node.data.title !== 'string') {
      messages.push({
        severity: 'error',
        message: `Node ${node.id || index} is missing title in data`,
        nodeId: node.id,
      })
    }
  })
}

/**
 * Validates that node types are from the allowed set
 */
function validateNodeTypes(nodes: WorkspaceNode[], messages: ValidationMessage[]): void {
  const validTypes: NodeType[] = ['root', 'frontend', 'backend', 'requirement', 'doc']

  nodes.forEach(node => {
    if (!validTypes.includes(node.type)) {
      messages.push({
        severity: 'warning',
        message: `Node ${node.id} has invalid type "${node.type}". Using "requirement" as fallback.`,
        nodeId: node.id,
      })
    }
  })

  // Check for multiple root nodes
  const rootCount = nodes.filter(n => n.type === 'root').length
  if (rootCount > 1) {
    messages.push({
      severity: 'warning',
      message: `Found ${rootCount} root nodes. Only one root node should exist.`,
    })
  } else if (rootCount === 0) {
    messages.push({
      severity: 'warning',
      message: 'No root node found. A root node should represent the project.',
    })
  }
}

/**
 * Validates node positions are within reasonable bounds
 */
function validateNodePositions(nodes: WorkspaceNode[], messages: ValidationMessage[]): void {
  // Reasonable coordinate range for a whiteboard
  const MIN_COORD = -2000
  const MAX_COORD = 5000

  const positions = nodes.map(n => ({ x: n.position.x, y: n.position.y }))

  // Check if all nodes are in reasonable bounds
  const outOfBounds = nodes.filter(node => {
    return (
      node.position.x < MIN_COORD ||
      node.position.x > MAX_COORD ||
      node.position.y < MIN_COORD ||
      node.position.y > MAX_COORD
    )
  })

  if (outOfBounds.length > 0) {
    messages.push({
      severity: 'warning',
      message: `${outOfBounds.length} nodes have positions outside reasonable bounds. They will be repositioned.`,
    })
  }

  // Check if nodes are too close together (all in same spot)
  if (nodes.length > 1) {
    const xs = positions.map(p => p.x)
    const ys = positions.map(p => p.y)
    const xSpread = Math.max(...xs) - Math.min(...xs)
    const ySpread = Math.max(...ys) - Math.min(...ys)

    if (xSpread < 100 && ySpread < 100 && nodes.length > 1) {
      messages.push({
        severity: 'info',
        message: 'All nodes are very close together. Consider repositioning for better visibility.',
      })
    }
  }
}

/**
 * Validates that all edges have required fields
 */
function validateEdgeSchema(edges: WorkspaceEdge[], messages: ValidationMessage[]): void {
  edges.forEach((edge, index) => {
    if (!edge.id) {
      messages.push({
        severity: 'warning',
        message: `Edge ${index} is missing id field. Auto-generating one.`,
      })
    }

    if (!edge.source) {
      messages.push({
        severity: 'error',
        message: `Edge ${edge.id || index} is missing source node id`,
      })
    }

    if (!edge.target) {
      messages.push({
        severity: 'error',
        message: `Edge ${edge.id || index} is missing target node id`,
      })
    }

    if (edge.source === edge.target) {
      messages.push({
        severity: 'warning',
        message: `Edge ${edge.id || index} creates a self-loop (source and target are the same)`,
      })
    }
  })
}

/**
 * Validates that edges reference existing nodes
 */
function validateEdgeReferences(nodes: WorkspaceNode[], edges: WorkspaceEdge[], messages: ValidationMessage[]): void {
  const nodeIds = new Set(nodes.map(n => n.id))

  edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      messages.push({
        severity: 'error',
        message: `Edge ${edge.id} references non-existent source node: ${edge.source}`,
      })
    }

    if (!nodeIds.has(edge.target)) {
      messages.push({
        severity: 'error',
        message: `Edge ${edge.id} references non-existent target node: ${edge.target}`,
      })
    }
  })
}

/**
 * Detects cycles in the directed graph using DFS
 * Returns true if cycles exist
 */
function detectCycles(nodes: WorkspaceNode[], edges: WorkspaceEdge[], messages: ValidationMessage[]): boolean {
  if (nodes.length === 0 || edges.length === 0) {
    return false
  }

  // Build adjacency list
  const graph = new Map<string, string[]>()
  nodes.forEach(node => {
    graph.set(node.id, [])
  })

  edges.forEach(edge => {
    const targets = graph.get(edge.source) || []
    targets.push(edge.target)
    graph.set(edge.source, targets)
  })

  // DFS-based cycle detection
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycleDFS(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  // Check all nodes
  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycleDFS(nodeId)) {
        messages.push({
          severity: 'warning',
          message: 'Detected circular dependency in workspace graph. This may cause issues.',
        })
        return true
      }
    }
  }

  return false
}

/**
 * Detects nodes that overlap in position space
 * Returns true if overlaps detected
 */
function detectPositionOverlaps(nodes: WorkspaceNode[], messages: ValidationMessage[]): boolean {
  const OVERLAP_THRESHOLD = 50 // pixels

  let overlapCount = 0

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i]
      const node2 = nodes[j]

      const dx = node1.position.x - node2.position.x
      const dy = node1.position.y - node2.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < OVERLAP_THRESHOLD) {
        overlapCount++
      }
    }
  }

  if (overlapCount > 0) {
    messages.push({
      severity: 'info',
      message: `Detected ${overlapCount} node position overlaps. Consider auto-layouting for better visibility.`,
    })
    return true
  }

  return false
}

/**
 * Attempts to fix common validation errors
 * Returns a corrected workspace
 */
export function sanitizeWorkspace(workspace: Workspace): Workspace {
  const sanitized: Workspace = {
    nodes: [],
    edges: [],
  }

  // Sanitize nodes
  workspace.nodes.forEach(node => {
    const sanitizedNode: WorkspaceNode = {
      id: node.id || `node-${Math.random().toString(36).substr(2, 9)}`,
      type: isValidNodeType(node.type) ? node.type : 'requirement',
      position: sanitizePosition(node.position),
      data: {
        title: node.data?.title || 'Untitled',
        summary: node.data?.summary,
        stackHint: node.data?.stackHint,
      },
    }
    sanitized.nodes.push(sanitizedNode)
  })

  // Sanitize edges - only keep valid references
  const nodeIds = new Set(sanitized.nodes.map(n => n.id))
  workspace.edges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target) {
      const sanitizedEdge: WorkspaceEdge = {
        id: edge.id || `edge-${Math.random().toString(36).substr(2, 9)}`,
        source: edge.source,
        target: edge.target,
      }
      sanitized.edges.push(sanitizedEdge)
    }
  })

  return sanitized
}

/**
 * Checks if a node type is valid
 */
function isValidNodeType(type: any): type is NodeType {
  const validTypes: NodeType[] = ['root', 'frontend', 'backend', 'requirement', 'doc']
  return validTypes.includes(type)
}

/**
 * Sanitizes position coordinates to reasonable bounds
 */
function sanitizePosition(position: any): { x: number; y: number } {
  const MIN_COORD = -2000
  const MAX_COORD = 5000

  let x = typeof position?.x === 'number' ? position.x : 0
  let y = typeof position?.y === 'number' ? position.y : 0

  // Clamp to reasonable bounds
  x = Math.max(MIN_COORD, Math.min(MAX_COORD, x))
  y = Math.max(MIN_COORD, Math.min(MAX_COORD, y))

  return { x, y }
}

/**
 * Generates a human-readable validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  const lines: string[] = []

  lines.push(`Workspace Validation: ${result.isValid ? '✅ PASS' : '❌ FAIL'}`)
  lines.push(`- Nodes: ${result.nodeCount}`)
  lines.push(`- Edges: ${result.edgeCount}`)

  if (result.hasCycles) {
    lines.push(`- ⚠️ Contains circular dependencies`)
  }

  if (result.hasOverlaps) {
    lines.push(`- ⚠️ Nodes overlap in position space`)
  }

  if (result.messages.length > 0) {
    const errors = result.messages.filter(m => m.severity === 'error')
    const warnings = result.messages.filter(m => m.severity === 'warning')
    const infos = result.messages.filter(m => m.severity === 'info')

    if (errors.length > 0) {
      lines.push(`- 🔴 ${errors.length} error(s)`)
    }
    if (warnings.length > 0) {
      lines.push(`- 🟡 ${warnings.length} warning(s)`)
    }
    if (infos.length > 0) {
      lines.push(`- 🔵 ${infos.length} info message(s)`)
    }
  }

  return lines.join('\n')
}

/**
 * Formats validation messages for display
 */
export function formatValidationMessages(messages: ValidationMessage[]): string[] {
  return messages.map(msg => {
    const prefix = msg.severity === 'error' ? '🔴' : msg.severity === 'warning' ? '🟡' : '🔵'
    return `${prefix} ${msg.message}`
  })
}
