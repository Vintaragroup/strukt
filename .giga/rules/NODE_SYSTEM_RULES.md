# NODE SYSTEM RULES - Giga AI Reference

> **CRITICAL**: This file must be referenced on EVERY node system code change.
> File location: `.giga/rules/NODE_SYSTEM_RULES.md`

## Automatic Triggers

The following code changes MUST trigger a full NODE_RULES_MASTER_DOCUMENT.md review:

### File Changes That Require Validation
```
✅ ALWAYS VALIDATE when modifying:
- client/src/config/foundationEdges.ts
- client/src/config/classifications.ts
- client/src/utils/ringHierarchyValidator.ts
- client/src/utils/migrations/classificationMigrate.ts
- client/src/utils/graphOps.ts
- client/src/App.tsx (lines 1340-1430)
- server/src/services/GenerationService.ts (node creation)
```

### Change Patterns That Require Validation
```
✅ ALWAYS VALIDATE when:
- Creating new nodes (new `const node = { ... }`)
- Modifying ring property (ring: X)
- Changing parent assignment (parentId: X)
- Adding to ASSOCIATION_RULES
- Modifying classification logic
- Changing node type handling
- Updating validation functions
- Modifying migration logic
- Changing edge creation logic
```

## The Three Questions

**Before I implement ANY node system change, I MUST answer these three questions:**

### Question 1: Which Rule Does This Touch?
```
Does this change affect:
☐ Rule 1: Ring hierarchy (ring = parent.ring + 1)?
☐ Rule 2: Classification nodes (R1 only)?
☐ Rule 3: Feature nodes (R2+ only)?
☐ Rule 4: Domain parents (ring = 2)?
☐ Rule 5: Edge relationships (no forbidden connections)?

If YES to any, STOP and reference NODE_RULES_MASTER_DOCUMENT.md
```

### Question 2: Which Validation Must Pass?
```
Does this change require:
☐ Validation Check 1: Ring Hierarchy Validation?
☐ Validation Check 2: Association Rules?
☐ Validation Check 3: Classification Backbone?
☐ Validation Check 4: Migration Validators?

If YES to any, INCLUDE validation details in response
```

### Question 3: Which Process Should I Follow?
```
Does this follow:
☐ Process 1: Node Creation?
☐ Process 2: Node Update/Modification?
☐ Process 3: Code Review Checklist?
☐ Process 4: Testing After Changes?

If YES to any, REFERENCE the process step-by-step
```

## My Mandatory Workflow

**EVERY time you ask me to change node system code, I MUST:**

1. **Identify the Scope**
   - File being changed
   - Exact lines affected
   - Type of change (new rule, bug fix, feature, refactor)

2. **Reference NODE_RULES_MASTER_DOCUMENT.md**
   - Quote the relevant rule section
   - Explain why it applies
   - Show which validation checks matter

3. **Answer The Three Questions**
   - Question 1: Which rules touched?
   - Question 2: Which validations required?
   - Question 3: Which process applies?

4. **Provide Code with Commentary**
   - Show the change with 5-line context
   - Include inline comments referencing rules
   - Explain why each line follows the rules

5. **Validate Against Checklist**
   - Use Copilot Validation Checklist from NODE_RULES_MASTER_DOCUMENT.md
   - Mark each item as ✅ or ❌
   - Explain any ❌ items

6. **End with Verification Steps**
   - Show exactly how to test the change
   - Include console commands
   - Specify expected output

## Format for Every Response

**When responding to node system code changes, I will use this format:**

```
## 📋 Change Request Analysis

### Scope
- **File**: [exact path]
- **Lines**: [line numbers affected]
- **Type**: [new rule / bug fix / feature / refactor]

### Rule Reference
From NODE_RULES_MASTER_DOCUMENT.md:
- **Rule X**: [Quote the relevant rule]
- **Why it matters**: [Explanation]

### Three Questions Answered
1. **Which rules touched?** [List with specific impacts]
2. **Which validations required?** [List with check details]
3. **Which process applies?** [Step-by-step reference]

### The Change
[Code with 5-line context and inline comments]

### Validation Checklist
- [ ] Ring hierarchy validated
- [ ] Classifications R1 only
- [ ] Features R2+ only
- [ ] Domain parents ring=2
- [ ] Edge rules followed
- [ ] Association rules checked
- [ ] validateRingHierarchy() passes
- [ ] No orphan nodes
- [ ] No ring reversions
- [ ] Testing verified

### Testing Steps
1. [Specific test command]
2. [Expected output]
3. [Verification]

✅ Ready to implement / ❌ Issues found: [list]
```

## What I Will Say

**When validating node system changes, I will use these exact phrases to show I'm following the rules:**

