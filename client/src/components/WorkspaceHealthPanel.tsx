import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { HeartPulse, FileWarning, Link2, Activity, ArrowRight } from "lucide-react";
import type { AnalyticsData, DocumentationReviewItem } from "../utils/analytics";

interface WorkspaceHealthPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: AnalyticsData;
  onFocusNode?: (nodeId: string) => void;
  workspaceName?: string;
}

function formatScoreLabel(score: number): { label: string; tone: "success" | "warning" | "danger" | "info" } {
  if (score >= 85) {
    return { label: "Excellent", tone: "success" };
  }
  if (score >= 70) {
    return { label: "Good", tone: "info" };
  }
  if (score >= 55) {
    return { label: "Needs Attention", tone: "warning" };
  }
  return { label: "At Risk", tone: "danger" };
}

function getToneClasses(tone: "success" | "warning" | "danger" | "info"): string {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "danger":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-blue-50 text-blue-700 border border-blue-200";
  }
}

function cardStatusLabel(status: DocumentationReviewItem["status"]): string {
  switch (status) {
    case "fresh":
      return "Fresh";
    case "fallback":
      return "Fallback";
    case "stale":
      return "Stale";
    default:
      return "Unknown";
  }
}

export function WorkspaceHealthPanel({
  open,
  onOpenChange,
  analytics,
  onFocusNode,
  workspaceName,
}: WorkspaceHealthPanelProps) {
  const {
    documentationHealth,
    relationshipHealth,
    completionStats,
    totalNodes,
  } = analytics;

  const {
    overallScore,
    documentationScore,
    relationshipScore,
    completionScore,
  } = useMemo(() => {
    const completion = completionStats.totalTodos > 0 ? completionStats.completionRate / 100 : 0.75;

    const totalCards = documentationHealth.totalCards;
    const freshCount = documentationHealth.statusCounts.fresh;
    const fallbackCount = documentationHealth.statusCounts.fallback;
    const docScore =
      totalCards > 0
        ? Math.min((freshCount + fallbackCount * 0.5) / totalCards, 1)
        : 1;

    const orphanPenalty =
      totalNodes > 0
        ? relationshipHealth.orphanNodes.length / totalNodes
        : 0;
    const coverageScore = Math.max(0, 1 - orphanPenalty);
    const densityScore = Math.min(relationshipHealth.edgeDensity * 3, 1);
    const relationship = Math.max(
      0,
      Math.min(1, (coverageScore * 0.6 + densityScore * 0.4))
    );

    const overall =
      (docScore + relationship + Math.min(1, completion)) / 3;

    return {
      documentationScore: docScore,
      relationshipScore: relationship,
      completionScore: Math.min(1, completion),
      overallScore: Math.max(0, Math.min(100, Math.round(overall * 100))),
    };
  }, [
    completionStats.completionRate,
    completionStats.totalTodos,
    documentationHealth.statusCounts.fallback,
    documentationHealth.statusCounts.fresh,
    documentationHealth.totalCards,
    relationshipHealth.edgeDensity,
    relationshipHealth.orphanNodes.length,
    totalNodes,
  ]);

  const summaryTone = formatScoreLabel(overallScore);
  const documentsNeedingReview = documentationHealth.reviewQueue.filter(
    (item) => item.needsReview
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,72rem)] sm:max-w-[72rem] max-h-[85vh] overflow-hidden flex flex-col bg-white p-10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            Workspace Health
          </DialogTitle>
          <DialogDescription>
            {workspaceName
              ? `Health report for ${workspaceName}`
              : "Documentation, relationships, and execution readiness"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="h-full overflow-y-auto pr-4">
            <div className="px-2 pb-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
              <Card className={`${getToneClasses(summaryTone.tone)} flex flex-col`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HeartPulse className="w-4 h-4" />
                    Overall Health
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Aggregated score across documentation, relationships, and delivery readiness.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0 pb-6 px-6 flex-1 min-h-0">
                  <div className="text-4xl font-semibold">{overallScore}</div>
                  <Badge variant="outline" className="w-max text-xs uppercase tracking-wide">
                    {summaryTone.label}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-amber-500" />
                    Documentation Integrity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Review the freshness and accuracy of generated cards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 pb-6 px-6 flex-1 min-h-0">
                  <Progress value={Math.round(documentationScore * 100)} />
                  <div className="text-xs text-muted-foreground">
                    {documentationHealth.statusCounts.fresh} fresh ·{" "}
                    {documentationHealth.statusCounts.fallback} fallback ·{" "}
                    {documentationHealth.statusCounts.stale} stale
                  </div>
                  <div className="text-sm font-medium">
                    Avg accuracy:{" "}
                    {documentationHealth.averageAccuracy !== null
                      ? `${documentationHealth.averageAccuracy.toFixed(1)}%`
                      : "n/a"}
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-indigo-500" />
                    Relationship Strength
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connectivity coverage across your workspace graph.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 pb-6 px-6 flex-1 min-h-0">
                  <Progress value={Math.round(relationshipScore * 100)} />
                  <div className="text-xs text-muted-foreground">
                    Edge density: {(relationshipHealth.edgeDensity * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Orphans: {relationshipHealth.orphanNodes.length} · Low connectivity:{" "}
                    {relationshipHealth.lowConnectivityNodes.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-amber-200/80 bg-amber-50/20 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                    <FileWarning className="w-4 h-4" />
                    Documentation Review Queue
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cards flagged as stale or fallback content. Prioritise the items with a “needs review” badge.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 pb-6 px-6 flex-1 min-h-0">
                  {documentationHealth.reviewQueue.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No outstanding review items. Keep shipping!
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="max-h-64">
                        <div className="pr-2 space-y-2">
                          {documentationHealth.reviewQueue.map((item) => (
                            <div
                              key={`${item.nodeId}-${item.cardId}`}
                              className="rounded-lg border border-amber-200 bg-white px-3 py-2 flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-amber-900">
                                    {item.cardTitle}
                                  </p>
                                  <p className="text-xs text-amber-700">
                                    {item.nodeLabel}
                                  </p>
                                </div>
                                <Badge
                                  variant={item.needsReview ? "destructive" : "secondary"}
                                  className="text-[10px] uppercase tracking-wide"
                                >
                                  {cardStatusLabel(item.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {item.score !== null ? <>Accuracy {item.score}%</> : <>Accuracy n/a</>}
                                {item.needsReview && (
                                  <>
                                    <span className="text-amber-600">•</span>
                                    <span className="font-medium text-amber-700">
                                      Needs review
                                    </span>
                                  </>
                                )}
                              </div>
                              {onFocusNode && (
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => onFocusNode(item.nodeId)}
                                  >
                                    Review in canvas
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground">
                        {documentsNeedingReview.length} needs review ·{" "}
                        {documentationHealth.reviewQueue.length - documentsNeedingReview.length} fallback
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-indigo-200/80 bg-indigo-50/20 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                    <Link2 className="w-4 h-4" />
                    Relationship Watchlist
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Keep nodes connected so the blueprint stays consistent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 pb-6 px-6 flex-1 min-h-0">
                  {relationshipHealth.orphanNodes.length === 0 &&
                  relationshipHealth.lowConnectivityNodes.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      All nodes are connected. Nice work!
                    </div>
                  ) : (
                    <>
                      {relationshipHealth.orphanNodes.length > 0 && (
                        <div className="space-y-1 min-h-0">
                          <p className="text-xs font-semibold text-rose-700 uppercase">
                            Orphan nodes ({relationshipHealth.orphanNodes.length})
                          </p>
                          <div className="max-h-52 overflow-y-auto pr-2 space-y-1.5">
                            {relationshipHealth.orphanNodes.map((node) => (
                              <div
                                key={node.id}
                                className="flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-white px-3 py-1.5"
                              >
                                <span className="text-sm text-rose-800">{node.label}</span>
                                {onFocusNode && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => onFocusNode(node.id)}
                                  >
                                    Focus
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {relationshipHealth.lowConnectivityNodes.length > 0 && (
                        <div className="space-y-1 min-h-0">
                          <p className="text-xs font-semibold text-indigo-700 uppercase">
                            Low connectivity ({relationshipHealth.lowConnectivityNodes.length})
                          </p>
                          <div className="max-h-52 overflow-y-auto pr-2 space-y-1.5">
                            {relationshipHealth.lowConnectivityNodes.map((node) => (
                              <div
                                key={node.id}
                                className="flex items-center justify-between gap-2 rounded-md border border-indigo-200 bg-white px-3 py-1.5"
                              >
                                <span className="text-sm text-indigo-800">{node.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {node.connections} connection
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Delivery Readiness
                </CardTitle>
                <CardDescription className="text-xs">
                  Track progress on execution tasks and call out any blockers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-6 px-6 flex-1 min-h-0">
                <div className="flex items-center gap-3">
                  <Progress value={Math.round(completionScore * 100)} className="flex-1" />
                  <span className="text-sm font-medium">
                    {completionStats.completionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    Completed {completionStats.completedTodos} of {completionStats.totalTodos} tasks
                  </span>
                  <span>•</span>
                  <span>{totalNodes} active nodes</span>
                </div>
                {completionStats.completionRate < 60 && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription className="text-xs">
                      Delivery tasks are under 60% complete. Use the documentation review queue to unblock progress.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {documentsNeedingReview.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  {documentsNeedingReview.length} cards require immediate review to maintain documentation fidelity.
                </AlertDescription>
              </Alert>
            )}
            {relationshipHealth.orphanNodes.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                <AlertDescription className="text-sm">
                  Reconnect orphan nodes to keep the workspace narrative cohesive.
                </AlertDescription>
              </Alert>
            )}
            {documentsNeedingReview.length === 0 &&
              relationshipHealth.orphanNodes.length === 0 &&
              documentationHealth.statusCounts.stale === 0 && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <AlertDescription className="text-sm">
                    Everything looks healthy. Keep iterating and ship the blueprint!
                  </AlertDescription>
                </Alert>
              )}
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
