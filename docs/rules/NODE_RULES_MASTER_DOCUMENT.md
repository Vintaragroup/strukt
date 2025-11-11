# Node Layout Rules & Validation Master Document

## 📋 Purpose

This document establishes the **definitive rules, processes, and checks** that must be adhered to when writing or updating code that affects node hierarchy, classification, and layout. This ensures that every code change maintains the integrity of the node structure.

**Location**: `docs/rules/NODE_RULES_MASTER_DOCUMENT.md`

---

## 🎯 Core Rules (Non-Negotiable)

### Rule 1: Ring Hierarchy Structure
```
R0: Center node (exactly 1)
    ↓
R1: Classification nodes (exactly 5)
    - business-model
    - business-operations
    - marketing-gtm
    - app-frontend
    - app-backend
    ↓
R2: Domain parent intermediates (6-10 max)
    - Classification parents for R3+ nodes
    ↓
R3+: Feature/Detail nodes (unlimited)
    - Backend services, UI components, infrastructure, data nodes, etc.
```

**Constraint**: `ring = parent.ring + 1` (mathematically enforced)

### Rule 2: Classification Nodes

**Definition**: Nodes with `type: 'classification'` or `classificationKey` set

**Constraints**:
- ✅ MUST be on ring 1 ONLY
- ✅ MUST have center node as parent
- ✅ MUST be linked directly from center via edge
- ❌ CANNOT be children of other classifications
- ❌ CANNOT skip to R3 or higher

**Code Location**: `client/src/config/classifications.ts`

### Rule 3: Feature/Backend/Frontend Nodes

**Definition**: Nodes with `type: 'backend'`, `'frontend'`, `'requirement'`, or `'doc'` (non-classification)

**Constraints**:
- ✅ MUST have classification or domain-parent as direct parent
- ✅ MUST be on ring ≥ 2 (never R1)
- ✅ Ring calculated as: `parent.ring + 1`
- ❌ CANNOT be direct children of center (except classifications)
- ❌ CANNOT be on R1 (ring 1 reserved for classifications)

**Code Location**: Association rules in `client/src/config/foundationEdges.ts`

### Rule 4: Domain Parent Intermediate Nodes

**Definition**: Auto-generated R2 nodes that bridge classifications to features

**Constraints**:
- ✅ MUST be ring 2
- ✅ MUST have classification (R1) as parent
- ✅ MUST have features (R3+) as children
- ✅ MUST be created if missing when linking R1→R3
- ❌ CANNOT be manually deleted (recreated on load)

**Code Location**: Created by `processFoundationEdges()` in `client/src/config/foundationEdges.ts`

### Rule 5: Edge Relationships

**Allowed Connections**:
```
✅ R0 → R1 (center to classifications)
✅ R1 → R2 (classifications to domain parents)
✅ R2 → R3+ (domain parents to features)
✅ R3+ → R3+ (features to features)
```

**Forbidden Connections**:
```
❌ R0 → R3+ (skips rings)
❌ R1 → R3+ (skips R2)
❌ R3 → R1 (ring reversion)
❌ Cycles (node → ... → node)
❌ Orphan nodes without parents
```

---

## ✅ Validation Rules (Enforced Automatically)

### Validation Check 1: Ring Hierarchy Validation

**Location**: `client/src/utils/ringHierarchyValidator.ts`

**What It Checks**:
```typescript
✅ Center node is R0
✅ Classification nodes are R1
✅ Each child ring = parent.ring + 1
✅ No ring reversions
✅ No orphan nodes (except center)
✅ Ring values in valid range (0-6)
✅ No cycles in graph
```

**When It Runs**:
- On workspace load (automatically)
- On node creation (when creating new nodes)
- On edge changes (when connecting nodes)
- On validation commands (user can run manually)

### Validation Check 2: Association Rules

**Location**: `client/src/config/foundationEdges.ts` (lines 57-400+)

