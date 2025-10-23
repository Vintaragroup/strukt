# 🎯 PHASE 3 EXECUTION GUIDE

**Status**: ✅ READY TO EXECUTE  
**Date**: October 23, 2025  
**Build**: ✅ PASSING (0 errors, 701ms)  

---

## 📍 Current Position

**What's Complete:**
- ✅ Phase 1: Node UI with content management (9/9 tasks)
- ✅ Phase 2: AI workspace generation (9/9 tasks, 64 tests passing)
- ✅ Phase 3 Planning: Architecture locked, PRD library ready
- ✅ Root directory cleaned (33 MD files moved to `/docs/`)
- ✅ UI version bumped to v. 2
- ✅ 10 PRD templates created (20 files in `/server/src/data/prd_templates/`)

**Build Status:**
- ✅ 272 modules transformed
- ✅ 0 TypeScript errors
- ✅ Build time: 701ms
- ✅ No regressions

---

## 🚀 How to Start Phase 3

### Option 1: Continue Immediately
1. **Review** `docs/PHASE_3_LAUNCH.md` (5 min read)
2. **Start** Task 3.1: PRD Template System & MongoDB Schema
3. **Est. Duration**: 45 min

### Option 2: Verify Setup First
1. **Check** OpenAI API key available
2. **Verify** MongoDB Atlas account + connection
3. **Test** MongoDB Vector Search index
4. **Then** start Task 3.1

---

## 📋 Task 3.1 Quick Overview

**Objective**: Load PRD templates into MongoDB and set up Mongoose schema

**What You'll Do:**
1. Create `server/src/models/PRDTemplate.ts` (Mongoose schema)
2. Create `server/src/scripts/seed-prd-templates.ts` (loader script)
3. Load 10 templates from `/server/src/data/prd_templates/`
4. Test that templates are queryable

**Files Available:**
- 10 markdown PRDs (descriptions + sections)
- 10 JSON metadata files (tags, complexity, effort)

**Success Criteria:**
- All 10 templates in MongoDB
- Queryable by ID and tags
- Embedding fields ready for next task

---

## 🧭 Navigation

### Documentation
- **Current Phase**: `docs/PHASE_3_LAUNCH.md` (main blueprint)
- **Pre-Launch Checklist**: `docs/PHASE_3_PRE_LAUNCH_CHECKLIST.md`
- **Previous Phases**: 
  - `docs/PHASE_1_COMPLETE.md`
  - `docs/PHASE_2_COMPLETE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Setup**: `docs/SETUP.md`

### Data & Templates
- **PRD Templates**: `/server/src/data/prd_templates/`
  - 10 markdown files (001_backend_api.md ... 010_general_software.md)
  - 10 JSON metadata files (matching)

### Code Locations
- **Models**: `/server/src/models/` (where PRDTemplate.ts goes)
- **Routes**: `/server/src/routes/` (where PRD API endpoints go)
- **Services**: `/server/src/services/` (where AI/Embedding services go)
- **Client**: `/client/src/` (UI for workspaces, auth, etc.)

---

## 🔑 Key Decisions (Locked)

**Model**: `GPT-4o` (reasoning) + `gpt-4o-mini` (fallback)  
**Vector DB**: MongoDB Atlas Vector Search (no new infra)  
**Collaboration**: Single-user MVP + autosave (5s)  
**Templates**: 10 curated PRDs covering major architectures  

These are set and shouldn't be revisited. If you need to adjust, document in Phase 3 notes.

---

## ✅ Pre-Flight Checklist

Before starting Task 3.1, verify:
- [ ] Build passes (`npm run build` → 0 errors)
- [ ] UI shows "v. 2" in browser tab
- [ ] Toolbar badge shows "UI v. 2"
- [ ] Hot reload working (http://localhost:5174)
- [ ] Docker containers running (4/4)
- [ ] No console errors in browser

---

## 📊 Phase 3 at a Glance

| Task | Duration | What | Files |
|------|----------|------|-------|
| 3.1 | 45 min | PRD schema + seed | PRDTemplate.ts, seed script |
| 3.2 | 50 min | Embeddings + vector search | EmbeddingService.ts |
| 3.3 | 40 min | PRD search API endpoints | prd.ts routes |
| 3.4 | 55 min | Prompt builder with PRD | PromptBuilder.ts |
| 3.5 | 60 min | GPT-4o generation | ai.ts routes update |
| 3.6 | 50 min | Workspace persistence | Workspace.ts model |
| 3.7 | 45 min | JWT authentication | User.ts, auth.ts |
| 3.8 | 40 min | Autosave & debounce | useAutosave hook |
| 3.9 | 50 min | PRD versioning | History tracking |
| 3.10 | 90 min | Tests + documentation | Test files, docs |

**Total**: 8h 45m + buffer = ~10h expected

---

## 🎬 Get Started

### Next Step
👉 **Read** `docs/PHASE_3_LAUNCH.md` (10 min)  
👉 **Start** Task 3.1 in 45 min  

### Commands
```bash
# Verify build
npm run build

# View templates
ls -la server/src/data/prd_templates/

# Open documentation
open docs/PHASE_3_LAUNCH.md
```

---

## 🆘 Troubleshooting

**Q: Where are the PRD templates?**  
A: `/server/src/data/prd_templates/` (20 files: 10 MD + 10 JSON)

**Q: What if OpenAI API key not available?**  
A: Use fallback `gpt-4o-mini` or heuristics (defined in Phase 3 task 3.5)

**Q: Do I need to set up MongoDB Atlas Vector Search?**  
A: MongoDB Atlas should have it, but Task 3.2 will do the setup

**Q: Can I run Phase 3 tasks out of order?**  
A: Tasks 3.1-3.4 are sequential. Tasks 3.6-3.8 can be parallel. Avoid.

---

**Status**: 🟢 READY  
**Next**: Phase 3, Task 3.1  
**Time**: ~45 min
