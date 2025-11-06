import type { DocumentationBundle } from "@/utils/documentationBundle";

const now = () => new Date().toISOString();

const mkWorkspace = (name: string, summary: string, nodeCount: number, edgeCount: number) => ({
  name,
  summary,
  nodeCount,
  edgeCount,
  generatedAt: now(),
});

export const SAMPLE_BUNDLES: Array<{ id: string; label: string; bundle: DocumentationBundle }> = [
  {
    id: "frontend-backend",
    label: "Frontend + Backend",
    bundle: {
      workspace: mkWorkspace(
        "Demo: Frontend + Backend",
        "Simple product with a React frontend and Node API backend.",
        3,
        2
      ),
      nodes: [
        {
          id: "fe",
          label: "Web Frontend",
          type: "frontend",
          domain: "tech",
          tags: ["frontend", "react"],
          accuracy: { score: 82, status: "fresh" },
          cards: [
            {
              id: "fe-brief",
              title: "Frontend Brief",
              type: "brief",
              content: "React + Tailwind UI for core flows.",
            },
          ],
          incoming: ["api"],
          outgoing: ["req"],
        },
        {
          id: "api",
          label: "API Backend",
          type: "backend",
          domain: "tech",
          tags: ["backend", "node"],
          accuracy: { score: 76, status: "fallback" },
          cards: [
            {
              id: "api-spec",
              title: "API Spec",
              type: "spec",
              sections: [
                { id: "ep", title: "Endpoints", body: "GET /health\nGET /items" },
                { id: "auth", title: "Auth", body: "OIDC bearer tokens" },
              ],
            },
          ],
          incoming: ["req"],
          outgoing: ["fe"],
        },
        {
          id: "req",
          label: "Requirements",
          type: "requirement",
          domain: "business",
          tags: ["requirement"],
          accuracy: { score: 68, status: "stale" },
          cards: [
            {
              id: "req-ac",
              title: "Acceptance Criteria",
              type: "checklist",
              todos: [
                { id: "t1", text: "User can view item list", completed: false },
                { id: "t2", text: "User can add item", completed: false },
              ],
            },
          ],
          incoming: [],
          outgoing: ["api"],
        },
      ],
      relationships: [
        { source: "req", target: "api", label: "implements" },
        { source: "api", target: "fe", label: "depends-on" },
      ],
      markdown: "",
    },
  },
  {
    id: "docs-heavy",
    label: "Documentation heavy",
    bundle: {
      workspace: mkWorkspace(
        "Demo: Docs heavy",
        "Architecture notes and onboarding docs.",
        2,
        1
      ),
      nodes: [
        {
          id: "arch",
          label: "Architecture Overview",
          type: "doc",
          domain: "operations",
          tags: ["docs", "architecture"],
          accuracy: { score: 90, status: "fresh" },
          cards: [
            {
              id: "arch-docs",
              title: "Overview",
              type: "markdown",
              sections: [
                { id: "s1", title: "Context", body: "System context and constraints." },
                { id: "s2", title: "Decisions", body: "ADR-001, ADR-002" },
              ],
            },
          ],
          incoming: [],
          outgoing: ["onboard"],
        },
        {
          id: "onboard",
          label: "Onboarding",
          type: "doc",
          domain: "operations",
          tags: ["docs", "runbook"],
          accuracy: { score: 72, status: "fallback" },
          cards: [
            {
              id: "onboard-steps",
              title: "Steps",
              type: "todo",
              todos: [
                { id: "t1", text: "Clone repo", completed: false },
                { id: "t2", text: "Install deps", completed: false },
                { id: "t3", text: "Run dev", completed: false },
              ],
            },
          ],
          incoming: ["arch"],
          outgoing: [],
        },
      ],
      relationships: [
        { source: "arch", target: "onboard", label: "documents" },
      ],
      markdown: "",
    },
  },
  {
    id: "requirements-only",
    label: "Requirements only",
    bundle: {
      workspace: mkWorkspace(
        "Demo: Requirements only",
        "Minimal bundle to validate PRD prompts.",
        1,
        0
      ),
      nodes: [
        {
          id: "prd",
          label: "Product Requirements",
          type: "requirement",
          domain: "business",
          tags: ["prd", "requirements"],
          accuracy: { score: 64, status: "stale" },
          cards: [
            {
              id: "prd-body",
              title: "PRD",
              type: "text",
              content: "Outline MVP scope, success metrics, and risks.",
            },
          ],
          incoming: [],
          outgoing: [],
        },
      ],
      relationships: [],
      markdown: "",
    },
  },
];
