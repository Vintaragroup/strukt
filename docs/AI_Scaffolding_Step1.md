# Strukt Node Flow Upgrade – Step 1 Notes

## Summary
- Added `client/src/types/ai.ts` to define the shared shapes for AI-suggested nodes, edges, and user feedback.
- Captured the exact type signatures required for future `suggestStartNodes`, `suggestNextNodes`, and `submitFeedback` integrations.

## Next Steps
- Layer these types into the UI state once the suggestion panels are scaffolded.
- Connect feedback capture points to emit `FeedbackInput` payloads when backend wiring is ready.

---

## Step 2: Mock AI Service
- Introduced `client/src/services/aiSuggestions.ts` with mocked responses for start and next node suggestions, plus a feedback logger.
- Wrapped replies in small timeouts to mimic network latency and left TODO hooks for the eventual backend API.

### Follow-up
- Toggle `VITE_MOCK_AI_SUGGESTIONS` once real endpoints land so the service can branch accordingly.
- Wire the upcoming suggestion panels to call `suggestStartNodes`, `suggestNextNodes`, and route user reactions through `submitFeedback`.

---

## Step 3: Start Wizard Modal
- Added `client/src/components/StartWizard.tsx` to capture the user idea and display mocked start-node suggestions inline.
- Calls the mock `suggestStartNodes` helper, handles basic loading/error UI, and lets users accept individual or all suggestions.

### Follow-up
- Connect the wizard’s `onAccept` handler to insert suggested nodes and close out the onboarding overlay flow.
- Style sync: align modal visuals with the existing design system components once the UI polish pass begins.

---

## Step 4: Suggestion Panel
- Created `client/src/components/SuggestionPanel.tsx`, a floating sidebar that fetches next-step ideas for the currently focused node.
- Hooks into `suggestNextNodes` and routes “wrong path” clicks through `submitFeedback`, with lightweight error handling and loading indicators.

### Follow-up
- Mount the panel in `App.tsx` alongside node focus/selection events so users see suggestions contextually.
- Replace temporary button styling with shared UI variants during the polish phase.

---

## Step 5: Canvas Integration
- Wired `StartWizard` and `SuggestionPanel` into `App.tsx`, opening the wizard for empty workspaces and surfacing contextual suggestions for the selected node.
- Added `applySuggestions` helper in `utils/graphOps.ts` to translate AI outputs into new nodes/edges and trigger radial re-layout.
- `handleAcceptSuggestions` now updates the graph, runs the radial layout/relaxation pipeline, and targets the most recent AI-generated node for follow-up suggestions.

### Follow-up
- Harden `applySuggestions` once backend edges are available (handle suggestion-provided relationships and deduping by label).
- Explore persisting wizard dismissal so returning users can skip the AI prompt on empty canvases if they prefer a manual start.

---

## Step 6: Visual Cues & Feedback
- Added an inline “+ Suggest Next” ghost button on selected nodes via `CustomNode.tsx`, piping through to the suggestion panel trigger.
- Extended `NodeContextMenu` with a “Mark as Incorrect Suggestion” action that dispatches `submitFeedback` alongside the node’s context.

### Follow-up
- Consider surfacing a confirmation toast or badge on the node after feedback so users know it was recorded (for collaborative sessions too).
- When backend suggestions arrive, feed real suggestion identifiers into the feedback payload instead of relying on labels.

---

## Step 7: Welcome Modal & Navigation Entry
- Embedded the Start Wizard prompt directly inside `EmptyState`, replacing the manual “Add first node” CTA with Generate/Add-All actions tied to `suggestStartNodes`.
- Added a dedicated AI Builder icon to the toolbar so users can launch the full-screen wizard on demand.

### Follow-up
- Reset or persist the idea text when reopening the wizard so returning users can resume their last draft if needed.
- Evaluate whether the auto-open wizard should remain once the welcome modal captures the same flow.

---

## Step 8: Backend AI Integration
- Replaced client mock calls with real `/api/wizard`, `/api/suggestions`, and `/api/feedback` endpoints; session/workspace IDs now flow end to end.
- Wired server-side OpenAI prompts (with fallback heuristics) so wizard intake and follow-up suggestions generate domain-aware nodes stored in Mongo.
- Suggestions are persisted with `ADD_NODE` actions, letting the client apply them with canonical IDs while logging feedback for continuous tuning.

### Follow-up
- Refine prompts to incorporate feedback flags and prevent repeated ideas once nodes are accepted.
- Extend suggestion actions to include edge creation once the backend supports LINK-type commits.
