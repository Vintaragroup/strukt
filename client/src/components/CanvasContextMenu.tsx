import { useEffect, useRef } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from './ui/context-menu';
import {
  Copy,
  Trash2,
  MousePointerClick,
  Maximize2,
  Plus,
  Upload,
  Download,
  FileDown,
} from 'lucide-react';

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedCount: number;
  onClose: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onAddNode: () => void;
  onFitView: () => void;
  onImport?: () => void;
  onExportBatch?: () => void;
  onExportCanvas?: () => void;
}

export function CanvasContextMenu({
  isOpen,
  position,
  selectedCount,
  onClose,
  onDuplicateSelected,
  onDeleteSelected,
  onSelectAll,
  onAddNode,
  onFitView,
  onImport,
  onExportBatch,
  onExportCanvas,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm p-1 shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Selection Actions */}
      {selectedCount > 0 && (
        <>
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
            {selectedCount} node{selectedCount !== 1 ? 's' : ''} selected
          </div>
          
          <button
            onClick={() => handleAction(onDuplicateSelected)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate</span>
            <span className="ml-auto text-xs text-gray-400">⌘D</span>
          </button>
          
          <button
            onClick={() => handleAction(onDeleteSelected)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-red-50 hover:text-red-900 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
            <span className="ml-auto text-xs text-gray-400">⌫</span>
          </button>
          
          <div className="h-px bg-gray-200 my-1" />
        </>
      )}

      {/* General Actions */}
      <button
        onClick={() => handleAction(onSelectAll)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
      >
        <MousePointerClick className="w-4 h-4" />
        <span>Select All</span>
        <span className="ml-auto text-xs text-gray-400">⌘A</span>
      </button>

      <div className="h-px bg-gray-200 my-1" />

      <button
        onClick={() => handleAction(onAddNode)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Node</span>
        <span className="ml-auto text-xs text-gray-400">⌘N</span>
      </button>

      <button
        onClick={() => handleAction(onFitView)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
        <span>Fit View</span>
        <span className="ml-auto text-xs text-gray-400">⌘0</span>
      </button>

      {/* Import/Export Actions */}
      {(onImport || onExportBatch || onExportCanvas) && (
        <>
          <div className="h-px bg-gray-200 my-1" />
          
          {onImport && (
            <button
              onClick={() => handleAction(onImport)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Node</span>
              <span className="ml-auto text-xs text-gray-400">⌘I</span>
            </button>
          )}

          {onExportBatch && selectedCount > 0 && (
            <button
              onClick={() => handleAction(onExportBatch)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Selected ({selectedCount})</span>
              <span className="ml-auto text-xs text-gray-400">⌘E</span>
            </button>
          )}

          {onExportCanvas && (
            <button
              onClick={() => handleAction(onExportCanvas)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Canvas</span>
              <span className="ml-auto text-xs text-gray-400">⌘⇧E</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
