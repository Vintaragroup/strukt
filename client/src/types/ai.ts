export type ApiIntegrationMetadata = {
  apiName: string;
  specHash: string;
  specType?: string;
  rationale?: string;
  recommendedCalls?: string[];
  integrationPoints?: string[];
};

export type SuggestedNode = {
  id?: string;
  type: string;
  label: string;
  summary?: string;
  domain?: string;
  ring?: number;
  tags?: string[];
  metadata?: {
    parentId?: string;
    apiIntegration?: ApiIntegrationMetadata;
    [key: string]: unknown;
  };
};

export type SuggestedEdge = {
  id?: string;
  sourceLabel?: string;
  targetLabel?: string;
  sourceId?: string;
  targetId?: string;
};

export type SuggestionKnowledge = {
  filters: {
    nodeTypes: string[];
    domains: string[];
    tags: string[];
  };
  summary: string;
  prds: Array<{
    id: string;
    name: string;
    sections: Array<{ title: string; key?: string; snippet: string }>;
  }>;
  fragments: Array<{ id: string; type: string; label?: string }>;
  questionHints: string[];
  promptContext?: string;
};

export type SuggestionResult = {
  sessionId?: string;
  suggestions: SuggestedNode[];
  edges?: SuggestedEdge[];
  rationale?: string;
  source?: "ai" | "heuristic";
  foundationInjected?: boolean;
  knowledge?: SuggestionKnowledge;
};

export type FeedbackInput = {
  nodeId?: string;
  suggestionId?: string;
  reason: "wrong" | "good";
  context: any;
  sessionId?: string;
  workspaceId?: string;
};

export type OperationSummary = {
  method: string;
  path: string;
  summary?: string;
  category?: string;
  auth?: string[];
  requestBodyTypes?: string[];
  successStatusCodes?: string[];
};

export type SpecSummary = {
  specType: "openapi" | "postman";
  title: string;
  version?: string;
  description?: string;
  servers?: string[];
  auth?: string[];
  tags?: string[];
  operations: OperationSummary[];
  importHash: string;
  generatedAt: string;
};
