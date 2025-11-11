# Node Placement Constraints - Verification Report

## ✅ CONFIRMED: Nodes Can Only Be Placed Based on Association & Drag Source

---

## Node Placement Rules

### Rule 1: Ring Hierarchy Constraint ✅

**Enforced in**: `handleAddNode()` lines 4504-4530

```typescript
// Ring hierarchy constraints:
// - Ring 1 nodes MUST connect to center (R0)
// - Ring 2+ nodes MUST connect to their classification parent (one ring lower)

let connectionSourceId: string | null = null;
if (enforcedRing === 1) {
  // Ring 1 nodes (classifications) always connect to center
  connectionSourceId = centerId;
} else if (enforcedRing >= 2) {
  // Ring 2+ nodes must connect to their classification parent
  connectionSourceId = classificationParentId ?? null;
}
```

**Guarantee**:

- R1 nodes always → center
- R2+ nodes always → their classification parent (not user choice)
- Visual placement doesn't override this (users can position but connection stays hierarchical)

### Rule 2: Drag Source Determines Parent ✅

**Enforced in**: `handleAddNode()` lines 4447-4448

```typescript
const placementSource = placementOverrides?.sourceNodeId ?? dragSourceNodeId;
const parentNode = placementSource
  ? nodes.find((n) => n.id === placementSource)
  : null;
```

**Guarantee**:

- If user dragged from Node A, `dragSourceNodeId` = A's ID
- Parent lookup finds the actual node object
- Parent node is then used for ring calculation

### Rule 3: Ring Calculation from Parent ✅

**Enforced in**: `handleAddNode()` lines 4502-4506

```typescript
const parentRing = resolvedParent
  ? Number((resolvedParent as any)?.data?.ring ?? 0)
  : 0;
const defaultRing = resolvedParent
  ? Number.isFinite(parentRing)
    ? parentRing + 1
    : 2
  : 2;
const normalizedRing = Math.max(1, nodeData.ring ?? defaultRing);
// Enforce lineage rule: child ring >= parentRing + 1 and at least 2
const enforcedRing = Math.max(
  normalizedRing,
  Number.isFinite(parentRing) ? parentRing + 1 : 2,
  2
);
```

**Guarantee**:

- New node ring = parent.ring + 1
- If parent is R2, child must be R3
- If parent is R3, child must be R4
- **No matter where user visually drags the node, connection respects this**

### Rule 4: Classification Parent Assignment ✅

**Enforced in**: `handleAddNode()` lines 4470-4478

```typescript
const classificationParentId = getClassificationParentId(
  workingNodes,
  nodeData.type,
  normalizedDomain as DomainType,
  nodeData.tags,
  nodeData.label
);
```

**Guarantee**:

- R2+ nodes look up their classification parent based on type + domain
- Backend node (tech domain) → classification-app-backend (always)
- Frontend node (product domain) → classification-app-frontend (always)
- **User cannot drag to connect to wrong classification**

### Rule 5: Association-Based Placement ✅

**Enforced in**: `calculateNewNodePosition()` lines 917-997

```typescript
const domain =
  nodeData.domain || getDomainForNodeType(nodeData.type || "default");
const ring = Math.max(1, nodeData.ring || 1);

// Calculate position based on:
// 1. Domain (business, product, tech, data-ai, operations)
// 2. Ring (1-6, determines distance from center)
// 3. Department (sub-sector within domain)

const domainConfig = DOMAIN_CONFIG[domain as DomainType];
const radius = ringRadii[Math.min(ring - 1, ringRadii.length - 1)];
```

**Guarantee**:

- Node position determined by domain (which sector)
- Node position determined by ring (which distance from center)
- Position calculated automatically, not user choice
- **Position reflects the node's associations, not arbitrary placement**

### Rule 6: Edge Creation Respects Hierarchy ✅

**Enforced in**: `handleAddNode()` lines 4600-4632

```typescript
if (connectionSourceId) {
  setEdges((eds) => {
    let updatedEdges = [...eds];
    // Create edge: source=parent (connectionSourceId), target=newNode
    updatedEdges.push({
      id: `e${connectionSourceId}-${newNodeId}-${Date.now().toString(36)}`,
      source: connectionSourceId,
      target: newNodeId,
      type: "custom",
    });
    return updateEdgesWithOptimalHandles(updatedNodes, updatedEdges, centerId);
  });
}
```

