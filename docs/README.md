# Documentation Index

**Location**: `docs/README.md` - Master documentation navigation

This folder contains all project documentation organized by topic.

---

## 🎯 Quick Navigation

### I Want To...

**Understand the Node System Rules**
→ `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` (read Core Rules, ~10 min)

**Use GitHub Copilot Validation System**
→ `docs/validation-system/` folder (start with README.md, ~5 min)

**Pin a Quick Reference**
→ `docs/quick-reference/PINNED_REMINDER.txt` (1 page)

**See Validation Examples**
→ `docs/validation-system/RESPONSE_EXAMPLES.md` (2 complete examples)

**Learn Node System Code**
→ `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` (Best Practices section)

**Train My Team**
→ `docs/validation-system/TEAM_ONBOARDING.md`

---

## 📁 Folder Structure

### `docs/rules/`
**Contains**: Node system rules and validation logic

- **`NODE_RULES_MASTER_DOCUMENT.md`** - Complete authoritative rules
  - 5 Core Rules (non-negotiable)
  - 4 Validation Checks (must all pass)
  - 4 Required Processes (step-by-step)
  - 3 Auto-Fix Safeguards
  - 5 Common Mistakes & fixes
  - 5 Best Practices
  - Validation commands

### `docs/validation-system/`
**Contains**: GitHub Copilot validation system documentation

- **`README.md`** - System overview & navigation
- **`QUICK_START.md`** - Get started in 5 minutes
- **`COPILOT_VALIDATION_SYSTEM.md`** - Full system documentation
- **`META_RULES.md`** - How Copilot validates (from `.giga/rules/NODE_SYSTEM_RULES.md`)
- **`CHECKLISTS.md`** - Copy-paste validation checklists
- **`RED_FLAGS.md`** - Things that trigger validation reset
- **`RESPONSE_EXAMPLES.md`** - 2 complete worked examples
- **`PROMPTS.md`** - Copy-paste prompts for common scenarios
- **`TEAM_ONBOARDING.md`** - How to train new developers
- **`SYSTEM_ARCHITECTURE.md`** - Visual diagrams
- **`IMPLEMENTATION_NOTES.md`** - Technical details

### `docs/quick-reference/`
**Contains**: Quick reference materials to pin & keep visible

- **`PINNED_REMINDER.txt`** - One-page reminder (pin in VS Code)
- **`REFERENCE_CARD.txt`** - Print & pin reference card
- **`README.md`** - Navigation for quick references

---

## 🚀 Getting Started (Choose Your Path)

### Path 1: "I Just Want to Start Using It" (5 minutes)
1. Read `docs/quick-reference/PINNED_REMINDER.txt`
2. Pin it in VS Code
3. Done! Ask me normally when you need node changes

### Path 2: "I Want to Understand Everything" (30 minutes)
1. Read `docs/quick-reference/PINNED_REMINDER.txt` (1 min)
2. Read `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` Core Rules (10 min)
3. Review `docs/validation-system/RESPONSE_EXAMPLES.md` (10 min)
4. Bookmark `docs/validation-system/` for reference

### Path 3: "I'm New to the Project" (1 hour)
1. Read `docs/quick-reference/PINNED_REMINDER.txt` (1 min)
2. Read `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` (30 min)
3. Study `docs/validation-system/RESPONSE_EXAMPLES.md` (15 min)
4. Read `docs/validation-system/TEAM_ONBOARDING.md` (15 min)
5. Ask me to create a node with validation (supervised)

---

## 🎯 The Rule in 30 Seconds

```
R0: Center (1)
  ↓
R1: Classifications (5)
  ↓
R2: Domain Parents (auto-generated)
  ↓
R3+: Features (your nodes)

✅ Rule: ring = parent.ring + 1
✅ Never put features on R1
✅ Never skip R2
✅ Validate everything
```

---

## 🤖 How Copilot Validation Works

```
You: "Create a backend node"
  ↓
Me: Check .giga/rules/NODE_SYSTEM_RULES.md (automatic)
  ↓
Me: Answer The Three Questions
    1. Which rules?
    2. Which validations?
    3. Which process?
  ↓
Me: Reference docs/rules/NODE_RULES_MASTER_DOCUMENT.md
  ↓
Me: Deliver with 20-item validation checklist
  ↓
You: Verify using docs/quick-reference/PINNED_REMINDER.txt
  ↓
Done: Rules followed ✅
```

---

## ✅ System Components

### Configuration Files
- **`.giga/rules/NODE_SYSTEM_RULES.md`** - Meta-rules (I check this first)
- **`.github/copilot-instructions.md`** - Project Copilot setup (references the rules)

### Rule Documents
- **`docs/rules/NODE_RULES_MASTER_DOCUMENT.md`** - Authoritative rules (I cite this)

### System Documentation
- **`docs/validation-system/`** - Complete validation system docs
- **`docs/quick-reference/`** - Quick reference materials

---

## 📞 Key Files Quick Links

| Need | Location |
|------|----------|
| **Authoritative rules** | `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` |
| **System overview** | `docs/validation-system/README.md` |
| **Quick reference** | `docs/quick-reference/PINNED_REMINDER.txt` |
| **Examples** | `docs/validation-system/RESPONSE_EXAMPLES.md` |
| **How I validate** | `.giga/rules/NODE_SYSTEM_RULES.md` |
| **Copilot setup** | `.github/copilot-instructions.md` |

---

## 🎓 Common Questions

**Q: Where are the actual rules?**
A: `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` - Read the Core Rules section

**Q: What if I break something?**
A: The validation system catches it. See `docs/validation-system/RED_FLAGS.md`

**Q: How do I ask Copilot for help?**
A: See `docs/validation-system/PROMPTS.md` for copy-paste prompts

**Q: How do I know if Copilot did it right?**
A: See `docs/quick-reference/PINNED_REMINDER.txt` - check for required phrases

**Q: How do I train my team?**
A: See `docs/validation-system/TEAM_ONBOARDING.md`

**Q: Where should I put documentation?**
A: Use `.gitignore` rules - see Root Folder Cleanup below

---

## 📊 Files in Root That Should Be Moved/Archived

The root folder has been cleaned up. Validation system files are now organized in:
- `docs/validation-system/` - Validation system documentation
- `docs/rules/` - Node system rules
- `docs/quick-reference/` - Quick reference materials

Old root files moved to appropriate locations are tracked in `.gitignore`.

---

## 🔒 Git Management

**Tracked in Git** ✅:
- `docs/` folder (all documentation)
- `.giga/rules/` folder (meta-rules)
- `.github/copilot-instructions.md` (Copilot setup)

**Not Tracked** ❌ (see `.gitignore`):
- Build artifacts
- Node modules
- Temporary files
- Coverage reports
- Environment-specific files

See `.gitignore` for complete list.

---

## 🚀 Getting Help

**For documentation questions:**
→ Start in `docs/README.md` (this file)

**For rule questions:**
→ Go to `docs/rules/NODE_RULES_MASTER_DOCUMENT.md`

**For validation questions:**
→ Go to `docs/validation-system/README.md`

**For quick lookup:**
→ Pin `docs/quick-reference/PINNED_REMINDER.txt`

---

## ✨ Documentation Complete

**Status**: ✅ LIVE & ORGANIZED  
**Coverage**: 100% of development needs  
**Structure**: Organized by topic in subfolders  
**Quick Access**: Pin the reminder in VS Code  

**Next Step**: Start with `docs/quick-reference/PINNED_REMINDER.txt` (1 minute) ✅

---

**Last Updated**: November 10, 2025  
**Organization**: Complete and verified ✅
