# Platform evaluation and validation

This doc explains how we validate platform prompts/outputs and how to extend the evaluation set.

## What gets validated

- Prompt structure: `<SYS>`, `<CONTEXT>`, `<ASK>` blocks present (UI shows a badge per tab).
- Output rules by platform (see `client/src/utils/validators.ts`):
  - Lovable: raw TSX, default exported function, shadcn/ui import from `@/components/ui/*`, Tailwind className usage, no fences.
  - Base 44: H2 sections (Scope, Acceptance Criteria, Risks, Next Steps) and ≥2 Gherkin items.
  - Claude: ≤250 words + `Checklist:` section with 3–7 `- [ ]` items.
  - VS Code Agent: tasks.json preferred schema or `{ tasks: string[], notes: string }` fallback JSON.

The Documentation Preview UI includes a Result pane per platform to paste results and see validation status. For VS Code, you can prettify JSON and download a valid `tasks.json` (or `plan.json`).

## Running the CI-friendly eval locally

```bash
npm run eval
```

This runs `scripts/eval-ci.ts`, which:
- Loads sample bundles from `eval/bundles/`
- Builds prompts for each target
- Uses mock providers to return compliant sample outputs
- Validates outputs and prints a pass/fail table

## Adding more bundles

1. Drop a new Markdown file into `eval/bundles/` (e.g., `checkout-flow.md`).
2. Edit `scripts/eval-ci.ts` to import/read the new bundle and append it to the bundles array.
3. Optionally adjust mock providers in `client/src/eval/runEval.ts` if you want different sample outputs.
4. Run `npm run eval` to verify all targets pass on all bundles.

## Extending validation

- To make rules stricter/looser, update `client/src/utils/validators.ts`.
- To change platform headers (system rules), update `client/src/platforms.ts`.
- To tweak the per-target ask, update `client/src/utils/documentationPrompts.ts`.

## CI integration

- The project script `npm run eval` is suitable for CI. Add it to your CI workflow and fail on any target/bundle validation error to prevent regressions.
