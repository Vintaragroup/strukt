# Workspace: Microservice Split

## Context
Extract billing functionality from monolith into a separate service.

## Components
- Monolith (backend)
- BillingService (backend)
- API Gateway

## Requirements
- Identify boundaries and data contracts
- Create service with separate DB
- Migrate endpoints via gateway routing
- Observability and rollback plan

## Notes
- Minimize downtime during cutover
- Backfill historical invoices