```
✅ "Confirmed per NODE_RULES_MASTER_DOCUMENT.md"
✅ "This follows Process X from NODE_RULES_MASTER_DOCUMENT.md"
✅ "Validated against Rule Y: [quote]"
✅ "Validation Check Z confirms [what]"
✅ "Best Practice [N]: [explanation]"
✅ "Avoiding Common Mistake [N]: [why]"
✅ "Checklist item [N/20] verified: ✅"
```

**When I find issues, I will say:**

```
❌ "This violates Rule X: [quote from document]"
❌ "Validation Check Y would fail because [reason]"
❌ "This matches Common Mistake Z: [from document]"
❌ "Process step [N] requires [what should happen]"
```

## Critical Reminders for Every Interaction

1. **ALWAYS cite the document**
   - Don't just say "this is correct"
   - Say: "This is correct per NODE_RULES_MASTER_DOCUMENT.md Rule 1"

2. **NEVER skip validations**
   - Don't implement without checking all 4 validation checks
   - Don't change code without answering the Three Questions

3. **ALWAYS use the standard format**
   - Every response follows the format above
   - Makes it easy to verify I checked everything

4. **NEVER assume**
   - Ask clarifying questions if unclear
   - Reference the exact section that answers the question

5. **ALWAYS test conceptually**
   - Show what validateRingHierarchy() would check
   - Show what the console would log
   - Show what the visual layout should look like

## Red Flags (Stop and Ask)

**If you ask me to do any of these, I will STOP and explain why it violates NODE_RULES_MASTER_DOCUMENT.md:**

```
🚩 "Create a feature node on R1"
   → Violates Rule 3: Features NEVER on R1

🚩 "Default new nodes to center parent"
   → Violates Process 1, Step 2: Use classification parent

🚩 "Hard-code ring values"
   → Violates Best Practice 1: Calculate ring dynamically

🚩 "Skip R2 intermediates"
   → Violates Rule 5: No R1→R3 edges

🚩 "Modify foundationEdges.ts without setting ring: 2"
   → Violates Rule 4: Domain parents MUST be ring 2

🚩 "Remove validateRingHierarchy() calls"
   → Violates Validation Check 1: Always validate

🚩 "Change node creation without getClassificationParentId()"
   → Violates Process 1, Step 3: Resolve classification parent
```

## How You Trigger Validation

**You can explicitly request validation with:**

```
"@copilot Review this against NODE_RULES_MASTER_DOCUMENT.md"
"@copilot Validate this follows the rules"
"@copilot Check for violations"
"@copilot Use the Three Questions"
"@copilot Give me the full validation checklist"
```

**Or implicitly trigger it by asking about:**

```
- Creating nodes
- Fixing misclassified nodes
- Modifying foundationEdges.ts
- Changing ring calculations
- Updating parent assignment
- Adding association rules
- Fixing hierarchy issues
```

## Reference Structure

To make it easy to find the right section, NODE_RULES_MASTER_DOCUMENT.md is organized as:

```
📄 NODE_RULES_MASTER_DOCUMENT.md (main file)
├── 🎯 Core Rules (5 rules with constraints)
├── ✅ Validation Rules (4 validation checks)
├── 🔄 Required Processes (4 processes)
├── 🛡️ Safeguards & Auto-Fixes (3 auto-fixes)
├── 📚 Key Files & Their Purposes (table)
├── 🔴 Common Mistakes (5 mistakes with fixes)
├── ✨ Best Practices (5 practices)
├── 🧪 Validation Commands (how to test)
├── 🤖 GitHub Copilot Checkpoint Integration
│   ├── How to Use This Document as a Copilot Guardrail
│   ├── Copilot Validation Checklist (20+ items)
│   ├── Copilot Prompts for Specific Scenarios (4 scenarios)
│   ├── Pre-Commit Hook for Copilot
│   ├── Quick Reference for Copilot Prompts (7 scenarios)
│   ├── Node System Change Review Template
│   ├── Emergency Node System Rollback
│   └── Training New Developers
└── 🎓 Training & Onboarding
```

When you ask me something, I reference the exact section:
- "Per Rule 3 in Core Rules section..."
- "Using Process 2: Node Update/Modification..."
- "Validation Check 1: Ring Hierarchy Validation confirms..."
- "This is Best Practice 2 from the Best Practices section..."

## Testing the Integration

**To verify I'm following this, you can ask:**

```
@copilot Before making any changes to [file], show me:
1. Which rule(s) this touches
2. Which validation checks must pass
3. The Three Questions answered
4. The full validation checklist
5. Testing steps

Don't implement yet, just show the analysis.
```

This ensures I'm following the workflow before writing any code.

---

**This file is the META-RULE that ensures NODE_RULES_MASTER_DOCUMENT.md is always referenced.**
**Pin it, bookmark it, and know that I check this on every node system request.**
