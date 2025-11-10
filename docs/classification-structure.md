# Workspace Classification & Radial Layout

## Overview

The Flow Desk canvas now bootstraps ten canonical classification nodes creating a proper organizational hierarchy:

- **Ring 1 (5 nodes):** Organizational pillars - Business Model, Business Operations, Marketing GTM, Application Frontend, Application Backend
- **Ring 2 (5 nodes):** Domain specializations - Data & AI, Infrastructure & Platform, Observability & Monitoring, Security & Compliance, Customer Experience

This dual-level structure ensures technology and business functions coexist at the organizational level, not as subordinates.

### Ring 1 - Organizational Pillars (5 nodes)

| Key                                  | Label                          | Domain/Ring           | Purpose                                                         |
| ------------------------------------ | ------------------------------ | --------------------- | --------------------------------------------------------------- |
| `classification-business-model`      | Business Model                 | Business, r1          | Idea → concept → plan → revenue model                           |
| `classification-business-operations` | Business Operations            | Operations, r1        | Accounting, legal, exec, HR, support                            |
| `classification-marketing-gtm`       | Marketing & GTM                | Product/Marketing, r1 | Growth strategy, channels, enablement                           |
| `classification-app-frontend`        | Application Frontend           | Tech, r1              | **MOVED from Ring 2** - UI, client experiences, delivery layers |
| `classification-app-backend`         | Application Backend & Services | Tech, r1              | **MOVED from Ring 2** - APIs, services, queues, core platform   |

### Ring 2 - Domain Specializations (5 nodes)

| Key                                  | Label                      | Domain/Ring  | Purpose                                  |
| ------------------------------------ | -------------------------- | ------------ | ---------------------------------------- |
| `classification-data-ai`             | Data & AI                  | Data/AI, r2  | Pipelines, analytics, ML models          |
| `classification-infrastructure`      | Infrastructure & Platform  | Ops, r2      | Environments, CI/CD, observability       |
| `classification-observability`       | Observability & Monitoring | Ops, r2      | Logs, metrics, tracing, alerting         |
| `classification-security`            | Security & Compliance      | Ops, r2      | Identity, secrets, access control, audit |
| `classification-customer-experience` | Customer Experience        | Business, r2 | Support, success, onboarding, feedback   |

## Parent/Child Behavior

- New nodes added via the wizard, auto-create, or scaffolding flows are classified automatically:
  - We look at node type, domain, tags, and label to pick the right parent ID.
  - The child's `ring` becomes `parent ring + 1` so concentric layers reflect real-world hierarchies.
  - `parentId` is stored on each node so aggregate/collapse features still work.
- Cross-classification dependencies (e.g., frontend ↔ backend) are represented with lightweight association nodes:
  - These nodes connect the two parents (or their children) and serve as the home for API contracts, Swagger docs, SLAs, etc.
  - Keeps the DAG acyclic and gives us a place to hang documentation about the relationship.

## Foundation Node Hierarchy (Ring 3+)

### Ring 1-2 Classification Structure

Ring 1 provides 5 organizational pillars. Ring 2 provides 5 domain specializations that organize Ring 3 foundation templates:

| Ring 1 Parent                  | Ring 2 Children                                    | Purpose                                    |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------ |
| Application Frontend           | N/A (R2 siblings below)                            | Client-side experiences, delivery layers   |
| Application Backend & Services | Data & AI, Infrastructure, Observability, Security | Server-side logic and operational concerns |
| Business Model                 | N/A                                                | Strategic planning                         |
| Business Operations            | Customer Experience                                | Organizational operations                  |
| Marketing & GTM                | N/A                                                | Growth and market strategy                 |

---

## Ring 3-4 Foundation Templates (by Parent Classification)

### Under Application Frontend (ring 1):

**Ring 3 Foundations:**

- Web App Shell - React/Next.js/Vue.js SPA or SSR shell with routing, layout, auth guard
- Mobile App - React Native / Flutter / NativeScript app shell
- Design System - Component library, design tokens, accessibility, theming
- Real-time Client - WebSocket / SSE client for live updates
- Client Caching - React Query / SWR / Apollo Cache layer
- State Management - Redux / Zustand / Jotai / Pinia state container

