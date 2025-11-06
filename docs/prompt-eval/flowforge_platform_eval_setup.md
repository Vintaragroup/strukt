# IMPLEMENT THIS: Platform-tailored Prompt Builder + Automated Eval Loop for Flowforge

## Context
Repo currently builds prompts via `client/src/utils/documentationPrompts.ts` (lines 4–66) using static “platform tailoring” headers + shared workspace snapshot.  
We need reliable **per-platform adapters** and a **validation/evaluation loop** that checks outputs (shape, tone, sections) and reports gaps.

## Goals
1. Add platform adapters with explicit headers for: `lovable`, `base44`, `claude`, `vscode`.
2. Build a prompt constructor that wraps: `<SYS> header </SYS> + <CONTEXT> workspace snapshot </CONTEXT> + <ASK> user request </ASK>`.
3. Add platform validators (regex/schema) and a tiny evaluation runner over “golden bundles”.
4. Wire a provider abstraction so each target can call its own model endpoint (stub initially).
5. Add a CI script that fails when any target’s output violates its rules.
6. Keep the old API surface intact; migrate usages from `documentationPrompts.ts` to the new builder.

---

## Deliverables (create/modify these files)

### 1) Platform config
**File:** `client/src/platforms.ts`
```ts
export type Target = "lovable" | "base44" | "claude" | "vscode";

export const PLATFORM_HEADERS: Record<Target, string> = {
  lovable: [
    "You are a Lovable.dev code generator.",
    "Output ONLY a single React component in TSX using shadcn/ui + Tailwind.",
    "Do not include explanations, comments, or backticks.",
    "If unknowns exist, add clearly marked TODOs at the bottom as a bullet list."
  ].join("\n"),
  base44: [
    "You are preparing a Base44 implementation plan.",
    "Produce: Title, Scope, Acceptance Criteria (Gherkin style), Risks, Next Steps.",
    "Output format MUST be valid Markdown with H2 headers for each section."
  ].join("\n"),
  claude: [
    "You are a product spec reviewer.",
    "Return a concise critique (<= 250 words) followed by a checklist.",
    "Tone: neutral, specific, actionable. No code unless asked."
  ].join("\n"),
  vscode: [
    "You are a VS Code Copilot task planner.",
    "Return a numbered list of atomic tasks (1–7 items), each with a shell command if applicable.",
    "Output MUST be valid JSON with fields: tasks[], notes.",
    "No prose outside JSON."
  ].join("\n"),
};

export const DELIMS = {
  sysOpen: "<SYS>",
  sysClose: "</SYS>",
  ctxOpen: "<CONTEXT>",
  ctxClose: "</CONTEXT>",
  askOpen: "<ASK>",
  askClose: "</ASK>",
};
```

### 2) Prompt builder
**File:** `client/src/utils/promptBuilder.ts`
```ts
import { PLATFORM_HEADERS, DELIMS, Target } from "../platforms";

export function buildPrompt(opts: {
  target: Target;
  workspaceMarkdown: string;
  userAsk: string;
}): string {
  const header = PLATFORM_HEADERS[opts.target];
  return [
    `${DELIMS.sysOpen}\n${header}\n${DELIMS.sysClose}`,
    `${DELIMS.ctxOpen}\n${opts.workspaceMarkdown}\n${DELIMS.ctxClose}`,
    `${DELIMS.askOpen}\n${opts.userAsk}\n${DELIMS.askClose}`
  ].join("\n\n");
}
```

