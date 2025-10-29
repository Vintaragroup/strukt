import { useState } from "react";
import { Layout, MousePointer2, GitBranch, Loader2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { suggestStartNodes } from "@/services/aiSuggestions";
import type { SuggestedNode } from "@/types/ai";

interface EmptyStateProps {
  onConnectSources: () => void;
  onStartTutorial: () => void;
  onDismiss: () => void;
  onAcceptSuggestions: (suggestions: SuggestedNode[]) => void;
}

export function EmptyState({ onConnectSources, onStartTutorial, onDismiss, onAcceptSuggestions }: EmptyStateProps) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await suggestStartNodes(idea.trim());
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error("Failed to fetch start suggestions", err);
      setError("We couldn't generate ideas right now. Try again in a moment.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (items: SuggestedNode[]) => {
    if (!items || items.length === 0) return;
    onAcceptSuggestions(items);
    handleDismiss();
    setSuggestions([]);
  };

  const handleDismiss = () => {
    setSuggestions([]);
    setError(null);
    setLoading(false);
    setIdea("");
    onDismiss();
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200] bg-white/30 backdrop-blur-lg"
    >
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-indigo-100 p-8 max-w-2xl pointer-events-auto">
        <button
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 border border-indigo-100 flex items-center justify-center text-indigo-500 hover:bg-white transition"
          onClick={handleDismiss}
        >
          ×
        </button>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Layout className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to FlowForge
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            A modern visual whiteboard for planning and organizing your project requirements
          </p>
        </div>

        {/* Idea Prompt */}
        <div className="bg-white/85 border border-indigo-100 rounded-2xl p-5 shadow-sm mb-6 text-left">
          <label
            htmlFor="empty-state-idea"
            className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-3"
          >
            <Plus className="w-4 h-4" />
            What do you want to create?
          </label>
          <textarea
            id="empty-state-idea"
            className="w-full rounded-xl border border-indigo-100 bg-white/70 px-3 py-2 text-sm text-slate-700 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 min-h-[88px] resize-none"
            placeholder="e.g. AI app for coaching sales teams"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
          />
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading || idea.trim().length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </span>
              ) : (
                "Generate"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAccept(suggestions)}
              disabled={suggestions.length === 0}
            >
              Add All
            </Button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50 px-3 py-2">
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <ul className="mt-4 space-y-3">
              {suggestions.map((suggestion) => (
                <li
                  key={`${suggestion.label}-${suggestion.type}`}
                  className="border border-indigo-100 rounded-xl p-3 bg-white/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {suggestion.label}
                      </div>
                      {suggestion.summary && (
                        <div className="text-xs text-slate-500 mt-1">
                          {suggestion.summary}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                        {suggestion.domain && <span>{suggestion.domain}</span>}
                        {typeof suggestion.ring === "number" && <span>Ring {suggestion.ring}</span>}
                        <span>{suggestion.type}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleAccept([suggestion])}
                    >
                      Add Node
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 cursor-pointer group"
            onClick={() => {
            onStartTutorial();
            handleDismiss();
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MousePointer2 className="w-5 h-5 text-white" />
            </div>
            <h4 className="mb-1 text-blue-900">Quick Tutorial</h4>
            <p className="text-sm text-blue-700">
              Learn the basics in 2 minutes
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 cursor-pointer group"
            onClick={() => {
              onConnectSources();
              handleDismiss();
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <h4 className="mb-1 text-purple-900">Connect Git or Wiki</h4>
            <p className="text-sm text-purple-700">
              Import code insights and documentation context
            </p>
          </motion.div>
        </div>

        {/* Tips */}
        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
          <h5 className="text-sm mb-2 text-indigo-900">💡 Pro Tips</h5>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• Use <kbd className="px-1.5 py-0.5 bg-white rounded border border-indigo-200 text-xs">Space + Drag</kbd> to pan the canvas</li>
            <li>• Select nodes and click the drag handles to create connections</li>
            <li>• Use the toolbar to auto-arrange and align your nodes</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
