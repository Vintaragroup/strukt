# Codex Prompt: Generate a PRD/Architecture Template Ingestion CLI for Strukt

**Goal:** Build a Python CLI that fetches open‑source PRD/architecture templates from a list of URLs, normalizes and converts them (Markdown/AsciiDoc/PDF/HTML/JSON), extracts headings/sections, maps them to a common JSON schema for **Strukt**, and writes JSON artifacts to `server/src/data/prd_templates/` (plus `_raw` copies for traceability).

---

## Functional Requirements

### Language & Tooling
- **Python** 3.10+
- **CLI** with `typer` (fallback: `argparse`)
- Fetching: `requests` with retries/backoff + custom User‑Agent
- Parsing/Conversion:
  - Markdown: `markdown-it-py`
  - AsciiDoc → Markdown: prefer `pypandoc` (Pandoc if available); fallback to `asciidoc3` or leave as raw text
  - PDF extraction: `pdfminer.six` (skippable via `--skip-pdf`)
  - HTML (Notion/Confluence/ReadTheDocs): `beautifulsoup4`
  - JSON passthrough when applicable
- Optional GitHub API (token via `GITHUB_TOKEN`) to list repo files, resolve raw paths, and detect license
- Config format: **YAML** (`pyyaml`)
- Output artifacts: **JSON** (+ optional CSV export), plus `_raw` source copies

### Inputs
1. A YAML config file (default: `prd_sources.yml`) with items of the form:
   ```yaml
   sources:
     - url: https://github.com/arc42/arc42-template
       tags: [architecture, docs, microservices]
       format_hint: adoc
       license_hint: CC-BY-SA-4.0
     - url: https://raw.githubusercontent.com/opulo-inc/prd-template/main/prd.md
       tags: [prd, product]
       format_hint: md
     - url: https://github.com/microsoft/MLOpsTemplate
       tags: [mlops, data, ops]
       format_hint: md
   ```
2. Optional CLI flags to add individual URLs directly: `ingest add --url <url> --tags prd,mlops --format-hint md`

### Outputs
- Per‑template JSON: `server/src/data/prd_templates/<slug>.json`
- Raw source copy: `server/src/data/prd_templates/_raw/<slug>.<ext>`
- `server/src/data/prd_templates/index.json` containing a summary of all entries

### JSON Schema (Strukt)
Use **this exact schema** for each output JSON:
```json
{
  "template_name": "string",
  "source_url": "string",
  "domain_focus": "string",
  "stack_keywords": ["string"],
  "format": "markdown|adoc|pdf|html|json|other",
  "license": "string|null",
  "license_source": "detected|hint|manual|null",
  "sections": [
    {
      "title": "string",
      "type": "overview|requirements|non_functional|api_integrations|architecture|deployment|operations|decision|constraints|other",
      "anchor": "string"
    }
  ],
  "raw_headings": ["string"],
  "extracted_text_excerpt": "string",
  "tags": ["string"],
  "retrieved_at": "ISO-8601"
}
```

### Section Mapping Rules
Normalize heading titles to the `type` field with case‑insensitive regex/keywords:
- **overview**: `introduction|overview|executive summary|goals|objectives|scope|context`
- **requirements**: `functional requirements|user stories|use cases|acceptance criteria|srs`
- **non_functional**: `non[- ]functional|quality attributes|performance|security|privacy|reliability|availability|accessibility|i18n|compliance`
- **api_integrations**: `api|integration|interfaces|external systems|dependencies`
- **architecture**: `architecture|solution strategy|building block|runtime view|design|context view`
- **deployment**: `deployment|infrastructure|environment|installation|release|ci/cd|container|kubernetes|terraform`
- **operations**: `monitoring|observability|logging|runbook|sre|operations|support|alerting`
- **decision**: `adr|decision record|tradeoffs|rationale`
- **constraints**: `assumptions|constraints|risks|non-goals|out of scope`
- default → **other**

### Behavior
1. **Discovery/Fetch**
   - If `url` is a raw file: download directly.
   - If `url` is a repo: list files via GitHub API (if token) or fallback to known docs paths:
     - `README.md`, `docs/**/*.md`, `**/architecture*.md`, `**/design*.md`, `**/prd*.md`, `**/srs*.md`, `**/*.adoc`, `**/adr*/**/*.md`
   - Respect rate limits; retries with exponential backoff; allow `--rate-limit <rps>`.

