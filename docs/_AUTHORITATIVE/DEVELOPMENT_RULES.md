# AUTHORITATIVE: Development Rules & Constraints

**Status**: ✅ LOCKED - These rules are verified and enforced. Do not violate.

---

## 🎯 Core Principle

**The system is ASSOCIATION-DRIVEN, not POSITION-DRIVEN**

Users cannot place nodes arbitrarily. Everything is determined by:

1. Node **type** (backend/frontend/requirement/doc)
2. Node **domain** (business/product/tech/data-ai/operations)
3. Ring **hierarchy** (parent.ring + 1)
4. Domain **sector** (angle-based positioning)

---

## 🛑 Hard Constraints (CANNOT VIOLATE)

### Constraint 1: Ring Hierarchy is Immutable

```
RULE: newNodeRing = parentNode.ring + 1

Code enforcement:
  const enforcedRing = Math.max(
    normalizedRing,        // user input (ignored if lower)
    parentRing + 1,        // MINIMUM (always enforced)
    domainMinRing          // domain requirement
  );

  // Result: Ring ALWAYS increments by 1
  // No exceptions. No overrides.
  // Invalid: Creating R4 node from R2 parent (would become R3)
  // Invalid: User choosing ring directly
```

### Constraint 2: Classification Parent is Determined by Type + Domain

```
RULE: parentId = getClassificationParentId(type, domain)

Implementation:
  └─ getClassificationParentId() reads classification lookup table
  └─ Input: node type ("backend", "frontend", etc.)
  └─ Input: node domain ("tech", "product", etc.)
  └─ Output: Ring 1 classification node ID

  // Cannot be overridden
  // Cannot be user input
  // Cannot be drag source (if different)

  Example:
    Input: type="backend", domain="tech"
    Output: "classification-app-backend" (always)
    Even if user drags from "classification-app-frontend"
```

### Constraint 3: Drag Source is NOT Connection Source

```
RULE: dragSourceNodeId ≠ connectionSourceId (usually)

When user drags from Node A to create Node B:
  dragSourceNodeId = A.id         // Used to lookup A's ring
  connectionSourceId = getClassificationParentId(B.type, B.domain)

  // A is only used for ring lookup
  // Actual edge source is the classification

  Example:
    User drags from "Swagger API Server" (R3) to create auth requirement
    dragSourceNodeId = "swagger-xyz"
    parentRing = 3
    connectionSourceId = getClassificationParentId("requirement", "tech")
                      = "classification-app-backend" (R1)
    Result: Edge goes from R1 classification to new node
            NOT from Swagger (R3)
```

### Constraint 4: Position is Calculated, Not User Input

```
RULE: position = calculateNewNodePosition(domain, ring)

Implementation:
  ├─ domainAngle = DOMAIN_CONFIG[domain].angle
  │  ├─ business: 180° (west)
  │  ├─ product: 270° (south)
  │  ├─ tech: 0° (east)
  │  ├─ data-ai: 90° (north)
  │  └─ operations: 225° (southwest)
  │
  ├─ radius = RING_RADII[ring - 1]
  │  ├─ R1: 80px
  │  ├─ R2: 160px
  │  ├─ R3: 240px
  │  └─ etc.
  │
  ├─ Find best available slot in domain sector at radius
  └─ Calculate (x, y) = center + (radius × cos/sin of angle)

  // Cannot be modified by user
  // Cannot be dragged after creation (position recalculated)
  // Cannot place in wrong sector
```

### Constraint 5: No Cycles EVER

```
RULE: Graph must be acyclic. Always.

Validation:
  ├─ Before every edge creation:
  │   └─ Run cycle detection algorithm
  │   └─ If cycle detected → edge rejected
  │   └─ User sees error explaining why
  │
  ├─ Single root (center node)
  ├─ No orphaned nodes
  └─ All edges flow parent → child direction

  // Invalid: A→B→C→A edge chain
  // Invalid: Creating connection that would form cycle
  // Invalid: Deleting center (would orphan tree)
```

### Constraint 6: Classification Nodes are Immutable

```
RULE: Ring 1 classification nodes cannot be created/deleted/modified by users

Classification nodes:
  ├─ Ring 1 (fixed)
  ├─ 10 total nodes (fixed)
  ├─ Immutable structure
  ├─ Immutable relationships
  └─ Seeded at system start

  // Invalid: User deletes "classification-app-backend"
  // Invalid: User creates new classification
  // Invalid: User modifies classification properties
```

---

## ✅ What Developers CAN Do

### DO: Create R2 Domain Parent

