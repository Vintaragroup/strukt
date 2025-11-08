import { useEffect, useRef } from "react";
import {
  Copy,
  Trash2,
  GitBranch,
  Sparkles,
  CornerDownRight,
  FileJson,
  FileCode2,
  ClipboardCopy,
  Maximize2,
  Minimize2,
  CircleSlash2,
  Settings2,
  FolderPlus,
  FolderMinus,
  LayoutGrid,
} from "lucide-react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeLabel: string;
  isCollapsed?: boolean;
  allowCollapse: boolean;
  allowDuplicate: boolean;
  allowDelete: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onEnrich?: () => void;
  onCopyData?: () => void;
  onExportJSON?: () => void;
  onExportMarkdown?: () => void;
  onExportSubgraphJSON?: () => void;
  onExportSubgraphMarkdown?: () => void;
  onMarkIncorrectSuggestion?: () => void;
  onAutoCreateForNode?: () => void;
  onReconfigureFoundation?: () => void;
  onGroupChildren?: () => void; // collapse this node + selected peers into aggregate
  onExpandAggregate?: () => void; // expand if this node is an aggregate
  onOrganizeChildren?: () => void; // locally arrange immediate children around this node
}

export function NodeContextMenu({
  x,
  y,
  nodeLabel,
  isCollapsed,
  allowCollapse,
  allowDuplicate,
  allowDelete,
  onClose,
  onToggleCollapse,
  onDuplicate,
  onDelete,
  onEnrich,
  onCopyData,
  onExportJSON,
  onExportMarkdown,
  onExportSubgraphJSON,
  onExportSubgraphMarkdown,
  onMarkIncorrectSuggestion,
  onAutoCreateForNode,
  onReconfigureFoundation,
  onGroupChildren,
  onExpandAggregate,
  onOrganizeChildren,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleAction = (cb?: () => void) => {
    if (cb) cb();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] max-w-[240px] overflow-hidden rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm p-1 shadow-xl"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 truncate">
        {nodeLabel}
      </div>

      {onReconfigureFoundation && (
        <button
          onClick={() => handleAction(onReconfigureFoundation)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          <span>Reconfigure foundation…</span>
        </button>
      )}

      {onAutoCreateForNode && (
        <button
          onClick={() => handleAction(onAutoCreateForNode)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Auto‑create for this node…</span>
        </button>
      )}

      {allowCollapse && (
        <button
          onClick={() => handleAction(onToggleCollapse)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
      <span>{isCollapsed ? "Expand" : "Collapse"}</span>
    </button>
  )}

  {/* Aggregate group actions */}
  {onGroupChildren && (
    <button
      onClick={() => handleAction(onGroupChildren)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
    >
      <FolderPlus className="w-4 h-4" />
      <span>Group with selection</span>
    </button>
  )}
  {onExpandAggregate && (
    <button
      onClick={() => handleAction(onExpandAggregate)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
    >
      <FolderMinus className="w-4 h-4" />
      <span>Expand group</span>
    </button>
  )}

  {onEnrich && (
        <button
          onClick={() => handleAction(onEnrich)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
      <span>Enrich with AI</span>
    </button>
  )}

  {onOrganizeChildren && (
    <button
      onClick={() => handleAction(onOrganizeChildren)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
    >
      <LayoutGrid className="w-4 h-4" />
      <span>Organize children</span>
    </button>
  )}

  {onMarkIncorrectSuggestion && (
    <button
      onClick={() => handleAction(onMarkIncorrectSuggestion)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-amber-50 hover:text-amber-900 transition-colors"
    >
      <CircleSlash2 className="w-4 h-4" />
      <span>Mark as Incorrect Suggestion</span>
    </button>
  )}

  {allowDuplicate && (
        <button
          onClick={() => handleAction(onDuplicate)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate</span>
        </button>
      )}

      {onCopyData && (
        <button
          onClick={() => handleAction(onCopyData)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
        >
          <ClipboardCopy className="w-4 h-4" />
          <span>Copy Summary</span>
        </button>
      )}

      {(onExportJSON || onExportMarkdown || onExportSubgraphJSON || onExportSubgraphMarkdown) && (
        <>
          <div className="h-px bg-gray-200 my-1" />
          {onExportJSON && (
            <button
              onClick={() => handleAction(onExportJSON)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <FileJson className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          )}
          {onExportMarkdown && (
            <button
              onClick={() => handleAction(onExportMarkdown)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Export Markdown</span>
            </button>
          )}
          {onExportSubgraphJSON && (
            <button
              onClick={() => handleAction(onExportSubgraphJSON)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              <span>Export Subgraph (JSON)</span>
            </button>
          )}
          {onExportSubgraphMarkdown && (
            <button
              onClick={() => handleAction(onExportSubgraphMarkdown)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <CornerDownRight className="w-4 h-4" />
              <span>Export Subgraph (Markdown)</span>
            </button>
          )}
        </>
      )}

      {allowDelete && (
        <>
          <div className="h-px bg-gray-200 my-1" />
          <button
            onClick={() => handleAction(onDelete)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-red-50 hover:text-red-900 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
}
