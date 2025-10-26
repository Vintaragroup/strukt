import { Node, Edge } from "reactflow";

export interface Snapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  nodes: Node[];
  edges: Edge[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    tags: string[];
    createdBy?: string;
  };
  isAutoSnapshot: boolean;
}

export interface SnapshotDiff {
  nodesAdded: Node[];
  nodesRemoved: Node[];
  nodesModified: { before: Node; after: Node }[];
  edgesAdded: Edge[];
  edgesRemoved: Edge[];
  summary: {
    totalChanges: number;
    nodesChanged: number;
    edgesChanged: number;
  };
}

const STORAGE_KEY = "flowforge_snapshots";
const MAX_SNAPSHOTS = 50;
const AUTO_SNAPSHOT_PREFIX = "Auto-save";

// Get all snapshots from localStorage
export function getSnapshots(): Snapshot[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const snapshots = JSON.parse(stored);
    return Array.isArray(snapshots) ? snapshots : [];
  } catch (error) {
    console.error("Error loading snapshots:", error);
    return [];
  }
}

// Save a snapshot
export function saveSnapshot(
  nodes: Node[],
  edges: Edge[],
  name: string,
  description?: string,
  isAutoSnapshot = false
): Snapshot {
  const snapshots = getSnapshots();

  // Extract unique tags from all nodes
  const allTags = new Set<string>();
  nodes.forEach((node) => {
    if (node.data?.tags && Array.isArray(node.data.tags)) {
      node.data.tags.forEach((tag: string) => allTags.add(tag));
    }
  });

  const snapshot: Snapshot = {
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    timestamp: Date.now(),
    nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
    edges: JSON.parse(JSON.stringify(edges)), // Deep clone
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      tags: Array.from(allTags),
    },
    isAutoSnapshot,
  };

  // Add new snapshot
  snapshots.unshift(snapshot);

  // Limit total snapshots
  if (snapshots.length > MAX_SNAPSHOTS) {
    // Keep manual snapshots, remove oldest auto-snapshots first
    const manualSnapshots = snapshots.filter((s) => !s.isAutoSnapshot);
    const autoSnapshots = snapshots.filter((s) => s.isAutoSnapshot);

    if (autoSnapshots.length > MAX_SNAPSHOTS / 2) {
      const keptAutoSnapshots = autoSnapshots.slice(0, MAX_SNAPSHOTS / 2);
      const combinedSnapshots = [...manualSnapshots, ...keptAutoSnapshots];
      combinedSnapshots.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(combinedSnapshots.slice(0, MAX_SNAPSHOTS))
      );
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(snapshots.slice(0, MAX_SNAPSHOTS))
      );
    }
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }

  return snapshot;
}

// Create auto-snapshot
export function createAutoSnapshot(nodes: Node[], edges: Edge[]): Snapshot {
  const timestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return saveSnapshot(
    nodes,
    edges,
    `${AUTO_SNAPSHOT_PREFIX} - ${timestamp}`,
    "Automatic snapshot",
    true
  );
}

// Delete a snapshot
export function deleteSnapshot(snapshotId: string): void {
  const snapshots = getSnapshots();
  const filtered = snapshots.filter((s) => s.id !== snapshotId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Delete all snapshots
export function deleteAllSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Delete auto-snapshots only
export function deleteAutoSnapshots(): void {
  const snapshots = getSnapshots();
  const manualOnly = snapshots.filter((s) => !s.isAutoSnapshot);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manualOnly));
}

// Get a specific snapshot
export function getSnapshot(snapshotId: string): Snapshot | null {
  const snapshots = getSnapshots();
  return snapshots.find((s) => s.id === snapshotId) || null;
}

// Restore a snapshot (returns the nodes and edges)
export function restoreSnapshot(
  snapshotId: string
): { nodes: Node[]; edges: Edge[] } | null {
  const snapshot = getSnapshot(snapshotId);
  if (!snapshot) return null;

  return {
    nodes: JSON.parse(JSON.stringify(snapshot.nodes)), // Deep clone
    edges: JSON.parse(JSON.stringify(snapshot.edges)), // Deep clone
  };
}

