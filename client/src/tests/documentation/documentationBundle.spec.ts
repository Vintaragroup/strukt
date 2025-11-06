import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { buildDocumentationBundle } from "@/utils/documentationBundle";
import type { CustomNodeData } from "@/components/CustomNode";
import type { CenterNodeData } from "@/components/CenterNode";
import type { EditableCardData } from "@/components/EditableCard";

describe("documentation bundle aggregation", () => {
  const centerNode: Node<CenterNodeData> = {
    id: "center",
    type: "center",
    position: { x: 0, y: 0 },
    data: {
      label: "Vision Lab",
      description: "AI-assisted workspace for product teams.",
    },
    draggable: false,
    selectable: false,
  };

  const featureCard: EditableCardData = {
    id: "card-auth",
    title: "Auth Spec",
    type: "spec",
    sections: [
      { id: "overview", title: "Overview", body: "Single sign-on and MFA requirements." },
      { id: "interfaces", title: "Interfaces", body: "REST endpoints for session management." },
    ],
    metadata: {
      accuracy: {
        score: 84,
        status: "fresh",
        factors: ["KB sections blended (+14)"],
        needsReview: false,
      },
    },
  };

  const runbookCard: EditableCardData = {
    id: "card-runbook",
    title: "Runbook",
    type: "checklist",
    todos: [
      { id: "todo-1", text: "Enable SLA monitors", completed: true },
      { id: "todo-2", text: "Publish rollback procedure", completed: false },
    ],
    metadata: {
      accuracy: {
        score: 72,
        status: "fallback",
        needsReview: true,
      },
    },
  };

  const backendNode: Node<CustomNodeData> = {
    id: "backend",
    type: "custom",
    position: { x: 400, y: 0 },
    data: {
      label: "Auth & Access",
      summary: "Handles authentication, authorization, and session policy.",
      type: "backend",
      domain: "tech",
      tags: ["auth", "security"],
      cards: [featureCard],
    },
  };

  const operationsNode: Node<CustomNodeData> = {
    id: "operations",
    type: "custom",
    position: { x: -200, y: 120 },
    data: {
      label: "Operations Runbook",
      summary: "Procedures and observability guardrails.",
      type: "doc",
      domain: "operations",
      tags: ["runbook", "observability"],
      cards: [runbookCard],
    },
  };

  const edges: Edge[] = [
    {
      id: "e1",
      source: "backend",
      target: "operations",
      type: "custom",
      data: { label: "Depends on" },
    },
  ];

  it("produces a structured bundle and markdown summary", () => {
    const bundle = buildDocumentationBundle({
      workspaceName: "Sprint Lab",
      workspaceSummary: "Main application serving as the collaboration hub.",
      nodes: [centerNode, backendNode, operationsNode],
      edges,
    });

    expect(bundle.workspace.name).toBe("Sprint Lab");
    expect(bundle.workspace.nodeCount).toBe(2);
    expect(bundle.nodes[0].cards[0].sections?.length).toBe(2);
    expect(bundle.nodes[1].cards[0].todos?.[0].completed).toBe(true);
    expect(bundle.relationships[0].label).toBe("Depends on");
    expect(bundle.markdown).toContain("# Sprint Lab");
    expect(bundle.markdown).toContain("## Auth & Access");
    expect(bundle.markdown).toContain("- [x] Enable SLA monitors");
  });
});
