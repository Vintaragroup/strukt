// @ts-nocheck
import type { Node, Edge } from "@xyflow/react";
import { detectRecipe, matchColumnForNode } from "../config/layoutRecipes";
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
  // Optional graph edges to enable context-aware process layout
  edges?: Edge[];
  // Enable/disable recipe-driven placement in process view
  recipeEnabled?: boolean;
  // Choose layout algorithm for radial mode: "domain" (default) or "relationship"
  radialAlgorithm?: "domain" | "relationship";
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
// Increased ring spacing (user requested doubling distance between rings)
const RING_SPACING = 560;
const MIN_RING_RADIUS = 260;
const MIN_RING_SPACING = 440;
const RING_SLOT_COUNTS = [6, 10, 14];

const DEFAULT_NODE_WIDTH = 280;
const DEFAULT_NODE_HEIGHT = 200;
const DEFAULT_CENTER_DIMENSIONS = { width: 360, height: 240 };
// Increase per-node arc gap to reduce within-ring overlap
const NODE_ARC_GAP = 64;
// const RADIAL_JITTER_MAX = 140; // Legacy jitter constant retained for potential future organic spacing feature

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
  const { centerNodeId, viewMode, viewportDimensions, dimensions, padding, edges } = config;

  if (viewMode === "process") {
    return applyProcessLayout(
      nodes,
      centerNodeId,
      dimensions,
      padding,
      edges,
      config?.recipeEnabled !== false // default true
    );
  }

  // For radial mode, choose between domain-based and relationship-based algorithms
  const algorithm = config.radialAlgorithm || "domain";
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[layout] applyDomainRadialLayout mode=radial algorithm=', algorithm);
  }
  
  if (algorithm === "relationship" && edges) {
    // Use new relationship-driven polar coordinate layout
    return applyRelativePolarLayout(nodes, edges, {
      ...config,
      conflictOffsetPx: 30,
      // Expanded ring spacing per user request (doubling distance between rings)
      firstRingRadiusPx: 560,
      ringIncrementPx: 520,
    });
  }

  // Default to existing domain-based radial layout
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
  // Normalize hierarchical IDs (Option A) for domain-based layout to ensure unique sibling IDs.
  return normalizeHierarchicalIdsPostLayout(laidOut, centerNodeId);
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
// function groupNodesByDepartment(...) DEPRECATED - department-based domain sub-grouping not used in new layout.

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
  padding: number = 12,
  edges?: Edge[],
  recipeEnabled: boolean = true
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

  // Spread lanes further apart to reduce cross-lane collisions
  const horizontalGap = Math.max(144, Math.min(360, Math.round(avgWidth * 0.55) + padding));
  const verticalGap = Math.max(96, Math.min(280, Math.round(avgHeight * 0.35) + padding));

  // 1) Try recipe-driven placement first (for curated arrangements like Image 1)
  const recipe = recipeEnabled ? detectRecipe(movable) : null;
  const positions: Record<string, { x: number; y: number }> = {};
  if (recipe) {
    // Compute ordered column x positions from recipe spacing (multipliers of horizontalGap)
    const spacing = recipe.spacing && recipe.spacing.length
      ? recipe.spacing
      : Array.from({ length: recipe.columns.length }, (_, i) => 1.25 + i);
    const baselines = recipe.baselines && recipe.baselines.length
      ? recipe.baselines
      : Array.from({ length: recipe.columns.length }, (_, i) => -1 + i * 1.0);

    const colX: number[] = spacing.map((m) => Math.round(centerX + centerWidth / 2 + horizontalGap * m));
    const colYBase: number[] = baselines.map((m) => Math.round(centerY + verticalGap * m));

    // Track which nodes are placed
    const placed = new Set<string>();

    recipe.columns.forEach((col, idx) => {
      // Select nodes matching this column that are not yet placed
      const matched = movable.filter((n) => !placed.has(n.id) && matchColumnForNode(n, col));
      if (!matched.length) return;

      // If explicit order provided, sort by that; otherwise fall back to deterministic label sort
      let ordered = [...matched];
      if (col.order && col.order.length) {
        const orderRegexes = col.order.map((s) => new RegExp(String(s), "i"));
        const scoreFor = (label: string) => {
          for (let i = 0; i < orderRegexes.length; i++) {
            if (orderRegexes[i].test(label)) return i;
          }
          return Number.POSITIVE_INFINITY;
        };
        ordered.sort((a, b) => {
          const la = String(a?.data?.label || a?.data?.title || a.id);
          const lb = String(b?.data?.label || b?.data?.title || b.id);
          const sa = scoreFor(la);
          const sb = scoreFor(lb);
          if (sa !== sb) return sa - sb;
          return la.localeCompare(lb, undefined, { sensitivity: "base" });
        });
      } else {
        ordered = sortNodesForRing(matched);
      }

      const bx = colX[idx];
      const by = colYBase[idx];
      const maxRows = Math.max(1, col.maxRows ?? 4);
      const needCols = Math.max(1, Math.min(2, Math.ceil(ordered.length / maxRows)));

      // Determine safe inner column step to avoid colliding with next column
      const nextBx = idx < colX.length - 1 ? colX[idx + 1] : Number.POSITIVE_INFINITY;
      const conservativeInner = Math.max(Math.round(avgWidth * 1.2), Math.round(horizontalGap * 0.75));
      const maxInner = Number.isFinite(nextBx) ? Math.max(0, Math.round(nextBx - bx - avgWidth - 64)) : conservativeInner;
      const innerStep = Math.min(conservativeInner, maxInner);

      // Place nodes in up to two sub-columns
      if (needCols === 1) {
        const centerIndex = (ordered.length - 1) / 2;
        ordered.forEach((n, i) => {
          const dims = getNodeDimensions(n, dimensions);
          const offsetIndex = i - centerIndex;
          const stepY = dims.height + Math.max(64, verticalGap - 8);
          const x = bx - Math.round(dims.width / 2);
          const y = by + Math.round(offsetIndex * stepY);
          positions[n.id] = { x, y };
          placed.add(n.id);
        });
      } else {
        const colCount = 2;
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
          const start = colIdx * maxRows;
          const end = Math.min(ordered.length, start + maxRows);
          const slice = ordered.slice(start, end);
          if (!slice.length) continue;
          const rows = slice.length;
          const centerIndex = (rows - 1) / 2;
          slice.forEach((n, r) => {
            const dims = getNodeDimensions(n, dimensions);
            const stepY = dims.height + Math.max(64, verticalGap - 8);
            const x = bx - Math.round(dims.width / 2) + colIdx * innerStep;
            const y = by + Math.round((r - centerIndex) * stepY);
            positions[n.id] = { x, y };
            placed.add(n.id);
          });
        }
      }
    });

    // Fallback: any remaining movable nodes placed in a generic trailing column
    const remaining = movable.filter((n) => !placed.has(n.id));
    if (remaining.length) {
      const bx = (colX[colX.length - 1] || Math.round(centerX + centerWidth / 2 + horizontalGap * (recipe.columns.length + 1.5)));
      const by = Math.round(centerY + verticalGap * 1.25);
      const sorted = sortNodesForRing(remaining);
      const centerIndex = (sorted.length - 1) / 2;
      sorted.forEach((n, i) => {
        const dims = getNodeDimensions(n, dimensions);
        const offsetIndex = i - centerIndex;
        const stepY = dims.height + Math.max(64, verticalGap - 8);
        const x = bx - Math.round(dims.width / 2);
        const y = by + Math.round(offsetIndex * stepY);
        positions[n.id] = { x, y };
      });
    }
  }

  // Infer a coarse role for lane grouping
  // type Lane = "policies" | "requirements" | "services" | "data" | "docs" | "other";
  // roleOf helper retained for potential future lane-aware process refinement (currently unused)

  // If recipe placement happened, skip the lane grouping and just map positions
  if (Object.keys(positions).length) {
    const resultWithRecipe = nodes.map((node) => {
      if (node.id === centerNodeId) return node;
      if (isPinned(node)) return node;
      const next = positions[node.id];
      if (!next) return node;
      return { ...node, position: { x: Math.round(next.x), y: Math.round(next.y) } };
    });
    return resultWithRecipe;
  }

  // Graph-aware fallback: build levels from edges and order by barycenter
  const usableEdges = Array.isArray(edges) ? edges : [];
  // Build adjacency (undirected for robustness)
  const nodeIds = new Set(movable.map((n) => n.id));
  const neighbors: Record<string, Set<string>> = {};
  movable.forEach((n) => (neighbors[n.id] = new Set()));
  usableEdges.forEach((e) => {
    const a = e.source as string;
    const b = e.target as string;
    if (nodeIds.has(a) && nodeIds.has(b)) {
      neighbors[a].add(b);
      neighbors[b].add(a);
    }
  });

  // BFS from center to compute distance levels (ignore pinned/center itself)
  const dist: Record<string, number> = {};
  const q: string[] = [];
  // Seed with direct neighbors of center (treat center edges if present)
  const centerNeighbors = new Set<string>();
  usableEdges.forEach((e) => {
    if (e.source === centerNodeId && nodeIds.has(e.target as string)) centerNeighbors.add(e.target as string);
    if (e.target === centerNodeId && nodeIds.has(e.source as string)) centerNeighbors.add(e.source as string);
  });
  if (centerNeighbors.size === 0) {
    // Fallback: start with all nodes at level 1
    movable.forEach((n) => { dist[n.id] = 1; q.push(n.id); });
  } else {
    centerNeighbors.forEach((id) => { dist[id] = 1; q.push(id); });
  }
  while (q.length) {
    const u = q.shift()!;
    const du = dist[u] || 1;
    (neighbors[u] || new Set()).forEach((v) => {
      if (dist[v] == null) {
        dist[v] = du + 1;
        q.push(v);
      }
    });
  }
  // Unreached nodes -> place after max level
  const maxLevel = Object.values(dist).reduce((a, b) => Math.max(a, b), 1);
  movable.forEach((n) => { if (dist[n.id] == null) dist[n.id] = maxLevel + 1; });

  // Group into columns by level
  const byLevel: Record<number, Node[]> = {};
  movable.forEach((n) => {
    const d = Math.max(1, dist[n.id] || 1);
    (byLevel[d] ||= []).push(n);
  });

  // Order within columns using barycentric method (Sugiyama-style)
  const levels = Object.keys(byLevel).map((k) => parseInt(k, 10)).sort((a, b) => a - b);
  // Initial order: label sort
  levels.forEach((L) => { byLevel[L] = sortNodesForRing(byLevel[L]); });
  const indexIn = (arr: Node[]) => Object.fromEntries(arr.map((n, i) => [n.id, i]));
  const sweeps = 2;
  for (let s = 0; s < sweeps; s++) {
    // Left-to-right: align with previous level
    for (let i = 1; i < levels.length; i++) {
      const prev = byLevel[levels[i - 1]];
      const curr = byLevel[levels[i]];
      const prevIndex = indexIn(prev);
      curr.sort((a, b) => {
        const na = Array.from(neighbors[a.id] || []);
        const nb = Array.from(neighbors[b.id] || []);
        const baryA = na.length ? na.reduce((sum, id) => sum + (prevIndex[id] ?? 0), 0) / na.length : 0;
        const baryB = nb.length ? nb.reduce((sum, id) => sum + (prevIndex[id] ?? 0), 0) / nb.length : 0;
        if (baryA !== baryB) return baryA - baryB;
        const la = String(a?.data?.label || a?.data?.title || a.id);
        const lb = String(b?.data?.label || b?.data?.title || b.id);
        return la.localeCompare(lb, undefined, { sensitivity: 'base' });
      });
    }
    // Right-to-left: align with next level
    for (let i = levels.length - 2; i >= 0; i--) {
      const next = byLevel[levels[i + 1]];
      const curr = byLevel[levels[i]];
      const nextIndex = indexIn(next);
      curr.sort((a, b) => {
        const na = Array.from(neighbors[a.id] || []);
        const nb = Array.from(neighbors[b.id] || []);
        const baryA = na.length ? na.reduce((sum, id) => sum + (nextIndex[id] ?? 0), 0) / na.length : 0;
        const baryB = nb.length ? nb.reduce((sum, id) => sum + (nextIndex[id] ?? 0), 0) / nb.length : 0;
        if (baryA !== baryB) return baryA - baryB;
        const la = String(a?.data?.label || a?.data?.title || a.id);
        const lb = String(b?.data?.label || b?.data?.title || b.id);
        return la.localeCompare(lb, undefined, { sensitivity: 'base' });
      });
    }
  }

  // Compute X for each level and place nodes with centered vertical stack
  const positionsMap: Record<string, { x: number; y: number }> = {};
  levels.forEach((L, i) => {
    const bx = Math.round(centerX + centerWidth / 2 + horizontalGap * (i + 1));
    const list = byLevel[L];
    const centerIndex = (list.length - 1) / 2;
    list.forEach((n, idx) => {
      const dims = getNodeDimensions(n, dimensions);
      const stepY = dims.height + Math.max(64, verticalGap - 8);
      const x = bx - Math.round(dims.width / 2);
      const y = centerY + Math.round((idx - centerIndex) * stepY);
      positionsMap[n.id] = { x, y };
    });
  });

  const result = nodes.map((node) => {
    if (node.id === centerNodeId) return node;
    if (isPinned(node)) return node;
    const next = positionsMap[node.id];
    if (!next) return node;
    return { ...node, position: { x: Math.round(next.x), y: Math.round(next.y) } };
  });
  if (process.env.NODE_ENV !== 'production') {
    try {
      const dbg = result
        .filter((n) => n.id !== centerNodeId)
        .map((n) => ({ id: n.id, hierId: (n as any)?.data?.hierId, ring: (n as any)?.data?.ring, parent: hierarchy[n.id]?.parent || centerNodeId }));
      console.debug('[layout] lineage summary', dbg);
    } catch (e) {
      // Silently ignore lineage debug summarization failures; layout proceeds regardless.
    }
  }
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

