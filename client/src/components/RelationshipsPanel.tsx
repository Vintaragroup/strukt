import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  GitBranch,
  AlertTriangle,
  TrendingUp,
  Network,
  Filter,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { Node, Edge } from "@xyflow/react";
import {
  RelationshipType,
  getRelationships,
  getDependencies,
  getDependents,
  getDependencyChain,
  getDependentChain,
  detectCircularDependencies,
  findCriticalPath,
  getRelationshipStats,
  getRelationshipColor,
  getRelationshipLabel,
  getRelationshipIcon,
  buildDependencyMap,
  wouldCreateCycle,
  suggestRelationships,
} from "../utils/relationships";
import { CustomNodeData } from "./CustomNode";

interface RelationshipsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
  onHighlightNodes?: (nodeIds: string[]) => void;
  onFocusNode?: (nodeId: string) => void;
  onUpdateEdge?: (edgeId: string, data: Partial<Edge>) => void;
  onCreateEdge?: (source: string, target: string, type: RelationshipType) => void;
}

export function RelationshipsPanel({
  open,
  onOpenChange,
  nodes,
  edges,
  onHighlightNodes,
  onFocusNode,
  onUpdateEdge,
  onCreateEdge,
}: RelationshipsPanelProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<RelationshipType | "all">("all");
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showCycles, setShowCycles] = useState(false);
  const isCenterNode = (node: Node | null | undefined) =>
    Boolean(node && (node.type === "center" || node.id === "center" || node.id === "center-node"));

  // Calculate relationships data
  const relationships = useMemo(() => getRelationships(edges), [edges]);
  const stats = useMemo(() => getRelationshipStats(edges), [edges]);
  const cycles = useMemo(
    () => detectCircularDependencies(nodes, edges),
    [nodes, edges]
  );
  const criticalPath = useMemo(
    () => findCriticalPath(nodes, edges),
    [nodes, edges]
  );
  const dependencyMap = useMemo(
    () => buildDependencyMap(nodes, edges),
    [nodes, edges]
  );
  const suggestions = useMemo(
    () => suggestRelationships(nodes, edges),
    [nodes, edges]
  );

  // Get node label
  const getNodeLabel = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    return (node?.data as unknown as CustomNodeData)?.label || nodeId;
  };

  // Get selected node data
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;
  const selectedDeps = selectedNodeId
    ? getDependencies(selectedNodeId, edges)
    : [];
  const selectedDependents = selectedNodeId
    ? getDependents(selectedNodeId, edges)
    : [];
  const selectedDepChain = selectedNodeId
    ? getDependencyChain(selectedNodeId, edges)
    : [];
  const selectedDependentChain = selectedNodeId
    ? getDependentChain(selectedNodeId, edges)
    : [];

  // Filter relationships
  const filteredRelationships =
    filterType === "all"
      ? relationships
      : relationships.filter((r) => r.type === filterType);

  // Highlight critical path
  const handleShowCriticalPath = () => {
    if (criticalPath && onHighlightNodes) {
      onHighlightNodes(criticalPath.path);
      setShowCriticalPath(true);
    }
  };

  // Highlight cycles
  const handleShowCycles = () => {
    if (cycles.length > 0 && onHighlightNodes) {
      const allCycleNodes = new Set<string>();
      cycles.forEach((cycle) => {
        cycle.cycle.forEach((nodeId) => allCycleNodes.add(nodeId));
      });
      onHighlightNodes(Array.from(allCycleNodes));
      setShowCycles(true);
    }
  };

  // Clear highlights
  const handleClearHighlights = () => {
    if (onHighlightNodes) {
      onHighlightNodes([]);
    }
    setShowCriticalPath(false);
    setShowCycles(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" />
            Relationships & Dependencies
          </DialogTitle>
          <DialogDescription>
            Manage and visualize dependencies between nodes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="critical-path">Critical Path</TabsTrigger>
            <TabsTrigger value="cycles">
              Cycles
              {cycles.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {cycles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs text-purple-600 mb-0.5">
                    Total Relationships
                  </div>
                  <div className="text-2xl">{stats.total}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600 mb-0.5">
                    Hard Dependencies
                  </div>
                  <div className="text-2xl">{stats.hardDependencies}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-600 mb-0.5">
                    Soft Relationships
                  </div>
                  <div className="text-2xl">{stats.softRelationships}</div>
                </div>
              </div>

              {/* Relationship Types Breakdown */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  Relationship Types
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    if (count === 0) return null;
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getRelationshipColor(
                                type as RelationshipType
                              ),
                            }}
                          />
                          {getRelationshipIcon(type as RelationshipType)}{" "}
                          {getRelationshipLabel(type as RelationshipType)}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShowCriticalPath}
                  disabled={!criticalPath}
                  className="gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  Show Critical Path
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShowCycles}
                  disabled={cycles.length === 0}
                  className="gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Show Cycles
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearHighlights}
                  className="gap-1.5"
                >
                  <EyeOff className="w-4 h-4" />
                  Clear Highlights
                </Button>
              </div>

              {/* Warnings */}
              {cycles.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {cycles.length} circular {cycles.length === 1 ? "dependency" : "dependencies"}{" "}
                    detected! This may cause deadlocks or infinite loops.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="flex-1 overflow-hidden">
            <div className="space-y-4 h-full flex flex-col">
              {/* Node Selector */}
              <div className="flex gap-2">
                <Select
                  value={selectedNodeId || ""}
                  onValueChange={setSelectedNodeId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a node to view dependencies..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes
                      .filter((n) => !isCenterNode(n))
                      .map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {(node.data as unknown as CustomNodeData)?.label || node.id}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType as any}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="depends-on">Depends On</SelectItem>
                    <SelectItem value="blocks">Blocks</SelectItem>
                    <SelectItem value="implements">Implements</SelectItem>
                    <SelectItem value="tests">Tests</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="extends">Extends</SelectItem>
                    <SelectItem value="references">References</SelectItem>
                    <SelectItem value="related-to">Related To</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedNode ? (
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4 pr-4">
                      {/* Node Info */}
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h3 className="font-medium mb-2">
                          {(selectedNode.data as unknown as CustomNodeData)?.label}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <strong>Direct Dependencies:</strong>{" "}
                            {selectedDeps.length}
                          </div>
                          <div>
                            <strong>All Dependencies:</strong>{" "}
                            {selectedDepChain.length}
                          </div>
                          <div>
                            <strong>Direct Dependents:</strong>{" "}
                            {selectedDependents.length}
                          </div>
                          <div>
                            <strong>All Dependents:</strong>{" "}
                            {selectedDependentChain.length}
                          </div>
                          <div>
                            <strong>Depth:</strong>{" "}
                            {dependencyMap.get(selectedNodeId!)?.depth || 0}
                          </div>
                        </div>
                      </div>

                      {/* Dependencies */}
                      {selectedDeps.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-red-600" />
                            Dependencies (This node depends on:)
                          </h4>
                          <div className="space-y-2">
                            {selectedDeps.map((depId) => {
                              const depNode = nodes.find((n) => n.id === depId);
                              const edge = edges.find(
                                (e) =>
                                  (e.source === selectedNodeId &&
                                    e.target === depId) ||
                                  (e.target === selectedNodeId &&
                                    e.source === depId)
                              );
                              const relType = (edge?.data as any)?.relationshipType || "related-to";
                              return (
                                <div
                                  key={depId}
                                  className="p-3 bg-white rounded border border-gray-200 flex items-center justify-between hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor: getRelationshipColor(relType as RelationshipType),
                                      }}
                                    />
                                    <span>
                                      {(depNode?.data as unknown as CustomNodeData)?.label || depId}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getRelationshipLabel(relType as RelationshipType)}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onFocusNode?.(depId)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Dependents */}
                      {selectedDependents.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-orange-600 rotate-180" />
                            Dependents (Nodes that depend on this:)
                          </h4>
                          <div className="space-y-2">
                            {selectedDependents.map((depId) => {
                              const depNode = nodes.find((n) => n.id === depId);
                              const edge = edges.find(
                                (e) =>
                                  (e.source === selectedNodeId &&
                                    e.target === depId) ||
                                  (e.target === selectedNodeId &&
                                    e.source === depId)
                              );
                              const relType = (edge?.data as any)?.relationshipType || "related-to";
                              return (
                                <div
                                  key={depId}
                                  className="p-3 bg-white rounded border border-gray-200 flex items-center justify-between hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor: getRelationshipColor(relType as RelationshipType),
                                      }}
                                    />
                                    <span>
                                      {(depNode?.data as unknown as CustomNodeData)?.label || depId}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getRelationshipLabel(relType as RelationshipType)}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onFocusNode?.(depId)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedDeps.length === 0 &&
                        selectedDependents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Network className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>This node has no dependencies or dependents</p>
                          </div>
                        )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Network className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Select a node to view its dependencies</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Critical Path Tab */}
          <TabsContent value="critical-path" className="flex-1 overflow-hidden">
            <div className="space-y-4">
              {criticalPath ? (
                <>
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      The critical path is the longest sequence of dependent tasks. Total
                      weight: <strong>{criticalPath.totalWeight}</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      Critical Path ({criticalPath.path.length} nodes)
                    </h3>
                    <div className="space-y-2">
                      {criticalPath.path.map((nodeId, index) => {
                        const node = nodes.find((n) => n.id === nodeId);
                        const details = criticalPath.nodes.get(nodeId);
                        return (
                          <div
                            key={nodeId}
                            className="flex items-center gap-3 p-3 bg-white rounded border border-purple-200"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {isCustomNode(node?.data) ? node?.data.label : nodeId}
                              </div>
                              <div className="text-xs text-gray-500">
                                Weight: {details?.weight || 0} | Depth: {details?.depth || 0}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onFocusNode?.(nodeId)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={handleShowCriticalPath}
                    className="w-full"
                    variant={showCriticalPath ? "secondary" : "default"}
                  >
                    {showCriticalPath ? "Highlighting Critical Path" : "Highlight on Canvas"}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-lg mb-1">No Critical Path Found</h3>
                  <p className="text-sm text-gray-500">
                    Add dependencies between nodes to calculate the critical path
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cycles Tab */}
          <TabsContent value="cycles" className="flex-1 overflow-hidden">
            <div className="space-y-4">
              {cycles.length > 0 ? (
                <>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {cycles.length} circular {cycles.length === 1 ? "dependency" : "dependencies"}{" "}
                      detected. These can cause deadlocks and should be resolved.
                    </AlertDescription>
                  </Alert>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      {cycles.map((cycle, index) => (
                        <div
                          key={index}
                          className="p-4 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-red-900">
                              Cycle #{index + 1}
                            </h4>
                            <Badge
                              variant={
                                cycle.type === "hard" ? "destructive" : "secondary"
                              }
                            >
                              {cycle.type === "hard" ? "Hard Dependency" : "Soft"}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            {cycle.cycle.map((nodeId, i) => (
                              <div
                                key={`${nodeId}-${i}`}
                                className="flex items-center gap-2"
                              >
                                <span className="text-red-600">→</span>
                                <span>{getNodeLabel(nodeId)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Button
                    onClick={handleShowCycles}
                    className="w-full"
                    variant={showCycles ? "secondary" : "destructive"}
                  >
                    {showCycles ? "Highlighting Cycles" : "Highlight on Canvas"}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <h3 className="text-lg mb-1">No Circular Dependencies</h3>
                  <p className="text-sm text-gray-500">
                    Your dependency graph is acyclic and healthy!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="flex-1 overflow-hidden">
            <div className="space-y-4">
              {suggestions.length > 0 ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Based on node types and structure, here are suggested relationships
                    </AlertDescription>
                  </Alert>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-medium mb-1">
                                {getNodeLabel(suggestion.source)}{" "}
                                <span className="text-blue-600">
                                  {getRelationshipIcon(suggestion.type)}
                                </span>{" "}
                                {getNodeLabel(suggestion.target)}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Type: {getRelationshipLabel(suggestion.type)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {suggestion.reason}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() =>
                                onCreateEdge?.(
                                  suggestion.source,
                                  suggestion.target,
                                  suggestion.type
                                )
                              }
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-lg mb-1">No Suggestions</h3>
                  <p className="text-sm text-gray-500">
                    Create more nodes with different types to get relationship suggestions
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
const isCustomNode = (data: unknown): data is CustomNodeData => {
  return !!data && typeof data === "object" && "label" in data && "type" in data;
};
