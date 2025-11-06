import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import {
  Flag,
  FlagOff,
  Copy,
  Check,
  Download,
  Sparkles,
  AlertTriangle,
  FileText,
  Info,
  Wand2,
} from "lucide-react";
import { cn } from "./ui/utils";
import type { DocumentationBundle, DocumentationFlag } from "@/utils/documentationBundle";
import { documentationFlagId } from "@/utils/documentationBundle";
import {
  buildGeneratorPrompt,
  type DocumentationGeneratorTarget,
} from "@/utils/documentationPrompts";
import { DELIMS, PLATFORM_HEADERS, type Target } from "@/platforms";
import { validate as validateOutput, detectVSCodeShape } from "@/utils/validators";
import { useUIPreferences } from "@/store/useUIPreferences";

type GeneratorTarget = DocumentationGeneratorTarget;

interface DocumentationPreviewProps {
  open: boolean;
  onClose: () => void;
  bundle: DocumentationBundle | null;
  flagged: Record<string, DocumentationFlag>;
  onFlagChange: (flagId: string, value: DocumentationFlag | null) => void;
  onFlagNoteChange: (flagId: string, note: string) => void;
  onDownloadMarkdown: () => void;
  onDownloadBundle: () => void;
}

const GENERATOR_TABS: Array<{
  id: GeneratorTarget;
  label: string;
  description: string;
  style: string;
}> = [
  {
    id: "lovable",
    label: "Lovable",
    description: "Concise build plan for Lovable's guided UI builder.",
    style: "from-rose-500 via-amber-500 to-pink-500",
  },
  {
    id: "base44",
    label: "Base 44",
    description: "Higher-fidelity architecture spec tuned for Base 44 pipelines.",
    style: "from-indigo-500 via-purple-500 to-slate-600",
  },
  {
    id: "claude",
    label: "Claude",
    description: "Structured PRD summary for Claude or other chat-based copilots.",
    style: "from-blue-500 via-sky-500 to-cyan-500",
  },
  {
    id: "vscode-agent",
    label: "VS Code Agent",
    description: "Agent protocol with explicit rules and task queue hints.",
    style: "from-slate-800 via-slate-700 to-slate-600",
  },
];

