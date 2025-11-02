# Knowledge Base Changelog

This changelog records structured updates to the file-backed Knowledge Base used by the /api/kb endpoints.

## 2025-11-02 — Documentation + Security Hardening Batch

- Tag: restore-2025-11-02-20251102-124148
- Validator: PASS (kb:validate OK)
- Catalog: Updated with all entries

### Added PRDs (6)
1) api_documentation_program_v1 — API Documentation Program PRD
2) internal_kb_governance_v1 — Internal Knowledge Base Governance PRD
3) release_notes_workflow_v1 — Release Notes Workflow PRD
4) support_kb_maintenance_v1 — Support Knowledge Base Maintenance PRD
5) incident_postmortem_program_v1 — Incident Postmortem Program PRD
6) security_compliance_hardening_program_v1 — Security & Compliance Hardening Program PRD

### Added Fragments (6)
- acceptance_criteria/editorial_doc_quality.json — Editorial quality bar for documentation pages
- templates/postmortem_report.json — Blameless incident postmortem report template
- guidelines/api_doc_style_guide.json — API documentation style and coverage guidelines
- kpi_sets/docs_analytics.json — Documentation performance metrics (search success, TTFS, etc.)
- risk_mitigation/backend_rollback_plan.json — Backend rollback strategies and safeguards
- interface_patterns/websocket_handshake.json — WebSocket protocol/versioning, auth, heartbeat, and error handling pattern

### Notes
- Adds first-class coverage for node type "doc" to improve composer mapping for documentation nodes.
- Security/compliance hardening roadmap included to strengthen backend and ops coverage.

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
