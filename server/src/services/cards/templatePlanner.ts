export type ServerNodeType = "root" | "frontend" | "backend" | "requirement" | "doc" | "domain";
export type ServerDomainType = "business" | "product" | "tech" | "data-ai" | "operations";

export interface ServerCardTemplate {
  id: string;
  label: string;
  description: string;
  cardType: "markdown" | "checklist" | "todo" | "brief" | "spec";
  suggestedPrdTemplates?: string[];
  defaultSections?: Array<{ title: string }>;
  defaultChecklist?: string[];
  tags?: string[];
}

export interface RecommendedCardPlan {
  template: ServerCardTemplate;
  reason?: string;
}

const CARD_LIBRARY: Record<string, ServerCardTemplate> = {
  marketingCampaignBrief: {
    id: "marketingCampaignBrief",
    label: "Campaign Brief",
    description: "Objectives, ICP, messaging, channels, timeline, KPIs.",
    cardType: "markdown",
    suggestedPrdTemplates: ["marketing_campaign_prd", "Product Hunt PRD Template"],
    defaultSections: [
      { title: "Objective" },
      { title: "Target Audience" },
      { title: "Key Message" },
      { title: "Channels" },
      { title: "Timeline" },
      { title: "KPIs" },
    ],
    tags: ["marketing", "brief"],
  },
  launchChecklist: {
    id: "launchChecklist",
    label: "Launch Checklist",
    description: "Sequenced launch readiness tasks.",
    cardType: "checklist",
    suggestedPrdTemplates: ["marketing_campaign_prd"],
    defaultChecklist: [
      "Finalize messaging and creative assets",
      "Enable landing page and tracking",
      "Notify stakeholders and support teams",
      "Publish announcement content",
      "Monitor KPIs and feedback",
    ],
    tags: ["marketing", "launch"],
  },
  personaSnapshot: {
    id: "personaSnapshot",
    label: "Persona Snapshot",
    description: "Quick overview of target persona and messaging cues.",
    cardType: "brief",
    suggestedPrdTemplates: ["marketing_campaign_prd"],
    defaultSections: [
      { title: "Segment" },
      { title: "Pain Points" },
      { title: "Desired Outcomes" },
      { title: "Key Messages" },
    ],
    tags: ["marketing", "persona"],
  },
  businessCase: {
    id: "businessCase",
    label: "Business Case",
    description: "Problem, solution, ROI, risks, assumptions.",
    cardType: "markdown",
    suggestedPrdTemplates: ["general_software_010", "internal_tool_009"],
    defaultSections: [
      { title: "Problem Statement" },
      { title: "Proposed Solution" },
      { title: "Value / ROI" },
      { title: "Assumptions" },
      { title: "Risks & Mitigations" },
    ],
    tags: ["business", "strategy"],
  },
  okrCard: {
    id: "okrCard",
    label: "OKR Card",
    description: "Objective and key results tracker.",
    cardType: "brief",
    suggestedPrdTemplates: ["general_software_010"],
    defaultSections: [{ title: "Objective" }, { title: "Key Results" }],
    tags: ["business", "program"],
  },
  raciMatrix: {
    id: "raciMatrix",
    label: "RACI Roles",
    description: "Responsible, Accountable, Consulted, Informed roles.",
    cardType: "markdown",
    suggestedPrdTemplates: ["internal_tool_009"],
    defaultSections: [
      { title: "Responsible" },
      { title: "Accountable" },
      { title: "Consulted" },
      { title: "Informed" },
    ],
    tags: ["business", "program"],
  },
  technicalSpec: {
    id: "technicalSpec",
    label: "Technical Spec",
    description: "Architecture context, interface, dependencies, testing.",
    cardType: "markdown",
    suggestedPrdTemplates: ["backend_api_001", "go_microservices_011", "backend_fastapi_007"],
    defaultSections: [
      { title: "Overview" },
      { title: "Architecture" },
      { title: "Interfaces" },
      { title: "Dependencies" },
      { title: "Testing & Validation" },
    ],
    tags: ["tech", "engineering"],
  },
  apiContract: {
    id: "apiContract",
    label: "API Contract",
    description: "Endpoint contract with request/response and error handling.",
    cardType: "markdown",
    suggestedPrdTemplates: ["backend_api_001", "backend_fastapi_007"],
    defaultSections: [
      { title: "Endpoint" },
      { title: "Request" },
      { title: "Response" },
      { title: "Errors" },
    ],
    tags: ["tech", "api"],
  },
  adrSummary: {
    id: "adrSummary",
    label: "Decision Summary",
    description: "Summary of latest architectural decision record.",
    cardType: "markdown",
    suggestedPrdTemplates: ["go_microservices_011"],
    defaultSections: [
      { title: "Decision" },
      { title: "Context" },
      { title: "Consequences" },
    ],
    tags: ["tech", "architecture"],
  },
  dataPipelineSpec: {
    id: "dataPipelineSpec",
    label: "Data Pipeline Spec",
    description: "Sources, transformations, data quality, scheduling.",
    cardType: "markdown",
    suggestedPrdTemplates: ["data_pipeline_004"],
    defaultSections: [
      { title: "Sources" },
      { title: "Transformations" },
      { title: "Quality Checks" },
      { title: "Scheduling & Ops" },
    ],
    tags: ["data", "mlops"],
  },
  modelCard: {
    id: "modelCard",
    label: "Model Card",
    description: "Dataset, training, metrics, intended use, limitations.",
    cardType: "markdown",
    suggestedPrdTemplates: ["data_science_playbook_013", "microsoft_mlopstemplate"],
    defaultSections: [
      { title: "Dataset & Features" },
      { title: "Training Process" },
      { title: "Metrics" },
      { title: "Intended Use" },
      { title: "Limitations & Risks" },
    ],
    tags: ["data", "mlops"],
  },
  monitoringChecklist: {
    id: "monitoringChecklist",
    label: "Monitoring Checklist",
    description: "Operational monitoring and alerting steps.",
    cardType: "checklist",
    suggestedPrdTemplates: ["thoughtworks_mlop_platforms"],
    defaultChecklist: [
      "Configure data/feature drift alerts",
      "Set up performance dashboards",
      "Define retrain cadence",
      "Document rollback plan",
    ],
    tags: ["data", "mlops", "operations"],
  },
  operationsRunbook: {
    id: "operationsRunbook",
    label: "Runbook",
    description: "On-call procedures and diagnostics.",
    cardType: "markdown",
    suggestedPrdTemplates: ["internal_tool_009", "go_microservices_011"],
    defaultSections: [
      { title: "Service Overview" },
      { title: "Dependencies" },
      { title: "Alert Playbook" },
      { title: "Diagnostics" },
      { title: "Escalation" },
    ],
    tags: ["operations", "runbook"],
  },
};

