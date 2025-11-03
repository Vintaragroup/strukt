import { THEME_CONFIG_BY_ID, THEME_INDEX, type ThemeConfig, type ThemeId } from "./themeIndex";

export type WizardQuestionOption = {
  value: string;
  label: string;
};

export type WizardQuestion = {
  id: string;
  category: "business" | "product" | "tech";
  prompt: string;
  type: "text" | "select";
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: WizardQuestionOption[];
};

const BUSINESS_CORE: WizardQuestion[] = [
  {
    id: "success_metric",
    category: "business",
    prompt: "What does success look like for this initiative?",
    type: "text",
    required: true,
    placeholder: "e.g., Reach 5k active users in 90 days",
    helperText: "Helps the AI focus on outcomes that matter to you.",
  },
  {
    id: "primary_audience",
    category: "business",
    prompt: "Who is the primary audience for this product?",
    type: "select",
    options: [
      { value: "internal_teams", label: "Internal teams" },
      { value: "customers", label: "Customers / end-users" },
      { value: "partners", label: "Partners / integrators" },
      { value: "mixed", label: "A mix of the above" },
    ],
    required: true,
    helperText: "Knowing the audience shapes recommendations for onboarding and docs.",
  },
];

const PRODUCT_CORE: WizardQuestion[] = [
  {
    id: "core_journey",
    category: "product",
    prompt: "What is the must-have user journey for the first release?",
    type: "text",
    required: true,
    placeholder: "Describe the single flow that must work on day one.",
  },
  {
    id: "differentiator",
    category: "product",
    prompt: "What should make this product feel different or special?",
    type: "text",
    placeholder: "Optional but useful for tailoring AI suggestions.",
  },
];

const TECH_CORE: WizardQuestion[] = [
  {
    id: "tech_preferences",
    category: "tech",
    prompt: "Are there preferred platforms, languages, or tools?",
    type: "text",
    placeholder: "e.g., React frontend, Node.js backend, AWS infrastructure",
  },
  {
    id: "integration_needs",
    category: "tech",
    prompt: "Do you need to integrate with existing systems or data sources?",
    type: "text",
    placeholder: "List critical integrations or data feeds.",
  },
];

const CORE_POOLS = [BUSINESS_CORE, PRODUCT_CORE, TECH_CORE] as const;
const CORE_LOOKUP = new Map<string, WizardQuestion>();
CORE_POOLS.forEach((pool) => {
  pool.forEach((question) => CORE_LOOKUP.set(question.id, question));
});

const OPTIONAL_POOL: WizardQuestion[] = [
  {
    id: "timeline",
    category: "business",
    prompt: "Do you have a target launch date or milestone?",
    type: "text",
    placeholder: "Share timing or milestone pressure (if any).",
  },
  {
    id: "budget_constraints",
    category: "business",
    prompt: "Are there notable budget or team constraints we should consider?",
    type: "text",
    placeholder: "Mention bandwidth, budget, or hiring concerns.",
  },
  {
    id: "compliance",
    category: "product",
    prompt: "Are there compliance, security, or privacy requirements?",
    type: "text",
    placeholder: "e.g., GDPR, HIPAA, SOC2, data residency needs.",
  },
  {
    id: "growth_channels",
    category: "business",
    prompt: "How do you plan to acquire or activate users in the beginning?",
    type: "text",
    placeholder: "Marketing or activation ideas help shape support tooling.",
  },
  {
    id: "ai_training",
    category: "tech",
    prompt: "What data or expertise will power AI or automation features?",
    type: "text",
    placeholder: "Share datasets, SMEs, or feedback loops that will train the system.",
  },
  {
    id: "data_strategy",
    category: "tech",
    prompt: "What telemetry or data sources do we need instrumented from day one?",
    type: "text",
    placeholder: "List analytics, KPIs, or logs required to prove value.",
  },
  {
    id: "change_management",
    category: "business",
    prompt: "What rollout or change management support will users need?",
    type: "text",
    placeholder: "Consider training, communication plans, and success milestones.",
  },
  {
    id: "experience_tone",
    category: "product",
    prompt: "What should the experience feel like for your audience?",
    type: "text",
    placeholder: "Describe tone, visual style, and emotional cues (e.g., playful retro arcade that celebrates wins).",
  },
  {
    id: "habit_strategy",
    category: "business",
    prompt: "How will you reinforce positive habits or behaviour change?",
    type: "text",
    placeholder: "Explain streaks, challenges, social accountability, or other reinforcement loops.",
  },
  {
    id: "telemetry_focus",
    category: "tech",
    prompt: "Which metrics will prove this experience is working?",
    type: "text",
    placeholder: "Outline core KPIs, dashboards, or logs you want to track.",
  },
  {
    id: "integration_targets",
    category: "tech",
    prompt: "Which tools or workflows must this plug into on day one?",
    type: "text",
    placeholder: "Mention calendar, IDE, chat, or ticketing systems your team lives in.",
  },
  {
    id: "clinical_safeguards",
    category: "product",
    prompt: "What clinical or patient safety safeguards must stay in place?",
    type: "text",
    placeholder: "List escalation protocols, approval workflows, or audit trails clinicians expect.",
  },
  {
    id: "regulatory_reporting",
    category: "business",
    prompt: "Which regulatory or audit reports do you need to produce?",
    type: "text",
    placeholder: "e.g., SOC 1/2, PCI, MiFID II, billing codes, adverse event submissions.",
  },
  {
    id: "revenue_model",
    category: "business",
    prompt: "How will this experience drive revenue or cost savings?",
    type: "text",
    placeholder: "Describe subscription tiers, usage-based pricing, commissions, or efficiency wins.",
  },
  {
    id: "learning_outcomes",
    category: "product",
    prompt: "What learning or behaviour change outcomes do you want to see?",
    type: "text",
    placeholder: "Define the knowledge, skill, or habit shifts you need to measure.",
  },
  {
    id: "content_strategy",
    category: "product",
    prompt: "What core content or curriculum powers the experience?",
    type: "text",
    placeholder: "Describe lesson structures, media formats, or expert contributors.",
  },
  {
    id: "merchant_supply",
    category: "business",
    prompt: "How will you build and sustain supply-side participation?",
    type: "text",
    placeholder: "Explain onboarding flows, incentives, vetting, or inventory management.",
  },
  {
    id: "conversion_strategy",
    category: "business",
    prompt: "What conversion or retention levers matter most?",
    type: "text",
    placeholder: "Think trials, discounts, loyalty, bundles, or referral loops.",
  },
];

const ALL_QUESTIONS = [...BUSINESS_CORE, ...PRODUCT_CORE, ...TECH_CORE, ...OPTIONAL_POOL];
const OPTIONAL_LOOKUP = new Map<string, WizardQuestion>(
  OPTIONAL_POOL.map((question) => [question.id, question])
);
const QUESTION_IDS = new Set(ALL_QUESTIONS.map((question) => question.id));

const QUESTION_PRIORITY: Record<string, number> = {
  ai_training: 32,
  clinical_safeguards: 30,
  regulatory_reporting: 28,
  revenue_model: 26,
  learning_outcomes: 24,
  content_strategy: 22,
  merchant_supply: 20,
  conversion_strategy: 18,
  data_strategy: 17,
  experience_tone: 16,
  habit_strategy: 14,
  telemetry_focus: 12,
  integration_targets: 10,
  change_management: 8,
  growth_channels: 6,
  timeline: 4,
};

