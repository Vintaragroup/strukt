import type { Node, Edge } from "@xyflow/react";
import type { CustomNodeData } from "@/components/CustomNode";
import { CLASSIFICATION_DEFINITIONS, getClassificationParentId, ensureClassificationBackbone } from "@/config/classifications";
import { updateEdgesWithOptimalHandles } from "@/utils/edgeRouting";

export interface ClassificationMigrationResult {
  nodes: Node[];
  edges: Edge[];
  applied: boolean;
  debug?: {
    reparented: Array<{ id: string; label?: string; from?: string | null; to: string }>;
    unmatched: Array<{ id: string; label?: string; type?: string; domain?: string }>;
  };
}

const needsMigration = (nodes: Node[]): boolean => {
  const centerChildren = nodes.filter((node) => {
    const data = node.data as CustomNodeData;
    const isClassification = data?.tags?.includes("classification") || Boolean(data?.classificationKey);
    return !isClassification && (!data?.parentId || data.parentId === "center");
  });
  return centerChildren.length > 0;
};

export const migrateNodesToClassifications = (
  nodes: Node[],
  edges: Edge[]
): ClassificationMigrationResult => {
  if (!needsMigration(nodes)) {
    return { nodes, edges, applied: false, debug: { reparented: [], unmatched: [] } };
  }

  const centerId = "center";
  let nextNodes = nodes.map((node) => ({ ...node, data: { ...(node.data || {}) } }));
  let nextEdges = edges.slice();

  const seeded = ensureClassificationBackbone(nextNodes, nextEdges, centerId);
  nextNodes = seeded.nodes;
  nextEdges = seeded.edges;

  const classificationIds = new Set(
    CLASSIFICATION_DEFINITIONS.map((def) => def.id)
  );

  const reparentedLog: Array<{ id: string; label?: string; from?: string | null; to: string }> = [];
  const unmatchedLog: Array<{ id: string; label?: string; type?: string; domain?: string }> = [];

  nextNodes = nextNodes.map((node) => {
    if (node.id === centerId) {
      return node;
    }
    const data = (node.data || {}) as CustomNodeData;
    const isClassification = classificationIds.has(node.id) || data.tags?.includes("classification") || Boolean(data.classificationKey);
    if (isClassification) {
      return {
        ...node,
        data: {
          ...data,
          classificationKey:
            data.classificationKey ||
            CLASSIFICATION_DEFINITIONS.find((def) => def.id === node.id)?.key,
        },
      };
    }

    const classificationParent = getClassificationParentId(
      nextNodes,
      data.type,
      data.domain as any,
      data.tags || [],
      data.label
    );
    if (!classificationParent) {
      unmatchedLog.push({
        id: node.id,
        label: data.label,
        type: data.type as string | undefined,
        domain: data.domain as string | undefined,
      });
      return node;
    }

    if (classificationIds.has(data.parentId as string)) {
      return node;
    }

    const parentNode = nextNodes.find((n) => n.id === classificationParent);
    const parentRing = parentNode && Number((parentNode.data as any)?.ring);
    const nextRing = parentRing ? parentRing + 1 : data.ring || 2;

    reparentedLog.push({
      id: node.id,
      label: data.label,
      from: data.parentId as string | undefined,
      to: classificationParent,
    });

    return {
      ...node,
      data: {
        ...data,
        parentId: classificationParent,
        ring: nextRing,
        // Mark as explicit so layout preserves this association and ring on future recalculations
        explicitRing: true,
      },
    };
  });

  const reparentedIds = new Set(
    nextNodes
      .filter((node) => {
        const data = node.data as CustomNodeData;
        return data?.parentId && data.parentId !== "center" && !classificationIds.has(node.id);
      })
      .map((node) => node.id)
  );

  nextEdges = nextEdges
    .filter((edge) => {
      if (edge.source === centerId && reparentedIds.has(edge.target)) {
        return false;
      }
      return true;
    })
    .map((edge) => ({ ...edge }));

  reparentedIds.forEach((nodeId) => {
    const node = nextNodes.find((n) => n.id === nodeId);
    const data = node?.data as CustomNodeData | undefined;
    const parentId = (data as any)?.parentId as string | undefined;
    if (!node || !parentId) return;
    const edgeExists = nextEdges.some((edge) => edge.source === parentId && edge.target === nodeId);
    if (!edgeExists) {
      nextEdges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "custom",
      });
    }
  });

  // centerNode lookup retained previously; removed as unused after refactor.
  const outputEdges = updateEdgesWithOptimalHandles(nextNodes as any, nextEdges, centerId);

  return {
    nodes: nextNodes,
    edges: outputEdges,
    applied: true,
    debug: {
      reparented: reparentedLog,
      unmatched: unmatchedLog,
    },
  };
};