**What It Checks**:
```typescript
✅ Feature nodes linked to correct parent by type
✅ Backend nodes → "Backend & APIs" parent
✅ Frontend nodes → "Frontend & UI" parent
✅ Data nodes → "Data & AI" parent
✅ Infrastructure nodes → "Infrastructure & Platform"
✅ Ring always 2 in all rules
✅ Intermediate nodes created if missing
```

### Validation Check 3: Classification Backbone

**Location**: `client/src/config/classifications.ts` (lines 152-300)

**What It Checks**:
```typescript
✅ All 5 primary classifications exist
✅ Exactly ring 1 for all classifications
✅ Edges exist from center to each classification
✅ No misplaced classification nodes
✅ Classification keys properly set
```

### Validation Check 4: Migration Validators

**Location**: `client/src/utils/migrations/classificationMigrate.ts`

**What It Checks**:
```typescript
✅ Feature nodes on R1 are reclassified
✅ Nodes without parents get parents
✅ Ring reassigned to parent.ring + 1
✅ Edges updated to new parents
```

---

## 🔄 Required Processes (For Every Code Change)

### Process 1: Node Creation

**When adding NEW code that creates nodes**, follow this process:

```
1. Determine node type (backend, frontend, requirement, classification, etc.)
   ↓
2. Look up in ASSOCIATION_RULES or type mapping
   ↓
3. Find ideal parent (must exist or create it)
   ↓
4. Calculate ring = parent.ring + 1
   ↓
5. Create node with:
   - nodeId: Unique identifier
   - type: Correct type
   - ring: Calculated value
   - parentId: Parent node ID
   - domain: Correct domain
   ↓
6. Create edge: parent → new_node
   ↓
7. Validate with validateRingHierarchy()
   ✅ All checks pass
```

**Code Template**:
```typescript
// ✅ CORRECT WAY - Auto-assign parent
const parent = getClassificationParentId(
  nodes,
  nodeType,      // "backend", "frontend", etc.
  nodeDomain,    // "tech", "business", etc.
  nodeTags,
  nodeLabel
);

const newNode = {
  id: createNodeId(),
  type: nodeType,
  ring: parent ? parentRing + 1 : 1,  // parent.ring + 1
  parentId: parent,
  domain: nodeDomain,
  // ... other fields
};

// ❌ WRONG WAY - Defaulting to center
const newNode = {
  id: createNodeId(),
  type: nodeType,
  ring: 1,  // ← WRONG, should calculate from parent
  parentId: 'center',  // ← WRONG for feature nodes
};
```

### Process 2: Node Update/Modification

**When updating existing node code**, follow this process:

```
1. Identify what's being changed (type, domain, parent, ring, etc.)
   ↓
2. Check if change affects hierarchy
   ↓
3. If RING changes:
   - Validate new ring = parent.ring + 1
   - Update all children's rings
   - Run validateRingHierarchy()
   ↓
4. If PARENT changes:
   - Verify parent exists
   - Verify new_parent.ring < old_ring
   - Update edge from old_parent to new_parent
   - Recalculate all child rings
   - Run validateRingHierarchy()
   ↓
5. If TYPE changes:
   - Check ASSOCIATION_RULES for new type
   - Verify parent type is compatible
   - If parent wrong, reparent to correct one
   - Run validateRingHierarchy()
   ↓
6. Test: Load workspace and check logs
```

### Process 3: Code Review Checklist

**Before committing code that affects nodes**, verify:

```
Ring Hierarchy:
  ✅ All nodes have ring property set
  ✅ Center is R0
  ✅ Classifications are R1 only
  ✅ Features are R2+ only
  ✅ ring = parent.ring + 1 for all nodes
  ✅ No ring reversions in hierarchy

Parent-Child Relationships:
  ✅ All non-center nodes have parents
  ✅ Feature nodes have classification/domain parents (never center)
  ✅ No orphan nodes
  ✅ Edges exist for all parent-child relationships
  ✅ No cycles

Specific Node Types:
  ✅ Classification nodes: type set, classificationKey set, R1 only
  ✅ Backend nodes: in foundationEdges.ts ASSOCIATION_RULES
  ✅ Frontend nodes: in foundationEdges.ts ASSOCIATION_RULES
  ✅ Data/Infrastructure nodes: have R2 parents

Validation:
  ✅ validateRingHierarchy() passes
  ✅ Console shows no [ERROR] logs
  ✅ Migration logs show expected results
  ✅ No orphaned nodes
```

