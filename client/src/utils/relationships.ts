import { Node, Edge } from "reactflow";

// Relationship types with semantic meaning
export type RelationshipType =
  | "depends-on"    // This node depends on the target (can't start until target is done)
  | "blocks"        // This node blocks the target (target can't start until this is done)
  | "related-to"    // General relationship, no dependency
  | "implements"    // This node implements the target (e.g., code implements requirement)
  | "documents"     // This node documents the target
  | "tests"         // This node tests the target
  | "extends"       // This node extends/builds upon the target
  | "references";   // This node references the target

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  metadata?: {
    weight?: number;      // For critical path calculation (days, hours, etc.)
    status?: string;      // Optional status tracking
    createdAt?: number;
  };
}

export interface DependencyChain {
  nodeId: string;
  dependencies: string[];
  dependents: string[];
  depth: number;
}

export interface CircularDependency {
  cycle: string[];
  type: "hard" | "soft";  // hard = blocks/depends-on, soft = other types
}

export interface CriticalPath {
  path: string[];
  totalWeight: number;
  nodes: Map<string, { weight: number; depth: number }>;
}

// Get relationship type from edge
export function getRelationshipType(edge: Edge): RelationshipType {
  return (edge.data?.relationshipType as RelationshipType) || "related-to";
}

// Set relationship type on edge
export function setRelationshipType(
  edge: Edge,
  type: RelationshipType
): Edge {
  return {
    ...edge,
    data: {
      ...edge.data,
      relationshipType: type,
    },
  };
}

// Get all relationships from edges
export function getRelationships(edges: Edge[]): Relationship[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: getRelationshipType(edge),
    label: edge.label as string | undefined,
    metadata: {
      weight: edge.data?.weight,
      status: edge.data?.status,
      createdAt: edge.data?.createdAt,
    },
  }));
}

// Get all dependencies for a node (nodes that this node depends on)
export function getDependencies(
  nodeId: string,
  edges: Edge[],
  includeTypes?: RelationshipType[]
): string[] {
  const types = includeTypes || ["depends-on", "blocks"];
  return edges
    .filter((edge) => {
      const relType = getRelationshipType(edge);
      return (
        (edge.source === nodeId && relType === "depends-on") ||
        (edge.target === nodeId && relType === "blocks")
      ) && (!includeTypes || types.includes(relType));
    })
    .map((edge) =>
      getRelationshipType(edge) === "depends-on" ? edge.target : edge.source
    );
}

// Get all dependents for a node (nodes that depend on this node)
export function getDependents(
  nodeId: string,
  edges: Edge[],
  includeTypes?: RelationshipType[]
): string[] {
  const types = includeTypes || ["depends-on", "blocks"];
  return edges
    .filter((edge) => {
      const relType = getRelationshipType(edge);
      return (
        (edge.target === nodeId && relType === "depends-on") ||
        (edge.source === nodeId && relType === "blocks")
      ) && (!includeTypes || types.includes(relType));
    })
    .map((edge) =>
      getRelationshipType(edge) === "depends-on" ? edge.source : edge.target
    );
}

// Get full dependency chain (all ancestors)
export function getDependencyChain(
  nodeId: string,
  edges: Edge[],
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);

  const directDeps = getDependencies(nodeId, edges);
  const allDeps = [...directDeps];

  directDeps.forEach((depId) => {
    const childDeps = getDependencyChain(depId, edges, visited);
    childDeps.forEach((childDep) => {
      if (!allDeps.includes(childDep)) {
        allDeps.push(childDep);
      }
    });
  });

  return allDeps;
}

// Get full dependent chain (all descendants)
export function getDependentChain(
  nodeId: string,
  edges: Edge[],
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);

  const directDeps = getDependents(nodeId, edges);
  const allDeps = [...directDeps];

  directDeps.forEach((depId) => {
    const childDeps = getDependentChain(depId, edges, visited);
    childDeps.forEach((childDep) => {
      if (!allDeps.includes(childDep)) {
        allDeps.push(childDep);
      }
    });
  });

  return allDeps;
}