```typescript
When auto-creating for a domain:
  └─ Check if R2 parent exists
  └─ If not: Create it (parent = appropriate classification)
  └─ If yes: Reuse it

Code pattern:
  const parentId = findOrCreateDomainParent(domain);
  // Returns existing or creates new R2 parent
```

### DO: Create R3 Implementation Nodes

```typescript
When auto-creating scaffold:
  └─ Create multiple R3 nodes under R2 parent
  └─ Each gets ring = 2 + 1 = 3
  └─ Each gets position from domain + ring 3

Code pattern:
  const nodeIds = [];
  for (const config of nodeConfigs) {
    const newNode = createNode({
      parentId: r2ParentId,
      type: config.type,
      domain: config.domain,
      ring: 3  // Always 3 for R3 children of R2 parent
    });
    nodeIds.push(newNode.id);
  }
```

### DO: Create Associations Between Nodes

```typescript
When adding relationships:
  └─ Use valid relationship types (depends-on, implements, etc.)
  └─ Always validate no cycles
  └─ Always validate hierarchy (source.ring < target.ring)

Code pattern:
  const cycleCheck = detectCycle(nodes, edges, newEdge);
  if (cycleCheck.hasCycle) {
    throw new Error("This would create a cycle");
  }
  edges.push(newEdge);
```

### DO: Smart Deduplication

```typescript
Before creating node:
  ├─ Check if label exists
  ├─ Check if type + domain match exists
  ├─ Do fuzzy keyword match
  └─ If found: Reuse and add associations instead

Code pattern:
  const existing = findExistingNode(label, type, domain, nodes);
  if (existing) {
    // Add associations instead of creating
    const newEdges = createAssociationsForExisting(existing, config);
    edges.push(...newEdges);
  } else {
    // Create new node
    const newNode = createNode(config);
    nodes.push(newNode);
  }
```

### DO: Validate Before Persisting

```typescript
Before saving workspace:
  ├─ Verify all nodes exist (no dangling edges)
  ├─ Verify no cycles
  ├─ Verify ring hierarchy (parent.ring < child.ring)
  ├─ Verify classifications intact (all 10 present)
  └─ Verify no orphaned nodes

Code pattern:
  const validation = validateWorkspace(nodes, edges);
  if (!validation.isValid) {
    console.error("Invalid workspace:", validation.errors);
    return false;
  }
  saveWorkspace(nodes, edges);
```

---

## ❌ What Developers CANNOT Do

### DON'T: Let User Choose Ring

```
❌ WRONG:
  const ring = getUserInput("What ring?");
  createNode({ ring });

✅ RIGHT:
  const ring = parentNode.ring + 1;  // Always calculated
  createNode({ ring });
```

### DON'T: Use Drag Source as Connection Target

```
❌ WRONG:
  const edge = {
    source: dragSourceNodeId,  // Used as parent
    target: newNodeId
  };

✅ RIGHT:
  const classificationParent = getClassificationParentId(
    newNode.type,
    newNode.domain
  );
  const edge = {
    source: classificationParent,  // Always the classification
    target: newNodeId
  };
```

### DON'T: Place Nodes Based on Mouse Position

```
❌ WRONG:
  const position = {
    x: event.clientX,
    y: event.clientY
  };
  createNode({ position });

✅ RIGHT:
  const position = calculateNewNodePosition(
    domain,  // Determines sector
    ring     // Determines distance
  );
  createNode({ position });
```

### DON'T: Allow Cycles

```
❌ WRONG:
  edges.push(edgeFromAToB);
  edges.push(edgeFromBToC);
  edges.push(edgeFromCToA);  // Creates cycle

✅ RIGHT:
  const cycleCheck = detectCycle(nodes, edges, newEdge);
  if (cycleCheck.hasCycle) {
    return showError("This creates a cycle");
  }
  edges.push(newEdge);
```

### DON'T: Delete or Modify Classifications

```
❌ WRONG:
  deleteNode("classification-app-backend");

✅ RIGHT:
  // Classification nodes are immutable
  // Cannot be deleted
  // Cannot be modified
```

### DON'T: Skip Ring Levels

```
❌ WRONG:
  const ring = userInput || 4;  // User could input 4
  createNode({ ring });

✅ RIGHT:
  const ring = Math.max(
    parentRing + 1,  // MINIMUM (always enforced)
    userInput        // User input only increases it
  );
  createNode({ ring });
```

---

## 🔍 Code Review Checklist

When reviewing PRs for node creation/modification:

