import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Loader2, Sparkles, Check, ArrowRight, ArrowLeft, ListChecks, MessageSquareText, RefreshCw } from "lucide-react";
import {
  evaluatePromptForWizard,
  generateQuestionOpinion,
  generateQuestionSuggestion,
  getWizardQuestionById,
  type WizardPromptEvaluation,
  WizardQuestion,
} from "@/data/wizardQuestions";
import type { SuggestedNode, SuggestionKnowledge } from "@/types/ai";
import { suggestStartNodes, continueWizard } from "@/services/aiSuggestions";
import { Input } from "./ui/input";

type WizardStep = "idea" | "summary" | "questions" | "review";

const DEFAULT_NAME_FALLBACK = "Strukt Canvas";
const STOP_WORDS = new Set([
  "the","and","that","with","from","this","into","your","about","for","when","where","what","have","been","while","their","they","them","will","just","make","made","over","such","more","than","each","which","also","very","much","like","have","need","want","plan","plans","plan","coastal","coast","into","onto","after","before","along","through","because","should","could","would","does","doing","done","help","helps","using","users","teams","team","people","system","platform","build","create","design","manage","management","workspace","application","application","apps","app","experience","product","products","services","service","intel","data","info","info","insights","insight","suite","tool","tools","tools","space","spaces"
]);

const THEME_NAME_DATA: Partial<Record<WizardPromptEvaluation["analysis"]["themes"][number], { roots?: string[]; suffixes?: string[]; prefixes?: string[] }>> = {
  ai: {
    roots: ["Cortex", "Neuro", "Pulse", "Vector"],
    suffixes: ["Lab", "Synth", "Neuron"],
  },
  integration: {
    roots: ["Fabric", "Mesh", "Bridge", "Link"],
    suffixes: ["Hub", "Works", "Grid"],
  },
  productivity: {
    roots: ["Flow", "Momentum", "Stride", "Sprint"],
    suffixes: ["Desk", "Planner", "Studio"],
  },
  healthcare: {
    roots: ["Vital", "Harbor", "Wellspring", "Serenity"],
    suffixes: ["Collective", "Clinic", "Network"],
  },
  finance: {
    roots: ["Ledger", "Aegis", "Balance", "Trust"],
    suffixes: ["Desk", "Atlas", "Vault"],
  },
  education: {
    roots: ["Campus", "Scholars", "Cohort", "Catalyst"],
    suffixes: ["Academy", "Studio", "Workshop"],
  },
  ecommerce: {
    roots: ["Market", "Merchant", "Commerce", "Exchange"],
    suffixes: ["Forge", "Lane", "Collective"],
  },
  marketing: {
    roots: ["Narrative", "Beacon", "Signal", "Campaign"],
    suffixes: ["Hub", "Studio", "Collective"],
  },
  wellness: {
    roots: ["Serene", "Harmony", "Lumen", "Embrace"],
    suffixes: ["Haven", "Retreat", "Collective"],
  },
  culinary: {
    roots: ["Harvest", "Pantry", "Savor", "Ember"],
    suffixes: ["Kitchen", "Table", "Collective"],
  },
  data: {
    roots: ["Insight", "Metric", "Signal", "Compass"],
    suffixes: ["Analytics", "Works", "Center"],
  },
  go_to_market: {
    roots: ["Launch", "Growth", "Funnel", "Catalyst"],
    suffixes: ["Ops", "Studio", "Works"],
  },
  compliance: {
    roots: ["Guardian", "Aegis", "Assure", "Ledger"],
    suffixes: ["Desk", "Works", "Collective"],
  },
  internal_enablement: {
    roots: ["Enable", "Allies", "Crew", "Pulse"],
    suffixes: ["Hub", "Collective", "Studio"],
  },
};

function toTitle(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  });
  return result;
}

