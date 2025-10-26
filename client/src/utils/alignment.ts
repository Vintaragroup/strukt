import { Node } from "reactflow";

export type AlignmentType = 
  | "left" 
  | "right" 
  | "top" 
  | "bottom" 
  | "centerHorizontal" 
  | "centerVertical"
  | "distributeHorizontal"
  | "distributeVertical";

/**
 * Aligns selected nodes based on the specified alignment type
 */
export function alignNodes(nodes: Node[], alignmentType: AlignmentType): Node[] {
  const selectedNodes = nodes.filter((n) => n.selected);
  
  if (selectedNodes.length < 2) {
    return nodes; // Need at least 2 nodes to align
  }

  // Calculate bounding box of selected nodes
  const bounds = {
    minX: Math.min(...selectedNodes.map((n) => n.position.x)),
    maxX: Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 0))),
    minY: Math.min(...selectedNodes.map((n) => n.position.y)),
    maxY: Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 0))),
  };

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return nodes.map((node) => {
    if (!node.selected) return node;

    const nodeWidth = node.width || 0;
    const nodeHeight = node.height || 0;

    let newPosition = { ...node.position };

    switch (alignmentType) {
      case "left":
        newPosition.x = bounds.minX;
        break;
      case "right":
        newPosition.x = bounds.maxX - nodeWidth;
        break;
      case "top":
        newPosition.y = bounds.minY;
        break;
      case "bottom":
        newPosition.y = bounds.maxY - nodeHeight;
        break;
      case "centerHorizontal":
        newPosition.x = centerX - nodeWidth / 2;
        break;
      case "centerVertical":
        newPosition.y = centerY - nodeHeight / 2;
        break;
      case "distributeHorizontal":
        return node; // Handled separately below
      case "distributeVertical":
        return node; // Handled separately below
    }

    return {
      ...node,
      position: newPosition,
    };
  });
}

/**
 * Distributes selected nodes evenly in horizontal or vertical direction
 */
export function distributeNodes(
  nodes: Node[],
  direction: "horizontal" | "vertical"
): Node[] {
  const selectedNodes = nodes.filter((n) => n.selected);
  
  if (selectedNodes.length < 3) {
    return nodes; // Need at least 3 nodes to distribute
  }

  // Sort nodes by position
  const sortedNodes = [...selectedNodes].sort((a, b) => {
    if (direction === "horizontal") {
      return a.position.x - b.position.x;
    } else {
      return a.position.y - b.position.y;
    }
  });

  const firstNode = sortedNodes[0];
  const lastNode = sortedNodes[sortedNodes.length - 1];

  // Calculate total space and spacing
  const totalSpace =
    direction === "horizontal"
      ? lastNode.position.x - firstNode.position.x
      : lastNode.position.y - firstNode.position.y;

  const spacing = totalSpace / (sortedNodes.length - 1);

  // Create a map of node positions
  const positionMap = new Map<string, { x: number; y: number }>();

  sortedNodes.forEach((node, index) => {
    if (index === 0 || index === sortedNodes.length - 1) {
      // Keep first and last nodes in place
      positionMap.set(node.id, node.position);
    } else {
      // Distribute middle nodes evenly
      const newPosition = { ...node.position };
      if (direction === "horizontal") {
        newPosition.x = firstNode.position.x + spacing * index;
      } else {
        newPosition.y = firstNode.position.y + spacing * index;
      }
      positionMap.set(node.id, newPosition);
    }
  });

  // Apply new positions to all nodes
  return nodes.map((node) => {
    const newPosition = positionMap.get(node.id);
    if (newPosition) {
      return {
        ...node,
        position: newPosition,
      };
    }
    return node;
  });
}
