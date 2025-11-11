import type { Node, Edge } from "@xyflow/react";
import { calculateNewNodePosition } from "./domainLayout";
import { updateEdgesWithOptimalHandles } from "./edgeRouting";
import { getClassificationParentId } from "@/config/classifications";
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
  centerNodeId: string,
  defaultParentId?: string
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

    const suggestedParent =
      (suggestion.metadata as Record<string, unknown> | undefined)?.parentId;
    const parentCandidate = typeof suggestedParent === "string" ? suggestedParent : undefined;
    
    // Determine parent: explicit > default > classification > center
    let parentId: string;
    if (parentCandidate && nextNodes.some((n) => n.id === parentCandidate)) {
      parentId = parentCandidate;
    } else if (defaultParentId && nextNodes.some((n) => n.id === defaultParentId)) {
      parentId = defaultParentId;
    } else {
      // Try to resolve classification parent for feature nodes
      const classificationParent = getClassificationParentId(
        nextNodes,
        suggestion.type,
        suggestion.domain as any,
        suggestion.tags,
        suggestion.label
      );
      // Only use classification parent if it exists and isn't the center
      parentId = (classificationParent && classificationParent !== centerNodeId) ? classificationParent : centerNodeId;
    }

    const parentData = nextNodes.find((n) => n.id === parentId)?.data as any;
    const baseDomain = suggestion.domain ?? parentData?.domain;
    const baseType = suggestion.type ?? parentData?.type;
    const rawRing =
      suggestion.ring ??
      (typeof parentData?.ring === "number" ? parentData.ring + 1 : undefined);
    const normalizedRing = typeof rawRing === "number" ? Math.min(6, Math.max(1, rawRing)) : undefined;

    const newId = createNodeId(nextNodes);
    const position = calculateNewNodePosition(nextNodes, centerNodeId, {
      domain: baseDomain,
      type: baseType,
      ring: normalizedRing,
    });

    const newNode: Node = {
      id: newId,
      type: "custom",
      position,
      data: {
        label: suggestion.label,
        summary: suggestion.summary,
        type: (suggestion.type || "requirement") as any,
        domain: baseDomain,
        ring: normalizedRing,
        cards: [],
        tags: [],
        isNew: true,
      },
    };

    nextNodes.push(newNode);
    createdNodeIds.push(newId);

    const parentForEdge = parentId || centerNodeId;

    const newEdge: Edge = {
      id: `e-${parentForEdge}-${newId}-${Date.now().toString(36)}`,
      source: parentForEdge,
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
