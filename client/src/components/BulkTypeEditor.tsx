/**
 * BulkTypeEditor Component
 * Modal for changing node types on multiple nodes at once
 */

import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Type, Code, Box, Target, FileText, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { getAllUniqueTypes } from '../utils/bulkOperations';

interface BulkTypeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  selectedCount: number;
  onChangeType: (newType: string) => void;
}

const NODE_TYPES = [
  { value: 'frontend', label: 'Frontend', icon: Code, color: 'blue' },
  { value: 'backend', label: 'Backend', icon: Box, color: 'green' },
  { value: 'requirement', label: 'Requirement', icon: Target, color: 'purple' },
  { value: 'doc', label: 'Documentation', icon: FileText, color: 'amber' },
  { value: 'feature', label: 'Feature', icon: Layers, color: 'indigo' },
  { value: 'task', label: 'Task', icon: Target, color: 'emerald' },
  { value: 'idea', label: 'Idea', icon: Layers, color: 'pink' },
  { value: 'other', label: 'Other', icon: Layers, color: 'slate' },
];

export function BulkTypeEditor({
  isOpen,
  onClose,
  nodes,
  selectedCount,
  onChangeType,
}: BulkTypeEditorProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const isCenterNode = (node: Node | null | undefined) =>
    Boolean(node && (node.type === 'center' || node.id === 'center' || node.id === 'center-node'));

  // Get current types from selected nodes
  const selectedNodes = nodes.filter((n) => n.selected && !isCenterNode(n));
  const currentTypes = new Set<string>();
  selectedNodes.forEach((node) => {
    const data: any = node.data || {};
    if (data.type) {
      currentTypes.add(String(data.type));
    }
  });

  // Get all existing types
  const existingTypes = getAllUniqueTypes(nodes);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedType('');
    }
  }, [isOpen]);

  // Handle apply
  const handleApply = () => {
    if (!selectedType) return;
    onChangeType(selectedType);
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selectedType) {
        handleApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl mx-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-white">Change Node Type</h2>
              <p className="text-sm text-white/60">
                Update type for {selectedCount} node{selectedCount !== 1 ? 's' : ''}
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
        <div className="px-6 py-4">
          
          {/* Current Types Info */}
          {currentTypes.size > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
              <p className="text-sm text-blue-300">
                Current type{currentTypes.size > 1 ? 's' : ''}: {' '}
                <span className="text-blue-200 font-medium">
                  {Array.from(currentTypes).join(', ') || 'none'}
                </span>
              </p>
            </div>
          )}

          {/* Type Selection */}
          <div>
            <Label className="text-xs text-white/60 mb-3 block">
              Select New Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {NODE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                const isCurrentType = currentTypes.has(type.value);

                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `bg-${type.color}-500/20 border-${type.color}-400/50`
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? `bg-${type.color}-500/30`
                            : 'bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected
                              ? `text-${type.color}-300`
                              : 'text-white/70'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`${
                              isSelected ? 'text-white' : 'text-white/80'
                            }`}
                          >
                            {type.label}
                          </h3>
                          {isCurrentType && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-1 capitalize">
                          {type.value} node
                        </p>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className={`w-2 h-2 rounded-full bg-${type.color}-400`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing Types (if different from standard) */}
          {existingTypes.some((t) => !NODE_TYPES.find((nt) => nt.value === t)) && (
            <div className="mt-4">
              <Label className="text-xs text-white/60 mb-2 block">
                Custom Types in Canvas
              </Label>
              <div className="flex flex-wrap gap-2">
                {existingTypes
                  .filter((t) => !NODE_TYPES.find((nt) => nt.value === t))
                  .map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedType === type
                          ? 'bg-indigo-500/30 text-indigo-300 border-2 border-indigo-400/50'
                          : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

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
              disabled={!selectedType}
            >
              Apply to {selectedCount} Node{selectedCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