function generateNameSuggestions(
  sourceText: string,
  analysis: WizardPromptEvaluation["analysis"] | null,
  seed = 0,
  count = 4
): string[] {
  const normalized = sourceText?.toLowerCase() ?? "";
  const tokens = normalized.match(/\b[a-z0-9]{3,}\b/g) ?? [];
  const filteredTokens = uniqueStrings(
    tokens
      .filter((word) => !STOP_WORDS.has(word))
      .map(toTitle)
  );

  const themeList = analysis?.themes ?? [];
  const themeRoots = themeList.flatMap((theme) => THEME_NAME_DATA[theme]?.roots ?? []);
  const themeSuffixes = themeList.flatMap((theme) => THEME_NAME_DATA[theme]?.suffixes ?? []);
  const themePrefixes = themeList.flatMap((theme) => THEME_NAME_DATA[theme]?.prefixes ?? []);

  const baseRoots = uniqueStrings([...themeRoots, ...filteredTokens, "Strukt", "Atlas", "Compass", "Harbor"]);
  const suffixPool = uniqueStrings([
    ...themeSuffixes,
    "Lab",
    "Hub",
    "Collective",
    "Studio",
    "Works",
    "Flow",
    "Forge",
    "Navigator",
    "Canvas",
    "Systems",
  ]);
  const prefixPool = uniqueStrings([...themePrefixes, "Project", "Nova", "Coastal", "Adaptive"]);

  if (baseRoots.length === 0) {
    baseRoots.push("Strukt");
  }
  if (suffixPool.length === 0) {
    suffixPool.push("Canvas");
  }

  const results = new Set<string>();
  const maxAttempts = count * 6;
  let attempt = 0;

  while (results.size < count && attempt < maxAttempts) {
    const root = baseRoots[(seed + attempt) % baseRoots.length];
    const suffix = suffixPool[(seed * 3 + attempt) % suffixPool.length];
    const usePrefix = attempt % 3 === 1 && prefixPool.length > 0;
    const prefix = usePrefix ? prefixPool[(seed + attempt) % prefixPool.length] : "";

    let name = root;
    if (usePrefix && prefix && prefix.toLowerCase() !== root.toLowerCase()) {
      name = `${prefix} ${root}`;
    }
    if (suffix && !name.toLowerCase().endsWith(suffix.toLowerCase())) {
      name = `${name} ${suffix}`;
    }

    results.add(name.replace(/\s+/g, " ").trim());
    attempt += 1;
  }

  if (results.size === 0) {
    results.add(DEFAULT_NAME_FALLBACK);
  }

  return Array.from(results).slice(0, count);
}


interface StartWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (
    nodes: SuggestedNode[],
    options?: { suggestionId?: string; renameTo?: string; centerSummary?: string }
  ) => void;
  workspaceId: string;
  sessionId: string | null;
  onSession: (sessionId: string | null) => void;
  initialPrompt?: string;
  onInitialPromptConsumed?: () => void;
}

type AnswerMap = Record<string, string>;

const STEP_ORDER: WizardStep[] = ["idea", "summary", "questions", "review"];

function mergeKnowledgeQuestionHints(base: WizardQuestion[], knowledge: SuggestionKnowledge | null): WizardQuestion[] {
  if (!knowledge || !knowledge.questionHints || knowledge.questionHints.length === 0) {
    return base;
  }
  const existing = new Set(base.map((question) => question.id));
  const extras: WizardQuestion[] = [];
  knowledge.questionHints.forEach((hint) => {
    const normalized = hint.trim();
    if (!normalized || existing.has(normalized)) {
      return;
    }
    const candidate = getWizardQuestionById(normalized);
    if (candidate) {
      extras.push(candidate);
      existing.add(normalized);
    }
  });
  if (extras.length === 0) {
    return base;
  }
  return [...base, ...extras];
}

const THEME_LABELS: Record<
  string,
  {
    label: string;
    description: string;
  }
> = {
  ai: {
    label: "AI & Automation",
    description: "We’ll emphasize data readiness and responsible AI scaffolding.",
  },
  internal_enablement: {
    label: "Internal Enablement",
    description: "Expect more focus on adoption, change management, and enablement.",
  },
  go_to_market: {
    label: "Go-To-Market",
    description: "We’ll surface growth and launch planning considerations.",
  },
  compliance: {
    label: "Compliance & Trust",
    description: "Security, privacy, and audit trails will stay front-and-center.",
  },
  data: {
    label: "Data & Insights",
    description: "We’ll highlight telemetry, KPIs, and instrumentation choices.",
  },
  integration: {
    label: "Integrations",
    description: "Expect more prompts about systems we need to connect with.",
  },
  productivity: {
    label: "Productivity Workflows",
    description: "We’ll focus on collaboration and process optimization nodes.",
  },
};

