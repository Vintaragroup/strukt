# 🚀 PHASE 3 LAUNCH — PRD-Integrated AI & Database Persistence

**Status**: 🟢 READY TO START  
**Date**: October 23, 2025  
**Duration**: 12-14 hours (9 tasks)  
**Goal**: Build intelligent PRD-driven AI reasoning with database persistence and authentication

---

## 📊 Phase Overview

### Vision
Transform Strukt from a heuristic-based system into an **AI-reasoned architecture platform** powered by:
- **PRD Templates** as reasoning scaffolds
- **OpenAI GPT-4o** for intelligent workspace generation
- **MongoDB** for persistent storage
- **JWT Authentication** for user workspaces
- **Real-time Autosave** for seamless experience

### Key Outcomes
✅ Replace heuristic generation with GPT-4o + PRD context  
✅ Persist workspaces to MongoDB with user accounts  
✅ Enable PRD-driven code generation with best practices  
✅ Support 10 curated PRD templates covering major architectures  
✅ Implement JWT authentication + token management  
✅ Real-time autosave (debounced 5s)  
✅ Vector search over PRD templates using MongoDB Atlas Vector Search  

---

## ⚙️ System Architecture Decisions (LOCKED)

### 🧠 Model Configuration

**Primary Model:** `GPT-4o`
- Best balance of capability, cost, and reasoning
- Use for architecture generation, code scaffolding, PRD synthesis

**Fallback Model:** `gpt-4o-mini`
- Cost-effective alternative for batch tasks and heuristics

**Environment Variables:**
```bash
MODEL_PRIMARY=GPT-4o
MODEL_CHEAP=gpt-4o-mini
OPENAI_API_KEY=sk-***** (user-provided)
TEMPERATURE=0.1
```

### 🧩 Vector Database: MongoDB Atlas Vector Search

**Why MongoDB Atlas Vector Search:**
- ✅ Native integration with existing MongoDB backend
- ✅ Zero additional infrastructure needed
- ✅ PRD templates and embeddings live alongside workspace data
- ✅ Built-in similarity search for context retrieval

**Fallback:** Qdrant (self-hosted HNSW index) for future iterations

**Schema:**
```json
{
  "_id": "template_backend_api",
  "name": "Backend API PRD",
  "tags": ["backend", "api", "express", "nodejs"],
  "embedding": [0.012, -0.043, ...],
  "model": "text-embedding-3-large",
  "sections": [
    {"title": "Overview", "content": "..."},
    {"title": "Functional Requirements", "content": "..."},
    {"title": "Technical Overview", "content": "..."}
  ],
  "metadata": {
    "created_at": "2025-10-23",
    "usage_count": 0
  }
}
```

### 👥 Collaboration Mode: MVP Single-User + Autosave

**Approach:**
- Single-user model for MVP (no WebSocket sync yet)
- Autosave every 5 seconds (debounced)
- Explicit Save/Load buttons preserved
- Last-write-wins for conflict resolution

**Future Expansion:** Y.js or Liveblocks for multiplayer in Phase 4

### 📋 PRD Template Library (10 Templates)

**Initial Templates:**
1. General Software PRD
2. Web App (Frontend-heavy)
3. Backend API
4. Mobile App
5. Data Pipeline
6. AI/ML Feature
7. Dashboard / Analytics
8. SaaS MVP
9. Marketplace Platform
10. Internal Tool

**Storage:** `/data/prd_templates/` (Markdown + JSON dual format)  
**Auto-embedded** into MongoDB Atlas Vector Search on startup

---

## 🧠 Data Flow

```
User Creates Node
    ↓
Template Matcher (by tags + node type)
    ↓
Vector Search (MongoDB Atlas)
    ↓
Top N Relevant PRD Templates Retrieved
    ↓
PRD Content Injected into GPT-4o Prompt
    ↓
GPT-4o Generates Code + Architecture
    ↓
Updated PRD Generated & Versioned
    ↓
Workspace + PRD History Saved to MongoDB
    ↓
UI Updated with Results
```

---

## 📋 Task Breakdown (9 Tasks)

