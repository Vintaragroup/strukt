# Auto-Create Feature: Implementation Plan

## ✅ Design Complete (Task 3)

I've created two comprehensive documents:

1. **AUTO_CREATE_DESIGN.md** - Full architecture with code examples
2. **AUTO_CREATE_REQUIREMENTS.md** - User-friendly summary

Both are ready in `/Users/ryanmorrow/Documents/Projects2025/Strukt/`

---

## 🎯 What We're Building

### Current Limitation

Only **User Authentication** auto-create works. Other domains (Infrastructure, Frontend, Backend, Data) show "coming soon."

### Your Vision

Create auto-create for **Ring 2 & Ring 3** nodes with **smart deduplication**:

**Example**: User creates Backend scaffold twice

- **1st time**: "Swagger API Server" created
- **2nd time**: System detects it exists, instead adds associations (POST Endpoints, GET Endpoints)
- **Result**: Single Swagger with growing associations, no duplicates

### Why This Matters

- Users can quickly build complete architectures
- No accidental duplicates
- Existing nodes automatically grow with new associations
- Canvas stays clean and organized

---

## 🏗️ Architecture Overview

### Pattern (Follows Proven Auth Model)

```
User: Right-click Infrastructure/Frontend/Backend/Data node
     ↓
System: Show questions dialog
     ↓
User: Answer 2-3 config questions
     ↓
System:
  1. Check if nodes exist (deduplication)
  2. Create new nodes (if needed)
  3. Add associations to existing (if found)
  4. Create proper edges (implements, depends-on, etc.)
  5. Validate no cycles
  6. Apply layout
     ↓
Result: R2/R3 scaffold created, smart associations added
```

### Ring Hierarchy

```
Ring 1: Classifications (business-model, operations, product, tech, data-ai)
  ↓
Ring 2: Domain parents (Infrastructure, Frontend, Backend, Data)
  ↓
Ring 3: Implementation details (Docker, Kubernetes, React, PostgreSQL)
  ↓
Ring 4: Associated requirements (POST endpoints, Migrations, etc.)
```

### Four Domains

1. **Infrastructure & Platform**

   - Questions: Kubernetes/Docker/Serverless? CI/CD platform? Monitoring?
   - Nodes: Docker, Kubernetes, GitHub Actions, Prometheus, Terraform
   - Dedup: Single Docker Registry, reused across projects

2. **Frontend & UI**

   - Questions: React/Vue/Angular/Next? Vite/Webpack? Redux/Zustand?
   - Nodes: React App, Vite, Redux, Jest, Material UI
   - Dedup: Single React App with growing features

3. **Backend & APIs**

   - Questions: Node/Python/Go? REST/GraphQL? PostgreSQL/MongoDB?
   - Nodes: Express/FastAPI Server, Database, Redis, Job Queue
   - Dedup: **Single Swagger API Server** with more endpoints each time

4. **Data & AI**
   - Questions: Airflow/dbt? TensorFlow/PyTorch? BigQuery/Redshift?
   - Nodes: Data Pipeline, ML Model, Vector DB, Analytics Warehouse
   - Dedup: Single pipeline with more transformations

---

## 📋 Implementation Steps

### Step 1: Build Deduplication Utility (20 min)

**File**: `client/src/utils/autoDeduplicate.ts` (NEW)

```typescript
// Find existing node by label, type, domain
findExistingNode(candidate, nodes): Node | null

// Create associations for existing node
createAssociationsForExisting(node, config): Edge[]
```

### Step 2: Create Type Definitions (15 min)

**File**: `client/src/types/foundation.ts` (NEW)

```typescript
// Config interfaces for each domain
interface InfrastructureConfig {
  platform: "kubernetes" | "docker-compose" | "serverless" | "vps";
  cicd: "github-actions" | "gitlab-ci" | "jenkins" | "circleci";
  monitoring: boolean;
}

interface FrontendConfig {
  framework: "react" | "vue" | "angular" | "svelte" | "next";
  bundler: "vite" | "webpack" | "esbuild" | "parcel";
  stateManagement: "redux" | "zustand" | "mobx" | "context" | "none";
  testing: boolean;
}

// ... Similar for Backend and Data
```

### Step 3: Add Question UIs (1 hour)

**File**: `client/src/components/NodeFoundationDialog.tsx` (MODIFY)

Create UI components for:

- InfrastructureFoundationUI
- FrontendFoundationUI
- BackendFoundationUI
- DataFoundationUI

Each shows 2-3 config questions, similar to existing AuthFoundationUI.

### Step 4: Create Generators (2.5 hours)

**File**: `client/src/App.tsx` (MODIFY)

Add handlers:

