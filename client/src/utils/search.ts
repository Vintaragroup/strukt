/**
 * Search Utility
 * Provides fuzzy search and filtering across all nodes
 */

import { Node } from '@xyflow/react';

const CENTER_ID_FALLBACKS = new Set(['center', 'center-node']);

function isCenterNode(node: Node | null | undefined): boolean {
  if (!node) return false;
  return node.type === 'center' || CENTER_ID_FALLBACKS.has(node.id);
}

export interface SearchResult {
  node: Node;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: 'title' | 'content' | 'tags';
  text: string;
  indices: [number, number][]; // Highlight positions
}

export interface SearchFilters {
  types?: string[]; // Filter by node type
  tags?: string[]; // Filter by tags
  completionStatus?: 'all' | 'complete' | 'incomplete';
  hasAIEnrichment?: boolean; // Only nodes with enrichment
  hasEdgeNotes?: boolean; // Nodes that have edgeNotes present
}

/**
 * Performs fuzzy search across nodes
 */
export function searchNodes(
  nodes: Node[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  if (!query.trim() && !filters) {
    return [];
  }

  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase().trim();

  for (const node of nodes) {
    // Skip center node
    if (isCenterNode(node)) continue;

    // Apply filters
    if (filters && !passesFilters(node, filters)) {
      continue;
    }

    const nodeData = node.data as any || {};

    // If no query, include all filtered nodes
    if (!queryLower) {
      results.push({
        node,
        score: 100,
        matches: [],
      });
      continue;
    }

    const matches: SearchMatch[] = [];
    let totalScore = 0;

    // Search in label/title
    const title = nodeData.label || nodeData.title || '';
    if (typeof title === 'string' && title.toLowerCase().includes(queryLower)) {
      matches.push({
        field: 'title',
        text: title,
        indices: [],
      });
      totalScore += 30;
    }

    // Search in summary/content
    const content = nodeData.summary || nodeData.content || '';
    if (typeof content === 'string' && content.toLowerCase().includes(queryLower)) {
      matches.push({
        field: 'content',
        text: content,
        indices: [],
      });
      totalScore += 15;
    }

    // Search in tags
    const tags = nodeData.tags || [];
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag === 'string' && tag.toLowerCase().includes(queryLower)) {
          matches.push({
            field: 'tags',
            text: tag,
            indices: [],
          });
          totalScore += 10;
        }
      }
    }

    if (matches.length > 0) {
      results.push({
        node,
        score: totalScore,
        matches,
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

function passesFilters(node: Node, filters: SearchFilters): boolean {
  const nodeData = node.data as any || {};

  if (filters.types && !filters.types.includes(node.type)) {
    return false;
  }

  if (filters.tags && Array.isArray(nodeData.tags)) {
    const hasTag = (nodeData.tags as string[]).some((tag) =>
      filters.tags?.includes(tag)
    );
    if (!hasTag) return false;
  }

  if (filters.hasAIEnrichment) {
    const hasEnrichment = (nodeData.enrichmentCount || 0) > 0;
    if (!hasEnrichment) return false;
  }

  if (filters.hasEdgeNotes) {
    const hasNotes = !!(nodeData.edgeNotes && Object.keys(nodeData.edgeNotes).length > 0);
    if (!hasNotes) return false;
  }

  return true;
}

// Simple string matching (replaces fuzzy match for compatibility)
function stringMatch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Extracts all unique tags from nodes
 */
export function getAllTags(nodes: Node[]): string[] {
  const tags = new Set<string>();

  for (const node of nodes) {
    const nodeData = node.data as any || {};
    const nodeTags = nodeData.tags || [];
    if (Array.isArray(nodeTags)) {
      for (const tag of nodeTags) {
        if (typeof tag === 'string') {
          tags.add(tag);
        }
      }
    }
  }

  return Array.from(tags).sort();
}

/**
 * Extracts all unique node types from nodes
 */
export function getAllNodeTypes(nodes: Node[]): string[] {
  const types = new Set<string>();

  for (const node of nodes) {
    if (node.type && node.type !== 'center') {
      types.add(node.type);
    }
  }

  return Array.from(types).sort();
}