function computePromptRichness(prompt: string): number {
  const text = prompt.trim();
  if (!text) return 0;

  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const keywordMatches = text.match(/\b(ai|ml|api|react|node|marketplace|subscription|b2b|mobile|dashboard|integration)\b/gi)?.length ?? 0;

  const lengthScore = Math.min(wordCount / 80, 1);
  const sentenceScore = Math.min(sentenceCount / 5, 1);
  const keywordScore = Math.min(keywordMatches / 4, 1);

  return (lengthScore * 0.5 + sentenceScore * 0.2 + keywordScore * 0.3);
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(", ")}, and ${last}`;
}

type PromptTheme = ThemeId;

type ThemeMetadata = {
  labels: string[];
  toneWords: string[];
  voiceSnippets: string[];
};

export type PromptAnalysis = {
  richness: number;
  themes: PromptTheme[];
  recommendedQuestionIds: string[];
};

type ThemeRule = {
  theme: PromptTheme;
  regexes: RegExp[];
  recommendedQuestions: string[];
};

export function validateThemeIndex(
  themeIndex: readonly ThemeConfig[],
  questionIds: ReadonlySet<string> = QUESTION_IDS
): void {
  const errors: string[] = [];
  const seen = new Set<string>();

  themeIndex.forEach((config) => {
    if (seen.has(config.id)) {
      errors.push(`Theme "${config.id}" is defined more than once.`);
    } else {
      seen.add(config.id);
    }

    if (!config.patterns || config.patterns.length === 0) {
      errors.push(`Theme "${config.id}" must provide at least one detection pattern.`);
    }

    const referencedQuestions = new Set([
      ...config.recommendedQuestionIds,
      ...(config.criticalQuestionIds ?? []),
    ]);

    referencedQuestions.forEach((questionId) => {
      if (!questionIds.has(questionId)) {
        errors.push(`Theme "${config.id}" references unknown question "${questionId}".`);
      }
    });
  });

  if (errors.length > 0) {
    throw new Error(`Theme index validation failed:\n - ${errors.join("\n - ")}`);
  }
}

validateThemeIndex(THEME_INDEX);

const THEME_RULES: ThemeRule[] = THEME_INDEX.map((config) => {
  return {
    theme: config.id,
    regexes: config.patterns.map((pattern) => new RegExp(pattern, "i")),
    recommendedQuestions: Array.from(
      new Set([
        ...config.recommendedQuestionIds,
        ...(config.criticalQuestionIds ?? []),
      ])
    ),
  };
});

function collectThemeMetadata(analysis?: PromptAnalysis): ThemeMetadata {
  const labels = new Set<string>();
  const toneWords = new Set<string>();
  const voiceSnippets: string[] = [];

  if (analysis) {
    for (const theme of analysis.themes) {
      const config = THEME_CONFIG_BY_ID.get(theme);
      if (!config) continue;

      if (config.personaLabel) {
        labels.add(config.personaLabel);
      }
      if (config.toneDescriptors) {
        config.toneDescriptors.forEach((tone) => toneWords.add(tone));
      }
      if (config.voiceSnippets) {
        voiceSnippets.push(...config.voiceSnippets);
      }
    }
  }

  return {
    labels: Array.from(labels),
    toneWords: Array.from(toneWords),
    voiceSnippets,
  };
}

function analyzePrompt(prompt: string): PromptAnalysis {
  const text = prompt.trim();
  const richness = computePromptRichness(text);
  const themes: PromptTheme[] = [];
  const recommendedQuestionIds = new Set<string>();

  for (const rule of THEME_RULES) {
    if (rule.regexes.some((regex) => regex.test(text))) {
      themes.push(rule.theme);
      rule.recommendedQuestions.forEach((id) => recommendedQuestionIds.add(id));
    }
  }

  // Ensure we always consider at least one optional prompt if no themes detected
  if (themes.length === 0) {
    if (richness < 0.35) {
      recommendedQuestionIds.add("timeline");
      recommendedQuestionIds.add("growth_channels");
    } else if (richness < 0.65) {
      recommendedQuestionIds.add("data_strategy");
    }
  }

  return {
    richness,
    themes,
    recommendedQuestionIds: Array.from(recommendedQuestionIds),
  };
}

function pickFromPool(pool: WizardQuestion[], usedIds: Set<string>): WizardQuestion | undefined {
  return pool.find((question) => !usedIds.has(question.id));
}

function selectQuestionsFromAnalysis(
  prompt: string,
  analysis: PromptAnalysis,
  minimum = 3,
  maximum = 5
): WizardQuestion[] {
  const richness = analysis.richness;

  let targetCount = minimum;
  if (richness < 0.35) targetCount = maximum;
  else if (richness < 0.65) targetCount = Math.min(maximum, minimum + 1);

  const selected: WizardQuestion[] = [];
  const usedIds = new Set<string>();

  const pools = [BUSINESS_CORE, PRODUCT_CORE, TECH_CORE];
  for (const pool of pools) {
    const question = pickFromPool(pool, usedIds);
    if (question) {
      selected.push(question);
      usedIds.add(question.id);
    }
  }

  let optionalPool = [...OPTIONAL_POOL];

  const recommendedOptional = analysis.recommendedQuestionIds
    .map((id) => OPTIONAL_LOOKUP.get(id))
    .filter((question): question is WizardQuestion => Boolean(question));

  const uniqueRecommendedOptional = recommendedOptional.filter(
    (question, index) =>
      recommendedOptional.findIndex((candidate) => candidate?.id === question.id) === index
  );

  const optionalAdds = uniqueRecommendedOptional
    .filter((question) => !usedIds.has(question.id))
    .sort((a, b) => (QUESTION_PRIORITY[b.id] ?? 0) - (QUESTION_PRIORITY[a.id] ?? 0));

  if (optionalAdds.length > 0) {
    targetCount = Math.min(maximum, Math.max(targetCount, selected.length + optionalAdds.length));
  }

  for (const question of optionalAdds) {
    if (selected.length >= targetCount) break;
    selected.push(question);
    usedIds.add(question.id);
  }

  if (analysis.themes.length === 0) {
    const defaultFallback = ["timeline", "growth_channels"].map((id) => OPTIONAL_LOOKUP.get(id)).filter(Boolean) as WizardQuestion[];
    if (defaultFallback.length > 0) {
      targetCount = Math.min(maximum, Math.max(targetCount, selected.length + defaultFallback.length));
    }
    for (const question of defaultFallback) {
      if (selected.length >= targetCount || usedIds.has(question.id)) continue;
      selected.push(question);
      usedIds.add(question.id);
    }
  }

  optionalPool = optionalPool.filter((question) => !usedIds.has(question.id));

  while (selected.length < targetCount) {
    const q = pickFromPool(optionalPool, usedIds);
    if (!q) break;
    selected.push(q);
    usedIds.add(q.id);
  }

  return selected;
}

export function selectWizardQuestions(prompt: string, minimum = 3, maximum = 5): WizardQuestion[] {
  const analysis = analyzePrompt(prompt);
  return selectQuestionsFromAnalysis(prompt, analysis, minimum, maximum);
}

export function buildPromptSummary(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "";

  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  const candidate = sentences[0];

  if (candidate.length <= 180) return candidate;
  return trimmed.slice(0, 180).trimEnd() + "…";
}

function buildEnhancedSummary(prompt: string, analysis: PromptAnalysis): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const sentences: string[] = [];

  const lead = buildPromptSummary(trimmed);
  sentences.push(lead.endsWith(".") ? lead : `${lead}.`);

  const highlights: string[] = [];

  if (/retro|nostalgic|pixel|arcade/.test(lower)) {
    highlights.push("retro-inspired visuals and playful feedback cues that make progress feel nostalgic yet motivating");
  }
  if (/timer|countdown|timebox|pomodoro/.test(lower)) {
    highlights.push("tight time-boxing mechanics, visual countdown states, and completed-run history to keep developers on track");
  }
  if (/gamif|achievement|streak/.test(lower)) {
    highlights.push("gamified reinforcement loops such as streaks, achievements, and team challenges");
  }
  if (/developer|engineer|dev/.test(lower)) {
    highlights.push("fit with common developer rituals—from stand-ups to code-review focus sessions");
  }

  const highlightSeen = new Set<string>();
  for (const theme of analysis.themes) {
    const highlight = THEME_CONFIG_BY_ID.get(theme)?.summaryHighlight;
    if (highlight && !highlightSeen.has(highlight)) {
      highlightSeen.add(highlight);
      highlights.push(highlight);
    }
  }

  if (highlights.length > 0) {
    const uniqueHighlights = Array.from(new Set(highlights));
    if (uniqueHighlights.length === 1) {
      sentences.push(`We’ll emphasise ${uniqueHighlights[0]}.`);
    } else {
      const last = uniqueHighlights.pop();
      sentences.push(`We’ll emphasise ${uniqueHighlights.join(", ")}, and ${last}.`);
    }
  }

  const focusAreas: string[] = [];
  const focusSeen = new Set<string>();
  for (const theme of analysis.themes) {
    const config = THEME_CONFIG_BY_ID.get(theme);
    if (!config?.focusAreas) continue;
    for (const area of config.focusAreas) {
      if (!focusSeen.has(area)) {
        focusSeen.add(area);
        focusAreas.push(area);
      }
    }
  }

  if (focusAreas.length > 0) {
    const last = focusAreas.pop();
    sentences.push(`Expect the follow-up questions to cover ${focusAreas.length ? focusAreas.join(", ") + ", and " : ""}${last}.`);
  }

  const metadata = collectThemeMetadata(analysis);

  if (metadata.labels.length > 0) {
    sentences.push(`We’re tuning this for ${formatList(metadata.labels)}.`);
  }

  if (metadata.toneWords.length > 0) {
    sentences.push(`Tone stays ${formatList(metadata.toneWords)}.`);
  }

  const voiceSnippet = metadata.voiceSnippets[0];
  if (voiceSnippet) {
    sentences.push(voiceSnippet.endsWith(".") ? voiceSnippet : `${voiceSnippet}.`);
  }

  return sentences.join(" ");
}

export function getQuestionById(id: string): WizardQuestion | undefined {
  return ALL_QUESTIONS.find((question) => question.id === id);
}

type OpinionContext = {
  prompt: string;
  answers: Record<string, string | undefined>;
  summary?: string;
  analysis?: PromptAnalysis;
  iteration?: number;
  previousSuggestion?: string;
};

type PromptFlair = {
  isRetro: boolean;
  hasTimer: boolean;
  isGamified: boolean;
  targetsDevelopers: boolean;
  mentionsFocus: boolean;
  mentionsIntegration: boolean;
  isMorningRitual: boolean;
  isWellness: boolean;
  isJournal: boolean;
  isCulinary: boolean;
  mentionsFamily: boolean;
};

function derivePromptFlair(prompt: string, analysis?: PromptAnalysis): PromptFlair {
  const lower = prompt.toLowerCase();
  return {
    isRetro: /retro|nostalgic|pixel|arcade/.test(lower),
    hasTimer: /timer|countdown|timebox|clock|pomodoro/.test(lower),
    isGamified: /gamif|streak|achievement|quest/.test(lower) || analysis?.themes.includes("productivity") || false,
    targetsDevelopers: /developer|engineer|dev team/.test(lower),
    mentionsFocus: /focus|flow|concentration|on task/.test(lower),
    mentionsIntegration: /slack|jira|github|vs code|calendar|integration/.test(lower) || analysis?.themes.includes("integration") || false,
    isMorningRitual: /morning|sunrise|wake[-\s]?up|daybreak|coffee/.test(lower),
    isWellness: /wellness|mindful|mindfulness|meditation|gratitude|self-care|breathwork|calm|soothe|reflective/.test(lower) || analysis?.themes.includes("wellness") || false,
    isJournal: /journal|journaling|diary|logbook|reflection|prompt/.test(lower),
    isCulinary: /cook|cooking|kitchen|recipe|meal|dinner|lunch|breakfast|pantry|ingredient|ingredients|chef|culinary|food|supper/.test(lower) || analysis?.themes.includes("culinary") || false,
    mentionsFamily: /family|kids|children|parents|mom|mother|dad|father|caregiver/.test(lower),
  };
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

function startsWithVerb(text: string): boolean {
  return /\b(build|create|launch|design|measure|track|improve|increase|reduce|prototype|ship|onboard|research)\b/i.test(
    text
  );
}

function wrapWithConfidence(statement: string): string {
  const trimmed = statement.trim();
  if (!trimmed) return "I'd align on one or two specifics so we know when this is working.";
  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

function wrapWithQuestion(statement: string): string {
  const trimmed = statement.trim();
  if (!trimmed) return "What outcome would prove this is working for everyone involved?";
  if (trimmed.endsWith("?")) return trimmed;
  return `${trimmed}?`;
}

function ensureQuestion(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (trimmed.endsWith("?") || trimmed.includes("?")) return trimmed;
  if (trimmed.endsWith(".")) {
    return `${trimmed.slice(0, -1)}?`;
  }
  return `${trimmed}?`;
}

const QUESTION_OPINION_BUILDERS: Record<
  string,
  (question: WizardQuestion, context: OpinionContext, answer: string) => string
> = {
  success_metric: (_question, context, answer) => {
    if (answer) {
      const hasMetric = hasNumber(answer);
      const extra = hasMetric
        ? "Pair it with a leading signal (activation, engagement, or sentiment) so you can spot drift before the target slips."
        : "Try translating that into one measurable figure so the team knows when to celebrate.";
      return wrapWithConfidence(
        `That metric sets a clear finish line. ${extra}`
      );
    }

    const audience = context.answers.primary_audience;
    const sampleAudience = audience ? audience : "target users";
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    const metadata = collectThemeMetadata(context.analysis);
    const personaPhrase = metadata.labels.length
      ? formatList(metadata.labels)
      : sampleAudience;

    let targetClause: string;
    if (themes.includes("healthcare") || themes.includes("compliance") || themes.includes("finance")) {
      targetClause =
        "a 99% clean-claim rate, denials cleared within 48 hours, and audit exceptions below 0.5% while protecting reviewer wellbeing";
    } else if (themes.includes("ai")) {
      targetClause =
        "a 60% reduction in repetitive work within 90 days while keeping human override below 10%";
    } else if (themes.includes("go_to_market")) {
      targetClause =
        "30% of early adopters converting to paid plans in the first quarter with churn under 5%";
    } else if (themes.includes("internal_enablement")) {
      targetClause =
        `75% weekly active ${sampleAudience} and a 20% lift in satisfaction across the pilot cohort`;
    } else if (themes.includes("culinary") || flair.isCulinary) {
      targetClause =
        "four weeknight meals prepared in under 30 minutes, 90% family delight scores, and 20% less food waste";
    } else if (themes.includes("wellness")) {
      targetClause =
        "five gratitude logs a week, a 25% lift in mood scores, and half the stress check-ins within two months";
    } else if (flair.hasTimer || flair.isGamified) {
      targetClause =
        "an 85% completion rate on planned focus runs, 10-day streaks, and a 15% bump in morale";
    } else {
      targetClause =
        `500 engaged ${sampleAudience} within 90 days and retention above 40%`;
    }

    return wrapWithQuestion(
      `Would anchoring on ${targetClause} give ${personaPhrase} confidence that this initiative is winning`
    );
  },
  primary_audience: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Great—focus on ${answer}. Make sure every early release artefact (messaging, onboarding, success metrics) speaks directly to them.`
      );
    }
    const promptSummary = context.summary || buildPromptSummary(context.prompt);
    const themes = context.analysis?.themes ?? [];
    if (themes.includes("internal_enablement")) {
      return wrapWithConfidence(
        `I'd lock in which internal champions own “${promptSummary}”—usually team leads and enablement managers. Align success metrics around their workflows.`
      );
    }
    if (themes.includes("wellness")) {
      return wrapWithConfidence(
        "Focus on the humans you’re supporting—stressed professionals, caregivers, or students—and tune prompts to their emotional cadence."
      );
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.labels.length > 0) {
      return wrapWithConfidence(
        `Zero in on ${formatList(metadata.labels)} so we can mirror their pressures, motivations, and trust signals.`
      );
    }
    return wrapWithConfidence(
      `I'd lock in who feels the pain you described${
        promptSummary ? ` (“${promptSummary}”)` : ""
      }. Decide if you want to win internal champions first or go straight to customers, then tailor everything else accordingly.`
    );
  },
  core_journey: (_question, context, answer) => {
    if (answer) {
      const actionable = startsWithVerb(answer)
        ? answer
        : `Get a user to ${answer}`;
      return wrapWithConfidence(
        `Treat “${actionable}” as the non-negotiable path. Map every screen and dependency to remove friction from that journey.`
      );
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    const themes = context.analysis?.themes ?? [];
    const metadata = collectThemeMetadata(context.analysis);
    const personaPhrase = metadata.labels.length ? formatList(metadata.labels) : "your users";
    if (themes.includes("healthcare") || themes.includes("compliance") || themes.includes("finance")) {
      return wrapWithQuestion(
        `Should the calm-claim ritual surface prioritized work with wellbeing check-ins, guide compliant reconciliation with payer context, and finish with restorative debriefs plus logged clean-claim wins for ${personaPhrase}`
      );
    }
    if (flair.hasTimer || flair.isGamified) {
      return wrapWithQuestion(
        `Would mapping the treasure-hunt moment—retro timer, immersive cues, celebratory win—help ${personaPhrase} stay immersed through the core journey`
      );
    }
    if (flair.isCulinary) {
      return wrapWithQuestion(
        "Could we choreograph the pantry-to-plate sprint so a caregiver drops ingredients, gets a dinner match, and logs the family’s rating for next time"
      );
    }
    if (flair.isWellness || flair.isJournal || context.analysis?.themes.includes("wellness")) {
      return wrapWithQuestion(
        "Should the flow guide users from a gentle prompt to a gratitude entry, highlight their insight, and close with a calming affirmation to revisit later"
      );
    }
    return wrapWithQuestion(
      `Can you sketch the single ‘aha’ experience—entry, main action, response, and follow-up—in a way ${personaPhrase} can execute without friction`
    );
  },
  differentiator: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Lean into that edge: bake it into demos, storytelling, and your backlog. Make sure it shows up in the first release.`
      );
    }
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (themes.includes("ai")) {
      return wrapWithConfidence(
        "Highlight how human-in-the-loop oversight and transparent reasoning set you apart from black-box competitors."
      );
    }
    if (flair.isRetro || flair.isGamified) {
      return wrapWithConfidence(
        "Lean into the nostalgic arcadesque feel—make the countdown feel like beating a level and celebrate wins with 8-bit flair no competitor offers."
      );
    }
    if (themes.includes("culinary") || flair.isCulinary) {
      return wrapWithConfidence(
        "Own the pantry-whisperer superpower—instant ingredient swaps, zero-waste rewards, and family feedback loops generic recipe apps can’t match."
      );
    }
    if (flair.isWellness || flair.isJournal) {
      return wrapWithConfidence(
        "Highlight your emotional craftsmanship—a sanctuary with empathetic prompts, mindful reflections, and rituals that make gratitude addictive."
      );
    }
    return wrapWithConfidence(
      "Call out one trait that competitors can’t copy overnight—tone, data advantage, or workflow insight. It helps the AI prioritise supporting nodes."
    );
  },
  tech_preferences: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Those preferences give us guardrails. Capture any integration constraints next so the blueprint stays feasible.`
      );
    }
    const hint = context.answers.integration_needs
      ? "Especially because you already noted integration work."
      : "Even a rough stack (React vs. native, AWS vs. Azure) keeps future recommendations aligned.";
    return wrapWithConfidence(
      `Flag your must-use platforms early. ${hint}`
    );
  },
  integration_needs: (_question, _context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Perfect—treat those systems as first-class citizens when we pick domains and dependencies.`
      );
    }
    return wrapWithConfidence(
      "List the critical APIs or data sources. It prevents surprises later when we design relationships."
    );
  },
  timeline: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Align the roadmap and milestones with that timeline so scope decisions stay grounded.`
      );
    }
    const themes = context.analysis?.themes ?? [];
    if (themes.includes("go_to_market")) {
      return wrapWithConfidence(
        "Anchor the launch to your GTM push—pilot, beta, and GA—so we can map marketing and enablement alongside delivery."
      );
    }
    if (themes.includes("internal_enablement")) {
      return wrapWithConfidence(
        "Even a rough pilot date helps us stage training waves and rollout communications."
      );
    }
    return wrapWithConfidence(
      "Add even a loose target (quarter, launch event) so the AI can emphasise sequencing and de-risking."
    );
  },
  budget_constraints: (_question, _context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Keep that constraint visible; it should influence node sizing and prioritisation.`
      );
    }
    return wrapWithConfidence(
      "If you surface budget or team limits, we can lean towards reusable components and staged rollouts."
    );
  },
  compliance: (_question, _context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Build those requirements into the foundation so security and privacy aren’t afterthoughts.`
      );
    }
    return wrapWithConfidence(
      "Call out any regulatory or security expectations now. It changes how we design data flows and documentation."
    );
  },
  growth_channels: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        `Fantastic—align analytics and engagement loops so they reinforce that channel.`
      );
    }
    const themes = context.analysis?.themes ?? [];
    if (themes.includes("go_to_market")) {
      return wrapWithConfidence(
        "Even a rough GTM hypothesis (content, community, paid) helps us wire the analytics and engagement nodes properly."
      );
    }
    return wrapWithConfidence(
      "Even a guess (community, paid ads, partner integrations) helps shape onboarding and telemetry nodes."
    );
  },
  ai_training: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Great—treat that as the canonical source for model tuning and feedback loops."
      );
    }
    return wrapWithConfidence(
      "Even a rough data inventory helps us design collection, labelling, and human review nodes the right way."
    );
  },
  data_strategy: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Perfect—make sure dashboards and alerting tap into those signals from day one."
      );
    }
    return wrapWithConfidence(
      "List the metrics that prove this is working so we can wire telemetry and health checks into the blueprint."
    );
  },
  change_management: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Bake that enablement plan into launch to keep adoption high and surprises low."
      );
    }
    return wrapWithConfidence(
      "Outline how you’ll train, communicate, and support stakeholders so we add the right rollout nodes."
    );
  },
  experience_tone: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Great—let’s ensure the UI, copy, and celebrations echo that experience from the first release."
      );
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (flair.isMorningRitual) {
      return wrapWithConfidence(
        "Imagine a sunrise ritual—soft gradients, gentle chimes, and language that feels like a personal coach brewing the first cup of ambition."
      );
    }
    if (flair.isCulinary) {
      const familyCue = flair.mentionsFamily ? "family " : "";
      return wrapWithConfidence(
        `Lean into a cozy ${familyCue}kitchen vibe—warm lighting, playful sizzling cues, and encouraging copy that celebrates pantry wins in minutes.`
      );
    }
    if (flair.isRetro) {
      return wrapWithConfidence(
        "Lean into neon palettes, arcade soundscapes, and celebratory copy so each focus sprint feels like beating a level."
      );
    }
    if (flair.isGamified) {
      return wrapWithConfidence(
        "Dial up playful tension—countdowns, dynamic lighting, and announcer-style microcopy that makes progress feel epic."
      );
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.toneWords.length > 0) {
      return wrapWithConfidence(
        `Lean into a tone that stays ${formatList(metadata.toneWords)} so every interaction feels natural to your audience.`
      );
    }
    return wrapWithConfidence(
      "Paint the mood for me—calming spa, competitive arena, friendly cheer squad—so UI, sound, and copy dance to the same beat."
    );
  },
  habit_strategy: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Perfect—those reinforcement loops should become first-class features in the plan."
      );
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (flair.isCulinary) {
      return wrapWithConfidence(
        "Map weekly pantry check-ins, leftover remix challenges, and surprise badges for zero-waste nights so busy families keep coming back."
      );
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.labels.length > 0) {
      return wrapWithConfidence(
        `Design reinforcement loops that honour ${formatList(metadata.labels)}—celebrate their wins, cushion setbacks, and make consistency feel achievable.`
      );
    }
    return wrapWithConfidence(
      "Spell out streak rules, team challenges, or social accountability so the blueprint keeps developers coming back."
    );
  },
  telemetry_focus: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Excellent—those metrics can underpin dashboards and retro reviews."
      );
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (flair.isCulinary) {
      return wrapWithConfidence(
        "Track meal match speed, repeat-hit rate, family delight scores, and food-waste reduction so we can celebrate kitchen wins with confidence."
      );
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.labels.length > 0) {
      return wrapWithConfidence(
        `Capture the signals that reassure ${formatList(metadata.labels)}—confidence gains, risk reductions, and proof that the experience actually fits their world.`
      );
    }
    return wrapWithConfidence(
      "List the signals that prove success—timer completion rate, streak health, energy levels—so we wire them in from day one."
    );
  },
  integration_targets: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Noted—we’ll map the must-have connectors so adoption fits existing workflows."
      );
    }
    return wrapWithConfidence(
      "Call out the tools developers live in (Slack, VS Code, Jira) so we put integrations in the first cut."
    );
  },
  clinical_safeguards: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Excellent—let’s embed those safeguards into every workflow so clinicians can trust the system."
      );
    }
    return wrapWithConfidence(
      "Outline required approvals, escalation paths, and audit logs so patient safety stays front and centre."
    );
  },
  regulatory_reporting: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Great—those obligations will guide our data retention and automation roadmap."
      );
    }
    return wrapWithConfidence(
      "List the filings or attestations you owe (SOC, PCI, claims) so we capture the right evidence."
    );
  },
  revenue_model: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Perfect—now every roadmap bet can ladder up to that monetisation plan."
      );
    }
    return wrapWithConfidence(
      "Clarify how this experience drives revenue or savings so we prioritise accordingly."
    );
  },
  learning_outcomes: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Great—assessments and feedback loops will reinforce those learner outcomes."
      );
    }
    return wrapWithConfidence(
      "Describe the knowledge or behaviour shift you expect so content and analytics stay focused."
    );
  },
  content_strategy: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Excellent—authoring and review flows will mirror that content backbone."
      );
    }
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (themes.includes("education")) {
      return wrapWithConfidence(
        "Explain the curriculum spine—formats, cadence, and expert reviewers so we can build the right authoring workflow."
      );
    }
    if (themes.includes("culinary") || flair.isCulinary) {
      return wrapWithConfidence(
        "Spell out your recipe sources, dietary filters, and pantry-swap rules so the AI stays trustworthy night after night."
      );
    }
    return wrapWithConfidence(
      "Explain the curriculum spine—formats, cadence, SMEs—so we know what infrastructure to build."
    );
  },
  merchant_supply: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Great—onboarding and incentives will keep your supply vibrant."
      );
    }
    return wrapWithConfidence(
      "Tell me how you’ll recruit, vet, and retain sellers so the marketplace doesn’t run dry."
    );
  },
  conversion_strategy: (_question, context, answer) => {
    if (answer) {
      return wrapWithConfidence(
        "Perfect—dashboards and experiments will reinforce those conversion levers."
      );
    }
    return wrapWithConfidence(
      "Highlight the hooks—trials, bundles, loyalty—that turn browsers into loyal customers."
    );
  },
};