2. **License Detection**
   - Try `LICENSE*` files and GitHub License API; else use `license_hint`; else null.
   - Store `license_source` as `detected|hint|manual|null`.

3. **Parse/Convert**
   - Markdown: extract H1/H2 headings and anchors; grab a short text excerpt.
   - AsciiDoc: convert to Markdown (if possible) then parse; else best‑effort heading detection.
   - PDF: extract text; detect headings with line‑based heuristics (ALL CAPS / numbering / ToC).
   - HTML: parse `<h1>/<h2>` and visible text; ignore nav/chrome.
   - JSON: if object resembles a requirements/architecture shape, map keys to sections and collect keys as `raw_headings`.

4. **Inference**
   - `domain_focus` and `stack_keywords` inferred by scanning for keywords:
     - `go|golang`, `fastapi|python`, `react|next.js`, `react native`, `kubernetes|docker|terraform|prometheus|grafana`,
       `airflow|dbt|spark|mlops|mlflow|tensorflow|pytorch`

5. **Persistence**
   - Generate a kebab‑case `slug` from repo/file name.
   - Write per‑template JSON + `_raw` copy.
   - Rebuild `index.json` with: `template_name`, `source_url`, `format`, `license`, `tags`.

6. **Idempotency & Caching**
   - Maintain `.cache/manifest.json` with URL → `{etag, last_modified, last_hash, last_checked}`.
   - Only re‑write files if content hash changed.

7. **CLI Commands (Typer)**
   - `ingest --config prd_sources.yml --out server/src/data/prd_templates --max-files 150 --skip-pdf`
   - `ingest add --url <url> --tags prd,mlops --format-hint md`
   - `ingest reindex`
   - `ingest validate --path server/src/data/prd_templates` (validate JSON against schema)

8. **Logging & Tests**
   - Structured logs (json) to stdout and `ingest.log`
   - Minimal `pytest` for mapping rules and slugging

### Project Layout
```
tools/prd_ingest/
  main.py
  fetch.py
  convert.py
  parse.py
  schema.py
  util.py
  requirements.txt
  README.md
prd_sources.yml
server/src/data/prd_templates/   # output dir (created if missing)
```

---

## Seed `prd_sources.yml` (start set)

> *Licenses and content vary by repository; the tool should detect license when possible.*

