import type { SuggestionResult, FeedbackInput } from "@/types/ai";

const mockStart: SuggestionResult = {
  suggestions: [
    { type: "center", label: "AI Fitness Coach", summary: "Your core idea node." },
    { type: "custom", label: "Target Audience", summary: "Define who this is for.", domain: "business", ring: 1 },
    { type: "custom", label: "Key Features", summary: "Outline MVP functions.", domain: "product", ring: 1 },
    { type: "custom", label: "Tech Stack", summary: "Decide on base stack.", domain: "tech", ring: 1 },
  ],
};

const mockNext: SuggestionResult = {
  suggestions: [
    { type: "custom", label: "Launch Plan", summary: "Prepare for go-to-market.", domain: "operations", ring: 2 },
    { type: "custom", label: "AI Training Data", summary: "Define datasets and sources.", domain: "data-ai", ring: 2 },
  ],
};

export async function suggestStartNodes(prompt: string): Promise<SuggestionResult> {
  if (import.meta.env.VITE_MOCK_AI_SUGGESTIONS === "false") {
    // TODO: integrate with real backend later
  }
  return new Promise((resolve) => setTimeout(() => resolve(mockStart), 400));
}

export async function suggestNextNodes(context: any): Promise<SuggestionResult> {
  if (import.meta.env.VITE_MOCK_AI_SUGGESTIONS === "false") {
    // TODO: integrate with real backend later
  }
  return new Promise((resolve) => setTimeout(() => resolve(mockNext), 400));
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  console.log("Feedback received:", input);
}