### Task 3.1: PRD Template System & MongoDB Schema
**Duration:** 45 min  
**Deliverables:**
- Mongoose schema for PRD templates
- Add fields: `name`, `tags`, `sections[]`, `embedding[]`, `metadata`
- Seed database with 10 base PRD templates (Markdown + JSON)
- Script to load templates from `/data/prd_templates/` into MongoDB

**Files:**
- `server/src/models/PRDTemplate.ts` (new)
- `server/src/data/prd_templates/` (directory with 10 `.md` + `.json` files)
- `server/src/scripts/seed-prd-templates.ts` (new)

**Success:** 10 templates in MongoDB, queryable by tags

---

### Task 3.2: OpenAI Embedding & Vector Search Setup
**Duration:** 50 min  
**Deliverables:**
- OpenAI `text-embedding-3-large` integration
- Generate embeddings for all PRD templates
- Index embeddings in MongoDB Atlas Vector Search
- Create embedding generation script (reusable for new templates)

**Files:**
- `server/src/services/EmbeddingService.ts` (new)
- `server/src/config/embeddings.ts` (new config)
- Environment variable: `OPENAI_EMBEDDING_KEY`

**Success:** All 10 PRD templates have vector embeddings, searchable in Mongo

---

### Task 3.3: PRD Retrieval API Endpoints
**Duration:** 40 min  
**Deliverables:**
- `POST /api/prd/search` — Search by similarity + tags
- `GET /api/prd/:id` — Fetch specific PRD
- `GET /api/prd/suggest/:nodeType` — Suggest PRDs for node type (frontend, backend, etc.)
- Response caching (5-min TTL)

**Files:**
- `server/src/routes/prd.ts` (new)
- Update `server/src/index.ts` to register routes

**Success:** All endpoints return relevant PRDs with metadata

---

### Task 3.4: Context Injector & OpenAI Prompt Builder
**Duration:** 55 min  
**Deliverables:**
- Function to inject PRD sections into OpenAI prompts
- Build structured prompt template with PRD context
- Handle case: no relevant PRD (graceful fallback)
- Structure prompts for code generation + PRD synthesis

**Files:**
- `server/src/services/PromptBuilder.ts` (new)
- `server/src/utils/prd-context.ts` (new)

**Success:** Prompts built with PRD context, ready for GPT-4o

---

### Task 3.5: Replace Heuristics with GPT-4o + PRD Context
**Duration:** 60 min  
**Deliverables:**
- Update `/api/ai/generate` to use GPT-4o + PRD context
- Retrieve relevant PRDs for the prompt
- Inject PRD sections into system prompt
- Generate workspace structure + updated PRD
- Fall back to heuristics if OpenAI key missing

**Files:**
- Update `server/src/routes/ai.ts`
- Update `server/src/services/AIService.ts` (new)

**Success:** AI generation uses GPT-4o with PRD reasoning

---

### Task 3.6: Workspace Persistence (MongoDB)
**Duration:** 50 min  
**Deliverables:**
- Mongoose schema for Workspace with owner, nodes, edges, prd_history
- `POST /api/workspaces` — Create workspace
- `PUT /api/workspaces/:id` — Update with nodes/edges
- `GET /api/workspaces/:id` — Fetch workspace
- Track PRD versions for each generation

**Files:**
- Update `server/src/models/Workspace.ts` (extend existing)
- Update `server/src/routes/workspaces.ts`

**Success:** Workspaces persist with full history

---

### Task 3.7: JWT Authentication & User Model
**Duration:** 45 min  
**Deliverables:**
- Mongoose schema for User (email, password hash, created_at)
- JWT token generation + verification middleware
- `POST /api/auth/register` — Create user account
- `POST /api/auth/login` — Issue JWT token
- Auth middleware protecting workspace endpoints
- Token stored in user session/localStorage (client)

**Files:**
- `server/src/models/User.ts` (new)
- `server/src/middleware/authOptional.ts` (update)
- `server/src/routes/auth.ts` (new)
- `client/src/utils/auth.ts` (new)

**Success:** Users can sign up, log in, and own workspaces

---