### 3) Validators
**File:** `client/src/utils/validators.ts`
```ts
import Ajv from "ajv";
import type { Target } from "../platforms";
const ajv = new Ajv({ allErrors: true });

const vscodeSchema = {
  type: "object",
  required: ["tasks", "notes"],
  properties: {
    tasks: { type: "array", minItems: 1, maxItems: 7, items: { type: "string" } },
    notes: { type: "string" }
  },
  additionalProperties: false
};
const validateVSCode = ajv.compile(vscodeSchema);

export function validate(target: Target, output: string) {
  switch (target) {
    case "lovable":
      return {
        ok: !/```/.test(output) && /<\/?[A-Z][A-Za-z0-9]*/.test(output),
        reasons: [
          /```/.test(output) ? "Contains code fences; must be raw TSX." : null,
          !/<\/?[A-Z]/.test(output) ? "No JSX component detected." : null
        ].filter(Boolean)
      };
    case "base44":
      return {
        ok: /##\s*Scope/i.test(output) && /##\s*Acceptance Criteria/i.test(output),
        reasons: [
          /##\s*Scope/i.test(output) ? null : "Missing '## Scope'",
          /##\s*Acceptance Criteria/i.test(output) ? null : "Missing '## Acceptance Criteria'"
        ].filter(Boolean)
      };
    case "claude":
      return {
        ok: output.split(/\s+/).length <= 250 && /Checklist/i.test(output),
        reasons: [
          output.split(/\s+/).length > 250 ? "Too long; <= 250 words required." : null,
          /Checklist/i.test(output) ? null : "Missing 'Checklist'."
        ].filter(Boolean)
      };
    case "vscode":
      try {
        const json = JSON.parse(output);
        const valid = validateVSCode(json);
        return { ok: !!valid, reasons: valid ? [] : (validateVSCode.errors ?? []).map(e => ajv.errorsText([e])) };
      } catch {
        return { ok: false, reasons: ["Output is not valid JSON."] };
      }
  }
}
```

### 4) Evaluation runner
**File:** `client/src/eval/runEval.ts`
```ts
import { buildPrompt } from "../utils/promptBuilder";
import { validate } from "../utils/validators";
import type { Target } from "../platforms";

type Bundle = { name: string; workspaceMarkdown: string; userAsk: string };
type Provider = { generate(prompt: string): Promise<string> };
type Providers = Record<Target, Provider>;

// TODO: replace stubs with real integrations
export const providers: Providers = {
  lovable: { async generate(p) { throw new Error("Wire Lovable provider"); } },
  base44: { async generate(p) { throw new Error("Wire Base44 provider"); } },
  claude:  { async generate(p) { throw new Error("Wire Claude provider"); } },
  vscode:  { async generate(p) { throw new Error("Wire VS Code agent"); } },
};

export async function runEval(targets: Target[], bundles: Bundle[]) {
  const results: Array<{target: Target; bundle: string; ok: boolean; reasons: string[]; sample: string}> = [];
  for (const target of targets) {
    for (const b of bundles) {
      const prompt = buildPrompt({ target, workspaceMarkdown: b.workspaceMarkdown, userAsk: b.userAsk });
      const output = await providers[target].generate(prompt);
      const v = validate(target, output);
      results.push({ target, bundle: b.name, ok: v.ok, reasons: v.reasons as string[], sample: output.slice(0, 800) });
    }
  }
  return results;
}
```

### 5) CI script
**File:** `scripts/eval-ci.ts`
```ts
import { runEval } from "../client/src/eval/runEval";

async function readRaw(path: string) {
  const fs = await import("fs/promises");
  return fs.readFile(path, "utf8");
}

(async () => {
  const bundles = [
    {
      name: "auth-form",
      workspaceMarkdown: await readRaw("./eval/bundles/auth-form.md"),
      userAsk: "Generate a login page component with email+password and submit handler."
    },
    {
      name: "roadmap",
      workspaceMarkdown: await readRaw("./eval/bundles/roadmap.md"),
      userAsk: "Create a Base44 implementation plan to roll out feature flags."
    }
  ];

  const targets = ["lovable","base44","claude","vscode"] as const;
  const res = await runEval(targets as any, bundles);

  console.table(res.map(r => ({
    target: r.target, bundle: r.bundle, ok: r.ok, reasons: r.reasons?.join("; ")
  })));

  const failures = res.filter(r => !r.ok);
  if (failures.length) process.exit(1);
})();
```

---

## Dependencies & scripts
```json
{
  "scripts": {
    "eval": "ts-node --transpile-only scripts/eval-ci.ts"
  },
  "devDependencies": {
    "ajv": "^8.17.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

---

## Acceptance Criteria
- `npm run eval` prints validation table and fails on any invalid output.
- `documentationPrompts.ts` replaced with builder usage.
- Validators catch per-platform errors.
- TypeScript passes lint checks.
