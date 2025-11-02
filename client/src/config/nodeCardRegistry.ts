import type { CardType, CardSection } from "@/components/EditableCard";
import type { NodeType, DomainType } from "@/types";

export type NodeCardTemplateId =
  | "marketingCampaignBrief"
  | "launchChecklist"
  | "personaSnapshot"
  | "businessCase"
  | "okrCard"
  | "raciMatrix"
  | "technicalSpec"
  | "apiContract"
  | "adrSummary"
  | "dataPipelineSpec"
  | "modelCard"
  | "monitoringChecklist"
  | "operationsRunbook";

export interface NodeCardTemplate {
  id: NodeCardTemplateId;
  label: string;
  description: string;
  cardType: CardType;
  suggestedTemplates?: string[];
  defaultSections?: Array<Pick<CardSection, "title">>;
  defaultChecklist?: string[];
  tags?: string[];
}

export interface NodeCardMapping {
  nodeTypes?: NodeType[];
  domains?: DomainType[];
  recommendedCards: NodeCardTemplateId[];
}

export const CARD_TEMPLATES: Record<NodeCardTemplateId, NodeCardTemplate> = {
  marketingCampaignBrief: {
    id: "marketingCampaignBrief",
    label: "Campaign Brief",
    description: "Goals, audience, key message, channels, timeline, KPIs.",
    cardType: "markdown",
    suggestedTemplates: ["marketing_campaign_prd", "Product Hunt PRD Template"],
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
    description: "Sequenced checklist to manage go-to-market execution.",
    cardType: "checklist",
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
    description: "Quick persona summary to anchor campaign context.",
    cardType: "brief",
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
    suggestedTemplates: ["general_software_010", "internal_tool_009"],
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
    description: "Objective and supporting key results.",
    cardType: "brief",
    defaultSections: [{ title: "Objective" }, { title: "Key Results" }],
    tags: ["business", "program"],
  },
  raciMatrix: {
    id: "raciMatrix",
    label: "RACI Roles",
    description: "Responsible, Accountable, Consulted, Informed overview.",
    cardType: "markdown",
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
    suggestedTemplates: ["backend_api_001", "go_microservices_011", "backend_fastapi_007"],
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
    description: "Endpoint contract including request/response and errors.",
    cardType: "markdown",
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
    description: "Summarize the latest architectural decision record.",
    cardType: "markdown",
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
    description: "Sources, transformations, quality checks, ops.",
    cardType: "markdown",
    suggestedTemplates: ["data_pipeline_004"],
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
    description: "Dataset, training, metrics, intended use, risks.",
    cardType: "markdown",
    suggestedTemplates: ["data_science_playbook_013", "microsoft_mlopstemplate"],
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
    description: "Operational checks, alerts, retraining cadence.",
    cardType: "checklist",
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
    description: "On-call steps for incident response and diagnostics.",
    cardType: "markdown",
    defaultSections: [
      { title: "Service Overview" },
      { title: "Dependencies" },
      { title: "Alert Playbook" },
      { title: "Diagnostics" },
      { title: "Escalation" },
    ],
    tags: ["operations", "support"],
  },
};

export const NODE_CARD_MATRIX: NodeCardMapping[] = [
  {
    nodeTypes: ["doc"],
    domains: ["Product"],
    recommendedCards: ["marketingCampaignBrief", "launchChecklist", "personaSnapshot"],
  },
  {
    nodeTypes: ["doc"],
    domains: ["Business"],
    recommendedCards: ["businessCase", "okrCard", "raciMatrix"],
  },
  {
    nodeTypes: ["backend", "requirement"],
    domains: ["Tech"],
    recommendedCards: ["technicalSpec", "apiContract", "adrSummary"],
  },
  {
    nodeTypes: ["frontend"],
    domains: ["Product", "Tech"],
    recommendedCards: ["technicalSpec", "launchChecklist"],
  },
  {
    nodeTypes: ["requirement"],
    domains: ["DataAI"],
    recommendedCards: ["dataPipelineSpec", "modelCard", "monitoringChecklist"],
  },
  {
    nodeTypes: ["requirement"],
    domains: ["Ops"],
    recommendedCards: ["operationsRunbook", "monitoringChecklist"],
  },
];
