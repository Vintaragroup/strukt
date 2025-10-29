import type { Node, Edge } from "@xyflow/react";
import { calculateNewNodePosition } from "./domainLayout";
import { updateEdgesWithOptimalHandles } from "./edgeRouting";
import type { SuggestedNode } from "@/types/ai";

interface ApplySuggestionsResult {
  nodes: Node[];
  edges: Edge[];
  createdNodeIds: string[];
}

function cloneNode(node: Node): Node {
  return {
    ...node,
    data: node?.data ? { ...(node.data as Record<string, unknown>) } : node.data,
  };
}

function createNodeId(existing: Node[]): string {
  const base = `s-${Date.now().toString(36)}`;
  let candidate = base;
  let counter = 0;
  const existingIds = new Set(existing.map((n) => n.id));
  while (existingIds.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}

export function applySuggestions(
  suggestions: SuggestedNode[],
  nodes: Node[],
  edges: Edge[],
  centerNodeId: string
): ApplySuggestionsResult {
  if (!suggestions || suggestions.length === 0) {
    return { nodes, edges, createdNodeIds: [] };
  }

  const nextNodes = nodes.map(cloneNode);
  let nextEdges = edges.map((edge) => ({ ...edge }));
  const createdNodeIds: string[] = [];
  const centerNode = nextNodes.find((node) => node.id === centerNodeId);

  suggestions.forEach((suggestion) => {
    if (!suggestion || !suggestion.label) {
      return;
    }

    if (suggestion.type === "center" && centerNode) {
      centerNode.data = {
        ...(centerNode.data || {}),
        label: suggestion.label,
        description:
          suggestion.summary ||
          (centerNode.data as any)?.description ||
          "Define the mission for this workspace.",
        isNew: true,
      };
      return;
    }

    const newId = createNodeId(nextNodes);
    const position = calculateNewNodePosition(nextNodes, centerNodeId, {
      domain: suggestion.domain,
      type: suggestion.type,
      ring: suggestion.ring,
    });

    const newNode: Node = {
      id: newId,
      type: "custom",
      position,
      data: {
        label: suggestion.label,
        summary: suggestion.summary,
        type: (suggestion.type || "requirement") as any,
        domain: suggestion.domain,
        ring: suggestion.ring,
        cards: [],
        tags: [],
        isNew: true,
      },
    };

    nextNodes.push(newNode);
    createdNodeIds.push(newId);

    const newEdge: Edge = {
      id: `e-${centerNodeId}-${newId}-${Date.now().toString(36)}`,
      source: centerNodeId,
      target: newId,
      type: "custom",
    };

    nextEdges.push(newEdge);
  });

  nextEdges = updateEdgesWithOptimalHandles(nextNodes, nextEdges, centerNodeId);

  return {
    nodes: nextNodes,
    edges: nextEdges,
    createdNodeIds,
  };
}
