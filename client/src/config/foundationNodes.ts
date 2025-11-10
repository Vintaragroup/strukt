import type { DomainType } from "@/utils/domainLayout";

export type FoundationCategoryId = "frontend" | "backend" | "data" | "infrastructure" | "observability" | "security";

export interface FoundationNodeTemplate {
  id: string;
  label: string;
  summary: string;
  nodeType: "frontend" | "backend" | "requirement" | "doc";
  domain: DomainType;
  ring: number;
  tags: string[];
  subtext?: string;
}

export interface FoundationCategory {
  id: FoundationCategoryId;
  label: string;
  description: string;
  templates: FoundationNodeTemplate[];
}

export const FOUNDATION_CATEGORIES: FoundationCategory[] = [
  // ==============================================================================
  // FRONTEND - Ring 3-4 Client-side foundations for web, mobile, and real-time
  // ==============================================================================
  {
    id: "frontend",
    label: "Frontend",
    description: "Client frameworks, state management, and user experience layers.",
    templates: [
      {
        id: "frontend-app-shell",
        label: "Web App Shell",
        summary: "React/Next.js/Vue SPA or SSR with routing, layout, auth guard, and telemetry hooks.",
        subtext: "React/Next.js/Vue.js app shell",
        nodeType: "frontend",
        domain: "product",
        ring: 3,
        tags: ["foundation", "frontend", "web"],
      },
      {
        id: "frontend-mobile-app",
        label: "Mobile App",
        summary: "React Native / Flutter / NativeScript native mobile app shell.",
        subtext: "React Native / Flutter app shell",
        nodeType: "frontend",
        domain: "product",
        ring: 3,
        tags: ["foundation", "frontend", "mobile"],
      },
      {
        id: "frontend-design-system",
        label: "Design System",
        summary: "Component library, design tokens, theming, and accessibility primitives.",
        subtext: "Storybook + component library",
        nodeType: "requirement",
        domain: "product",
        ring: 3,
        tags: ["design", "ux", "foundation"],
      },
      {
        id: "frontend-state-management",
        label: "State Management",
        summary: "Redux / Zustand / Jotai / Pinia centralized state container.",
        subtext: "Redux/Zustand/Jotai state layer",
        nodeType: "requirement",
        domain: "product",
        ring: 3,
        tags: ["state", "management"],
      },
      {
        id: "frontend-client-caching",
        label: "Client Caching",
        summary: "React Query / SWR / Apollo Client query caching and synchronization.",
        subtext: "React Query / SWR cache layer",
        nodeType: "requirement",
        domain: "product",
        ring: 3,
        tags: ["cache", "frontend"],
      },
      {
        id: "frontend-realtime-client",
        label: "Real-time Client",
        summary: "WebSocket / Server-Sent Events client for live updates and bi-directional communication.",
        subtext: "Socket.io / ws library integration",
        nodeType: "requirement",
        domain: "product",
        ring: 3,
        tags: ["realtime", "websocket"],
      },
      {
        id: "frontend-telemetry",
        label: "Frontend Telemetry",
        summary: "Client-side logging, error boundary policy, feature flag instrumentation.",
        subtext: "Analytics SDK + error tracking",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["telemetry", "frontend"],
      },
      {
        id: "frontend-pwa",
        label: "PWA & Offline",
        summary: "Service Workers, offline-first sync, app manifest for installability.",
        subtext: "Service Worker + Workbox setup",
        nodeType: "requirement",
        domain: "product",
        ring: 4,
        tags: ["pwa", "offline"],
      },
      {
        id: "frontend-code-splitting",
        label: "Code Splitting & Performance",
        summary: "Route-based code splitting, lazy loading, and performance optimization.",
        subtext: "Route-based lazy loading + metrics",
        nodeType: "requirement",
        domain: "product",
        ring: 4,
        tags: ["performance", "optimization"],
      },
      {
        id: "frontend-testing",
        label: "Frontend Testing",
        summary: "Unit (Jest/Vitest), integration, and E2E (Playwright/Cypress) test suites.",
        subtext: "Jest/Vitest + Playwright coverage",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["testing", "qa"],
      },
    ],
  },

  // ==============================================================================
  // BACKEND - Ring 3-4 APIs, services, authentication, and business logic
  // ==============================================================================
  {
    id: "backend",
    label: "Backend & Services",
    description: "APIs, core services, authentication, integrations, and business logic.",
    templates: [
      // Core API & Services
      {
        id: "backend-api-server",
        label: "API Server",
        summary: "REST/GraphQL/gRPC service endpoint with routing, middleware, and request handling.",
        subtext: "Express/FastAPI/NestJS service",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["foundation", "backend", "api"],
      },
      {
        id: "backend-server",
        label: "Backend Server",
        summary: "Core service runtime with controllers, business logic modules, and domain services.",
        subtext: "Application runtime + controllers",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["foundation", "backend", "service"],
      },
      {
        id: "backend-domain-services",
        label: "Domain Services",
        summary: "DDD-style service modules for distinct business areas (Orders, Payments, Users, etc).",
        subtext: "Domain-driven design modules",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["domain", "business-logic"],
      },

      // Authentication & Security
      {
        id: "backend-authentication",
        label: "User Authentication",
        summary: "Identity provider integration, session lifecycle, MFA, RBAC enforcement.",
        subtext: "Auth0/Cognito/Firebase integration",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["security", "auth", "foundation"],
      },
      {
        id: "backend-identity-provider",
        label: "Identity Provider",
        summary: "Auth0 / AWS Cognito / Firebase Auth / Okta configuration and user management.",
        subtext: "Third-party auth provider setup",
        nodeType: "requirement",
        domain: "tech",
        ring: 4,
        tags: ["auth", "identity"],
      },
      {
        id: "backend-mfa-verification",
        label: "MFA & Verification",
        summary: "Multi-factor authentication, email/SMS verification, TOTP, hardware keys.",
        subtext: "MFA policy enforcement",
        nodeType: "requirement",
        domain: "tech",
        ring: 4,
        tags: ["security", "mfa"],
      },
      {
        id: "backend-session-management",
        label: "Session Management",
        summary: "JWT tokens, session lifecycle, refresh token rotation, invalidation.",
        subtext: "JWT + session lifecycle",
        nodeType: "requirement",
        domain: "tech",
        ring: 4,
        tags: ["auth", "sessions"],
      },
      {
        id: "backend-rbac",
        label: "RBAC & Permissions",
        summary: "Role definitions, resource-based access control, permission policies.",
        subtext: "Role + permission matrix",
        nodeType: "requirement",
        domain: "tech",
        ring: 4,
        tags: ["security", "permissions"],
      },
      {
        id: "backend-audit-logging",
        label: "Audit & Compliance Logging",
        summary: "Authentication events, administrative actions, compliance audit trails.",
        subtext: "Compliance audit logs",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["audit", "compliance"],
      },

      // User & Domain Logic
      {
        id: "backend-user-domain",
        label: "User Domain Service",
        summary: "User profiles, preferences, provisioning logic, account lifecycle.",
        subtext: "User lifecycle management",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["users", "domain"],
      },

      // Webhooks & Integrations
      {
        id: "backend-webhooks",
        label: "Webhook Handlers",
        summary: "Inbound webhook processing, event parsing, verification, and retry logic.",
        subtext: "External webhook ingestion",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["webhooks", "integrations"],
      },
      {
        id: "backend-integrations-hub",
        label: "Integrations Hub",
        summary: "Third-party API wrappers (Slack, GitHub, Zapier, payment providers, etc).",
        subtext: "3rd-party API layer",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["integrations", "partners"],
      },
      {
        id: "backend-payment-processing",
        label: "Payment Processing",
        summary: "Stripe / Square / PayPal integration, transaction handling, reconciliation.",
        subtext: "Stripe/Square payment layer",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["payments", "billing"],
      },

      // Communication & Async
      {
        id: "backend-message-queue",
        label: "Message Queue",
        summary: "RabbitMQ / AWS SQS / Google Cloud Pub/Sub for async job processing.",
        subtext: "Queue worker system",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["messaging", "queue"],
      },
      {
        id: "backend-event-bus",
        label: "Event Bus",
        summary: "Kafka / EventBridge / Pub/Sub event streaming and domain event routing.",
        subtext: "Event streaming platform",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["events", "streaming"],
      },
      {
        id: "backend-service-mesh",
        label: "Service Mesh & gRPC",
        summary: "Inter-service communication, circuit breakers, retries (Istio, Linkerd, gRPC).",
        subtext: "Istio/Linkerd service mesh",
        nodeType: "requirement",
        domain: "tech",
        ring: 3,
        tags: ["microservices", "mesh"],
      },

      // Data Access
      {
        id: "backend-file-storage",
        label: "File Storage",
        summary: "S3 / GCS / Azure Blob storage for user uploads, media, backups.",
        subtext: "Object storage (S3/GCS)",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["storage", "files"],
      },
      {
        id: "backend-vector-db",
        label: "Vector Database",
        summary: "Pinecone / Weaviate / Milvus / Supabase pgvector for RAG embeddings.",
        subtext: "Vector search & embeddings",
        nodeType: "backend",
        domain: "data-ai",
        ring: 3,
        tags: ["vector", "embeddings", "ai"],
      },
      {
        id: "backend-cache-layer",
        label: "Cache Layer",
        summary: "Redis / Memcached for session, query result, and distributed caching.",
        subtext: "Redis cache layer",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["caching", "performance"],
      },
      {
        id: "backend-search-engine",
        label: "Search Engine",
        summary: "Elasticsearch / Meilisearch / Algolia for full-text and faceted search.",
        subtext: "Full-text search service",
        nodeType: "backend",
        domain: "tech",
        ring: 3,
        tags: ["search", "indexing"],
      },

      // Operations
      {
        id: "backend-background-jobs",
        label: "Background Jobs",
        summary: "Queue workers for async workloads, retries, scheduled maintenance tasks.",
        subtext: "Job queue + worker pool",
        nodeType: "backend",
        domain: "operations",
        ring: 3,
        tags: ["jobs", "background"],
      },
      {
        id: "backend-api-gateway",
        label: "API Gateway",
        summary: "Edge routing, rate limiting, observability, request authentication.",
        subtext: "API gateway + rate limit",
        nodeType: "backend",
        domain: "operations",
        ring: 3,
        tags: ["api", "gateway"],
      },
    ],
  },

  // ==============================================================================
  // DATA - Ring 3-4 Storage, pipelines, analytics, and AI/ML
  // ==============================================================================
  {
    id: "data",
    label: "Data & AI",
    description: "Persistent stores, ETL pipelines, analytics, and machine learning.",
    templates: [
      // Primary Data
      {
        id: "data-store",
        label: "Primary Data Store",
        summary: "PostgreSQL / MySQL / Aurora relational database with schema, migrations.",
        subtext: "PostgreSQL/Aurora OLTP",
        nodeType: "backend",
        domain: "data-ai",
        ring: 3,
        tags: ["data", "storage", "foundation"],
      },
      {
        id: "data-management",
        label: "Data Management",
        summary: "Schema migrations, seeding, indexing, backups, retention policies.",
        subtext: "DB lifecycle management",
        nodeType: "backend",
        domain: "operations",
        ring: 3,
        tags: ["data", "ops"],
      },

      // ETL & Pipelines
      {
        id: "data-etl-pipeline",
        label: "ETL / Data Pipeline",
        summary: "Airflow / dbt / Fivetran data transformation, cleansing, and loading.",
        subtext: "dbt / Airflow pipelines",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["etl", "pipelines"],
      },
      {
        id: "data-event-streaming",
        label: "Event Streaming",
        summary: "Kafka / Dataflow / Pub/Sub event capture, routing, and initial ingestion.",
        subtext: "Kafka event streaming",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["streaming", "events"],
      },
      {
        id: "data-warehouse",
        label: "Data Warehouse",
        summary: "Snowflake / BigQuery / Redshift for OLAP queries, analytics workloads.",
        subtext: "Snowflake/BigQuery warehouse",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["warehouse", "analytics"],
      },

      // Analytics & BI
      {
        id: "data-analytics",
        label: "Analytics Warehouse",
        summary: "Event modeling, fact/dimension tables, BI-ready dataset exports.",
        subtext: "Analytics data modeling",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 4,
        tags: ["analytics", "bi"],
      },
      {
        id: "data-bi-dashboards",
        label: "BI & Dashboards",
        summary: "Analytics visualization, reporting dashboards (Metabase, Superset, Tableau).",
        subtext: "BI tooling + dashboards",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 4,
        tags: ["reporting", "bi"],
      },
      {
        id: "data-governance",
        label: "Data Governance",
        summary: "Data lineage, quality checks, access policies, compliance and privacy.",
        subtext: "Data lineage + quality",
        nodeType: "doc",
        domain: "data-ai",
        ring: 4,
        tags: ["governance", "quality"],
      },

      // AI/ML
      {
        id: "data-embeddings",
        label: "Vector Embeddings",
        summary: "Embedding generation (OpenAI, HuggingFace, local models) for RAG.",
        subtext: "Embedding generation service",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["embeddings", "ai", "ml"],
      },
      {
        id: "data-llm-finetuning",
        label: "LLM Fine-tuning",
        summary: "Model customization, LoRA, instruction tuning for domain-specific tasks.",
        subtext: "Fine-tuning pipeline",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["ml", "llm"],
      },
      {
        id: "data-ml-serving",
        label: "ML Model Serving",
        summary: "Model deployment (SageMaker, Replicate, HF Inference, TorchServe).",
        subtext: "Model inference service",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["ml", "serving"],
      },
    ],
  },

  // ==============================================================================
  // INFRASTRUCTURE - Ring 3-4 Containerization, CI/CD, and deployment
  // ==============================================================================
  {
    id: "infrastructure",
    label: "Infrastructure & Platform",
    description: "Containerization, orchestration, CI/CD, secrets, and deployment.",
    templates: [
      // Containerization
      {
        id: "infra-container-registry",
        label: "Container Registry",
        summary: "Docker Hub / ECR / GCR / Artifact Registry for image storage and distribution.",
        subtext: "Docker image registry",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["containers", "registry"],
      },
      {
        id: "infra-kubernetes",
        label: "Kubernetes Cluster",
        summary: "K8s control plane, nodes, networking, storage classes, and operators.",
        subtext: "EKS/GKE/AKS kubernetes",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["kubernetes", "orchestration"],
      },
      {
        id: "infra-container-runtime",
        label: "Container Runtime",
        summary: "Docker / containerd configuration, resource limits, security policies.",
        subtext: "Container runtime setup",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["containers", "runtime"],
      },

      // CI/CD & Deployment
      {
        id: "infra-cicd-pipeline",
        label: "CI/CD Pipeline",
        summary: "GitHub Actions / GitLab CI / CircleCI build, test, security scans, deployment.",
        subtext: "CI/CD automation platform",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["ci", "cd", "automation"],
      },
      {
        id: "infra-secrets-management",
        label: "Secrets Management",
        summary: "HashiCorp Vault / AWS Secrets Manager / sealed-secrets for credential storage.",
        subtext: "Secrets & credential mgmt",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["secrets", "security"],
      },
      {
        id: "infra-iac",
        label: "Infrastructure as Code",
        summary: "Terraform / Pulumi / CDK stacks and modules for environment provisioning.",
        subtext: "Terraform/CDK IaC",
        nodeType: "doc",
        domain: "operations",
        ring: 3,
        tags: ["iac", "infrastructure"],
      },
      {
        id: "infra-deployment-strategy",
        label: "Blue-Green Deployments",
        summary: "Canary releases, traffic shifting, gradual rollout, quick rollback.",
        subtext: "Canary + traffic shifting",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["deployment", "release"],
      },

      // Environment Management
      {
        id: "infra-multiregion",
        label: "Multi-region Setup",
        summary: "Cross-region replication, failover, geographic load balancing.",
        subtext: "Multi-region failover",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["multiregion", "ha"],
      },
      {
        id: "infra-edge-computing",
        label: "Edge Computing",
        summary: "CDN, Cloudflare Workers, Lambda@Edge, edge function deployment.",
        subtext: "Edge deployment platform",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["edge", "performance"],
      },
      {
        id: "infra-networking",
        label: "Networking & Load Balancing",
        summary: "VPC, security groups, ALB/NLB, ingress controllers, traffic routing.",
        subtext: "Load balancing + networking",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["networking", "lb"],
      },
    ],
  },

  // ==============================================================================
  // OBSERVABILITY - Ring 3-4 Logs, metrics, tracing, and alerting
  // ==============================================================================
  {
    id: "observability",
    label: "Observability & Monitoring",
    description: "Logs, metrics, tracing, alerting, and incident response.",
    templates: [
      // Logging
      {
        id: "obs-application-logging",
        label: "Application Logging",
        summary: "Centralized logging (ELK / Loki / DataDog / Splunk) with structured logs.",
        subtext: "Centralized log aggregation",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["logging", "observability"],
      },
      {
        id: "obs-infrastructure-metrics",
        label: "Infrastructure Metrics",
        summary: "System metrics collection (Prometheus / Grafana / CloudWatch).",
        subtext: "Prometheus + Grafana",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["metrics", "infrastructure"],
      },

      // Tracing & APM
      {
        id: "obs-distributed-tracing",
        label: "Distributed Tracing",
        summary: "End-to-end request tracing (Jaeger / Tempo / Honeycomb).",
        subtext: "Jaeger/Tempo tracing",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["tracing", "distributed"],
      },
      {
        id: "obs-apm",
        label: "APM (Application Performance Monitoring)",
        summary: "Code-level profiling, transaction analysis, latency breakdown.",
        subtext: "APM instrumentation",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["apm", "performance"],
      },

      // Alerting & Dashboards
      {
        id: "obs-alert-routing",
        label: "Alert Rules & Routing",
        summary: "Alert definitions, escalation policies, multi-channel notifications.",
        subtext: "Alert rules + escalation",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["alerting", "monitoring"],
      },
      {
        id: "obs-oncall",
        label: "On-call Management",
        summary: "On-call schedules, incident response, incident tracking (PagerDuty, Opsgenie).",
        subtext: "PagerDuty/Opsgenie setup",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["oncall", "incident"],
      },

      // Advanced Observability
      {
        id: "obs-dashboards",
        label: "Real-time Dashboards",
        summary: "Live operational dashboards, SLO burn-down tracking, custom visualizations.",
        subtext: "Grafana/DataDog dashboards",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["dashboards", "slo"],
      },
      {
        id: "obs-log-analysis",
        label: "Log Analysis & Aggregation",
        summary: "Log pipeline configuration, parsing rules, retention policies.",
        subtext: "Log parsing + retention",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["logging", "analysis"],
      },
      {
        id: "obs-metric-aggregation",
        label: "Metric Aggregation",
        summary: "Custom metrics, time-series storage, cardinality management.",
        subtext: "Custom metrics pipeline",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["metrics", "cardinality"],
      },
    ],
  },

  // ==============================================================================
  // SECURITY - Ring 3-4 Secrets, compliance, access control, audit
  // ==============================================================================
  {
    id: "security",
    label: "Security & Compliance",
    description: "Identity, secrets, access control, compliance, and threat detection.",
    templates: [
      // Secrets & Identity
      {
        id: "sec-secrets-management",
        label: "Secrets Management",
        summary: "API keys, DB credentials, certificates (Vault / AWS Secrets Manager).",
        subtext: "Vault/Secrets manager",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["secrets", "security"],
      },
      {
        id: "sec-certificate-mgmt",
        label: "Certificate Management",
        summary: "TLS certificates, expiration tracking, automated rotation.",
        subtext: "cert-manager / Let's Encrypt",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["certificates", "tls"],
      },

      // Access Control
      {
        id: "sec-zerotrust-network",
        label: "Zero-Trust Network",
        summary: "Network policies, service-to-service auth, mutual TLS (mTLS).",
        subtext: "mTLS + network policies",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["zerotrust", "mtls"],
      },
      {
        id: "sec-api-security",
        label: "API Security",
        summary: "Rate limiting, API gateway policies, CORS, JWT validation.",
        subtext: "API security policies",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["api", "security"],
      },

      // Compliance & Audit
      {
        id: "sec-audit-logging",
        label: "Audit Logging",
        summary: "User activity, API calls, data access, administrative actions.",
        subtext: "Audit trail system",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["audit", "compliance"],
      },
      {
        id: "sec-compliance-scanning",
        label: "Compliance Scanning",
        summary: "SAST / DAST / dependency scanning, container scanning, vulnerability reports.",
        subtext: "Security scanning pipeline",
        nodeType: "requirement",
        domain: "operations",
        ring: 3,
        tags: ["scanning", "compliance"],
      },
      {
        id: "sec-data-privacy",
        label: "Data Privacy",
        summary: "GDPR/CCPA implementation, PII handling, data residency compliance.",
        subtext: "Privacy compliance setup",
        nodeType: "doc",
        domain: "operations",
        ring: 3,
        tags: ["privacy", "gdpr"],
      },

      // Advanced Security
      {
        id: "sec-encryption",
        label: "Encryption & Key Management",
        summary: "Encryption at rest and in transit, key rotation, HSM integration.",
        subtext: "Encryption + key mgmt",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["encryption", "keys"],
      },
      {
        id: "sec-threat-detection",
        label: "Threat Detection & Response",
        summary: "Anomaly detection, intrusion detection, SIEM, incident response.",
        subtext: "SIEM + threat detection",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["threat", "detection"],
      },
      {
        id: "sec-supply-chain",
        label: "Vendor Security & Supply Chain",
        summary: "Software bill of materials (SBOM), vendor assessments, dependency scanning.",
        subtext: "SBOM + vendor mgmt",
        nodeType: "requirement",
        domain: "operations",
        ring: 4,
        tags: ["supply-chain", "sbom"],
      },
    ],
  },
];

