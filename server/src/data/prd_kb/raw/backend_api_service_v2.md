# Backend API Service PRD (v2 Raw)

## Overview
Stateless REST API with auth and integrations.

## Architecture
Node.js + Express, Postgres/Mongo, OIDC, OTel.

## Interfaces
GET /v1/resources?page&limit, POST /v1/resources, GET /v1/resources/{id}, PATCH, DELETE.

## Data Retention & Privacy
PII minimization, encryption, retention policy, DSRs.

## Observability & SRE
Logs, traces, RED metrics, alerts.

## Failure Modes & Resilience
Timeouts, retries, circuit breaker, graceful shutdown.

## Security
OIDC, JWT, RBAC, validation, OWASP.
