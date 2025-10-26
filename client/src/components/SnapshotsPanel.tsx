import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Clock,
  Save,
  Trash2,
  Download,
  Upload,
  GitBranch,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Archive,
  X,
  Eye,
  Calendar,
} from "lucide-react";
import {
  Snapshot,
  getSnapshots,
  saveSnapshot,
  deleteSnapshot,
  deleteAllSnapshots,
  deleteAutoSnapshots,
  restoreSnapshot,
  compareWithCurrent,
  getSnapshotStats,
  exportSnapshots,
  importSnapshots,
  SnapshotDiff,
} from "../utils/snapshots";
import { Node, Edge } from "reactflow";

interface SnapshotsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNodes: Node[];
  currentEdges: Edge[];
  onRestore: (nodes: Node[], edges: Edge[]) => void;
}

export function SnapshotsPanel({
  open,
  onOpenChange,
  currentNodes,
  currentEdges,
  onRestore,
}: SnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(getSnapshots());
  const [isCreating, setIsCreating] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDesc, setNewSnapshotDesc] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [comparisonDiff, setComparisonDiff] = useState<SnapshotDiff | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  
  const stats = getSnapshotStats();

  const refreshSnapshots = () => {
    setSnapshots(getSnapshots());
  };

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) {
      return;
    }

    saveSnapshot(
      currentNodes,
      currentEdges,
      newSnapshotName.trim(),
      newSnapshotDesc.trim() || undefined,
      false
    );

    setNewSnapshotName("");
    setNewSnapshotDesc("");
    setIsCreating(false);
    refreshSnapshots();
  };

  const handleDeleteSnapshot = (id: string) => {
    deleteSnapshot(id);
    setDeleteConfirmId(null);
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(null);
      setComparisonDiff(null);
    }
    refreshSnapshots();
  };

  const handleDeleteAll = () => {
    deleteAllSnapshots();
    setShowDeleteAllConfirm(false);
    setSelectedSnapshot(null);
    setComparisonDiff(null);
    refreshSnapshots();
  };

  const handleDeleteAutoSnapshots = () => {
    deleteAutoSnapshots();
    refreshSnapshots();
  };

  const handleRestore = (id: string) => {
    const restored = restoreSnapshot(id);
    if (restored) {
      onRestore(restored.nodes, restored.edges);
      setRestoreConfirmId(null);
      onOpenChange(false);
    }
  };

  const handleCompareWithCurrent = (snapshot: Snapshot) => {
    const diff = compareWithCurrent(currentNodes, currentEdges, snapshot.id);
    setSelectedSnapshot(snapshot);
    setComparisonDiff(diff);
  };

  const handleExport = () => {
    const json = exportSnapshots();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowforge-snapshots-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const success = importSnapshots(content);
          if (success) {
            refreshSnapshots();
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              Version Snapshots
            </DialogTitle>
            <DialogDescription>
              Save and restore different versions of your project
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-xs text-indigo-600 mb-0.5">Total</div>
                <div className="text-xl">{stats.total}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 mb-0.5">Manual</div>
                <div className="text-xl">{stats.manual}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-0.5">Auto</div>
                <div className="text-xl">{stats.auto}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 mb-0.5">Size</div>
                <div className="text-xl">{formatSize(stats.totalSize)}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setIsCreating(true)}
                size="sm"
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Snapshot
              </Button>
              <Button
                onClick={handleExport}
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={snapshots.length === 0}
              >
                <Download className="w-4 h-4" />
                Export All
              </Button>
              <Button
                onClick={handleImport}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  onClick={handleDeleteAutoSnapshots}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={stats.auto === 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Auto
                </Button>
                <Button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-red-600 hover:text-red-700"
                  disabled={snapshots.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </Button>
              </div>
            </div>

            {/* Create Snapshot Form */}
            {isCreating && (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Archive className="w-4 h-4 text-indigo-600" />
                    Create New Snapshot
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                      setNewSnapshotName("");
                      setNewSnapshotDesc("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="snapshot-name">Name *</Label>
                    <Input
                      id="snapshot-name"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      placeholder="e.g., Initial design, Feature complete, etc."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="snapshot-desc">Description (optional)</Label>
                    <Textarea
                      id="snapshot-desc"
                      value={newSnapshotDesc}
                      onChange={(e) => setNewSnapshotDesc(e.target.value)}
                      placeholder="What changed in this version?"
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNewSnapshotName("");
                        setNewSnapshotDesc("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateSnapshot}
                      disabled={!newSnapshotName.trim()}
                    >
                      Create Snapshot
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Snapshots List */}
            <div className="flex-1 overflow-hidden">
              {snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Archive className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-lg mb-1">No Snapshots Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first snapshot to save your project state
                  </p>
                  <Button onClick={() => setIsCreating(true)} size="sm">
                    <Save className="w-4 h-4 mr-1.5" />
                    Save First Snapshot
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {snapshots.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className={`p-4 rounded-lg border transition-all ${
                          selectedSnapshot?.id === snapshot.id
                            ? "bg-indigo-50 border-indigo-300"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">
                                {snapshot.name}
                              </h4>
                              {snapshot.isAutoSnapshot && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                            </div>
                            {snapshot.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {snapshot.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(snapshot.timestamp)}
                              </span>
                              <span>{snapshot.metadata.nodeCount} nodes</span>
                              <span>{snapshot.metadata.edgeCount} edges</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCompareWithCurrent(snapshot)}
                              title="Compare with current"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRestoreConfirmId(snapshot.id)}
                              title="Restore this snapshot"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(snapshot.id)}
                              title="Delete snapshot"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Comparison View */}
            {comparisonDiff && selectedSnapshot && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    Changes from "{selectedSnapshot.name}"
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedSnapshot(null);
                      setComparisonDiff(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {comparisonDiff.summary.totalChanges === 0 ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      No changes from this snapshot
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {comparisonDiff.nodesAdded.length > 0 && (
                        <div className="p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-green-700">
                            +{comparisonDiff.nodesAdded.length} nodes added
                          </span>
                        </div>
                      )}
                      {comparisonDiff.nodesRemoved.length > 0 && (
                        <div className="p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-red-700">
                            -{comparisonDiff.nodesRemoved.length} nodes removed
                          </span>
                        </div>
                      )}
                      {comparisonDiff.nodesModified.length > 0 && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-blue-700">
                            ~{comparisonDiff.nodesModified.length} nodes modified
                          </span>
                        </div>
                      )}
                      {comparisonDiff.edgesAdded.length > 0 && (
                        <div className="p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-green-700">
                            +{comparisonDiff.edgesAdded.length} connections added
                          </span>
                        </div>
                      )}
                      {comparisonDiff.edgesRemoved.length > 0 && (
                        <div className="p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-red-700">
                            -{comparisonDiff.edgesRemoved.length} connections removed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this snapshot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteSnapshot(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog
        open={showDeleteAllConfirm}
        onOpenChange={setShowDeleteAllConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete All Snapshots?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {stats.total} snapshots. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog
        open={restoreConfirmId !== null}
        onOpenChange={(open) => !open && setRestoreConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current project with the snapshot. Your current work will be lost unless you save it first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreConfirmId && handleRestore(restoreConfirmId)}
            >
              Restore Snapshot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
