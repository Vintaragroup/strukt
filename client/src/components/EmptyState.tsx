import { useState } from "react";
import { Layout, MousePointer2, GitBranch, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface EmptyStateProps {
  onConnectSources: () => void;
  onStartTutorial: () => void;
  onDismiss: () => void;
  onLaunchWizard: (prompt?: string) => void;
}

export function EmptyState({
  onConnectSources,
  onStartTutorial,
  onDismiss,
  onLaunchWizard,
}: EmptyStateProps) {
  const [idea, setIdea] = useState("");

  const handleDismiss = () => {
    setIdea("");
    onDismiss();
  };

  const handleLaunchWizard = () => {
    const trimmed = idea.trim();
    onLaunchWizard(trimmed.length > 0 ? trimmed : undefined);
    handleDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[200] bg-white/30 backdrop-blur-lg flex items-center justify-center px-4 py-6"
      data-testid="welcome-empty-state"
    >
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-indigo-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 pointer-events-auto scroll-smooth">
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
              onClick={handleLaunchWizard}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Launch AI blueprint wizard
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Skip for now
            </Button>
          </div>
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
