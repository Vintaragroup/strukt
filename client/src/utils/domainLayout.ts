// @ts-nocheck
import { Node } from "reactflow";

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
  ringRadii?: number[]; // Radii for each ring [ring1, ring2, ring3, ...]
  sectorSize?: number; // Angular size of each domain sector
}

const DEFAULT_RING_RADII = [450, 700, 950]; // Ring 1, Ring 2, Ring 3

/**
 * Apply radial hub-and-rings layout based on domain organization
 */
export function applyDomainRadialLayout(
  nodes: Node[],
  config: RadialLayoutConfig
): Node[] {
  const { centerNodeId, viewMode, ringRadii = DEFAULT_RING_RADII } = config;

  if (viewMode === "process") {
    return applyProcessLayout(nodes, centerNodeId);
  }

  const centerNode = nodes.find((n) => n.id === centerNodeId);
  if (!centerNode) {
    console.warn("Center node not found");
    return nodes;
  }

  const centerX = centerNode.position.x + (centerNode.width || 320) / 2;
  const centerY = centerNode.position.y + (centerNode.height || 200) / 2;

  // Group nodes by domain
  const domainGroups = groupNodesByDomain(nodes, centerNodeId);

  const positionedNodes: Node[] = [];

  // Position nodes in each domain sector with department support
  Object.entries(domainGroups).forEach(([domain, domainNodes]) => {
    const domainConfig = DOMAIN_CONFIG[domain as DomainType];
    if (!domainConfig) return;

    const baseAngle = domainConfig.angle;
    const sectorSpread = Math.PI / 4; // ~45 degrees per sector

    // Group nodes by department within domain
    const departmentGroups = groupNodesByDepartment(domainNodes, domainConfig);

    // Position each department's nodes
    Object.entries(departmentGroups).forEach(([deptKey, deptNodes]) => {
      // Get department config or use default (center of sector)
      const deptConfig = domainConfig.departments[deptKey] || { angleOffset: 0 };
      const departmentAngle = baseAngle + deptConfig.angleOffset;

      // Group nodes within department by ring
      const ringGroups = groupNodesIntoRings(deptNodes);

      Object.entries(ringGroups).forEach(([ringStr, ringNodes]) => {
        const ring = parseInt(ringStr);
        const radius = ringRadii[ring - 1] || ringRadii[ringRadii.length - 1];

        if (ringNodes.length === 1) {
          // Single node - place at department center angle
          const node = ringNodes[0];
          positionedNodes.push(
            positionNodeAtAngle(node, centerX, centerY, radius, departmentAngle)
          );
        } else {
          // Multiple nodes - distribute within department sub-sector
          const subSectorSpread = 0.3; // ~17 degrees for department spread
          const angleStep = subSectorSpread / (ringNodes.length + 1);
          const startAngle = departmentAngle - subSectorSpread / 2;

          ringNodes.forEach((node, idx) => {
            const angle = startAngle + angleStep * (idx + 1);
            positionedNodes.push(
              positionNodeAtAngle(node, centerX, centerY, radius, angle)
            );
          });
        }
      });
    });
  });

  // Return all nodes with updated positions
  return nodes.map((node) => {
    if (node.id === centerNodeId) {
      return node; // Keep center node as is
    }
    const positioned = positionedNodes.find((n) => n.id === node.id);
    return positioned || node;
  });
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
 * Position a node at a specific angle and radius
 */
function positionNodeAtAngle(
  node: Node,
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
): Node {
  const nodeWidth = node.width || node.style?.width || 280;
  const nodeHeight = node.height || node.style?.height || 200;

  const x = centerX + radius * Math.cos(angle) - nodeWidth / 2;
  const y = centerY + radius * Math.sin(angle) - nodeHeight / 2;

  return {
    ...node,
    position: { x, y },
  };
}

/**
 * Apply linear process layout (left-to-right)
 */
function applyProcessLayout(nodes: Node[], centerNodeId: string): Node[] {
  const centerNode = nodes.find((n) => n.id === centerNodeId);
  if (!centerNode) return nodes;

  const otherNodes = nodes.filter((n) => n.id !== centerNodeId);

  const startX = centerNode.position.x + 500;
  const startY = centerNode.position.y - 200;
  const spacing = { x: 400, y: 300 };
  const columns = 3;

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