**Ring 4 Specializations:**

- Code Splitting & Lazy Loading - Route-based and component-level optimization
- PWA & Offline - Service Workers, offline-first sync
- Frontend Testing - Unit, integration, E2E (Jest / Vitest / Playwright)
- Performance Monitoring - Client-side metrics, Core Web Vitals tracking

---

### Under Application Backend & Services (ring 1):

**Ring 2 Domain Specializations** (organizational groupings of Ring 3 templates):

Under the Application Backend pillar, the Ring 2 domain specializations organize Ring 3 templates:

**Ring 3 Core Foundations:**

- **User Authentication (ring 3)** - Identity provider integration, session management, MFA

  - **Ring 4 Children:**
    - Identity Provider - Auth0, AWS Cognito, Firebase Auth, Okta
    - MFA & Verification - Multi-factor auth, email/SMS verification
    - Session & Token Management - JWT, session lifecycle, refresh tokens
    - RBAC & Permissions - Role definitions, resource-based access control
    - Audit & Compliance Logging - Auth events, compliance records

- API Server (REST/GraphQL/gRPC) - Primary API endpoint, service routing, middleware
- Backend Server - Core service runtime, controllers, business logic
- Domain Services - DDD-style service modules for distinct business areas
- Webhook Handlers - Inbound webhook processing, event parsing, retry logic

**Ring 3 Integration & Communication:**

- Message Queue - RabbitMQ, AWS SQS, Google Cloud Pub/Sub for async workloads
- Event Bus - Kafka, EventBridge, Pub/Sub event streaming across services
- Service Mesh & gRPC - Inter-service communication, circuit breakers, retries (Istio, Linkerd)

**Ring 3 Data & Storage:**

- File Storage - S3, GCS, Blob storage for user uploads, media
- Vector Database - Pinecone, Weaviate, Milvus for RAG embeddings
- Cache Layer - Redis, Memcached for session and query result caching
- Search Engine - Elasticsearch, Meilisearch for full-text search

**Ring 3 Business Logic:**

- Payment Processing - Stripe, Square, PayPal integration & reconciliation
- Integrations Hub - 3rd-party API wrappers (Slack, GitHub, Zapier, etc.)
- Background Jobs - Queue workers, scheduled tasks, async processing
- User Domain Service - User profiles, preferences, provisioning logic

---

### Under Data & AI (ring 2):

**Ring 3 Foundations:**

- Primary Data Store - PostgreSQL / MySQL / Aurora relational database
- Data Management - Schema migrations, seeding, indexing, backups, retention
- ETL / Data Pipeline - Airflow, dbt, Fivetran data transformation and loading
- Event Streaming - Kafka, Google Cloud Dataflow, event capture and routing
- Data Warehouse - Snowflake, BigQuery, Redshift for analytics queries

**Ring 3 AI/ML:**

- Vector Embeddings - Embedding generation (OpenAI, HuggingFace, local models)
- LLM Fine-tuning - Model customization, LoRA, instruction tuning
- ML Model Serving - Model deployment (SageMaker, Replicate, Hugging Face Inference)

**Ring 4 Analytics & BI:**

- Analytics Warehouse - Event modeling, fact/dimension tables for BI
- BI & Dashboards - Analytics visualization, reporting dashboards (Metabase, Superset, Tableau)
- Data Governance - Lineage, quality checks, access policies, compliance

---

### Under Infrastructure & Platform (ring 2):

**Ring 3 Containerization & Orchestration:**

- Container Registry - Docker Hub, ECR, GCR, Artifact Registry
- Kubernetes Cluster - K8s control plane, nodes, networking, storage classes
- Container Runtime - Docker, containerd configuration, resource limits

**Ring 3 CI/CD & Deployment:**

- CI/CD Pipeline - GitHub Actions, GitLab CI, CircleCI build and deploy automation
- Secrets Management - HashiCorp Vault, AWS Secrets Manager, sealed-secrets
- Infrastructure as Code - Terraform, Pulumi, CDK stacks and modules
- Blue-Green Deployments - Canary releases, traffic shifting, rollback strategies

