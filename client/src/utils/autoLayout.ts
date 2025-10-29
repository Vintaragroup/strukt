// @ts-nocheck
import { Node } from "@xyflow/react";

export interface LayoutConfig {
  centerNodeId: string;
  radius?: number; // Base radius from center
  minRadius?: number; // Minimum radius
  nodeSpacing?: number; // Minimum spacing between nodes
  groupByType?: boolean; // Group nodes by type in sectors
}

const DEFAULT_CONFIG: Required<Omit<LayoutConfig, "centerNodeId">> = {
  radius: 400,
  minRadius: 350,
  nodeSpacing: 100,
  groupByType: true,
};

interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if two node bounds overlap with a padding
 */
function checkCollision(
  a: NodeBounds,
  b: NodeBounds,
  padding: number = 50
): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

/**
 * Calculate distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Resolve overlaps by pushing nodes apart iteratively
 */
function resolveCollisions(
  nodes: Node[],
  centerX: number,
  centerY: number,
  maxIterations: number = 50
): Node[] {
  let adjustedNodes = [...nodes];
  let hasCollisions = true;
  let iteration = 0;

  while (hasCollisions && iteration < maxIterations) {
    hasCollisions = false;
    iteration++;

    // Create bounds for all nodes
    const bounds: NodeBounds[] = adjustedNodes.map((node) => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      width: node.width || node.style?.width || 280,
      height: node.height || node.style?.height || 200,
    }));

    // Check each pair for collisions
    for (let i = 0; i < bounds.length; i++) {
      for (let j = i + 1; j < bounds.length; j++) {
        if (checkCollision(bounds[i], bounds[j], 40)) {
          hasCollisions = true;

          // Calculate centers
          const centerA = {
            x: bounds[i].x + bounds[i].width / 2,
            y: bounds[i].y + bounds[i].height / 2,
          };
          const centerB = {
            x: bounds[j].x + bounds[j].width / 2,
            y: bounds[j].y + bounds[j].height / 2,
          };

          // Calculate push direction (away from each other)
          const dx = centerB.x - centerA.x;
          const dy = centerB.y - centerA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Normalize direction
          const pushX = (dx / dist) * 20;
          const pushY = (dy / dist) * 20;

          // Also consider distance from center - prefer radial expansion
          const distFromCenterA = distance(centerA.x, centerA.y, centerX, centerY);
          const distFromCenterB = distance(centerB.x, centerB.y, centerX, centerY);

          // Push nodes apart, with bias to keep them radially distributed
          if (distFromCenterA > distFromCenterB) {
            // Node A is further from center, push it out more
            adjustedNodes[i] = {
              ...adjustedNodes[i],
              position: {
                x: adjustedNodes[i].position.x + pushX * 1.2,
                y: adjustedNodes[i].position.y + pushY * 1.2,
              },
            };
            adjustedNodes[j] = {
              ...adjustedNodes[j],
              position: {
                x: adjustedNodes[j].position.x - pushX * 0.8,
                y: adjustedNodes[j].position.y - pushY * 0.8,
              },
            };
          } else {
            // Node B is further from center, push it out more
            adjustedNodes[i] = {
              ...adjustedNodes[i],
              position: {
                x: adjustedNodes[i].position.x - pushX * 0.8,
                y: adjustedNodes[i].position.y - pushY * 0.8,
              },
            };
            adjustedNodes[j] = {
              ...adjustedNodes[j],
              position: {
                x: adjustedNodes[j].position.x + pushX * 1.2,
                y: adjustedNodes[j].position.y + pushY * 1.2,
              },
            };
          }

          // Update bounds for next iteration
          bounds[i].x = adjustedNodes[i].position.x;
          bounds[i].y = adjustedNodes[i].position.y;
          bounds[j].x = adjustedNodes[j].position.x;
          bounds[j].y = adjustedNodes[j].position.y;
        }
      }
    }
  }

  return adjustedNodes;
}

/**
 * Calculate optimal radius based on number of nodes and their sizes
 */
function calculateOptimalRadius(
  nodes: Node[],
  minRadius: number,
  nodeSpacing: number
): number {
  // Calculate total "circumference" needed
  let totalWidth = 0;
  let maxHeight = 0;

  nodes.forEach((node) => {
    const width = node.width || node.style?.width || 280;
    const height = node.height || node.style?.height || 200;
    totalWidth += width + nodeSpacing;
    maxHeight = Math.max(maxHeight, height);
  });

  // Calculate radius needed to fit all nodes
  const calculatedRadius = totalWidth / (2 * Math.PI);

  // Add extra space for height considerations
  const heightAdjustedRadius = calculatedRadius + maxHeight / 2;

  return Math.max(minRadius, heightAdjustedRadius);
}

/**
 * Group nodes by their type
 */
function groupNodesByType(nodes: Node[]): Map<string, Node[]> {
  const groups = new Map<string, Node[]>();

  nodes.forEach((node) => {
    const type = node.data.type || "default";
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(node);
  });

  return groups;
}

/**
 * Apply radial auto-layout to nodes around a center node with collision detection
 */
