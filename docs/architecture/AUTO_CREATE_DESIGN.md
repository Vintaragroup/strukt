# Auto-Create Feature Design & Architecture

## Executive Summary

Currently, only **User Authentication** auto-create is implemented. This design enables **Ring 2 & Ring 3** auto-create for:

- **Infrastructure & Platform** (Kubernetes, Docker, CI/CD, Monitoring, etc.)
- **Frontend & UI** (React, Next.js, Build, Testing, etc.)
- **Backend & APIs** (API Server, Database, Caching, Job Queues, etc.)
- **Data & AI** (Data pipelines, ML models, Analytics, Vector stores, etc.)

**Key Innovation**: Canvas checks if nodes already exist before creating duplicates. If a "Swagger API Server" exists, the system adds associations (POST/GET edges) instead of duplicating.

---

## 1. Current Implementation (Auth Only)

### User Authentication Auto-Create Flow

**User Action**:

```
Right-click → "Auto-create for this node..."
Select: Auth0 | Supabase | Keycloak | AWS Cognito
Select: MFA required/optional
Select: Roles | Groups | Both
Click: "Create"
```

**System Creates**:

- **R3 nodes** (targetRing = auth node's ring + 1):

  - OIDC Provider (backend)
  - Session Management (backend)
  - Audit Logging (backend)
  - Password Policy (requirement)
  - Role & Permissions Model (requirement)

- **R4 nodes** (targetRing + 1):

  - Auth Requirements (requirement)
  - MFA Policy (requirement, if enabled)

- **R5 nodes** (targetRing + 2):
  - Rate Limiting (backend)

**Smart Linking**:

```typescript
// Only create if not already exists
const existsByLabel = (label: string) =>
  nodes.some((n) => n.data?.label === label);

if (!existsByLabel("OIDC Provider")) {
  // Create node
}
```

**Key Code Location**: `App.tsx` lines 5754-5977 (`openAutoCreateForNode`, `handleApplyNodeFoundation`)

---

## 2. Architecture: Ring 2 & Ring 3 Auto-Create

### 2.1 Ring Hierarchy for Auto-Create

```
Ring 0: center
Ring 1: Classification nodes (business-model, app-backend, app-frontend, etc.)
Ring 2: Domain scaffolding options (Infrastructure, Frontend, Backend, Data/AI)
Ring 3: Implementation details (specific tools, frameworks, services)
```

### 2.2 Question Templates (Similar to Auth)

Each auto-create domain gets 2-3 configuration questions:

#### Infrastructure & Platform

```typescript
interface InfrastructureConfig {
  platform: "kubernetes" | "docker-compose" | "serverless" | "vps";
  containerization: boolean; // Docker/container support?
  cicd: "github-actions" | "gitlab-ci" | "jenkins" | "circleci";
  monitoring: boolean; // Prometheus, DataDog, New Relic?
}
```

#### Frontend & UI

```typescript
interface FrontendConfig {
  framework: "react" | "vue" | "angular" | "svelte" | "next";
  bundler: "vite" | "webpack" | "esbuild" | "parcel";
  stateManagement: "redux" | "zustand" | "mobx" | "context" | "none";
  testing: boolean; // Jest, Vitest, Cypress?
}
```

#### Backend & APIs

```typescript
interface BackendConfig {
  runtime: "node" | "python" | "go" | "rust" | "java";
  framework: "express" | "fastapi" | "gin" | "actix" | "spring";
  apiStyle: "rest" | "graphql" | "grpc" | "both";
  database: "postgresql" | "mongodb" | "mysql" | "dynamodb";
}
```

#### Data & AI

```typescript
interface DataConfig {
  pipeline: "airflow" | "dbt" | "spark" | "prefect";
  mlFramework: "tensorflow" | "pytorch" | "scikit-learn" | "huggingface";
  analytics: "bigquery" | "redshift" | "snowflake" | "clickhouse";
  vectorStore: "pinecone" | "milvus" | "weaviate" | "chroma";
}
```

---

## 3. Duplicate Detection & Association Logic

### 3.1 Core Concept

**Before**: Create a "Swagger API Server" node  
**After**: System checks if one exists → if yes, add POST/GET associations instead

### 3.2 Duplicate Detection Algorithm

```typescript
interface NodeCandidate {
  label: string;
  type: "backend" | "frontend" | "requirement" | "doc";
  domain: "tech" | "product" | "business-model" | "data-ai" | "operations";
  ring?: number;
}

function findExistingNode(
  candidate: NodeCandidate,
  nodes: Node[]
): Node | null {
  // Try exact label match first
  let existing = nodes.find(
    (n) =>
      (n.data?.label as string)?.toLowerCase() === candidate.label.toLowerCase()
  );

  if (existing) return existing;

  // Try domain + type match (same category)
  existing = nodes.find(
    (n) =>
      n.data?.domain === candidate.domain &&
      n.data?.type === candidate.type &&
      // Additional heuristics for matching
      isRelatedLabel(n.data?.label, candidate.label)
  );

  return existing || null;
}

function isRelatedLabel(label1: string, label2: string): boolean {
  // "Swagger API Server" matches "API Server"
  // "PostgreSQL Database" matches "Database"
  // Fuzzy matching with domain-specific keywords
  const normalize = (s: string) => s.toLowerCase().split(/\s+/);
  const w1 = normalize(label1);
  const w2 = normalize(label2);

  // At least 1 common word
  const common = w1.filter((w) => w2.includes(w));
  return common.length > 0;
}
```

### 3.3 Association Types

```typescript
// When duplicates detected, create these relationships:
{
  "Swagger API Server": {
    "POST endpoints": "implements",
    "GET endpoints": "implements",
    "Authentication": "depends-on",
    "Database": "depends-on"
  },
  "PostgreSQL Database": {
    "Migration scripts": "documents",
    "Backup strategy": "requires",
    "Monitoring": "documents"
  }
}
```

---

## 4. Implementation Strategy

### 4.1 Configuration Objects

Create `NodeFoundationConfigs` enum:

```typescript
export enum NodeFoundationKind {
  AUTH = "auth",
  INFRASTRUCTURE = "infrastructure",
  FRONTEND = "frontend",
  BACKEND = "backend",
  DATA = "data",
  ONBOARDING = "onboarding",
}

type NodeFoundationConfig =
  | NodeFoundationConfigAuth
  | NodeFoundationConfigInfrastructure
  | NodeFoundationConfigFrontend
  | NodeFoundationConfigBackend
  | NodeFoundationConfigData;
```

### 4.2 Question & UI Template

Mirror the Auth implementation:

```tsx
// NodeFoundationDialog.tsx - Extended for all kinds
export function NodeFoundationDialog({
  open,
  onOpenChange,
  kind,
  nodeLabel,
  onApply,
}: {...}) {

  // Dispatch to kind-specific UI
  switch (kind) {
    case "auth":
      return <AuthFoundationUI {...props} />;
    case "infrastructure":
      return <InfrastructureFoundationUI {...props} />;
    case "frontend":
      return <FrontendFoundationUI {...props} />;
    case "backend":
      return <BackendFoundationUI {...props} />;
    case "data":
      return <DataFoundationUI {...props} />;
    default:
      return <ComingSoonUI />;
  }
}
```

### 4.3 Scaffolding Generation

Create domain-specific generators in `App.tsx`:

```typescript
// Parallel to handleApplyNodeFoundation
const handleApplyInfrastructureFoundation = useCallback(
  async (config: InfrastructureConfig) => {
    // 1. Determine target ring
    // 2. Check for existing nodes (duplicate detection)
    // 3. Create new nodes (skipping duplicates)
    // 4. Add associations to existing nodes
    // 5. Create edges
    // 6. Validate graph (no cycles)
    // 7. Apply layout
  },
  [nodes, edges]
);
```

---

## 5. Ring 2 & Ring 3 Node Examples

### Infrastructure Domain

**Ring 2** (R2 parent = classification-infrastructure):

- Infrastructure & Platform (parent node for all infra)

**Ring 3** (children of R2):

- Kubernetes Cluster (if selected)
- Docker Container Registry
- CI/CD Pipeline (GitHub Actions / GitLab CI / Jenkins)
- Container Orchestration
- Infrastructure as Code (Terraform)

**Ring 4** (children of Ring 3):

- Kubernetes Namespaces
- Helm Charts
- Service Mesh (Istio)
- Ingress Controller
- Network Policies

### Frontend Domain

**Ring 2** (R2 parent = classification-app-frontend):

- Frontend & UI (parent node)

**Ring 3** (children of R2):

- React App / Next.js App / Vue App
- Build Tool (Vite / Webpack)
- State Management (Redux / Zustand)
- Testing Framework (Jest / Vitest)
- UI Component Library

**Ring 4** (children of Ring 3):

- Authentication Integration
- API Client (Axios / Fetch)
- Error Handling
- Analytics SDK

### Backend Domain

**Ring 2** (R2 parent = classification-app-backend):

- Backend & APIs (parent node)

**Ring 3** (children of R2):

- Swagger / OpenAPI Server (← TARGET FOR DEDUPLICATION)
- Database (PostgreSQL / MongoDB)
- Caching Layer (Redis)
- Job Queue (Bull / Celery)
- Logging Service

**Ring 4** (children of Ring 3):

- POST Endpoints (associated with Swagger)
- GET Endpoints (associated with Swagger)
- Database Migrations
- Cache Invalidation Strategy

### Data & AI Domain

**Ring 2** (R2 parent = classification-data-ai):

- Data & AI (parent node)

**Ring 3** (children of R2):

- Data Pipeline (Airflow / dbt)
- ML Training Pipeline
- Vector Database (Pinecone)
- Analytics Warehouse (BigQuery)
- Feature Store

**Ring 4** (children of Ring 3):

- Data Validation
- Model Serving API
- Embedding Generation
- Query Optimization

---

## 6. Code Changes Required

### File: `App.tsx`

```typescript
// 1. Add detectNodeFoundationKind expansions
const detectNodeFoundationKind = useCallback(
  (node: Node): NodeFoundationKind | null => {
    const type = (node.data as any)?.type;
    const domain = (node.data as any)?.domain;
    const ring = (node.data as any)?.ring;

    // Only R1 classifications trigger auto-create for now
    if (ring === 1) {
      if (domain === "business-model") return "backend"; // Proxy for now
      if (domain === "operations") return "infrastructure";
      if (domain === "product") return "frontend";
      if (domain === "tech") return "backend";
      if (domain === "data-ai") return "data";
    }

    // Allow R2 nodes to trigger auto-create too
    if (ring === 2) {
      // Similar logic
    }

    return null;
  },
  []
);

// 2. Add handlers for each kind
const handleApplyInfrastructureFoundation = useCallback(
  async (config: InfrastructureConfig) => {
    // Implementation here
  },
  [nodes, edges]
);

// 3. Dispatch in handleApplyNodeFoundation
const handleApplyNodeFoundation = useCallback(
  async (config: NodeFoundationConfig) => {
    if (nodeFoundationKind === "auth") {
      return handleApplyAuthFoundation(config);
    } else if (nodeFoundationKind === "infrastructure") {
      return handleApplyInfrastructureFoundation(config);
    }
    // etc.
  },
  [nodeFoundationTargetId, nodeFoundationKind]
);
```

### File: `client/src/components/NodeFoundationDialog.tsx`

```typescript
// Add question UIs for each domain
export function InfrastructureFoundationUI({
  onApply,
  onOpenChange,
}: {
  onApply: (config: InfrastructureConfig) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [platform, setPlatform] = useState("kubernetes");
  const [cicd, setCicd] = useState("github-actions");
  const [monitoring, setMonitoring] = useState(true);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium">Container Platform</p>
        <div className="flex gap-2">
          {["kubernetes", "docker-compose", "serverless", "vps"].map((p) => (
            <Button
              key={p}
              variant={platform === p ? "default" : "outline"}
              onClick={() => setPlatform(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Similar for CI/CD and Monitoring */}

      <Button onClick={() => onApply({ platform, cicd, monitoring })}>
        Create Infrastructure
      </Button>
    </div>
  );
}
```

### File: `client/src/utils/autoDeduplicate.ts` (NEW)

```typescript
export function findExistingNode(
  candidate: NodeCandidate,
  nodes: Node[]
): Node | null {
  // Deduplication logic
}

export function createAssociationsForExisting(
  existingNode: Node,
  newNodes: Node[],
  relationType: RelationshipType
): Edge[] {
  // Create edges to associate with existing node
}
```

---

## 7. User Experience Flow

### Current (Auth only)

```
User: Right-click node
System: "Auto-create for this node..." (Auth0/Supabase only)
User: Answers 3 questions
System: Creates 8 nodes (R3, R4, R5)
```

### New (All Domains)

```
User: Right-click Infrastructure/Frontend/Backend/Data node
System: "Auto-create for this node..."
  → Infrastructure & Platform
  → Frontend & UI
  → Backend & APIs
  → Data & AI
User: Answers 2-3 questions (platform, framework, etc.)
System:
  1. Checks for existing nodes of same type
  2. Creates new nodes (skipping duplicates)
  3. Adds associations to existing nodes
  4. Creates proper edges
  5. Validates no cycles
  6. Applies layout
```

### Smart Deduplication Example

```
Scenario: Auto-create Backend nodes twice

First time:
  → Creates "Swagger API Server", "PostgreSQL Database", "Redis Cache"

Second time:
  → Detects "Swagger API Server" exists
  → Instead of duplicating, adds:
    - POST Endpoints (requirement) → associates to Swagger
    - GET Endpoints (requirement) → associates to Swagger
    - Database Migration Scripts → associates to PostgreSQL
    - Cache Invalidation Strategy → associates to Redis

Result: Single Swagger Server with 2x more associations
```

---

## 8. Validation & Safety

### Constraints Enforced

1. **Ring Hierarchy**

   - R2 auto-create parent = classification node (R1)
   - R3 children = parent.ring + 1
   - R4 grandchildren = parent.ring + 2

2. **No Duplicate Services**

   - Canvas checks label + type + domain before creating
   - If exists, creates associations instead

3. **No Cycles**

   - Every edge validated before commit
   - Cycle detection before layout

4. **Domain Consistency**
   - Backend nodes stay in tech domain
   - Frontend nodes stay in product domain
   - Data nodes stay in data-ai domain
   - Infrastructure nodes stay in operations domain

### Test Cases

```typescript
// Test 1: Infrastructure auto-create
// Input: Infrastructure & Platform node, Kubernetes selected
// Expected: R3 children (Kubernetes, Docker, CI/CD, etc.)

// Test 2: Duplicate detection
// Input: Auto-create Backend, then auto-create Backend again
// Expected: Second call detects existing Swagger, adds associations

// Test 3: Mixed domains
// Input: All four auto-creates in sequence
// Expected: 4 R2 parents, 16+ R3 children, all properly associated

// Test 4: Ring calculation
// Input: All auto-create on R2 parent
// Expected: R3 children correctly calculated (R2 + 1)

// Test 5: No cycles
// Input: Auto-create Backend, then manually connect child back up
// Expected: Connection rejected, cycle detected
```

---

## 9. Timeline & Effort

| Task                     | Effort       | Status      |
| ------------------------ | ------------ | ----------- |
| Design (this document)   | ✅ Complete  | ✅          |
| Deduplication utility    | 20 min       | Not started |
| Config types & enums     | 15 min       | Not started |
| Infrastructure UI        | 25 min       | Not started |
| Infrastructure generator | 30 min       | Not started |
| Frontend UI              | 25 min       | Not started |
| Frontend generator       | 30 min       | Not started |
| Backend UI               | 25 min       | Not started |
| Backend generator        | 30 min       | Not started |
| Data UI                  | 20 min       | Not started |
| Data generator           | 30 min       | Not started |
| Testing & validation     | 40 min       | Not started |
| **Total**                | **~4 hours** |             |

---

## 10. Implementation Order

1. **Build deduplication utility** (`autoDeduplicate.ts`)

   - `findExistingNode()` function
   - `createAssociationsForExisting()` function

2. **Create type definitions**

   - Config interfaces
   - Enum for `NodeFoundationKind`

3. **Implement Infrastructure first**

   - UI questions
   - Generator logic
   - Test deduplication

4. **Implement Frontend & Backend**

   - Similar pattern to Infrastructure
   - Reuse deduplication logic

5. **Implement Data/AI**

   - Complete the set

6. **Integration testing**
   - All domains together
   - Deduplication across domains

---

## 11. Success Criteria

✅ User can right-click on Infrastructure/Frontend/Backend/Data nodes  
✅ Dialog appears with 2-3 configuration questions  
✅ System creates appropriate R2/R3 nodes  
✅ Duplicate nodes detected and skipped  
✅ Associations added to existing nodes (POST/GET, etc.)  
✅ All edges valid (no cycles)  
✅ Layout applied and nodes positioned correctly  
✅ No TypeScript errors  
✅ All tests passing

---

This design maintains the proven Auth pattern while scaling to all domains.
