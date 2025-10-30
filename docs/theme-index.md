# Theme Index Authoring Guide

The wizard’s industry and interest catalogue lives in `client/src/data/themeIndex.ts`. Each entry captures how the product should talk about a given vertical: detection patterns, suggested follow-up questions, persona cues, tone, and signature voice snippets.

Use this guide when you add or adjust an entry.

## Schema overview

Each `ThemeConfig` requires:

- `id`: Unique string from the `ThemeId` union.
- `patterns`: Array of case-insensitive regex snippets (no surrounding slashes). At least one pattern is required.
- `recommendedQuestionIds`: Question IDs that should usually be asked for this persona.
- Optional fields:
  - `summaryHighlight`: Sentence fragment for the enhanced summary.
  - `focusAreas`: Additional summary bullet points.
  - `personaLabel`: Human-readable description (e.g. “clinical leads safeguarding patient outcomes”).
  - `toneDescriptors`: Words that capture the desired tone; surfaced in summaries and answer hints.
  - `voiceSnippets`: Short copy blocks the UI can quote.
  - `criticalQuestionIds`: Questions that must always appear for this theme.

All question IDs must exist in `wizardQuestions.ts`. The runtime validator throws a descriptive error during app startup and tests if IDs are missing or duplicates exist.

## Steps for adding a new theme

1. Pick a unique `id` and add it to the `ThemeId` union if it is brand new.
2. Add the entry inside `THEME_INDEX`:
   - Provide at least one high-quality regex pattern. Prefer specific nouns or phrases rather than single letters.
   - Fill in persona, tone, and voice metadata so the wizard’s responses feel human.
   - List `recommendedQuestionIds` and any `criticalQuestionIds` needed for that persona.
3. Run `npm --prefix client run test -- wizardQuestions`. Validation will fail fast if patterns are empty or questions are unknown.
4. If the persona introduces new behaviour, extend `wizardQuestions.spec.ts` with a prompt example to lock the copy.

## Tips

- Reuse existing question IDs whenever possible. If you need a new question, add it to `OPTIONAL_POOL` first.
- Keep `voiceSnippets` short (1–2 sentences) and grounded in language you want the UI to reuse verbatim.
- `toneDescriptors` should be lowercase adjectives (e.g. “assured”, “hopeful”).
- When in doubt about regex, test it quickly with `node` or an online tester before committing.

Following this process keeps the wizard’s responses tailored, consistent, and easy to extend without touching TypeScript logic.
