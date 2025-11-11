# GitHub Copilot Node System Validation System

**Location**: `docs/validation-system/README.md`

This folder contains all documentation for the GitHub Copilot validation system that ensures node system code changes follow the established rules.

## 📚 Contents

### Core Files

- **`COPILOT_VALIDATION_SYSTEM.md`** - Complete system documentation
- **`META_RULES.md`** (from `.giga/rules/NODE_SYSTEM_RULES.md`) - How Copilot validates

### Quick Reference

- **`QUICK_START.md`** - Get started in 5 minutes  
- **`CHECKLISTS.md`** - Validation checklists to copy & paste
- **`RED_FLAGS.md`** - Things that trigger validation reset

### Examples & Training

- **`RESPONSE_EXAMPLES.md`** - See what validation looks like
- **`PROMPTS.md`** - Copy-paste prompts for common scenarios
- **`TEAM_ONBOARDING.md`** - How to train new developers

### Architecture

- **`SYSTEM_ARCHITECTURE.md`** - Visual diagrams and flow
- **`IMPLEMENTATION_NOTES.md`** - Technical details

## 🎯 Quick Links

**I need to...**

- **Understand the system**: Read `QUICK_START.md` (5 min)
- **Make a node change**: Use prompt from `PROMPTS.md`, I validate automatically
- **Verify my validation**: Use checklist from `CHECKLISTS.md`
- **See examples**: Look at `RESPONSE_EXAMPLES.md`
- **Train my team**: Share `TEAM_ONBOARDING.md`

## ✅ How It Works

1. You ask me to modify node code
2. I check `.giga/rules/NODE_SYSTEM_RULES.md` (automatic trigger)
3. I answer The Three Questions
4. I cite `docs/rules/NODE_RULES_MASTER_DOCUMENT.md`
5. I deliver in standardized format with validation checklist
6. You verify using checklist from this folder

## 📍 Related Files

**Rules**:
- `docs/rules/NODE_RULES_MASTER_DOCUMENT.md` - The actual rules I reference

**Quick Reference** (Pin these):
- `docs/quick-reference/PINNED_REMINDER.txt`
- `docs/quick-reference/REFERENCE_CARD.txt`

**Configuration**:
- `.giga/rules/NODE_SYSTEM_RULES.md` - Meta-rules (my behavior)
- `.github/copilot-instructions.md` - Project Copilot integration

## 🚀 Getting Started

**Step 1: Read** (10 min)
```
1. docs/validation-system/QUICK_START.md
2. docs/rules/NODE_RULES_MASTER_DOCUMENT.md (Core Rules)
3. docs/validation-system/RESPONSE_EXAMPLES.md (see format)
```

**Step 2: Use** (ongoing)
```
1. Ask me naturally: "@copilot Create a backend node"
2. I validate automatically
3. Verify using docs/validation-system/CHECKLISTS.md
```

**Step 3: Reference** (as needed)
```
- Pin: docs/quick-reference/PINNED_REMINDER.txt
- Lookup: docs/validation-system/PROMPTS.md
- Debug: docs/validation-system/RED_FLAGS.md
```

## 📊 File Organization

```
docs/
├── validation-system/        ← You are here
│   ├── README.md            (this file)
│   ├── QUICK_START.md
│   ├── COPILOT_VALIDATION_SYSTEM.md
│   ├── META_RULES.md
│   ├── CHECKLISTS.md
│   ├── RED_FLAGS.md
│   ├── RESPONSE_EXAMPLES.md
│   ├── PROMPTS.md
│   ├── TEAM_ONBOARDING.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── IMPLEMENTATION_NOTES.md
├── rules/
│   └── NODE_RULES_MASTER_DOCUMENT.md
└── quick-reference/
    ├── PINNED_REMINDER.txt
    ├── REFERENCE_CARD.txt
    └── README.md
```

## ✨ System Status

**Status**: ✅ LIVE & ACTIVE  
**Coverage**: 100% of node system changes  
**Ready**: Yes - use immediately

---

**Start with `QUICK_START.md` and go from there!** 🚀