// ========================
// RELATIVE POLAR LAYOUT
// ========================

export interface RelativePolarLayoutConfig extends RadialLayoutConfig {
  conflictOffsetPx?: number; // Default 30px radial offset for conflicts
  // Optional tuning knobs for relationship-driven radial layout
  firstRingRadiusPx?: number; // Absolute pixel radius for ring 1 (default computed)
  ringIncrementPx?: number;   // Pixels added per additional ring (default 240)
  childClusterBaseSpreadRad?: number;    // Base angular spread for 2-child case (radians)
  childClusterIncrementRad?: number;     // Additional spread per extra sibling beyond 2 (radians)
  childClusterMaxSpreadRad?: number;     // Max cap for child cluster spread
}

interface HierarchyNode {
  id: string;
  node: Node;
  parent: string | null;
  children: string[];
  distanceFromCenter: number; // Shortest path distance (BFS levels)
  radiusFromCenter: number; // Actual pixel distance from center
}

/**
 * Apply relationship-driven relative polar coordinate layout
 * Uses parent→child relationships with relative angle calculations
 */
export function applyRelativePolarLayout(
  nodes: Node[],
  edges: Edge[],
  config: RelativePolarLayoutConfig
): Node[] {
  const { centerNodeId, dimensions, conflictOffsetPx = 30 } = config;
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[layout] applyRelativePolarLayout: relationship algorithm active');
  }
  
  const centerNode = nodes.find((n) => n.id === centerNodeId);
  if (!centerNode) {
    console.warn("Center node not found for relative polar layout");
    return nodes;
  }

  const { width: centerWidth, height: centerHeight } = getNodeDimensions(centerNode, dimensions);
  const centerX = centerNode.position.x + centerWidth / 2;
  const centerY = centerNode.position.y + centerHeight / 2;

  // Respect pinned nodes
  const pinnedIds = new Set(
    nodes
      .filter((n) => n.id !== centerNodeId && (n as any)?.data?.pinned === true)
      .map((n) => n.id)
  );
  const movableNodes = nodes.filter((node) => node.id !== centerNodeId && !pinnedIds.has(node.id));

  if (movableNodes.length === 0) {
    return nodes;
  }

  // 1. Build hierarchy tree using BFS from center node
  const hierarchy = buildHierarchyTree(movableNodes, edges, centerNodeId);

  // 2. Calculate positions using relative polar coordinates
  const positions = calculateRelativePolarPositions(
    hierarchy, 
    { centerX, centerY, centerWidth, centerHeight },
    dimensions,
    {
      conflictOffsetPx,
      firstRingRadiusPx: config.firstRingRadiusPx,
      ringIncrementPx: config.ringIncrementPx,
      childClusterBaseSpreadRad: config.childClusterBaseSpreadRad,
      childClusterIncrementRad: config.childClusterIncrementRad,
      childClusterMaxSpreadRad: config.childClusterMaxSpreadRad,
    }
  );

  // 2b. Assign hierarchical IDs (Option A lineage) for any nodes missing them.
  //     Preserve existing data.hierId set during creation flows.
  const hierIdMap = assignLineageHierarchicalIds(hierarchy, centerNodeId);

  // 3. Apply positions to nodes
  const result = nodes.map((node) => {
    if (node.id === centerNodeId || pinnedIds.has(node.id)) {
      // Center uses ring 0 and hierId "0" per requested scheme
      return {
        ...node,
        data: {
          ...(node.data || {}),
          ring: 0,
          hierId: '0',
        }
      };
    }
    const newPos = positions[node.id];
    if (!newPos) return node;
    
    const data: any = (node as any).data || {};
    const hasExplicit = Boolean(data.explicitRing && typeof data.ring === 'number');
    const computedDist = hierarchy[node.id]?.distanceFromCenter;
    return {
      ...node,
      position: { x: Math.round(newPos.x), y: Math.round(newPos.y) },
      data: {
        ...data,
        ring: hasExplicit ? data.ring : (data.hierId != null ? (data.ring ?? computedDist) : (computedDist ?? data.ring)),
        hierId: data.hierId ?? hierIdMap[node.id],
      }
    };
  });

  return result;
}

