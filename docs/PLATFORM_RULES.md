# Platform prompt and output rules

This document summarizes the contracts we enforce for each target platform so outputs are reliably copy‑and‑go. The UI also shows these rules inline via the “Platform rules” toggle and validates pasted results.

Sources and rationale (with citations)
- Lovable: We enforce a pragmatic contract (raw TSX, default export, shadcn/ui, Tailwind) that aligns with Lovable’s guidance to think in systems, use component‑first prompting, and ship UI with real content. References:
  - Lovable Prompting Library: https://docs.lovable.dev/prompting/prompting-library
  - Best Practices: https://docs.lovable.dev/tips-tricks/best-practice
  - Debugging prompts: https://docs.lovable.dev/prompting/prompting-debugging
- Base 44: We default to an internal delivery template for implementation plans (Scope, Acceptance Criteria in Gherkin, Risks, Next Steps) for consistency. We additionally accept outputs shaped by Base44’s official prompt frameworks (Who/What/Why, User Story, Feature Breakdown) and layering techniques. References:
  - Prompting guide (Core principles, frameworks, techniques): https://docs.base44.com/Getting-Started/Prompt-guide
  - Prompt library (starter prompts, pathways, micro‑prompts): https://docs.base44.com/Getting-Started/Prompt-library
  - Quick start (AI chat, iteration): https://docs.base44.com/Getting-Started/Quick-start-guide
- Claude: There is no mandated output structure for critiques in the official docs. We use a concise critique followed by a checkbox checklist (3–7 items) because it’s highly actionable and easy to validate across tools. References:
  - Claude docs (intro): https://docs.claude.com/en/docs/intro
  - Anthropic Agent/Code docs (system prompts, output styles) were also reviewed locally to inform tone/structure choices.
- VS Code Agent: Based on official tasks.json conventions with a minimal subset validated; we also allow a simple planner JSON for quick planning. Reference:
  - VS Code tasks: https://code.visualstudio.com/docs/editor/tasks

Additional prompting frameworks reviewed (informing tone/structure)
- Rocket.new CLEAR framework (Concise, Logical, Explicit, Adaptive, Reflective) and prompting strategies/library: https://www.rocket.new/prompt-engineering/get-started-with-prompting

## Lovable

Output: One raw TSX component (no backticks)
- Must be a default exported function component
- Must import at least one shadcn/ui component from '@/components/ui/*'
- Must use Tailwind CSS className attributes
- No prose or comments; if unknowns exist, add TODO bullets at the bottom

Minimal example:

```tsx
import { Button } from '@/components/ui/button';
export default function LoginCard() {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-3">Login</h2>
      <form className="space-y-2">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" />
        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" />
        <Button type="submit">Sign in</Button>
      </form>
      <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
        <li>TODO: Wire submit handler</li>
      </ul>
    </div>
  );
}
```

## Base 44

Output: Markdown with exact H2 sections and Gherkin acceptance criteria
- Required H2s: “## Scope”, “## Acceptance Criteria”, “## Risks”, “## Next Steps”
- Acceptance Criteria: ≥ 2 items in Gherkin form (Given/When/Then)
- Delivery‑focused tone; avoid code blocks unless explicitly required

Alternate accepted shape (aligned with Base44’s frameworks)
- H2s: “## Who”, “## What”, “## Why”, and at least one of “## User Journey” or “## Feature Breakdown”
- This mirrors Base44’s Who/What/Why framework and encourages layered iteration (build in layers)
- Tip: You can still include Acceptance Criteria as bullets, but it’s optional in this shape

Minimal example:

```md
## Scope
Introduce feature flags to enable staged rollouts across FE/BE.

## Acceptance Criteria
- Given a flag, when enabled, then the new UI is visible to 10% of users
- Given a flag, when disabled, then the old UI is shown

## Risks
- Misconfiguration could expose features broadly

## Next Steps
1. Add SDK
2. Guard routes
3. Add audit logging
```

Alternate shape example (Who/What/Why + User Journey)

```md
## Who
Independent consultants tracking client work and deliverables.

## What
A simple portal to upload docs, track status, and capture client approvals.

## Why
Reduce context switching and missed deadlines; centralize client communications.

## User Journey
1. Users sign in
2. Create a new project
3. Upload a document and request approval
4. Track status on a dashboard and receive notifications
```

## Claude

Output: ≤ 250‑word critique followed by a checkbox checklist
- After critique, include a “Checklist:” header
- 3–7 items using “- [ ] ” checkboxes with imperative actions
- Neutral, specific, actionable tone; no code unless asked

Minimal example:

```md
The proposal is sound but lacks telemetry and rollback guidance.

Checklist:
- [ ] Add success metrics (adoption, error rate)
- [ ] Define rollback plan
- [ ] List owners and review cadence
```

Notes
- Our “<= 250 words + checklist” pattern is an internal convention inspired by Claude’s emphasis on concise instructions and structured, actionable outputs. It’s not an official requirement from Anthropic.

## VS Code Agent

Preferred output: tasks.json‑like JSON
- Shape: `{ "version": "2.0.0", "tasks": [{ "label", "type": "shell", "command", "problemMatcher"? }] }`
- 1–7 tasks, each with a shell command; optional args, options, group

Fallback output: simple planner JSON
- Shape: `{ "tasks": string[1..7], "notes": string }`

Minimal tasks.json example:

```json
{
  "version": "2.0.0",
  "tasks": [
    { "label": "Install deps", "type": "shell", "command": "npm ci" },
    { "label": "Build client", "type": "shell", "command": "npm --prefix client run build" }
  ]
}
```

Notes
- The UI can “Prettify JSON” and download a valid tasks.json or plan.json for your workspace.
- Validators live in `client/src/utils/validators.ts` and mirror these rules.
 - For strict tasks.json details, consult VS Code docs: https://code.visualstudio.com/docs/editor/tasks

Getting started guide
- For a step-by-step “beginner mode” prompt flow (Base44 chat + LLM template), see `docs/BEGINNER_PROMPT_FLOW.md`.
