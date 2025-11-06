// @ts-nocheck
import type { Node } from "@xyflow/react";
// Note: domainLayout remains pure. Post-layout relaxation & measurement handling
// is orchestrated in App.tsx to ensure React Flow dimensions are available.

export type DomainType = "business" | "product" | "tech" | "data-ai" | "operations";
export type DepartmentType = string; // Dynamic department names

export interface DepartmentConfig {
  name: string;
  angleOffset: number; // Offset from domain base angle (-0.2 to 0.2 radians)
  description?: string;
}

export interface DomainConfig {
  name: string;
  color: string;
  accentColor: string;
  bgGradient: string;
  angle: number; // Base angle for domain sector (in radians)
  ringOffset: number; // Which ring (1, 2, 3+)
  departments: Record<string, DepartmentConfig>; // Sub-sectors within domain
}

// Department configurations for each domain
const BUSINESS_DEPARTMENTS: Record<string, DepartmentConfig> = {
  strategy: { name: "Strategy", angleOffset: -0.2, description: "Business strategy and planning" },
  requirements: { name: "Requirements", angleOffset: 0, description: "Business requirements and specs" },
  stakeholders: { name: "Stakeholders", angleOffset: 0.2, description: "Stakeholder management" },
};

const PRODUCT_DEPARTMENTS: Record<string, DepartmentConfig> = {
  design: { name: "Design Team", angleOffset: -0.2, description: "UX/UI design" },
  frontend: { name: "Frontend Team", angleOffset: 0, description: "Frontend development" },
  research: { name: "UX Research", angleOffset: 0.2, description: "User research and testing" },
};

const TECH_DEPARTMENTS: Record<string, DepartmentConfig> = {
  backend: { name: "Backend Team", angleOffset: -0.25, description: "Backend services and APIs" },
  platform: { name: "Platform Team", angleOffset: 0, description: "Platform and infrastructure code" },
  devops: { name: "DevOps Team", angleOffset: 0.25, description: "CI/CD and deployment" },
};

const DATA_DEPARTMENTS: Record<string, DepartmentConfig> = {
  analytics: { name: "Analytics Team", angleOffset: -0.2, description: "Data analytics and BI" },
  engineering: { name: "Data Engineering", angleOffset: 0, description: "Data pipelines and infrastructure" },
  ml: { name: "ML Team", angleOffset: 0.2, description: "Machine learning and AI" },
};

const OPERATIONS_DEPARTMENTS: Record<string, DepartmentConfig> = {
  support: { name: "Support Team", angleOffset: -0.2, description: "Customer support" },
  infrastructure: { name: "Infrastructure", angleOffset: 0, description: "Cloud and infrastructure" },
  security: { name: "Security Team", angleOffset: 0.2, description: "Security and compliance" },
};

// Domain configuration with colors, positioning, and departments
// CARDINAL LAYOUT: Business LEFT, Product BOTTOM, Data/AI TOP, Tech RIGHT
export const DOMAIN_CONFIG: Record<DomainType, DomainConfig> = {
  business: {
    name: "Business",
    color: "#f97316", // Orange
    accentColor: "#fb923c",
    bgGradient: "from-orange-500 to-amber-600",
    angle: Math.PI, // LEFT (180°) - West
    ringOffset: 1,
    departments: BUSINESS_DEPARTMENTS,
  },
  product: {
    name: "Product",
    color: "#3b82f6", // Blue
    accentColor: "#60a5fa",
    bgGradient: "from-blue-500 to-cyan-600",
    angle: (3 * Math.PI) / 2, // BOTTOM (270°) - South
    ringOffset: 1,
    departments: PRODUCT_DEPARTMENTS,
  },
  tech: {
    name: "Tech",
    color: "#10b981", // Green
    accentColor: "#34d399",
    bgGradient: "from-emerald-500 to-green-600",
    angle: 0, // RIGHT (0°) - East
    ringOffset: 1,
    departments: TECH_DEPARTMENTS,
  },
  "data-ai": {
    name: "Data/AI",
    color: "#8b5cf6", // Violet
    accentColor: "#a78bfa",
    bgGradient: "from-purple-500 to-violet-600",
    angle: Math.PI / 2, // TOP (90°) - North
    ringOffset: 1,
    departments: DATA_DEPARTMENTS,
  },
  operations: {
    name: "Operations",
    color: "#6b7280", // Gray
    accentColor: "#9ca3af",
    bgGradient: "from-gray-500 to-slate-600",
    angle: (5 * Math.PI) / 4, // Southwest (225°) - Between Business & Product
    ringOffset: 1,
    departments: OPERATIONS_DEPARTMENTS,
  },
};