### Task 3.8: Autosave & Real-time Persistence
**Duration:** 40 min  
**Deliverables:**
- Client-side autosave handler (debounced 5s)
- Backend endpoint: `PATCH /api/workspaces/:id/autosave`
- Detect changes (nodes, edges, content)
- Show "saving..." indicator on UI
- Conflict detection (last-write-wins + user notice)

**Files:**
- `client/src/hooks/useAutosave.ts` (new)
- Update `client/src/pages/Whiteboard.tsx`
- Update `server/src/routes/workspaces.ts`

**Success:** Workspace auto-saves every 5 seconds

---

### Task 3.9: PRD Versioning & History
**Duration:** 50 min  
**Deliverables:**
- Track PRD versions as code is generated
- Store PRD snapshots in workspace history
- `GET /api/workspaces/:id/prd-history` — Fetch PRD versions
- `POST /api/workspaces/:id/prd-history/rollback/:version` — Revert to old PRD
- UI to view PRD evolution

**Files:**
- Update `server/src/models/Workspace.ts` (add prd_history array)
- `server/src/routes/prd.ts` (add history endpoints)
- `client/src/components/PRDHistory.tsx` (new)

**Success:** Users can view and revert PRD versions

---

### Task 3.10: Documentation & Testing
**Duration:** 90 min  
**Deliverables:**
- Phase 3 completion guide
- API reference for all new endpoints
- Test suite: embedding retrieval, GPT-4o generation, auth flow
- Integration test: end-to-end generation with PRD context
- Environment variable guide
- Troubleshooting guide for OpenAI API

**Files:**
- `docs/PHASE_3_COMPLETE.md`
- `docs/API_REFERENCE.md` (updated)
- `server/src/**/*.test.ts` (test files)

**Success:** 30+ automated tests passing, comprehensive docs

---

## 🎯 Success Criteria

- ✅ 10 PRD templates loaded into MongoDB
- ✅ Vector search working (MongoDB Atlas Vector Search)
- ✅ `/api/prd/search` returns relevant templates
- ✅ GPT-4o generation uses PRD context
- ✅ Workspaces persist to MongoDB with owner tracking
- ✅ JWT authentication working (sign up, login, token)
- ✅ Autosave working (debounced 5s)
- ✅ PRD versioning + rollback UI functional
- ✅ 30+ automated tests passing (100%)
- ✅ Zero TypeScript errors
- ✅ Build: < 1s
- ✅ UI version bumped to `v. 2`

---

## 📅 Timeline

| Task | Duration | Start | End | Status |
|------|----------|-------|-----|--------|
| 3.1 | 45 min | 0h | 0:45 | ⏳ READY |
| 3.2 | 50 min | 0:45 | 1:35 | ⏳ READY |
| 3.3 | 40 min | 1:35 | 2:15 | ⏳ READY |
| 3.4 | 55 min | 2:15 | 3:10 | ⏳ READY |
| 3.5 | 60 min | 3:10 | 4:10 | ⏳ READY |
| 3.6 | 50 min | 4:10 | 5:00 | ⏳ READY |
| 3.7 | 45 min | 5:00 | 5:45 | ⏳ READY |
| 3.8 | 40 min | 5:45 | 6:25 | ⏳ READY |
| 3.9 | 50 min | 6:25 | 7:15 | ⏳ READY |
| 3.10 | 90 min | 7:15 | 8:45 | ⏳ READY |
| **TOTAL** | **525 min** | **0h** | **8h 45m** | ⏳ READY |

**Buffer**: 1-1.5 hours for integration testing and bug fixes  
**Expected Completion**: 9-10 hours

---

