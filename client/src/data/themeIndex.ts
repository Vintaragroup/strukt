export type ThemeId =
  | "ai"
  | "internal_enablement"
  | "go_to_market"
  | "compliance"
  | "data"
  | "integration"
  | "productivity"
  | "culinary"
  | "healthcare"
  | "finance"
  | "education"
  | "ecommerce"
  | "marketing"
  | "wellness";

export type ThemeConfig = {
  id: ThemeId;
  /**
   * List of regex patterns (without delimiters) used to detect the theme.
   * All patterns are compiled with the case-insensitive flag.
   */
  patterns: readonly string[];
  /** Optional questions the wizard should prioritise when this theme is present. */
  recommendedQuestionIds: readonly string[];
  /** Optional sentence fragment that highlights how the wizard will lean into this theme. */
  summaryHighlight?: string;
  /** Optional follow-up focus areas surfaced in the enhanced summary. */
  focusAreas?: readonly string[];
  /** Human-friendly label describing the persona we’re supporting. */
  personaLabel?: string;
  /** Tone descriptors that should influence copy and responses. */
  toneDescriptors?: readonly string[];
  /** Optional snippets of voice/copy we can surface verbatim. */
  voiceSnippets?: readonly string[];
  /** Question IDs that must appear whenever this theme is present. */
  criticalQuestionIds?: readonly string[];
};

