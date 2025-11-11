# AUTHORITATIVE: Current Architecture (LOCKED)

**Status**: ✅ LOCKED - These rules are enforced in code. Do not violate.

---

## 🔐 Ring Hierarchy (Immutable)

### Ring 0: Center

- **Count**: 1 node (immutable)
- **Type**: Special center node
- **Purpose**: Root of all graphs
- **Connections**: All Ring 1 classifications connect here

### Ring 1: Classifications (Immutable)

- **Count**: 10 nodes (immutable)
- **Purpose**: Parent attachment points for domain-specific nodes
- **Structure**:
  - Ring 1A (Business): business-model, operations, marketing
  - Ring 1B (Technical): app-frontend, app-backend, infrastructure, security
  - Ring 1C (Data): data-ai, customer-experience, observability

**Classification Nodes**:

```
Business Domain:
├─ classification-business-model
├─ classification-operations
└─ classification-marketing

Technical Domain:
├─ classification-app-frontend
├─ classification-app-backend
├─ classification-infrastructure
└─ classification-security

Data Domain:
├─ classification-data-ai
├─ classification-customer-experience
└─ classification-observability
```

**Properties**:

- Ring: 1 (fixed)
- Type: "classification"
- Domain: their assigned domain
- Parent: center (always)
- Can NOT be created/deleted by users

### Ring 2: Domain Parents (Expandable)

- **Purpose**: Parent nodes for domain scaffolding
- **Created by**: Auto-create system when scaffolding
- **Examples**: "Infrastructure & Platform", "Frontend & UI", "Backend & APIs", "Data & AI"
- **Ring**: 2 (calculated as classification.ring + 1)
- **Parent**: Always a Ring 1 classification (determined by domain)

### Ring 3+: Implementation Details (Expandable)

- **Purpose**: Specific tools, frameworks, services
- **Created by**: Auto-create system OR manual user addition
- **Ring**: Calculated as parent.ring + 1 (never user-chosen)
- **Parent**: Ring 2 or higher (never directly to center)
- **Examples**: "Swagger API Server", "PostgreSQL Database", "React App", "Kubernetes Cluster"

---

## 🔗 Node Placement Rules (ENFORCED)

### Rule 1: Ring Hierarchy

```
Ring 0 (center) ← Ring 1 (classifications)
Ring 1 ← Ring 2 (domain parents)
Ring 2 ← Ring 3 (implementation details)
Ring 3 ← Ring 4+ (requirements, features)

NO EXCEPTIONS. Ring always = parent.ring + 1
```

### Rule 2: Classification Parent Assignment

```
Node type + domain determine parent:
├─ Backend + tech → app-backend classification
├─ Frontend + product → app-frontend classification
├─ Data + data-ai → data-ai classification
├─ Requirement + any → depends on context
└─ Infrastructure + operations → infrastructure classification

Determined by: getClassificationParentId(type, domain)
Cannot be overridden by user
```

### Rule 3: No Arbitrary Positioning

```
Position calculated from:
├─ Domain (determines angle/sector)
├─ Ring (determines radius distance)
└─ Best available slot (avoids overlap)

NOT user input. NOT determined by mouse position.
Users cannot drag nodes to arbitrary positions.
```

### Rule 4: Drag Source vs Connection Source

```
When user drags from Node A:
├─ dragSourceNodeId = A (used for ring lookup)
├─ But connection uses classification parent
└─ NOT A (unless A is a classification)

Example:
  User drags from "Swagger API Server" (R3, backend)
  System looks up: R3 + 1 = R4
  But connection goes to: classification-app-backend (R1)
  NOT to Swagger
```

### Rule 5: Ring Constraint Enforcement

```
When creating new node from parent:
  newRing = max(
    userSpecifiedRing (if any),
    parentRing + 1,        ← MINIMUM
    domainMinRing (e.g., 2)
  )

Always enforced. No exceptions.
```

### Rule 6: No Cycles

```
Graph validation ALWAYS checks for cycles
Invalid edges rejected with explanation
Prevents: A→B→C→A configurations
Prevents: Orphaned nodes (no path to root)
```

---

## 🎯 Domain Classification System

### Five Core Domains

| Domain             | Classification | R1 Parent                     | Angle            | Color  |
| ------------------ | -------------- | ----------------------------- | ---------------- | ------ |
| **business-model** | Business       | classification-business-model | 180° (west)      | Blue   |
| **operations**     | Business       | classification-operations     | 225° (southwest) | Teal   |
| **product**        | Technical      | classification-app-frontend   | 270° (south)     | Purple |
| **tech**           | Technical      | classification-app-backend    | 0° (east)        | Orange |
| **data-ai**        | Data           | classification-data-ai        | 90° (north)      | Green  |

### Domain Rules

```typescript
// Node type + domain determine classification parent
const classification = getClassificationParentId(
  nodeType, // "backend" | "frontend" | "requirement" | "doc"
  domain, // "business-model" | "operations" | "product" | "tech" | "data-ai"
  tags, // additional context
  label // node label
);

// Result: Always returns a Ring 1 classification node ID
// Never null (unless system corrupted)
// Never user input
```

