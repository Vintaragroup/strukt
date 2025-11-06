# Beginner prompt flow: Base44 and LLMs

This guide gives you two copy-and-go paths:

- Base44 chat flow (beginner friendly): short, plain-English prompts using Base44’s frameworks (Who/What/Why, User Journey, Feature Breakdown), with step-by-step iteration.
- LLM generator flow (advanced): a structured SYS/CONTEXT/ASK prompt that returns a delivery plan using exact H2 sections with Gherkin Acceptance Criteria.

Use whichever matches your comfort level. You can switch between them anytime.

## Base44 chat flow (paste directly in Base44)

Paste Step 1 as a first message, then continue with Steps 2–4. Keep messages short; iterate in layers.

Step 1 — Who / What / Why

Copy, then edit the bracketed parts:

```
WHO: [e.g., individual and institutional users managing tokenized commodity assets]
WHAT: [a Commodities Lab app to tokenize assets, manage custody, and trade on-chain]
WHY: [secure asset management, transparent auditability, and liquidity]
```

Step 2 — User Journey (start-to-finish path)

```
USER JOURNEY:
1) Sign up and complete KYC
2) Connect or create custodial wallet
3) Tokenize asset (form + docs)
4) View portfolio and token details
5) Trade or transfer
6) Monitor transactions and alerts
```

Step 3 — Feature Breakdown (layered)

```
FEATURE BREAKDOWN:
- Asset Tokenization: intake form, document upload, metadata, token minting
- Core API Service: REST/GraphQL for assets, OIDC auth, audit logs, observability
- Authentication: OIDC login, sessions, roles (user/admin), rate limits
- Data Storage: assets, transactions, users; retention & PII minimization
- Transaction Monitoring: RED metrics, p95 latency < 250ms, actionable alerts
```

Step 4 — Iterate in layers

```
Let’s build in layers:
1) Start with Auth + Portfolio view
2) Add Tokenization forms and flows
3) Add Trading and monitoring
Use real content. Keep edits scoped. Don’t touch out-of-scope areas.
```

Tips
- Speak in plain language and describe “what,” not “how.”
- Ask for small changes and iterate. Group changes when related.
- Reference styles you like (e.g., “feel like Notion”).

## LLM generator flow (SYS/CONTEXT/ASK)

Use this when you want a concise implementation plan you can share or adapt. Paste this into your LLM (Claude/OpenAI). Replace the CONTEXT block with your workspace doc.

```
<SYS>
You are preparing a Base 44 implementation plan.
Output MUST be valid Markdown. Use EXACT H2 headers: ## Scope, ## Acceptance Criteria, ## Risks, ## Next Steps.
Acceptance Criteria MUST be written in Gherkin style with at least 2 items (Given/When/Then).
Do not include a title above the H2 sections. Do not restate the context. No code unless explicitly required.
</SYS>

<CONTEXT>
Paste your workspace blueprint here (between markers). Keep it as-is.
<<<BEGIN DOC>>>
[your content]
<<<END DOC>>>
</CONTEXT>

<ASK>
Produce a delivery-focused plan in Markdown with the four H2 sections above. Be concise.
</ASK>
```

Why two paths?
- Base44 chat is best for building and editing in the tool itself—clear user journey, small iterations, and layered prompts.
- LLM generator gives you a standardized plan (Scope/AC/Risks/Next Steps) you can copy into docs or hand off. Our validator ensures it’s copy-and-go.

Troubleshooting
- Output contains a title or restates context: ask the LLM “Don’t include a top-level title or restate the context; only the four H2 sections.”
- Acceptance Criteria not in Gherkin: “Rewrite AC as Given/When/Then with at least two items.”
- Too verbose: “Keep each section to 3–6 bullets. Remove duplication.”

Related
- See Platform rules: docs/PLATFORM_RULES.md
- Base44 prompting guide (core principles, frameworks, layering): https://docs.base44.com/Getting-Started/Prompt-guide