// Build dependency map
export function buildDependencyMap(
  nodes: Node[],
  edges: Edge[]
): Map<string, DependencyChain> {
  const map = new Map<string, DependencyChain>();

  nodes.forEach((node) => {
    const deps = getDependencies(node.id, edges);
    const dependents = getDependents(node.id, edges);
    const depth = calculateNodeDepth(node.id, edges);

    map.set(node.id, {
      nodeId: node.id,
      dependencies: deps,
      dependents,
      depth,
    });
  });

  return map;
}

// Calculate depth of a node in dependency tree (0 = no dependencies)
export function calculateNodeDepth(
  nodeId: string,
  edges: Edge[],
  visited: Set<string> = new Set()
): number {
  if (visited.has(nodeId)) return 0;
  visited.add(nodeId);

  const deps = getDependencies(nodeId, edges);
  if (deps.length === 0) return 0;

  const depths = deps.map((depId) =>
    calculateNodeDepth(depId, edges, new Set(visited))
  );
  return Math.max(...depths) + 1;
}

// Detect circular dependencies
export function detectCircularDependencies(
  nodes: Node[],
  edges: Edge[]
): CircularDependency[] {
  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(
    nodeId: string,
    path: string[],
    type: "hard" | "soft"
  ): void {
    if (recursionStack.has(nodeId)) {
      // Found a cycle
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart);
      cycle.push(nodeId); // Complete the cycle

      // Check if this cycle already exists
      const cycleExists = cycles.some((existingCycle) => {
        if (existingCycle.cycle.length !== cycle.length) return false;
        // Check if it's the same cycle (may start at different point)
        for (let i = 0; i < cycle.length; i++) {
          const rotated = [
            ...cycle.slice(i),
            ...cycle.slice(0, i),
          ];
          if (JSON.stringify(rotated) === JSON.stringify(existingCycle.cycle)) {
            return true;
          }
        }
        return false;
      });

      if (!cycleExists) {
        cycles.push({ cycle, type });
      }
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const deps = getDependencies(nodeId, edges);
    deps.forEach((depId) => detectCycle(depId, [...path], "hard"));

    recursionStack.delete(nodeId);
  }

  // Check hard dependencies (blocks, depends-on)
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      detectCycle(node.id, [], "hard");
    }
  });

  return cycles;
}

// Find critical path (longest path through dependencies)
export function findCriticalPath(
  nodes: Node[],
  edges: Edge[],
  startNodeId?: string
): CriticalPath | null {
  // Build adjacency list with weights
  const graph = new Map<string, Array<{ nodeId: string; weight: number }>>();
  const inDegree = new Map<string, number>();

  nodes.forEach((node) => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    const relType = getRelationshipType(edge);
    if (relType === "depends-on" || relType === "blocks") {
      const source = relType === "depends-on" ? edge.target : edge.source;
      const target = relType === "depends-on" ? edge.source : edge.target;
      const weight = edge.data?.weight || 1;

      graph.get(source)?.push({ nodeId: target, weight });
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  });

  // Find starting nodes (no dependencies)
  const startNodes = startNodeId
    ? [startNodeId]
    : Array.from(inDegree.entries())
        .filter(([_, degree]) => degree === 0)
        .map(([nodeId]) => nodeId);

  if (startNodes.length === 0) return null;

  // Calculate longest path using topological sort
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string>();

  nodes.forEach((node) => {
    distances.set(node.id, 0);
  });

  const queue = [...startNodes];
  const tempInDegree = new Map(inDegree);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current) || 0;

    const neighbors = graph.get(current) || [];
    neighbors.forEach(({ nodeId, weight }) => {
      const newDist = currentDist + weight;
      if (newDist > (distances.get(nodeId) || 0)) {
        distances.set(nodeId, newDist);
        predecessors.set(nodeId, current);
      }

      const newInDegree = (tempInDegree.get(nodeId) || 0) - 1;
      tempInDegree.set(nodeId, newInDegree);
      if (newInDegree === 0) {
        queue.push(nodeId);
      }
    });
  }

  // Find the node with maximum distance
  let maxDist = 0;
  let endNode = "";
  distances.forEach((dist, nodeId) => {
    if (dist > maxDist) {
      maxDist = dist;
      endNode = nodeId;
    }
  });

  if (maxDist === 0 || !endNode) return null;

  // Reconstruct path
  const path: string[] = [];
  let current: string | undefined = endNode;
  while (current) {
    path.unshift(current);
    current = predecessors.get(current);
  }

  // Build node details
  const nodeDetails = new Map<string, { weight: number; depth: number }>();
  path.forEach((nodeId, index) => {
    nodeDetails.set(nodeId, {
      weight: distances.get(nodeId) || 0,
      depth: index,
    });
  });

  return {
    path,
    totalWeight: maxDist,
    nodes: nodeDetails,
  };
}