export interface RadialLayoutConfig {
  centerNodeId: string;
  viewMode: "radial" | "process";
  viewportDimensions?: { width: number; height: number };
  dimensions?: NodeDimensionMap;
  padding?: number; // used by process layout spacing
  // Optional external pinned ids to respect during base radial layout
  pinnedIds?: Set<string>;
}

export type NodeDimensionMap = Record<string, { width: number; height: number }>;

const CANONICAL_DOMAIN_ORDER: DomainType[] = [
  "tech",
  "data-ai",
  "business",
  "operations",
  "product",
];

const DOMAIN_FILL_RATIO = 0.82;
const BASE_RING_RADIUS = 420;
const RING_SPACING = 280;
const MIN_RING_RADIUS = 260;
const MIN_RING_SPACING = 220;
const RING_SLOT_COUNTS = [6, 10, 14];

const DEFAULT_NODE_WIDTH = 280;
const DEFAULT_NODE_HEIGHT = 200;
const DEFAULT_CENTER_DIMENSIONS = { width: 360, height: 240 };
const NODE_ARC_GAP = 48;
const RADIAL_JITTER_MAX = 140;

const DEFAULT_DIMENSIONS_BY_TYPE: Record<string, { width: number; height: number }> = {
  center: DEFAULT_CENTER_DIMENSIONS,
};

function parseDimension(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function resolveFallbackDimensions(node: Node): { width: number; height: number } {
  if (node?.type && DEFAULT_DIMENSIONS_BY_TYPE[node.type]) {
    return DEFAULT_DIMENSIONS_BY_TYPE[node.type];
  }
  return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
}

function getNodeDimensions(
  node: Node,
  dimensions?: NodeDimensionMap
): { width: number; height: number } {
  const cached = dimensions?.[node.id];
  const fallback = resolveFallbackDimensions(node);

  const width =
    parseDimension(cached?.width) ??
    parseDimension(node.width) ??
    parseDimension(node.style?.width) ??
    fallback.width;

  const height =
    parseDimension(cached?.height) ??
    parseDimension(node.height) ??
    parseDimension(node.style?.height) ??
    fallback.height;

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function calculateRingRadii(
  ringCount: number,
  viewportDimensions?: { width: number; height: number }
): number[] {
  const baseRadii = Array.from({ length: ringCount }, (_, index) =>
    BASE_RING_RADIUS + index * RING_SPACING
  );

  if (!viewportDimensions) {
    return baseRadii;
  }

  const minAxis = Math.min(
    viewportDimensions.width || 0,
    viewportDimensions.height || 0
  );

  if (!minAxis) {
    return baseRadii;
  }

  const viewportLimit = Math.max(
    MIN_RING_RADIUS + (ringCount - 1) * MIN_RING_SPACING,
    minAxis / 2 - 160
  );

  const maxBaseRadius = baseRadii[baseRadii.length - 1];
  if (maxBaseRadius <= viewportLimit) {
    return baseRadii;
  }

  const scale = viewportLimit / maxBaseRadius;

  return baseRadii.map((radius, index) => {
    const scaled = radius * scale;
    const minimum = MIN_RING_RADIUS + index * MIN_RING_SPACING;
    return Math.max(minimum, Math.round(scaled));
  });
}

function sortNodesForRing(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    const aLabel = String(a?.data?.label || a?.data?.title || a.id || "").toLowerCase();
    const bLabel = String(b?.data?.label || b?.data?.title || b.id || "").toLowerCase();
    return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" });
  });
}

