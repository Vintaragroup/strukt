import type { SuggestionResult, FeedbackInput, SuggestedNode } from "@/types/ai";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const USE_MOCK = import.meta.env.VITE_MOCK_AI_SUGGESTIONS !== "false";

const mockStart: SuggestionResult = {
  sessionId: "mock-session",
  suggestions: [
    { id: "mock-center", type: "center", label: "AI Fitness Coach", summary: "Your core idea node." },
    { id: "mock-1", type: "custom", label: "Target Audience", summary: "Define who this is for.", domain: "business", ring: 1 },
    { id: "mock-2", type: "custom", label: "Key Features", summary: "Outline MVP functions.", domain: "product", ring: 1 },
    { id: "mock-3", type: "custom", label: "Tech Stack", summary: "Decide on base stack.", domain: "tech", ring: 1 },
  ],
};

const mockNext: SuggestionResult = {
  suggestions: [
    { id: "mock-next-1", type: "custom", label: "Launch Plan", summary: "Prepare for go-to-market.", domain: "operations", ring: 2 },
    { id: "mock-next-2", type: "custom", label: "AI Training Data", summary: "Define datasets and sources.", domain: "data-ai", ring: 2 },
  ],
};

function toJson(res: Response) {
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function suggestStartNodes(params: { workspaceId: string; idea: string }): Promise<SuggestionResult> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(mockStart), 300));
  }

  const res = await fetch(`${API_BASE}/wizard/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: params.workspaceId, userText: params.idea }),
  });
  return toJson(res);
}

export async function continueWizard(params: { sessionId: string; idea: string }): Promise<SuggestionResult> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(mockStart), 300));
  }

  const res = await fetch(`${API_BASE}/wizard/continue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: params.sessionId, userText: params.idea }),
  });
  return toJson(res);
}

export async function suggestNextNodes(params: { workspaceId: string; cursorNodeId?: string | null }): Promise<SuggestionResult> {
  if (USE_MOCK) {
    return new Promise((resolve) => setTimeout(() => resolve(mockNext), 300));
  }

  const res = await fetch(`${API_BASE}/suggestions/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: params.workspaceId, cursorNodeId: params.cursorNodeId ?? undefined }),
  });
  return toJson(res);
}

export async function applySuggestion(suggestionId: string): Promise<{ suggestionId: string; nodes: SuggestedNode[]; status: string }> {
  if (USE_MOCK) {
    return { suggestionId, nodes: mockNext.suggestions, status: "applied" };
  }

  const res = await fetch(`${API_BASE}/suggestions/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestionId }),
  });
  return toJson(res);
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  if (USE_MOCK) {
    console.log("Feedback received (mock):", input);
    return;
  }

  await fetch(`${API_BASE}/feedback/mark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      suggestionId: input.suggestionId,
      nodeIds: input.nodeId ? [input.nodeId] : undefined,
      reason: input.reason,
      flags: input.reason === "wrong" ? ["wrong-path"] : ["helpful"],
      context: input.context,
    }),
  });
}
