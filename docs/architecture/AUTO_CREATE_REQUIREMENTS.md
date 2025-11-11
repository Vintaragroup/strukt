# Auto-Create Feature: Requirements & Architecture Summary

## What You're Asking For

**Current State**: Only "User Authentication" auto-create works. The rest show "coming soon."

**Your Request**:

1. Create auto-create paths for **Ring 2 & Ring 3** nodes in:

   - Infrastructure & Platform
   - Frontend & UI
   - Backend & APIs
   - Data & AI

2. **Key Feature**: Smart deduplication
   - Canvas checks if a "Swagger API Server" already exists
   - If yes: Add associations (POST/GET edges) instead of creating duplicate
   - If no: Create new node
   - Result: Single Swagger Server that grows with associations

## Architecture

### The Pattern (Follows Auth Model)

Each auto-create does:

```
1. User clicks: "Auto-create for this node"
2. Dialog: "Answer 2-3 questions"
   - Infrastructure: "Kubernetes or Docker-Compose?", "CI/CD Platform?", "Monitoring?"
   - Frontend: "React or Next.js?", "Vite or Webpack?", "Redux or Zustand?"
   - Backend: "Node, Python, or Go?", "REST or GraphQL?", "PostgreSQL or MongoDB?"
   - Data: "Airflow or dbt?", "TensorFlow or PyTorch?", "BigQuery or Snowflake?"

3. System Creates:
   - R2: Parent node (Infrastructure, Frontend, Backend, Data)
   - R3: Children (specific tools: Docker, Kubernetes, Swagger, React, etc.)
   - R4: Tertiary (associated requirements)

4. Smart Linking:
   - Check if "Swagger API Server" exists → if yes, add POST/GET associations
   - Check if "PostgreSQL Database" exists → if yes, add migration associations
   - Result: Reuses existing nodes, adds relationships instead of duplicates
```

### Ring Structure

```
Ring 1: Classifications (5 fixed: business-model, operations, product, tech, data-ai)
Ring 2: Domain scaffolds (Infrastructure, Frontend, Backend, Data)
Ring 3: Implementation details (Docker, Kubernetes, React, PostgreSQL, etc.)
Ring 4: Associated requirements (POST endpoints, Database migrations, etc.)
```

## Deduplication Logic

**Before** (naive):

```
Auto-create Backend 1st time → "Swagger API Server" created
Auto-create Backend 2nd time → Another "Swagger API Server" created (duplicate!)
Result: Canvas cluttered with duplicates
```

**After** (smart):

```
Auto-create Backend 1st time → "Swagger API Server" created
Auto-create Backend 2nd time → System detects existing "Swagger API Server"
  → Skips creation
  → Adds new associations: POST Endpoints, GET Endpoints
Result: Single "Swagger API Server" with more relationships
```

## Implementation Strategy

### Step 1: Build Deduplication Utility

```typescript
// New file: client/src/utils/autoDeduplicate.ts
findExistingNode(candidate, nodes); // Find if node exists
createAssociationsForExisting(node, config); // Add edges to existing
```

### Step 2: Extend Configuration Types

```typescript
type NodeFoundationConfig =
  | NodeFoundationConfigAuth
  | NodeFoundationConfigInfrastructure
  | NodeFoundationConfigFrontend
  | NodeFoundationConfigBackend
  | NodeFoundationConfigData;
```

### Step 3: Add Question UIs

- Infrastructure: Platform, CI/CD, Monitoring toggles
- Frontend: Framework, Bundler, State management
- Backend: Runtime, Framework, API style, Database
- Data: Pipeline, ML framework, Analytics, Vector store

### Step 4: Create Generators

For each domain:

1. Check for existing nodes (deduplication)
2. Create new nodes (if needed)
3. Add associations to existing (if found)
4. Create proper edges
5. Validate no cycles
6. Apply layout

### Step 5: Test All Flows

- Each domain individually
- Multiple auto-creates in sequence
- Deduplication in action

## Key Differences from Auth

| Aspect        | Auth                       | Other Domains                                   |
| ------------- | -------------------------- | ----------------------------------------------- |
| Target        | Authentication node        | Infrastructure, Frontend, Backend, Data nodes   |
| Questions     | Provider, MFA, Roles       | Framework/Platform choices                      |
| Ring Config   | R3/R4/R5                   | R2/R3/R4                                        |
| Deduplication | Not applicable             | **CRITICAL**: "Swagger API Server" appears once |
| Associations  | "implements", "depends-on" | POST/GET for APIs, Migrations for DB, etc.      |

## Success Criteria

✅ Right-click Infrastructure node → See questions → Create R2/R3 scaffold  
✅ Right-click Frontend node → See questions → Create React/Vue/Next scaffold  
✅ Right-click Backend node → See questions → Create API scaffold  
✅ Right-click Data node → See questions → Create pipeline scaffold

✅ Create Backend twice → First creates Swagger, second adds associations (no duplicate)  
✅ All nodes properly connected to parents  
✅ All edges validated (no cycles)  
✅ Layout applied correctly

## Files to Create/Modify

| File                                             | Purpose                         |
| ------------------------------------------------ | ------------------------------- |
| `client/src/utils/autoDeduplicate.ts`            | **NEW**: Deduplication logic    |
| `client/src/App.tsx`                             | Add handlers for each domain    |
| `client/src/components/NodeFoundationDialog.tsx` | Extend with UIs for all domains |
| `client/src/types/foundation.ts`                 | **NEW**: Config types and enums |

## Effort Estimate

- Deduplication utility: 20 min
- Types & config: 15 min
- Infrastructure auto-create: 1 hour
- Frontend auto-create: 1 hour
- Backend auto-create: 1 hour
- Data auto-create: 50 min
- Testing & validation: 40 min
- **Total: ~4-5 hours**

## Example Output

When user auto-creates Backend with "Kubernetes":

```
Ring 2:
  └─ Backend & APIs

Ring 3:
  ├─ Express API Server (if not exists)
  │  └─ Ring 4:
  │     ├─ POST Endpoints
  │     └─ GET Endpoints
  ├─ PostgreSQL Database
  │  └─ Ring 4:
  │     └─ Database Migrations
  ├─ Redis Cache
  └─ Job Queue

All connected with proper relationships (depends-on, implements, documents)
```

When user auto-creates Backend again with same options:

```
Ring 2:
  └─ Backend & APIs

Ring 3:
  ├─ Express API Server (REUSED - same node)
  │  └─ Ring 4:
  │     ├─ POST Endpoints (already exists)
  │     ├─ GET Endpoints (already exists)
  │     ├─ Rate Limiting (NEW - added)
  │     └─ Request Validation (NEW - added)
  ├─ PostgreSQL Database
  │  └─ Ring 4:
  │     ├─ Database Migrations
  │     └─ Connection Pooling (NEW - added)
  ├─ Redis Cache
  └─ Job Queue
```

---

**Ready to implement!** Start with Step 1 (deduplication utility), then follow Steps 2-5 sequentially.
