import { Node, Edge } from "reactflow";

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
  
  const sourceX = sourceNode.position.x + (sourceNode.width || 0) / 2;
  const sourceY = sourceNode.position.y + (sourceNode.height || 0) / 2;
  
  const targetX = targetNode.position.x + (targetNode.width || 0) / 2;
  const targetY = targetNode.position.y + (targetNode.height || 0) / 2;
  
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
export function updateEdgesWithOptimalHandles(
  nodes: Node[],
  edges: Edge[],
  centerNodeId: string
): Edge[] {
  return edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    
    // Skip if either node is not found
    if (!sourceNode || !targetNode) return edge;
    
    // Calculate optimal handles based on relative positions
    const { sourceHandle, targetHandle } = calculateOptimalHandle(
      sourceNode,
      targetNode
    );
    
    // Preserve any user-chosen handles from the connection gesture.
    // Only fill in a handle if it's missing.
    const finalSourceHandle = edge.sourceHandle ?? sourceHandle;
    const finalTargetHandle = edge.targetHandle ?? targetHandle;

    // If both are already present, do not override them.
    return {
      ...edge,
      sourceHandle: finalSourceHandle,
      targetHandle: finalTargetHandle,
    };
  });
}