export const THEME_INDEX: readonly ThemeConfig[] = [
  {
    id: "ai",
    patterns: [String.raw`\b(ai|machine learning|ml|llm|automation)\b`],
    recommendedQuestionIds: ["ai_training", "data_strategy"],
    summaryHighlight: "responsible AI guidance and adaptive suggestions based on team activity",
    focusAreas: ["AI training and guardrails"],
    personaLabel: "platform leads architecting responsible AI copilots",
    toneDescriptors: ["assured", "precise", "trust-building"],
    voiceSnippets: [
      "We'll balance automation with human oversight so teams trust every recommendation.",
    ],
    criticalQuestionIds: ["data_strategy"],
  },
  {
    id: "internal_enablement",
    patterns: [String.raw`\b(internal|employee|team enablement|enterprise)\b`],
    recommendedQuestionIds: ["change_management", "timeline"],
    personaLabel: "enablement managers guiding teams through change",
    toneDescriptors: ["supportive", "pragmatic", "steady"],
    voiceSnippets: [
      "We'll coach the champions, stage communications, and keep momentum empathetic yet firm.",
    ],
  },
  {
    id: "go_to_market",
    patterns: [String.raw`\b(launch|market|growth|funnel|activation|acquisition)\b`],
    recommendedQuestionIds: ["growth_channels", "timeline"],
    focusAreas: ["launch planning"],
    personaLabel: "founder-operators orchestrating a go-to-market push",
    toneDescriptors: ["energetic", "market-minded", "decisive"],
    voiceSnippets: [
      "We'll rally the launch squad, highlight the bold bets, and keep eyes on conversion signals.",
    ],
  },
  {
    id: "compliance",
    patterns: [String.raw`\b(gdpr|hipaa|soc2|sox|pci|compliance|privacy|security)\b`],
    recommendedQuestionIds: ["compliance", "data_strategy"],
    personaLabel: "risk and compliance guardians protecting trust",
    toneDescriptors: ["cautious", "methodical", "evidence-led"],
    voiceSnippets: [
      "We'll document the guardrails, champion audit readiness, and keep every decision defensible.",
    ],
    criticalQuestionIds: ["compliance"],
  },
  {
    id: "data",
    patterns: [String.raw`\b(telemetry|analytics|metrics|insights|dashboard|data)\b`],
    recommendedQuestionIds: ["data_strategy", "success_metric"],
    focusAreas: ["telemetry and insight capture"],
    personaLabel: "insight-driven PMs and analysts hunting signal",
    toneDescriptors: ["curious", "evidence-based", "transparent"],
    voiceSnippets: [
      "We'll trace the metrics that matter, stitch telemetry end-to-end, and translate it into action.",
    ],
    criticalQuestionIds: ["data_strategy"],
  },
  {
    id: "integration",
    patterns: [String.raw`\b(slack|jira|notion|confluence|github|integration|api)\b`],
    recommendedQuestionIds: ["integration_needs", "data_strategy"],
    summaryHighlight: "hooks into existing tools so adoption feels lightweight",
    focusAreas: ["tool integrations"],
    personaLabel: "workflow architects connecting fragmented toolchains",
    toneDescriptors: ["systems-minded", "efficient", "practical"],
    voiceSnippets: [
      "We'll map the glue work, smooth the handoffs, and keep the stack humming together.",
    ],
  },
  {
    id: "productivity",
    patterns: [
      String.raw`\b(productivity|workflow|process|collaboration|automation|focus|timebox|timer|countdown|pomodoro|retro|nostalgic|gamif(?:y|ied|ication)|habit|streak)\b`,
    ],
    recommendedQuestionIds: ["change_management", "habit_strategy", "experience_tone", "telemetry_focus"],
    summaryHighlight: "clear productivity metrics and celebratory moments that reinforce healthy habits",
    focusAreas: ["habits and change management"],
    personaLabel: "makers craving flow and sustainable momentum",
    toneDescriptors: ["motivating", "optimistic", "accountable"],
    voiceSnippets: [
      "We'll cheer the wins, track the streaks, and keep the rituals flexible enough to stick.",
    ],
  },
  {
    id: "culinary",
    patterns: [
      String.raw`\b(cook|cooking|kitchen|recipe|meal|dinner|lunch|breakfast|pantry|ingredient|ingredients|chef|culinary|food|supper)\b`,
    ],
    recommendedQuestionIds: ["experience_tone", "content_strategy", "habit_strategy"],
    summaryHighlight: "pantry-aware meal planning that makes family dinners fast, fun, and stress-free",
    focusAreas: ["meal planning and pantry intelligence"],
    personaLabel: "time-starved caregivers planning family meals",
    toneDescriptors: ["warm", "encouraging", "practical"],
    voiceSnippets: [
      "We'll keep dinner victories quick, low-stress, and full of smiles around the table.",
    ],
    criticalQuestionIds: ["habit_strategy"],
  },
  {
    id: "healthcare",
    patterns: [String.raw`\b(hipaa|ehr|emr|clinical|patient|provider|hospital|medical|biomedical|care team|pharma|fda)\b`],
    recommendedQuestionIds: ["clinical_safeguards", "regulatory_reporting", "integration_targets"],
    summaryHighlight: "clinical safeguards, audit trails, and trust-building protocols for care teams",
    focusAreas: ["clinical governance and compliance"],
    personaLabel: "clinical leads safeguarding patient outcomes",
    toneDescriptors: ["reassuring", "clinical", "trust-building"],
    voiceSnippets: [
      "We'll uphold protocols, surface escalation paths, and earn clinician confidence at every step.",
    ],
    criticalQuestionIds: ["clinical_safeguards", "regulatory_reporting"],
  },
  {
    id: "finance",
    patterns: [String.raw`\b(fintech|payment|trading|brokerage|portfolio|bank|aml|kyc|sec|mifid|ledger)\b`],
    recommendedQuestionIds: ["regulatory_reporting", "revenue_model", "telemetry_focus"],
    summaryHighlight: "regulatory reporting, risk controls, and transparent monetisation levers",
    focusAreas: ["risk, reporting, and monetisation levers"],
    personaLabel: "financial stewards balancing growth and controls",
    toneDescriptors: ["measured", "trustworthy", "regulatory-savvy"],
    voiceSnippets: [
      "We'll tie every lever to compliant growth and keep auditors, investors, and customers at ease.",
    ],
    criticalQuestionIds: ["regulatory_reporting"],
  },
  {
    id: "education",
    patterns: [String.raw`\b(education|learning|course|curriculum|teacher|student|classroom|lesson|cohort|training)\b`],
    recommendedQuestionIds: ["learning_outcomes", "content_strategy", "habit_strategy"],
    summaryHighlight: "learner outcomes, instructional design, and feedback loops for students",
    focusAreas: ["learning design and engagement"],
    personaLabel: "learning designers shaping motivating student journeys",
    toneDescriptors: ["encouraging", "structured", "reflective"],
    voiceSnippets: [
      "We'll scaffold mastery, celebrate breakthroughs, and capture the feedback loops that prove it.",
    ],
  },
  {
    id: "ecommerce",
    patterns: [
      String.raw`\b(ecommerce|e-commerce|marketplace|merchant|seller|catalog|checkout|cart|fulfillment|inventory)\b`,
    ],
    recommendedQuestionIds: ["merchant_supply", "conversion_strategy", "telemetry_focus"],
    summaryHighlight: "merchant onboarding, catalogue operations, and conversion optimisation",
    focusAreas: ["supply, conversion, and fulfilment"],
    personaLabel: "marketplace operators balancing supply and demand",
    toneDescriptors: ["data-driven", "merchant-friendly", "nimble"],
    voiceSnippets: [
      "We'll keep the flywheel spinning—healthy supply, smooth conversion, and reliable fulfilment.",
    ],
  },
  {
    id: "marketing",
    patterns: [String.raw`\b(marketing|campaign|brand|funnel|seo|content marketing|demand gen|advertising|crm)\b`],
    recommendedQuestionIds: ["content_strategy", "growth_channels", "telemetry_focus"],
    summaryHighlight: "campaign experimentation, content strategy, and telemetry for growth decisions",
    focusAreas: ["campaign and content strategy"],
    personaLabel: "growth marketers orchestrating narrative and funnels",
    toneDescriptors: ["story-driven", "analytical", "bold"],
    voiceSnippets: [
      "We'll choreograph the story, instrumentation, and experiments that keep the funnel lively.",
    ],
  },
  {
    id: "wellness",
    patterns: [
      String.raw`\b(gratitude|journal|journaling|wellness|mindfulness|meditation|reflection|mood|mental health|self[-\s]?care|breathwork)\b`,
    ],
    recommendedQuestionIds: ["experience_tone", "habit_strategy", "telemetry_focus"],
    summaryHighlight: "calming rituals, mindful nudges, and mood tracking that support personal wellbeing",
    focusAreas: ["habit reinforcement and emotional tone"],
    personaLabel: "humans seeking sustainable wellbeing rituals",
    toneDescriptors: ["soothing", "empathetic", "hopeful"],
    voiceSnippets: [
      "We'll craft gentle rituals, celebrate small wins, and keep the journey kind to the nervous system.",
    ],
  },
] as const;

export const THEME_CONFIG_BY_ID: ReadonlyMap<ThemeId, ThemeConfig> = new Map(
  THEME_INDEX.map((config) => [config.id, config])
);