function getBaselineSlotCount(ringIndex: number): number {
  if (ringIndex < RING_SLOT_COUNTS.length) {
    return RING_SLOT_COUNTS[ringIndex];
  }
  const last = RING_SLOT_COUNTS[RING_SLOT_COUNTS.length - 1];
  return last + (ringIndex - (RING_SLOT_COUNTS.length - 1)) * 4;
}

export function applyDomainRadialLayout(
  nodes: Node[],
  config: RadialLayoutConfig
): Node[] {
  const { centerNodeId, viewMode, viewportDimensions, dimensions, padding } = config;

  if (viewMode === "process") {
    return applyProcessLayout(nodes, centerNodeId, dimensions, padding);
  }

  const centerNode = nodes.find((n) => n.id === centerNodeId);
  if (!centerNode) {
    console.warn("Center node not found for layout");
    return nodes;
  }

  const { width: centerWidth, height: centerHeight } = getNodeDimensions(centerNode, dimensions);
  const centerX = centerNode.position.x + centerWidth / 2;
  const centerY = centerNode.position.y + centerHeight / 2;

  // Separate pinned vs movable nodes (only movable will be slotted on rings)
  const dataPinned = new Set(
    nodes
      .filter((n) => n.id !== centerNodeId && (n as any)?.data?.pinned === true)
      .map((n) => n.id)
  );
  const externalPinned = (config as any)?.pinnedIds as Set<string> | undefined;
  const pinnedIds = externalPinned && externalPinned.size > 0
    ? new Set<string>([...Array.from(dataPinned), ...Array.from(externalPinned)])
    : dataPinned;
  const movableNodes = nodes.filter((node) => node.id !== centerNodeId && !pinnedIds.has(node.id));

  if (movableNodes.length === 0) {
    return nodes;
  }

  // Build domain groups using only movable nodes (plus center for reference)
  const domainGroups = groupNodesByDomain([centerNode, ...movableNodes], centerNodeId);
  const activeDomains = CANONICAL_DOMAIN_ORDER.filter(
    (domain) => domainGroups[domain]?.length
  );

  if (activeDomains.length === 0) {
    return nodes;
  }

  const maxRingIndex = movableNodes.reduce((acc, node) => {
    const ring = Number(node?.data?.ring) || 1;
    return ring > acc ? ring : acc;
  }, 1);

  const ringRadii = calculateRingRadii(maxRingIndex, viewportDimensions);

  const canonicalArc = (2 * Math.PI) / CANONICAL_DOMAIN_ORDER.length;
  const domainSweep = canonicalArc * DOMAIN_FILL_RATIO;

  const positions: Record<string, { x: number; y: number }> = {};

  activeDomains.forEach((domain) => {
    const domainNodes = domainGroups[domain];
    if (!domainNodes || domainNodes.length === 0) {
      return;
    }

    const domainConfig = DOMAIN_CONFIG[domain];
    const centerAngle = domainConfig?.angle ?? 0;
    const startAngle = centerAngle - domainSweep / 2;

    const ringMap = groupNodesIntoRings(domainNodes);
    Object.keys(ringMap)
      .map((ringKey) => parseInt(ringKey, 10))
      .filter((ringIndex) => ringIndex >= 1)
      .sort((a, b) => a - b)
      .forEach((ringIndex) => {
        const ringNodes = ringMap[ringIndex] || [];
        if (ringNodes.length === 0) {
          return;
        }

        const sortedNodes = sortNodesForRing(ringNodes);
        const nodeCount = sortedNodes.length;
        const baseRadius = ringRadii[Math.min(ringIndex - 1, ringRadii.length - 1)];

        // Arc-packing: choose radius large enough that sum of exact per-node angular spans fits the sector
  const dims = sortedNodes.map((n) => getNodeDimensions(n, dimensions));
  const minimumRadiusBase = MIN_RING_RADIUS + (ringIndex - 1) * MIN_RING_SPACING;
  // Ensure we don't overlap the center node regardless of angle (conservative: sum of half-diagonals + gap)
  const centerHalfDiag = Math.hypot(centerWidth / 2, centerHeight / 2);
  const nodeMaxHalfDiag = dims.reduce((acc, d) => Math.max(acc, Math.hypot(d.width / 2, d.height / 2)), 0);
  const minClearFromCenter = centerHalfDiag + nodeMaxHalfDiag + Math.max(NODE_ARC_GAP, 24);
  const minimumRadius = Math.max(minimumRadiusBase, Math.ceil(minClearFromCenter));
        const clampRatio = (v: number) => Math.max(0, Math.min(0.999, v));
        const thetaFor = (w: number, r: number) => 2 * Math.asin(clampRatio((w + NODE_ARC_GAP) / (2 * Math.max(1, r))));
        const sumThetaAt = (r: number) => dims.reduce((acc, d) => acc + thetaFor(d.width, r), 0);
        let effectiveRadius = Math.max(baseRadius, minimumRadius);
        // If total required theta exceeds available sweep, increase radius iteratively
        for (let iter = 0; iter < 8; iter++) {
          const totalTheta = sumThetaAt(effectiveRadius);
          if (totalTheta <= domainSweep) break;
          // Multiplicative correction using ratio; add 1px to ensure progress on small radii
          const ratio = totalTheta / Math.max(0.0001, domainSweep);
          effectiveRadius = Math.ceil(effectiveRadius * ratio + 1);
        }

        if (nodeCount === 1) {
          const { width, height } = dims[0];
          const angle = startAngle + domainSweep / 2;
          const x = centerX + effectiveRadius * Math.cos(angle) - width / 2;
          const y = centerY + effectiveRadius * Math.sin(angle) - height / 2;
          positions[sortedNodes[0].id] = { x: Math.round(x), y: Math.round(y) };
          return;
        }

  // Compute per-node angular spans at chosen radius (exact arc)
  const thetas = dims.map((d) => thetaFor(d.width, effectiveRadius));
        const totalTheta = thetas.reduce((a, b) => a + b, 0);
        const spare = Math.max(0, domainSweep - totalTheta);
        const gapPer = spare / nodeCount;

        let cursor = startAngle;
        for (let i = 0; i < nodeCount; i++) {
          const node = sortedNodes[i];
          const { width, height } = dims[i];
          const theta = thetas[i];
          // Center each node in its allocated arc segment (theta + gapPer)
          const angle = cursor + gapPer / 2 + theta / 2;
          const x = centerX + effectiveRadius * Math.cos(angle) - width / 2;
          const y = centerY + effectiveRadius * Math.sin(angle) - height / 2;
          positions[node.id] = { x: Math.round(x), y: Math.round(y) };
          cursor += theta + gapPer;
        }
      });
  });

  const laidOut = nodes.map((node) => {
    if (node.id === centerNodeId) {
      return node;
    }
    // Preserve user-pinned nodes in radial layout
    if ((node as any)?.data?.pinned) {
      return node;
    }
    const next = positions[node.id];
    if (!next) {
      return node;
    }
    return {
      ...node,
      position: { x: Math.round(next.x), y: Math.round(next.y) },
    };
  });
  return laidOut;
}

