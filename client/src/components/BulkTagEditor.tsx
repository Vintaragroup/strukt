/**
 * BulkTagEditor Component
 * Modal for editing tags on multiple nodes at once
 */

import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { getAllUniqueTags } from '../utils/bulkOperations';

interface BulkTagEditorProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  selectedCount: number;
  onAddTags: (tags: string[]) => void;
  onRemoveTags: (tags: string[]) => void;
  onReplaceTags: (tags: string[]) => void;
}

export function BulkTagEditor({
  isOpen,
  onClose,
  nodes,
  selectedCount,
  onAddTags,
  onRemoveTags,
  onReplaceTags,
}: BulkTagEditorProps) {
  const [mode, setMode] = useState<'add' | 'remove' | 'replace'>('add');
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get existing tags from selected nodes
  const selectedNodes = nodes.filter((n) => n.selected && n.id !== 'center');
  const existingTags = new Set<string>();
  selectedNodes.forEach((node) => {
    const tags = node.data.tags || [];
    tags.forEach((tag: string) => existingTags.add(tag));
  });

  // Get all available tags
  const allTags = getAllUniqueTags(nodes);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setMode('add');
      setNewTagInput('');
      setSelectedTags([]);
    }
  }, [isOpen]);

  // Handle adding a new tag
  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setNewTagInput('');
    }
  };

  // Handle removing a tag from selection
  const handleRemoveFromSelection = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // Handle quick-select from existing tags
  const handleQuickSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveFromSelection(tag);
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Handle apply
  const handleApply = () => {
    if (selectedTags.length === 0) {
      return;
    }

    if (mode === 'add') {
      onAddTags(selectedTags);
    } else if (mode === 'remove') {
      onRemoveTags(selectedTags);
    } else if (mode === 'replace') {
      onReplaceTags(selectedTags);
    }

    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && e.metaKey) {
        handleApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedTags, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <TagIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-white">Bulk Tag Editor</h2>
              <p className="text-sm text-white/60">
                Editing {selectedCount} node{selectedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection */}
        <div className="px-6 py-4 bg-white/5">
          <Label className="text-xs text-white/60 mb-2 block">Action</Label>
          <div className="flex gap-2">
            <Button
              variant={mode === 'add' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('add')}
              className={mode === 'add' ? '' : 'border-white/10 hover:bg-white/5'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tags
            </Button>
            <Button
              variant={mode === 'remove' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('remove')}
              className={mode === 'remove' ? '' : 'border-white/10 hover:bg-white/5'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Tags
            </Button>
            <Button
              variant={mode === 'replace' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('replace')}
              className={mode === 'replace' ? '' : 'border-white/10 hover:bg-white/5'}
            >
              <TagIcon className="w-4 h-4 mr-2" />
              Replace All Tags
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          
          {/* Mode Description */}
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
            <p className="text-sm text-blue-300">
              {mode === 'add' &&
                'Add the selected tags to all selected nodes (keeps existing tags)'}
              {mode === 'remove' &&
                'Remove the selected tags from all selected nodes (keeps other tags)'}
              {mode === 'replace' &&
                'Replace all tags on selected nodes with only the selected tags'}
            </p>
          </div>

          {/* Add New Tag */}
          <div className="mb-4">
            <Label className="text-xs text-white/60 mb-2 block">
              {mode === 'remove' ? 'Select Tags to Remove' : 'Add Tags'}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag name..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-white/5 border-white/10 focus:border-blue-400/50"
              />
              <Button
                onClick={handleAddTag}
                disabled={!newTagInput.trim()}
                className="px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="mb-4">
              <Label className="text-xs text-white/60 mb-2 block">
                Selected Tags ({selectedTags.length})
              </Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveFromSelection(tag)}
                      className="ml-1 p-0.5 hover:bg-white/10 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4 bg-white/10" />

          {/* Existing Tags (Quick Select) */}
          <div>
            <Label className="text-xs text-white/60 mb-2 block">
              {mode === 'remove'
                ? 'Tags in Selected Nodes'
                : 'Quick Select from Existing Tags'}
            </Label>
            <ScrollArea className="h-32 rounded-lg border border-white/10 bg-white/5 p-3">
              {(mode === 'remove' ? Array.from(existingTags) : allTags).length === 0 ? (
                <p className="text-sm text-white/40 text-center py-4">
                  {mode === 'remove'
                    ? 'Selected nodes have no tags'
                    : 'No tags available in canvas'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(mode === 'remove' ? Array.from(existingTags) : allTags).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleQuickSelect(tag)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="text-xs text-white/40">
            Press <kbd className="px-2 py-0.5 bg-white/10 rounded">Esc</kbd> to cancel •{' '}
            <kbd className="px-2 py-0.5 bg-white/10 rounded">Cmd+Enter</kbd> to apply
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-white/10">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={selectedTags.length === 0}
            >
              Apply to {selectedCount} Node{selectedCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
