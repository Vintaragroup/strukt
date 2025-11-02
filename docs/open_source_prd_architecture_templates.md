# Open-Source PRD & Architecture Template Collection

This document lists 20+ open-source repositories and resources for Product Requirements Documents (PRDs), architecture documentation, and software design templates.
Each entry includes: source, domain/stack focus, format, license note, and fit summary.

---

| # | Source | Domain / Stack Focus | Format | License | Notes |
|---|--------|----------------------|--------|---------|-------|
| 1 | [priankr/prd‑templates](https://github.com/priankr/prd-templates) | Generic PRD templates | Markdown | Open (check LICENSE) | Multiple templates covering goals, success metrics, and non‑functional requirements. |
| 2 | [bflorat/architecture‑document‑template](https://github.com/bflorat/architecture-document-template) | Architecture (SOA/microservices) | AsciiDoc + YAML | MIT | Views: app, dev, infra, security; detailed non‑functional coverage. |
| 3 | [microsoft/MLOpsTemplate](https://github.com/microsoft/MLOpsTemplate) | Data/ML pipelines (Azure) | Markdown | MIT | MLOps lifecycle, CI/CD, deployment & monitoring. |
| 4 | [NagoDede/MarkSpecs](https://github.com/NagoDede/MarkSpecs) | Requirements framework | Markdown | BSD‑2‑Clause | Multi‑file Markdown; structured requirements spec. |
| 5 | [bhnm‑rz/MarkdownSoftwareEngineering](https://github.com/bhnm-rz/MarkdownSoftwareEngineering) | Requirements & Design | Markdown | Open | Templates for analysis and design docs. |
| 6 | [MorganMarshall/PRD](https://github.com/MorganMarshall/PRD) | Product Requirements Document | Markdown | MIT | Includes overview, objectives, key features, technical notes. |
| 7 | [opulo‑inc/prd‑template](https://github.com/opulo-inc/prd-template) | Simple PRD template | Markdown | Open | Concise: Overview, Goals, Non‑Goals, Audience. |
| 8 | [imayobrown/DesignDocumentTemplates](https://github.com/imayobrown/DesignDocumentTemplates) | Design documentation | Markdown | MIT | Lightweight design docs; adaptable to architecture. |
| 9 | [adr/madr](https://github.com/adr/madr) | Architecture Decision Records | Markdown | MIT / CC0‑1.0 | For decision tracking and architectural rationale. |
| 10 | [Gabriel‑Pink/project‑blueprint‑template](https://github.com/Gabriel-Pink/project-blueprint-template) | Project planning + architecture | Markdown | Open | Combines goals, design, testing, and deployment planning. |
| 11 | [Bravo19er/md‑tools‑mobile](https://github.com/Bravo19er/md-tools-mobile) | Mobile-friendly templates | Markdown | MIT | Good starting point for React Native or mobile apps. |
| 12 | [markdown‑templates](https://github.com/markdown-templates) | Markdown doc collection | Markdown | Various | Generic doc/snippet library for customization. |
| 13 | [thoughtworks/mlops‑platforms](https://github.com/thoughtworks/mlops-platforms) | MLOps platform matrix | Markdown | Open | Comparative MLOps structures; good data ops patterns. |
| 14 | [pengqun/awesome‑documentation](https://github.com/pengqun/awesome-documentation) | Curated doc tools/templates | Markdown | CC0‑1.0 / MIT | Meta-list of documentation resources. |
| 15 | [darkisildur/ai‑prd‑creation](https://github.com/darkisildur/ai-prd-creation) | AI‑generated PRD automation | Markdown | Open | Templates + workflows for automated PRD generation. |
| 16 | [docs.driesventer.com/markdown_document_templates](https://docs.driesventer.com/markdown_document_templates/) | Architecture & engineering templates | Markdown | Open | Organized architecture document outlines. |
| 17 | [jam01/SRS‑Template](https://github.com/jam01/SRS-Template) | Software Requirements Spec | Markdown | MIT | Full SRS covering functional/non‑functional & interfaces. |
| 18 | [cwe1ss/microservices‑template](https://github.com/cwe1ss/microservices-template) | Microservices (.NET/Azure) | Markdown | MIT | Infrastructure and architecture docs for microservices. |
| 19 | [Equal Experts – MLOps Playbook v3.1](https://www.equalexperts.com/wp-content/uploads/2022/05/MLOPS_Playbook_v3.1.pdf) | MLOps lifecycle | PDF | Open | Detailed operational playbook for ML systems. |
| 20 | [t851029v2/gist PRD Template](https://gist.github.com/t851029v2/baffbfe732be90b631222380e12506ae) | Simple PRD example | Markdown | Open | Short PRD example with overview, author, version fields. |

---

### Suggested Next Steps
- Clone these repositories or fetch raw Markdown files for ingestion.  
- Use the PRD ingestion script (from `codex_prd_ingestion_prompt.md`) to:
  - Fetch + normalize templates
  - Extract heading structure
  - Map to JSON schema fields (`overview`, `requirements`, `non_functional`, etc.)
  - Store results under `server/src/data/prd_templates/`.

---

### License Reminder
Each repo has its own license; verify before redistribution or embedding.  
Most listed projects use **MIT**, **CC0**, or similar permissive licenses.
