import type { DomainType } from "@/utils/domainLayout";

export type FoundationCategoryId = "frontend" | "backend" | "data" | "operations";

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
  {
    id: "frontend",
    label: "Frontend",
    description: "Surface, guardrails, and client experience layers.",
    templates: [
      {
        id: "frontend-app-shell",
        label: "Frontend App",
        summary: "Primary UI shell with routing, layout system, auth guard, and telemetry hooks.",
        subtext: "Next.js/React shell + design system hooks",
        nodeType: "frontend",
        domain: "product",
        ring: 1,
        tags: ["foundation", "frontend"],
      },
      {
        id: "frontend-design-system",
        label: "Design System",
        summary: "Component library, tokens, and accessibility scaffolding to keep surface consistent.",
        subtext: "Tokens, theming, component primitives",
        nodeType: "requirement",
        domain: "product",
        ring: 2,
        tags: ["design", "ux", "foundation"],
      },
      {
        id: "frontend-observability",
        label: "Frontend Telemetry",
        summary: "Client-side logging, error boundary policy, feature flag instrumentation.",
        subtext: "Logging + metrics for the UI",
        nodeType: "requirement",
        domain: "operations",
        ring: 2,
        tags: ["telemetry", "frontend"],
      },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    description: "APIs, services, and security layers that power the experience.",
    templates: [
      {
        id: "backend-server",
        label: "Backend Server",
        summary: "Service runtime, routing, controllers, and domain modules for the core API.",
        subtext: "REST/GraphQL service layer",
        nodeType: "backend",
        domain: "tech",
        ring: 1,
        tags: ["foundation", "backend"],
      },
      {
        id: "backend-authentication",
        label: "User Authentication",
        summary: "OIDC provider, session lifecycle, MFA, and RBAC enforcement.",
        subtext: "Auth0/Cognito integration, MFA, RBAC",
        nodeType: "backend",
        domain: "tech",
        ring: 1,
        tags: ["security", "auth", "foundation"],
      },
      {
        id: "backend-user-domain",
        label: "User Domain Service",
        summary: "Profiles, preferences, and provisioning logic tied to the account system.",
        subtext: "User profile & lifecycle logic",
        nodeType: "backend",
        domain: "tech",
        ring: 2,
        tags: ["users", "domain"],
      },
      {
        id: "backend-job-runner",
        label: "Background Jobs",
        summary: "Queue workers for async workloads, retries, and scheduled maintenance tasks.",
        subtext: "Queue + worker pool",
        nodeType: "backend",
        domain: "operations",
        ring: 2,
        tags: ["jobs", "operations"],
      },
      {
        id: "backend-api-gateway",
        label: "API Gateway",
        summary: "Edge routing, rate limiting, observability, and request authentication.",
        subtext: "Ingress + policy enforcement",
        nodeType: "backend",
        domain: "operations",
        ring: 2,
        tags: ["api", "gateway"],
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    description: "Persistent stores and governance for product information.",
    templates: [
      {
        id: "data-store",
        label: "Primary Data Store",
        summary: "Relational database with schema, migrations, and retention policies.",
        subtext: "Postgres/Aurora setup",
        nodeType: "backend",
        domain: "data-ai",
        ring: 1,
        tags: ["data", "storage", "foundation"],
      },
      {
        id: "data-management",
        label: "Data Management",
        summary: "Migrations, seeding, indexing, and backup routines for the primary store.",
        subtext: "Ops + lifecycle guardrails",
        nodeType: "backend",
        domain: "operations",
        ring: 2,
        tags: ["data", "ops"],
      },
      {
        id: "data-analytics",
        label: "Analytics Warehouse",
        summary: "Event ingestion, modeling, and BI-ready dataset exports.",
        subtext: "Event streaming + warehouse prep",
        nodeType: "requirement",
        domain: "data-ai",
        ring: 3,
        tags: ["analytics"],
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Capabilities that keep the foundation observable, compliant, and resilient.",
    templates: [
      {
        id: "ops-observability",
        label: "Observability Stack",
        summary: "Logs, metrics, tracing, and alert routing for backend + jobs.",
        subtext: "OpenTelemetry + alerting",
        nodeType: "requirement",
        domain: "operations",
        ring: 2,
        tags: ["observability", "ops"],
      },
      {
        id: "ops-ci",
        label: "CI/CD Pipeline",
        summary: "Build, test, security scans, and promotion workflow for services.",
        subtext: "Pipelines + deployment policies",
        nodeType: "requirement",
        domain: "operations",
        ring: 2,
        tags: ["ci", "cd"],
      },
      {
        id: "ops-infra",
        label: "Infrastructure as Code",
        summary: "Environment blueprints, networking, secrets, and compliance guardrails.",
        subtext: "Terraform/CDK modules",
        nodeType: "doc",
        domain: "operations",
        ring: 2,
        tags: ["iac", "ops"],
      },
    ],
  },
];
