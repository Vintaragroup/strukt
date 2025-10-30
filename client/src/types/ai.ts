export type SuggestedNode = {
  id?: string;
  type: string;
  label: string;
  summary?: string;
  domain?: string;
  ring?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type SuggestedEdge = {
  id?: string;
  sourceLabel?: string;
  targetLabel?: string;
  sourceId?: string;
  targetId?: string;
};

export type SuggestionResult = {
  sessionId?: string;
  suggestions: SuggestedNode[];
  edges?: SuggestedEdge[];
  rationale?: string;
};

export type FeedbackInput = {
  nodeId?: string;
  suggestionId?: string;
  reason: "wrong" | "good";
  context: any;
  sessionId?: string;
  workspaceId?: string;
};
