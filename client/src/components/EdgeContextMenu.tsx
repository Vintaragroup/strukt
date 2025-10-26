import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "./ui/context-menu";
import { 
  RelationshipType, 
  getRelationshipLabel, 
  getRelationshipColor,
  getRelationshipIcon 
} from "../utils/relationships";
import { Check } from "lucide-react";

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string | null;
  currentRelationshipType?: RelationshipType;
  onChangeRelationshipType: (edgeId: string, type: RelationshipType) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClose: () => void;
}

const relationshipTypes: RelationshipType[] = [
  "depends-on",
  "blocks",
  "implements",
  "tests",
  "documents",
  "extends",
  "references",
  "related-to",
];

export function EdgeContextMenu({
  x,
  y,
  edgeId,
  currentRelationshipType = "related-to",
  onChangeRelationshipType,
  onDeleteEdge,
  onClose,
}: EdgeContextMenuProps) {
  const [isOpen, setIsOpen] = useState(!!edgeId);

  useEffect(() => {
    setIsOpen(!!edgeId);
  }, [edgeId]);

  useEffect(() => {
    if (!isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  if (!edgeId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999]"
          style={{ left: x, top: y }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[220px] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600">Connection Options</p>
            </div>

            {/* Relationship Types */}
            <div className="py-1">
              <div className="px-3 py-1.5">
                <p className="text-xs text-gray-500">Relationship Type:</p>
              </div>
              {relationshipTypes.map((type) => {
                const isActive = type === currentRelationshipType;
                const color = getRelationshipColor(type);
                const label = getRelationshipLabel(type);
                const icon = getRelationshipIcon(type);

                return (
                  <button
                    key={type}
                    onClick={() => {
                      onChangeRelationshipType(edgeId, type);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 ${
                      isActive ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs">{icon}</span>
                      <span className={isActive ? "text-indigo-700" : "text-gray-700"}>
                        {label}
                      </span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="h-px bg-gray-200" />

            {/* Delete */}
            <div className="py-1">
              <button
                onClick={() => {
                  onDeleteEdge(edgeId);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
              >
                Delete Connection
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
