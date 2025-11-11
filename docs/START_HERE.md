# 📍 START HERE: Project Documentation Index

**Welcome to Strukt!** This document maps you to everything you need.

---

## � I'm New to the Project

**→ Go to: `_AUTHORITATIVE/QUICK_START.md`** (5 min read)

This is your entry point. It has:

- 30-second overview
- Key constraints you can't break
- Ring hierarchy explanation
- Common task example
- Learning path for first 3 days

---

## 🔒 I Need to Know the LOCKED Rules

**→ Go to: `_AUTHORITATIVE/CURRENT_ARCHITECTURE.md`**

This is the authority on:

- Ring hierarchy (R0 → R1 → R2 → R3 → ...)
- Classification system (10 immutable Ring 1 nodes)
- Node placement rules
- 6 hard constraints
- What you CAN'T do

**This is law.** Don't break these.

---

## 👨‍💻 I'm About to Write Code

**→ Go to: `_AUTHORITATIVE/DEVELOPMENT_RULES.md`**

This has:

- Core principle (association-driven, not position-driven)
- 6 hard constraints with code examples
- What you CAN do
- What you CANNOT do
- Code review checklist
- Common mistakes (with wrong/right examples)
- Verification tests

**Read before coding.** Check off every item in the code review checklist.

---

## � What Am I Working On?

**→ Go to: `_AUTHORITATIVE/ACTIVE_TASKS.md`**

This lists all current tasks (4-10):

- Task 4: Duplicate detection system (20 min)
- Task 5: Deduplication logic (20 min)
- Task 6: Infrastructure auto-create (1.5 hrs)
- Task 7: Frontend auto-create (1.5 hrs)
- Task 8: Backend auto-create (1.5 hrs)
- Task 9: Data auto-create (1.5 hrs)
- Task 10: Integration testing (1 hr)

Each task has:

- Requirements
- Getting started guidance
- Test scenarios
- Success criteria
- Effort estimate

---

## 🎨 I Need Technical Design Details

**→ Go to: `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md`** (and other AUTO*CREATE*\*.md files)

This has:

- Complete auto-create feature design
- All 4 domains (Infrastructure, Frontend, Backend, Data)
- Smart deduplication algorithm with examples
- UX flows and diagrams
- Code patterns and examples

**Use this as reference while implementing tasks 6-9.**

---

## � Old Documentation (Reference Only)

**→ Go to: `_ARCHIVE_PHASE_1/`, `_ARCHIVE_PHASE_2/`, `_ARCHIVE_PHASE_3/`**

These contain old documentation from earlier phases.

**⚠️ WARNING**: Don't use these as authority. The authoritative docs are in `_AUTHORITATIVE/`. Old docs may have outdated rules or deprecated patterns.

**Use only for**: Historical context, understanding how we got here, seeing old test results

---

## �️ Quick Navigation

```
docs/
├─ START_HERE.md (you are here)
│
├─ _AUTHORITATIVE/
│  ├─ QUICK_START.md ........................ New? Start here (5 min)
│  ├─ CURRENT_ARCHITECTURE.md ............ Locked rules (authority)
│  ├─ DEVELOPMENT_RULES.md ............... Coding patterns & checklist
│  └─ ACTIVE_TASKS.md .................... Tasks 4-10 breakdown
│
├─ _ACTIVE_TASKS/
│  ├─ AUTO_CREATE_DESIGN.md ........... Full technical design
│  ├─ AUTO_CREATE_REQUIREMENTS.md ..... Summary
│  ├─ AUTO_CREATE_IMPLEMENTATION_PLAN.md .. Step-by-step
│  ├─ AUTO_CREATE_VISUAL_GUIDE.md ..... UX flows
│  └─ AUTO_CREATE_*.md ............... Other design docs
│
├─ _ARCHIVE_PHASE_1/
│  └─ [Old Phase 1 docs - reference only]
│
├─ _ARCHIVE_PHASE_2/
│  └─ [Old Phase 2 docs - reference only]
│
└─ _ARCHIVE_PHASE_3/
   └─ [Old Phase 3 early work - reference only]
```

