# 🔒 AUTHORITATIVE Documentation

**This folder contains the locked-in, immutable rules and specifications for Strukt.**

Everything here is the **single source of truth**. Use these as your authority when developing.

---

## 📚 Documents in Order

### 1. **QUICK_START.md** (New Developers - Start Here)

- 30-second overview
- Key constraints you can't break
- Ring hierarchy visual
- Common task example
- Learning path (Day 1-3)
- FAQ

**Read First**: 5 minutes

---

### 2. **CURRENT_ARCHITECTURE.md** (Locked Rules)

- Ring hierarchy (R0 → R1 → R2 → R3 → ...)
- Classification system (10 immutable Ring 1 nodes)
- Node placement rules
- Domain sectors & angles
- 6 hard constraints
- What you CAN do
- What you CANNOT do
- Verified examples
- Verification checklist

**Read Before Coding**: 15 minutes

---

### 3. **DEVELOPMENT_RULES.md** (How to Code)

- Core principle: ASSOCIATION-DRIVEN, not position-driven
- 6 hard constraints with code examples
- Code patterns to follow
- What you CAN do
- What you CANNOT do
- Common mistakes (wrong/right code)
- Code review checklist (7 items)
- Verification tests (5 scenarios)

**Read While Coding**: Reference as needed

---

### 4. **ACTIVE_TASKS.md** (Current Work)

- Tasks 4-10 status
- Each task has:
  - Requirements
  - Getting started
  - Test scenarios
  - Success criteria
  - Effort estimate
- Reference to other docs
- Progress tracking
- Dependency graph

**Reference During Implementation**

---

## 🎯 How to Use This Folder

### I'm new to the project

1. Read: `QUICK_START.md` (5 min)
2. Read: `CURRENT_ARCHITECTURE.md` section 1 (10 min)
3. Read: `DEVELOPMENT_RULES.md` (15 min)

**Result**: You understand the 3 core rules and can code

### I'm implementing a feature

1. Read: `ACTIVE_TASKS.md` (your task section)
2. Reference: `DEVELOPMENT_RULES.md` (code patterns)
3. Reference: `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md` (domain details)
4. Use: Code review checklist before submitting

**Result**: Your code follows all constraints

### I'm reviewing code

1. Open: `DEVELOPMENT_RULES.md`
2. Check: Every item in "Code Review Checklist"
3. Check: Verified examples match the new code

**Result**: Code follows the rules

---

## 🔐 What's Protected Here

**IMMUTABLE** (never changes):

- Ring hierarchy (R0 → R1 → R2 → R3 → ...)
- Classification system (10 Ring 1 nodes, locked forever)
- Core principles (association-driven, not position-driven)
- 6 hard constraints
- Node placement rules

**EXPANDABLE** (can grow):

- R2 nodes for new domains
- R3 implementation nodes
- R4+ feature nodes
- New edge relationship types (as long as no cycles)

**FORBIDDEN** (never implement):

- User chooses ring level
- Drag source as connection parent
- Mouse position for node placement
- Cycles in the graph
- Changes to Ring 1 classifications

---

## ✅ Before You Code

Check list:

- [ ] Read `QUICK_START.md`
- [ ] Understand 3 core rules (ring, parent, position)
- [ ] Read your task in `ACTIVE_TASKS.md`
- [ ] Have `DEVELOPMENT_RULES.md` open
- [ ] Have `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md` open (for reference)
- [ ] Ready to implement

---

## 🚀 Quick Links

- **New?** → `QUICK_START.md`
- **Need rules?** → `CURRENT_ARCHITECTURE.md`
- **Need patterns?** → `DEVELOPMENT_RULES.md`
- **Need task details?** → `ACTIVE_TASKS.md`
- **Need design details?** → `../_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md`

---

## 📞 Questions?

**"Can I..."** questions:
→ Check `CURRENT_ARCHITECTURE.md` "What You CAN/CANNOT Do"

**"How do I..."** questions:
→ Check `DEVELOPMENT_RULES.md` with code examples

**"What am I working on?"** questions:
→ Check `ACTIVE_TASKS.md`

**"I'm stuck"** questions:
→ Check the code review checklist in `DEVELOPMENT_RULES.md`

---

## 🎓 Authority Hierarchy

**This is the authority hierarchy** (top = highest authority):

1. **CURRENT_ARCHITECTURE.md** → Locked structural rules
2. **DEVELOPMENT_RULES.md** → How to implement
3. **ACTIVE_TASKS.md** → What to build next
4. **../\_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md** → Detailed design reference
5. **../_ARCHIVE_\*/** → Old docs (reference only, may be outdated)

If there's a conflict:

- Check `CURRENT_ARCHITECTURE.md` first (it's the law)
- If not there, check `DEVELOPMENT_RULES.md`
- If not there, check `ACTIVE_TASKS.md`
- If still not there, ask in code review

---

**Last Updated**: This session  
**Status**: Authority for all development  
**Changes**: Locked (update only on explicit decision)
