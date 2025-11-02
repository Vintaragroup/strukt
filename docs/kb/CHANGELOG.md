# Knowledge Base Changelog

This changelog records structured updates to the file-backed Knowledge Base used by the /api/kb endpoints.

## 2025-11-02 — Business/Marketing Batch 6

- Tag: restore-2025-11-02-20251102-113052
- Validator: PASS (kb:validate OK)
- Catalog: Updated with all entries

### Added PRDs (6)
1) sales_forecasting_governance_v1 — Sales Forecasting Governance PRD
2) editorial_seo_refresh_playbook_v1 — Editorial SEO Refresh Playbook PRD
3) translation_localization_workflow_v1 — Translation & Localization Workflow PRD
4) marketing_ops_utm_taxonomy_v1 — Marketing Ops: UTM Taxonomy & Governance PRD
5) product_marketing_competitive_replacement_playbook_v1 — Competitive Replacement Playbook PRD
6) developer_marketing_tutorials_sdk_standards_v1 — Tutorials & SDK Standards PRD

### Added Fragments (6)
- guidelines/utm_taxonomy.json — UTM conventions, validation, governance
- templates/editorial_refresh_checklist.json — SEO refresh QA checklist
- acceptance_criteria/translation_ready.json — Translation-ready acceptance criteria
- decision_matrices/forecasting_methodologies.json — Forecasting methods tradeoffs
- risk_mitigation/vendor_replacement_risk.json — Vendor replacement safeguards
- kpi_sets/dev_marketing.json — Developer marketing KPIs

### Notes
- In-memory TTL cache for KB reads enabled (default 60s) to reduce filesystem access.
- Endpoints in use: GET /api/kb/health, GET /api/kb/catalog, POST /api/kb/compose.

---

## Changelog format
- Use ISO dates in headings.
- Group by operation (add/update/remove), then list items with id and title.
- Include CI/validation status and any restore tag.
