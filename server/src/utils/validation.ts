/**
 * DFS-based cycle detection to ensure graph remains acyclic
 */
export function hasCycle(
  nodes: Array<{ id: string }>,
  edges: Array<{ source: string; target: string }>,
  newEdge?: { source: string; target: string }
): boolean {
  const adjacency: Record<string, string[]> = {}

  // Build adjacency list
  for (const edge of edges) {
    if (!adjacency[edge.source]) adjacency[edge.source] = []
    adjacency[edge.source].push(edge.target)
  }

  // Add new edge if provided
  if (newEdge) {
    if (!adjacency[newEdge.source]) adjacency[newEdge.source] = []
    adjacency[newEdge.source].push(newEdge.target)
  }

  // Check for cycles using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(node: string): boolean {
    visited.add(node)
    recursionStack.add(node)

    const neighbors = adjacency[node] || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(node)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}

/**
 * Count root nodes in a workspace
 */
export function countRootNodes(nodes: Array<{ type: string }>): number {
  return nodes.filter((n) => n.type === 'root').length
}