```
Ring Hierarchy:
  ☐ Is ring calculated (not user input)?
  ☐ Is ring = parent.ring + 1?
  ☐ Is Math.max() used to enforce minimum?

Classification Parent:
  ☐ Does it call getClassificationParentId()?
  ☐ Is parent determined by type + domain?
  ☐ Is dragSourceNodeId only used for lookup?

Position Calculation:
  ☐ Does it call calculateNewNodePosition()?
  ☐ Is domain used for angle?
  ☐ Is ring used for radius?
  ☐ Is mouse position ignored?

Cycle Prevention:
  ☐ Does it call detectCycle()?
  ☐ Are invalid edges rejected?
  ☐ Is error message user-friendly?

Deduplication:
  ☐ Does it check for existing nodes?
  ☐ Does it reuse if found?
  ☐ Does it add associations instead of duplicating?

Validation:
  ☐ Are all edges to valid nodes?
  ☐ Are classifications intact?
  ☐ Is single root maintained?
```

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: User-Chosen Rings

```
❌ BAD:
  let ring = 2;
  if (userSelectedRing === "Ring 3") ring = 3;

✅ GOOD:
  const ring = parentNode.ring + 1;  // Always calculated
```

### Mistake 2: Drag Source as Parent

```
❌ BAD:
  const newEdge = {
    source: dragSourceNode.id,  // Wrong!
    target: newNode.id
  };

✅ GOOD:
  const classificationParent = getClassificationParentId(
    newNode.type,
    newNode.domain
  );
  const newEdge = {
    source: classificationParent,  // Right!
    target: newNode.id
  };
```

### Mistake 3: Position from Mouse

```
❌ BAD:
  const position = {
    x: mouseEvent.clientX - canvasOffset.x,
    y: mouseEvent.clientY - canvasOffset.y
  };

✅ GOOD:
  const position = calculateNewNodePosition(
    newNode.data.domain,
    newNode.data.ring
  );
```

### Mistake 4: No Cycle Check

```
❌ BAD:
  edges.push(newEdge);  // Might create cycle

✅ GOOD:
  const cycleCheck = detectCycle(nodes, edges, newEdge);
  if (cycleCheck.hasCycle) {
    throw new Error("Would create cycle");
  }
  edges.push(newEdge);
```

### Mistake 5: Modifying Classifications

```
❌ BAD:
  classification.data.ring = 2;  // Can't do this

✅ GOOD:
  // Leave classifications alone
  // They're immutable system nodes
```

---

## ✅ Verification Tests

Before shipping any feature:

```typescript
test("Ring hierarchy: new node ring = parent.ring + 1", () => {
  const parentRing = 2;
  const newNode = createNode({ parentId: parent.id });
  expect(newNode.data.ring).toBe(3);
});

test("Classification parent determined by type + domain", () => {
  const node = createNode({ type: "backend", domain: "tech" });
  expect(node.data.parentId).toBe("classification-app-backend");
});

test("Position calculated from domain + ring", () => {
  const node = createNode({
    domain: "tech", // 0°
    ring: 3, // 240px
  });
  expect(node.position).toBeTruthy();
  expect(node.position.x).toBeGreaterThan(0); // East
});

test("Cycle detection prevents invalid edges", () => {
  // Create A→B→C
  const edges = [
    { source: A.id, target: B.id },
    { source: B.id, target: C.id },
  ];

  // Try to create C→A (cycle)
  const cycleCheck = detectCycle(nodes, edges, {
    source: C.id,
    target: A.id,
  });

  expect(cycleCheck.hasCycle).toBe(true);
});

test("Deduplication: second run reuses nodes", () => {
  // First auto-create
  const nodes1 = autoCreateBackend(config);
  const swagger1 = nodes1.find((n) => n.label === "Swagger");

  // Second auto-create (same config)
  const nodes2 = autoCreateBackend(config);
  const swagger2 = nodes2.find((n) => n.label === "Swagger");

  // Should be same node
  expect(swagger1.id).toBe(swagger2.id);

  // Should have MORE edges (new associations)
  expect(nodes2.edges.length).toBeGreaterThan(nodes1.edges.length);
});
```

---

## 🎓 When in Doubt

**Ask yourself**:

1. Is the ring calculated (not user input)?
2. Is the parent determined by type+domain?
3. Is the position calculated from domain+ring?
4. Could this create a cycle?
5. Does it follow the auto-create pattern?

If you can't answer "yes" to all 5 → Ask for review before implementing

---

**Last Updated**: Today  
**Status**: LOCKED - Verified & Enforced  
**Questions**: See CURRENT_ARCHITECTURE.md or QUICK_START.md