/**
 * Derive hierarchical identifiers like "2", "3" for first ring and
 * "2.1", "2.2" for children, without mutating node.id. Returns map id->hierId.
 */
function assignLineageHierarchicalIds(
  hierarchy: Record<string, HierarchyNode>,
  centerNodeId: string
): Record<string, string | undefined> {
  // Group by effective ring: explicit ring override (explicitRing flag) else BFS distance
  const ringGroups: Record<number, string[]> = {};
  Object.values(hierarchy).forEach(h => {
    if (h.id === centerNodeId) return;
    const data: any = h.node?.data || {};
    const ringOverride = (data.explicitRing && typeof data.ring === 'number') ? data.ring : undefined;
    const effectiveRing = ringOverride ?? h.distanceFromCenter;
    if (!Number.isFinite(effectiveRing) || effectiveRing <= 0) return;
    (ringGroups[effectiveRing] ||= []).push(h.id);
  });
  const hierIdMap: Record<string, string | undefined> = { [centerNodeId]: '0' };
  Object.entries(ringGroups).forEach(([ringStr, ids]) => {
    const ring = parseInt(ringStr, 10);
    const sorted = ids.slice().sort((a, b) => {
      const la = String(hierarchy[a]?.node?.data?.label || a).toLowerCase();
      const lb = String(hierarchy[b]?.node?.data?.label || b).toLowerCase();
      return la.localeCompare(lb);
    });
    sorted.forEach((id, index) => {
      hierIdMap[id] = index === 0 ? String(ring) : `${ring}.${index + 1}`;
    });
  });
  return hierIdMap;
}

