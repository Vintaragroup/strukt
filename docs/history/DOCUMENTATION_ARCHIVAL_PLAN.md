# Documentation Archival Strategy

## Current State

**Problem**: ~130 old documents in `/docs/` that reference outdated features, processes, and architectural decisions that conflict with newly locked-in rules (Ring Hierarchy, Node Placement, Auto-Create design).

**Risk**: Developers read outdated docs and implement incorrect features or violate established constraints.

**Solution**: Archive old docs into versioned folder structure, create authoritative reference docs for new rules.

---

## Archival Plan

### Phase 1: Create Archive Structure

```
/docs/
├── _ARCHIVE_PHASE_1/          # Phase 1 development docs (outdated)
│   └── [old Phase 1 files]
├── _ARCHIVE_PHASE_2/          # Phase 2 development docs (outdated)
│   └── [old Phase 2 files]
├── _ARCHIVE_PHASE_3/          # Phase 3 development docs (outdated, pre-locking)
│   └── [old Phase 3 files]
├── _AUTHORITATIVE/            # CURRENT - Read these!
│   ├── RING_HIERARCHY_LOCKED.md
│   ├── NODE_PLACEMENT_RULES.md
│   ├── AUTO_CREATE_DESIGN.md
│   ├── CURRENT_ARCHITECTURE.md
│   └── DEVELOPMENT_CHECKLIST.md
├── _ACTIVE_TASKS/             # Current sprint docs
│   ├── AUTO_CREATE_IMPLEMENTATION_PLAN.md
│   └── [active work]
└── START_HERE.md              # Points to _AUTHORITATIVE/
```

### Phase 2: Categorize Old Docs

**Keep Active** (move to `_ACTIVE_TASKS/`):

- AUTO*CREATE*\*.md (Task 3 design docs)
- NODE*PLACEMENT*\*.md (Task 3 verification docs)
- QUICK_REFERENCE.md
- SETUP.md

**Archive** (move to `_ARCHIVE_PHASE_*`):

- All TASK*2*\* files (completed, not current)
- All TASK_3_1-3_2 files (completed, not current)
- All PHASE\_\* status files (historical)
- All SESSION\_\* summaries (historical)
- All FIXES\_\* files (old fixes, now locked)
- All RING_HIERARCHY_FIX\* files (old fixes, now locked)
- All CLASSIFICATION\_\* files (old fixes, now locked)

**Audit** (review before archiving):

- ARCHITECTURE.md
- API_DOCUMENTATION.md
- DEPLOYMENT_GUIDE.md

---

## Recommended Approach

### Option A: Aggressive Archival (Clean Slate) ✅ RECOMMENDED

- Move ALL old docs to `_ARCHIVE_PHASE_*`
- Create fresh `_AUTHORITATIVE/` docs based on locked rules
- Developers know to ONLY read `_AUTHORITATIVE/`
- Pro: Clean, no confusion
- Con: Loses historical context

### Option B: Selective Keep (Hybrid)

- Keep only essential docs (SETUP.md, ARCHITECTURE.md)
- Archive task files and status reports
- Add warning banners to old docs
- Pro: Some history available
- Con: Developers might read outdated stuff

### Option C: Archive to Separate Folder (Gentle)

- Create `/docs/ARCHIVED/` with date-based structure
- Keep pointers in main `/docs/`
- Pro: Nothing deleted, historical record
- Con: Takes space, developers confused by choices

---

## Recommended Old Docs to Archive

### Definitely Archive (Task Completions - Not Current)

```
TASK_2_1_COMPLETE.md
TASK_2_1_SUMMARY.md
TASK_2_2_COMPLETE.md
TASK_2_3_COMPLETE.md
TASK_2_4_COMPLETE.md
TASK_2_6_COMPLETE.md
TASK_2_7_COMPLETE.md
TASK_2_8_COMPLETE.md
TASK_2_9_COMPLETE.md
TASK_3_1_COMPLETE.md
TASK_3_2_PROGRESS.md
TASK_3_3_COMPLETE.md
TASK_3_4_COMPLETE.md
TASK_3_5_ACTIVATED.md
TASK_3_5_READY.md
TASK_3_6_PLANNING.md
TASK_3_6_COMPLETE.md
TASK_3_7_PLANNING.md
TASK_3_7_COMPLETE.md
TASK_3_8_PLANNING.md
TASK_3_8_COMPLETE.md
TASK_3_9_PLANNING.md
TASK_3_9_COMPLETE.md
```

