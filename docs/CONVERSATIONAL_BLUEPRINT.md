# Conversational Blueprint Rollout

This plan outlines how Strukt will gather a founder's idea through a light, conversational flow, auto-grow the workspace into a complete system map, and hand that map to the AI enrichment pipeline for final documentation.

## 1. Experience Narrative

1. **Welcome card (existing center node, `client/src/App.tsx:575`):**
   - Replace the secondary CTA with a conversational card that asks: _"What are you building?"_
   - Provide three quick chips to nudge structured input (Problem, Audience, Success signal).
   - Persist the response into new center-node fields (`coreIdea`, `coreProblem`, `coreOutcome`).

2. **Progressive questions:**
   - Trigger follow-ups only after the first answer. Each prompt maps to a specific metadata slot:
     - _"Who is this for first?"_	0captures `primaryAudience`.
     - _"What must launch in version one?"_	0captures `launchScope`.
     - _"What could block us?"_	0captures `primaryRisk` (optional).
   - Render each answer immediately on the canvas (e.g., persona chips beneath the center node) so users see momentum without navigating forms.

3. **Guided completion indicator:**
   - As soon as the core trio (audience, launch scope, success signal) is captured, surface a banner: _"Blueprint ready. Generate the detailed plan when you're satisfied."_
   - Hook this to the enrichment trigger (see section 4).

## 2. Data Model Extensions

- **Center node metadata** (`CenterNodeData` in `client/src/components/CenterNode.tsx`): add optional fields `coreIdea`, `coreProblem`, `coreOutcome`, `primaryAudience`, `launchScope`, `primaryRisk`.
- **Workspace persistence** (`server/src/models/Workspace.ts`): extend node schema to store the same keys plus an `intentCapturedAt` timestamp so autosave keeps state between sessions.
- **Compose input** (`server/src/services/KBService.ts`): accept new filters `audiences`, `outcomes`, `risks`. Downstream, merge them into the staged matching so PRDs tagged with similar personas or KPIs rank higher when node/domain metadata is sparse.

## 3. Auto-Expansion Rules

Once the conversational card captures specific fields, generate nodes automatically:

| Captured Field | New Node Type | Template | Metadata fed into KB |
| -------------- | ------------- | -------- | -------------------- |
| `primaryAudience` | Persona | `personaSnapshot` | node tags include persona + domain |
| `coreOutcome` | KPI | `okrCard` | tags include outcome keywords; domains derived from center node |
| `launchScope` | Launch Plan | `launchChecklist` | tags include scope keywords; risk fragments enabled |
| `primaryRisk` (optional) | Risk Mitigation | `operationsRunbook` | risk fragments seeded, triggers risk-focused KB filters |

Generation pipeline:
1. Update the center node via `onUpdateCenterNode`; emit a Redux (or local state) action that writes to the workspace state tree.
2. A watcher observes new metadata and calls `addSystemNode()` with the corresponding template. To avoid duplicates, store a flag (`autoNodes.spawned`) keyed by metadata type.
3. Newly created nodes inherit tags/domains from the center node plus specific keywords (persona, KPI, etc.) so `kbService.compose` retrieves relevant PRDs/fragments on first render.

## 4. AI Enrichment Handoff

- **Readiness check:** mark the workspace as `blueprintReady` when the auto-expansion rules have produced persona, KPI, and launch nodes. Persist this flag in the workspace document (`workspace.status.blueprintReady`).
- **Trigger UI:** show a single primary CTA (`Generate detailed plan`) when `blueprintReady === true`. Clicking it calls the existing card generation endpoint but now passes:
  - Center node metadata
  - IDs of the auto-generated persona/KPI/launch nodes so the AI can reference them explicitly
  - Provenance metadata (which prompt produced which field) for audit trails.
- **Output artifacts:** the enrichment routine produces markdown specs, requirements docs, and checklists, stored exactly where current generation output lives. Add a provenance section referencing the conversational inputs ("Source: Idea kickoff prompt, captured Nov 4 2025").

## 5. Integration Tasks

1. **UI wiring**
   - Implement the conversational prompt card (`client/src/components/CenterNode.tsx`, `client/src/App.tsx`).
   - Add state management for the new metadata fields and follow-up prompts.
2. **Auto-node creation**
   - Extend the node creation utilities (`client/src/components/AddNodeModal.tsx`, `client/src/App.tsx` handlers) to support automated spawns and deduping.
3. **Server schema & KB filters**
   - Update workspace model and migration logic; ensure autosave persists new fields.
   - Thread the metadata into `kbService.compose` filters and provenance.
4. **Enrichment update**
   - Modify `server/src/services/cards/cardComposer.ts` & `GenerationService.ts` to incorporate the new metadata when forming prompts.
5. **Testing & validation**
   - Add client integration tests for the conversational flow (React Testing Library or existing harness).
   - Extend KB service tests to cover the new persona/outcome filters.
   - Verify end-to-end by simulating a user session and generating final docs.

Delivery of this plan unblocks implementation while keeping the user-facing experience approachable for non-technical founders.