/**
 * Post-layout hierarchical ID normalization for domain-based radial layout.
 * Ensures siblings sharing the same parent and ring follow Option A:
 * first sibling gets plain ring number (e.g. 2), subsequent siblings get ring.suffix (2.2, 2.3, ...).
 */
function normalizeHierarchicalIdsPostLayout(nodes: Node[], centerNodeId: string): Node[] {
  const ringGroups: Record<number, Node[]> = {};
  nodes.forEach(n => {
    if (n.id === centerNodeId) return;
    const ring = typeof (n as any)?.data?.ring === 'number' ? (n as any).data.ring : undefined;
    if (ring == null || ring <= 0) return;
    (ringGroups[ring] ||= []).push(n);
  });
  const assignments: Record<string, string> = { [centerNodeId]: '0' };
  Object.entries(ringGroups).forEach(([ringStr, siblings]) => {
    const ring = parseInt(ringStr, 10);
    const sorted = siblings.slice().sort((a, b) => {
      const la = String((a as any)?.data?.label || a.id).toLowerCase();
      const lb = String((b as any)?.data?.label || b.id).toLowerCase();
      return la.localeCompare(lb);
    });
    sorted.forEach((node, idx) => {
      assignments[node.id] = idx === 0 ? String(ring) : `${ring}.${idx + 1}`;
    });
  });
  return nodes.map(n => assignments[n.id] ? { ...n, data: { ...(n.data || {}), hierId: assignments[n.id] } } : n);
}