function getStepLabel(step: WizardStep): string {
  switch (step) {
    case "idea":
      return "Vision";
    case "summary":
      return "Understanding";
    case "questions":
      return "Discovery";
    case "review":
      return "Blueprint";
    default:
      return step;
  }
}

function getStepDescription(step: WizardStep): string {
  switch (step) {
    case "idea":
      return "Share what you want to create.";
    case "summary":
      return "Confirm we captured the right intent.";
    case "questions":
      return "Answer a few tailored questions.";
    case "review":
      return "Review the brief and generate starter nodes.";
    default:
      return "";
  }
}

export function StartWizard({
  isOpen,
  onClose,
  onAccept,
  workspaceId,
  sessionId,
  onSession,
  initialPrompt,
  onInitialPromptConsumed,
}: StartWizardProps) {
  const [step, setStep] = useState<WizardStep>("idea");
  const [idea, setIdea] = useState("");
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState<WizardQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedNode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const prefillPromptRef = useRef<string | null>(null);
  const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState(false);
  const [promptAnalysis, setPromptAnalysis] = useState<WizardPromptEvaluation["analysis"] | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [prefetchedStartSuggestions, setPrefetchedStartSuggestions] = useState<SuggestedNode[] | null>(null);
  const [prefetchedStartRationale, setPrefetchedStartRationale] = useState<string | null>(null);
  const [prefetchedKnowledge, setPrefetchedKnowledge] = useState<SuggestionKnowledge | null>(null);
  const [hasAppliedPrefetchedStart, setHasAppliedPrefetchedStart] = useState(false);
  const [questionOpinions, setQuestionOpinions] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        message?: string;
      }
    >
  >({});
  const [questionSuggestions, setQuestionSuggestions] = useState<
    Record<
      string,
      {
        status: "idle" | "loading" | "ready" | "error";
        message?: string;
      }
    >
  >({});
  const [suggestionIterations, setSuggestionIterations] = useState<Record<string, number>>({});
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const [nameSeed, setNameSeed] = useState(0);
  const [workspaceNameChoice, setWorkspaceNameChoice] = useState<string>(DEFAULT_NAME_FALLBACK);
  const [isCustomName, setIsCustomName] = useState(false);
  const effectiveIdea = useMemo(
    () => idea.trim() || initialPrompt?.trim() || "",
    [idea, initialPrompt]
  );
  const effectiveSummary = useMemo(
    () => summary.trim() || effectiveIdea,
    [summary, effectiveIdea]
  );
  const effectiveWorkspaceLabel = workspaceNameChoice.trim() || DEFAULT_NAME_FALLBACK;
  const effectiveCenterSummary = effectiveSummary;

  useEffect(() => {
    if (!isOpen) return;

    setStep("idea");
    setIdea("");
    setSummary("");
    setQuestions([]);
    setAnswers({});
    setMissingRequired([]);
    setSuggestions([]);
    setError(null);
    setIsGenerating(false);
    setActiveSessionId(sessionId);
    prefillPromptRef.current = null;
    setIsAnalyzingPrompt(false);
    setPromptAnalysis(null);
    setAnalysisError(null);
    setPrefetchedStartSuggestions(null);
    setPrefetchedStartRationale(null);
    setPrefetchedKnowledge(null);
    setHasAppliedPrefetchedStart(false);
    setQuestionOpinions({});
    setQuestionSuggestions({});
    setSuggestionIterations({});
    setNameOptions([]);
    setNameSeed(0);
    setWorkspaceNameChoice(DEFAULT_NAME_FALLBACK);
    setIsCustomName(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const base = effectiveSummary;
    if (!base) {
      setNameOptions([DEFAULT_NAME_FALLBACK]);
      if (!isCustomName) {
        setWorkspaceNameChoice(DEFAULT_NAME_FALLBACK);
      }
      return;
    }

    const analysis = promptAnalysis ?? evaluatePromptForWizard(base).analysis;
    const generated = generateNameSuggestions(base, analysis, nameSeed);
    const complete = generated.length > 0 ? generated : [DEFAULT_NAME_FALLBACK];
    setNameOptions(complete);
    if (!isCustomName) {
      setWorkspaceNameChoice((prev) => {
        if (prev && complete.includes(prev)) return prev;
        return complete[0] ?? DEFAULT_NAME_FALLBACK;
      });
    }
  }, [effectiveSummary, isCustomName, isOpen, nameSeed, promptAnalysis]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const question of questions) {
      counts[question.category] = (counts[question.category] ?? 0) + 1;
    }
    return counts;
  }, [questions]);

  const handleClose = () => {
    onClose();
  };

  const handleShuffleNames = useCallback(() => {
    setIsCustomName(false);
    setNameSeed((prev) => prev + 1);
  }, []);

  const prepareFromPrompt = useCallback(
    async (prompt: string, targetStep: WizardStep = "summary") => {
      const trimmed = prompt.trim();
      if (!trimmed || isAnalyzingPrompt) return;

      setIdea(trimmed);
      setStep("summary");
      setPromptAnalysis(null);
      setSummary("");
      setQuestions([]);
      setIsAnalyzingPrompt(true);
      setAnalysisError(null);
      try {
        const evaluationPromise = new Promise<WizardPromptEvaluation>((resolve) =>
          window.setTimeout(() => resolve(evaluatePromptForWizard(trimmed)), 320)
        );

        const startResult = await suggestStartNodes({ workspaceId, idea: trimmed });

        if (startResult.sessionId) {
          setActiveSessionId(startResult.sessionId);
          onSession(startResult.sessionId);
        }

        const evaluation = await evaluationPromise;
        const knowledge = startResult.knowledge ?? null;
        setPrefetchedKnowledge(knowledge);

        setPromptAnalysis(evaluation.analysis);
        const combinedQuestions = mergeKnowledgeQuestionHints(evaluation.questions, knowledge);
        const baseSummary = startResult.rationale || evaluation.summary || trimmed;
        setSummary(baseSummary);
        setQuestions(combinedQuestions);
        setAnswers((previous) => {
          const next: AnswerMap = {};
          for (const question of combinedQuestions) {
            next[question.id] = previous[question.id] ?? "";
          }
          return next;
        });
        setMissingRequired([]);
        setSuggestions([]);
        setError(null);
        setIsGenerating(false);
        setQuestionOpinions({});
        setQuestionSuggestions({});
        setPrefetchedStartSuggestions(startResult.suggestions ?? []);
        setPrefetchedStartRationale(startResult.rationale ?? null);
        setHasAppliedPrefetchedStart(false);
        setStep(targetStep);
      } catch (err) {
        console.error("Failed to analyze prompt", err);
        setAnalysisError("We couldn't analyze that prompt right now. Try again in a moment.");
      } finally {
        setIsAnalyzingPrompt(false);
      }
    },
    [isAnalyzingPrompt, onSession, workspaceId]
  );

  const handleIdeaContinue = () => {
    prepareFromPrompt(idea);
  };

  const handleSummaryContinue = () => {
    if (questions.length === 0) {
      setStep("review");
      return;
    }
    setStep("questions");
  };

  const handleQuestionAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (missingRequired.includes(id)) {
      setMissingRequired((prev) => prev.filter((questionId) => questionId !== id));
    }
    setQuestionOpinions((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setQuestionSuggestions((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleQuestionsContinue = () => {
    if (questions.length === 0) {
      setStep("review");
      return;
    }

    const missing = questions
      .filter((question) => question.required)
      .filter((question) => !answers[question.id]?.trim())
      .map((question) => question.id);

    if (missing.length > 0) {
      setMissingRequired(missing);
      return;
    }

    setMissingRequired([]);
    setStep("review");
  };

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex <= 0) {
      handleClose();
      return;
    }

    if (step === "review") {
      setSuggestions([]);
    }

    setStep(STEP_ORDER[currentIndex - 1]);
  };

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = initialPrompt?.trim();
    if (!trimmed) return;
    if (prefillPromptRef.current === trimmed) return;

    prefillPromptRef.current = trimmed;
    prepareFromPrompt(trimmed);
    onInitialPromptConsumed?.();
  }, [initialPrompt, isOpen, onInitialPromptConsumed, prepareFromPrompt]);

  const resolveAnalysis = useCallback(
    (prompt: string) => {
      if (promptAnalysis) return promptAnalysis;
      return evaluatePromptForWizard(prompt).analysis;
    },
    [promptAnalysis]
  );

  const handleSuggestAnswer = (question: WizardQuestion) => {
    const trimmedPrompt = idea.trim() || initialPrompt?.trim() || "";
    if (!trimmedPrompt) {
      setQuestionSuggestions((prev) => ({
        ...prev,
        [question.id]: {
          status: "error",
          message: "Share a bit about the idea first so I can draft something useful.",
        },
      }));
      return;
    }

    setQuestionSuggestions((prev) => ({
      ...prev,
      [question.id]: { status: "loading" },
    }));

    const iteration = suggestionIterations[question.id] ?? 0;

    window.setTimeout(() => {
      try {
        const suggestion = generateQuestionSuggestion(question, {
          prompt: trimmedPrompt,
          answers,
          summary,
          analysis: resolveAnalysis(trimmedPrompt),
          iteration,
          previousSuggestion: answers[question.id],
        });
        setAnswers((prev) => {
          const existing = prev[question.id]?.trim();
          const nextValue = existing
            ? `${existing}\n\n${suggestion}`
            : suggestion;
          return { ...prev, [question.id]: nextValue };
        });
        setQuestionSuggestions((prev) => ({
          ...prev,
          [question.id]: {
            status: "ready",
            message:
              iteration > 0
                ? "Another angle inserted—keep what resonates."
                : "Suggestion inserted—tweak anything that needs your voice.",
          },
        }));
        setSuggestionIterations((prev) => ({
          ...prev,
          [question.id]: iteration + 1,
        }));
      } catch (err) {
        console.error("Failed to generate answer suggestion", err);
        setQuestionSuggestions((prev) => ({
          ...prev,
          [question.id]: {
            status: "error",
            message: "I couldn't draft that just now. Try again in a moment.",
          },
        }));
      }
    }, 320);
  };

  const handleRequestOpinion = (question: WizardQuestion) => {
    const trimmedPrompt = idea.trim() || initialPrompt?.trim() || "";
    if (!trimmedPrompt) {
      setQuestionOpinions((prev) => ({
        ...prev,
        [question.id]: {
          status: "error",
          message: "Share a bit about the idea first so I have context.",
        },
      }));
      return;
    }

    setQuestionOpinions((prev) => ({
      ...prev,
      [question.id]: { status: "loading" },
    }));

    window.setTimeout(() => {
      try {
        const message = generateQuestionOpinion(question, {
          prompt: trimmedPrompt,
          answers,
          summary,
          analysis: resolveAnalysis(trimmedPrompt),
        });
        setQuestionOpinions((prev) => ({
          ...prev,
          [question.id]: { status: "ready", message },
        }));
      } catch (err) {
        console.error("Failed to build opinion", err);
        setQuestionOpinions((prev) => ({
          ...prev,
          [question.id]: {
            status: "error",
            message: "I couldn't form an opinion just now. Try again in a moment.",
          },
        }));
      }
    }, 320);
  };

  const handleGenerate = async () => {
    const trimmed = idea.trim();
    if (!trimmed || isAnalyzingPrompt) return;

    setIsGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      if (prefetchedStartSuggestions && prefetchedStartSuggestions.length > 0 && !hasAppliedPrefetchedStart) {
        const options: { renameTo?: string; centerSummary?: string } = {};
        if (effectiveWorkspaceLabel) options.renameTo = effectiveWorkspaceLabel;
        if (effectiveCenterSummary) options.centerSummary = effectiveCenterSummary;
        await onAccept(prefetchedStartSuggestions, Object.keys(options).length ? options : undefined);
        setHasAppliedPrefetchedStart(true);
        setPrefetchedStartSuggestions(null);
        setPrefetchedStartRationale(null);
        setPrefetchedKnowledge(null);
        handleClose();
        return;
      }

      const result = activeSessionId
        ? await continueWizard({ sessionId: activeSessionId, idea: trimmed })
        : await suggestStartNodes({ workspaceId, idea: trimmed });

      if (result.sessionId) {
        setActiveSessionId(result.sessionId);
        onSession(result.sessionId);
      }

      const generated = result.suggestions ?? [];
      setSuggestions(generated);
      if (generated.length > 0) {
        const options: { renameTo?: string; centerSummary?: string } = {};
        if (effectiveWorkspaceLabel) options.renameTo = effectiveWorkspaceLabel;
        if (effectiveCenterSummary) options.centerSummary = effectiveCenterSummary;
        await onAccept(generated, Object.keys(options).length ? options : undefined);
        setHasAppliedPrefetchedStart(true);
        setPrefetchedStartSuggestions(null);
        setPrefetchedStartRationale(null);
        setPrefetchedKnowledge(null);
        handleClose();
      }
    } catch (err) {
      console.error("Failed to generate wizard suggestions", err);
      setError("We couldn't generate suggestions right now. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestions = (items: SuggestedNode[], suggestionId?: string) => {
    if (!items || items.length === 0) return;

    const options: { suggestionId?: string; renameTo?: string; centerSummary?: string } = {};
    if (suggestionId) {
      options.suggestionId = suggestionId;
    }
    if (effectiveWorkspaceLabel) {
      options.renameTo = effectiveWorkspaceLabel;
    }
    if (effectiveCenterSummary) {
      options.centerSummary = effectiveCenterSummary;
    }

    onAccept(items, Object.keys(options).length > 0 ? options : undefined);
    handleClose();
  };

  const renderIdeaStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Share your vision
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Describe what you want to build. We will ask a few clarifying questions to shape the right starting structure.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="wizard-idea" className="text-sm font-medium text-gray-800">
          What problem or product are we mapping?
        </Label>
        <Textarea
          id="wizard-idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="e.g. A gamified productivity hub that motivates developers with quests, streaks, and real-time feedback."
          className="min-h-[140px] resize-none border-indigo-100 focus-visible:ring-indigo-300"
          disabled={isAnalyzingPrompt}
        />
      </div>

      {isAnalyzingPrompt && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing your prompt to tailor the discovery questions…
        </div>
      )}
      {analysisError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {analysisError}
        </div>
      )}
    </div>
  );

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Here&apos;s what we heard</h3>
        <p className="text-sm text-gray-600 mt-1">
          We&apos;ll tailor the wizard based on this understanding. Adjust below if we need to refine anything.
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
        {isAnalyzingPrompt ? (
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            Tailoring questions based on your idea…
          </div>
        ) : (
          <div className="text-sm text-indigo-900 leading-relaxed">{summary}</div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-indigo-500" />
          Upcoming focus areas
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <Badge key={category} variant="secondary" className="bg-slate-100 text-slate-600 capitalize">
              {category} &bull; {count}
            </Badge>
          ))}
          {questions.length === 0 && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-600">
              No extra questions needed
            </Badge>
          )}
        </div>
      </div>

      {prefetchedKnowledge && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-amber-700" />
            Knowledge base signals
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
            {prefetchedKnowledge.summary}
          </p>
          {prefetchedKnowledge.prds.length > 0 && (
            <div className="mt-3 space-y-2">
              {prefetchedKnowledge.prds.slice(0, 2).map((prd) => (
                <div key={prd.id} className="rounded-xl border border-amber-100 bg-white/70 p-3">
                  <div className="text-xs font-semibold text-amber-900">{prd.name}</div>
                  <ul className="mt-2 space-y-1">
                    {prd.sections
                      .filter((section) => section.snippet)
                      .slice(0, 2)
                      .map((section) => (
                        <li key={`${prd.id}-${section.title}`} className="text-[11px] text-amber-800 leading-relaxed">
                          <span className="font-medium">{section.title}:</span> {section.snippet}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {prefetchedKnowledge.fragments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {prefetchedKnowledge.fragments.slice(0, 4).map((fragment) => (
                <Badge
                  key={fragment.id}
                  variant="secondary"
                  className="border border-amber-200 bg-amber-100/70 text-[11px] font-medium text-amber-700"
                >
                  {fragment.type.replace(/_/g, " ")}
                  {fragment.label ? ` • ${fragment.label}` : ""}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {promptAnalysis && (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">How we tailored the questions</h4>
          <p className="text-xs text-slate-500 mb-3">
            Prompt richness score: {Math.round(promptAnalysis.richness * 100)}%. Higher scores mean fewer follow-up questions.
          </p>
          {promptAnalysis.themes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {promptAnalysis.themes.map((theme) => {
                const meta =
                  THEME_LABELS[theme] ??
                  {
                    label: theme,
                    description: "We’ll keep this theme in mind while shaping suggestions.",
                  };
                return (
                  <div
                    key={theme}
                    className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-900"
                  >
                    <div className="font-semibold text-indigo-800">{meta.label}</div>
                    <div className="text-[11px] text-indigo-700 leading-relaxed">{meta.description}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              No dominant themes detected, so we added broad questions to cover the essentials.
            </div>
          )}
        </div>
      )}
      {analysisError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {analysisError}
        </div>
      )}
    </div>
  );

  const renderQuestionInput = (question: WizardQuestion) => {
    if (question.type === "select" && question.options) {
      return (
        <Select
          value={answers[question.id] ?? ""}
          onValueChange={(value) => handleQuestionAnswer(question.id, value)}
        >
          <SelectTrigger className="h-11 border-indigo-100">
            <SelectValue placeholder="Make a selection" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Textarea
        value={answers[question.id] ?? ""}
        onChange={(event) => handleQuestionAnswer(question.id, event.target.value)}
        placeholder={question.placeholder}
        className="min-h-[100px] resize-none border-indigo-100 focus-visible:ring-indigo-300"
      />
    );
  };

  const renderQuestionsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">A few quick clarifiers</h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed answers help the AI balance business goals, product experience, and technical planning.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const isMissing = missingRequired.includes(question.id);
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm/50"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Label className="text-sm font-semibold text-slate-900 leading-snug">
                    {question.prompt}
                    {question.required && <span className="text-indigo-500 ml-1">*</span>}
                  </Label>
                  <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600">
                    {question.category}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">{question.helperText}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => handleSuggestAnswer(question)}
                      disabled={questionSuggestions[question.id]?.status === "loading"}
                    >
                      {questionSuggestions[question.id]?.status === "loading" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Auto-fill
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => handleRequestOpinion(question)}
                      disabled={questionOpinions[question.id]?.status === "loading"}
                    >
                      {questionOpinions[question.id]?.status === "loading" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquareText className="w-3.5 h-3.5" />
                      )}
                      Ask opinion
                    </Button>
                  </div>
                </div>
                {renderQuestionInput(question)}
                {questionSuggestions[question.id]?.message && (
                  <div
                    className={`text-xs leading-relaxed rounded-xl px-3 py-2 border ${
                      questionSuggestions[question.id]?.status === "ready"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {questionSuggestions[question.id]?.message}
                  </div>
                )}
                {questionOpinions[question.id]?.message && (
                  <div
                    className={`text-xs leading-relaxed rounded-xl px-3 py-2 border ${
                      questionOpinions[question.id]?.status === "ready"
                        ? "bg-indigo-50 text-indigo-900 border-indigo-100"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {questionOpinions[question.id]?.message}
                  </div>
                )}
                {isMissing && (
                  <div className="text-xs text-rose-600">
                    Please provide an answer before moving on.
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {questions.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-700">
          Your prompt was detailed enough that we can generate suggestions immediately.
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Review your project brief</h3>
        <p className="text-sm text-gray-600 mt-1">
          We&apos;ll use this context to generate starter nodes aligned with your strategy.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Name your workspace</h4>
            <p className="text-xs text-slate-500">Pick a name we can apply to the center node and saved workspace. You can tweak it anytime.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-slate-600 hover:text-indigo-600"
            onClick={handleShuffleNames}
            disabled={nameOptions.length === 0}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Shuffle names
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {nameOptions.map((option) => {
            const isSelected = !isCustomName && workspaceNameChoice === option;
            return (
              <Button
                key={option}
                type="button"
                variant={isSelected ? "default" : "outline"}
                onClick={() => {
                  setWorkspaceNameChoice(option);
                  setIsCustomName(false);
                }}
                className={`h-10 justify-between text-sm transition-all ${
                  isSelected
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "border-slate-200 text-slate-700 hover:bg-indigo-50"
                }`}
              >
                <span>{option}</span>
                {isSelected && <Check className="w-4 h-4" />}
              </Button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="workspace-name" className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Prefer to tailor it?
          </Label>
          <Input
            id="workspace-name"
            value={workspaceNameChoice}
            onChange={(event) => {
              setWorkspaceNameChoice(event.target.value);
              setIsCustomName(true);
            }}
            placeholder="Name your workspace"
            className="h-10 border-indigo-100 focus-visible:ring-indigo-300"
          />
          <p className="text-[11px] text-slate-500">We&apos;ll use this for the center node title and saved workspace name.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
          <h4 className="text-sm font-semibold text-indigo-900 mb-3">Prompt summary</h4>
          <p className="text-sm text-indigo-900 leading-relaxed">{summary}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Key answers</h4>
          {questions.length === 0 && (
            <p className="text-sm text-slate-600">
              No extra questions were required for this prompt.
            </p>
          )}
          <div className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {question.prompt}
                </div>
                <div className="text-sm text-slate-700 leading-relaxed break-words">
                  {answers[question.id] ? answers[question.id] : <span className="italic text-slate-400">Skipped</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {prefetchedKnowledge && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-amber-700" />
            Referenced guidance
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{prefetchedKnowledge.summary}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">AI Blueprint</h4>
            <p className="text-xs text-slate-500">
              Generate a starter layout tailored to your goals and answers.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700">
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking
              </span>
            ) : (
              <>
                Generate starter nodes
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-3 text-sm text-rose-600 border border-rose-200 bg-rose-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-emerald-800">Suggested starting nodes</h4>
              <p className="text-xs text-emerald-700">
                Review and send them to the canvas to kickstart your workspace.
              </p>
            </div>
            <Button
              variant="secondary"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => handleAcceptSuggestions(suggestions)}
            >
              Add all to canvas
            </Button>
          </div>

          <div className="grid gap-3">
            {suggestions.map((suggestion) => (
              <div
                key={`${suggestion.id ?? suggestion.label}-${suggestion.label}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{suggestion.label}</div>
                  {suggestion.summary && (
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{suggestion.summary}</div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-slate-400">
                    {suggestion.domain && <span>{suggestion.domain}</span>}
                    {typeof suggestion.ring === "number" && <span>Ring {suggestion.ring}</span>}
                    <span>{suggestion.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleAcceptSuggestions([suggestion], suggestion.id)}
                  >
                    Add node
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "idea":
        return renderIdeaStep();
      case "summary":
        return renderSummaryStep();
      case "questions":
        return renderQuestionsStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  const showBackButton = stepIndex > 0;

  const renderFooter = () => {
    if (step === "review") {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {suggestions.length > 0
              ? "Accept individual nodes or add them all to begin designing."
              : "Generate whenever you are ready. You can always come back and refine the brief."}
          </div>
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button variant="ghost" onClick={handleBack} className="gap-1 text-slate-600">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          {isAnalyzingPrompt && step === "idea"
            ? "Reviewing your prompt to tailor the discovery questions."
            : getStepDescription(step)}
        </div>
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button variant="ghost" onClick={handleBack} className="gap-1 text-slate-600">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {step === "idea" && (
            <Button
              onClick={handleIdeaContinue}
              disabled={idea.trim().length === 0 || isAnalyzingPrompt}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {isAnalyzingPrompt ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </span>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
          {step === "summary" && (
            <Button
              onClick={handleSummaryContinue}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              disabled={isAnalyzingPrompt}
            >
              {questions.length > 0 ? "Start Q&A" : "Skip to review"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {step === "questions" && (
            <Button
              onClick={handleQuestionsContinue}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Review blueprint
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[calc(100vh-3rem)] p-0 border-0 bg-transparent shadow-none sm:max-w-4xl">
        <div className="flex h-full max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-2xl">
          <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-500/10 via-white to-purple-500/10 px-8 py-5">
            <DialogHeader className="text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-600/90 text-white p-2.5 shadow-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-semibold text-gray-900">
                      FlowForge AI Blueprint Wizard
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                      Capture the strategy, gather clarifiers, and generate a domain-aware starting layout.
                    </DialogDescription>
                  </div>
                </div>
                <div className="hidden text-xs font-medium text-indigo-600 md:block">
                  Step {stepIndex + 1} of {STEP_ORDER.length}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {STEP_ORDER.map((wizardStep, index) => {
                  const isActive = wizardStep === step;
                  const isComplete = index < stepIndex;
                  return (
                    <div
                      key={wizardStep}
                      className={`flex-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600"
                          : isComplete
                            ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                            : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 capitalize">
                        {isComplete ? <Check className="w-3 h-3" /> : null}
                        {getStepLabel(wizardStep)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 overflow-hidden max-h-full">
            <div className="px-8 py-6 space-y-6">
              {renderStep()}
            </div>
          </ScrollArea>

          <div className="border-t border-slate-200 bg-slate-50 px-8 py-4">
            {renderFooter()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
