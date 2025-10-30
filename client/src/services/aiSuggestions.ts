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

type RawSuggestion = any;

function mapRawSuggestions(raw: RawSuggestion[], parentId?: string): SuggestedNode[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry) return null;
      const label =
        typeof entry.label === "string"
          ? entry.label
          : typeof entry.data?.title === "string"
          ? entry.data.title
          : undefined;
      if (!label) return null;
      const summary =
        typeof entry.summary === "string"
          ? entry.summary
          : typeof entry.data?.summary === "string"
          ? entry.data.summary
          : undefined;
      const domain = entry.domain ?? entry.data?.domain;
      const ring =
        typeof entry.ring === "number"
          ? entry.ring
          : typeof entry.data?.ring === "number"
          ? entry.data.ring
          : undefined;
      const type =
        typeof entry.type === "string"
          ? entry.type
          : typeof entry.data?.type === "string"
          ? entry.data.type
          : "requirement";
      const metadata: Record<string, unknown> = {
        ...(typeof entry.metadata === "object" && entry.metadata !== null ? entry.metadata : {}),
      };
      if (parentId && !metadata.parentId) {
        metadata.parentId = parentId;
      }
      return {
        id: typeof entry.id === "string" ? entry.id : undefined,
        label,
        summary,
        type,
        domain,
        ring,
        metadata,
      } as SuggestedNode;
    })
    .filter(Boolean) as SuggestedNode[];
}

function normalizeSuggestionResult(
  result: SuggestionResult,
  parentId?: string
): SuggestionResult {
  if (!result) return { suggestions: [] };
  return {
    ...result,
    suggestions: mapRawSuggestions(result.suggestions, parentId),
  };
}

export async function suggestNextNodes(params: {
  workspaceId: string;
  cursorNodeId?: string | null;
  context?: {
    label?: string;
    summary?: string;
    type?: string;
    domain?: string;
    ring?: number;
  };
}): Promise<SuggestionResult> {
  if (USE_MOCK) {
    return new Promise((resolve) =>
      setTimeout(
        () => resolve(normalizeSuggestionResult(mockNext, params.cursorNodeId ?? undefined)),
        300
      )
    );
  }

  const payload = {
    workspaceId: params.workspaceId,
    cursorNodeId: params.cursorNodeId ?? undefined,
    focusLabel: params.context?.label,
    focusSummary: params.context?.summary,
    focusType: params.context?.type,
    focusDomain: params.context?.domain,
    focusRing: params.context?.ring,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}/suggestions/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await toJson(res);
    return normalizeSuggestionResult(json, params.cursorNodeId ?? undefined);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("AI suggestions timed out, falling back to heuristics", error);
    // Heuristic fallback that runs fast server-side
    const res = await fetch(`${API_BASE}/ai/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes: params.cursorNodeId
          ? [
              {
                id: params.cursorNodeId,
                type: params.context?.type ?? "requirement",
                data: {
                  title: params.context?.label ?? "Focused Node",
                  summary: params.context?.summary,
                },
              },
            ]
          : [],
        edges: [],
      }),
    });
    const fallback = await toJson(res);
    return normalizeSuggestionResult(
      { suggestions: fallback.suggestions ?? [] },
      params.cursorNodeId ?? undefined
    );
  }
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