/**
 * Build parent→child hierarchy tree using BFS traversal from center node
 */
function buildHierarchyTree(
  nodes: Node[],
  edges: Edge[],
  centerNodeId: string
): Record<string, HierarchyNode> {
  const hierarchy: Record<string, HierarchyNode> = {};
  
  // Initialize all nodes in hierarchy
  nodes.forEach(node => {
    hierarchy[node.id] = {
      id: node.id,
      node: node,
      parent: null,
      children: [],
      distanceFromCenter: Infinity,
      radiusFromCenter: 0,
    };
  });

  // Build adjacency list from edges (parent → child direction)
  const outgoing: Record<string, string[]> = {}; // node → children
  const incoming: Record<string, string[]> = {}; // node → parents
  
  // Initialize adjacency lists
  [centerNodeId, ...nodes.map(n => n.id)].forEach(id => {
    outgoing[id] = [];
    incoming[id] = [];
  });

  edges.forEach(edge => {
    const source = edge.source;
    const target = edge.target;
    // Treat as undirected for depth so reverse-only edges still influence distance; we still retain direction
    outgoing[source] = outgoing[source] || [];
    outgoing[source].push(target);
    outgoing[target] = outgoing[target] || [];
    outgoing[target].push(source);
    incoming[target] = incoming[target] || [];
    incoming[target].push(source);
    incoming[source] = incoming[source] || [];
    incoming[source].push(target);
  });

  // Seed explicit parent/child relations from node.data.parentId when available
  const visited = new Set<string>();
  nodes.forEach((node) => {
    const data: any = node.data || {};
    const parentId: string | null | undefined = data.parentId;
  const explicitRing: number | undefined = (data.explicitRing && typeof data.ring === 'number') ? data.ring : undefined;
    if (parentId) {
      if (hierarchy[node.id]) {
        hierarchy[node.id].parent = parentId;
        if (typeof explicitRing === 'number' && Number.isFinite(explicitRing)) {
          hierarchy[node.id].distanceFromCenter = Math.max(1, explicitRing);
        }
      }
      if (hierarchy[parentId]) {
        hierarchy[parentId].children.push(node.id);
      }
      // Mark as visited so BFS doesn't override explicit lineage
      visited.add(node.id);
    }
  });

  // BFS from center to establish remaining hierarchy and distances
  const queue: { nodeId: string; distance: number; parentId: string | null }[] = [
    { nodeId: centerNodeId, distance: 0, parentId: null }
  ];
  
  while (queue.length > 0) {
    const { nodeId, distance, parentId } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Skip if this is center node (not in our movable nodes)
    if (nodeId !== centerNodeId && hierarchy[nodeId]) {
      hierarchy[nodeId].distanceFromCenter = distance;
      hierarchy[nodeId].parent = parentId;
      
      // Add to parent's children list
      if (parentId && hierarchy[parentId]) {
        hierarchy[parentId].children.push(nodeId);
      }
    }
    
    // Add children to queue (outgoing edges from this node)
    const children = outgoing[nodeId] || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ 
          nodeId: childId, 
          distance: distance + 1, 
          parentId: nodeId === centerNodeId ? null : nodeId 
        });
      }
    });
  }
  
  // Handle unconnected nodes - place them at distance 1 from center
  nodes.forEach(node => {
    if (hierarchy[node.id].distanceFromCenter === Infinity) {
      hierarchy[node.id].distanceFromCenter = 1;
      hierarchy[node.id].parent = null; // No specific parent, will cluster around center
    }
  });

  return hierarchy;
}