### Definitely Archive (Phase Status - Not Current)

```
PHASE_1_COMPLETE.md
PHASE_1_IMPLEMENTATION.md
PHASE_1_APPROVED.md
PHASE_1_LAUNCH.md
PHASE_1_SUMMARY.txt
PHASE_1_TASKS.md
PHASE_1_TEST_PLAN.md
PHASE_1_INDEX.md
PHASE_1_COMPLETION_REPORT.txt
PHASE_2_COMPLETE.md
PHASE_2_IMPLEMENTATION.md
PHASE_2_LAUNCH.md
PHASE_2_BUILD_VERIFICATION.md
PHASE_2_QUICK_START.md
PHASE_2_STATUS_REPORT.txt
PHASE_2_SUMMARY.md
PHASE_2_TEST_PLAN.md
PHASE_2_DOCUMENTATION_INDEX.md
PHASE_3_60_PERCENT.md
PHASE_3_70_PERCENT.md
PHASE_3_85_PERCENT.md
PHASE_3_MID_POINT_STATUS.md
PHASE_3_STATUS_CURRENT.md
PHASE_3_PROGRESS_SNAPSHOT.md
PHASE_3_LAUNCH.md
PHASE_3_INDEX.md
PHASE_3_EXECUTION_GUIDE.md
PHASE_3_PRE_LAUNCH_CHECKLIST.md
```

### Definitely Archive (Session Summaries - Historical)

```
SESSION_3_1_TO_3_3_SUMMARY.md
SESSION_COMPLETE_TASK_3_10.md
SESSION_COMPLETE_TASK_3_9.md
SESSION_COMPLETE_READY_FOR_API_KEY.md
SESSION_FINAL_SUMMARY.md
SESSION_FOUNDATION_COMPLETE.md
```

### Definitely Archive (Old Fixes - Now Locked)

```
RING_HIERARCHY_FIX.md
RING_HIERARCHY_EDGE_RECONSTRUCTION.md
RING_HIERARCHY_ENFORCEMENT.md
RING_HIERARCHY_PROTECTION.md
RING_CLASSIFICATION_DIAGNOSIS.md
RING_CLASSIFICATION_FIXES_COMPLETE.md
CLASSIFICATION_FIX_SUMMARY.md
CLASSIFICATION_FIXES_COMPLETE.md
CLASSIFICATION_IMPLEMENTATION_SUMMARY.md
```

### Archive with Caution (Might be Useful)

```
ARCHITECTURE.md                    → Review, might need updating
API_DOCUMENTATION.md               → Review, might be current
DEPLOYMENT_GUIDE.md                → Review, might be current
SETUP.md                           → Probably keep
PROJECT_OVERVIEW.md                → Review, reference only
```

### Keep Active (Current Work)

```
START_HERE.md                      → Update to point to _AUTHORITATIVE/
AUTO_CREATE_DESIGN.md              → Keep active
AUTO_CREATE_REQUIREMENTS.md        → Keep active
AUTO_CREATE_IMPLEMENTATION_PLAN.md → Keep active
AUTO_CREATE_VISUAL_GUIDE.md        → Keep active
AUTO_CREATE_INDEX.md               → Keep active
AUTO_CREATE_COMPLETE_PACKAGE.md    → Keep active
NODE_PLACEMENT_SUMMARY.md          → Keep active
NODE_PLACEMENT_VERIFICATION.md     → Keep active
TASK_3_COMPLETE.md                 → Keep active
QUICK_REFERENCE.md                 → Keep active (if useful)
```

---

## New Authoritative Docs to Create

Replace chaos of old docs with clear authority:

### 1. `_AUTHORITATIVE/CURRENT_ARCHITECTURE.md`

- Ring hierarchy locked rules
- Node placement constraints
- Classification system
- Edge relationship types
- Validated examples

### 2. `_AUTHORITATIVE/DEVELOPMENT_RULES.md`

- Ring 1 (immutable)
- Ring 2-3 (auto-create rules)
- Ring 4+ (expandable)
- Deduplication algorithm
- What developers CAN'T do

### 3. `_AUTHORITATIVE/ACTIVE_TASKS.md`

- Current sprint tasks
- Task 4-10 requirements
- Implementation phases
- Timeline

### 4. `_AUTHORITATIVE/QUICK_START.md`

