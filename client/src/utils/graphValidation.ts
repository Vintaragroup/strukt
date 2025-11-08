export interface GraphNodeRef {
  id: string;
}

export interface GraphEdgeRef {
  source: string;
  target: string;
}

export interface CycleCheckResult {
  hasCycle: boolean;
  cycle?: string[];
}

export const detectCycle = (
  nodes: GraphNodeRef[],
  edges: GraphEdgeRef[],
  newEdge?: GraphEdgeRef
): CycleCheckResult => {
  const adjacency: Record<string, string[]> = {};

  const addEdge = (edge?: GraphEdgeRef) => {
    if (!edge || !edge.source || !edge.target) {
      return;
    }
    if (!adjacency[edge.source]) {
      adjacency[edge.source] = [];
    }
    adjacency[edge.source].push(edge.target);
  };

  edges.forEach(addEdge);
  addEdge(newEdge);

  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (nodeId: string): string[] | null => {
    visited.add(nodeId);
    stack.push(nodeId);

    const neighbors = adjacency[nodeId] ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = dfs(neighbor);
        if (cycle) return cycle;
      } else {
        const idx = stack.indexOf(neighbor);
        if (idx !== -1) {
          return [...stack.slice(idx), neighbor];
        }
      }
    }

    stack.pop();
    return null;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const cycle = dfs(node.id);
      if (cycle) {
        return { hasCycle: true, cycle };
      }
    }
  }

  return { hasCycle: false };
};