/**
 * Calculate relative polar coordinates for all nodes
 */
function calculateRelativePolarPositions(
  hierarchy: Record<string, HierarchyNode>,
  center: { centerX: number; centerY: number; centerWidth: number; centerHeight: number },
  dimensions?: NodeDimensionMap,
  tuning?: {
    conflictOffsetPx?: number;
    firstRingRadiusPx?: number;
    ringIncrementPx?: number;
    childClusterBaseSpreadRad?: number;
    childClusterIncrementRad?: number;
    childClusterMaxSpreadRad?: number;
  }
): Record<string, { x: number; y: number }> {
  const { centerX, centerY, centerWidth, centerHeight } = center;
  const positions: Record<string, { x: number; y: number }> = {};
  const conflictOffsetPx = tuning?.conflictOffsetPx ?? 30;
  
  // Group nodes by distance level for processing
  const nodesByDistance: Record<number, HierarchyNode[]> = {};
  Object.values(hierarchy).forEach(node => {
    const dist = node.distanceFromCenter;
    if (!nodesByDistance[dist]) nodesByDistance[dist] = [];
    nodesByDistance[dist].push(node);
  });

  // Calculate radius progression (tunable)
  const computedFirst = Math.hypot(centerWidth, centerHeight) / 2 + 180;
  const firstRingRadius = Math.max(tuning?.firstRingRadiusPx ?? 520, Math.round(computedFirst));
  const ringIncrement = tuning?.ringIncrementPx ?? 240;
  
  // Process each distance level
  const distanceLevels = Object.keys(nodesByDistance).map(d => parseInt(d)).sort((a, b) => a - b);
  
  distanceLevels.forEach(distance => {
    const nodesAtLevel = nodesByDistance[distance];
    // Progressive radius: Ring 1 = firstRingRadius, Ring 2 = firstRingRadius + ringIncrement, etc.
    const levelRadius = firstRingRadius + (distance - 1) * ringIncrement;
    
    // Update radius in hierarchy
    nodesAtLevel.forEach(node => {
      node.radiusFromCenter = levelRadius;
    });
    
    if (distance === 1) {
      // First level: arrange around center in a circle
      arrangeFirstLevel(nodesAtLevel, centerX, centerY, levelRadius, dimensions, positions);
    } else {
      // Subsequent levels: position relative to parent nodes
      arrangeByParentRelationship(
        nodesAtLevel, 
        hierarchy, 
        centerX, 
        centerY, 
        dimensions, 
        positions,
        {
          conflictOffsetPx,
          childClusterBaseSpreadRad: tuning?.childClusterBaseSpreadRad,
          childClusterIncrementRad: tuning?.childClusterIncrementRad,
          childClusterMaxSpreadRad: tuning?.childClusterMaxSpreadRad,
        }
      );
    }
  });

  return positions;
}

