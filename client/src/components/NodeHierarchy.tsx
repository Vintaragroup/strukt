import { Node } from "@xyflow/react";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CustomNodeData } from "./CustomNode";

interface NodeHierarchyProps {
  nodes: Node[];
  selectedNodeIds: string[];
  onNodeClick: (nodeId: string) => void;
  onCenterClick: () => void;
}

export function NodeHierarchy({ 
  nodes, 
  selectedNodeIds, 
  onNodeClick,
  onCenterClick 
}: NodeHierarchyProps) {
  // Find the center node
  const isCenterNode = (node: Node | null | undefined) =>
    Boolean(node && (node.type === "center" || node.id === "center" || node.id === "center-node"));
  const centerNode = nodes.find((n) => isCenterNode(n));

  // Get selected nodes
  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id) && !isCenterNode(n));
  
  // If no selection, don't show breadcrumb
  if (selectedNodes.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
        <div className="backdrop-blur-md bg-white/80 border border-gray-200/80 rounded-xl shadow-sm px-4 py-2 flex items-center gap-2">
          {/* Center/Home button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCenterClick}
                className="h-7 px-2 hover:bg-gray-100 text-gray-600"
              >
                <Home className="w-3.5 h-3.5" />
                {centerNode && (
                  <span className="ml-1.5 text-xs">{(centerNode.data as unknown as CustomNodeData).label}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go to center node</p>
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />

          {/* Selected nodes */}
          <div className="flex items-center gap-2">
            {selectedNodes.slice(0, 3).map((node, index) => (
              <div key={node.id} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNodeClick(node.id)}
                      className="h-7 px-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200"
                    >
                      <span className="text-xs max-w-[120px] truncate">
                        {(node.data as unknown as CustomNodeData).label}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Focus on {(node.data as unknown as CustomNodeData).label}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
            
            {selectedNodes.length > 3 && (
              <span className="text-xs text-gray-400">
                +{selectedNodes.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