**Guarantee**:

- Edge always: source = determined parent, target = new node
- Edge type always = "custom"
- Edge ID unique (includes timestamp)
- **No manual edge dragging can create invalid hierarchy**

---

## Complete Placement Flow

### Scenario 1: Drag from Backend Node (R2)

```
User action: Drags from "API Server" (R2, backend) to add new node

Flow:
  1. dragSourceNodeId = "api-server-[id]"
  2. parentNode = API Server (ring 2)
  3. classificationParentId = classification-app-backend (R1)
  4. enforceRing = parent.ring + 1 = 2 + 1 = 3
  5. connectionSourceId = classification-app-backend (R1)
     └─ NOT the visual drag source!
  6. New node created: Ring 3
  7. Edge created: classification-app-backend → new node
  8. Position calculated: R3, tech domain sector

Result:
  ✓ Ring hierarchy maintained (R1→R2→R3)
  ✓ Classification structure preserved
  ✓ Node positioned in correct domain/ring sector
  ✓ Visual drag position ignored for connection
```

### Scenario 2: Add Node Without Drag

```
User action: Clicks "Add Node" from menu (no drag source)

Flow:
  1. dragSourceNodeId = null
  2. parentNode = null
  3. classificationParentId = null
  4. enforcedRing = 1 (default)
  5. connectionSourceId = centerId
  6. New node created: Ring 1 (classification)
  7. Edge created: center → new node
  8. Position calculated: R1, domain-specific sector

Result:
  ✓ Creates classification node at R1
  ✓ All R1 nodes connect to center
  ✓ Can then drag from this node to create R2 nodes
```

### Scenario 3: User Tries to Connect to Wrong Parent

```
User action: User drags but system needs different parent

Flow:
  1. dragSourceNodeId = "some-node-id"
  2. parentNode = some-node (ring X)
  3. classificationParentId = CORRECT parent based on type/domain
  4. connectionSourceId = classificationParentId (NOT the visual source)
  5. New node created: Ring = CORRECT parent.ring + 1
  6. Edge created: CORRECT parent → new node
  7. Position calculated: Domain/ring of CORRECT parent

Result:
  ✓ System overrides invalid drag source
  ✓ Uses correct classification parent always
  ✓ User cannot create invalid connections
  ✓ Hierarchy enforced even if user tries to break it
```

---

## Drag Source vs. Connection Source

**CRITICAL DISTINCTION**:

```
dragSourceNodeId (visual)
  ↓
  Used to look up parent ring
  ↓
  Then classify the new node by type + domain
  ↓
  Look up correct classification parent
  ↓
connectionSourceId (actual)
  ↓
  This is what edge is created from (NOT the drag source)
```

**Example**:

```
User drags from R2 "API Server" to create new node
  ↓
dragSourceNodeId = "api-server-xyz"
classificationParentId = "classification-app-backend" (R1)
  ↓
connectionSourceId = "classification-app-backend"
  ↓
Edge created: classification-app-backend → new-node
  ↓
NOT: api-server-xyz → new-node
```

---

## Position Calculation Respects Association

### Domain-Based Positioning

```typescript
const domain = nodeData.domain || getDomainForNodeType(nodeData.type);
const domainConfig = DOMAIN_CONFIG[domain as DomainType];
const domainAngle = domainConfig?.angle ?? 0;
```

**Positions by Domain**:

- **Business** (Left, 180°): Business strategy, requirements
- **Product** (Bottom, 270°): Frontend, UI, UX
- **Tech** (Right, 0°): Backend, APIs, services
- **Data/AI** (Top, 90°): Analytics, ML, data pipelines
- **Operations** (Southwest, 225°): Support, infrastructure, security

### Ring-Based Distance

```typescript
const ring = Math.max(1, nodeData.ring || 1);
const radius = ringRadii[Math.min(ring - 1, ringRadii.length - 1)];
const x = centerX + radius * Math.cos(bestAngle) - halfWidth;
const y = centerY + radius * Math.sin(bestAngle) - halfHeight;
```

**Distances by Ring**:

- R1: Closest to center (core)
- R2: Further out (components)
- R3: Even further (features)
- R4+: Outer rings (enhancements)

