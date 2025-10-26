import { useState } from "react";
import { MiniMap } from "@xyflow/react";
import { Button } from "./ui/button";
import { Map, MapPin, Maximize2, Minimize2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MinimapPanelProps {
  nodeColor?: (node: any) => string;
  className?: string;
}

export function MinimapPanel({ nodeColor, className = "" }: MinimapPanelProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Default node coloring function based on node type
  const defaultNodeColor = (node: any): string => {
    if (node.type === "center") {
      return "rgba(147, 51, 234, 0.6)"; // Purple for center
    }
    
    const nodeType = node.data?.type;
    switch (nodeType) {
      case "frontend":
        return "rgba(59, 130, 246, 0.6)"; // Blue
      case "backend":
        return "rgba(34, 197, 94, 0.6)"; // Green
      case "requirement":
        return "rgba(249, 115, 22, 0.6)"; // Orange
      case "doc":
        return "rgba(168, 85, 247, 0.6)"; // Purple
      default:
        return "rgba(148, 163, 184, 0.6)"; // Gray
    }
  };

  return (
    <div className={`fixed bottom-36 right-6 z-50 flex flex-col items-end gap-2 ${className}`}>
      {/* Toggle Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={() => setIsVisible(!isVisible)}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 rounded-lg bg-gray-800/80 backdrop-blur-xl border-2 border-gray-600/50 hover:bg-gray-700/80 hover:border-gray-500/70 transition-all shadow-lg"
          title={isVisible ? "Hide Minimap" : "Show Minimap"}
        >
          {isVisible ? (
            <EyeOff className="h-3.5 w-3.5 text-white" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-white" />
          )}
        </Button>
      </motion.div>

      {/* Minimap Container */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              relative rounded-2xl overflow-hidden
              bg-gradient-to-br from-white/10 to-white/5
              backdrop-blur-xl
              border border-white/20
              shadow-2xl
              ${isExpanded ? "w-80 h-64" : "w-56 h-40"}
              transition-all duration-300
            `}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 bg-black/20 backdrop-blur-sm border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-3.5 w-3.5 text-white/70" />
                <span className="text-xs text-white/90">Canvas Map</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-white/30 shadow-sm transition-all"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5 text-white" />
                  )}
                </Button>
              </div>
            </div>

            {/* MiniMap */}
            <div className="w-full h-full pt-9">
              <MiniMap
                nodeColor={nodeColor || defaultNodeColor}
                nodeStrokeWidth={3}
                nodeStrokeColor={(node) => {
                  if (node.selected) return "rgba(255, 255, 255, 0.9)";
                  return "rgba(255, 255, 255, 0.2)";
                }}
                nodeBorderRadius={8}
                maskColor="rgba(0, 0, 0, 0.3)"
                className="minimap-custom"
                style={{
                  backgroundColor: "transparent",
                }}
                pannable
                zoomable
              />
            </div>

            {/* Legend (only in expanded mode) */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/30 backdrop-blur-sm border-t border-white/10"
              >
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-white/70">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-purple-500/60" />
                    <span>Center</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-blue-500/60" />
                    <span>Frontend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-green-500/60" />
                    <span>Backend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-orange-500/60" />
                    <span>Requirement</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Glassy overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-white/5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
