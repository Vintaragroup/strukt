---
title: Strukt PRD Knowledge Base Strategy
description: Plan for generating, structuring, and maintaining an internal PRD knowledge base to drive deterministic node drafting before AI polishing.
created_at: 2025-10-31
---

# Strukt PRD Knowledge Base Strategy

## Objectives
- Produce a curated library of high-quality PRDs that cover the breadth of Strukt node types, domains, and card sections.
- Generate deterministic drafts for node cards directly from this knowledge base, reserving GPT-4o-mini for polishing/refinement.
- Maintain versioned, auditable content that we can “lock” for consistency while still allowing structured updates.

## Scope
1. **Taxonomy Definition** — map node types + domains to canonical PRD sections.
2. **Template Generation** — synthesize master PRDs using GPT-5 and internal prompts.
3. **Knowledge Base Structure** — convert GPT output into normalized JSON with metadata, tags, embeddings.
4. **Composer Pipeline** — build deterministic generation logic using the KB, then optionally call GPT to refine.
5. **Governance & Tooling** — version control, validation, update workflow, and integration with the existing Strukt pipeline.

## 1. Taxonomy Definition
| Node Type | Domain | Required Sections | Optional Sections | Tags/Signals |
|-----------|--------|-------------------|-------------------|--------------|
| `frontend` | Product/Tech | Overview, User Goals, Architecture, Interfaces, UX States, Accessibility, Testing | Localization, Analytics | `frontend`, `react`, `ui`, `ux` |
| `backend` | Tech | Overview, Architecture, Data Model, Interfaces/API, Deployment, Operations, Risks | Scalability, Security | `backend`, `api`, `microservices` |
| `requirement` | Product/Business/DataAI/Ops | Overview, Objectives, KPIs, Acceptance Criteria, Dependencies, Risks | Rollout Plan, Compliance | `requirements`, `product`, `metrics` |
| `doc` | Business/Product | Overview, Personas, Value Proposition, Market Context, Competitive Landscape, Risks | Financials, Roadmap | `business`, `marketing`, `analysis` |
| `domain` | Mixed | Domain Overview, Key Teams, Governance, Tooling, Integration Points | KPIs, Change Management | `domain`, `governance`, `ops` |

> Define canonical card templates per node type with section ordering so every generated PRD maps directly to existing cards (`technicalSpec`, `businessCase`, etc.).

## 2. Template Generation with GPT-5
- **Prompt Library:** create high-level prompts for each (node type, domain) combination. Each prompt includes:
  - Node context structure (summary, tags, dependencies).
  - Section definitions with explicit instructions (length, bullet tables, metrics).
  - Terminology constraints (use Strukt-specific naming, avoid placeholders).
  - Example excerpt of the desired tone and detail to steer GPT-5.
- **Workflow:**
  1. Assemble a base prompt with taxonomy details and any upstream data (tech stack, domain notes).
  2. Send to GPT-5 (temperature ~0.4, top_p 0.8) to produce a master PRD per combination.
  3. Capture raw markdown + metadata (confidence, tokens).
  4. Post-process to enforce headings (H2/H3), convert tables to consistent format, align with Strukt sections.
  5. Store the original prompt + response for traceability.
- **Coverage Goal:** at least 5 variations per node type/domain to introduce diversity (e.g., backend API, event-driven service, ML pipeline, e-commerce backend).

## 3. Knowledge Base Structure
```
server/src/data/prd_kb/
  ├─ catalog.json              # index with category, tags, version
  ├─ embeddings/
  │   └─ <slug>.json           # vector embedding + metadata
  ├─ prds/
  │   └─ <slug>.json           # normalized PRD (schema below)
  └─ raw/
      └─ <slug>.md             # original GPT-5 markdown
```

**Normalized PRD Schema**
```json
{
  "id": "backend_api_service_v1",
  "name": "Backend API Service PRD",
  "version": "1.0.0",
  "node_types": ["backend"],
  "domains": ["Tech"],
  "sections": [
    {
      "title": "Overview",
      "key": "overview",
      "content": "...",
      "card_templates": ["technicalSpec"],
      "tags": ["goals", "summary"]
    },
    {
      "title": "Architecture",
      "key": "architecture",
      "content": "...",
      "card_templates": ["technicalSpec"],
      "tags": ["architecture", "services"]
    }
  ],
  "stack_keywords": ["nodejs", "graphql", "postgres"],
  "risk_profile": ["scalability", "security"],
  "kpi_examples": ["P95 latency < 250ms"],
  "generated_by": {
    "model": "gpt-5",
    "prompt_template": "backend_general_v1",
    "timestamp": "2025-10-31T12:00:00Z"
  }
}
```

**Embeddings:** Use OpenAI text-embedding-3-large (or local vector model) per section for semantic retrieval.

## 4. Composer Pipeline
1. **Input:** Node data, selected card template, tags, relationships.
2. **Retrieval:**
   - Query by node type + domain.
   - Use tags / stack hints to weight matching PRDs.
   - Use embeddings to find the best section per card section.
3. **Mapping:**
   - For each card section, merge the top PRD section + adjust placeholders (`{{NODE_LABEL}}`, `{{STACK}}`).
   - Insert context-specific details (node summary, related nodes) via string templates.
4. **Refinement (optional):**
   - Provide the composed markdown and metadata to GPT-4o-mini to polish wording & fill small gaps. Include instructions to respect structure.
   - If GPT call fails, keep the deterministic copy.
5. **Output:** card sections, suggested checklist updates, accuracy metrics (confidence based on match weighting, GPT success, etc.).

## 5. Governance & Tooling
- **Versioning:** store normalized PRDs in Git; include a `kb_version.json` to signal locked releases.
- **CLI Automation:** extend existing ingestion script or build `scripts/build-prd-kb.ts` to:
  - Run GPT-5 prompts.
  - Normalize output.
  - Generate embeddings.
  - Update catalog and index.
- **Validation:** lint for required sections, length thresholds, placeholder usage.
- **Release Process:**
  1. Draft prompts & run GPT-5 generation in staging.
  2. Review PRDs manually, approve, and merge.
  3. Tag release (e.g., `kb-v2025-11`).
  4. Update composer service to target new KB version.

## 6. Next Steps
1. Finalize taxonomy tables and card-to-section mapping.
2. Create GPT-5 prompt templates + sample outputs; iterate until quality meets “80% ready” standard.
3. Implement KB builder script (fetch/generate, normalize, embed, index).
4. Modify `composeCardContent` flow to consume KB data before calling GPT.
5. Add unit tests for retrieval + mapping to ensure deterministic behavior.

Once this pipeline is in place, Strukt can generate high-fidelity requirements directly from our locked knowledge base, with GPT providing a final polish rather than the core content.
