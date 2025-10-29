/**
 * SelectByCriteria Component
 * Modal for selecting nodes based on various criteria
 */

import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Filter, Tag, Type, Sparkles, FileText, CheckSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { BulkSelectionCriteria } from '../utils/bulkOperations';
import { getAllUniqueTags, getAllUniqueTypes } from '../utils/bulkOperations';

interface SelectByCriteriaProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onApply: (criteria: BulkSelectionCriteria) => void;
}

export function SelectByCriteria({
  isOpen,
  onClose,
  nodes,
  onApply,
}: SelectByCriteriaProps) {
  const [criteria, setCriteria] = useState<BulkSelectionCriteria>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get available options
  const availableTypes = getAllUniqueTypes(nodes);
  const availableTags = getAllUniqueTags(nodes);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCriteria({});
      setSelectedTypes([]);
      setSelectedTags([]);
    }
  }, [isOpen]);

  // Toggle type
  const toggleType = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    setCriteria({
      ...criteria,
      types: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    setCriteria({
      ...criteria,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  // Handle apply
  const handleApply = () => {
    onApply(criteria);
    onClose();
  };

  // Count matching nodes
  const countMatches = () => {
    // Simple estimation - count nodes that would match
    let count = 0;
    nodes.forEach((node) => {
      if (node.id === 'center') return;
      
      let matches = true;
      const data: any = node.data || {};

      if (criteria.types && criteria.types.length > 0) {
        if (!criteria.types.includes(String(data.type))) matches = false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const nodeTags: string[] = Array.isArray(data.tags) ? data.tags : [];
        if (!criteria.tags.some((tag) => nodeTags.includes(tag))) matches = false;
      }

      if (criteria.hasContent !== undefined) {
        const hasContent = !!(data.content || data.summary);
        if (criteria.hasContent !== hasContent) matches = false;
      }

      if (criteria.hasTodos !== undefined) {
        const hasTodos = !!(data.todos && Array.isArray(data.todos) && data.todos.length > 0);
        if (criteria.hasTodos !== hasTodos) matches = false;
      }

      if (criteria.hasAIEnrichment !== undefined) {
        const hasEnrichment = (Number(data.enrichmentCount) || 0) > 0;
        if (criteria.hasAIEnrichment !== hasEnrichment) matches = false;
      }

      if (criteria.hasEdgeNotes !== undefined) {
        const hasNotes = !!(data.edgeNotes && typeof data.edgeNotes === 'object' && Object.keys(data.edgeNotes).length > 0);
        if (criteria.hasEdgeNotes !== hasNotes) matches = false;
      }

      if (matches) count++;
    });

    return count;
  };

  const matchCount = countMatches();
  const hasAnyCriteria = Object.keys(criteria).some((key) => {
    const value = criteria[key as keyof BulkSelectionCriteria];
    return value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && hasAnyCriteria) {
        handleApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasAnyCriteria]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-white">Select by Criteria</h2>
              <p className="text-sm text-white/60">
                Choose nodes matching specific criteria
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

        {/* Content */}
        <ScrollArea className="h-[500px]">
          <div className="px-6 py-4 space-y-6">
            
            {/* Match Count */}
            {hasAnyCriteria && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="text-lg px-4 py-2 bg-white/10 text-white border-white/20"
                  >
                    {matchCount}
                  </Badge>
                  <div>
                    <p className="text-white">
                      {matchCount} node{matchCount !== 1 ? 's' : ''} will be selected
                    </p>
                    <p className="text-sm text-white/60">
                      Based on current criteria
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Node Types */}
            {availableTypes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-blue-400" />
                  <Label className="text-sm text-white">Node Types</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {availableTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      <Label
                        htmlFor={`type-${type}`}
                        className="text-sm cursor-pointer capitalize flex-1"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <Label className="text-sm text-white">Tags</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-400/50'
                          : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Special Criteria */}
            <div>
              <Label className="text-sm text-white mb-3 block">Special Criteria</Label>
              <div className="space-y-3">
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <Label htmlFor="ai-enrichment" className="text-sm cursor-pointer">
                      AI Enriched Nodes
                    </Label>
                  </div>
                  <Checkbox
                    id="ai-enrichment"
                    checked={criteria.hasAIEnrichment || false}
                    onCheckedChange={(checked) =>
                      setCriteria({ ...criteria, hasAIEnrichment: checked ? true : undefined })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <Label htmlFor="has-content" className="text-sm cursor-pointer">
                      Has Content/Summary
                    </Label>
                  </div>
                  <Checkbox
                    id="has-content"
                    checked={criteria.hasContent || false}
                    onCheckedChange={(checked) =>
                      setCriteria({ ...criteria, hasContent: checked ? true : undefined })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-green-400" />
                    <Label htmlFor="has-todos" className="text-sm cursor-pointer">
                      Has Todos
                    </Label>
                  </div>
                  <Checkbox
                    id="has-todos"
                    checked={criteria.hasTodos || false}
                    onCheckedChange={(checked) =>
                      setCriteria({ ...criteria, hasTodos: checked ? true : undefined })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <Label htmlFor="has-edge-notes" className="text-sm cursor-pointer">
                      Has Edge Notes
                    </Label>
                  </div>
                  <Checkbox
                    id="has-edge-notes"
                    checked={criteria.hasEdgeNotes || false}
                    onCheckedChange={(checked) =>
                      setCriteria({ ...criteria, hasEdgeNotes: checked ? true : undefined })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Todo Status */}
            <div>
              <Label className="text-sm text-white mb-3 block">Todo Completion Status</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={criteria.todoCompletionStatus === 'complete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setCriteria({
                      ...criteria,
                      todoCompletionStatus: criteria.todoCompletionStatus === 'complete' ? undefined : 'complete',
                    })
                  }
                  className={criteria.todoCompletionStatus === 'complete' ? '' : 'border-white/10 hover:bg-white/5'}
                >
                  All Complete
                </Button>
                <Button
                  variant={criteria.todoCompletionStatus === 'incomplete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setCriteria({
                      ...criteria,
                      todoCompletionStatus: criteria.todoCompletionStatus === 'incomplete' ? undefined : 'incomplete',
                    })
                  }
                  className={criteria.todoCompletionStatus === 'incomplete' ? '' : 'border-white/10 hover:bg-white/5'}
                >
                  Has Incomplete
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10">
          <div className="text-xs text-white/40">
            Press <kbd className="px-2 py-0.5 bg-white/10 rounded">Esc</kbd> to cancel •{' '}
            <kbd className="px-2 py-0.5 bg-white/10 rounded">Enter</kbd> to apply
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="border-white/10">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasAnyCriteria}
            >
              Select {matchCount} Node{matchCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