- For new developers
- Read these first
- Links to detailed docs
- Common tasks

### 5. Update `START_HERE.md`

- Point to `_AUTHORITATIVE/` folder
- Warn about archived docs
- Show task structure

---

## Implementation Steps

### Step 1: Create Archive Directories

```bash
mkdir -p docs/_ARCHIVE_PHASE_1
mkdir -p docs/_ARCHIVE_PHASE_2
mkdir -p docs/_ARCHIVE_PHASE_3
mkdir -p docs/_ACTIVE_TASKS
mkdir -p docs/_AUTHORITATIVE
```

### Step 2: Create Archive README

```markdown
# ARCHIVED DOCUMENTATION

These files are from previous development phases.
**Do not implement features based on these docs.**

**Current authoritative docs**: See `../_AUTHORITATIVE/`

## Contents

- PHASE_1: Initial development (obsolete)
- PHASE_2: Build framework (obsolete)
- PHASE_3: Early phase 3 (pre-locking)
```

### Step 3: Move Old Files

```bash
# Move Phase 1 files
mv docs/PHASE_1_*.md docs/_ARCHIVE_PHASE_1/
mv docs/TASK_2_*.md docs/_ARCHIVE_PHASE_2/
mv docs/TASK_3_[1-2]*.md docs/_ARCHIVE_PHASE_3/

# Move status/session files
mv docs/SESSION_*.md docs/_ARCHIVE_PHASE_3/
mv docs/PHASE_3_60*.md docs/_ARCHIVE_PHASE_3/
mv docs/PHASE_3_70*.md docs/_ARCHIVE_PHASE_3/

# Move old fixes
mv docs/RING_HIERARCHY_FIX*.md docs/_ARCHIVE_PHASE_3/
mv docs/CLASSIFICATION_FIX*.md docs/_ARCHIVE_PHASE_3/
```

### Step 4: Move Active Task Docs

```bash
mkdir -p docs/_ACTIVE_TASKS
mv docs/AUTO_CREATE_*.md docs/_ACTIVE_TASKS/
mv docs/NODE_PLACEMENT_*.md docs/_ACTIVE_TASKS/
mv docs/TASK_3_COMPLETE.md docs/_ACTIVE_TASKS/
```

### Step 5: Create Authoritative Docs

- Create `_AUTHORITATIVE/CURRENT_ARCHITECTURE.md`
- Create `_AUTHORITATIVE/DEVELOPMENT_RULES.md`
- Create `_AUTHORITATIVE/ACTIVE_TASKS.md`
- Create `_AUTHORITATIVE/QUICK_START.md`

### Step 6: Update START_HERE.md

```markdown
# START HERE

⚠️ **IMPORTANT**: Read the authoritative docs, not archived ones.

## Current Architecture (Locked Rules)

→ See: `_AUTHORITATIVE/CURRENT_ARCHITECTURE.md`

## Development Rules (What You Can/Can't Do)

→ See: `_AUTHORITATIVE/DEVELOPMENT_RULES.md`

## Current Tasks (What We're Building)

→ See: `_ACTIVE_TASKS/`

## New to Project?

→ See: `_AUTHORITATIVE/QUICK_START.md`

## Old Documentation (For Reference Only)

→ See: `_ARCHIVE_PHASE_*/` (obsolete, don't build from these)
```

---

## Timeline

- **5 min**: Create directories
- **5 min**: Create README in archives
- **10 min**: Move old files
- **20 min**: Create authoritative docs
- **5 min**: Update START_HERE.md
- **Total: 45 min**

---

## Benefits

✅ **Clarity**: No confusion about which docs to follow  
✅ **Safety**: Old rules won't accidentally get implemented  
✅ **History**: Old docs preserved for reference  
✅ **Organization**: Clear folder structure  
✅ **Onboarding**: New developers know where to look  
✅ **Maintainability**: Central authority for rules

---

## What Should We Do?

**Recommendation**: Option A (Aggressive Archival) + Create Authoritative Docs

This ensures:

1. Developers never accidentally read outdated rules
2. Single source of truth for locked rules
3. Clean project structure
4. Historical records preserved

---

## Ready?

Should I proceed with:

1. ✅ Archive old documentation
2. ✅ Create new authoritative structure
3. ✅ Update START_HERE.md
4. ✅ Create authoritative docs for rules, tasks, architecture

This will take ~45 minutes total.