export function DocumentationPreview({
  open,
  onClose,
  bundle,
  flagged,
  onFlagChange,
  onFlagNoteChange,
  onDownloadMarkdown,
  onDownloadBundle,
}: DocumentationPreviewProps) {
  const [activeGenerator, setActiveGenerator] = useState<GeneratorTarget>("lovable");
  const [showRules, setShowRules] = useState(false);
  const { beginnerMode, setBeginnerMode } = useUIPreferences();
  const [regenKey, setRegenKey] = useState(0);
  const [resultByTarget, setResultByTarget] = useState<Record<GeneratorTarget, string>>({
    "lovable": "",
    "base44": "",
    "claude": "",
    "vscode-agent": "",
  });

  // Global Beginner mode toggle: applies across all targets without forcing a tab switch
  const handleBeginnerToggle = (checked: boolean) => {
    setBeginnerMode(checked);
  };

  const mapTarget = (t: GeneratorTarget): Target => (t === "vscode-agent" ? "vscode" : (t as Target));

  const prompt = useMemo(() => {
    if (!bundle) return "";
    return buildGeneratorPrompt(activeGenerator, bundle, flagged);
  }, [activeGenerator, bundle, flagged]);

  const currentTarget: Target = useMemo(() => mapTarget(activeGenerator), [activeGenerator]);
  const result = resultByTarget[activeGenerator] ?? "";

  // Target-aware coach hint for Beginner mode
  const coachHint = useMemo(() => {
    switch (activeGenerator) {
      case "lovable":
        return "Keep it concise and map to Lovable’s guided UI. Emphasize clear build steps over raw code.";
      case "base44":
        return "Prefer Scope / Acceptance criteria / Risks / Next Steps — or use Who / What / Why + User Journey. Include 1–2 Gherkin scenarios.";
      case "claude":
        return "PRD-style summary with crisp acceptance criteria and a short checklist. Be actionable and concrete.";
      case "vscode-agent":
        return "Either simple planner JSON or tasks.json with commands and file paths. Keep steps runnable in the workspace.";
      default:
        return "Use guided steps to structure your ask; keep outputs copy-and-go for the target platform.";
    }
  }, [activeGenerator]);

  const promptValidation = useMemo(() => {
    if (!prompt) return { ok: false, reasons: ["Prompt is empty."] };
    const reasons: string[] = [];
    const sysOk = prompt.includes(DELIMS.sysOpen) && prompt.includes(DELIMS.sysClose);
    const ctxOk = prompt.includes(DELIMS.ctxOpen) && prompt.includes(DELIMS.ctxClose);
    const askOk = prompt.includes(DELIMS.askOpen) && prompt.includes(DELIMS.askClose);
    if (!sysOk) reasons.push("Missing <SYS> block.");
    if (!ctxOk) reasons.push("Missing <CONTEXT> block.");
    if (!askOk) reasons.push("Missing <ASK> block.");
    return { ok: reasons.length === 0, reasons };
  }, [prompt]);

  const resultValidation = useMemo(() => {
    if (!result || result.trim().length === 0) return { ok: false, reasons: ["No result pasted yet."] };
    const v = validateOutput(currentTarget, result);
    return v;
  }, [currentTarget, result]);

  const vscodeShape = useMemo(() => {
    if (currentTarget !== "vscode") return { shape: "invalid" as const };
    return detectVSCodeShape(result);
  }, [currentTarget, result]);

  const handleResultChange = (val: string) => {
    setResultByTarget((prev) => ({ ...prev, [activeGenerator]: val }));
  };

  const downloadBlob = (content: string, filename: string, type = "application/json") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVSCode = () => {
    if (vscodeShape.shape === "tasks") {
      const pretty = JSON.stringify(vscodeShape.parsed, null, 2);
      downloadBlob(pretty, "tasks.json");
    } else if (vscodeShape.shape === "simple") {
      const pretty = JSON.stringify(vscodeShape.parsed, null, 2);
      downloadBlob(pretty, "plan.json");
    }
  };

  const handlePrettifyJSON = () => {
    try {
      const parsed = JSON.parse(result);
      const pretty = JSON.stringify(parsed, null, 2);
      handleResultChange(pretty);
    } catch {
      toast.error("Invalid JSON", { description: "The result is not valid JSON." });
    }
  };

  // Quick-fix helpers per platform
  const stripCodeFences = (text: string) => text.replace(/```[a-zA-Z]*\n?|```/g, "").trim();

  const ensureSection = (text: string, header: string, body: string) => {
    const h2 = `## ${header}`;
    if (new RegExp(`^##\\s*${header}\\b`, "im").test(text)) return text;
    const sep = text.trim().length ? "\n\n" : "";
    return `${text.trim()}${sep}${h2}\n${body.trim()}\n`;
  };

  const insertUnderSection = (text: string, header: string, insert: string) => {
    const re = new RegExp(`(##\\s*${header}\\b.*?)(\n##\\s*|$)`, "is");
    const match = text.match(re);
    if (!match) return text;
    const block = match[1];
    const restStart = match.index! + block.length;
    const rest = text.slice(restStart);
    const updated = block.trimEnd() + "\n" + insert.trim() + "\n";
    return text.slice(0, match.index!) + updated + rest;
  };

  const quickFixBase44 = () => {
    let next = result || "";
    // Prefer strict Shape A scaffold
    next = ensureSection(next, "Scope", "Describe scope and boundaries.");
    next = ensureSection(next, "Acceptance Criteria", "");
    // Ensure at least 2 Gherkin items
    const acHasGherkin = /##\s*Acceptance Criteria\b[\s\S]*?(Given.+When.+Then|^[-*]\s*(Given|When|Then))/im.test(next);
    if (!acHasGherkin) {
      next = insertUnderSection(
        next,
        "Acceptance Criteria",
        "- Given a signed-in user, when they perform an action, then the expected outcome occurs\n- Given a failure state, when a retry happens, then errors are handled gracefully"
      );
    }
    next = ensureSection(next, "Risks", "- Unknowns could impact schedule");
    next = ensureSection(next, "Next Steps", "1. Outline tasks\n2. Assign owners\n3. Set timeline");
    handleResultChange(next);
  };

  const quickFixBase44Alt = () => {
    let next = result || "";
    next = ensureSection(next, "Who", "Describe the target users.");
    next = ensureSection(next, "What", "Describe what the app or feature does.");
    next = ensureSection(next, "Why", "Describe the value and outcomes.");
    // prefer User Journey if neither exists
    const hasUJ = /##\s*User\s*Journey\b/i.test(next);
    const hasFB = /##\s*Feature\s*Breakdown\b/i.test(next);
    if (!hasUJ && !hasFB) {
      next = ensureSection(next, "User Journey", "1. User signs in\n2. Creates item\n3. Reviews status\n4. Completes task");
    }
    handleResultChange(next);
  };

  const quickFixClaude = () => {
    let next = result || "";
    if (!/Checklist\s*:/i.test(next)) {
      const sep = next.trim().length ? "\n\n" : "";
      next = `${next.trim()}${sep}Checklist:\n- [ ] Define success metrics\n- [ ] Add rollback plan\n- [ ] Assign owners`;
    }
    handleResultChange(next);
  };

  const quickFixVSCodePlan = () => {
    const plan = {
      tasks: [
        "npm ci",
        "npm run build",
        "npm run start"
      ],
      notes: "Basic plan scaffold. Replace commands as needed."
    };
    handleResultChange(JSON.stringify(plan, null, 2));
  };

  const quickFixVSCodeTasks = () => {
    const tasks = {
      version: "2.0.0",
      tasks: [
        { label: "Install", type: "shell", command: "npm ci" },
        { label: "Build", type: "shell", command: "npm run build" }
      ]
    } as const;
    handleResultChange(JSON.stringify(tasks, null, 2));
  };

  const quickFixLovable = () => {
    if (/```/.test(result)) {
      handleResultChange(stripCodeFences(result));
      return;
    }
    // Minimal scaffold if empty
    if (!result.trim()) {
      handleResultChange([
        "import { Button } from '@/components/ui/button';",
        "export default function ExampleCard() {",
        "  return (",
        "    <div className=\"p-4 border rounded-lg bg-white\">",
        "      <h2 className=\"text-lg font-semibold mb-3\">Example\u00A0Card</h2>",
        "      <Button>Click me</Button>",
        "      <ul className=\"mt-3 list-disc pl-5 text-sm text-muted-foreground\">",
        "        <li>TODO: Wire actions</li>",
        "      </ul>",
        "    </div>",
        "  );",
        "}",
      ].join("\n"));
    }
  };

  // Beginner mode dynamic content from bundle
  const beginnerDerived = useMemo(() => {
    if (!bundle) {
      const who = "target users";
      const what = "a product to deliver core value";
      const why = "clear outcomes (security, auditability, and reliability)";
      const journey = [
        "Sign up and verify",
        "Complete onboarding",
        "Use core feature",
        "Review results and iterate",
      ];
      const features = [
        "Core feature: describe the main value",
        "Authentication: login, roles, rate limits",
        "Data: storage, retention, PII minimization",
        "Monitoring: RED metrics and alerts",
      ];
      const layers = [
        "Start with Auth + Home",
        "Add Core Feature",
        "Add Monitoring",
      ];
      return { who, what, why, journey, features, layers };
    }

    const nodes = bundle.nodes || [];
    const has = (re: RegExp) => nodes.some((n) => re.test(n.label));
    const find = (re: RegExp) => nodes.find((n) => re.test(n.label));

    // Who
    let who = `${bundle.workspace.name} users`;
    if (has(/Asset Tokenization/i)) who = `asset owners and traders using ${bundle.workspace.name}`;
    if (has(/User Authentication/i)) who = `new and returning users of ${bundle.workspace.name}`;

    // What
    let what = bundle.workspace.summary || `an app to ${nodes[0]?.summary || "deliver core value"}`;
    // Trim long summaries
    if (what.length > 160) what = what.slice(0, 157) + "...";

    // Why
    let why = "deliver clear outcomes (security, auditability, and liquidity)";
    if (has(/KPI/i)) why = "hit success metrics (latency, availability, error rate)";
    if (has(/Transaction Monitoring|Observability/i)) why = "gain visibility and timely alerts";

    // Journey
    const journey: string[] = [];
    if (has(/User Authentication|Onboarding/i)) {
      journey.push("Sign up and verify (KYC if applicable)");
    } else {
      journey.push("Create account and sign in");
    }
    if (has(/Onboarding Flow/i)) journey.push("Complete onboarding checklist");
    if (has(/Asset Tokenization/i)) journey.push("Tokenize asset (form + docs) and mint token");
    journey.push("View portfolio and item details");
    journey.push("Trade or transfer where applicable");
    if (has(/Transaction Monitoring/i)) journey.push("Monitor transactions and alerts");

    // Feature breakdown
    const addFeature = (label: string, fallback: string) => {
      const n = find(new RegExp(label, "i"));
      const brief = n?.summary && n.summary.length > 0 ? n.summary : fallback;
      const trimmed = brief.length > 120 ? brief.slice(0, 117) + "..." : brief;
      return `- ${n?.label || label}: ${trimmed}`;
    };
    const features: string[] = [];
    features.push(addFeature("Asset Tokenization", "intake form, docs, metadata, token minting"));
    features.push(addFeature("Core API Service", "REST/GraphQL APIs, OIDC auth, audit logs, observability"));
    features.push(addFeature("User Authentication", "OIDC login, sessions, roles, rate limits"));
    features.push(addFeature("Data Storage", "assets, transactions, users; retention & PII minimization"));
    features.push(addFeature("Transaction Monitoring", "RED metrics, p95 latency target, actionable alerts"));

    // Layers
    const layers: string[] = [];
    layers.push("Start with Auth + Portfolio view");
    if (has(/Asset Tokenization/i)) layers.push("Add Tokenization forms and flows");
    layers.push("Add Trading or core actions");
    if (has(/Transaction Monitoring/i)) layers.push("Add Monitoring and alerts");

    return { who, what, why, journey, features, layers };
  }, [bundle, regenKey]);

  const handleRegenerateCoach = () => {
    // Force re-derivation from current bundle context (fast, client-side only)
    setRegenKey((k) => k + 1);
    toast.success("Regenerated from workspace context", {
      description: "Guided steps recomputed from the latest context.",
    });
  };

  const flaggedList = useMemo(() => {
    return Object.values(flagged).sort((a, b) => a.label.localeCompare(b.label));
  }, [flagged]);

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied", {
        description: "Paste it into your chosen assistant.",
      });
    } catch (error) {
      toast.error("Copy failed", {
        description: "Could not copy prompt to clipboard.",
      });
    }
  };

  const handleCopyText = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied", { description: label ?? "Content copied to clipboard." });
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleToggleFlag = (flag: DocumentationFlag) => {
    if (flagged[flag.id]) {
      onFlagChange(flag.id, null);
    } else {
      onFlagChange(flag.id, flag);
    }
  };

  const renderNode = (node: DocumentationBundle["nodes"][number]) => {
    const nodeFlagId = documentationFlagId("node", node.id);
    const isNodeFlagged = Boolean(flagged[nodeFlagId]);

    return (
      <Card
        key={node.id}
        className={cn(
          "border border-slate-200 shadow-sm hover:shadow-md transition-shadow",
          isNodeFlagged && "border-amber-400 bg-amber-50/40"
        )}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{node.label}</span>
                <Badge variant="outline" className="uppercase text-[10px] tracking-wide">
                  {node.type}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                {node.summary ?? "No summary provided."}
              </CardDescription>
            </div>
            <Button
              variant={isNodeFlagged ? "destructive" : "outline"}
              size="icon"
              onClick={() =>
                handleToggleFlag({
                  id: nodeFlagId,
                  kind: "node",
                  nodeId: node.id,
                  label: `${node.label} · node`,
                })
              }
              title={isNodeFlagged ? "Remove flag" : "Flag node for review"}
            >
              {isNodeFlagged ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {node.domain && <Badge variant="secondary">Domain: {node.domain}</Badge>}
            {node.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
            {typeof node.accuracy?.score === "number" && (
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1 border",
                  node.accuracy.status === "fresh" && "border-emerald-300 text-emerald-700",
                  node.accuracy.status === "fallback" && "border-amber-300 text-amber-700",
                  node.accuracy.status === "stale" && "border-rose-300 text-rose-700"
                )}
              >
                <Sparkles className="w-3 h-3" />
                Accuracy {node.accuracy.score}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {node.cards.length === 0 && (
            <div className="text-sm text-slate-500 italic">No cards attached to this node.</div>
          )}
          {node.cards.map((card) => {
            const cardFlagId = documentationFlagId("card", node.id, card.id);
            const isCardFlagged = Boolean(flagged[cardFlagId]);

            return (
              <div
                key={card.id}
                className={cn(
                  "rounded-lg border border-slate-200 p-4 space-y-3",
                  isCardFlagged && "border-amber-400 bg-amber-50/60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{card.title}</h4>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{card.type}</p>
                  </div>
                  <Button
                    variant={isCardFlagged ? "destructive" : "ghost"}
                    size="icon"
                    onClick={() =>
                      handleToggleFlag({
                        id: cardFlagId,
                        kind: "card",
                        nodeId: node.id,
                        cardId: card.id,
                        label: `${node.label} · ${card.title}`,
                      })
                    }
                    title={isCardFlagged ? "Remove flag" : "Flag card for review"}
                  >
                    {isCardFlagged ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                  </Button>
                </div>

                {card.content && (
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                    {card.content}
                  </div>
                )}

                {card.sections && card.sections.length > 0 && (
                  <div className="space-y-3">
                    {card.sections.map((section, index) => {
                      const sectionFlagId = documentationFlagId(
                        "section",
                        node.id,
                        card.id,
                        section.id ?? String(index)
                      );
                      const isSectionFlagged = Boolean(flagged[sectionFlagId]);

                      return (
                        <div
                          key={section.id ?? index}
                          className={cn(
                            "rounded-lg border border-slate-100 bg-white p-3",
                            isSectionFlagged && "border-amber-400 bg-amber-50/80"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h5 className="text-sm font-semibold text-slate-700">{section.title}</h5>
                            <Button
                              variant={isSectionFlagged ? "destructive" : "ghost"}
                              size="icon"
                              onClick={() =>
                                handleToggleFlag({
                                  id: sectionFlagId,
                                  kind: "section",
                                  nodeId: node.id,
                                  cardId: card.id,
                                  sectionId: section.id,
                                  label: `${node.label} · ${card.title} · ${section.title}`,
                                })
                              }
                              title={isSectionFlagged ? "Remove flag" : "Flag section for review"}
                            >
                              {isSectionFlagged ? (
                                <FlagOff className="w-4 h-4" />
                              ) : (
                                <Flag className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{section.body}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {card.todos && card.todos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
                      Checklist
                    </p>
                    <ul className="space-y-2">
                      {card.todos.map((todo, index) => {
                        const todoFlagId = documentationFlagId(
                          "todo",
                          node.id,
                          card.id,
                          todo.id ?? String(index)
                        );
                        const isTodoFlagged = Boolean(flagged[todoFlagId]);

                        return (
                          <li
                            key={todo.id ?? index}
                            className={cn(
                              "flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700",
                              isTodoFlagged && "border-amber-400 bg-amber-50"
                            )}
                          >
                            <span className="mt-0.5">
                              {todo.completed ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                            </span>
                            <span className="flex-1 whitespace-pre-wrap">{todo.text}</span>
                            <Button
                              variant={isTodoFlagged ? "destructive" : "ghost"}
                              size="icon"
                              onClick={() =>
                                handleToggleFlag({
                                  id: todoFlagId,
                                  kind: "todo",
                                  nodeId: node.id,
                                  cardId: card.id,
                                  todoId: todo.id,
                                  label: `${node.label} · ${card.title} · ${todo.text}`,
                                })
                              }
                              title={isTodoFlagged ? "Remove flag" : "Flag checklist item"}
                            >
                              {isTodoFlagged ? (
                                <FlagOff className="w-4 h-4" />
                              ) : (
                                <Flag className="w-4 h-4" />
                              )}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[min(96vw,1100px)] sm:max-w-[1100px] max-h-[85vh] bg-white p-0  flex flex-col">
        <DialogHeader className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Documentation preview
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Review the generated bundle, flag sections that need edits, and copy prompts for your
            preferred builder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {bundle ? (
            <div className="grid h-full min-h-0 min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[2fr_1fr]">
              {/* Node list column */}
              <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-slate-200 px-6 py-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">{bundle.workspace.name}</h2>
                    <p className="text-sm text-slate-600">
                      {bundle.workspace.summary ?? "No workspace summary captured."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <Badge variant="secondary">{bundle.workspace.nodeCount} nodes</Badge>
                      <Badge variant="secondary">{bundle.workspace.edgeCount} relationships</Badge>
                      <Badge variant="outline">
                        Generated {new Date(bundle.workspace.generatedAt).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={onDownloadMarkdown}>
                      <Download className="w-4 h-4" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={onDownloadBundle}>
                      <Download className="w-4 h-4" />
                      JSON bundle
                    </Button>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* Scrollable node cards */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-4 modal-scroll flex flex-col">
                  <div className="space-y-4 pb-6">
                    {bundle.nodes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                        No nodes documented yet. Add nodes to generate documentation.
                      </div>
                    ) : (
                      bundle.nodes.map(renderNode)
                    )}
                  </div>
                </div>
              </div>

              {/* Prompt bundles and flagged items column */}
              <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden gap-6 bg-slate-50/80 px-6 py-4">
                {/* Scrollable prompt tabs and flagged items */}
                <div className="flex-1 min-h-0 overflow-y-auto modal-scroll">
                  <div className="space-y-6 pr-4">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Prompt bundles
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select a target workflow to generate tailored instructions.
                      </p>
                    </div>

                    <Tabs
                      value={activeGenerator}
                      onValueChange={(value) => setActiveGenerator(value as GeneratorTarget)}
                      className="space-y-3"
                    >
                      <TabsList
                        className="inline-grid grid-cols-2 align-middle gap-2 rounded-xl border border-slate-200 bg-white p-2 overflow-hidden w-full h-full mb-4"
                      >
                        {GENERATOR_TABS.map((tab) => (
                          <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="
                                text-xs font-semibold px-3 py-2 rounded-md border border-slate-200
                                text-slate-700 bg-white
                                hover:bg-slate-200 hover:text-slate-900
                                data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800
                                transition-colors duration-200
                            "
                          >                   
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {GENERATOR_TABS.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                          <Card className="border border-slate-200 shadow-sm min-w-0 overflow-hidden">
                            <CardHeader>
                              <CardTitle className="text-sm">{tab.label}</CardTitle>
                              <CardDescription className="text-xs text-slate-500">
                                {tab.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 break-words">
                              {tab.id === activeGenerator && (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    {promptValidation.ok ? (
                                      <Badge
                                        variant="outline"
                                        className="border-emerald-300 text-emerald-700 flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" /> Prompt validated
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="border-rose-300 text-rose-700 flex items-center gap-1"
                                        title={promptValidation.reasons.join("; ")}
                                      >
                                        <AlertTriangle className="w-3 h-3" /> Needs fixes
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2 text-xs"
                                      onClick={() => setShowRules((v) => !v)}
                                    >
                                      Platform rules
                                    </Button>
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      aria-pressed={beginnerMode}
                                      onClick={() => handleBeginnerToggle(!beginnerMode)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          handleBeginnerToggle(!beginnerMode);
                                        }
                                      }}
                                      className={cn(
                                        "flex items-center gap-2 pl-1 rounded-md border px-2 py-1 transition-colors cursor-pointer select-none",
                                        beginnerMode
                                          ? "border-indigo-400 ring-1 ring-indigo-300 bg-indigo-50"
                                          : "border-slate-400 ring-1 ring-slate-300 bg-white"
                                      )}
                                    >
                                      <span className="text-[10px] text-slate-600">Beginner mode</span>
                                      <Switch
                                        onClick={(e) => e.stopPropagation()}
                                        checked={beginnerMode}
                                        onCheckedChange={handleBeginnerToggle}
                                        className={cn(
                                          "focus-visible:ring-2 focus-visible:ring-indigo-400",
                                          "data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-slate-400"
                                        )}
                                      />
                                    </div>
                                    {/* Starter templates dropdown (placed below) */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 px-2 text-xs col-span-2"
                                        >
                                          Starter templates
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Insert template</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {currentTarget === "base44" && (
                                          <>
                                            <DropdownMenuItem onClick={quickFixBase44}>Strict plan (Scope/AC/Risks/Next)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={quickFixBase44Alt}>Who/What/Why + Journey</DropdownMenuItem>
                                          </>
                                        )}
                                        {currentTarget === "claude" && (
                                          <DropdownMenuItem onClick={quickFixClaude}>Critique + checklist</DropdownMenuItem>
                                        )}
                                        {currentTarget === "vscode" && (
                                          <>
                                            <DropdownMenuItem onClick={quickFixVSCodePlan}>Simple planner JSON</DropdownMenuItem>
                                            <DropdownMenuItem onClick={quickFixVSCodeTasks}>tasks.json scaffold</DropdownMenuItem>
                                          </>
                                        )}
                                        {currentTarget === "lovable" && (
                                          <DropdownMenuItem onClick={quickFixLovable}>TSX component scaffold</DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              )}

                              {showRules && tab.id === activeGenerator && (
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-semibold text-slate-700 mb-2">
                                    {tab.label} rules
                                  </p>
                                  <pre className="text-xs whitespace-pre-wrap text-slate-700">{PLATFORM_HEADERS[currentTarget]}</pre>
                                </div>
                              )}

                              {beginnerMode && (
                                <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold text-indigo-900">Beginner coach — Guided steps</p>
                                    <div className="flex items-start gap-2">
                                      <div className="grid grid-rows-[auto_auto_auto] gap-1">
                                        <div className="flex items-start gap-1 text-indigo-900/80">
                                          <Info className="w-3 h-3 mt-[2px] flex-shrink-0" />
                                          <p className="text-[10px] leading-snug max-w-[220px]">{coachHint}</p>
                                        </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleRegenerateCoach}
                                            className="gap-1"
                                          >
                                            <Sparkles className="w-4 h-4" /> Regenerate
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleCopyText(
                                                `WHO: ${beginnerDerived.who}\nWHAT: ${beginnerDerived.what}\nWHY: ${beginnerDerived.why}` +
                                                  `\n\nUSER JOURNEY:\n${beginnerDerived.journey.map((s, i) => `${i + 1}) ${s}`).join("\n")}` +
                                                  `\n\nFEATURE BREAKDOWN:\n${beginnerDerived.features.join("\n")}` +
                                                  `\n\nLet’s build in layers:\n${beginnerDerived.layers.map((l, i) => `${i + 1}) ${l}`).join("\n")}\nUse real content. Keep edits scoped. Don’t touch out-of-scope areas.`,
                                                "All steps copied"
                                              )
                                            }
                                          >
                                            Copy all
                                          </Button>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">Guide</Badge>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="rounded border border-white/60 bg-white p-2">
                                      <p className="text-xs font-medium text-slate-800 mb-1">Step 1 — Who / What / Why</p>
                                      <pre className="text-[11px] whitespace-pre-wrap text-slate-700">{`WHO: ${beginnerDerived.who}
WHAT: ${beginnerDerived.what}
WHY: ${beginnerDerived.why}`}</pre>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleCopyText(
                                              `WHO: ${beginnerDerived.who}\nWHAT: ${beginnerDerived.what}\nWHY: ${beginnerDerived.why}`,
                                              "Step 1 copied"
                                            )
                                          }
                                        >
                                          Copy Step 1
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="rounded border border-white/60 bg-white p-2">
                                      <p className="text-xs font-medium text-slate-800 mb-1">Step 2 — User Journey</p>
                                      <pre className="text-[11px] whitespace-pre-wrap text-slate-700">{`USER JOURNEY:
${beginnerDerived.journey.map((step, i) => `${i + 1}) ${step}`).join("\n")}`}</pre>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleCopyText(
                                              `USER JOURNEY:\n${beginnerDerived.journey
                                                .map((step, i) => `${i + 1}) ${step}`)
                                                .join("\n")}`,
                                              "Step 2 copied"
                                            )
                                          }
                                        >
                                          Copy Step 2
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="rounded border border-white/60 bg-white p-2">
                                      <p className="text-xs font-medium text-slate-800 mb-1">Step 3 — Feature Breakdown</p>
                                      <pre className="text-[11px] whitespace-pre-wrap text-slate-700">{`FEATURE BREAKDOWN:
${beginnerDerived.features.join("\n")}`}</pre>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleCopyText(
                                              `FEATURE BREAKDOWN:\n${beginnerDerived.features.join("\n")}`,
                                              "Step 3 copied"
                                            )
                                          }
                                        >
                                          Copy Step 3
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="rounded border border-white/60 bg-white p-2">
                                      <p className="text-xs font-medium text-slate-800 mb-1">Step 4 — Iterate in layers</p>
                                      <pre className="text-[11px] whitespace-pre-wrap text-slate-700">{`Let’s build in layers:
${beginnerDerived.layers.map((l, i) => `${i + 1}) ${l}`).join("\n")}
Use real content. Keep edits scoped. Don’t touch out-of-scope areas.`}</pre>
                                      <div className="mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleCopyText(
                                              `Let’s build in layers:\n${beginnerDerived.layers
                                                .map((l, i) => `${i + 1}) ${l}`)
                                                .join("\n")}\nUse real content. Keep edits scoped. Don’t touch out-of-scope areas.`,
                                              "Step 4 copied"
                                            )
                                          }
                                        >
                                          Copy Step 4
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <Textarea
                                value={prompt}
                                readOnly
                                className="min-h-[200px] font-mono text-xs"
                              />
                              <div className="flex flex-col gap-3 items-stretch w-full">
                                <Button
                                  type="button"
                                  variant="default"
                                  className={cn(
                                    "gap-2 bg-gradient-to-r text-white w-full",
                                    tab.style,
                                    "hover:opacity-90"
                                  )}
                                  onClick={handleCopyPrompt}
                                  disabled={!promptValidation.ok && tab.id === activeGenerator}
                                  title={
                                    !promptValidation.ok && tab.id === activeGenerator
                                      ? promptValidation.reasons.join("; ")
                                      : undefined
                                  }
                                >
                                  <Copy className="w-4 h-4 flex-shrink-0" />
                                  <span>Copy prompt</span>
                                </Button>
                                {!promptValidation.ok && tab.id === activeGenerator && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="gap-2 w-full"
                                    onClick={handleCopyPrompt}
                                  >
                                    <AlertTriangle className="w-4 h-4" /> Copy anyway
                                  </Button>
                                )}
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wide w-fit">
                                  Tailored for {tab.label}
                                </Badge>
                              </div>

                              <Separator className="my-2" />
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Result</p>
                                  <div className="flex items-center gap-2">
                                    {tab.id === activeGenerator && result.trim().length > 0 && (
                                      resultValidation.ok ? (
                                        <Badge
                                          variant="outline"
                                          className="border-emerald-300 text-emerald-700 flex items-center gap-1"
                                        >
                                          <Check className="w-3 h-3" /> Output validated
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="border-rose-300 text-rose-700 flex items-center gap-1"
                                          title={resultValidation.reasons.join("; ")}
                                        >
                                          <AlertTriangle className="w-3 h-3" /> Needs fixes
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>

                                <Textarea
                                  value={result}
                                  onChange={(e) => handleResultChange(e.target.value)}
                                  placeholder={
                                    currentTarget === "vscode"
                                      ? "Paste the assistant's JSON here to validate (tasks.json or simple planner)."
                                      : "Paste the assistant's output here to validate."
                                  }
                                  className="min-h-[160px] font-mono text-xs"
                                />

                                {currentTarget === "vscode" && result.trim().length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={handlePrettifyJSON}
                                    >
                                      Prettify JSON
                                    </Button>
                                    {(vscodeShape.shape === "tasks" || vscodeShape.shape === "simple") && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleDownloadVSCode}
                                        className="gap-2"
                                      >
                                        <Download className="w-4 h-4" />
                                        {vscodeShape.shape === "tasks" ? "Download tasks.json" : "Download plan.json"}
                                      </Button>
                                    )}
                                    {vscodeShape.shape === "invalid" && (
                                      <Badge variant="outline" className="text-[10px]">
                                        Invalid VS Code JSON {vscodeShape.reasons ? `— ${vscodeShape.reasons.join("; ")}` : ""}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {/* Explain-why + Quick fixes */}
                                {result.trim().length > 0 && !resultValidation.ok && (
                                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                                        <Info className="w-4 h-4" /> Why this fails
                                      </div>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="cursor-help text-[10px]">
                                            {resultValidation.reasons.length} issue(s)
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="max-w-xs space-y-1">
                                            {resultValidation.reasons.map((r, i) => (
                                              <div key={i} className="text-white/90">• {r}</div>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {currentTarget === "base44" && (
                                        <>
                                          <Button type="button" size="sm" className="gap-1" onClick={quickFixBase44}>
                                            <Wand2 className="w-4 h-4" /> Add missing sections
                                          </Button>
                                          <Button type="button" size="sm" variant="outline" onClick={quickFixBase44Alt}>
                                            Add Who/What/Why
                                          </Button>
                                        </>
                                      )}
                                      {currentTarget === "claude" && (
                                        <Button type="button" size="sm" onClick={quickFixClaude}>
                                          <Wand2 className="w-4 h-4" /> Add checklist
                                        </Button>
                                      )}
                                      {currentTarget === "vscode" && (
                                        <>
                                          <Button type="button" size="sm" onClick={quickFixVSCodePlan}>
                                            <Wand2 className="w-4 h-4" /> Scaffold simple plan
                                          </Button>
                                          <Button type="button" size="sm" variant="outline" onClick={quickFixVSCodeTasks}>
                                            Scaffold tasks.json
                                          </Button>
                                          <Button type="button" size="sm" variant="ghost" onClick={handlePrettifyJSON}>
                                            Prettify JSON
                                          </Button>
                                        </>
                                      )}
                                      {currentTarget === "lovable" && (
                                        <Button type="button" size="sm" onClick={quickFixLovable}>
                                          <Wand2 className="w-4 h-4" /> Remove code fences / scaffold
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ))}
                    </Tabs>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                          Flagged items
                        </h3>
                        <Badge variant="secondary">{flaggedList.length}</Badge>
                      </div>
                      {flaggedList.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                          Nothing flagged. Use the flags in the document to mark sections that need review.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {flaggedList.map((flag) => (
                            <div
                              key={flag.id}
                              className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/80 px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{flag.label}</p>
                                  <p className="text-xs uppercase tracking-wide text-amber-700">{flag.kind}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onFlagChange(flag.id, null)}
                                  title="Remove flag"
                                >
                                  <FlagOff className="w-4 h-4" />
                                </Button>
                              </div>
                              <Textarea
                                placeholder="Add reviewer notes or TODOs"
                                value={flag.note ?? ""}
                                className="min-h-[80px] text-xs"
                                onChange={(event) => onFlagNoteChange(flag.id, event.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Generating documentation bundle…</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