**Ring 3 Environment Management:**

- Multi-region Setup - Cross-region replication, failover, load balancing
- Edge Computing - CDN, Cloudflare Workers, Lambda@Edge deployment
- Networking & Load Balancing - VPC, security groups, ALB, ingress controllers

---

### Under Observability & Monitoring (ring 2 - NEW):

**Ring 3 Observability Foundations:**

- Application Logging - Centralized logs (ELK, Loki, DataDog, Splunk)
- Infrastructure Metrics - System metrics collection (Prometheus, Grafana, CloudWatch)
- Distributed Tracing - End-to-end request tracing (Jaeger, Tempo, Honeycomb)
- APM (Application Performance Monitoring) - Code-level profiling, transaction analysis
- Alert Rules & Routing - Alert definitions, escalation, notification channels
- On-call Management - Incident response, on-call schedules, incident tracking (PagerDuty, Opsgenie)

**Ring 4 Specializations:**

- Real-time Dashboards - Live operational dashboards, SLO burn-down tracking
- Log Analysis & Aggregation - Log pipelines, parsing, retention policies
- Metric Aggregation - Custom metrics, time-series storage, retention

---

### Under Security & Compliance (ring 2 - NEW):

**Ring 3 Security Foundations:**

- Secrets Management - API keys, database credentials, certificates (Vault, AWS Secrets Manager)
- Certificate Management - TLS certs, expiration tracking, rotation
- Zero-Trust Network - Network policies, service-to-service auth, mTLS
- API Security - Rate limiting, API gateway policies, CORS, JWT validation

**Ring 3 Compliance & Audit:**

- Audit Logging - User activity, API calls, data access, administrative actions
- Compliance Scanning - SAST, DAST, dependency scanning, container scanning
- Data Privacy - GDPR/CCPA implementation, PII handling, data residency

**Ring 4 Advanced Security:**

- Encryption & Key Management - Encryption at rest and in transit, key rotation
- Threat Detection & Response - Anomaly detection, intrusion detection, incident response
- Vendor Security & Supply Chain - SBOMs, vendor assessments, software composition analysis

---

### Under Customer Experience (ring 2):

- (To be defined per product: support systems, success workflows, feedback loops)

## Complete Node Type Inventory

### All Node Types by Classification and Ring

