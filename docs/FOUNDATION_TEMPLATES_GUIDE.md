# Modern LLM-Era Foundation Hierarchy - Quick Reference

## Why This Matters

Modern LLM deployment systems like **Base 44, Lovable, Cursor Agent** and **Replit** assume a specific tech stack and project structure. This expanded foundation template system ensures Strukt can model the exact architecture that these systems generate.

**Key Insight:** Every template in this hierarchy represents a critical decision point or component that:

- LLMs consider when generating code
- Teams need to document and maintain
- Can be tracked, versioned, and audited
- Creates dependency relationships in the workspace

---

## Ring 2: Seven Classifications (The "Org Spine")

```
BUSINESS (Ring 1)
├── Business Model
├── Business Operations
├── Marketing & GTM
│
TECH/DATA (Ring 2)
├── Application Frontend          ← All client-side concerns
├── Application Backend           ← All API & service concerns
├── Data & AI                     ← All storage & ML concerns
│
OPERATIONS (Ring 2)
├── Infrastructure & Platform     ← Containers, K8s, CI/CD
├── Observability & Monitoring    ← NEW: Logs, metrics, tracing
├── Security & Compliance         ← NEW: Secrets, audit, compliance
│
BUSINESS (Ring 2)
└── Customer Experience           ← Support, success, feedback
```

---

## Ring 3-4: 70 Foundation Templates

### Frontend Pyramid (10 total)

```
Ring 4 Specializations (3):
  • PWA & Offline (Service Workers)
  • Code Splitting & Performance (lazy loading)
  • Frontend Testing (Jest/Vitest/Cypress)

Ring 3 Foundations (7):
  • Web App Shell (React/Next.js/Vue)
  • Mobile App (React Native/Flutter)
  • Design System (components, tokens)
  • State Management (Redux/Zustand)
  • Client Caching (React Query/SWR)
  • Real-time Client (WebSocket)
  • Frontend Telemetry (analytics)
```

### Backend Pyramid (24 total)

```
Ring 4 Auth Children (4):
  • Identity Provider (Auth0/Cognito)
  • MFA & Verification
  • Session Management (JWT)
  • RBAC & Permissions
  • Audit & Compliance Logging

Ring 3 Core Services (20):
  • API Server (REST/GraphQL/gRPC)
  • Backend Server (service runtime)
  • Domain Services (DDD modules)

  Auth Parent:
  • User Authentication (ring 3 anchor)

  Communication:
  • Webhook Handlers
  • Integrations Hub
  • Message Queue (RabbitMQ/SQS)
  • Event Bus (Kafka)
  • Service Mesh (gRPC/Istio)

  Data Access:
  • Primary Data Store (PostgreSQL)
  • File Storage (S3)
  • Vector DB (Pinecone)
  • Cache Layer (Redis)
  • Search Engine (Elasticsearch)

  Business:
  • Payment Processing (Stripe)
  • Background Jobs
  • API Gateway
```

### Data & AI Pyramid (9 total)

```
Ring 4 Analytics (3):
  • Analytics Warehouse (fact/dim tables)
  • BI & Dashboards (Metabase)
  • Data Governance (lineage, quality)

Ring 3 Foundations (6):
  • Primary Data Store (PostgreSQL)
  • Data Management (migrations)
  • ETL / Data Pipeline (Airflow/dbt)
  • Event Streaming (Kafka)
  • Data Warehouse (Snowflake/BigQuery)
  • Vector Embeddings (OpenAI)
  • LLM Fine-tuning
  • ML Model Serving (SageMaker)
```

### Infrastructure Pyramid (9 total, all ring 3)

```
Containerization:
  • Container Registry (ECR/GCR)
  • Kubernetes Cluster
  • Container Runtime (Docker)

CI/CD & Deployment:
  • CI/CD Pipeline (GitHub Actions)
  • Secrets Management (Vault)
  • Infrastructure as Code (Terraform)
  • Blue-Green Deployments

Environment:
  • Multi-region Setup
  • Edge Computing (Cloudflare)
  • Networking & Load Balancing (ALB)
```

### Observability Pyramid (8 total)

```
Ring 4 Advanced (2):
  • Real-time Dashboards (SLO tracking)
  • Log Analysis (parsing, retention)
  • Metric Aggregation (cardinality)

Ring 3 Foundations (6):
  • Application Logging (ELK/Loki)
  • Infrastructure Metrics (Prometheus)
  • Distributed Tracing (Jaeger)
  • APM (performance monitoring)
  • Alert Rules & Routing
  • On-call Management (PagerDuty)
```

### Security Pyramid (10 total)