// Get relationship statistics
export function getRelationshipStats(edges: Edge[]): {
  total: number;
  byType: Record<RelationshipType, number>;
  hardDependencies: number;
  softRelationships: number;
} {
  const stats = {
    total: edges.length,
    byType: {} as Record<RelationshipType, number>,
    hardDependencies: 0,
    softRelationships: 0,
  };

  const relationshipTypes: RelationshipType[] = [
    "depends-on",
    "blocks",
    "related-to",
    "implements",
    "documents",
    "tests",
    "extends",
    "references",
  ];

  relationshipTypes.forEach((type) => {
    stats.byType[type] = 0;
  });

  edges.forEach((edge) => {
    const type = getRelationshipType(edge);
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    if (type === "depends-on" || type === "blocks") {
      stats.hardDependencies++;
    } else {
      stats.softRelationships++;
    }
  });

  return stats;
}

// Get relationship color for visualization
export function getRelationshipColor(type: RelationshipType): string {
  switch (type) {
    case "depends-on":
      return "#ef4444"; // red
    case "blocks":
      return "#f97316"; // orange
    case "implements":
      return "#3b82f6"; // blue
    case "tests":
      return "#10b981"; // green
    case "documents":
      return "#8b5cf6"; // purple
    case "extends":
      return "#06b6d4"; // cyan
    case "references":
      return "#64748b"; // slate
    case "related-to":
    default:
      return "#94a3b8"; // gray
  }
}

// Get relationship label
export function getRelationshipLabel(type: RelationshipType): string {
  switch (type) {
    case "depends-on":
      return "Depends On";
    case "blocks":
      return "Blocks";
    case "implements":
      return "Implements";
    case "tests":
      return "Tests";
    case "documents":
      return "Documents";
    case "extends":
      return "Extends";
    case "references":
      return "References";
    case "related-to":
      return "Related To";
    default:
      return "Related";
  }
}

// Get relationship icon
export function getRelationshipIcon(type: RelationshipType): string {
  switch (type) {
    case "depends-on":
      return "⬇️"; // down arrow
    case "blocks":
      return "🚫"; // prohibited
    case "implements":
      return "⚙️"; // gear
    case "tests":
      return "✅"; // check
    case "documents":
      return "📄"; // document
    case "extends":
      return "🔗"; // link
    case "references":
      return "👉"; // pointing
    case "related-to":
      return "↔️"; // arrows
    default:
      return "•";
  }
}

