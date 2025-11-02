# Strukt PRD Knowledge Base (KB)

This directory defines the structure, schema, and initial seed assets for the PRD Knowledge Base described in `docs/prd_knowledge_base_strategy.md`.

## Layout
```
server/src/data/prd_kb/
  catalog.json
  embeddings/
  prds/
  raw/
  fragments/
```

- `catalog.json`: index of available PRDs and file references.
- `prds/`: normalized PRD JSONs adhering to `normalized_prd.schema.json`.
- `raw/`: original markdown used to produce the normalized PRD.
- `embeddings/`: section-level embedding stubs. Vectors are intentionally empty in this foundation.
- `fragments/`: reusable micro-fragments to avoid duplication (acceptance_criteria, kpi_sets, interface_patterns, ux_states, risk_mitigation).

## Schema
See `docs/kb/normalized_prd.schema.json` for the canonical JSON Schema used to validate items under `prds/`.

## Versioning
`docs/kb/kb_version.json` signals a released/locked set of PRDs. Tag KB releases (e.g., `kb-v2025-11`).

## Using the KB (no code changes)
- Tools may load files directly off disk using the paths in `catalog.json`.
- Deterministic composition can map node type/domain to a PRD, then to section keys that align with card templates.
- If you need DB import, use external tooling (e.g., `mongoimport`) to insert these documents without touching code.

## Next steps
- Fill embeddings with real vectors during a KB build step.
- Expand PRDs to cover more node types/domains.
- Add validation in CI to enforce the schema.
