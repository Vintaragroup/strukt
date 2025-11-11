# AUTHORITATIVE: Current Tasks & Active Work

**Status**: These are the tasks we're actively working on. Read these for current work.

---

## 📋 Active Task List (Tasks 4-10)

### Task 4: Implement Duplicate Detection System

**Status**: ⏭️ Next  
**Owner**: TBD  
**Effort**: 20 min

**Deliverable**:

- System checks if node types already exist on canvas
- If exists: Add associations instead of creating duplicate
- Example: "Swagger API Server" appears once, grows with associations

**Definition of Done**:

- [ ] Deduplication utility created
- [ ] Node existence detection working
- [ ] Associations added to existing nodes
- [ ] No duplicate nodes created

---

### Task 5: Build Deduplication & Association Logic

**Status**: ⏭️ Next  
**Owner**: TBD  
**Effort**: 20 min

**Deliverable**:

- `client/src/utils/autoDeduplicate.ts` created
- `findExistingNode(candidate, nodes)` function
- `createAssociationsForExisting(node, config)` function
- Edge relationship types (POST/GET, Migrations, etc.)

**Definition of Done**:

- [ ] Utility functions implemented
- [ ] Tests passing
- [ ] Handles fuzzy matching (API vs Swagger API)
- [ ] No TypeScript errors

---

### Task 6: Implement Auto-Create for Infrastructure

**Status**: ⏭️ Next  
**Owner**: TBD  
**Effort**: 1.5 hours

**Requirements**:

```
Questions:
  ├─ Container platform: Kubernetes / Docker-Compose / Serverless / VPS
  ├─ CI/CD: GitHub Actions / GitLab CI / Jenkins / CircleCI
  └─ Monitoring: Yes / No

Creates (R2/R3):
  ├─ Infrastructure & Platform (R2)
  ├─ Kubernetes Cluster (R3, if selected)
  ├─ Docker Registry (R3)
  ├─ CI/CD Pipeline (R3)
  ├─ Monitoring Stack (R3, if selected)
  └─ Associated requirements (R4)
```

**Definition of Done**:

- [ ] Questions dialog working
- [ ] Scaffold nodes created correctly
- [ ] Deduplication working (run twice = same infrastructure)
- [ ] No cycles detected
- [ ] Layout applied correctly

---

### Task 7: Implement Auto-Create for Frontend

**Status**: ⏭️ Not Started  
**Owner**: TBD  
**Effort**: 1.5 hours

**Requirements**:

```
Questions:
  ├─ Framework: React / Vue / Angular / Svelte / Next.js
  ├─ Bundler: Vite / Webpack / Esbuild / Parcel
  ├─ State Management: Redux / Zustand / MobX / Context / None
  └─ Testing: Yes / No

Creates (R2/R3):
  ├─ Frontend & UI (R2)
  ├─ Framework App (R3)
  ├─ Build Tool (R3)
  ├─ State Store (R3, if selected)
  ├─ Test Framework (R3, if selected)
  ├─ UI Library (R3)
  └─ Associated requirements (R4)
```

**Definition of Done**:

- [ ] Questions dialog working
- [ ] Scaffold nodes created correctly
- [ ] Deduplication working
- [ ] No cycles
- [ ] Layout correct

---

### Task 8: Implement Auto-Create for Backend

**Status**: ⏭️ Not Started  
**Owner**: TBD  
**Effort**: 1.5 hours

**Requirements**:

```
Questions:
  ├─ Runtime: Node.js / Python / Go / Rust / Java
  ├─ Framework: Express / FastAPI / Gin / Actix / Spring
  ├─ API: REST / GraphQL / gRPC / Both
  └─ Database: PostgreSQL / MongoDB / MySQL / DynamoDB

Creates (R2/R3):
  ├─ Backend & APIs (R2)
  ├─ API Server (R3)
  ├─ Database (R3)
  ├─ Redis Cache (R3)
  ├─ Job Queue (R3)
  ├─ Logging Service (R3)
  └─ Associated requirements (R4)

KEY: Swagger API Server is REUSED on multiple runs
```

**Definition of Done**:

- [ ] Questions dialog working
- [ ] Scaffold created correctly
- [ ] **Deduplication working**: Second run reuses Swagger
- [ ] Associations added to existing Swagger
- [ ] No cycles
- [ ] Layout correct

---

### Task 9: Implement Auto-Create for Data

**Status**: ⏭️ Not Started  
**Owner**: TBD  
**Effort**: 1.5 hours

**Requirements**:

```
Questions:
  ├─ Pipeline: Airflow / dbt / Spark / Prefect
  ├─ ML Framework: TensorFlow / PyTorch / scikit-learn / HuggingFace
  ├─ Analytics: BigQuery / Redshift / Snowflake / ClickHouse
  └─ Vector Store: Pinecone / Milvus / Weaviate / Chroma

Creates (R2/R3):
  ├─ Data & AI (R2)
  ├─ Data Pipeline (R3)
  ├─ ML Training (R3)
  ├─ Vector Database (R3)
  ├─ Analytics Warehouse (R3)
  ├─ Feature Store (R3)
  └─ Associated requirements (R4)
```