const QUESTION_SUGGESTION_BUILDERS: Record<
  string,
  (question: WizardQuestion, context: OpinionContext, answer: string) => string
> = {
  success_metric: (_question, context, _answer) => {
    const audience = context.answers.primary_audience || "target users";
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    const hasCompliance = themes.includes("compliance") || themes.includes("finance");
    const hasHealthcare = themes.includes("healthcare");
    const hasCulinary = themes.includes("culinary") || flair.isCulinary;
    const hasProductivity = themes.includes("productivity") || flair.hasTimer || flair.isGamified;

    const iteration = context.iteration ?? 0;

    if (hasHealthcare || hasCompliance) {
      if (iteration === 0) {
        return "Lift clean-claim accuracy to 99%, clear denials within 48 hours, and keep audit exceptions below 0.5%. Track reviewer caseload, escalation lag, and payer feedback so finance and compliance stay confident.";
      }
      if (iteration === 1) {
        return [
          "• Hit a 99% clean-claim rate within the first quarter.",
          "• Resolve denials or escalations inside 48 hours with full audit logs.",
          "• Keep reviewer wellness scores above 80% by pairing calm-mode sessions with decompression prompts.",
          "• Publish a weekly compliance digest for finance and clinical leadership.",
        ].join("\n");
      }
      return "Alternative lens: set tiered goals—95% clean claims in 30 days, 97% in 60 days, 99% by day 90—and run retros when any week dips, so finance, compliance, and wellbeing leaders can course-correct together.";
    }
    if (themes.includes("ai")) {
      return `Automate 60% of repetitive tasks for ${audience} within 90 days while keeping human intervention below 10%. Track resolution quality and feedback to prove trust.`;
    }
    if (themes.includes("go_to_market")) {
      return `Convert 30% of early adopters to paid plans within the first quarter and maintain churn below 5%. Monitor activation, conversion, and retention weekly.`;
    }
    if (themes.includes("internal_enablement")) {
      return `Achieve 75% weekly active ${audience} and raise satisfaction scores by 20% within two quarters. Track enablement completion and workflow adoption.`;
    }
    if (hasCulinary) {
      if (iteration === 0) {
        return "Keep four weeknight meals under 30 minutes using pantry ingredients, maintain a 90% family delight rating, and cut unused groceries by 20%. Track saved recipes, repeat hits, and waste reduction.";
      }
      return [
        "• Four dinners per week under 30 minutes, scored 4.5/5 or higher on family delight.",
        "• Pantry-scan to recipe match rate above 85%.",
        "• Food waste reduced by 20%, tracked via end-of-week fridge check-ins.",
        "• Surprise-twist nights twice a month to keep momentum playful.",
      ].join("\n");
    }
    if (hasProductivity) {
      return `Maintain a 70% completed-run rate for focus timers, keep streaks alive for 10 consecutive days, and boost developer delight scores by 15%. Track streak breaks, timer interruptions, and celebratory feedback.`;
    }
    if (iteration === 0) {
      return `Reach 500 engaged ${audience} within 90 days while keeping repeat usage above 40%. Track leading indicators like activation rate and session depth weekly.`;
    }
    return [
      `• Activate 500 ${audience} in the first quarter with 40%+ repeat usage.`,
      "• Grow referral or word-of-mouth adoption by 15% quarter over quarter.",
      "• Monitor lead indicators (activation lag, cohort stickiness, sentiment) so the team sees warning signs early.",
    ].join("\n");
  },
  primary_audience: (_question, context, _answer) => {
    const summary = context.summary || buildPromptSummary(context.prompt);
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (themes.includes("internal_enablement")) {
      return "Internal enablement leaders, engineering managers, and pilot squads who feel the current friction daily.";
    }
    if (themes.includes("go_to_market")) {
      return "Early adopter customers with urgent pain, plus the champions who can broadcast wins to their peers.";
    }
    if (themes.includes("culinary") || flair.isCulinary) {
      return "Time-starved caregivers juggling family meals—especially parents who need pantry-friendly, kid-approved dinners without extra stress.";
    }
    if (flair.targetsDevelopers) {
      return "Developers craving a playful productivity boost—especially the ones juggling multiple tickets during sprints.";
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.labels.length > 0) {
      return `Target ${formatList(metadata.labels)}—reflect their pressures, motivations, and decision signals in every early artefact.`;
    }
    return `Focus on the personas implied in “${summary}”: decision makers who own the problem and the daily operators who feel it most.`;
  },
  core_journey: (_question, context, _answer) => {
    const summary = context.summary || buildPromptSummary(context.prompt);
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    const hasCompliance = themes.includes("compliance") || themes.includes("finance");
    const hasHealthcare = themes.includes("healthcare");
    const hasCulinary = themes.includes("culinary") || flair.isCulinary;

    const iteration = context.iteration ?? 0;

    if (hasHealthcare || hasCompliance) {
      if (iteration === 0) {
        return `1. Billing lead opens the calm workspace and sees prioritized claims with stress-level check-ins.\n2. Assistant surfaces payer rules, prior notes, and compliance nudges while playing a grounding cue.\n3. They reconcile the claim, log any escalations, and trigger automated audit trails.\n4. The system celebrates progress, schedules the next focus block, and records clean-claim metrics for finance.`;
      }
      return `1. Morning standup sets intent, highlighting risk spikes or volunteer fatigue.\n2. Calm-mode queues guide claims reviewers through payer-specific playbooks with automatic double-signature capture.\n3. After action, the system launches a two-minute decompression ritual, captures coaching notes, and syncs clean-claim stats to finance and clinical dashboards.\n4. Weekly retros assemble compliance, wellbeing, and finance trends into a single report with recommended automations.`;
    }
    if (themes.includes("ai")) {
      return `1. User submits a scenario tied to “${summary}”.\n2. AI analyzes prior data and drafts guidance.\n3. Human reviews, tweaks, and approves.\n4. The system publishes actions and logs feedback for future training.`;
    }
    if (themes.includes("internal_enablement")) {
      return `1. Team member launches the enablement workspace.\n2. They follow the guided checklist for “${summary}”.\n3. The system surfaces templates, playbooks, and stakeholders.\n4. Progress is shared back with leadership dashboards.`;
    }
    if (hasCulinary) {
      if (iteration === 0) {
        return `1. Busy caregiver lists pantry ingredients or scans a quick photo.\n2. The assistant suggests fast, family-friendly meals tuned to their tastes.\n3. Guided steps and playful timers walk them through the cook.\n4. They log the win, rate the recipe, and save tweaks for the next hectic evening.`;
      }
      return `1. Evening prep kicks off with a pantry scan and dietary mood check.\n2. AI proposes three options: quickest, most nutritious, and “let’s experiment”, all tailored to family tastes.\n3. Cooking coach mode guides the session, pausing for hydration or stretch reminders.\n4. Wrap-up logs ratings, captures leftovers ideas, and schedules the next pantry remind-me.`;
    }
    if (flair.hasTimer || flair.isGamified) {
      return `1. Developer selects a mission and fires up the retro timer.\n2. Immersive cues keep focus while the countdown runs.\n3. Completion triggers streak bonuses, playful sounds, and sharable highlights.\n4. The session logs metrics, nudges the next focus block, and celebrates progress.`;
    }
    if (iteration === 0) {
      return `1. User discovers the workspace and signs in.\n2. They capture the key artefact described in “${summary}”.\n3. The system responds with tailored guidance and next steps.\n4. They share outcomes or assign follow-up tasks.`;
    }
    return `1. Kickoff flow clarifies goals and highlights the most urgent artefact around “${summary}”.\n2. Guided creation mode suggests structure, examples, and integrations to plug in.\n3. Collaboration view routes next steps to the right teammates with reminders.\n4. A wrap-up pulse captures learnings, assigns follow-ups, and readies the next sprint's canvas.`;
  },
  differentiator: (_question, context, _answer) => {
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (themes.includes("ai")) {
      return "Blend human-in-the-loop AI guidance with transparent reasoning, surfacing why recommendations were made.";
    }
    if (flair.isRetro || flair.isGamified) {
      return "Turn productivity into a nostalgic arcade encounter—countdowns, 8-bit celebrations, and collectible badges that no bland timer offers.";
    }
    if (themes.includes("culinary") || flair.isCulinary) {
      return "Claim the pantry-whisperer niche—guided pantry scans, zero-waste rewards, and family feedback loops that typical recipe apps ignore.";
    }
    if (themes.includes("productivity")) {
      return "Offer opinionated workflows that cut setup time in half and keep everyone aligned on next actions.";
    }
    return "Deliver an opinionated workflow that cuts setup time in half while exposing insights competitors hide behind dashboards.";
  },
  tech_preferences: (_question, context, _answer) => {
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (themes.includes("healthcare") || themes.includes("compliance") || themes.includes("finance")) {
      return [
        "React + TypeScript calm-mode UI with accessible, low-light components.",
        "Node/NestJS services that expose FEMA, FHIR/Epic, NetSuite, and county record adapters behind a GraphQL gateway.",
        "Postgres + S3 audit pipeline with immutable logs, SOC2/HIPAA guardrails, and PagerDuty/Grafana observability.",
        "Offline-first sync for field volunteers and encrypted storage for trauma debrief notes.",
      ].join("\n");
    }
    if (themes.includes("ai")) {
      return "React + TypeScript UI, Node.js (NestJS) backend, vector search with PostgreSQL + pgvector, and a managed model serving stack (OpenAI/Azure) behind feature flags.";
    }
    if (themes.includes("integration")) {
      return "React + TypeScript frontend, GraphQL gateway, and modular connector services that normalize Slack, Jira, and Confluence APIs.";
    }
    if (flair.hasTimer || flair.isRetro) {
      return "React with a retro-styled component system, WebSockets for live countdowns, and a Node/Prisma backend that syncs streak data across devices.";
    }
    if (/react/i.test(context.prompt)) {
      return "React + TypeScript frontend, Node.js (NestJS) backend, Postgres with Prisma, hosted on AWS with CI via GitHub Actions.";
    }
    return "Modular React frontend with component library, Node/Express API, and a managed database (Postgres or Dynamo) to stay flexible.";
  },
  integration_needs: (_question, context, _answer) => {
    const themes = context.analysis?.themes ?? [];
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (/slack/i.test(context.prompt) || themes.includes("integration")) {
      return "Integrate with Slack for notifications and command triggers; pull project data from Jira and Confluence to enrich context.";
    }
    if (/notion|confluence|jira/i.test(context.prompt)) {
      return "Import documentation from Confluence/Notion, sync tasks with Jira, and mirror KPIs from your analytics stack.";
    }
    if (flair.targetsDevelopers) {
      return "Hook into VS Code/JetBrains plugins, calendar blockers, and ticket trackers so starting a focus sprint is one click.";
    }
    return "Connect source control (GitHub/GitLab), planning tools (Jira/Linear), and knowledge bases (Confluence/Notion) to keep context fresh.";
  },
  timeline: (_question, context, _answer) => {
    const themes = context.analysis?.themes ?? [];
    if (themes.includes("internal_enablement")) {
      return "Pilot with a small cohort within 6 weeks, roll out to the broader org by the end of the quarter, and cement change with quarterly refreshers.";
    }
    if (themes.includes("go_to_market")) {
      return "Pilot in 4 weeks, launch beta with key design partners by the next milestone event, and go GA alongside the main GTM push.";
    }
    return "Pilot within 6 weeks, beta rollout by the end of the quarter, and GA release aligned with the next industry event.";
  },
  budget_constraints: (_question, context, _answer) => {
    if (/small team|limited|budget/i.test(context.prompt)) {
      return "Operate with a 3–4 person squad (product, design, full-stack, ML engineer) and allocate budget for one contractor on demand.";
    }
    return "Allocate a cross-functional squad of 5–6 people, budget for AI/analytics tooling, and reserve contingency for integration support.";
  },
  compliance: (_question, context, _answer) => {
    if (/health|hipaa/i.test(context.prompt)) {
      return "Ensure HIPAA alignment with encrypted data at rest, audit logging, and restricted access controls.";
    }
    if (/finance|gdpr|soc/i.test(context.prompt)) {
      return "Plan for SOC2 Type II controls, GDPR consent handling, and rigorous access reviews from the start.";
    }
    return "Document data flows, implement role-based access, and schedule early security reviews to avoid late surprises.";
  },
  growth_channels: (_question, context, _answer) => {
    const themes = context.analysis?.themes ?? [];
    if (/developer|dev/i.test(context.prompt)) {
      return "Leverage developer communities, publish API showcases, and run live build sessions to drive adoption.";
    }
    if (themes.includes("go_to_market")) {
      return "Start with founder-led outreach, targeted webinars, and content that ranks for the exact pain points. Layer referral loops once early wins land.";
    }
    return "Start with founder-led outreach, layer in targeted content/SEO around the core pain, and offer workshops or webinars to convert prospects.";
  },
  ai_training: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    const summary = context.summary || buildPromptSummary(context.prompt);
    return `Combine historical records, expert-reviewed exemplars, and a feedback loop from live usage so the AI behind “${summary}” keeps getting better.`;
  },
  data_strategy: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    const themes = context.analysis?.themes ?? [];
    if (themes.includes("ai") || themes.includes("data")) {
      return "Capture model quality metrics (precision/recall), human override rate, activation funnels, and team satisfaction to prove value holistically.";
    }
    return "Use the metrics that prove this is working so we can wire telemetry and health checks into the blueprint from day one.";
  },
  change_management: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    return "Outline the champions, training assets, comms cadence, and feedback channels required to shift teams onto the new workflow.";
  },
  experience_tone: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (flair.isRetro) {
      return "Channel a neon arcade: glowing gradients, crunchy synth beats, and copy that cheers you on like a level-up announcer.";
    }
    if (flair.isMorningRitual) {
      return "Imagine a sunrise ritual—warm amber light, gentle chimes, and encouraging nudges that feel like a barista whispering your first win of the day.";
    }
    if (flair.isCulinary) {
      const kitchenMood = flair.mentionsFamily ? "family kitchen" : "test kitchen";
      return `Design a cozy ${kitchenMood} moment—warm lighting, sizzling sound cues, playful recipe cards, and celebratory copy when dinner comes together fast.`;
    }
    if (flair.isGamified) {
      return "Lean into playful tension: dynamic lighting, countdown pulses, and microcopy that turns each task into a celebratory quest.";
    }
    if (flair.isWellness || flair.isJournal) {
      return "Create a calm sanctuary—soft gradients, mindful breathing cues, and empathetic copy that keeps gratitude effortless.";
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.toneWords.length > 0) {
      return `Shape a vibe that feels ${formatList(metadata.toneWords)} so your audience instinctively leans in.`;
    }
    return "Craft a signature vibe—whether zen studio, competitive arena, or celebratory lounge—so visuals, sound, and copy stay in sync.";
  },
  habit_strategy: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (flair.isCulinary) {
      return "Build weekly pantry scans, leftover remix quests, and celebratory badges when families hit their dinner streaks without wasting ingredients.";
    }
    if (flair.isGamified) {
      return "Design streak rules, boss-battle milestones, team leaderboards, and surprise rewards to keep momentum.";
    }
    if (flair.isMorningRitual) {
      return "Stack gentle habit loops: pre-dawn prep reminders, post-session reflections, and celebratory check-ins that anchor the morning.";
    }
    if (flair.isWellness || flair.isJournal) {
      return "Layer reflective rituals—daily gratitude prompts, weekly mood check-ins, and soothing affirmations that celebrate progress.";
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.labels.length > 0) {
      return `Blend loops that respect ${formatList(metadata.labels)}—nudges, celebrations, and reflections that keep the habit livable.`;
    }
    return "Blend recurring focus blocks, accountability nudges, and reflective prompts to weave the habit into daily life.";
  },
  telemetry_focus: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    const flair = derivePromptFlair(context.prompt, context.analysis);
    if (flair.hasTimer || flair.isGamified) {
      return "Track timer completion rate, streak health, and developer mood shifts so you can prove the retro timer works.";
    }
    if (flair.isCulinary) {
      return "Measure pantry scan-to-recipe match time, saved favorites, family delight ratings, and food waste reductions to show the kitchen magic is real.";
    }
    if (flair.isWellness || flair.isJournal) {
      return "Monitor journaling streaks, sentiment trends, and mood uplift so you can show the gratitude habit is sticking.";
    }
    const metadata = collectThemeMetadata(context.analysis);
    if (metadata.labels.length > 0) {
      return `Instrument the signals ${formatList(metadata.labels)} rely on—confidence boosts, risk alerts, and proof the experience is working.`;
    }
    return "Capture adoption, engagement depth, and satisfaction so we can prove momentum early.";
  },
  integration_targets: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    return "List the tools (Slack, VS Code, calendar, Jira) we must connect so starting a focus sprint fits existing workflows.";
  },
  clinical_safeguards: (_question, context, _answer) => {
    return "Document approvals, double-signature points, and escalation protocols to keep patients safe and auditors satisfied.";
  },
  regulatory_reporting: (_question, context, _answer) => {
    return "Map required filings—cadence, owners, datasets—so compliance artefacts can be automated.";
  },
  revenue_model: (_question, context, _answer) => {
    return "Explain the monetisation or savings levers, target KPIs, and how you’ll validate them in early releases.";
  },
  learning_outcomes: (_question, context, _answer) => {
    const themes = context.analysis?.themes ?? [];
    const metadata = collectThemeMetadata(context.analysis);
    if (themes.includes("education") && (themes.includes("healthcare") || themes.includes("compliance") || themes.includes("finance"))) {
      return [
        "• Volunteers can translate FEMA/OSHA updates into classroom-ready drills within 48 hours.",
        "• Burnout risk scores drop at least 20% thanks to guided decompression rituals after tough calls.",
        "• Students demonstrate mastery through scenario-based assessments and peer-led safety exercises.",
        "Measure success via post-incident reflections, drill participation rates, and compliance audit results.",
      ].join("\n");
    }
    if (themes.includes("education") || metadata.labels.some((label) => /teacher|learning/i.test(label))) {
      return [
        "• Learners move from awareness to confident execution via scaffolded practice.",
        "• Reflection prompts surface gaps; analytics flag who needs coaching.",
        "• Define the rubric, telemetry, and rituals that prove the habit stuck.",
      ].join("\n");
    }
    return "Describe the learner outcomes or behavioural shifts you expect, plus how you’ll measure mastery.";
  },
  content_strategy: (_question, context, _answer) => {
    if (_answer) {
      return _answer;
    }
    const themes = context.analysis?.themes ?? [];
    if (themes.includes("education") && (themes.includes("healthcare") || themes.includes("compliance") || themes.includes("finance"))) {
      return [
        "Map FEMA playbooks, HIPAA-ready documentation, and trauma-informed coaching scripts into modular lesson kits.",
        "Blend microlearning videos, printable classroom exercises, and checklist-driven debrief guides.",
        "Schedule quarterly expert reviews (county officials, clinicians) so content stays compliant and trustworthy.",
      ].join("\n");
    }
    if (themes.includes("education")) {
      return "Detail your curriculum spine—modules, lesson formats, expert contributors, and how content stays fresh.";
    }
    if (themes.includes("culinary")) {
      return "List recipe sources, dietary filters, pantry-swap rules, and how often you'll refresh seasonal menus.";
    }
    return "Outline the content backbone—modules, formats, SMEs, and update cadence—that powers the experience.";
  },
  merchant_supply: (_question, context, _answer) => {
    return "Define the supply playbook: recruitment channels, vetting steps, onboarding milestones, and retention incentives.";
  },
  conversion_strategy: (_question, context, _answer) => {
    return "Lay out your conversion journey—from awareness hooks to retention nudges—and the experiments you’ll run first.";
  },
};

