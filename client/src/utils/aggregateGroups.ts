// @ts-nocheck
/**
 * Aggregate grouping utilities
 * Collapse a selection of nodes into a single aggregate node and expand it back.
 */

import type { Node, Edge } from '@xyflow/react';

const CENTER_ID_FALLBACKS = new Set(['center', 'center-node']);

function isCenterNode(node: Node | null | undefined): boolean {
  if (!node) return false;
  return node.type === 'center' || CENTER_ID_FALLBACKS.has(node.id);
}

function centroid(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 0, y: 0 };
  const sum = nodes.reduce(
    (acc, n) => ({ x: acc.x + n.position.x, y: acc.y + n.position.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / nodes.length, y: sum.y / nodes.length };
}

export interface CollapseResult {
  ok: boolean;
  reason?: string;
  nodes: Node[];
  edges: Edge[];
  aggregateId?: string;
  affected?: number;
}

/**
 * Collapse currently selected nodes (excluding center) into a single aggregate node.
 * - Removes internal edges between selected nodes
 * - Rewires external edges to point to the aggregate
 * - Stores child snapshots and edge mapping inside aggregate.data for later expansion
 */
export function collapseSelectedIntoAggregate(nodes: Node[], edges: Edge[]): CollapseResult {
  const selected = nodes.filter((n) => n.selected && !isCenterNode(n));

  if (selected.length < 2) {
    return {
      ok: false,
      reason: 'Select two or more nodes to group',
      nodes,
      edges,
    };
  }

  // Disallow nested aggregates for now
  if (selected.some((n) => n.data?.isAggregate || n.data?.type === 'aggregate')) {
    return {
      ok: false,
      reason: 'Nested groups are not supported yet',
      nodes,
      edges,
    };
  }

  const childIds = new Set(selected.map((n) => n.id));
  const center = centroid(selected);
  const ts = Date.now();
  const aggregateId = `aggregate-${ts}`;

  const originalPositions: Record<string, { x: number; y: number }> = {};
  selected.forEach((n) => {
    originalPositions[n.id] = { x: n.position.x, y: n.position.y };
  });

  const childrenSnapshot = selected.map((n) => ({ ...n }));

  // Edge classification and rewiring
  const internalEdgesSnapshot: Edge[] = [];
  const proxyEdgeMap: Array<{ edgeId: string; originalSource: string; originalTarget: string }>
    = [];

  const rewiredEdges: Edge[] = [];
  for (const e of edges) {
    const srcIn = childIds.has(e.source);
    const tgtIn = childIds.has(e.target);

    if (srcIn && tgtIn) {
      // internal edge - drop but record snapshot
      internalEdgesSnapshot.push({ ...e });
      continue;
    }
    if (srcIn && !tgtIn) {
      // outgoing — rewire source to aggregate
      const ne = { ...e, source: aggregateId };
      rewiredEdges.push(ne);
      proxyEdgeMap.push({ edgeId: e.id, originalSource: e.source, originalTarget: e.target });
      continue;
    }
    if (!srcIn && tgtIn) {
      // incoming — rewire target to aggregate
      const ne = { ...e, target: aggregateId };
      rewiredEdges.push(ne);
      proxyEdgeMap.push({ edgeId: e.id, originalSource: e.source, originalTarget: e.target });
      continue;
    }
    // external — keep as is
    rewiredEdges.push(e);
  }

  // Build aggregate node (use React Flow node type 'custom' so it renders with existing node component)
  const aggregateNode: Node = {
    id: aggregateId,
    type: 'custom',
    position: { x: center.x, y: center.y },
    selected: true,
    data: {
      type: 'aggregate', // domain type
      label: `Group (${selected.length})`,
      summary: 'Collapsed group',
      isAggregate: true,
      children: Array.from(childIds),
      originalPositions,
      childrenSnapshot,
      internalEdgesSnapshot,
      proxyEdgeMap,
    },
  } as unknown as Node;

  const remainingNodes = nodes.filter((n) => !childIds.has(n.id));
  const nextNodes = [...remainingNodes, aggregateNode];

  return {
    ok: true,
    nodes: nextNodes,
    edges: rewiredEdges,
    aggregateId,
    affected: selected.length,
  };
}

/**
 * Collapse an explicit set of node IDs into a single aggregate.
 * Useful for parent->children collapse where selection state is not used.
 */
export function collapseNodeIdsIntoAggregate(
  nodes: Node[],
  edges: Edge[],
  ids: string[],
  label?: string
): CollapseResult {
  const selected = nodes.filter((n) => ids.includes(n.id) && !isCenterNode(n));
  if (selected.length < 1) {
    return { ok: false, reason: 'No children to collapse', nodes, edges };
  }
  if (selected.some((n) => n.data?.isAggregate || n.data?.type === 'aggregate')) {
    return { ok: false, reason: 'Cannot collapse groups into another group yet', nodes, edges };
  }

  const childIds = new Set(selected.map((n) => n.id));
  const center = centroid(selected);
  const ts = Date.now();
  const aggregateId = `aggregate-${ts}`;

  const originalPositions: Record<string, { x: number; y: number }> = {};
  selected.forEach((n) => {
    originalPositions[n.id] = { x: n.position.x, y: n.position.y };
  });

  const childrenSnapshot = selected.map((n) => ({ ...n }));
  const internalEdgesSnapshot: Edge[] = [];
  const proxyEdgeMap: Array<{ edgeId: string; originalSource: string; originalTarget: string }> = [];

  const rewiredEdges: Edge[] = [];
  for (const e of edges) {
    const srcIn = childIds.has(e.source);
    const tgtIn = childIds.has(e.target);
    if (srcIn && tgtIn) {
      internalEdgesSnapshot.push({ ...e });
      continue;
    }
    if (srcIn && !tgtIn) {
      const ne = { ...e, source: aggregateId };
      rewiredEdges.push(ne);
      proxyEdgeMap.push({ edgeId: e.id, originalSource: e.source, originalTarget: e.target });
      continue;
    }
    if (!srcIn && tgtIn) {
      const ne = { ...e, target: aggregateId };
      rewiredEdges.push(ne);
      proxyEdgeMap.push({ edgeId: e.id, originalSource: e.source, originalTarget: e.target });
      continue;
    }
    rewiredEdges.push(e);
  }

  const aggregateNode: Node = {
    id: aggregateId,
    type: 'custom',
    position: { x: center.x, y: center.y },
    selected: true,
    data: {
      type: 'aggregate',
      label: label || `Group (${selected.length})`,
      summary: 'Collapsed group',
      isAggregate: true,
      children: Array.from(childIds),
      originalPositions,
      childrenSnapshot,
      internalEdgesSnapshot,
      proxyEdgeMap,
    },
  } as unknown as Node;

  const remainingNodes = nodes.filter((n) => !childIds.has(n.id));
  const nextNodes = [...remainingNodes, aggregateNode];
  return { ok: true, nodes: nextNodes, edges: rewiredEdges, aggregateId, affected: selected.length };
}

export interface ExpandResult {
  ok: boolean;
  reason?: string;
  nodes: Node[];
  edges: Edge[];
  restoredCount?: number;
}

/**
 * Expand a previously created aggregate node back into its children
 */
export function expandAggregate(nodes: Node[], edges: Edge[], aggregateId: string): ExpandResult {
  const agg = nodes.find((n) => n.id === aggregateId);
  if (!agg) {
    return { ok: false, reason: 'Aggregate not found', nodes, edges };
  }
  const data = agg.data || {};
  if (!data.isAggregate) {
    return { ok: false, reason: 'Node is not an aggregate', nodes, edges };
  }

  const childrenSnapshot: Node[] = (data.childrenSnapshot || []).map((n: Node) => ({
    ...n,
    selected: false,
  }));
  const internalEdgesSnapshot: Edge[] = (data.internalEdgesSnapshot || []).map((e: Edge) => ({ ...e }));
  const proxyEdgeMap: Array<{ edgeId: string; originalSource: string; originalTarget: string }> =
    data.proxyEdgeMap || [];

  // Restore endpoints for rewired edges by id
  const edgeById = new Map<string, Edge>();
  edges.forEach((e) => edgeById.set(e.id, e));
  for (const p of proxyEdgeMap) {
    const e = edgeById.get(p.edgeId);
    if (!e) continue;
    edgeById.set(p.edgeId, { ...e, source: p.originalSource, target: p.originalTarget });
  }
  // Remove any edges that still point to aggregate but were originally internal (shouldn't happen since we dropped them), keep others
  const restoredExternalEdges = Array.from(edgeById.values()).filter(
    (e) => !(e.source === aggregateId || e.target === aggregateId) || proxyEdgeMap.some((p) => p.edgeId === e.id)
  );

  // Remove aggregate node and add children back
  const nextNodes = nodes.filter((n) => n.id !== aggregateId).concat(childrenSnapshot);
  const nextEdges = restoredExternalEdges.concat(internalEdgesSnapshot);

  return { ok: true, nodes: nextNodes, edges: nextEdges, restoredCount: childrenSnapshot.length };
}