const NODE_CARD_RULES: Array<{
  nodeTypes?: ServerNodeType[];
  domains?: ServerDomainType[];
  cards: string[];
}> = [
  {
    nodeTypes: ["doc"],
    domains: ["business", "product"],
    cards: ["marketingCampaignBrief", "launchChecklist", "personaSnapshot"],
  },
  {
    nodeTypes: ["doc"],
    domains: ["business"],
    cards: ["businessCase", "okrCard", "raciMatrix"],
  },
  {
    nodeTypes: ["backend", "requirement"],
    domains: ["tech"],
    cards: ["technicalSpec", "apiContract", "adrSummary"],
  },
  {
    nodeTypes: ["frontend"],
    domains: ["product", "tech"],
    cards: ["technicalSpec", "launchChecklist"],
  },
  {
    nodeTypes: ["requirement"],
    domains: ["data-ai"],
    cards: ["dataPipelineSpec", "modelCard", "monitoringChecklist"],
  },
  {
    nodeTypes: ["requirement"],
    domains: ["operations"],
    cards: ["operationsRunbook", "monitoringChecklist"],
  },
];

export function getRecommendedCardsForNode(params: {
  nodeType: ServerNodeType;
  domain?: ServerDomainType;
}): RecommendedCardPlan[] {
  const { nodeType, domain } = params;
  const matches = NODE_CARD_RULES.filter((rule) => {
    const nodeMatch = rule.nodeTypes ? rule.nodeTypes.includes(nodeType) : true;
    const domainMatch = rule.domains ? (domain ? rule.domains.includes(domain) : false) : true;
    return nodeMatch && domainMatch;
  });

  const uniqueIds = Array.from(new Set(matches.flatMap((rule) => rule.cards)));
  return uniqueIds
    .map((templateId) => CARD_LIBRARY[templateId])
    .filter(Boolean)
    .map((template) => ({
      template,
      reason: template.suggestedPrdTemplates
        ? `Aligned with ${template.suggestedPrdTemplates.join(", ")} template(s).`
        : undefined,
    }));
}

export function getCardTemplateById(templateId: string): ServerCardTemplate | undefined {
  return CARD_LIBRARY[templateId];
}

export function generateCardDrafts(params: {
  nodeType: ServerNodeType;
  domain?: ServerDomainType;
  templateIds?: string[];
}): Array<RecommendedCardPlan & { defaultSections?: Array<{ title: string; body: string }>; defaultChecklist?: string[] }> {
  const { nodeType, domain, templateIds } = params;
  const baseTemplates = templateIds && templateIds.length
    ? templateIds
        .map((id) => CARD_LIBRARY[id])
        .filter(Boolean)
        .map((template) => ({ template, reason: undefined }))
    : getRecommendedCardsForNode({ nodeType, domain });

  return baseTemplates.map((entry) => ({
    ...entry,
    defaultSections: entry.template.defaultSections?.map((section) => ({
      title: section.title,
      body: "",
    })),
    defaultChecklist: entry.template.defaultChecklist,
  }));
}