// Compare two snapshots
export function compareSnapshots(
  snapshot1Id: string,
  snapshot2Id: string
): SnapshotDiff | null {
  const snap1 = getSnapshot(snapshot1Id);
  const snap2 = getSnapshot(snapshot2Id);

  if (!snap1 || !snap2) return null;

  const diff: SnapshotDiff = {
    nodesAdded: [],
    nodesRemoved: [],
    nodesModified: [],
    edgesAdded: [],
    edgesRemoved: [],
    summary: {
      totalChanges: 0,
      nodesChanged: 0,
      edgesChanged: 0,
    },
  };

  // Compare nodes
  const snap1NodeIds = new Set(snap1.nodes.map((n) => n.id));
  const snap2NodeIds = new Set(snap2.nodes.map((n) => n.id));

  // Nodes added in snap2
  snap2.nodes.forEach((node) => {
    if (!snap1NodeIds.has(node.id)) {
      diff.nodesAdded.push(node);
    }
  });

  // Nodes removed in snap2
  snap1.nodes.forEach((node) => {
    if (!snap2NodeIds.has(node.id)) {
      diff.nodesRemoved.push(node);
    }
  });

  // Nodes modified
  snap1.nodes.forEach((node1) => {
    const node2 = snap2.nodes.find((n) => n.id === node1.id);
    if (node2 && !isNodeEqual(node1, node2)) {
      diff.nodesModified.push({ before: node1, after: node2 });
    }
  });

  // Compare edges
  const snap1EdgeIds = new Set(snap1.edges.map((e) => e.id));
  const snap2EdgeIds = new Set(snap2.edges.map((e) => e.id));

  // Edges added in snap2
  snap2.edges.forEach((edge) => {
    if (!snap1EdgeIds.has(edge.id)) {
      diff.edgesAdded.push(edge);
    }
  });

  // Edges removed in snap2
  snap1.edges.forEach((edge) => {
    if (!snap2EdgeIds.has(edge.id)) {
      diff.edgesRemoved.push(edge);
    }
  });

  // Calculate summary
  diff.summary.nodesChanged =
    diff.nodesAdded.length + diff.nodesRemoved.length + diff.nodesModified.length;
  diff.summary.edgesChanged = diff.edgesAdded.length + diff.edgesRemoved.length;
  diff.summary.totalChanges =
    diff.summary.nodesChanged + diff.summary.edgesChanged;

  return diff;
}

// Compare current state with a snapshot
export function compareWithCurrent(
  currentNodes: Node[],
  currentEdges: Edge[],
  snapshotId: string
): SnapshotDiff | null {
  const snapshot = getSnapshot(snapshotId);
  if (!snapshot) return null;

  // Create temporary snapshot for current state
  const tempId = "temp_current";
  const tempSnapshot: Snapshot = {
    id: tempId,
    name: "Current State",
    timestamp: Date.now(),
    nodes: currentNodes,
    edges: currentEdges,
    metadata: {
      nodeCount: currentNodes.length,
      edgeCount: currentEdges.length,
      tags: [],
    },
    isAutoSnapshot: false,
  };

  // Save temporarily
  const snapshots = getSnapshots();
  snapshots.unshift(tempSnapshot);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));

  // Compare
  const diff = compareSnapshots(snapshotId, tempId);

  // Remove temporary snapshot
  deleteSnapshot(tempId);

  return diff;
}

// Helper function to check if two nodes are equal
function isNodeEqual(node1: Node, node2: Node): boolean {
  try {
    // Compare stringified versions (ignoring selected state and some internal props)
    const n1 = { ...node1, selected: false };
    const n2 = { ...node2, selected: false };
    return JSON.stringify(n1) === JSON.stringify(n2);
  } catch {
    return false;
  }
}

// Get snapshot statistics
export function getSnapshotStats(): {
  total: number;
  manual: number;
  auto: number;
  oldestDate: number | null;
  newestDate: number | null;
  totalSize: number;
} {
  const snapshots = getSnapshots();
  const manual = snapshots.filter((s) => !s.isAutoSnapshot);
  const auto = snapshots.filter((s) => s.isAutoSnapshot);

  const dates = snapshots.map((s) => s.timestamp);
  const oldestDate = dates.length > 0 ? Math.min(...dates) : null;
  const newestDate = dates.length > 0 ? Math.max(...dates) : null;

  // Estimate size in localStorage
  const totalSize = new Blob([JSON.stringify(snapshots)]).size;

  return {
    total: snapshots.length,
    manual: manual.length,
    auto: auto.length,
    oldestDate,
    newestDate,
    totalSize,
  };
}

// Export snapshots to JSON file
export function exportSnapshots(): string {
  const snapshots = getSnapshots();
  return JSON.stringify(snapshots, null, 2);
}

// Import snapshots from JSON
export function importSnapshots(jsonData: string): boolean {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) return false;

    // Validate structure
    const isValid = imported.every(
      (s) =>
        s.id &&
        s.name &&
        s.timestamp &&
        Array.isArray(s.nodes) &&
        Array.isArray(s.edges)
    );

    if (!isValid) return false;

    // Merge with existing snapshots
    const existing = getSnapshots();
    const merged = [...imported, ...existing];

    // Remove duplicates by id
    const unique = merged.filter(
      (snapshot, index, self) =>
        index === self.findIndex((s) => s.id === snapshot.id)
    );

    // Sort by timestamp
    unique.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to MAX_SNAPSHOTS
    const limited = unique.slice(0, MAX_SNAPSHOTS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    return true;
  } catch (error) {
    console.error("Error importing snapshots:", error);
    return false;
  }
}

// Should create auto-snapshot (based on changes)
export function shouldCreateAutoSnapshot(
  lastSnapshot: Snapshot | null,
  currentNodes: Node[],
  currentEdges: Edge[]
): boolean {
  if (!lastSnapshot) return true;

  // Check if enough time has passed (5 minutes)
  const timeDiff = Date.now() - lastSnapshot.timestamp;
  if (timeDiff < 5 * 60 * 1000) return false;

  // Check if there are significant changes
  const nodeCountChanged =
    Math.abs(lastSnapshot.metadata.nodeCount - currentNodes.length) > 0;
  const edgeCountChanged =
    Math.abs(lastSnapshot.metadata.edgeCount - currentEdges.length) > 0;

  return nodeCountChanged || edgeCountChanged;
}
