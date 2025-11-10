import type { Node } from "@xyflow/react";
import type { CustomNodeData } from "@/components/CustomNode";
import { FOUNDATION_CATEGORIES } from "@/config/foundationNodes";

/**
 * Foundation Template Migration
 * 
 * Assigns parentId to foundation template nodes based on their category and ring.
 * This ensures:
 * - Frontend templates (ring 3-4) are children of classification-app-frontend
 * - Backend templates (ring 3-4) are children of classification-app-backend
 * - Data templates (ring 3-4) are children of classification-data-ai
 * - Infrastructure templates (ring 3) are children of classification-infrastructure
 * - Observability templates (ring 3-4) are children of classification-observability
 * - Security templates (ring 3-4) are children of classification-security
 * 
 * Additionally, ring 4 auth children (OIDC Provider, MFA, etc.) get parentId set to
 * the ring 3 "User Authentication" template node.
 */

export interface FoundationTemplateMigrationResult {
  nodes: Node[];
  applied: boolean;
  debug?: {
    updated: Array<{ id: string; label?: string; newParentId: string; newRing: number }>;
    skipped: Array<{ id: string; label?: string; reason: string }>;
  };
}

// Mapping of foundation category to its classification parent and ring
// Ring hierarchy after Frontend/Backend move to Ring 1:
// Ring 0: Center
// Ring 1: Business Model, Business Ops, Marketing GTM, Application Frontend, Application Backend
// Ring 2: Data/AI, Infrastructure, Observability, Security, Customer Experience (domain specializations)
// Ring 3: Foundation templates (children of their respective Ring 1 or Ring 2 classification)
// Ring 4: Specializations (children of Ring 3)
//
// Frontend templates (category: frontend) → parent: classification-app-frontend (Ring 1) → ring: 2
// Backend templates (category: backend) → parent: classification-app-backend (Ring 1) → ring: 2
// But WAIT - we have 70 existing templates set to Ring 3 in foundationNodes.ts
// We need to keep existing ring assignments but adjust how they map to parents
const CATEGORY_TO_CLASSIFICATION: Record<string, { parentId: string; ring: number }> = {
  frontend: { parentId: "classification-app-frontend", ring: 3 },   // Keep Ring 3 for now - existing templates
  backend: { parentId: "classification-app-backend", ring: 3 },     // Keep Ring 3 for now - existing templates
  data: { parentId: "classification-data-ai", ring: 3 },            // Keep Ring 3 for now - existing templates
  infrastructure: { parentId: "classification-infrastructure", ring: 3 },  // Keep Ring 3 - existing templates
  observability: { parentId: "classification-observability", ring: 3 },    // Keep Ring 3 - existing templates
  security: { parentId: "classification-security", ring: 3 },       // Keep Ring 3 - existing templates
};

// Special handling for ring 4 auth children - they should be children of "User Authentication" (ring 3)
const RING_4_AUTH_PARENT_ID = "backend-authentication";
const AUTH_RING_4_CHILDREN = [
  "backend-identity-provider",
  "backend-mfa-verification",
  "backend-session-management",
  "backend-rbac",
  "backend-audit-logging",
];

const needsFoundationMigration = (nodes: Node[]): boolean => {
  // Check if any foundation templates exist without parentId (or with center as parent)
  return nodes.some((node) => {
    const data = node.data as CustomNodeData;
    const isFountationTemplate = data?.tags?.includes("foundation");
    const hasNoParent = !data?.parentId || data?.parentId === "center";
    return isFountationTemplate && hasNoParent;
  });
};

export const migrateFoundationTemplates = (
  nodes: Node[]
): FoundationTemplateMigrationResult => {
  if (!needsFoundationMigration(nodes)) {
    return { nodes, applied: false, debug: { updated: [], skipped: [] } };
  }

  const updatedLog: Array<{ id: string; label?: string; newParentId: string; newRing: number }> = [];
  const skippedLog: Array<{ id: string; label?: string; reason: string }> = [];

  // Build a map of all foundation template IDs to their category for quick lookup
  const templateToCategoryMap = new Map<string, string>();
  FOUNDATION_CATEGORIES.forEach((category) => {
    category.templates.forEach((template) => {
      templateToCategoryMap.set(template.id, category.id);
    });
  });

  let nextNodes = nodes.map((node) => {
    const data = (node.data || {}) as CustomNodeData;
    const isFountationTemplate = data?.tags?.includes("foundation");
    const templateId = node.id;
    const category = templateToCategoryMap.get(templateId);

    // Skip if not a foundation template or no category found
    if (!isFountationTemplate) {
      return node;
    }

    if (!category) {
      skippedLog.push({
        id: node.id,
        label: data.label,
        reason: "Foundation template category not found in FOUNDATION_CATEGORIES",
      });
      return node;
    }

    // Skip if already has a proper parent (not center)
    if (data?.parentId && data.parentId !== "center") {
      // Double-check ring matches expectations
      const classificationInfo = CATEGORY_TO_CLASSIFICATION[category];
      if (classificationInfo && data.ring === classificationInfo.ring) {
        return node;
      }
    }

    // Determine parent ID based on template type
    let parentId: string;
    let expectedRing: number;

    // Special case: ring 4 auth children should have ring 3 "User Authentication" as parent
    if (AUTH_RING_4_CHILDREN.includes(templateId)) {
      parentId = RING_4_AUTH_PARENT_ID;
      expectedRing = 4;
    } else {
      const classificationInfo = CATEGORY_TO_CLASSIFICATION[category];
      if (!classificationInfo) {
        skippedLog.push({
          id: node.id,
          label: data.label,
          reason: `Unknown foundation category: ${category}`,
        });
        return node;
      }
      parentId = classificationInfo.parentId;
      expectedRing = classificationInfo.ring;
    }

    updatedLog.push({
      id: node.id,
      label: data.label,
      newParentId: parentId,
      newRing: expectedRing,
    });

    return {
      ...node,
      data: {
        ...data,
        parentId,
        ring: expectedRing,
        explicitRing: true, // Lock the ring so layout doesn't recalculate
      },
    };
  });

  return {
    nodes: nextNodes,
    applied: updatedLog.length > 0,
    debug: {
      updated: updatedLog,
      skipped: skippedLog,
    },
  };
};
