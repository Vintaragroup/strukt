import type { DocumentationBundle, DocumentationFlag } from "./documentationBundle";
import { buildPrompt } from "./promptBuilder";
import type { Target } from "../platforms";

export type DocumentationGeneratorTarget = "lovable" | "base44" | "claude" | "vscode-agent";

// Map legacy UI target id to platform Target
function mapTarget(t: DocumentationGeneratorTarget): Target {
  return t === "vscode-agent" ? "vscode" : (t as Target);
}

const PLATFORM_ASK: Record<Target, string> = {
  lovable:
    "Produce a single TSX component using shadcn/ui + Tailwind that best advances this workspace. Export a default function component and import at least one component from '@/components/ui/*'. No prose.",
  base44:
    [
      "Produce a delivery-focused implementation plan in Markdown.",
      "Use EXACT H2 headers: ## Scope, ## Acceptance Criteria, ## Risks, ## Next Steps.",
      "Acceptance Criteria: at least 2 items, each in Gherkin style (Given/When/Then).",
      "Keep it concise; avoid code unless explicitly required.",
    ].join(" "),
  claude:
    "Return a concise critique (<= 250 words) followed by a checklist (3–7 items) using '- [ ] ' checkboxes with concrete actions.",
  vscode:
    "Return JSON only. Prefer tasks.json format { version: '2.0.0', tasks: [{ label, type: 'shell', command, problemMatcher? }] }. If not applicable, return { tasks: string[1..7], notes: string }.",
};

export const buildGeneratorPrompt = (
  target: DocumentationGeneratorTarget,
  bundle: DocumentationBundle,
  flagged: Record<string, DocumentationFlag>
): string => {
  const t = mapTarget(target);
  const flaggedItems = Object.values(flagged);

  const metadata = [
    `Workspace: ${bundle.workspace.name}`,
    `Nodes: ${bundle.workspace.nodeCount}, Relationships: ${bundle.workspace.edgeCount}`,
    `Generated at: ${bundle.workspace.generatedAt}`,
  ];

  const flaggedBlock =
    flaggedItems.length > 0
      ? [
          "",
          "Flagged review items:",
          ...flaggedItems.map((flag) => {
            const noteSuffix = flag.note && flag.note.trim().length > 0 ? ` — ${flag.note.trim()}` : "";
            return `- [${flag.kind}] ${flag.label}${noteSuffix}`;
          }),
        ]
      : ["", "Flagged review items: none."];

  const docIntro = [
    "",
    "Blueprint documentation follows between <<<BEGIN DOC>>> and <<<END DOC>>>.",
    "Preserve structure when responding.",
  ];

  const markdown = bundle.markdown.trim().length > 0 ? bundle.markdown.trim() : "_No documentation content_";

  const workspaceMarkdown = [
    ...metadata,
    ...flaggedBlock,
    ...docIntro,
    "",
    "<<<BEGIN DOC>>>",
    markdown,
    "<<<END DOC>>>",
  ].join("\n");

  const userAsk = PLATFORM_ASK[t];
  return buildPrompt({ target: t, workspaceMarkdown, userAsk });
};
