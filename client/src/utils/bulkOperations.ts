// @ts-nocheck
/**
 * Bulk Operations Utility
 * Provides utilities for operating on multiple nodes at once
 */

import { Node, Edge } from '@xyflow/react';

export interface BulkSelectionCriteria {
  types?: string[];
  tags?: string[];
  hasContent?: boolean;
  hasTodos?: boolean;
  hasAIEnrichment?: boolean;
  hasEdgeNotes?: boolean;
  isConnectedToCenter?: boolean;
  todoCompletionStatus?: 'all' | 'complete' | 'incomplete' | 'none';
}

export interface BulkOperationResult {
  success: boolean;
  affectedNodes: number;
  message: string;
  error?: string;
}

/**
 * Select nodes based on criteria
 */
export function selectNodesByCriteria(
  nodes: Node[],
  criteria: BulkSelectionCriteria,
  edges?: Edge[]
): Node[] {
  return nodes.map((node) => {
    // Never select center node in bulk operations
    if (node.id === 'center-node' || node.id === 'center') {
      return node;
    }

    const shouldSelect = matchesCriteria(node, criteria, edges);

    return {
      ...node,
      selected: shouldSelect,
    };
  });
}

/**
 * Check if a node matches the given criteria
 */
function matchesCriteria(
  node: Node,
  criteria: BulkSelectionCriteria,
  edges?: Edge[]
): boolean {
  // Filter by types
  if (criteria.types && criteria.types.length > 0) {
    const nodeType = node.data.type;
    if (!nodeType || !criteria.types.includes(nodeType)) {
      return false;
    }
  }

  // Filter by tags
  if (criteria.tags && criteria.tags.length > 0) {
    const nodeTags = node.data.tags || [];
    const hasMatchingTag = criteria.tags.some((tag) => nodeTags.includes(tag));
    if (!hasMatchingTag) {
      return false;
    }
  }

  // Filter by content
  if (criteria.hasContent !== undefined) {
    const hasContent = !!(node.data.content || node.data.summary);
    if (criteria.hasContent !== hasContent) {
      return false;
    }
  }

  // Filter by todos
  if (criteria.hasTodos !== undefined) {
    const hasTodos = !!(node.data.todos && node.data.todos.length > 0);
    if (criteria.hasTodos !== hasTodos) {
      return false;
    }
  }

  // Filter by AI enrichment
  if (criteria.hasAIEnrichment !== undefined) {
    const hasEnrichment = (node.data.enrichmentCount || 0) > 0;
    if (criteria.hasAIEnrichment !== hasEnrichment) {
      return false;
    }
  }

  // Filter by edge notes
  if (criteria.hasEdgeNotes !== undefined) {
    const hasNotes = !!(
      node.data.edgeNotes && Object.keys(node.data.edgeNotes).length > 0
    );
    if (criteria.hasEdgeNotes !== hasNotes) {
      return false;
    }
  }

  // Filter by connection to center
  if (criteria.isConnectedToCenter !== undefined && edges) {
    const isConnected = edges.some(
      (edge) =>
        (edge.source === 'center' && edge.target === node.id) ||
        (edge.target === 'center' && edge.source === node.id)
    );
    if (criteria.isConnectedToCenter !== isConnected) {
      return false;
    }
  }

  // Filter by todo completion status
  if (criteria.todoCompletionStatus && criteria.todoCompletionStatus !== 'all') {
    const todos = node.data.todos || [];

    if (criteria.todoCompletionStatus === 'none') {
      if (todos.length > 0) {
        return false;
      }
    } else if (criteria.todoCompletionStatus === 'complete') {
      if (todos.length === 0 || !todos.every((t: any) => t.checked)) {
        return false;
      }
    } else if (criteria.todoCompletionStatus === 'incomplete') {
      if (todos.length === 0 || !todos.some((t: any) => !t.checked)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Add tags to selected nodes
 */
export function bulkAddTags(
  nodes: Node[],
  tagsToAdd: string[]
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    const existingTags = node.data.tags || [];
    const newTags = [...new Set([...existingTags, ...tagsToAdd])]; // Merge and dedupe

    if (newTags.length > existingTags.length) {
      affectedCount++;
    }

    return {
      ...node,
      data: {
        ...node.data,
        tags: newTags,
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Added tags to ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Remove tags from selected nodes
 */
export function bulkRemoveTags(
  nodes: Node[],
  tagsToRemove: string[]
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    const existingTags = node.data.tags || [];
    const newTags = existingTags.filter(
      (tag: string) => !tagsToRemove.includes(tag)
    );

    if (newTags.length < existingTags.length) {
      affectedCount++;
    }

    return {
      ...node,
      data: {
        ...node.data,
        tags: newTags,
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Removed tags from ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Replace tags in selected nodes
 */
export function bulkReplaceTags(
  nodes: Node[],
  newTags: string[]
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    affectedCount++;

    return {
      ...node,
      data: {
        ...node.data,
        tags: newTags,
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Updated tags on ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Change node type for selected nodes
 */
export function bulkChangeType(
  nodes: Node[],
  newType: string
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    affectedCount++;

    return {
      ...node,
      data: {
        ...node.data,
        type: newType,
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Changed type for ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Delete selected nodes and their edges
 */
export function bulkDeleteNodes(
  nodes: Node[],
  edges: Edge[]
): {
  nodes: Node[];
  edges: Edge[];
  result: BulkOperationResult;
} {
  const selectedIds = nodes
    .filter((n) => n.selected && n.id !== 'center' && n.id !== 'center-node')
    .map((n) => n.id);

  const updatedNodes = nodes.filter((n) => !selectedIds.includes(n.id));
  const updatedEdges = edges.filter(
    (e) => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)
  );

  return {
    nodes: updatedNodes,
    edges: updatedEdges,
    result: {
      success: true,
      affectedNodes: selectedIds.length,
      message: `Deleted ${selectedIds.length} node${selectedIds.length !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Duplicate selected nodes
 */
export function bulkDuplicateNodes(
  nodes: Node[],
  edges: Edge[]
): {
  nodes: Node[];
  edges: Edge[];
  result: BulkOperationResult;
} {
  const selectedNodes = nodes.filter(
    (n) => n.selected && n.id !== 'center' && n.id !== 'center-node'
  );

  if (selectedNodes.length === 0) {
    return {
      nodes,
      edges,
      result: {
        success: false,
        affectedNodes: 0,
        message: 'No nodes selected',
        error: 'No nodes to duplicate',
      },
    };
  }

  const timestamp = Date.now();
  const idMap = new Map<string, string>();
  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];

  // Create new nodes with new IDs
  selectedNodes.forEach((node, index) => {
    const newId = `${timestamp}-duplicate-${index}`;
    idMap.set(node.id, newId);

    const offset = 50;
    newNodes.push({
      ...node,
      id: newId,
      position: {
        x: node.position.x + offset,
        y: node.position.y + offset,
      },
      selected: false,
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
      },
    });
  });

  // Duplicate edges between duplicated nodes
  edges.forEach((edge) => {
    const newSourceId = idMap.get(edge.source);
    const newTargetId = idMap.get(edge.target);

    // Only duplicate edges where both nodes are in the selection
    if (newSourceId && newTargetId) {
      newEdges.push({
        ...edge,
        id: `e-${newSourceId}-${newTargetId}-${timestamp}`,
        source: newSourceId,
        target: newTargetId,
      });
    }
  });

  return {
    nodes: [...nodes, ...newNodes],
    edges: [...edges, ...newEdges],
    result: {
      success: true,
      affectedNodes: newNodes.length,
      message: `Duplicated ${newNodes.length} node${newNodes.length !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Get statistics about selected nodes
 */
export function getSelectionStats(nodes: Node[]): {
  total: number;
  byType: Record<string, number>;
  byTag: Record<string, number>;
  withTodos: number;
  withContent: number;
  withAIEnrichment: number;
} {
  const selectedNodes = nodes.filter(
    (n) => n.selected && n.id !== 'center' && n.id !== 'center-node'
  );

  const stats = {
    total: selectedNodes.length,
    byType: {} as Record<string, number>,
    byTag: {} as Record<string, number>,
    withTodos: 0,
    withContent: 0,
    withAIEnrichment: 0,
  };

  selectedNodes.forEach((node) => {
    // Count by type
    const type = node.data.type || 'other';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count by tags
    const tags = node.data.tags || [];
    tags.forEach((tag: string) => {
      stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
    });

    // Count features
    if (node.data.todos && node.data.todos.length > 0) {
      stats.withTodos++;
    }
    if (node.data.content || node.data.summary) {
      stats.withContent++;
    }
    if ((node.data.enrichmentCount || 0) > 0) {
      stats.withAIEnrichment++;
    }
  });

  return stats;
}

/**
 * Get all unique tags from nodes
 */
export function getAllUniqueTags(nodes: Node[]): string[] {
  const tagSet = new Set<string>();

  nodes.forEach((node) => {
    if (node.id === 'center' || node.id === 'center-node') return;
    const tags = node.data.tags || [];
    tags.forEach((tag: string) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Get all unique node types
 */
export function getAllUniqueTypes(nodes: Node[]): string[] {
  const typeSet = new Set<string>();

  nodes.forEach((node) => {
    if (node.id === 'center' || node.id === 'center-node') return;
    const type = node.data.type;
    if (type) typeSet.add(type);
  });

  return Array.from(typeSet).sort();
}

/**
 * Move selected nodes by offset
 */
export function bulkMoveNodes(
  nodes: Node[],
  offset: { x: number; y: number }
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    affectedCount++;

    return {
      ...node,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Moved ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Clear all cards from selected nodes
 */
export function bulkClearCards(
  nodes: Node[]
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    if (node.data.cards && node.data.cards.length > 0) {
      affectedCount++;
    }

    return {
      ...node,
      data: {
        ...node.data,
        cards: [],
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Cleared cards from ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}

/**
 * Mark all todos as complete/incomplete in selected nodes
 */
export function bulkUpdateTodos(
  nodes: Node[],
  checked: boolean
): { nodes: Node[]; result: BulkOperationResult } {
  let affectedCount = 0;

  const updatedNodes = nodes.map((node) => {
    if (!node.selected || node.id === 'center' || node.id === 'center-node') {
      return node;
    }

    const todos = node.data.todos || [];
    if (todos.length === 0) {
      return node;
    }

    affectedCount++;

    return {
      ...node,
      data: {
        ...node.data,
        todos: todos.map((todo: any) => ({
          ...todo,
          checked,
        })),
      },
    };
  });

  return {
    nodes: updatedNodes,
    result: {
      success: true,
      affectedNodes: affectedCount,
      message: `Updated todos in ${affectedCount} node${affectedCount !== 1 ? 's' : ''}`,
    },
  };
}