### Process 4: Testing After Changes

**When you make changes to node code**, test with:

```
1. Load workspace with existing nodes
   - Check console: [classification-migrate] logs
   - Verify nodes are on correct rings
   - Validate no orphan nodes

2. Create new node
   - Verify parent auto-assigned
   - Verify ring = parent.ring + 1
   - Verify edge created

3. Delete/modify node
   - Verify children updated
   - Verify no orphans
   - Run validation again

4. Run validation script:
   node client/src/utils/validatorRunner.ts
   (should show all PASS)
```

---

## 🛡️ Safeguards & Auto-Fixes

### Auto-Fix 1: Classification Migration

**What It Does**: Automatically fixes misclassified feature nodes on R1

**Triggers**: Every workspace load (idempotent)

**Code**:
```typescript
// In App.tsx, workspace loading:
if (!isKnownBlank) {
  migrated = migrateNodesToClassifications(flowNodes, flowEdges);
  // Auto-detects nodes needing reclassification
  // Updates ring, parent, edges
}
```

**Result**: Any feature nodes incorrectly on R1 are moved to R2-R3

### Auto-Fix 2: Foundation Edge Processing

**What It Does**: Creates missing intermediate R2 nodes between R1 classifications and R3 features

**Triggers**: When processing foundation nodes (≥ R3)

**Code**:
```typescript
// In App.tsx, after classification migration:
const foundationResult = processFoundationEdges(flowNodes, flowEdges);
// Auto-creates intermediates if needed
```

**Result**: All feature nodes properly connected through complete R0→R1→R2→R3+ chain

### Auto-Fix 3: Ring Recalculation

**What It Does**: Automatically recalculates ring for children when parent ring changes

**Triggers**: After reparenting or updates

**Code**:
```typescript
// When parent ring changes:
children.forEach(child => {
  if (!child.data.explicitRing) {  // Unless explicitly set
    child.data.ring = parent.ring + 1;
  }
});
```

---

## 📚 Key Files & Their Purposes

| File | Purpose | Key Rules |
|------|---------|-----------|
| `ringHierarchyValidator.ts` | Validates ring hierarchy | R0 center, R1 classifications, ring=parent+1 |
| `foundationEdges.ts` | Association rules & auto-generation | Parent types, ring=2 for R2 nodes |
| `classifications.ts` | Classification backbone | 5 classifications on R1 only |
| `classificationMigrate.ts` | Auto-fixes misclassified nodes | Reclassify features from R1 to R2+ |
| `graphOps.ts` | Node creation utilities | Auto-assign classification parents |
| `App.tsx` (lines 1340-1430) | Workspace loading pipeline | Runs all migrations in order |

---

## 🔴 Common Mistakes (DO NOT DO)

### ❌ Mistake 1: New Feature Node on R1
```typescript
// WRONG
const node = {
  ring: 1,  // ← Feature should never be R1!
  parentId: 'center',  // ← Should have classification parent
}
```

**Fix**: Calculate ring from parent: `ring = parent.ring + 1`

### ❌ Mistake 2: Skipping R2 Entirely
```typescript
// WRONG
// Direct connection: R1 classification → R3 feature
// Missing R2 domain parent!
```

**Fix**: Let `processFoundationEdges()` create R2 intermediate if missing

### ❌ Mistake 3: Inconsistent Ring Calculation
```typescript
// WRONG
const ring = suggestion.ring || 1;  // ← Defaults to 1, wrong!

// CORRECT
const parentRing = parentNode?.data?.ring;
const ring = parentRing ? parentRing + 1 : undefined;
```