/**
 * Group nodes by their domain
 */
function groupNodesByDomain(
  nodes: Node[],
  centerNodeId: string
): Record<string, Node[]> {
  const groups: Record<string, Node[]> = {
    business: [],
    product: [],
    tech: [],
    "data-ai": [],
    operations: [],
  };

  nodes.forEach((node) => {
    if (node.id === centerNodeId) return;

    const domain = node.data.domain as DomainType;
    if (domain && groups[domain]) {
      groups[domain].push(node);
    } else {
      // Default grouping based on type if no domain specified
      const type = node.data.type || "default";
      if (type === "frontend" || type === "requirement") {
        groups.product.push(node);
      } else if (type === "backend" || type === "api") {
        groups.tech.push(node);
      } else if (type === "doc") {
        groups.business.push(node);
      } else {
        groups.operations.push(node);
      }
    }
  });

  return groups;
}

/**
 * Group nodes by department within a domain
 */
function groupNodesByDepartment(
  nodes: Node[],
  domainConfig: DomainConfig
): Record<string, Node[]> {
  const groups: Record<string, Node[]> = {};

  // Initialize groups for each department
  Object.keys(domainConfig.departments).forEach((deptKey) => {
    groups[deptKey] = [];
  });

  // Add default group for nodes without department
  groups["default"] = [];

  nodes.forEach((node) => {
    const department = node.data.department as string;
    if (department && groups[department]) {
      groups[department].push(node);
    } else {
      // If no department specified, try to infer from type
      const inferredDept = inferDepartmentFromType(
        node.data.type || "default",
        domainConfig
      );
      if (inferredDept && groups[inferredDept]) {
        groups[inferredDept].push(node);
      } else {
        groups["default"].push(node);
      }
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

/**
 * Infer department from node type
 */
function inferDepartmentFromType(
  type: string,
  domainConfig: DomainConfig
): string | null {
  // Type to department mapping by domain
  const typeMapping: Record<string, Record<string, string>> = {
    tech: {
      backend: "backend",
      api: "backend",
      database: "backend",
      frontend: "frontend",
      infrastructure: "devops",
      devops: "devops",
      platform: "platform",
    },
    product: {
      frontend: "frontend",
      design: "design",
      ui: "design",
      ux: "design",
      research: "research",
    },
    business: {
      requirement: "requirements",
      doc: "requirements",
      strategy: "strategy",
      stakeholder: "stakeholders",
    },
    "data-ai": {
      analytics: "analytics",
      ml: "ml",
      ai: "ml",
      database: "engineering",
      pipeline: "engineering",
    },
    operations: {
      support: "support",
      infrastructure: "infrastructure",
      security: "security",
      monitoring: "infrastructure",
    },
  };

  const domainName = Object.keys(DOMAIN_CONFIG).find(
    (key) => DOMAIN_CONFIG[key as DomainType] === domainConfig
  );

  if (domainName && typeMapping[domainName]) {
    return typeMapping[domainName][type] || null;
  }

  return null;
}

/**
 * Group nodes into rings based on their ring metadata or default
 */
function groupNodesIntoRings(nodes: Node[]): Record<number, Node[]> {
  const rings: Record<number, Node[]> = {};

  nodes.forEach((node) => {
    const ring = node.data.ring || 1; // Default to ring 1
    if (!rings[ring]) {
      rings[ring] = [];
    }
    rings[ring].push(node);
  });

  return rings;
}

/**
 * Apply linear process layout (left-to-right)
 */
function applyProcessLayout(
  nodes: Node[],
  centerNodeId: string,
  dimensions?: NodeDimensionMap,
  padding: number = 12
): Node[] {
  const centerNode = nodes.find((n) => n.id === centerNodeId);
  if (!centerNode) return nodes;

  // Respect user-pinned nodes in process layout as well
  const isPinned = (n: Node) => Boolean((n as any)?.data?.pinned === true);

  const movable = nodes.filter((n) => n.id !== centerNodeId && !isPinned(n));
  if (movable.length === 0) return nodes;

  const { width: centerWidth, height: centerHeight } = getNodeDimensions(centerNode, dimensions);
  const centerX = centerNode.position.x + centerWidth / 2;
  const centerY = centerNode.position.y + centerHeight / 2;

  // Measure a typical node for spacing heuristics
  const sampleDims = movable.map((n) => getNodeDimensions(n, dimensions));
  const avgWidth = sampleDims.reduce((s, d) => s + d.width, 0) / Math.max(1, sampleDims.length);
  const avgHeight = sampleDims.reduce((s, d) => s + d.height, 0) / Math.max(1, sampleDims.length);

  const horizontalGap = Math.max(96, Math.min(280, Math.round(avgWidth * 0.35) + padding));
  const verticalGap = Math.max(56, Math.min(200, Math.round(avgHeight * 0.20) + padding));

  // Infer a coarse role for lane grouping
  type Lane = "policies" | "requirements" | "services" | "data" | "docs" | "other";
  const roleOf = (n: Node): Lane => {
    const t = String(n?.data?.type || "").toLowerCase();
    const label = String(n?.data?.label || n?.data?.title || n.id).toLowerCase();
    const has = (re: RegExp) => re.test(t) || re.test(label);
    if (has(/policy|polic(y|ies)/)) return "policies";
    if (has(/requirement|spec|acceptance/)) return "requirements";
    if (has(/database|db|storage|cache|queue|topic|warehouse|data/)) return "data";
    if (has(/doc|documentation|note|audit|readme/)) return "docs";
    if (has(/service|backend|frontend|api|integration|session|provider|gateway|rate/)) return "services";
    return "other";
  };

  // Assign nodes into lanes
  const lanesOrder: Lane[] = ["policies", "requirements", "services", "data", "docs", "other"];
  const laneNodes: Record<Lane, Node[]> = {
    policies: [],
    requirements: [],
    services: [],
    data: [],
    docs: [],
    other: [],
  };
  movable.forEach((n) => laneNodes[roleOf(n)].push(n));

  // Precompute base X for each lane to create a left-to-right flow
  // Root near the left; requirements next to root; services further; data furthest; policies align with requirements; docs align with services
  const baseXByLane: Record<Lane, number> = {
    policies: Math.round(centerX + centerWidth / 2 + horizontalGap),
    requirements: Math.round(centerX + centerWidth / 2 + horizontalGap),
    services: Math.round(centerX + centerWidth / 2 + horizontalGap * 2),
    data: Math.round(centerX + centerWidth / 2 + horizontalGap * 3),
    docs: Math.round(centerX + centerWidth / 2 + horizontalGap * 2.5),
    other: Math.round(centerX + centerWidth / 2 + horizontalGap * 2),
  };

  // Baselines: policies at top, then requirements, services (center line), data, docs
  const baselineByLane: Record<Lane, number> = {
    policies: Math.round(centerY - verticalGap * 2),
    requirements: Math.round(centerY - verticalGap),
    services: Math.round(centerY),
    data: Math.round(centerY + verticalGap),
    docs: Math.round(centerY + verticalGap * 2),
    other: Math.round(centerY + verticalGap),
  };

  // Within each lane, stack nodes vertically around the baseline with consistent spacing
  const positions: Record<string, { x: number; y: number }> = {};
  lanesOrder.forEach((lane) => {
    const list = laneNodes[lane];
    if (!list.length) return;
    const bx = baseXByLane[lane];
    // Sort to keep deterministic placement (by label)
    const sorted = sortNodesForRing(list);
    const centerIndex = (sorted.length - 1) / 2;
    sorted.forEach((n, i) => {
      const dims = getNodeDimensions(n, dimensions);
      const offsetIndex = i - centerIndex;
      const x = bx - Math.round(dims.width / 2);
      const y = baselineByLane[lane] + Math.round(offsetIndex * (dims.height + Math.max(32, verticalGap - 16)));
      positions[n.id] = { x, y };
    });
  });

  // Apply positions for movable nodes; keep center and pinned untouched
  const result = nodes.map((node) => {
    if (node.id === centerNodeId) return node;
    if (isPinned(node)) return node;
    const next = positions[node.id];
    if (!next) return node;
    return { ...node, position: { x: Math.round(next.x), y: Math.round(next.y) } };
  });

  return result;
}

/**
 * Get domain info for a node type
 */
export function getDomainForNodeType(type: string): DomainType {
  const typeMapping: Record<string, DomainType> = {
    frontend: "product",
    backend: "tech",
    api: "tech",
    database: "data-ai",
    infrastructure: "operations",
    requirement: "product",
    doc: "business",
    design: "product",
    root: "business",
  };

  return typeMapping[type] || "operations";
}

/**
 * Get recommended domain for new nodes based on context
 */
export function getRecommendedDomain(
  existingNodes: Node[],
  nodeType?: string
): DomainType {
  if (nodeType) {
    return getDomainForNodeType(nodeType);
  }

  // Count nodes in each domain
  const domainCounts: Record<DomainType, number> = {
    business: 0,
    product: 0,
    tech: 0,
    "data-ai": 0,
    operations: 0,
  };

  existingNodes.forEach((node) => {
    const domain = node.data.domain as DomainType;
    if (domain && domainCounts[domain] !== undefined) {
      domainCounts[domain]++;
    }
  });

  // Return least populated domain
  return (Object.keys(domainCounts) as DomainType[]).reduce((min, domain) =>
    domainCounts[domain] < domainCounts[min] ? domain : min
  );
}

/**
 * Get departments for a specific domain
 */
export function getDepartmentsForDomain(
  domain: DomainType
): Record<string, DepartmentConfig> {
  return DOMAIN_CONFIG[domain]?.departments || {};
}

/**
 * Get recommended department for a node type within a domain
 */
export function getRecommendedDepartment(
  domain: DomainType,
  nodeType?: string
): string | null {
  const domainConfig = DOMAIN_CONFIG[domain];
  if (!domainConfig) return null;

  if (nodeType) {
    return inferDepartmentFromType(nodeType, domainConfig);
  }

  // Default to first department
  const deptKeys = Object.keys(domainConfig.departments);
  return deptKeys.length > 0 ? deptKeys[0] : null;
}

/**
 * Calculate optimal position for a new node around the center
 */
export function calculateNewNodePosition(
  existingNodes: Node[],
  centerNodeId: string,
  nodeData: { domain?: string; type?: string; ring?: number }
): { x: number; y: number } {
  const centerNode = existingNodes.find(n => n.id === centerNodeId);
  
  // Default position if no center node
  if (!centerNode) {
    return {
      x: Math.random() * 300 + 400,
      y: Math.random() * 200 + 250
    };
  }

  const { width: centerWidth, height: centerHeight } = getNodeDimensions(centerNode);
  const centerX = centerNode.position.x + centerWidth / 2;
  const centerY = centerNode.position.y + centerHeight / 2;

  // Determine domain and ring
  const domain = nodeData.domain || getDomainForNodeType(nodeData.type || "default");
  const ring = Math.max(1, nodeData.ring || 1);

  const nodeWidth = DEFAULT_NODE_WIDTH;
  const nodeHeight = DEFAULT_NODE_HEIGHT;
  const halfWidth = nodeWidth / 2;
  const halfHeight = nodeHeight / 2;

  const domainConfig = DOMAIN_CONFIG[domain as DomainType];
  const domainAngle = domainConfig?.angle ?? 0;
  const ringRadii = calculateRingRadii(ring, undefined);
  const radius = ringRadii[Math.min(ring - 1, ringRadii.length - 1)];

  const domainArc = (2 * Math.PI) / CANONICAL_DOMAIN_ORDER.length;
  const sweep = domainArc * DOMAIN_FILL_RATIO;
  const slotCount = Math.max(getBaselineSlotCount(ring - 1), 4);
  const slotArc = sweep / slotCount;
  const startAngle = domainAngle - sweep / 2;

  const candidateAngles = Array.from({ length: slotCount }, (_, index) =>
    startAngle + slotArc / 2 + index * slotArc
  );

  let bestAngle = domainAngle;
  let bestDistance = -Infinity;

  const otherNodes = existingNodes.filter((node) => node.id !== centerNodeId);

  candidateAngles.forEach((angle) => {
    const testX = centerX + radius * Math.cos(angle) - halfWidth;
    const testY = centerY + radius * Math.sin(angle) - halfHeight;

    const minDistance = otherNodes.reduce((acc, node) => {
      const dx = testX - node.position.x;
      const dy = testY - node.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return Math.min(acc, distance);
    }, Infinity);

    if (minDistance > bestDistance) {
      bestDistance = minDistance;
      bestAngle = angle;
    }
  });

  const x = centerX + radius * Math.cos(bestAngle) - halfWidth;
  const y = centerY + radius * Math.sin(bestAngle) - halfHeight;

  return { x, y };
}

/**
 * Get all domain and department combinations for UI dropdowns
 */
export function getAllDomainDepartmentOptions(): Array<{
  domain: DomainType;
  domainName: string;
  department: string;
  departmentName: string;
  color: string;
}> {
  const options: Array<{
    domain: DomainType;
    domainName: string;
    department: string;
    departmentName: string;
    color: string;
  }> = [];

  (Object.keys(DOMAIN_CONFIG) as DomainType[]).forEach((domain) => {
    const config = DOMAIN_CONFIG[domain];
    Object.entries(config.departments).forEach(([deptKey, deptConfig]) => {
      options.push({
        domain,
        domainName: config.name,
        department: deptKey,
        departmentName: deptConfig.name,
        color: config.color,
      });
    });
  });

  return options;
}