---

## 🔴 What You CANNOT Do

### ❌ Cannot Skip Hierarchy Levels

```
Invalid: Create R3 node directly from R1 classification
Result: System calculates R2, node becomes R2 instead
```

### ❌ Cannot Connect to Wrong Classification

```
Invalid: Create "backend" node connected to "frontend" classification
Result: System looks up "backend" classification, uses that instead
```

### ❌ Cannot Arbitrarily Position Node

```
Invalid: Drag node to custom position on canvas
Result: Position recalculated from domain + ring
        Node snaps to correct sector/distance
```

### ❌ Cannot Create Cycles

```
Invalid: Create edge A→B→C→A
Result: Connection rejected, cycle detected error shown
```

### ❌ Cannot Create Orphan Nodes

```
Invalid: Create node with no parent
Result: System assigns center or classification as parent
```

### ❌ Cannot Delete Classifications

```
Invalid: User tries to delete Ring 1 classification
Result: Not allowed, immutable system nodes
```

---

## ✅ What System ENSURES

### ✅ Ring Hierarchy Always Correct

- R1 → center always
- R2+ → classification parent always
- Ring calculated, never user input
- No skipped levels

### ✅ Associations Always Valid

- Node type determines domain
- Domain determines classification
- Classification determines parent
- All enforced in code

### ✅ Position Always Reflects Association

- Backend node → tech sector (0°)
- Frontend node → product sector (270°)
- Business node → business sector (180°)
- Data node → data sector (90°)

### ✅ Graph Always Acyclic

- No circular dependencies
- Single root (center)
- All validation automatic

### ✅ Deduplication Working

- Nodes checked before creation
- Duplicates detected
- Associations added instead
- Canvas stays clean

---

## 📊 Ring Positions & Radii

```
Ring 0: radius = 0 (center)
Ring 1: radius = 80px
Ring 2: radius = 160px
Ring 3: radius = 240px
Ring 4: radius = 320px
Ring 5: radius = 400px
Ring 6: radius = 480px
```

---

## 🔗 Edge Relationship Types

Valid edge types in graph:

```typescript
type RelationshipType =
  | "related-to" // General relationship
  | "depends-on" // A depends on B
  | "implements" // A implements B
  | "documents" // A documents B
  | "contains" // A contains B
  | "extends" // A extends B
  | "conflicts-with" // A conflicts with B
  | "blocked-by" // A blocked by B
  | "supports"; // A supports B
```

---

## 🎯 Validated Architecture Examples

### Example 1: Backend Scaffold

```
Ring 0: center
Ring 1: classification-app-backend (parent)
Ring 2: Backend & APIs (domain parent)
Ring 3:
  ├─ Swagger API Server
  ├─ PostgreSQL Database
  ├─ Redis Cache
  ├─ Job Queue
  └─ Logging Service
Ring 4:
  ├─ POST Endpoints
  ├─ GET Endpoints
  ├─ Database Migrations
  └─ Error Handling
```

**All edges**:

- Ring 1 → center ✅
- Ring 2 → Ring 1 ✅
- Ring 3 → Ring 2 ✅
- Ring 4 → Ring 3 ✅

### Example 2: Multi-Domain

```
Ring 1:
  ├─ classification-app-backend (tech)
  ├─ classification-app-frontend (product)
  └─ classification-data-ai (data)

Ring 2:
  ├─ Backend & APIs (parent: app-backend)
  ├─ Frontend & UI (parent: app-frontend)
  └─ Data & AI (parent: data-ai)

Ring 3:
  ├─ Express Server (parent: Backend, domain: tech)
  ├─ React App (parent: Frontend, domain: product)
  └─ Airflow Pipeline (parent: Data, domain: data-ai)
```

All hierarchy rules enforced ✅

---

## 🚀 When Creating Nodes

### Always Follows This Pattern:

1. User action (drag, click, or auto-create)
2. Get drag source node (if applicable)
3. Look up parent ring: parentRing = dragSource?.data?.ring
4. Determine classification parent by type + domain
5. Calculate new ring: max(userRing, classificationParent.ring + 1)
6. Create node with calculated ring
7. Create edge: classification parent → new node
8. Validate no cycles
9. Calculate position from domain + ring
10. Render in correct sector/distance

---

## ✅ Verification Checklist

Before implementing any feature:

- [ ] Does it respect ring hierarchy?
- [ ] Is node ring calculated (not user input)?
- [ ] Is parent determined by type + domain?
- [ ] Does it prevent cycles?
- [ ] Is position calculated from domain/ring?
- [ ] Are all classifications immutable?
- [ ] Does it use correct relationship types?
- [ ] Is dragSourceNodeId only for lookup (not connection)?
- [ ] Are all edges from classificationParentId?

If ANY "no" → Feature violates locked architecture → Do not implement

---

**Last Updated**: Today  
**Status**: LOCKED - Enforced in Code  
**Authority**: Architecture Verified & Tested  
**Questions**: See \_AUTHORITATIVE/QUICK_START.md
