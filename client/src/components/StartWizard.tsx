import { useState, useEffect } from "react";
import { continueWizard, suggestStartNodes } from "@/services/aiSuggestions";
import type { SuggestedNode } from "@/types/ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface StartWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (suggested: SuggestedNode[], options?: { suggestionId?: string }) => void;
  workspaceId: string;
  sessionId: string | null;
  onSession: (sessionId: string | null) => void;
}

export function StartWizard({
  isOpen,
  onClose,
  onAccept,
  workspaceId,
  sessionId,
  onSession,
}: StartWizardProps) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIdea("");
      setSuggestions([]);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = sessionId
        ? await continueWizard({ sessionId, idea })
        : await suggestStartNodes({ workspaceId, idea });
      if (res.sessionId) {
        onSession(res.sessionId);
      }
      setSuggestions(res.suggestions);
    } catch (err) {
      console.error("Failed to fetch start suggestions", err);
      setError("We couldn't generate ideas right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (nodes: SuggestedNode[], suggestionId?: string) => {
    onAccept(nodes, suggestionId ? { suggestionId } : undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        data-testid="start-wizard-modal"
        className="sm:max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden backdrop-blur-xl bg-white/95 px-0"
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                What do you want to create?
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Describe your project idea and we will draft a starting set of nodes for you.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800"
            >
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          <textarea
            id="start-wizard-idea"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
            placeholder="e.g. AI app for coaching sales teams"
            onChange={(event) => setIdea(event.target.value)}
            value={idea}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleStart}
              disabled={loading || idea.trim().length === 0}
            >
              {loading ? "Thinking..." : "Generate"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAccept(suggestions)}
              disabled={suggestions.length === 0}
            >
              Add All
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Suggested nodes</h3>
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
                        <Button
                          type="button"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAccept([suggestion], suggestion.id)}
                        >
                          Add Node
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
