import type { Node, Edge } from "@xyflow/react";
import type { DomainType } from "@/utils/domainLayout";
import type { CustomNodeData } from "@/components/CustomNode";

export type ClassificationKey =
  | "businessModel"
  | "businessOperations"
  | "marketingGTM"
  | "appFrontend"
  | "appBackend"
  | "dataAI"
  | "infrastructure"
  | "observability"
  | "security"
  | "customerExperience";

interface ClassificationDefinition {
  key: ClassificationKey;
  id: string;
  label: string;
  summary: string;
  nodeType: CustomNodeData["type"];
  domain: DomainType;
  ring: number;
  tags?: string[];
}

export const CLASSIFICATION_DEFINITIONS: ClassificationDefinition[] = [
  {
    key: "businessModel",
    id: "classification-business-model",
    label: "Business Model",
    summary: "Idea, concept, plan, and revenue design anchor.",
    nodeType: "requirement",
    domain: "business",
    ring: 1,
    tags: ["classification", "foundationPrimary", "business"],
  },
  {
    key: "businessOperations",
    id: "classification-business-operations",
    label: "Business Operations",
    summary: "Accounting, legal, executive, HR, and support processes.",
    nodeType: "requirement",
    domain: "operations",
    ring: 1,
    tags: ["classification", "foundationPrimary", "operations"],
  },
  {
    key: "marketingGTM",
    id: "classification-marketing-gtm",
    label: "Marketing & GTM",
    summary: "Growth strategy, channels, enablement, and campaigns.",
    nodeType: "requirement",
    domain: "product",
    ring: 1,
    tags: ["classification", "foundationPrimary", "marketing"],
  },
  {
    key: "appFrontend",
    id: "classification-app-frontend",
    label: "Application Frontend",
    summary: "Client-side experiences, UI components, and delivery layers.",
    nodeType: "frontend",
    domain: "tech",
    ring: 1,
    tags: ["classification", "application", "frontend"],
  },
  {
    key: "appBackend",
    id: "classification-app-backend",
    label: "Application Backend & Services",
    summary: "APIs, services, queues, and core platform logic.",
    nodeType: "backend",
    domain: "tech",
    ring: 1,
    tags: ["classification", "application", "backend"],
  },
  {
    key: "dataAI",
    id: "classification-data-ai",
    label: "Data & AI",
    summary: "Pipelines, analytics, ML models, and insights surfaces.",
    nodeType: "backend",
    domain: "data-ai",
    ring: 2,
    tags: ["classification", "data", "ai"],
  },
  {
    key: "infrastructure",
    id: "classification-infrastructure",
    label: "Infrastructure & Platform",
    summary: "Environments, CI/CD, observability, and platform engineering.",
    nodeType: "backend",
    domain: "operations",
    ring: 2,
    tags: ["classification", "infrastructure", "platform"],
  },
  {
    key: "observability",
    id: "classification-observability",
    label: "Observability & Monitoring",
    summary: "Logs, metrics, tracing, alerting, and incident response.",
    nodeType: "backend",
    domain: "operations",
    ring: 2,
    tags: ["classification", "observability", "monitoring"],
  },
  {
    key: "security",
    id: "classification-security",
    label: "Security & Compliance",
    summary: "Identity, secrets, access control, audit, and compliance.",
    nodeType: "backend",
    domain: "operations",
    ring: 2,
    tags: ["classification", "security", "compliance"],
  },
  {
    key: "customerExperience",
    id: "classification-customer-experience",
    label: "Customer Experience",
    summary: "Support, success, onboarding, and customer feedback loops.",
    nodeType: "doc",
    domain: "business",
    ring: 2,
    tags: ["classification", "customer", "support"],
  },
];

const definitionMap = new Map(CLASSIFICATION_DEFINITIONS.map((def) => [def.key, def]));

/**
 * Maps Ring 2 classification keys to their Ring 1 parent classification keys
 * Determines the hierarchy for domain classifications (Ring 2) under foundation pillars (Ring 1)
 */
export const RING2_TO_RING1_PARENT_MAP: Record<ClassificationKey, ClassificationKey> = {
  businessModel: "businessModel", // R1, maps to itself (not a R2)
  businessOperations: "businessOperations", // R1, maps to itself
  marketingGTM: "marketingGTM", // R1, maps to itself
  appFrontend: "appFrontend", // R1, maps to itself
  appBackend: "appBackend", // R1, maps to itself
  
  // Ring 2 classifications and their Ring 1 parents:
  dataAI: "appBackend", // Data & AI → Backend (data pipelines, ML models are backend services)
  infrastructure: "appBackend", // Infrastructure → Backend (CI/CD, platform ops support backend)
  observability: "appBackend", // Observability → Backend (monitoring, logging, tracing)
  security: "appBackend", // Security → Backend (auth, secrets, access control)
  customerExperience: "marketingGTM", // Customer experience → Marketing/GTM (support, onboarding, success)
};

