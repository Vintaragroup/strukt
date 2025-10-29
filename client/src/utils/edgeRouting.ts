import type { Node, Edge } from "@xyflow/react";

const DEFAULT_NODE_WIDTH = 280;
const DEFAULT_NODE_HEIGHT = 200;

function parseDimension(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function getNodeDimension(node: Node, key: "width" | "height"): number {
  const styleValue = key === "width" ? node.style?.width : node.style?.height;
  const dataValue = node.data?.[key];
  const directValue = (node as any)[key];

  return (
    parseDimension(directValue) ??
    parseDimension(styleValue) ??
    parseDimension(dataValue) ??
    (key === "width" ? DEFAULT_NODE_WIDTH : DEFAULT_NODE_HEIGHT)
  );
}

// Logical sides on a node; actual handle ids in our app are `${side}-source` and `${side}-target`
export type HandleSide = "top" | "right" | "bottom" | "left";

/**
 * Calculate the best handle positions between any two nodes based on their relative position
 */
export function calculateOptimalHandle(
  sourceNode: Node,
  targetNode: Node
): { sourceHandle: string; targetHandle: string } {
  // Validate nodes have positions
  if (!sourceNode?.position || !targetNode?.position) {
    // default to connecting from right of source to left of target
    return { sourceHandle: "right-source", targetHandle: "left-target" };
  }
  
  const sourceWidth = getNodeDimension(sourceNode, "width");
  const sourceHeight = getNodeDimension(sourceNode, "height");
  const targetWidth = getNodeDimension(targetNode, "width");
  const targetHeight = getNodeDimension(targetNode, "height");

  const sourceX = sourceNode.position.x + sourceWidth / 2;
  const sourceY = sourceNode.position.y + sourceHeight / 2;
  
  const targetX = targetNode.position.x + targetWidth / 2;
  const targetY = targetNode.position.y + targetHeight / 2;
  
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  
  // Use angle to determine which handle to use
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  
  let sourceSide: HandleSide;
  let targetSide: HandleSide;
  
  // Determine handles based on angle between nodes
  if (angle >= -45 && angle < 45) {
    // Target is to the right
    sourceSide = "right";
    targetSide = "left";
  } else if (angle >= 45 && angle < 135) {
    // Target is below
    sourceSide = "bottom";
    targetSide = "top";
  } else if (angle >= 135 || angle < -135) {
    // Target is to the left
    sourceSide = "left";
    targetSide = "right";
  } else {
    // Target is above
    sourceSide = "top";
    targetSide = "bottom";
  }

  // Map logical sides to actual handle ids used by CustomNode handles
  const sourceHandle = `${sourceSide}-source`;
  const targetHandle = `${targetSide}-target`;
  return { sourceHandle, targetHandle };
}

/**
 * Update all edges with optimal handles based on node positions
 */
const HANDLE_ID_PATTERN = /^(top|right|bottom|left)-(source|target)$/;

function shouldUpdateHandle(
  current: string | null | undefined,
  desired: string,
  locked?: boolean
): boolean {
  if (locked) return false;
  if (!current) return true;
  if (!HANDLE_ID_PATTERN.test(current)) return true;
  return current !== desired;
}

export function updateEdgesWithOptimalHandles(
  nodes: Node[],
  edges: Edge[],
  centerNodeId: string
): Edge[] {
  return edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      return edge;
    }

    const { sourceHandle, targetHandle } = calculateOptimalHandle(
      sourceNode,
      targetNode
    );

    const lockSource = (edge.data as any)?.lockSourceHandle === true;
    const lockTarget = (edge.data as any)?.lockTargetHandle === true;
    const lockBoth = (edge.data as any)?.lockHandles === true;

    const shouldSetSource = shouldUpdateHandle(
      edge.sourceHandle,
      sourceHandle,
      lockSource || lockBoth
    );
    const shouldSetTarget = shouldUpdateHandle(
      edge.targetHandle,
      targetHandle,
      lockTarget || lockBoth
    );

    if (!shouldSetSource && !shouldSetTarget) {
      return edge;
    }

    return {
      ...edge,
      sourceHandle: shouldSetSource ? sourceHandle : edge.sourceHandle,
      targetHandle: shouldSetTarget ? targetHandle : edge.targetHandle,
    };
  });
}
