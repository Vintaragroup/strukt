import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { buildWorkspaceDocumentationBundle } from "@/utils/export";
import { documentationFlagId, type DocumentationFlag } from "@/utils/documentationBundle";
import { buildGeneratorPrompt } from "@/utils/documentationPrompts";
import type { CustomNodeData } from "@/components/CustomNode";
import type { CenterNodeData } from "@/components/CenterNode";
import type { EditableCardData } from "@/components/EditableCard";

describe("documentation workflow integration", () => {
  const center: Node<CenterNodeData> = {
    id: "center",
    type: "center",
    position: { x: 0, y: 0 },
    data: {
      label: "Mission Control",
      description: "Unify onboarding for the growth experimentation squad.",
    },
    draggable: false,
    selectable: false,
  };

  const card: EditableCardData = {
    id: "card-001",
    title: "Experiment backlog",
    type: "brief",
    content: "Maintain a prioritized list of experiments with guardrails.",
    sections: [
      { id: "overview", title: "Overview", body: "Scope and success metrics." },
      { id: "safety", title: "Safety", body: "Guardrails for data quality." },
    ],
  };

  const experimentNode: Node<CustomNodeData> = {
    id: "experiments",
    type: "custom",
    position: { x: 240, y: -120 },
    data: {
      label: "Growth Experiments",
      type: "backend",
      summary: "Service orchestrating experiment lifecycle and reporting.",
      domain: "operations",
      tags: ["experimentation", "analytics"],
      cards: [card],
    },
  };

  const edges: Edge[] = [
    {
      id: "e-center-experiments",
      source: "center",
      target: "experiments",
      type: "custom",
    },
  ];

  it("builds a bundle enriched with workspace summary", () => {
    const bundle = buildWorkspaceDocumentationBundle(
      [center, experimentNode],
      edges,
      "Growth Lab"
    );

    expect(bundle.workspace.name).toBe("Growth Lab");
    expect(bundle.workspace.summary).toBe(center.data.description);
    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.markdown).toContain("Growth Experiments");
    expect(bundle.markdown).toContain(center.data.description);
  });

  it("produces generator prompts that reference flagged items", () => {
    const bundle = buildWorkspaceDocumentationBundle(
      [center, experimentNode],
      edges,
      "Growth Lab"
    );

    const flagged: Record<string, DocumentationFlag> = {};
    const flagId = documentationFlagId("card", "experiments", "card-001");
    flagged[flagId] = {
      id: flagId,
      kind: "card",
      nodeId: "experiments",
      cardId: "card-001",
      label: "Growth Experiments · Experiment backlog",
      note: "Requires QA approval before release.",
    };

    const prompt = buildGeneratorPrompt("lovable", bundle, flagged);

    expect(prompt).toContain("Lovable AI build assistant");
    expect(prompt).toContain("Requires QA approval before release.");
    expect(prompt).toContain("<<<BEGIN DOC>>>");
    expect(prompt).toContain("Experiment backlog");
  });
});