export function applyRadialLayout(
  nodes: Node[],
  config: LayoutConfig
): Node[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const centerNode = nodes.find((n) => n.id === fullConfig.centerNodeId);

  if (!centerNode) {
    console.warn("Center node not found");
    return nodes;
  }

  // Separate center node from others
  const otherNodes = nodes.filter((n) => n.id !== fullConfig.centerNodeId);

  if (otherNodes.length === 0) {
    return nodes;
  }

  // Calculate optimal radius based on actual node sizes
  const radius = calculateOptimalRadius(
    otherNodes,
    fullConfig.minRadius,
    fullConfig.nodeSpacing
  );

  const centerX = centerNode.position.x + (centerNode.width || 320) / 2;
  const centerY = centerNode.position.y + (centerNode.height || 200) / 2;

  let positionedNodes: Node[];

  if (fullConfig.groupByType) {
    positionedNodes = layoutNodesByTypeGroups(
      otherNodes,
      centerX,
      centerY,
      radius
    );
  } else {
    positionedNodes = layoutNodesEvenly(otherNodes, centerX, centerY, radius);
  }

  // Resolve any collisions
  positionedNodes = resolveCollisions(positionedNodes, centerX, centerY);

  // Return all nodes with updated positions
  return nodes.map((node) => {
    if (node.id === fullConfig.centerNodeId) {
      return node; // Keep center node as is
    }
    const positioned = positionedNodes.find((n) => n.id === node.id);
    return positioned || node;
  });
}

/**
 * Layout nodes evenly in a circle
 */
function layoutNodesEvenly(
  nodes: Node[],
  centerX: number,
  centerY: number,
  radius: number
): Node[] {
  const angleStep = (2 * Math.PI) / nodes.length;
  const startAngle = -Math.PI / 2; // Start from top

  return nodes.map((node, index) => {
    const angle = startAngle + angleStep * index;
    const nodeWidth = node.width || node.style?.width || 280;
    const nodeHeight = node.height || node.style?.height || 200;

    const x = centerX + radius * Math.cos(angle) - nodeWidth / 2;
    const y = centerY + radius * Math.sin(angle) - nodeHeight / 2;

    return {
      ...node,
      position: { x, y },
    };
  });
}

/**
 * Layout nodes grouped by type in sectors with staggered radii
 */
function layoutNodesByTypeGroups(
  nodes: Node[],
  centerX: number,
  centerY: number,
  baseRadius: number
): Node[] {
  const groups = groupNodesByType(nodes);
  const groupArray = Array.from(groups.entries());

  // Define type order and preferred sectors (angles)
  const typeAngles: Record<string, number> = {
    frontend: 0, // Right
    backend: Math.PI, // Left
    database: (3 * Math.PI) / 2, // Bottom
    api: Math.PI / 2, // Top
    infrastructure: (7 * Math.PI) / 4, // Bottom-right
    design: Math.PI / 4, // Top-right
    requirement: Math.PI, // Left
    doc: (3 * Math.PI) / 2, // Bottom
  };

  const positionedNodes: Node[] = [];
  const totalGroups = groupArray.length;
  const sectorSize = (2 * Math.PI) / totalGroups;

  groupArray.forEach(([type, groupNodes], groupIndex) => {
    // Determine the base angle for this group
    const baseAngle =
      typeAngles[type] !== undefined
        ? typeAngles[type]
        : groupIndex * sectorSize - Math.PI / 2;

    // Distribute nodes within the sector
    const nodeCount = groupNodes.length;

    if (nodeCount === 1) {
      // Single node - place at sector center
      const node = groupNodes[0];
      const nodeWidth = node.width || node.style?.width || 280;
      const nodeHeight = node.height || node.style?.height || 200;

      const x = centerX + baseRadius * Math.cos(baseAngle) - nodeWidth / 2;
      const y = centerY + baseRadius * Math.sin(baseAngle) - nodeHeight / 2;

      positionedNodes.push({
        ...node,
        position: { x, y },
      });
    } else {
      // Multiple nodes - use staggered radii and angles to prevent overlap
      const arcSpread = Math.min(sectorSize * 0.7, Math.PI / 2.5);

      groupNodes.forEach((node, nodeIndex) => {
        const nodeWidth = node.width || node.style?.width || 280;
        const nodeHeight = node.height || node.style?.height || 200;

        // Alternate between different radii for better spacing
        const radiusVariation = nodeIndex % 2 === 0 ? 0 : 80;
        const radius = baseRadius + radiusVariation;

        // Calculate angle within the sector
        let angle: number;
        if (nodeCount === 2) {
          angle = baseAngle + (nodeIndex === 0 ? -arcSpread / 3 : arcSpread / 3);
        } else {
          const angleStep = arcSpread / (nodeCount - 1);
          angle = baseAngle - arcSpread / 2 + angleStep * nodeIndex;
        }

        const x = centerX + radius * Math.cos(angle) - nodeWidth / 2;
        const y = centerY + radius * Math.sin(angle) - nodeHeight / 2;

        positionedNodes.push({
          ...node,
          position: { x, y },
        });
      });
    }
  });

  return positionedNodes;
}

/**
 * Apply a grid layout for nodes
 */
export function applyGridLayout(
  nodes: Node[],
  centerNodeId: string,
  columns: number = 3,
  spacing: { x: number; y: number } = { x: 400, y: 500 }
): Node[] {
  const centerNode = nodes.find((n) => n.id === centerNodeId);

  if (!centerNode) {
    return nodes;
  }

  const otherNodes = nodes.filter((n) => n.id !== centerNodeId);

  const startX = centerNode.position.x - (columns * spacing.x) / 2;
  const startY = centerNode.position.y + 300; // Below center

  return nodes.map((node) => {
    if (node.id === centerNodeId) {
      return node;
    }

    const index = otherNodes.findIndex((n) => n.id === node.id);
    if (index === -1) return node;

    const row = Math.floor(index / columns);
    const col = index % columns;

    return {
      ...node,
      position: {
        x: startX + col * spacing.x,
        y: startY + row * spacing.y,
      },
    };
  });
}
