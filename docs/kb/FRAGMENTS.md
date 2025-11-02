# KB Fragments Guide

Fragments are small, reusable content blocks that eliminate duplication across PRDs and ensure consistent, high-quality guidance. They are stored under `server/src/data/prd_kb/fragments/**` and referenced during deterministic composition by type, domain, and tags.

## Fragment categories

- acceptance_criteria: Checklist-style outcomes for a feature or capability.
- kpi_sets: Domain-specific KPIs with target ranges (e.g., security, streaming, API performance).
- interface_patterns: Common interface behaviors and guardrails (e.g., webhook verification, pagination).
- ux_states: User-facing state blueprints (loading, empty, error, success, disabled).
- risk_mitigation: Known risks with mitigation steps and operational runbooks.
- decision_matrices: Criteria and weights to support platform or architectural choices.
- onboarding_flows: Lifecycle steps for onboarding/activation with product-led growth hooks.

## File structure and schema

Each fragment is a JSON file with the following shape:

```
{
  "id": "<unique_fragment_id>",
  "type": "<category>",           // one of: acceptance_criteria | kpi_set | interface_pattern | ux_states | risk_mitigation | decision_matrix | onboarding_flow
  "for": ["<scopes>", ...],       // scopes like: domain | backend | frontend | requirement
  "content": <object_or_array>     // structured content consumed by the composer
}
```

Examples:

- Decision matrix (cloud provider): `server/src/data/prd_kb/fragments/decision_matrices/cloud_provider_selection.json`
- Onboarding flow (user lifecycle): `server/src/data/prd_kb/fragments/onboarding_flows/user_lifecycle.json`
- Interface pattern (webhook verification): `server/src/data/prd_kb/fragments/interface_patterns/webhook_verification.json`
- KPI set (security & compliance): `server/src/data/prd_kb/fragments/kpi_sets/security_compliance.json`

## Selection rules (deterministic)

- Scope match: Only include fragments whose `for` contains at least one of the request scopes (e.g., node_types or domains).
- Category match: Choose categories relevant to the composition intent (e.g., payments → interface_patterns:webhooks + kpi_sets:billing).
- Tag/keyword match (optional): If tags are present, prefer fragments whose ID or file path suggests higher relevance.
- Priority and stability: Prefer specific fragments (e.g., `pattern_webhook_verification_v1`) over generic ones.

## De-duplication and ordering

- De-dup by fragment `id`. If multiple PRDs request the same fragment, include once.
- Order fragments by deterministic priority: category weight → name → stable timestamp to ensure stable outputs.

Suggested category priority (highest to lowest):
1. decision_matrices
2. interface_patterns
3. onboarding_flows
4. acceptance_criteria
5. kpi_sets
6. ux_states
7. risk_mitigation

## Versioning and naming

- IDs should end with a version suffix (e.g., `_v1`).
- New revisions should create a new file with `_v2`, not overwrite `_v1`, to preserve reproducibility.

## Quality guidelines

- No placeholders (e.g., "TBD", "Lorem ipsum").
- Use concrete thresholds for KPIs and SLAs.
- Keep content self-contained and vendor-neutral where possible; add vendor-specific variants when necessary.
- Keep fragments small and focused; break up large patterns into smaller, composable pieces.

## Examples in this repo

- Decision matrix: `decision_matrices/cloud_provider_selection.json`
- Onboarding flow: `onboarding_flows/user_lifecycle.json`
- Interface pattern: `interface_patterns/webhook_verification.json`
- KPI set: `kpi_sets/security_compliance.json`

These enable consistent, reusable guidance across PRDs like payments (Stripe/Lemon Squeezy), identity & onboarding, and cloud provider selection.
