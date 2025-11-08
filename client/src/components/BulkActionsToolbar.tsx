/**
 * BulkActionsToolbar Component
 * Floating toolbar that appears when multiple nodes are selected
 * Provides quick access to bulk operations
 */

import React, { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
  CheckSquare,
  Square,
  Copy,
  Trash2,
  Tag,
  Type,
  X,
  MoreHorizontal,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getSelectionStats } from '../utils/bulkOperations';

interface BulkActionsToolbarProps {
  nodes: Node[];
  selectedCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenTagEditor: () => void;
  onOpenTypeEditor: () => void;
  onDeselectAll: () => void;
  onCompleteAllTodos: () => void;
  onIncompleteAllTodos: () => void;
  onClearCards: () => void;
  onExportBatch: () => void;
  onGroupSelected?: () => void;
}

export function BulkActionsToolbar({
  nodes,
  selectedCount,
  onDuplicate,
  onDelete,
  onOpenTagEditor,
  onOpenTypeEditor,
  onDeselectAll,
  onCompleteAllTodos,
  onIncompleteAllTodos,
  onClearCards,
  onExportBatch,
  onGroupSelected,
}: BulkActionsToolbarProps) {
  const [showStats, setShowStats] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const stats = getSelectionStats(nodes);
  const types = Object.keys(stats.byType);
  const topType = types.length > 0 ? types[0] : 'mixed';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="backdrop-blur-md bg-gradient-to-r from-indigo-600/95 via-purple-600/95 to-indigo-600/95 border border-white/20 rounded-2xl shadow-2xl px-4 py-3">
          
          {/* Main Content */}
          <div className="flex items-center gap-3">
            
            {/* Selection Info */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
              <span className="text-sm text-white">
                {selectedCount} selected
              </span>
              {types.length === 1 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/30 capitalize"
                >
                  {topType}
                </Badge>
              )}
            </div>

            <div className="w-px h-6 bg-white/20" />

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {/* Group (Collapse) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onGroupSelected}
                    disabled={!onGroupSelected || selectedCount < 2}
                    className="h-9 w-9 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Group selected (collapse)</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Duplicate */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDuplicate}
                    className="h-9 w-9 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate (Cmd/Ctrl+D)</p>
                </TooltipContent>
              </Tooltip>

              {/* Delete */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="h-9 w-9 text-white hover:bg-red-500/30 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Selected</p>
                </TooltipContent>
              </Tooltip>

              {/* Tag Editor */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenTagEditor}
                    className="h-9 w-9 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Tags</p>
                </TooltipContent>
              </Tooltip>

              {/* Type Editor */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenTypeEditor}
                    className="h-9 w-9 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change Type</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/20 hover:text-white"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-slate-900/95 backdrop-blur-md border-white/10"
                >
                  <DropdownMenuItem
                    onClick={onExportBatch}
                    className="text-white hover:bg-white/10"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem
                    onClick={onCompleteAllTodos}
                    className="text-white hover:bg-white/10"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Complete All Todos
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={onIncompleteAllTodos}
                    className="text-white hover:bg-white/10"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Incomplete All Todos
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem
                    onClick={onClearCards}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cards
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* Deselect All */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDeselectAll}
                    className="h-9 w-9 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deselect All (Esc)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Stats Panel (expandable) */}
          {showStats && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4 text-xs text-white/80">
                <div>
                  <div className="text-white/50 mb-1">With Todos</div>
                  <div className="text-white">{stats.withTodos}</div>
                </div>
                <div>
                  <div className="text-white/50 mb-1">With Content</div>
                  <div className="text-white">{stats.withContent}</div>
                </div>
                <div>
                  <div className="text-white/50 mb-1">AI Enriched</div>
                  <div className="text-white">{stats.withAIEnrichment}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hint Text */}
        <div className="text-center mt-2">
          <span className="text-xs text-white/60 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
            Hold <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80">Shift</kbd> to
            select more • <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80">Esc</kbd> to
            deselect
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
