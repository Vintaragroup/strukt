// @ts-nocheck
// Configurable layout recipes for process (inline) view.
// Each recipe defines a set of columns with matching rules and optional explicit row ordering.
// This lets us match curated arrangements (like your Image 1) deterministically.

import type { Node } from "@xyflow/react";

export type MatchRule = {
  // Match by node.data.type or label/title using case-insensitive regex
  type?: string[]; // e.g., ["requirement", "policy"]
  label?: RegExp[]; // e.g., [/auth/i, /policy/i]
};

export type ColumnSpec = {
  id: string;
  label: string; // UI/diagnostics only
  match: MatchRule[]; // any rule can match (OR)
  order?: string[]; // preferred label order top->bottom (regex strings allowed)
  maxRows?: number; // optional cap, overflow spills to next column of same kind
};

export type LayoutRecipe = {
  id: string;
  title: string;
  // Ordered columns left->right in process view
  columns: ColumnSpec[];
  // Optional detector to activate this recipe
  detect?: (nodes: Node[]) => boolean;
  // Horizontal spacing multipliers from center (in units of avg node width)
  spacing?: number[]; // same length as columns; defaults to [1.25, 2.25, 3.25, ...]
  // Vertical baseline offsets (in units of avg node height)
  baselines?: number[]; // same length as columns; defaults to [ -1, 0, 1, 2 ]
};

const re = (s: string) => new RegExp(s, "i");

// A default Auth recipe matching the arrangement shown in Image 1
export const AUTH_RECIPE: LayoutRecipe = {
  id: "auth",
  title: "Authentication stack",
  columns: [
    {
      id: "requirements",
      label: "Requirements & Policies",
      match: [
        { type: ["requirement"], label: [re("auth"), re("requirement"), re("onboarding"), re("password"), re("policy"), re("role"), re("permissions")] },
        { label: [re("MFA"), re("policy")] },
      ],
      order: [
        "Auth Requirements",
        "MFA Policy",
        "Onboarding Flow",
        "Password Policy",
        "Role & Permissions Model",
      ],
      maxRows: 6,
    },
    {
      id: "services",
      label: "Core Services",
      match: [
        { type: ["backend", "service"], label: [re("session"), re("audit"), re("rate"), re("requirements")] },
        { label: [re("session"), re("audit"), re("rate"), re("requirement")] },
      ],
      order: [
        "Session Management",
        "Audit Logging",
        "Rate Limiting",
      ],
      maxRows: 5,
    },
    {
      id: "providers",
      label: "Providers & Storage",
      match: [
        { type: ["backend"], label: [re("OIDC"), re("provider"), re("storage"), re("data"), re("observability")] },
        { label: [re("OIDC"), re("Storage"), re("Observability")] },
      ],
      order: [
        "Observability",
        "OIDC Provider",
        "Data Storage",
      ],
      maxRows: 5,
    },
    {
      id: "ui",
      label: "UI / Product",
      match: [
        { type: ["frontend", "product"], label: [re("UI"), re("Customization")] },
      ],
      order: [
        "UI Customization",
      ],
      maxRows: 2,
    },
    {
      id: "users",
      label: "User Nodes",
      match: [
        { label: [re("User Auth"), re("User")] },
      ],
      order: [
        "User Auth",
      ],
      maxRows: 3,
    },
  ],
  detect: (nodes) => {
    const labels = new Set(
      nodes.map((n) => String((n.data?.label ?? n.data?.title ?? n.id) as string).toLowerCase())
    );
    return labels.has("oidc provider") || labels.has("auth requirements") || labels.has("session management");
  },
  spacing: [1.25, 2.25, 3.25, 1.0, 4.25],
  baselines: [-1.25, -0.25, -0.25, 1.25, 1.5],
};

