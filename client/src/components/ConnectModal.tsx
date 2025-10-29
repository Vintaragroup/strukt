import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Link2, Info, GitBranch } from "lucide-react";
import {
  RelationshipType,
  getRelationshipLabel,
  getRelationshipColor,
  getRelationshipIcon,
} from "../utils/relationships";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white max-h-[calc(100vh-4rem)] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600" />
            Connect Nodes
          </DialogTitle>
          <DialogDescription>
            Create connections between nodes to visualize relationships.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-blue-900">How to Connect Nodes:</h4>
                <ol className="text-blue-800 text-sm space-y-1.5 list-decimal list-inside">
                  <li>Select or hover over a node to reveal connection handles</li>
                  <li>Click and drag from a handle (small circles on edges)</li>
                  <li>Drag to another node's handle</li>
                  <li>Release to create the connection</li>
                </ol>
                <p className="text-blue-700 text-xs mt-2">
                  💡 <strong>Tip:</strong> Filled handles (indigo) are for dragging from. Empty handles (white) are for dragging to.
                </p>
              </div>
            </div>
          </div>

          {/* Relationship Types */}
          <div className="space-y-3">
            <h4 className="text-sm text-gray-700 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-600" />
              Relationship Types:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(["depends-on", "blocks", "implements", "tests", "documents", "extends", "references", "related-to"] as RelationshipType[]).map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-1.5 p-2 bg-gray-50 rounded"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getRelationshipColor(type) }}
                  />
                  <span>
                    {getRelationshipIcon(type)} {getRelationshipLabel(type)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Right-click on edges to change relationship types and manage dependencies
            </p>
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <h4 className="text-sm text-gray-700">Tips:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0">•</span>
                <span>Nodes automatically route connections based on their relative positions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0">•</span>
                <span>Move nodes around to see connections automatically adjust</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 shrink-0">•</span>
                <span>Use the Relationships panel to view dependencies and critical paths</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
