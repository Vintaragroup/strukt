# Documentation Index

A quick guide to the most relevant documentation in this repository.

## Core references

- API reference: ./API_DOCUMENTATION.md
- Architecture overview: ./ARCHITECTURE.md
- Current phase status: ./PHASE_3_STATUS_CURRENT.md

## Knowledge base

- KB overview: ./kb/README.md
- KB schema (normalized PRD): ./kb/normalized_prd.schema.json
- KB fragments guide: ./kb/FRAGMENTS.md
- KB changelog: ./kb/CHANGELOG.md

## Generation & AI

- GPT-4o generation pipeline: see API reference → Generation Pipeline
- PRD retrieval service: server/src/services/PRDRetrievalService.ts
- Context injector: server/src/services/ContextInjector.ts

## Workflows & guides

- Phase/Task documentation: see docs/PHASE_* and docs/TASK_*
- Quick start: docs/PHASE_2_QUICK_START.md

Tip: For health checks use GET /api/generation/health and GET /api/kb/health.