/**
 * Arrange first level nodes in a circle around center
 */
function arrangeFirstLevel(
  nodes: HierarchyNode[],
  centerX: number,
  centerY: number,
  radius: number,
  dimensions: NodeDimensionMap | undefined,
  positions: Record<string, { x: number; y: number }>
) {
  if (nodes.length === 0) return;

  // Sort nodes deterministically for consistent placement
  const sortedNodes = [...nodes].sort((a, b) => {
    const labelA = String(a.node?.data?.label || a.node?.data?.title || a.id).toLowerCase();
    const labelB = String(b.node?.data?.label || b.node?.data?.title || b.id).toLowerCase();
    return labelA.localeCompare(labelB);
  });

  const angleStep = (2 * Math.PI) / sortedNodes.length;
  let startAngle = 0; // Start at 0 radians (East)

  sortedNodes.forEach((hierarchyNode, index) => {
    const angle = startAngle + (index * angleStep);
    const nodeDims = getNodeDimensions(hierarchyNode.node, dimensions);
    
    // Position node at the calculated angle and radius
    const x = centerX + radius * Math.cos(angle) - nodeDims.width / 2;
    const y = centerY + radius * Math.sin(angle) - nodeDims.height / 2;
    
    positions[hierarchyNode.id] = { x, y };
  });
}

/**
 * Arrange nodes relative to their parent's position using relative polar coordinates
 */
function arrangeByParentRelationship(
  nodes: HierarchyNode[],
  hierarchy: Record<string, HierarchyNode>,
  centerX: number,
  centerY: number,
  dimensions: NodeDimensionMap | undefined,
  positions: Record<string, { x: number; y: number }>,
  tuning?: {
    conflictOffsetPx?: number;
    childClusterBaseSpreadRad?: number;
    childClusterIncrementRad?: number;
    childClusterMaxSpreadRad?: number;
  }
) {
  // Group nodes by their parent
  const nodesByParent: Record<string, HierarchyNode[]> = {};
  const orphanNodes: HierarchyNode[] = [];

  nodes.forEach(node => {
    if (node.parent && hierarchy[node.parent]) {
      if (!nodesByParent[node.parent]) nodesByParent[node.parent] = [];
      nodesByParent[node.parent].push(node);
    } else {
      orphanNodes.push(node);
    }
  });

  // Process nodes with parents
  Object.entries(nodesByParent).forEach(([parentId, childNodes]) => {
    const parentPos = positions[parentId];
    if (!parentPos) return; // Parent not positioned yet, skip
    
    arrangeChildrenAroundParent(
      childNodes,
      parentPos,
      centerX,
      centerY,
      hierarchy[parentId],
      dimensions,
      positions,
      tuning
    );
  });

  // Process orphan nodes (no parent) - distribute around center
  if (orphanNodes.length > 0) {
    orphanNodes.forEach((node, index) => {
      const totalOrphans = orphanNodes.length;
      const angle = (2 * Math.PI * index) / totalOrphans;
      const radius = node.radiusFromCenter;
      const nodeDims = getNodeDimensions(node.node, dimensions);
      
      const x = centerX + radius * Math.cos(angle) - nodeDims.width / 2;
      const y = centerY + radius * Math.sin(angle) - nodeDims.height / 2;
      
      positions[node.id] = { x, y };
    });
  }
}

/**
 * Arrange children around a specific parent using relative angles
 */