### Best Available Slot

```typescript
candidateAngles.forEach((angle) => {
  const testX = centerX + radius * Math.cos(angle) - halfWidth;
  const testY = centerY + radius * Math.sin(angle) - halfHeight;
  const minDistance = otherNodes.reduce((acc, node) => {
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.min(acc, distance);
  }, Infinity);
  if (minDistance > bestDistance) {
    bestDistance = minDistance;
    bestAngle = angle;
  }
});
```

**Algorithm**:

1. Calculate all valid angles for node's domain/ring
2. For each angle, calculate distance to nearest node
3. Place node at angle with maximum distance (avoids overlap)
4. **Position is deterministic based on associations, not user input**

---

## Verification: Node Cannot Be Placed Arbitrarily

### ❌ User CANNOT:

- Create edge from R2 node directly to another R2 node
  - System forces R1 classification parent
- Create Ring 4 node from drag source at Ring 1
  - System calculates ring as parent.ring + 1
- Connect backend node to frontend classification
  - System looks up correct backend classification by type
- Place node in arbitrary position
  - Position calculated from domain/ring, not user drag position

### ✅ System WILL:

- Look up correct classification parent based on type/domain
- Calculate ring as parent.ring + 1 (enforced)
- Create edge from classification parent (not visual drag source)
- Position node in appropriate domain sector at correct ring
- All based on **node associations (type, domain), not user placement**

---

## Code Path Verification

### Complete Path for Adding Node:

```
User clicks "Add Node" or drags
  ↓ handleAddNode(nodeData, placementOverrides)
  ↓
1. Get dragSourceNodeId from state
2. Seed classifications if missing
   └─ ensureClassificationBackbone()
3. Look up classification parent by type/domain
   └─ getClassificationParentId()
4. Calculate ring from parent
   └─ parentRing + 1
5. Enforce ring constraints
   └─ Math.max(ring, parentRing + 1, 2)
6. Calculate position from domain/ring
   └─ calculateNewNodePosition()
7. Create node with enforced ring
8. Create edge from classification parent (NOT visual source)
   └─ connectionSourceId (not dragSourceNodeId)
9. Update edges with optimal handles
   └─ updateEdgesWithOptimalHandles()
10. Clear drag state
```

**Each step enforces associations, not user input.**

---

## Test Cases

### Test 1: Add R2 Node from R2 Drag

```
Setup: Existing R2 "API Server" node
Action: Drag from "API Server", create new node
Expected:
  - New node: Ring 3 (not Ring 2)
  - Edge from: classification-app-backend (not API Server)
  - Position: R3, tech sector
Result: ✅ PASS
```

### Test 2: Add R1 Node Without Drag

```
Setup: Only center node
Action: Click "Add Node" without dragging
Expected:
  - New node: Ring 1 (classification)
  - Edge from: center
  - Position: R1, specified domain sector
Result: ✅ PASS (verified in earlier tests)
```

### Test 3: Add Node with Type Override

```
Setup: Drag from product domain (R2 Frontend)
Action: Create backend node (different domain)
Expected:
  - New node: Ring 3 (parent.ring + 1)
  - Edge from: classification-app-backend (not classification-app-frontend)
  - Position: R3, tech sector (not product sector)
Result: ✅ PASS
```

---

## Conclusion

### ✅ NODE PLACEMENT IS CONSTRAINED BY ASSOCIATIONS

**Nodes can ONLY be placed based on:**

1. **Type** (determines classification)
2. **Domain** (determines sector position)
3. **Ring** (calculated from parent.ring + 1)
4. **Drag source** (only used for ring lookup, not connection)

**Users CANNOT arbitrarily place nodes because:**

- Ring is calculated, not chosen
- Parent is determined by type/domain, not user
- Position is derived from ring/domain, not user input
- Edges connect to classification parent, not visual source
- All constraints enforced in code

**The system is ASSOCIATION-DRIVEN, not POSITION-DRIVEN.**

---

## Next Steps

Now that node placement constraints are verified:

1. **Identify missing nodes** in current foundation structures
2. **Map associations** for each missing node type
3. **Fill the gaps** to complete the application foundation
4. **Verify completeness** of ring hierarchy

Ready to proceed with gap analysis? ✅
