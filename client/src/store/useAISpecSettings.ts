import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SpecSummary } from "@/types/ai";

interface AISpecSettingsState {
  allowSpecContext: boolean;
  specReferenceId?: string;
  summary?: SpecSummary;
  promptFragment?: string;
  promptBudgetTokens: number;
  estimatedTokens: number;
  apiIntent?: string;
  lastSummaryTitle?: string;
  setAllowSpecContext: (value: boolean) => void;
  setSpecSummary: (input: { referenceId: string; summary: SpecSummary; promptFragment: string }) => void;
  clearSpecSummary: () => void;
  setPromptBudget: (tokens: number) => void;
  setEstimatedTokens: (tokens: number) => void;
  setApiIntent: (intent?: string) => void;
}

const STORAGE_KEY = "strukt-ai-spec-settings";

export const useAISpecSettings = create<AISpecSettingsState>()(
  persist(
    (set, get) => ({
      allowSpecContext: false,
      specReferenceId: undefined,
      summary: undefined,
      promptFragment: undefined,
      promptBudgetTokens: 1200,
      estimatedTokens: 0,
      apiIntent: undefined,
      lastSummaryTitle: undefined,
      setAllowSpecContext: (value) => {
        set(() => ({
          allowSpecContext: value,
        }));
        if (!value) {
          set(() => ({
            specReferenceId: undefined,
            summary: undefined,
            promptFragment: undefined,
            estimatedTokens: 0,
          }));
        }
      },
      setSpecSummary: ({ referenceId, summary, promptFragment }) =>
        set(() => ({
          specReferenceId: referenceId,
          summary,
          promptFragment,
          estimatedTokens: Math.ceil(promptFragment.length / 4),
          lastSummaryTitle: summary.title,
        })),
      clearSpecSummary: () =>
        set(() => ({
          specReferenceId: undefined,
          summary: undefined,
          promptFragment: undefined,
          estimatedTokens: 0,
        })),
      setPromptBudget: (tokens) =>
        set(() => ({
          promptBudgetTokens: Math.max(400, Math.min(tokens, 4000)),
        })),
      setEstimatedTokens: (tokens) =>
        set(() => ({
          estimatedTokens: Math.max(0, tokens),
        })),
      setApiIntent: (intent) =>
        set(() => ({
          apiIntent: intent,
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          const store = new Map<string, string>();
          const memoryStorage: Storage = {
            get length() {
              return store.size;
            },
            clear: () => {
              store.clear();
            },
            getItem: (key: string) => store.get(key) ?? null,
            key: (index: number) => Array.from(store.keys())[index] ?? null,
            removeItem: (key: string) => {
              store.delete(key);
            },
            setItem: (key: string, value: string) => {
              store.set(key, value);
            },
          } as Storage;
          return memoryStorage;
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        allowSpecContext: state.allowSpecContext,
        promptBudgetTokens: state.promptBudgetTokens,
        apiIntent: state.apiIntent,
        lastSummaryTitle: state.lastSummaryTitle,
      }),
    }
  )
);