| #                                                 | Node Type                      | Classification      | Ring | Domain            | Purpose                                                     |
| ------------------------------------------------- | ------------------------------ | ------------------- | ---- | ----------------- | ----------------------------------------------------------- |
| **RING 1 - ORGANIZATIONAL PILLARS**               |
| 1                                                 | Business Model                 | (Center Parent)     | 1    | Business          | Idea → concept → plan → revenue model                       |
| 2                                                 | Business Operations            | (Center Parent)     | 1    | Operations        | Accounting, legal, exec, HR, support                        |
| 3                                                 | Marketing & GTM                | (Center Parent)     | 1    | Product/Marketing | Growth strategy, channels, enablement                       |
| 4                                                 | Application Frontend           | (Center Parent)     | 1    | Tech              | **MOVED from R2** - UI, client experiences, delivery layers |
| 5                                                 | Application Backend & Services | (Center Parent)     | 1    | Tech              | **MOVED from R2** - APIs, services, queues, core platform   |
| **RING 2 - DOMAIN SPECIALIZATIONS**               |
| 6                                                 | Data & AI                      | App Backend Parent  | 2    | Data/AI           | Pipelines, analytics, ML models                             |
| 7                                                 | Infrastructure & Platform      | App Backend Parent  | 2    | Ops               | Environments, CI/CD, observability                          |
| 8                                                 | Observability & Monitoring     | App Backend Parent  | 2    | Ops               | Logs, metrics, tracing, alerting                            |
| 9                                                 | Security & Compliance          | App Backend Parent  | 2    | Ops               | Identity, secrets, access control, audit                    |
| 10                                                | Customer Experience            | Business Ops Parent | 2    | Business          | Support, success, onboarding, feedback                      |
| **RING 3 - APPLICATION FRONTEND TEMPLATES**       |
| 11                                                | Web App Shell                  | App Frontend        | 3    | Tech              | React/Next.js/Vue.js SPA or SSR with routing, layout        |
| 12                                                | Mobile App                     | App Frontend        | 3    | Tech              | React Native / Flutter / NativeScript app shell             |
| 13                                                | Design System                  | App Frontend        | 3    | Tech              | Component library, design tokens, accessibility             |
| 14                                                | Real-time Client               | App Frontend        | 3    | Tech              | WebSocket / SSE client for live updates                     |
| 15                                                | Client Caching                 | App Frontend        | 3    | Tech              | React Query / SWR / Apollo Cache layer                      |
| 16                                                | State Management               | App Frontend        | 3    | Tech              | Redux / Zustand / Jotai / Pinia state container             |
| **RING 4 - APPLICATION FRONTEND SPECIALIZATIONS** |
| 17                                                | Code Splitting & Lazy Loading  | App Frontend        | 4    | Tech              | Route-based and component-level optimization                |
| 18                                                | PWA & Offline                  | App Frontend        | 4    | Tech              | Service Workers, offline-first sync                         |
| 19                                                | Frontend Testing               | App Frontend        | 4    | Tech              | Unit, integration, E2E (Jest / Vitest / Playwright)         |
| 20                                                | Performance Monitoring         | App Frontend        | 4    | Tech              | Client-side metrics, Core Web Vitals tracking               |
| **RING 3 - APPLICATION BACKEND & SERVICES**       |
| 21                                                | User Authentication            | App Backend         | 3    | Tech              | Identity provider integration, session management, MFA      |
| 22                                                | API Server                     | App Backend         | 3    | Tech              | REST/GraphQL/gRPC primary API endpoint, routing             |
| 23                                                | Backend Server                 | App Backend         | 3    | Tech              | Core service runtime, controllers, business logic           |
| 24                                                | Domain Services                | App Backend         | 3    | Tech              | DDD-style service modules for distinct business areas       |
| 25                                                | Webhook Handlers               | App Backend         | 3    | Tech              | Inbound webhook processing, event parsing, retry logic      |
| 26                                                | Message Queue                  | App Backend         | 3    | Tech              | RabbitMQ, AWS SQS, Google Cloud Pub/Sub for async           |
| 27                                                | Event Bus                      | App Backend         | 3    | Tech              | Kafka, EventBridge, Pub/Sub event streaming                 |
| 28                                                | Service Mesh & gRPC            | App Backend         | 3    | Tech              | Istio, Linkerd inter-service communication                  |
| 29                                                | File Storage                   | App Backend         | 3    | Tech              | S3, GCS, Blob storage for uploads, media                    |
| 30                                                | Vector Database                | App Backend         | 3    | Tech              | Pinecone, Weaviate, Milvus for RAG embeddings               |
| 31                                                | Cache Layer                    | App Backend         | 3    | Tech              | Redis, Memcached for session and query caching              |
| 32                                                | Search Engine                  | App Backend         | 3    | Tech              | Elasticsearch, Meilisearch for full-text search             |
| 33                                                | Payment Processing             | App Backend         | 3    | Tech              | Stripe, Square, PayPal integration & reconciliation         |
| 34                                                | Integrations Hub               | App Backend         | 3    | Tech              | 3rd-party API wrappers (Slack, GitHub, Zapier)              |
| 35                                                | Background Jobs                | App Backend         | 3    | Tech              | Queue workers, scheduled tasks, async processing            |
| 36                                                | User Domain Service            | App Backend         | 3    | Tech              | User profiles, preferences, provisioning logic              |
| **RING 4 - USER AUTHENTICATION SPECIALIZATIONS**  |
| 37                                                | Identity Provider              | User Authentication | 4    | Tech              | Auth0, AWS Cognito, Firebase Auth, Okta                     |
| 38                                                | MFA & Verification             | User Authentication | 4    | Tech              | Multi-factor auth, email/SMS verification                   |
| 39                                                | Session & Token Management     | User Authentication | 4    | Tech              | JWT, session lifecycle, refresh tokens                      |
| 40                                                | RBAC & Permissions             | User Authentication | 4    | Tech              | Role definitions, resource-based access control             |
| 41                                                | Audit & Compliance Logging     | User Authentication | 4    | Tech              | Auth events, compliance records                             |
| **RING 3 - DATA & AI**                            |
| 42                                                | Primary Data Store             | Data & AI           | 3    | Data              | PostgreSQL / MySQL / Aurora relational database             |
| 43                                                | Data Management                | Data & AI           | 3    | Data              | Schema migrations, seeding, indexing, backups               |
| 44                                                | ETL / Data Pipeline            | Data & AI           | 3    | Data              | Airflow, dbt, Fivetran transformation and loading           |
| 45                                                | Event Streaming                | Data & AI           | 3    | Data              | Kafka, Google Cloud Dataflow event capture                  |
| 46                                                | Data Warehouse                 | Data & AI           | 3    | Data              | Snowflake, BigQuery, Redshift for analytics                 |
| 47                                                | Vector Embeddings              | Data & AI           | 3    | Data/AI           | Embedding generation (OpenAI, HuggingFace, local)           |
| 48                                                | LLM Fine-tuning                | Data & AI           | 3    | Data/AI           | Model customization, LoRA, instruction tuning               |
| 49                                                | ML Model Serving               | Data & AI           | 3    | Data/AI           | SageMaker, Replicate, Hugging Face Inference                |
| **RING 4 - DATA & AI SPECIALIZATIONS**            |
| 50                                                | Analytics Warehouse            | Data & AI           | 4    | Data              | Event modeling, fact/dimension tables for BI                |
| 51                                                | BI & Dashboards                | Data & AI           | 4    | Data              | Metabase, Superset, Tableau analytics visualization         |
| 52                                                | Data Governance                | Data & AI           | 4    | Data              | Lineage, quality checks, access policies                    |
| **RING 3 - INFRASTRUCTURE & PLATFORM**            |
| 53                                                | Container Registry             | Infrastructure      | 3    | Ops               | Docker Hub, ECR, GCR, Artifact Registry                     |
| 54                                                | Kubernetes Cluster             | Infrastructure      | 3    | Ops               | K8s control plane, nodes, networking, storage               |
| 55                                                | Container Runtime              | Infrastructure      | 3    | Ops               | Docker, containerd configuration, resource limits           |
| 56                                                | CI/CD Pipeline                 | Infrastructure      | 3    | Ops               | GitHub Actions, GitLab CI, CircleCI automation              |
| 57                                                | Secrets Management             | Infrastructure      | 3    | Ops               | HashiCorp Vault, AWS Secrets Manager, sealed-secrets        |
| 58                                                | Infrastructure as Code         | Infrastructure      | 3    | Ops               | Terraform, Pulumi, CDK stacks and modules                   |
| 59                                                | Blue-Green Deployments         | Infrastructure      | 3    | Ops               | Canary releases, traffic shifting, rollback                 |
| 60                                                | Multi-region Setup             | Infrastructure      | 3    | Ops               | Cross-region replication, failover, load balancing          |
| 61                                                | Edge Computing                 | Infrastructure      | 3    | Ops               | CDN, Cloudflare Workers, Lambda@Edge                        |
| 62                                                | Networking & Load Balancing    | Infrastructure      | 3    | Ops               | VPC, security groups, ALB, ingress controllers              |
| **RING 3 - OBSERVABILITY & MONITORING**           |
| 63                                                | Application Logging            | Observability       | 3    | Ops               | ELK, Loki, DataDog, Splunk centralized logs                 |
| 64                                                | Infrastructure Metrics         | Observability       | 3    | Ops               | Prometheus, Grafana, CloudWatch system metrics              |
| 65                                                | Distributed Tracing            | Observability       | 3    | Ops               | Jaeger, Tempo, Honeycomb end-to-end request tracing         |
| 66                                                | APM                            | Observability       | 3    | Ops               | Code-level profiling, transaction analysis                  |
| 67                                                | Alert Rules & Routing          | Observability       | 3    | Ops               | Alert definitions, escalation, notification channels        |
| 68                                                | On-call Management             | Observability       | 3    | Ops               | PagerDuty, Opsgenie incident response, schedules            |
| **RING 4 - OBSERVABILITY SPECIALIZATIONS**        |
| 69                                                | Real-time Dashboards           | Observability       | 4    | Ops               | Live operational dashboards, SLO burn-down tracking         |
| 70                                                | Log Analysis & Aggregation     | Observability       | 4    | Ops               | Log pipelines, parsing, retention policies                  |
| 71                                                | Metric Aggregation             | Observability       | 4    | Ops               | Custom metrics, time-series storage, retention              |
| **RING 3 - SECURITY & COMPLIANCE**                |
| 72                                                | Secrets Management             | Security            | 3    | Ops               | API keys, database credentials, certificates                |
| 73                                                | Certificate Management         | Security            | 3    | Ops               | TLS certs, expiration tracking, rotation                    |
| 74                                                | Zero-Trust Network             | Security            | 3    | Ops               | Network policies, service-to-service auth, mTLS             |
| 75                                                | API Security                   | Security            | 3    | Ops               | Rate limiting, API gateway policies, CORS, JWT              |
| 76                                                | Audit Logging                  | Security            | 3    | Ops               | User activity, API calls, data access, admin actions        |
| 77                                                | Compliance Scanning            | Security            | 3    | Ops               | SAST, DAST, dependency scanning, container scanning         |
| 78                                                | Data Privacy                   | Security            | 3    | Ops               | GDPR/CCPA implementation, PII handling, residency           |
| **RING 4 - SECURITY SPECIALIZATIONS**             |
| 79                                                | Encryption & Key Management    | Security            | 4    | Ops               | Encryption at rest and in transit, key rotation             |
| 80                                                | Threat Detection & Response    | Security            | 4    | Ops               | Anomaly detection, intrusion detection, response            |
| 81                                                | Vendor Security & Supply Chain | Security            | 4    | Ops               | SBOMs, vendor assessments, composition analysis             |