// Payments (Checkout/Billing) recipe
export const PAYMENTS_RECIPE: LayoutRecipe = {
  id: "payments",
  title: "Payments flow",
  columns: [
    {
      id: "requirements",
      label: "Requirements & Policies",
      match: [
        { type: ["requirement", "policy"], label: [re("PCI"), re("risk"), re("refund"), re("chargeback")] },
        { label: [re("PCI"), re("KYC"), re("AML"), re("risk")] },
      ],
      order: ["PCI Compliance", "Risk Policy", "Refund Policy", "Chargeback Handling"],
      maxRows: 6,
    },
    {
      id: "services",
      label: "Core Services",
      match: [
        { type: ["backend", "service"], label: [re("payment"), re("gateway"), re("webhook"), re("fraud"), re("billing")] },
        { label: [re("Payment Gateway"), re("Webhook"), re("Fraud")] },
      ],
      order: ["Payment Gateway", "Webhook Processor", "Fraud Service"],
      maxRows: 5,
    },
    {
      id: "storage",
      label: "Ledger & Storage",
      match: [
        { type: ["backend"], label: [re("ledger"), re("transaction"), re("billing"), re("invoice"), re("payout")] },
        { label: [re("Ledger"), re("Transactions DB"), re("Invoices")] },
      ],
      order: ["Ledger", "Transactions DB", "Invoices"],
      maxRows: 5,
    },
    {
      id: "ui",
      label: "UI / Product",
      match: [
        { type: ["frontend", "product"], label: [re("checkout"), re("billing"), re("portal")] },
        { label: [re("Checkout"), re("Billing Portal")] },
      ],
      order: ["Checkout", "Billing Portal"],
      maxRows: 3,
    },
    {
      id: "users",
      label: "Users",
      match: [
        { label: [re("Merchant"), re("Customer"), re("Buyer"), re("Seller")] },
      ],
      order: ["Customers", "Merchants"],
      maxRows: 3,
    },
  ],
  detect: (nodes) => {
    const labels = new Set(
      nodes.map((n) => String((n.data?.label ?? n.data?.title ?? n.id) as string).toLowerCase())
    );
    const keys = ["checkout", "payment gateway", "billing", "ledger", "invoices", "fraud"];
    return keys.some((k) => labels.has(k));
  },
  spacing: [1.25, 2.25, 3.25, 1.0, 4.25],
  baselines: [-1.25, -0.25, -0.25, 1.25, 1.5],
};

// Analytics (Data + Dashboards) recipe
export const ANALYTICS_RECIPE: LayoutRecipe = {
  id: "analytics",
  title: "Analytics pipeline",
  columns: [
    {
      id: "sources",
      label: "Event Sources",
      match: [
        { type: ["frontend", "service"], label: [re("event"), re("tracking"), re("sdk"), re("telemetry")] },
      ],
      order: ["Client SDK", "Server Telemetry"],
      maxRows: 4,
    },
    {
      id: "ingestion",
      label: "Ingestion",
      match: [
        { type: ["service"], label: [re("collector"), re("ingest"), re("stream"), re("kafka")] },
      ],
      order: ["Event Collector", "Stream Ingest"],
      maxRows: 4,
    },
    {
      id: "processing",
      label: "Processing",
      match: [
        { type: ["service"], label: [re("etl"), re("transform"), re("enrich"), re("jobs")] },
      ],
      order: ["ETL Jobs", "Enrichment"],
      maxRows: 5,
    },
    {
      id: "storage",
      label: "Storage",
      match: [
        { type: ["backend"], label: [re("warehouse"), re("lake"), re("metrics"), re("timeseries")] },
        { label: [re("Data Warehouse"), re("Data Lake"), re("Timeseries DB")] },
      ],
      order: ["Data Warehouse", "Timeseries DB"],
      maxRows: 5,
    },
    {
      id: "dashboards",
      label: "Dashboards",
      match: [
        { type: ["product", "frontend"], label: [re("dashboard"), re("report"), re("BI"), re("metrics")] },
        { label: [re("Dashboard"), re("BI"), re("Metrics")] },
      ],
      order: ["Dashboards", "Reports"],
      maxRows: 3,
    },
  ],
  detect: (nodes) => {
    const labels = new Set(
      nodes.map((n) => String((n.data?.label ?? n.data?.title ?? n.id) as string).toLowerCase())
    );
    const keys = ["dashboard", "data warehouse", "event collector", "metrics", "analytics"];
    return keys.some((k) => labels.has(k));
  },
  spacing: [1.25, 2.25, 3.25, 4.25, 5.25],
  baselines: [-1.25, -0.5, 0.0, 0.75, 1.25],
};

export const RECIPES: LayoutRecipe[] = [AUTH_RECIPE, PAYMENTS_RECIPE, ANALYTICS_RECIPE];

export function detectRecipe(nodes: Node[]): LayoutRecipe | null {
  for (const r of RECIPES) {
    try { if (r.detect?.(nodes)) return r } catch {
      // Silently skip recipes that fail detection
    }
  }
  return null;
}

export function matchColumnForNode(node: Node, col: ColumnSpec): boolean {
  const type = String(node?.data?.type || "").toLowerCase();
  const label = String((node.data?.label ?? node.data?.title ?? node.id) as string);
  return col.match.some((rule) => {
    const typeOk = !rule.type || rule.type.some((t) => type.includes(t.toLowerCase()));
    const labelOk = !rule.label || rule.label.some((rx) => rx.test(label));
    return typeOk && labelOk;
  });
}