## 🧩 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    PHASE 3 SYSTEM                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend (React)                                  │
│  ├── Whiteboard (nodes + edges)                    │
│  ├── Autosave Hook (5s debounce)                   │
│  └── Auth UI (sign up, login)                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │       Backend (Node.js + Express)           │   │
│  ├─────────────────────────────────────────────┤   │
│  │ API Routes:                                 │   │
│  │ ├── /api/auth (sign up, login, JWT)         │   │
│  │ ├── /api/prd (search, suggest, history)     │   │
│  │ ├── /api/ai/generate (GPT-4o + PRD)         │   │
│  │ └── /api/workspaces (CRUD + autosave)       │   │
│  │                                             │   │
│  │ Services:                                   │   │
│  │ ├── EmbeddingService (OpenAI)               │   │
│  │ ├── PromptBuilder (PRD context injection)   │   │
│  │ ├── AIService (GPT-4o generation)           │   │
│  │ └── AuthService (JWT tokens)                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   Data Layer (MongoDB)                      │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Collections:                                │   │
│  │ ├── Users (email, password hash)            │   │
│  │ ├── Workspaces (nodes, edges, owner)        │   │
│  │ ├── PRDTemplates (embedding, sections)      │   │
│  │ └── PRDVersions (history tracking)          │   │
│  │                                             │   │
│  │ Indexes:                                    │   │
│  │ ├── Vector Search (PRD embedding)           │   │
│  │ ├── Unique (email, workspace name)          │   │
│  │ └── TTL (autosave timestamps)               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  External Services:                                │
│  ├── OpenAI GPT-4o (generation)                    │
│  ├── OpenAI Embedding (text-embedding-3-large)     │
│  └── MongoDB Atlas Vector Search (retrieval)       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

- **JWT Tokens**: 24-hour expiry, refresh token rotation
- **Password Hashing**: bcryptjs with 10 salt rounds
- **API Key Storage**: Environment variables only (never committed)
- **Database**: Authenticated MongoDB connection
- **CORS**: Restrict to frontend origin
- **Rate Limiting**: 100 requests/minute per user (coming in Phase 4)

---

## 📊 Testing Strategy

### Unit Tests (120 min total)
- EmbeddingService (vector generation, similarity)
- PromptBuilder (PRD injection, formatting)
- AuthService (JWT generation, verification)
- Autosave (debounce, conflict detection)

### Integration Tests (60 min)
- End-to-end: PRD search → GPT-4o generation → workspace save
- Auth flow: sign up → login → generate → autosave
- PRD versioning: generate → update → rollback

### Manual QA (30 min)
- Sign up and login flow
- Workspace generation with different prompts
- Autosave functionality
- PRD history viewing

---

## 🚀 Go/No-Go Checklist

Before starting Phase 3:
- [ ] OpenAI API key obtained and tested
- [ ] MongoDB Atlas account setup + connection string ready
- [ ] Vector Search index created in MongoDB
- [ ] 10 PRD templates prepared in `/data/prd_templates/`
- [ ] Phase 2 tests still passing (regression check)
- [ ] UI version ready to bump to `v. 2`

---

## 📚 Documentation References

- **OpenAI API**: https://platform.openai.com/docs
- **MongoDB Atlas Vector Search**: https://www.mongodb.com/docs/atlas/atlas-vector-search/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc7519
- **Mongoose Schemas**: https://mongoosejs.com/docs/guide.html

---

## 🎓 Key Learnings from Phase 3

1. **PRD Templates as AI Context** — Using structured documents to guide AI reasoning significantly improves quality and consistency
2. **Vector Search at Scale** — MongoDB Atlas Vector Search scales without additional infrastructure
3. **Autosave UX** — Debounced saves create smooth, performant user experience
4. **Auth Patterns** — JWT tokens with proper middleware unlock multi-user features
5. **PRD Versioning** — Tracking PRD evolution creates "living documentation" that improves over time

---

## 🎯 Expected Outcomes (Phase 3 Complete)

✅ **AI Generation** powered by PRD reasoning (not heuristics)  
✅ **Database Persistence** for multi-session workspaces  
✅ **User Accounts** with JWT authentication  
✅ **Autosave** for seamless experience  
✅ **PRD Versioning** for living documentation  
✅ **Vector Search** enabling semantic template matching  
✅ **30+ Tests** all passing  
✅ **0 TypeScript Errors**  
✅ **6800+ lines** of documentation  

---

## 🔮 Phase 4 Preview

Once Phase 3 is complete, Phase 4 will add:
- Real-time multiplayer (WebSocket + Y.js)
- Export to code (scaffolding generator)
- Team collaboration + permissions
- Advanced analytics + usage tracking
- Custom PRD template creation

---

**Status**: 🟢 LOCKED & READY TO EXECUTE  
**Next**: Start Task 3.1 (PRD Template System)