### ❌ Mistake 4: No Classification Parent
```typescript
// WRONG - Defaulting to center
const parent = centerNodeId;  // ← For feature nodes!

// CORRECT - Resolve classification
const parent = getClassificationParentId(nodes, type, domain);
const parent = parent || centerNodeId;  // Only fallback if no classification
```

### ❌ Mistake 5: Manual Ring Assignment
```typescript
// WRONG
node.data.ring = 2;  // ← Hard-coding, what if parent changes?

// CORRECT
node.data.ring = parentNode.data.ring + 1;  // ← Dynamic calculation
node.data.explicitRing = true;  // ← Only if intentionally overriding
```

---

## ✨ Best Practices

### Best Practice 1: Always Use Validators

```typescript
// ✅ GOOD - Check after changes
const result = validateRingHierarchy(nodes, edges);
if (!result.isValid) {
  throw new Error(`Hierarchy violations: ${JSON.stringify(result.violations)}`);
}
```

### Best Practice 2: Look Up Rules First

```typescript
// ✅ GOOD - Check association rules before creating
const rule = ASSOCIATION_RULES[nodeId] || ASSOCIATION_RULES[nodeType];
const parent = rule?.idealParent;
```

### Best Practice 3: Create Parents Automatically

```typescript
// ✅ GOOD - Auto-create if missing
if (rule?.createIntermediateIfMissing && !parentExists) {
  createIntermediateNode(rule.idealParent);
}
```

### Best Practice 4: Log Changes

```typescript
// ✅ GOOD - Document what changed
console.log('[reclassify]', {
  nodeId: node.id,
  from: oldParent,
  to: newParent,
  newRing: newRing,
});
```

### Best Practice 5: Use Type Safety

```typescript
// ✅ GOOD - Type-safe node creation
interface NewNodeParams {
  type: 'backend' | 'frontend' | 'requirement';
  domain: string;
  label: string;
  tags?: string[];
}

function createNode(params: NewNodeParams): Node {
  const parent = getClassificationParentId(...);
  // Type-safe from here on
}
```

---

## 🧪 Validation Commands

### Run Ring Hierarchy Validation

```bash
# In browser console:
import { validateRingHierarchy } from '@/utils/ringHierarchyValidator'
const result = validateRingHierarchy(nodes, edges)
console.table(result.violations)  // See any problems
```

### Check Node Distribution by Ring

```javascript
// In browser console:
const byRing = {};
nodes.forEach(n => {
  const ring = n.data?.ring ?? -1;
  byRing[ring] = (byRing[ring] || 0) + 1;
});
console.table(byRing);
// Expected: {0: 1, 1: 5, 2: 10-15, 3+: ...}
```

### Monitor Migration Logs

```javascript
// In browser console (on workspace load):
// Look for these logs:
// [classification-migrate] applied - nodes reclassified
// [foundation-edges] Processing - intermediates created
// [ERROR] - indicates problem
```

---

## 🎯 Summary: What Must NOT Break

When writing or updating code, ALWAYS ensure these never break:

```
1. ✅ ring = parent.ring + 1 (mathematical property)
2. ✅ Classification nodes are R1 only
3. ✅ Feature nodes are R2+ only (never R1)
4. ✅ No direct R1 → R3 edges (must go through R2)
5. ✅ All nodes have parents (except center)
6. ✅ validateRingHierarchy() passes
7. ✅ No orphan nodes
8. ✅ No cycles in graph
```

These are the **non-negotiable invariants**. If any break, the system is in an invalid state and must be fixed before merging/deploying.

---

**This document is the SOURCE OF TRUTH for node hierarchy rules and validation processes. Keep it updated as requirements change, and reference it in code reviews.**

**Location**: `docs/rules/NODE_RULES_MASTER_DOCUMENT.md`
