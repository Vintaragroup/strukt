/**
 * SearchPanel Component
 * Full-screen modal for searching and filtering nodes
 */

import React, { useState, useEffect, useRef } from 'react';
import { Node } from '@xyflow/react';
import { X, Search, Filter, Tag, Sparkles, CheckSquare, FileText } from 'lucide-react';
import { searchNodes, SearchResult, SearchFilters, getAllTags, getAllNodeTypes } from '../utils/search';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onSelectNode: (nodeId: string) => void;
  onFocusNode: (nodeId: string) => void;
}

export function SearchPanel({
  isOpen,
  onClose,
  nodes,
  onSelectNode,
  onFocusNode,
}: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Available filter options
  const availableTags = getAllTags(nodes);
  const availableTypes = getAllNodeTypes(nodes);

  // Perform search when query or filters change
  useEffect(() => {
    if (isOpen) {
      const searchResults = searchNodes(nodes, query, filters);
      setResults(searchResults);
    }
  }, [query, filters, nodes, isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    setFilters({
      ...filters,
      types: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    setFilters({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Handle result click
  const handleResultClick = (nodeId: string) => {
    onFocusNode(nodeId);
    onSelectNode(nodeId);
    onClose();
  };

  // Get active filter count
  const activeFilterCount = 
    (filters.types?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.hasEdgeNotes ? 1 : 0) +
    (filters.hasAIEnrichment ? 1 : 0) +
    (filters.completionStatus && filters.completionStatus !== 'all' ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Main Search Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-blue-400" />
          <h2 className="flex-1">Search Nodes</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search titles, content, tags, todos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 h-12 bg-white/5 border-white/10 focus:border-blue-400/50 focus:bg-white/10"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 border-white/10 hover:bg-white/5"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-blue-500/20 text-blue-300 border-blue-400/30">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-white/60 hover:text-white hover:bg-white/5"
              >
                Clear filters
              </Button>
            )}

            <div className="flex-1" />

            <span className="text-sm text-white/40">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-6 py-4 bg-white/5 border-t border-b border-white/10">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Node Types */}
              {availableTypes.length > 0 && (
                <div>
                  <Label className="text-xs text-white/60 mb-2 block">Node Types</Label>
                  <div className="space-y-2">
                    {availableTypes.map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.types?.includes(type) || false}
                          onCheckedChange={() => toggleTypeFilter(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer capitalize">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                  <Label className="text-xs text-white/60 mb-2 block">Tags</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center gap-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={filters.tags?.includes(tag) || false}
                          onCheckedChange={() => toggleTagFilter(tag)}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Filters */}
            <Separator className="my-4 bg-white/10" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has-enrichment"
                  checked={filters.hasAIEnrichment || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasAIEnrichment: checked ? true : undefined })
                  }
                />
                <Label htmlFor="has-enrichment" className="text-sm cursor-pointer flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Enriched Nodes Only
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="has-edge-notes"
                  checked={filters.hasEdgeNotes || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasEdgeNotes: checked ? true : undefined })
                  }
                />
                <Label htmlFor="has-edge-notes" className="text-sm cursor-pointer flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Has Edge Notes
                </Label>
              </div>
            </div>

            {/* Todo Status */}
            <div className="mt-4">
              <Label className="text-xs text-white/60 mb-2 block">Todo Status</Label>
              <div className="flex gap-2">
                <Button
                  variant={!filters.completionStatus || filters.completionStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, completionStatus: 'all' })}
                  className="h-8"
                >
                  All
                </Button>
                <Button
                  variant={filters.completionStatus === 'complete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, completionStatus: 'complete' })}
                  className="h-8"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Complete
                </Button>
                <Button
                  variant={filters.completionStatus === 'incomplete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, completionStatus: 'incomplete' })}
                  className="h-8"
                >
                  Incomplete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <ScrollArea className="h-[400px]">
          <div className="px-6 py-4">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">
                  {query || activeFilterCount > 0 ? 'No results found' : 'Start typing to search...'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <SearchResultCard
                    key={result.node.id}
                    result={result}
                    onClick={() => handleResultClick(result.node.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Press <kbd className="px-2 py-0.5 bg-white/10 rounded">Esc</kbd> to close</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual search result card
 */
function SearchResultCard({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  const { node, matches } = result;
  const title = node.data.label || 'Untitled';
  const type = node.data.type || 'note';
  const tags = node.data.tags || [];
  const enrichmentCount = node.data.enrichmentCount || 0;

  // Get preview text from matches
  const getPreview = () => {
    const contentMatch = matches.find((m) => m.field === 'content');
    if (contentMatch) {
      const text = contentMatch.text;
      const preview = text.length > 100 ? text.slice(0, 100) + '...' : text;
      return preview;
    }
    return node.data.content ? (node.data.content.slice(0, 100) + '...') : '';
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/30 transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Icon based on type */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          type === 'feature' ? 'bg-blue-500/20 text-blue-400' :
          type === 'task' ? 'bg-green-500/20 text-green-400' :
          type === 'idea' ? 'bg-purple-500/20 text-purple-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          <FileText className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="group-hover:text-blue-400 transition-colors line-clamp-1">
              {title}
            </h3>
            {enrichmentCount > 0 && (
              <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            )}
          </div>

          {/* Preview */}
          {getPreview() && (
            <p className="text-sm text-white/60 line-clamp-2 mb-2">
              {getPreview()}
            </p>
          )}

          {/* Tags and Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize border-white/20">
              {type}
            </Badge>
            {tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-blue-500/10 text-blue-300 border-blue-400/20">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-white/40">+{tags.length - 3} more</span>
            )}
          </div>

          {/* Match indicators */}
          {matches.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
              Matches in: {matches.map((m) => m.field).join(', ')}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