```yaml
sources:
  # Architecture templates
  - url: https://github.com/arc42/arc42-template
    tags: [architecture, docs, microservices]
    format_hint: adoc
    license_hint: CC-BY-SA-4.0

  - url: https://github.com/bflorat/architecture-document-template
    tags: [architecture, ops, security]
    format_hint: adoc

  - url: https://github.com/shekhargulati/software-architecture-document-template
    tags: [architecture, design]
    format_hint: md

  - url: https://github.com/pmerson/architecture-view-template
    tags: [architecture, views, microservices]
    format_hint: md

  - url: https://github.com/Ryan-PG/architectures
    tags: [architecture, patterns, microservices, serverless]
    format_hint: md

  # PRD/SRS templates
  - url: https://github.com/priankr/prd-templates
    tags: [prd, product]
    format_hint: md

  - url: https://github.com/opulo-inc/prd-template/blob/main/prd.md
    tags: [prd, product]
    format_hint: md

  - url: https://github.com/MorganMarshall/PRD
    tags: [prd, product]
    format_hint: md

  - url: https://github.com/jam01/SRS-Template
    tags: [srs, requirements]
    format_hint: md

  - url: https://gist.github.com/t851029v2/baffbfe732be90b631222380e12506ae
    tags: [prd, product]
    format_hint: md

  - url: https://github.com/NagoDede/MarkSpecs
    tags: [requirements, docs-as-code]
    format_hint: md

  - url: https://github.com/wint3rmute/reqsnake
    tags: [requirements, tooling]
    format_hint: md

  - url: https://github.com/bhnm-rz/MarkdownSoftwareEngineering
    tags: [requirements, design]
    format_hint: md

  - url: https://github.com/imayobrown/DesignDocumentTemplates
    tags: [design, architecture]
    format_hint: md

  # Full-stack + backend templates (Next.js / FastAPI / Go / microservices)
  - url: https://github.com/vintasoftware/nextjs-fastapi-template
    tags: [frontend, nextjs, backend, fastapi]
    format_hint: md

  - url: https://github.com/thenna/fastapi-microservice-template
    tags: [backend, fastapi, microservices]
    format_hint: md

  - url: https://github.com/golang-standards/project-layout
    tags: [go, backend, layout]
    format_hint: md

  - url: https://github.com/cwe1ss/microservices-template
    tags: [microservices, dotnet, azure]
    format_hint: md

  - url: https://github.com/nkz-soft/microservice-template
    tags: [microservices, dotnet, clean-architecture]
    format_hint: md

  # Mobile / React Native
  - url: https://github.com/infinitered/ignite
    tags: [mobile, react-native, boilerplate]
    format_hint: md

  - url: https://github.com/expo/examples
    tags: [mobile, react-native, expo]
    format_hint: md

  # Data / ML / MLOps
  - url: https://github.com/microsoft/MLOpsTemplate
    tags: [mlops, azureml, pipelines]
    format_hint: md

  - url: https://github.com/Azure/mlops-project-template
    tags: [mlops, azure, enterprise]
    format_hint: md

  - url: https://github.com/lfai/awesome-mlops
    tags: [mlops, awesome, collection]
    format_hint: md

  - url: https://www.equalexperts.com/wp-content/uploads/2022/05/MLOPS_Playbook_v3.1.pdf
    tags: [mlops, playbook, pdf]
    format_hint: pdf

  # DevOps / Infra / Ops playbooks
  - url: https://github.com/kubernetes/production-readiness
    tags: [kubernetes, sre, readiness]
    format_hint: md

  - url: https://github.com/kodekloudhub/kubernetes-learning-path
    tags: [kubernetes, devops, learning]
    format_hint: md

  - url: https://github.com/trimstray/the-book-of-secret-knowledge
    tags: [devops, ops, networking, secops]
    format_hint: md

  - url: https://github.com/dastergon/awesome-sre
    tags: [sre, reliability, awesome]
    format_hint: md

  - url: https://github.com/sirredbeard/Awesome-README-templates
    tags: [docs, templates, readme]
    format_hint: md

  - url: https://github.com/pengqun/awesome-documentation
    tags: [docs, collection]
    format_hint: md
```

---

## Deliverables (What to generate)
- Package `tools/prd_ingest/` with modules:
  - `main.py` (Typer CLI entry)
  - `fetch.py` (HTTP + repo traversal + license detection)
  - `convert.py` (format converters: md/adoc/pdf/html/json)
  - `parse.py` (heading extraction + section mapping)
  - `schema.py` (pydantic model for JSON schema)
  - `util.py` (slug, hashing, time, logging)
  - `requirements.txt` (pin libs)
  - `README.md` (usage, examples)
- Seed `prd_sources.yml` with the list above
- Minimal `pytest` suite for section mapping & slugging
- Commands to support:
  - `ingest --config prd_sources.yml --out server/src/data/prd_templates --max-files 150 --skip-pdf`
  - `ingest add --url <url> --tags prd,mlops --format-hint md`
  - `ingest reindex`
  - `ingest validate --path server/src/data/prd_templates`

---

## Acceptance Criteria
- Running the ingest command on the seed list produces per‑template JSONs and `_raw` copies.
- `index.json` is created with minimal metadata.
- At least these sources parse with meaningful `sections`: arc42, bflorat, MLOpsTemplate, opulo PRD, jam01 SRS, nextjs‑fastapi.
- Graceful skip for PDFs when `--skip-pdf` is provided or `pdfminer.six` is absent.
- Robust retries/backoff and helpful logging.

---

## Implementation Hints
- Prefer small, pure functions; keep I/O at the edges.
- Use `tenacity` (optional) for retry/backoff; otherwise implement a simple exponential backoff.
- Extract anchors for markdown headings by slugging `# Title` → `#title` (kebab‑case). Store anchor in `sections[].anchor`.
- When repo traversal is unauthenticated, try raw URLs like: `https://raw.githubusercontent.com/<org>/<repo>/<branch>/<path>` when guessing common doc paths.
- Build a simple keyword → `stack_keywords` mapper; deduplicate and cap to ~12 terms per template.

---

**Please generate the complete codebase and the `prd_sources.yml` using the instructions above.**