export const ensureClassificationBackbone = (
  nodes: Node[],
  edges: Edge[],
  centerId: string
): { nodes: Node[]; edges: Edge[] } => {
  let nextNodes = nodes.slice();
  let nextEdges = edges.slice();

  CLASSIFICATION_DEFINITIONS.forEach((def) => {
    const existing = nextNodes.find(
      (node) => node.id === def.id || (node.data as CustomNodeData)?.classificationKey === def.key
    );
    
    // Determine what the parent should be for this classification
    let expectedParentId: string | null = null;
    if (def.ring === 1) {
      expectedParentId = centerId;
    } else if (def.ring === 2) {
      const parentClassificationKey = RING2_TO_RING1_PARENT_MAP[def.key];
      if (parentClassificationKey) {
        const parentClassificationNode = nextNodes.find(
          (n) => (n.data as CustomNodeData)?.classificationKey === parentClassificationKey
        );
        if (parentClassificationNode) {
          expectedParentId = parentClassificationNode.id;
        }
      }
    }

    if (existing) {
      // Node exists - update its ring if needed
      const data = existing.data as CustomNodeData;
      const currentRing = typeof data.ring === "number" ? data.ring : undefined;
      if (currentRing !== def.ring) {
        existing.data = {
          ...data,
          ring: def.ring,
          explicitRing: true,
          classificationKey: data.classificationKey || def.key,
          tags: Array.isArray(data.tags)
            ? Array.from(new Set(["classification", def.key, ...(data.tags || [])]))
            : ["classification", def.key],
        } as CustomNodeData;
      } else if (!data.explicitRing) {
        existing.data = {
          ...data,
          explicitRing: true,
          classificationKey: data.classificationKey || def.key,
          tags: Array.isArray(data.tags)
            ? Array.from(new Set(["classification", def.key, ...(data.tags || [])]))
            : ["classification", def.key],
        } as CustomNodeData;
      }
      
      // ALWAYS ensure the edge is correct, even for existing nodes
      if (expectedParentId) {
        const edgeId = `edge-${expectedParentId}-${existing.id}`;
        const hasCorrectEdge = nextEdges.some((edge) => edge.source === expectedParentId && edge.target === existing.id);
        
        if (!hasCorrectEdge) {
          // Remove any existing edges TO this node that aren't from the correct parent
          nextEdges = nextEdges.filter(
            (edge) => !(edge.target === existing.id && edge.source !== expectedParentId)
          );
          // Add the correct edge
          nextEdges = [
            ...nextEdges,
            {
              id: edgeId,
              source: expectedParentId,
              target: existing.id,
              type: "custom",
            },
          ];
        }
      }
      return;
    }

    // Node doesn't exist, create it
    const newNode: Node<CustomNodeData> = {
      id: def.id,
      type: "custom",
      position: { x: 0, y: 0 },
      data: {
        label: def.label,
        summary: def.summary,
        type: def.nodeType,
        domain: def.domain,
        ring: def.ring,
        tags: ["classification", def.key, ...(def.tags ?? [])],
        classificationKey: def.key,
        explicitRing: true,
        parentId: null,
      },
    };
    nextNodes = [...nextNodes, newNode];

    // Create edge if parent exists
    if (expectedParentId) {
      const edgeId = `edge-${expectedParentId}-${newNode.id}`;
      const edgeExists = nextEdges.some((edge) => edge.source === expectedParentId && edge.target === newNode.id);
      if (!edgeExists) {
        nextEdges = [
          ...nextEdges,
          {
            id: edgeId,
            source: expectedParentId,
            target: newNode.id,
            type: "custom",
          },
        ];
      }
    }
  });

  return { nodes: nextNodes, edges: nextEdges };
};

const labelMatches = (label: string | undefined, patterns: RegExp[]) => {
  if (!label) return false;
  const lower = label.toLowerCase();
  return patterns.some((pattern) => pattern.test(lower));
};

const resolveClassificationKey = (
  nodeType?: string,
  domain?: string,
  tags: string[] = [],
  label?: string
): ClassificationKey | null => {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  
  // HIGH PRIORITY: Check node type first - if it's a tech-layer node, classify as such
  // This handles cases where domain might be wrong but type is correct
  if (nodeType === "frontend") return "appFrontend";
  if (nodeType === "backend") return "appBackend";
  
  // Check tags
  if (lowerTags.some((tag) => tag.includes("customer") || tag.includes("support"))) {
    return "customerExperience";
  }
  if (lowerTags.some((tag) => tag.includes("infra") || tag.includes("platform"))) {
    return "infrastructure";
  }

  switch (domain) {
    case "business":
      return "businessModel";
    case "operations":
      return "businessOperations";
    case "product":
      // Product domain should check the node type first (handled above)
      // If we get here, it's a product-domain node that isn't frontend/backend
      return "marketingGTM";
    case "tech":
      return nodeType === "frontend" ? "appFrontend" : "appBackend";
    case "data-ai":
      return "dataAI";
    default:
      if (nodeType === "doc" || nodeType === "requirement") {
        if (labelMatches(label, [/marketing/, /campaign/, /brand/, /gtm/, /growth/])) return "marketingGTM";
        if (labelMatches(label, [/customer/, /support/, /success/, /cx/, /onboarding/])) return "customerExperience";
        if (labelMatches(label, [/ops/, /operation/, /accounting/, /finance/, /hr/, /executive/]))
          return "businessOperations";
      }
      if (labelMatches(label, [/data/, /analytics/, /ai/, /ml/, /insight/])) return "dataAI";
      if (labelMatches(label, [/frontend/, /ui/, /client/, /experience/, /dashboard/])) return "appFrontend";
      if (labelMatches(label, [/api/, /service/, /backend/, /auth/, /platform/, /queue/, /storage/])) return "appBackend";
      return "businessModel";
  }
};

export const getClassificationParentId = (
  nodes: Node[],
  nodeType?: string,
  domain?: DomainType,
  tags: string[] = [],
  label?: string
): string | null => {
  const classification = resolveClassificationKey(nodeType, domain, tags, label);
  if (!classification) {
    return null;
  }
  const existing = nodes.find(
    (node) =>
      node.id === definitionMap.get(classification)?.id ||
      (node.data as CustomNodeData)?.classificationKey === classification
  );
  return existing?.id ?? null;
};