export function generateQuestionOpinion(
  question: WizardQuestion,
  context: OpinionContext
): string {
  const answer = (context.answers[question.id] ?? "").trim();
  const builder = QUESTION_OPINION_BUILDERS[question.id];
  if (builder) {
    const output = builder(question, context, answer);
    return answer ? output : ensureQuestion(output);
  }
  const promptSummary = context.summary || buildPromptSummary(context.prompt);
  if (answer) {
    return wrapWithConfidence(
      `Sounds good—let’s use that input while we fine-tune the blueprint${
        promptSummary ? ` for “${promptSummary}”` : ""
      }.`
    );
  }
  return ensureQuestion(
    `Share a quick thought here and I’ll make sure the plan reflects it${
      promptSummary ? ` (“${promptSummary}”)` : ""
    }`
  );
}

export function generateQuestionSuggestion(
  question: WizardQuestion,
  context: OpinionContext
): string {
  const answer = (context.answers[question.id] ?? "").trim();
  const builder = QUESTION_SUGGESTION_BUILDERS[question.id];
  if (answer) {
    return answer;
  }
  if (builder) {
    return builder(question, context, answer);
  }
  const summary = context.summary || buildPromptSummary(context.prompt);
  return `Capture the essentials for “${summary}” in 2–3 sentences, covering the business angle, user flow, and tech implications.`;
}

export type WizardPromptEvaluation = {
  summary: string;
  questions: WizardQuestion[];
  analysis: PromptAnalysis;
};

export function evaluatePromptForWizard(
  prompt: string,
  options?: { minimum?: number; maximum?: number }
): WizardPromptEvaluation {
  const trimmed = prompt.trim();
  const analysis = analyzePrompt(trimmed);
  const questions = selectQuestionsFromAnalysis(
    trimmed,
    analysis,
    options?.minimum ?? 3,
    options?.maximum ?? 5
  );
  const summary = buildEnhancedSummary(trimmed, analysis) || trimmed;

  return {
    summary,
    questions,
    analysis,
  };
}

export function getWizardQuestionById(id: string): WizardQuestion | undefined {
  const normalized = id.trim();
  if (!normalized) return undefined;
  const optional = OPTIONAL_LOOKUP.get(normalized);
  if (optional) {
    return optional;
  }
  return CORE_LOOKUP.get(normalized);
}