// Filter nodes by relationship criteria
export function filterNodesByRelationship(
  nodes: Node[],
  edges: Edge[],
  criteria: {
    hasIncoming?: boolean;
    hasOutgoing?: boolean;
    relationshipType?: RelationshipType;
    isInCycle?: boolean;
    isOnCriticalPath?: boolean;
  }
): string[] {
  const filtered: string[] = [];
  const cycles = criteria.isInCycle
    ? detectCircularDependencies(nodes, edges)
    : [];
  const criticalPath = criteria.isOnCriticalPath
    ? findCriticalPath(nodes, edges)
    : null;

  nodes.forEach((node) => {
    let matches = true;

    // Check incoming edges
    if (criteria.hasIncoming !== undefined) {
      const hasIncoming = edges.some((e) => e.target === node.id);
      if (hasIncoming !== criteria.hasIncoming) matches = false;
    }

    // Check outgoing edges
    if (criteria.hasOutgoing !== undefined) {
      const hasOutgoing = edges.some((e) => e.source === node.id);
      if (hasOutgoing !== criteria.hasOutgoing) matches = false;
    }

    // Check relationship type
    if (criteria.relationshipType && matches) {
      const hasType = edges.some(
        (e) =>
          (e.source === node.id || e.target === node.id) &&
          getRelationshipType(e) === criteria.relationshipType
      );
      if (!hasType) matches = false;
    }

    // Check if in cycle
    if (criteria.isInCycle && matches) {
      const inCycle = cycles.some((cycle) => cycle.cycle.includes(node.id));
      if (!inCycle) matches = false;
    }

    // Check if on critical path
    if (criteria.isOnCriticalPath && matches) {
      const onPath = criticalPath?.path.includes(node.id) || false;
      if (!onPath) matches = false;
    }

    if (matches) {
      filtered.push(node.id);
    }
  });

  return filtered;
}

// Validate relationship (check if it would create a cycle)
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: Edge[],
  relationshipType: RelationshipType
): boolean {
  // Only check for hard dependencies
  if (relationshipType !== "depends-on" && relationshipType !== "blocks") {
    return false;
  }

  // Create a temporary edge
  const tempEdge: Edge = {
    id: `temp-${Date.now()}`,
    source: sourceId,
    target: targetId,
    data: { relationshipType },
  };

  // Check if this creates a cycle
  const tempEdges = [...edges, tempEdge];
  
  // Simple cycle detection: check if target has a path back to source
  const visited = new Set<string>();
  function hasPathTo(from: string, to: string): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);

    const deps = getDependencies(from, tempEdges);
    return deps.some((depId) => hasPathTo(depId, to));
  }

  return hasPathTo(targetId, sourceId);
}

// Suggest relationships based on node types and content
export function suggestRelationships(
  nodes: Node[],
  edges: Edge[]
): Array<{ source: string; target: string; type: RelationshipType; reason: string }> {
  const suggestions: Array<{
    source: string;
    target: string;
    type: RelationshipType;
    reason: string;
  }> = [];

  nodes.forEach((sourceNode) => {
    nodes.forEach((targetNode) => {
      if (sourceNode.id === targetNode.id) return;
      if (sourceNode.id === "center" || targetNode.id === "center") return;

      // Check if relationship already exists
      const existingEdge = edges.find(
        (e) =>
          (e.source === sourceNode.id && e.target === targetNode.id) ||
          (e.source === targetNode.id && e.target === sourceNode.id)
      );
      if (existingEdge) return;

      const sourceType = sourceNode.data?.type;
      const targetType = targetNode.data?.type;

      // Suggest implementation relationships
      if (sourceType === "frontend" && targetType === "requirement") {
        suggestions.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: "implements",
          reason: "Frontend typically implements requirements",
        });
      }

      if (sourceType === "backend" && targetType === "requirement") {
        suggestions.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: "implements",
          reason: "Backend typically implements requirements",
        });
      }

      // Suggest documentation relationships
      if (sourceType === "doc" && targetType !== "doc") {
        suggestions.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: "documents",
          reason: "Documentation node can document this",
        });
      }

      // Suggest dependency between frontend and backend
      if (sourceType === "frontend" && targetType === "backend") {
        suggestions.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: "depends-on",
          reason: "Frontend often depends on backend APIs",
        });
      }
    });
  });

  // Limit to top 10 suggestions
  return suggestions.slice(0, 10);
}
