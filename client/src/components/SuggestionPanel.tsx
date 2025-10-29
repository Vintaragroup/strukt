import { useEffect, useState, useCallback } from "react";
import type { Node } from "@xyflow/react";
import type { SuggestedNode } from "@/types/ai";
import { suggestNextNodes, submitFeedback } from "@/services/aiSuggestions";

interface SuggestionPanelProps {
  node: Node | null;
  onAdd: (suggestions: SuggestedNode[]) => void;
  className?: string;
}

export function SuggestionPanel({ node, onAdd, className }: SuggestionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSuggestions() {
      if (!node) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await suggestNextNodes({ nodeId: node.id, node });
        if (!cancelled) {
          setSuggestions(result.suggestions);
        }
      } catch (err) {
        console.error("Failed to fetch next suggestions", err);
        if (!cancelled) {
          setError("Unable to load suggestions. Try again later.");
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [node]);

  const handleAdd = useCallback(
    (items: SuggestedNode[]) => {
      onAdd(items);
    },
    [onAdd]
  );

  const handleWrongPath = useCallback(
    async (suggestion: SuggestedNode) => {
      try {
        await submitFeedback({
          reason: "wrong",
          suggestionId: suggestion.label,
          context: { nodeId: node?.id, suggestion },
        });
      } catch (err) {
        console.warn("Feedback submission failed", err);
      }
    },
    [node?.id]
  );

  if (!node) {
    return null;
  }

  return (
    <div
      className={`absolute right-4 top-4 z-50 w-[280px] rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur ${className ?? ""}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">AI Suggestions</h4>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            {node.data?.label || node.id}
          </span>
        </div>

        {loading && (
          <div className="mt-3 text-xs text-slate-500">Loading suggestions…</div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && suggestions.length === 0 && (
          <div className="mt-3 text-xs text-slate-500">No suggestions right now.</div>
        )}

        <ul className="mt-3 space-y-3">
          {suggestions.map((suggestion) => (
            <li
              key={`${suggestion.label}-${suggestion.type}`}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="text-sm font-medium text-slate-900">
                {suggestion.label}
              </div>
              {suggestion.summary && (
                <div className="mt-1 text-xs text-slate-500">
                  {suggestion.summary}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                {suggestion.domain && <span>{suggestion.domain}</span>}
                {typeof suggestion.ring === "number" && (
                  <span>Ring {suggestion.ring}</span>
                )}
                <span>{suggestion.type}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => handleAdd([suggestion])}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
                  onClick={() => handleWrongPath(suggestion)}
                >
                  Wrong path
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
