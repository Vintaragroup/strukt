import { describe, it, expect } from "vitest";
import {
  buildPromptSummary,
  evaluatePromptForWizard,
  generateQuestionOpinion,
  generateQuestionSuggestion,
  getQuestionById,
  selectWizardQuestions,
  validateThemeIndex,
} from "@/data/wizardQuestions";
import type { ThemeConfig } from "@/data/themeIndex";

describe("wizard question helpers", () => {
  it("returns core and optional questions when prompt is sparse", () => {
    const questions = selectWizardQuestions("build app");
    const business = questions.filter((q) => q.category === "business").length;
    const product = questions.filter((q) => q.category === "product").length;
    const tech = questions.filter((q) => q.category === "tech").length;

    expect(questions.length).toBeGreaterThanOrEqual(5);
    expect(business).toBeGreaterThan(0);
    expect(product).toBeGreaterThan(0);
    expect(tech).toBeGreaterThan(0);
  });

  it("detects AI themes and pulls in domain-specific questions", () => {
    const detailedPrompt = `
      We are launching a subscription-based AI productivity companion for internal teams.
      The platform needs onboarding journeys, progress dashboards, API integrations with Slack,
      and clear success metrics around daily active usage and NPS growth.
      Think of it as a full-stack product that covers frontend interactions, backend job orchestration,
      analytics pipelines, and documentation hubs for both customers and partners.
    `;

    const evaluation = evaluatePromptForWizard(detailedPrompt);
    const questionIds = evaluation.questions.map((q) => q.id);
    expect(questionIds).toContain("ai_training");
    expect(questionIds).toContain("data_strategy");
    expect(evaluation.analysis.themes).toContain("ai");
  });

  it("builds summaries that cap maximum length with ellipsis", () => {
    const longPrompt = "Build a marketplace ".repeat(40);
    const summary = buildPromptSummary(longPrompt);
    expect(summary.length).toBeLessThanOrEqual(181);
    expect(summary.endsWith("…")).toBe(true);
  });

  it("falls back to trimmed prompt when no sentence boundaries exist", () => {
    const prompt = "Realtime IoT monitoring platform for wind turbines with auto-healing";
    const summary = buildPromptSummary(prompt);
    expect(summary).toBe(prompt);
  });

  it("crafts different opinions depending on whether an answer exists", () => {
    const question = getQuestionById("success_metric");
    expect(question).toBeTruthy();
    const context = { prompt: "AI assistant for customer support teams", answers: {}, summary: "AI assistant for customer support teams" };

    const withoutAnswer = generateQuestionOpinion(question!, context);
    expect(withoutAnswer).toMatch(/\?$/);
    expect(withoutAnswer.toLowerCase()).toContain("would anchoring");

    const withAnswer = generateQuestionOpinion(question!, {
      ...context,
      answers: { success_metric: "Increase deflection rate to 60% within 90 days." },
    });
    expect(withAnswer).toContain("finish line");
  });

  it("references helper guidance for select-type answers", () => {
    const question = getQuestionById("primary_audience");
    expect(question).toBeTruthy();
    const output = generateQuestionOpinion(question!, {
      prompt: "Internal launch of a developer enablement hub",
      answers: { primary_audience: "internal_teams" },
      summary: "Internal launch of a developer enablement hub",
    });
    expect(output).toContain("focus on internal_teams");
  });

  it("auto-fill suggestions respect existing answers", () => {
    const question = getQuestionById("success_metric");
    expect(question).toBeTruthy();
    const autoFill = generateQuestionSuggestion(question!, {
      prompt: "AI assistant for customer support teams",
      answers: {},
      summary: "AI assistant for customer support teams",
    });
    expect(autoFill).toContain("Reach 500");

    const preserved = generateQuestionSuggestion(question!, {
      prompt: "AI assistant for customer support teams",
      answers: { success_metric: "Keep NPS above 50" },
      summary: "AI assistant for customer support teams",
    });
    expect(preserved).toBe("Keep NPS above 50");
  });

  it("adjusts auto-fill suggestions when analysis flags AI themes", () => {
    const question = getQuestionById("success_metric");
    expect(question).toBeTruthy();
    const evaluation = evaluatePromptForWizard("AI copilot that automates backlog grooming for product teams");
    const themed = generateQuestionSuggestion(question!, {
      prompt: "AI copilot that automates backlog grooming for product teams",
      answers: {},
      summary: evaluation.summary,
      analysis: evaluation.analysis,
    });
    expect(themed.toLowerCase()).toContain("automate");
  });

  it("surfaces fallback questions when no strong themes are detected", () => {
    const evaluation = evaluatePromptForWizard("Simple task list for personal productivity");
    expect(evaluation.questions.length).toBeGreaterThanOrEqual(3);
    const ids = evaluation.questions.map((q) => q.id);
    expect(
      ids.includes("timeline") ||
        ids.includes("growth_channels") ||
        ids.includes("habit_strategy")
    ).toBe(true);
  });

  it("produces an enhanced summary rather than echoing the prompt", () => {
    const prompt = "generate a retro digital timer widget that is gamified and fun for developers to use and stay on track";
    const evaluation = evaluatePromptForWizard(prompt);
    expect(evaluation.summary.toLowerCase()).not.toBe(prompt.toLowerCase());
    expect(evaluation.summary).toMatch(/retro|timer|gamified/i);
  });

  it("detects healthcare signals and surfaces clinical questions", () => {
    const prompt = "HIPAA-compliant telehealth triage assistant for clinicians and patients";
    const evaluation = evaluatePromptForWizard(prompt);
    expect(evaluation.analysis.themes).toContain("healthcare");
    const ids = evaluation.questions.map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining(["clinical_safeguards", "regulatory_reporting"]));
  });

  it("detects finance prompts and adds revenue and reporting questions", () => {
    const prompt = "Fintech trading co-pilot that helps portfolio managers stay compliant";
    const evaluation = evaluatePromptForWizard(prompt);
    expect(evaluation.analysis.themes).toContain("finance");
    const ids = evaluation.questions.map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining(["revenue_model", "regulatory_reporting"]));
  });

  it("detects wellness prompts and adds reflective questions", () => {
    const prompt = "Build a digital gratitude journal that nudges users with reflective prompts";
    const evaluation = evaluatePromptForWizard(prompt);
    expect(evaluation.analysis.themes).toContain("wellness");
    const ids = evaluation.questions.map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining(["experience_tone", "habit_strategy"]));
  });

  it("detects culinary prompts and surfaces pantry-focused guidance", () => {
    const prompt =
      "Generate a playful cooking companion for parents with limited time. I want to drop in the ingredients I have after work and get fast, family-friendly meal ideas that feel rewarding.";
    const evaluation = evaluatePromptForWizard(prompt);
    expect(evaluation.analysis.themes).toContain("culinary");
    const ids = evaluation.questions.map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining(["experience_tone", "content_strategy"]));
    expect(evaluation.analysis.recommendedQuestionIds).toContain("habit_strategy");
    expect(evaluation.summary.toLowerCase()).toMatch(/pantry|meal/);
    expect(evaluation.summary).toMatch(/time-starved caregivers/i);
    expect(evaluation.summary).toMatch(/Tone stays warm, encouraging, and practical/i);
    expect(evaluation.summary).toMatch(/dinner victories/i);
  });

  it("offers richer suggestions when the same question is asked again", () => {
    const prompt = "HIPAA-compliant calm workspace for billing teams.";
    const evaluation = evaluatePromptForWizard(prompt);
    const question = getQuestionById("success_metric");
    expect(question).toBeTruthy();

    const first = generateQuestionSuggestion(question!, {
      prompt,
      answers: {},
      summary: evaluation.summary,
      analysis: evaluation.analysis,
      iteration: 0,
    });
    const second = generateQuestionSuggestion(question!, {
      prompt,
      answers: {},
      summary: evaluation.summary,
      analysis: evaluation.analysis,
      iteration: 1,
      previousSuggestion: first,
    });

    expect(first.split("\n").length).toBe(1);
    expect(second.split("\n").length).toBeGreaterThan(1);
  });

  it("validates the theme catalogue and flags unknown question references", () => {
    const mockThemeIndex: ThemeConfig[] = [
      {
        id: "ai",
        patterns: [String.raw`\bexample\b`],
        recommendedQuestionIds: ["nonexistent_question"],
      },
    ];

    expect(() => validateThemeIndex(mockThemeIndex, new Set(["success_metric"]))).toThrow(
      /unknown question "nonexistent_question"/i
    );
  });

  it("tailors suggestions when multiple heavy-weight personas overlap", () => {
    const prompt =
      "Design a hybrid ‘calm finance’ workspace where overworked hospital billing leads can reconcile claims while decompressing.";
    const evaluation = evaluatePromptForWizard(prompt);
    const successQuestion = getQuestionById("success_metric");
    const journeyQuestion = getQuestionById("core_journey");
    expect(successQuestion).toBeTruthy();
    expect(journeyQuestion).toBeTruthy();

    const successSuggestion = generateQuestionSuggestion(successQuestion!, {
      prompt,
      answers: {},
      summary: evaluation.summary,
      analysis: evaluation.analysis,
    });
    const journeySuggestion = generateQuestionSuggestion(journeyQuestion!, {
      prompt,
      answers: {},
      summary: evaluation.summary,
      analysis: evaluation.analysis,
    });

    expect(successSuggestion.toLowerCase()).toContain("clean-claim");
    expect(journeySuggestion.toLowerCase()).toContain("calm workspace");
    expect(journeySuggestion.toLowerCase()).toContain("clean-claim");
  });
});