---

## 🚦 Decision Tree

### "I don't know where to start"

→ `_AUTHORITATIVE/QUICK_START.md`

### "I need to understand the constraints"

→ `_AUTHORITATIVE/CURRENT_ARCHITECTURE.md`

### "I'm about to code, what's the pattern?"

→ `_AUTHORITATIVE/DEVELOPMENT_RULES.md`

### "Which task should I work on?"

→ `_AUTHORITATIVE/ACTIVE_TASKS.md`

### "I need design details for my domain"

→ `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md` (search for your domain)

### "I want historical context"

→ `_ARCHIVE_PHASE_*/` (reference only)

### "Is the old doc still valid?"

→ Compare with `_AUTHORITATIVE/`. If different, use _AUTHORITATIVE_.

---

## ✅ Pre-Coding Checklist

Before you start implementing:

- [ ] Read `QUICK_START.md` (5 min)
- [ ] Read `CURRENT_ARCHITECTURE.md` section 1 (10 min)
- [ ] Read `DEVELOPMENT_RULES.md` section "Hard Constraints" (10 min)
- [ ] Understand: "Ring = parent.ring + 1" (not user input)
- [ ] Understand: "Parent = type+domain" (not drag source)
- [ ] Understand: "Position = domain+ring" (not mouse)
- [ ] Pick your task from `ACTIVE_TASKS.md`
- [ ] Read the design section for your domain
- [ ] Have `DEVELOPMENT_RULES.md` open while coding
- [ ] Use code review checklist before submitting

---

## 🎓 Three-Day Learning Path

### Day 1: Understand the System

- [ ] Read: `QUICK_START.md` (5 min)
- [ ] Read: `CURRENT_ARCHITECTURE.md` section 1-2 (10 min)
- [ ] Read: `DEVELOPMENT_RULES.md` "Hard Constraints" (10 min)
- [ ] Understand: "Ring is calculated, not user-input"

### Day 2: Prepare to Code

- [ ] Read: `DEVELOPMENT_RULES.md` "What You CAN Do" (10 min)
- [ ] Read: `ACTIVE_TASKS.md` (10 min)
- [ ] Pick your task (4, 6, 7, 8, or 9)
- [ ] Read the relevant domain section in `AUTO_CREATE_DESIGN.md`

### Day 3: Implement

- [ ] Follow patterns from `DEVELOPMENT_RULES.md`
- [ ] Reference design docs while coding
- [ ] Use code review checklist before submitting

---

## ❓ Quick Answers

**Q: Are there old docs conflicting with new rules?**  
A: Yes, they're in `_ARCHIVE_PHASE_*/`. Use `_AUTHORITATIVE/` as truth.

**Q: What's the most important rule?**  
A: "Ring = parent.ring + 1". Never let users choose ring level.

**Q: How long to implement all tasks?**  
A: 8-9 hours total (can parallelize tasks 6-9 after 4-5 done).

**Q: Where's the code I need to modify?**  
A: Mostly in `client/src/App.tsx` and components. Design docs point to specific files.

**Q: How do I know if my code is right?**  
A: Check off every item in `DEVELOPMENT_RULES.md` "Code Review Checklist".

---

## � Ready to Start?

1. **Not new?** → Go to `_AUTHORITATIVE/ACTIVE_TASKS.md`
2. **New?** → Go to `_AUTHORITATIVE/QUICK_START.md`
3. **Need patterns?** → Go to `_AUTHORITATIVE/DEVELOPMENT_RULES.md`

---

**Last Updated**: This session  
**Authority**: Everything in `_AUTHORITATIVE/` is locked-in law. Use as truth.  
**Questions?** Check the docs above—they have answers.
