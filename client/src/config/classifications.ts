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
    if (existing) {
      // If the node already exists but its ring is out of date with the current definition,
      // update the ring (and lock it) so downstream logic (picker filtering, radial layout)
      // reflects the authoritative classification structure. We do NOT touch position.
      const data = existing.data as CustomNodeData;
      const currentRing = typeof data.ring === "number" ? data.ring : undefined;
      if (currentRing !== def.ring) {
        existing.data = {
          ...data,
          ring: def.ring,
          explicitRing: true,
          classificationKey: data.classificationKey || def.key,
          // Ensure classification tag present for future migrations
          tags: Array.isArray(data.tags)
            ? Array.from(new Set(["classification", def.key, ...(data.tags || [])]))
            : ["classification", def.key],
        } as CustomNodeData;
      } else if (!data.explicitRing) {
        // Lock ring if it matches but wasn't explicit yet
        existing.data = {
          ...data,
          explicitRing: true,
          classificationKey: data.classificationKey || def.key,
          tags: Array.isArray(data.tags)
            ? Array.from(new Set(["classification", def.key, ...(data.tags || [])]))
            : ["classification", def.key],
        } as CustomNodeData;
      }
      return; // Do not create a duplicate classification node
    }

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

    const edgeId = `edge-${centerId}-${newNode.id}`;
    const edgeExists = nextEdges.some((edge) => edge.source === centerId && edge.target === newNode.id);
    if (!edgeExists) {
      nextEdges = [
        ...nextEdges,
        {
          id: edgeId,
          source: centerId,
          target: newNode.id,
          type: "custom",
        },
      ];
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
      return "marketingGTM";
    case "tech":
      return nodeType === "frontend" ? "appFrontend" : "appBackend";
    case "data-ai":
      return "dataAI";
    default:
      if (nodeType === "frontend") return "appFrontend";
      if (nodeType === "backend") return "appBackend";
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
