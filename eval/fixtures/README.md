# Eval fixtures (golden outputs)

Store curated, human-reviewed outputs here for each bundle and platform.

Suggested layout:

```
./eval/fixtures/
  <bundle-id>/
    lovable.tsx       # Raw TSX component (no fences)
    base44.md         # Markdown plan with exact H2s and Gherkin AC
    claude.md         # Critique + Checklist with - [ ] items
    vscode.tasks.json # tasks.json preferred shape, or vscode.plan.json for fallback
```

Tips
- Generate prompts in the app, paste assistant outputs into the Result pane to validate, then save here.
- Keep outputs concise and representative; update when rules evolve.