- `handleApplyInfrastructureFoundation()`
- `handleApplyFrontendFoundation()`
- `handleApplyBackendFoundation()`
- `handleApplyDataFoundation()`

Each handler:

1. Takes config answers
2. Calls deduplication utility
3. Creates new nodes (or reuses existing)
4. Adds associations to existing nodes
5. Creates edges
6. Validates graph
7. Applies layout

### Step 5: Test All Flows (40 min)

Verify:

- Each domain individually
- Multiple auto-creates in sequence
- Deduplication working (no duplicates)
- Associations added correctly
- No cycles
- Layout correct

---

## 🔑 Key Features

### Smart Deduplication

**Algorithm**:

1. Check exact label match
2. Check type + domain match
3. Fuzzy match on related keywords (e.g., "Swagger API" matches "API Server")

**Benefits**:

- Users can run auto-create multiple times
- Canvas grows but doesn't get cluttered
- Associations automatically expand

### Association Management

```typescript
// Example: Backend scaffold creates associations
{
  "Swagger API Server": {
    "POST Endpoints": "implements",
    "GET Endpoints": "implements",
    "Rate Limiting": "depends-on"
  },
  "PostgreSQL Database": {
    "Connection Pooling": "documents",
    "Migration Scripts": "implements"
  },
  "Redis Cache": {
    "Cache Invalidation": "documents"
  }
}
```

### Ring Hierarchy Enforcement

- All R2 nodes connect to classification parent (R1)
- All R3 nodes connect to R2 parent
- Ring calculated as parent.ring + 1 (automatic)
- Cycle detection prevents invalid connections

---

## 📊 Expected Output Examples

### Backend Auto-Create (First Time)

```
Ring 2:
  └─ Backend & APIs

Ring 3:
  ├─ Express API Server (backend, type: backend)
  │  Parent: classification-app-backend (R1)
  │
  ├─ PostgreSQL Database (backend, type: backend)
  │  Parent: classification-app-backend (R1)
  │
  ├─ Redis Cache (backend, type: backend)
  │  Parent: classification-app-backend (R1)
  │
  └─ Job Queue (backend, type: backend)
     Parent: classification-app-backend (R1)

Ring 4:
  ├─ POST Endpoints (requirement)
  ├─ GET Endpoints (requirement)
  └─ Database Migrations (requirement)
```

### Backend Auto-Create (Second Time - Deduplication)

```
Ring 2:
  └─ Backend & APIs (UNCHANGED)

Ring 3:
  ├─ Express API Server (REUSED)
  │  └─ New associations added:
  │     ├─ Request Validation (NEW requirement)
  │     └─ Error Handling (NEW requirement)
  │
  ├─ PostgreSQL Database (REUSED)
  │  └─ New associations added:
  │     ├─ Connection Pooling (NEW requirement)
  │     └─ Backup Strategy (NEW requirement)
  │
  ├─ Redis Cache (REUSED)
  └─ Job Queue (REUSED)

Result: Same 4 Ring 3 nodes, but with MORE associations
```

---

## ✅ Validation Checklist

Before marking complete:

- [ ] Can right-click Infrastructure node → questions appear
- [ ] Can right-click Frontend node → questions appear
- [ ] Can right-click Backend node → questions appear
- [ ] Can right-click Data node → questions appear
- [ ] Auto-create creates R2 parent node (if missing)
- [ ] Auto-create creates R3 child nodes
- [ ] Auto-create creates R4 associated requirements
- [ ] Deduplication: Run twice → no duplicate "Swagger API Server"
- [ ] Associations: Second run adds new edges to existing Swagger
- [ ] No cycles: All edges validated
- [ ] Layout: Nodes positioned correctly in sectors
- [ ] No TypeScript errors
- [ ] All tests passing

---

## 🚀 Next Steps

### Immediate (Ready to Start)

1. ✅ Design complete (you're reading this)
2. ⏭️ Build deduplication utility (`autoDeduplicate.ts`)
3. ⏭️ Create type definitions (`foundation.ts`)

### Sequential

4. Add Infrastructure UI & generator
5. Add Frontend UI & generator
6. Add Backend UI & generator
7. Add Data UI & generator
8. Integration testing

### Timeline

- **Total effort**: 4-5 hours
- **Per domain**: 1-1.5 hours (UI + generator + test)

---

## 💡 Design Philosophy

This implementation:

- ✅ Follows proven Auth pattern
- ✅ Adds smart deduplication (key innovation)
- ✅ Maintains ring hierarchy constraints
- ✅ Prevents cycles automatically
- ✅ Scales to support more domains later
- ✅ Gives users control (they answer config questions)
- ✅ Generates best-practice defaults

---

**Status**: Architecture & design complete. Ready for implementation!

Next: Would you like me to start with Step 1 (deduplication utility)?