function arrangeChildrenAroundParent(
  children: HierarchyNode[],
  parentPos: { x: number; y: number },
  centerX: number,
  centerY: number,
  parent: HierarchyNode,
  dimensions: NodeDimensionMap | undefined,
  positions: Record<string, { x: number; y: number }>,
  tuning?: {
    conflictOffsetPx?: number;
    childClusterBaseSpreadRad?: number;
    childClusterIncrementRad?: number;
    childClusterMaxSpreadRad?: number;
  }
) {
  if (children.length === 0) return;

  // Sort deterministically by label for stable angular ordering
  const sortedChildren = [...children].sort((a, b) => {
    const la = String(a.node?.data?.label || a.node?.data?.title || a.id).toLowerCase();
    const lb = String(b.node?.data?.label || b.node?.data?.title || b.id).toLowerCase();
    return la.localeCompare(lb);
  });

  // Parent angle from center determines cluster anchor
  const parentDims = getNodeDimensions(parent.node, dimensions);
  const parentCenterX = parentPos.x + parentDims.width / 2;
  const parentCenterY = parentPos.y + parentDims.height / 2;
  const parentAngle = Math.atan2(parentCenterY - centerY, parentCenterX - centerX);

  // Determine ring radius for these children (they all share next ring distance)
  const targetRadius = sortedChildren[0].radiusFromCenter || (Math.hypot(parentCenterX - centerX, parentCenterY - centerY) + 500);

  // Angular spread strategy (tunable): keep children clustered around parent angle
  const count = sortedChildren.length;
  if (count === 1) {
    const dims = getNodeDimensions(sortedChildren[0].node, dimensions);
    const ang = parentAngle;
    const radius = sortedChildren[0].radiusFromCenter || Math.hypot(parentCenterX - centerX, parentCenterY - centerY) + (tuning?.ringIncrementPx ?? 240);
    const x1 = centerX + radius * Math.cos(ang) - dims.width / 2;
    const y1 = centerY + radius * Math.sin(ang) - dims.height / 2;
    positions[sortedChildren[0].id] = { x: x1, y: y1 };
    return;
  }
  // Increase default child cluster spread to provide more angular separation
  const baseSpread = tuning?.childClusterBaseSpreadRad ?? 0.35; // ~20° baseline
  const incPerSibling = tuning?.childClusterIncrementRad ?? 0.10; // ~5.7° per extra sibling
  const maxSpread = tuning?.childClusterMaxSpreadRad ?? 1.1; // cap ~63°
  const spread = Math.min(maxSpread, baseSpread + incPerSibling * (count - 2));
  const startAngle = parentAngle - spread / 2;
  const angleStep = count === 1 ? 0 : spread / (count - 1);

  sortedChildren.forEach((child, idx) => {
    const dims = getNodeDimensions(child.node, dimensions);
    const ang = startAngle + idx * angleStep;
    let x = centerX + targetRadius * Math.cos(ang) - dims.width / 2;
    let y = centerY + targetRadius * Math.sin(ang) - dims.height / 2;

    // Basic conflict resolution: nudge outward along its angle if overlapping
    let attempts = 0;
    while (attempts < 4 && checkForConflicts({ x, y }, dims, positions, child.id)) {
      attempts++;
      const extra = attempts * (tuning?.conflictOffsetPx ?? 30);
      x = centerX + (targetRadius + extra) * Math.cos(ang) - dims.width / 2;
      y = centerY + (targetRadius + extra) * Math.sin(ang) - dims.height / 2;
    }
    positions[child.id] = { x, y };
  });
}

/**
 * Check if a position conflicts with existing positioned nodes
 */
function checkForConflicts(
  testPos: { x: number; y: number },
  testDims: { width: number; height: number },
  existingPositions: Record<string, { x: number; y: number }>,
  excludeId: string,
  padding: number = 24
): boolean {
  const testRect = {
    x: testPos.x,
    y: testPos.y,
    w: testDims.width,
    h: testDims.height
  };

  for (const [nodeId, pos] of Object.entries(existingPositions)) {
    if (nodeId === excludeId) continue;
    
    // For simplicity, assume standard node dimensions for conflict check
    // In a real implementation, you'd want to pass node dimensions
    const existingRect = {
      x: pos.x,
      y: pos.y,
      w: DEFAULT_NODE_WIDTH,
      h: DEFAULT_NODE_HEIGHT
    };

    // AABB collision check
    if (testRect.x < existingRect.x + existingRect.w + padding &&
        testRect.x + testRect.w + padding > existingRect.x &&
        testRect.y < existingRect.y + existingRect.h + padding &&
        testRect.y + testRect.h + padding > existingRect.y) {
      return true;
    }
  }

  return false;
}
