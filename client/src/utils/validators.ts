import Ajv from "ajv";
import type { Target } from "../platforms";

// Enable union types (e.g., type: ["string", "number"]) and keep allErrors for nicer messages.
// Using strict:"log" avoids throwing on strict schema hints while still surfacing them in dev.
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: "log" });

// Simple planner shape: { tasks: string[], notes: string }
const vscodeSimplePlanSchema = {
  type: "object",
  required: ["tasks", "notes"],
  properties: {
    tasks: { type: "array", minItems: 1, maxItems: 7, items: { type: "string" } },
    notes: { type: "string" },
  },
  additionalProperties: false,
} as const;

// VS Code tasks.json-like shape
const vscodeTasksJsonSchema = {
  type: "object",
  required: ["version", "tasks"],
  properties: {
    version: { type: "string", pattern: "^2\\.0\\.0$" },
    tasks: {
      type: "array",
      minItems: 1,
      maxItems: 7,
      items: {
        type: "object",
        required: ["label", "type", "command"],
        properties: {
          label: { type: "string", minLength: 1 },
          type: { const: "shell" },
          command: { type: "string", minLength: 1 },
          args: { type: "array", items: { type: ["string", "number"] } },
          problemMatcher: {
            anyOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } }
            ],
          },
          options: { type: "object" },
          group: { type: ["string", "object", "null"] },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
} as const;

const validateVSCodeSimple = ajv.compile(vscodeSimplePlanSchema);
const validateVSCodeTasks = ajv.compile(vscodeTasksJsonSchema);

export function detectVSCodeShape(output: string): { shape: "tasks" | "simple" | "invalid"; parsed?: any; reasons?: string[] } {
  try {
    const json = JSON.parse(output);
    if (validateVSCodeTasks(json)) {
      return { shape: "tasks", parsed: json };
    }
    if (validateVSCodeSimple(json)) {
      return { shape: "simple", parsed: json };
    }
    const reasons = [
      ...(validateVSCodeTasks.errors ?? []).map((e) => `tasks.json shape: ${ajv.errorsText([e])}`),
      ...(validateVSCodeSimple.errors ?? []).map((e) => `simple shape: ${ajv.errorsText([e])}`),
    ];
    return { shape: "invalid", reasons };
  } catch {
    return { shape: "invalid", reasons: ["Output is not valid JSON."] };
  }
}

export function validate(target: Target, output: string): { ok: boolean; reasons: string[] } {
  switch (target) {
    case "lovable": {
      const hasFences = /```/.test(output);
      const hasJSX = /<\/?[A-Z][A-Za-z0-9]*/.test(output);
      const hasDefaultExportFn = /export\s+default\s+function\s+[A-Z][A-Za-z0-9_]*/.test(output);
      const hasShadcnImport = /from\s+['"]@\/components\/ui\//.test(output);
      const hasTailwind = /className=\"[^\"]+\"/.test(output);
      const reasons = [
        hasFences ? "Contains code fences; must be raw TSX." : null,
        !hasJSX ? "No JSX component detected." : null,
        !hasDefaultExportFn ? "Missing default exported function component." : null,
        !hasShadcnImport ? "Missing shadcn/ui import from '@/components/ui/*'." : null,
        !hasTailwind ? "Missing Tailwind className usage." : null,
      ].filter(Boolean) as string[];
      return { ok: reasons.length === 0, reasons };
    }
    case "base44": {
      // Shape A (internal plan): strict H2s + Gherkin AC
      const scope = /##\s*Scope\b/i.test(output);
      const ac = /##\s*Acceptance Criteria\b/i.test(output);
      const risks = /##\s*Risks\b/i.test(output);
      const next = /##\s*Next Steps\b/i.test(output);

      let gherkinCount = 0;
      if (ac) {
        try {
          const acSection = output.split(/##\s*Acceptance Criteria\b/i)[1] || "";
          const untilNext = acSection.split(/\n##\s*/)[0] || acSection;
          const lines = untilNext.split(/\n+/).map((l) => l.trim());
          gherkinCount = lines.filter((l) => /Given.+When.+Then/i.test(l) || /^[-*]\s*(Given|When|Then)/i.test(l)).length;
        } catch {}
      }
      const shapeAOk = scope && ac && risks && next && gherkinCount >= 2;

      // Shape B (Base44 prompt frameworks): Who/What/Why (+ optional User Journey/Feature Breakdown)
      const who = /##\s*Who\b/i.test(output);
      const what = /##\s*What\b/i.test(output);
      const why = /##\s*Why\b/i.test(output);
      const userJourney = /##\s*User\s*Journey\b/i.test(output);
      const featureBreakdown = /##\s*Feature\s*Breakdown\b/i.test(output);
      const shapeBOk = who && what && why && (userJourney || featureBreakdown);

      if (shapeAOk || shapeBOk) {
        return { ok: true, reasons: [] };
      }

      // If neither shape is satisfied, produce targeted reasons prioritizing Shape A (our default)
      const reasonsA = [
        scope ? null : "Missing '## Scope'",
        ac ? null : "Missing '## Acceptance Criteria'",
        risks ? null : "Missing '## Risks'",
        next ? null : "Missing '## Next Steps'",
        ac && gherkinCount < 2 ? "Acceptance Criteria must include at least 2 Gherkin-style items (Given/When/Then)." : null,
      ].filter(Boolean) as string[];

      // Provide Shape B guidance as alternatives
      const reasonsB = [
        who ? null : "Alternative allowed: add '## Who'",
        what ? null : "Alternative allowed: add '## What'",
        why ? null : "Alternative allowed: add '## Why'",
        userJourney || featureBreakdown ? null : "Alternative allowed: add '## User Journey' or '## Feature Breakdown'",
      ].filter(Boolean) as string[];

      return { ok: false, reasons: [...reasonsA, ...reasonsB] };
    }
    case "claude": {
      const words = output.trim().split(/\s+/).length;
      const hasChecklist = /Checklist/i.test(output);
      const checkboxCount = (output.match(/^\s*-\s*\[\s*\]\s+/gm) || []).length;
      const reasons = [
        words > 250 ? "Too long; <= 250 words required." : null,
        hasChecklist ? null : "Missing 'Checklist'.",
        checkboxCount < 3 ? "Checklist must contain at least 3 '- [ ]' items." : null,
      ].filter(Boolean) as string[];
      return { ok: reasons.length === 0, reasons };
    }
    case "vscode": {
      try {
        const json = JSON.parse(output);
        // Accept either tasks.json-like shape or the simple planner shape
        let valid = validateVSCodeTasks(json);
        let reasons: string[] = [];
        if (!valid) {
          valid = validateVSCodeSimple(json) as boolean;
          reasons = valid
            ? []
            : [
                ...(validateVSCodeTasks.errors ?? []).map((e) => `tasks.json shape: ${ajv.errorsText([e])}`),
                ...(validateVSCodeSimple.errors ?? []).map((e) => `simple shape: ${ajv.errorsText([e])}`),
              ];
        }
        return { ok: !!valid, reasons };
      } catch {
        return { ok: false, reasons: ["Output is not valid JSON."] };
      }
    }
  }
}
