import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { calculateAnalytics } from "@/utils/analytics";
import type { CustomNodeData } from "@/components/CustomNode";
import type { CenterNodeData } from "@/components/CenterNode";

const centerNode: Node<CenterNodeData> = {
  id: "center",
  type: "center",
  position: { x: 0, y: 0 },
  data: {
    label: "Workspace Mission",
    description: "North star for the workspace.",
  },
  draggable: false,
  selectable: false,
};

const documentationNode: Node<CustomNodeData> = {
  id: "doc-node",
  type: "custom",
  position: { x: 150, y: 0 },
  data: {
    label: "API Requirements",
    type: "requirement",
    tags: ["api"],
    cards: [
      {
        id: "card-fresh",
        title: "Fresh spec",
        type: "spec",
        metadata: {
          accuracy: {
            status: "fresh",
            score: 92,
            needsReview: false,
          },
        },
      },
      {
        id: "card-stale",
        title: "Stale doc",
        type: "brief",
        metadata: {
          accuracy: {
            status: "stale",
            score: 55,
            needsReview: true,
          },
        },
      },
    ],
  },
};

const orphanNode: Node<CustomNodeData> = {
  id: "orphan",
  type: "custom",
  position: { x: -120, y: 80 },
  data: {
    label: "Unlinked Insight",
    type: "doc",
    tags: ["insight"],
    cards: [],
  },
};

const edges: Edge[] = [
  {
    id: "edge-1",
    source: "doc-node",
    target: "center",
    type: "custom",
  },
];

describe("workspace analytics health signals", () => {
  it("summarises documentation freshness and review queue", () => {
    const analytics = calculateAnalytics([centerNode, documentationNode, orphanNode], edges);

    expect(analytics.documentationHealth.totalCards).toBe(2);
    expect(analytics.documentationHealth.statusCounts.fresh).toBe(1);
    expect(analytics.documentationHealth.statusCounts.stale).toBe(1);
    expect(analytics.documentationHealth.needsReviewCount).toBe(1);
    expect(analytics.documentationHealth.averageAccuracy).toBeCloseTo((92 + 55) / 2, 5);

    const reviewTitles = analytics.documentationHealth.reviewQueue.map((item) => item.cardTitle);
    expect(reviewTitles).toContain("Stale doc");
  });

  it("identifies orphan nodes for relationship health", () => {
    const analytics = calculateAnalytics([centerNode, documentationNode, orphanNode], edges);

    const orphanLabels = analytics.relationshipHealth.orphanNodes.map((node) => node.label);
    expect(orphanLabels).toContain("Unlinked Insight");
    expect(analytics.relationshipHealth.edgeDensity).toBeGreaterThanOrEqual(0);
  });
});
