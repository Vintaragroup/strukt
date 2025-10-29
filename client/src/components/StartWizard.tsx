import { useState } from "react";
import { suggestStartNodes } from "@/services/aiSuggestions";
import type { SuggestedNode } from "@/types/ai";

interface StartWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (suggested: SuggestedNode[]) => void;
}

export function StartWizard({ isOpen, onClose, onAccept }: StartWizardProps) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suggestStartNodes(idea);
      setSuggestions(res.suggestions);
    } catch (err) {
      console.error("Failed to fetch start suggestions", err);
      setError("We couldn't generate ideas right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (nodes: SuggestedNode[]) => {
    onAccept(nodes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            What do you want to create?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Describe your project idea and we will draft a starting set of nodes for you.
        </p>

        <label htmlFor="start-wizard-idea" className="sr-only">
          Project idea
        </label>
        <textarea
          id="start-wizard-idea"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
          placeholder="e.g. AI app for coaching sales teams"
          onChange={(event) => setIdea(event.target.value)}
          value={idea}
        />

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || idea.trim().length === 0}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? "Thinking..." : "Generate"}
          </button>

          <button
            type="button"
            onClick={() => handleAccept(suggestions)}
            disabled={suggestions.length === 0}
            className="rounded-md border border-indigo-200 text-indigo-600 px-4 py-2 text-sm font-medium disabled:border-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            Add All
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Suggested nodes</h3>
            <ul className="space-y-3">
              {suggestions.map((suggestion) => (
                <li
                  key={`${suggestion.label}-${suggestion.type}`}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{suggestion.label}</div>
                      {suggestion.summary && (
                        <div className="text-xs text-slate-500 mt-1">
                          {suggestion.summary}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                        {suggestion.domain && <span>{suggestion.domain}</span>}
                        {typeof suggestion.ring === "number" && (
                          <span>Ring {suggestion.ring}</span>
                        )}
                        <span>{suggestion.type}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs rounded-md bg-emerald-600 text-white px-3 py-1 font-medium"
                      onClick={() => handleAccept([suggestion])}
                    >
                      Add Node
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
