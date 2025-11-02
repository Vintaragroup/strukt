# FastAPI Backend Service PRD (v1 Raw)

## Overview
Async FastAPI with OpenAPI and strong typing.

## Data Model
User, Subscription, Invoice, WebhookEvent; migrations.

## Example Endpoints
POST /v1/subscriptions; GET /v1/invoices; POST /v1/webhooks/stripe.

## SLOs & Alerts
p95 < 150ms; uptime 99.9%; alert thresholds.

## Security
JWT, RBAC, parameterized SQL, secrets, rate limits.