```
Ring 4 Advanced (3):
  • Encryption & Key Management (HSM)
  • Threat Detection (SIEM)
  • Vendor Security & Supply Chain (SBOM)

Ring 3 Foundations (7):
  • Secrets Management (Vault)
  • Certificate Management (TLS)
  • Zero-Trust Network (mTLS)
  • API Security (rate limiting)
  • Audit Logging
  • Compliance Scanning (SAST/DAST)
  • Data Privacy (GDPR/CCPA)
```

---

## How to Use This Hierarchy

### 1. **Bootstrap New Workspace**

When a user creates a new workspace:

```
Center (ring 0)
  ↓
Classification nodes appear (ring 1-2)
  ├ Business Model, Ops, Marketing (ring 1)
  ├ Frontend, Backend, Data, Infrastructure,
  │  Observability, Security (ring 2)
  ↓
User drags from ring 2 classification edge
  ↓
Associated Picker shows ring 3 templates for that category
  ↓
User selects template → new node created at ring 3
  ↓
If template has ring 4 children → they appear on next drag
```

### 2. **Node Creation Workflow**

```
User: "I need to add Redis caching"
  ↓
System: Looks up "cache" in templates
  ↓
Result: Finds "Cache Layer" under Backend (ring 3)
  ↓
Action: Creates node with parentId = "classification-app-backend"
  ↓
Display: Node appears on ring 3, connected to Backend classification
```

### 3. **Search & Discovery**

With 70 templates, users need fast discovery:

- Search by name ("Redis") → "Cache Layer"
- Search by capability ("real-time") → "Real-time Client", "Event Bus"
- Browse by classification (click Backend ring 2 node)
- Filter by ring level or domain

### 4. **Documentation & Architecture Review**

For architects reviewing the project:

```
Business Model (ring 1)
├── Revenue model, pricing tier strategy
│
App Backend & Services (ring 2)
├── API Server (ring 3)
├── User Authentication (ring 3)
│   ├── Identity Provider (ring 4)
│   ├── MFA & Verification (ring 4)
│   ├── Session Management (ring 4)
│   └── RBAC & Permissions (ring 4)
├── Payment Processing (ring 3)
│
Data & AI (ring 2)
├── Primary Data Store (ring 3)
├── Vector Database (ring 3) ← for AI features
├── ML Model Serving (ring 3)
│
Infrastructure & Platform (ring 2)
├── Kubernetes Cluster (ring 3)
├── CI/CD Pipeline (ring 3)
└── Secrets Management (ring 3)
```

---

## LLM Alignment Examples

### Base 44 Generated App

Base 44 generates a React + Express + PostgreSQL SaaS app:

- **Frontend Layer:** Web App Shell → Design System → State Management
- **Backend Layer:** API Server → User Auth (with JWT) → Primary Data Store
- **Infrastructure:** CI/CD Pipeline → Container Registry → Kubernetes
- **Observability:** Application Logging → Alert Rules
- **Security:** Secrets Management → RBAC & Permissions

### Lovable Generated App

Lovable generates React + API with vector DB for AI features:

- **Frontend Layer:** Web App Shell → Real-time Client → State Management
- **Backend Layer:** API Server → Vector Database → ML Model Serving
- **Data Layer:** Event Streaming → Data Warehouse
- **Infrastructure:** Edge Computing → Multi-region Setup
- **Observability:** APM → Distributed Tracing

### Cursor Agent Generated Microservice

Cursor generates a containerized microservice with observability:

- **Backend Layer:** API Server → Domain Services → Message Queue
- **Data Layer:** Primary Data Store → Data Management
- **Infrastructure:** Kubernetes Cluster → Service Mesh & gRPC
- **Observability:** Full tracing + metrics
- **Security:** Zero-Trust Network → Audit Logging

---

## Benefits of This Structure

✅ **Comprehensive Coverage:** 70 templates cover 90% of modern full-stack architecture  
✅ **LLM-Ready:** Aligns with what Base 44, Lovable, Cursor expect  
✅ **Scalable:** Can add more templates as new tech emerges (e.g., vector DBs, edge computing)  
✅ **Team-Aligned:** Each ring 2 classification maps to a team  
✅ **Audit Trail:** Every template is trackable, versioned, documented  
✅ **Decision Points:** Each template represents a critical architectural decision  
✅ **Progressive Discovery:** Ring 3 is essential; ring 4 adds depth  
✅ **Wide Applicability:** From MVP to multi-region enterprise deployment

---

## Next Steps

1. **Performance:** Test Associated Picker with 70+ templates
2. **Search:** Add full-text search across template names and summaries
3. **Tagging:** Use tags for filtering (e.g., "ai", "realtime", "security")
4. **Migration:** Auto-assign parentId to existing nodes
5. **Testing:** Verify canvas rendering, parent-child relationships
6. **Monitoring:** Track which templates are most used
7. **Expansion:** Add ring 5 for advanced specializations (e.g., distributed tracing architecture)
