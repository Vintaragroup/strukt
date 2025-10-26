import { Sparkles, Plus, Layout, MousePointer2 } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface EmptyStateProps {
  onAddNode: () => void;
  onOpenAI: () => void;
  onStartTutorial: () => void;
}

export function EmptyState({ onAddNode, onOpenAI, onStartTutorial }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100]"
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-indigo-100 p-8 max-w-2xl pointer-events-auto">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 cursor-pointer group"
            onClick={onStartTutorial}
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
            onClick={onOpenAI}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h4 className="mb-1 text-purple-900">Use Templates</h4>
            <p className="text-sm text-purple-700">
              Start with AI-powered templates
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 cursor-pointer group"
            onClick={onAddNode}
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h4 className="mb-1 text-indigo-900">Add First Node</h4>
            <p className="text-sm text-indigo-700">
              Build from scratch manually
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
