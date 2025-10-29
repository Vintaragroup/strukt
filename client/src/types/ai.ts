export type SuggestedNode = {
  type: string;
  label: string;
  summary?: string;
  domain?: string;
  ring?: number;
};

export type SuggestedEdge = {
  sourceLabel?: string;
  targetLabel?: string;
  sourceId?: string;
  targetId?: string;
};

export type SuggestionResult = {
  suggestions: SuggestedNode[];
  edges?: SuggestedEdge[];
  rationale?: string;
};

export type FeedbackInput = {
  nodeId?: string;
  suggestionId?: string;
  reason: "wrong" | "good";
  context: any;
};