**Definition of Done**:

- [ ] Questions dialog working
- [ ] Scaffold created correctly
- [ ] Deduplication working
- [ ] No cycles
- [ ] Layout correct

---

### Task 10: Integration Testing

**Status**: ⏭️ Not Started  
**Owner**: TBD  
**Effort**: 1 hour

**Test Scenarios**:

```
Test 1: Infrastructure Auto-Create
  ├─ Right-click node
  ├─ Select "Infrastructure & Platform"
  ├─ Answer 3 questions
  ├─ Verify R2/R3 scaffold created
  └─ Verify layout correct

Test 2: Deduplication in Action
  ├─ Create Backend scaffold
  ├─ Create Backend scaffold again
  ├─ Verify NO duplicate "Swagger API Server"
  ├─ Verify more associations added
  └─ Verify canvas stays clean

Test 3: All Domains Together
  ├─ Create Infrastructure scaffold
  ├─ Create Frontend scaffold
  ├─ Create Backend scaffold
  ├─ Create Data scaffold
  ├─ Verify all 4 domains working
  ├─ Verify no cycles
  ├─ Verify hierarchy correct

Test 4: Cycle Prevention
  ├─ Create normal scaffold
  ├─ Try to create edge that would cycle
  ├─ Verify rejected with error
  └─ Verify graph still valid

Test 5: Node Count Verification
  ├─ Start with 11 nodes (1 center + 10 classifications)
  ├─ Create Backend: should have 11 + ~8 = 19 nodes
  ├─ Create Backend again: should stay ~19 nodes (dedup)
  ├─ Create Frontend: should have 19 + ~6 = 25 nodes
  └─ etc.
```

**Definition of Done**:

- [ ] All 5 test scenarios passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Layout correct
- [ ] Cycle detection working

---

## 📚 Reference Documents

### Locked Architecture

See: `CURRENT_ARCHITECTURE.md`

- Ring hierarchy rules
- Node placement constraints
- Classification system
- What you CAN'T do

### Development Rules

See: `DEVELOPMENT_RULES.md`

- Hard constraints
- Code patterns to follow
- Common mistakes to avoid
- Code review checklist

### Auto-Create Design (Full Details)

See: `_ACTIVE_TASKS/AUTO_CREATE_*.md`

- Complete architecture
- Configuration objects
- Deduplication algorithm
- All examples

---

## 🚀 Getting Started

### For Task 4 (Deduplication):

1. Read: `DEVELOPMENT_RULES.md` (Hard Constraints section)
2. Read: `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md` (Section 3: Deduplication)
3. Implement: `client/src/utils/autoDeduplicate.ts`
4. Create tests
5. Reference: `DEVELOPMENT_RULES.md` (Code Review Checklist)

### For Tasks 6-9 (Domain Auto-Create):

1. Read: `CURRENT_ARCHITECTURE.md` (Ring hierarchy & validation)
2. Read: `DEVELOPMENT_RULES.md` (Development patterns)
3. Read: `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md` (Your specific domain section)
4. Implement generator handler
5. Implement question UI
6. Test with deduplication
7. Code review against checklist

### For Task 10 (Testing):

1. Read: Test scenarios above
2. Manual testing in browser
3. Run automated tests
4. Verify all scenarios pass

---

## 📊 Progress Tracking

```
Task 4: Duplicate Detection      [ Blocked on start ]
Task 5: Dedup Logic              [ Blocked on Task 4 ]
Task 6: Infrastructure           [ Blocked on Tasks 4-5 ]
Task 7: Frontend                 [ Can start after Task 6 ]
Task 8: Backend                  [ Can start after Task 6 ]
Task 9: Data                      [ Can start after Task 6 ]
Task 10: Integration Testing     [ Starts after Tasks 6-9 ]
```

---

## 🎯 Success Criteria

✅ Task 4: Deduplication utility working  
✅ Task 5: All dedup functions tested  
✅ Task 6: Infrastructure auto-create working, dedup tested  
✅ Task 7: Frontend auto-create working, dedup tested  
✅ Task 8: Backend auto-create working, dedup tested  
✅ Task 9: Data auto-create working, dedup tested  
✅ Task 10: All integration tests passing

---

## 📞 Questions?

- Architecture question → `CURRENT_ARCHITECTURE.md`
- "How do I implement X" → `DEVELOPMENT_RULES.md`
- Specific domain details → `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md`
- Design decisions → `_ACTIVE_TASKS/AUTO_CREATE_REQUIREMENTS.md`

---

**Last Updated**: Today  
**Status**: Active  
**Next Task**: Task 4 (Deduplication System)