---

### Summary Statistics

| Metric                  | Count  |
| ----------------------- | ------ |
| Ring 0 (Center)         | 1      |
| Ring 1 Classifications  | 5      |
| Ring 2 Classifications  | 5      |
| Ring 3 Foundation Nodes | 55     |
| Ring 4 Specializations  | 15     |
| **Total Nodes**         | **82** |

### Ring Distribution

| Ring | Count | Role                                                                                                                                  |
| ---- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | 1     | Center hub                                                                                                                            |
| 1    | 5     | Organizational pillars (Business Model, Business Ops, Marketing & GTM, Application Frontend, Application Backend)                     |
| 2    | 5     | Domain specializations (Data & AI, Infrastructure & Platform, Observability & Monitoring, Security & Compliance, Customer Experience) |
| 3    | 55    | Foundation templates (core production components)                                                                                     |
| 4    | 15    | Specializations (scale/maturity variants)                                                                                             |

## Migration

- Legacy workspaces automatically seed the classification parents, then run a migration that:
  - Finds every node still attached to the center.
  - Reparents it under the correct classification parent.
  - Bumps its ring to `parent ring + 1`.
  - Rewrites edges so the center only connects to the classification nodes.
- After migration completes we force a single `persistWorkspace({ force: true })` so the upgraded structure becomes the new source of truth.
- Debug logs show `[classification-migrate] applied` once, along with a table of reparented nodes. On later loads the migration is a no-op.

## Layout Guarantees

- The radial layout still drives positioning (Business on the west arc, Product south, Data/AI north, Tech east, Ops southwest).
- Classification parents stay on `ring 1` (or `ring 2` for tech/data tracks) so the center is never overcrowded.
- Children inherit the parent’s domain color/sector and are spaced one ring farther out, giving the canvas a consistent “VS Code” style tree around the hub.

## Why This Matters

- LLM prompting: The classification scaffold guarantees the model always sees the same top-level context before generating docs or code.
- Auto-create flows: Wizards precisely know where to attach new nodes and how to name/structure association nodes.
- Health & analytics: Parent/child chains make it trivial to compute coverage, staleness, and dependencies per business track.
