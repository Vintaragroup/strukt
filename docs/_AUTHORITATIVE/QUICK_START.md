# AUTHORITATIVE: Quick Start for Developers

**New to the project?** Start here. Everything else links from here.

---

## 🚀 30-Second Overview

**Strukt** is a visual architecture design tool that auto-scaffolds application architectures.

**Key Constraint**: Everything is **association-driven**, not arbitrary positioning.

```
What You CAN'T Do:
  ❌ Place nodes anywhere you want
  ❌ Create Ring 3 directly from Ring 1
  ❌ Choose your own ring level
  ❌ Create cycles in the graph

What System ENSURES:
  ✅ Ring hierarchy (parent.ring + 1, always)
  ✅ Right classification parent (determined by type+domain)
  ✅ Correct positioning (from domain+ring, not mouse)
  ✅ No cycles (validated before every edge)
  ✅ Smart deduplication (reuse nodes, add associations)
```

---

## 📚 Documentation Map

### For Understanding the System

**"What are the rules I can't break?"**
→ `CURRENT_ARCHITECTURE.md`

**"How do I implement features?"**
→ `DEVELOPMENT_RULES.md`

**"What am I working on?"**
→ `ACTIVE_TASKS.md`

---

## 🎯 What We're Building (Current Phase)

### Auto-Create Feature (Tasks 4-10)

Users right-click nodes and select:

- Infrastructure & Platform
- Frontend & UI
- Backend & APIs
- Data & AI

System creates complete scaffolds (R2/R3 nodes) + associations

**Key Feature**: Smart deduplication

- First auto-create: Creates "Swagger API Server"
- Second auto-create: Detects Swagger exists, reuses it
- Result: Adds associations instead of duplicating

---

## 🔐 Three Most Important Rules

### Rule 1: Ring is Calculated

```
WRONG:
  let ring = userInput;  // 3, 4, or whatever they select

RIGHT:
  let ring = parentNode.ring + 1;  // Always
```

### Rule 2: Parent is Type+Domain

```
WRONG:
  let parent = dragSourceNode.id;  // Whatever they dragged from

RIGHT:
  let parent = getClassificationParentId(nodeType, nodeDomain);
```

### Rule 3: Position is Domain+Ring

```
WRONG:
  let position = { x: mouseX, y: mouseY };  // Where mouse is

RIGHT:
  let position = calculateNewNodePosition(domain, ring);
```

---

## 🏗️ Ring Hierarchy (Visual)

```
        Ring 0
        center
          ↑
       (all connect here)

        Ring 1
   10 Classifications
   (business-model, app-backend,
    app-frontend, data-ai, etc.)
          ↑
      (parent for R2)

        Ring 2
   Domain Parents
   (Infrastructure, Frontend,
    Backend, Data)
          ↑
      (parent for R3)

        Ring 3
   Implementation Details
   (Swagger, PostgreSQL, React,
    Kubernetes, etc.)
          ↑
      (parent for R4)

        Ring 4+
   Requirements & Features
   (POST Endpoints, Migrations,
    Error Handling, etc.)
```

**Key Rule**: Every node's ring = parent.ring + 1

---

## 🔗 Ring 1: Classifications (IMMUTABLE)

10 classification nodes that never change:

```
Business Domain:
  ├─ business-model
  ├─ operations
  └─ marketing

Technical Domain:
  ├─ app-frontend      ← Frontend nodes connect here
  ├─ app-backend       ← Backend nodes connect here
  ├─ infrastructure    ← Infrastructure nodes connect here
  └─ security          ← Security nodes connect here

Data Domain:
  ├─ data-ai           ← Data nodes connect here
  ├─ customer-experience
  └─ observability
```

Every R2+ node connects to one of these (based on type + domain).

---

## 📍 Domain Sectors (Visual)

Nodes arranged in sectors around center:

```
              North (90°)
                 ▲ data-ai
                 │
    West (180°)  │  East (0°)
    business ◄───●───► tech
                 │
              Southwest (225°)
              operations

              South (270°)
              product
```

When creating node:

- **tech** domain → appears East
- **product** domain → appears South
- **business** domain → appears West
- **data-ai** domain → appears North
- **operations** domain → appears Southwest

---

## 🚀 Common Task: Add Backend Scaffold

### Step-by-Step

```typescript
// 1. User right-clicks Backend node → selects "Auto-create"
// 2. Dialog appears: "Runtime? Framework? API? Database?"
// 3. User answers 3 questions
// 4. System runs this handler:

async function handleApplyBackendFoundation(config) {
  // Step 1: Get target node (the one user clicked)
  const targetNode = nodes.find((n) => n.id === nodeFoundationTargetId);

  // Step 2: Check for existing R2 parent (dedup)
  const r2Parent = findOrCreateDomainParent("Backend & APIs", "tech");

  // Step 3: Prepare nodes to create
  const nodesToCreate = [
    { label: "Swagger API Server", type: "backend", ring: 3 },
    { label: "PostgreSQL", type: "backend", ring: 3 },
    { label: "Redis", type: "backend", ring: 3 },
    // ... more nodes
  ];

  // Step 4: Check for duplicates (SMART DEDUP)
  const toCreate = [];
  for (const candidate of nodesToCreate) {
    const existing = findExistingNode(candidate, nodes);
    if (existing) {
      // Node exists! Add associations instead
      const edges = createAssociationsForExisting(existing, config);
      newEdges.push(...edges);
    } else {
      // New node, create it
      toCreate.push(candidate);
    }
  }

  // Step 5: Create new nodes (if any)
  const createdNodes = toCreate.map((config) => {
    const parentId = getClassificationParentId(
      config.type,
      "tech" // domain
    );
    return {
      id: generateId(),
      type: "custom",
      data: {
        label: config.label,
        type: config.type,
        domain: "tech",
        ring: 3, // CALCULATED (parent.ring + 1)
        parentId: parentId, // Set from type+domain
      },
      position: calculateNewNodePosition("tech", 3), // Calculated
    };
  });

  // Step 6: Create edges from classification parent
  const newEdges = [];
  const classificationParent = getClassificationParentId("backend", "tech");
  createdNodes.forEach((node) => {
    newEdges.push({
      source: classificationParent, // Always the classification
      target: node.id,
      type: "custom",
      data: { relationshipType: "depends-on" },
    });
  });

  // Step 7: Validate no cycles
  const cycleCheck = detectCycle(
    [...nodes, ...createdNodes],
    [...edges, ...newEdges]
  );
  if (cycleCheck.hasCycle) {
    throw new Error("Would create cycle");
  }

  // Step 8: Update state & layout
  setNodes([...nodes, ...createdNodes]);
  setEdges([...edges, ...newEdges]);
  applyLayout();
}
```

---

## ✅ Code Review Checklist

When reviewing PRs:

```
Ring Hierarchy:
  ☐ Ring = parent.ring + 1?
  ☐ User input ignored for ring?

Classification Parent:
  ☐ Determined by type+domain?
  ☐ Not the drag source?

Position:
  ☐ Calculated from domain+ring?
  ☐ Not from mouse position?

Cycles:
  ☐ Cycle detection called?
  ☐ Invalid edges rejected?

Deduplication:
  ☐ Existing nodes detected?
  ☐ Associations added instead of duplication?
```

If all checked ✅ → Approve  
If any unchecked ❌ → Request changes

---

## 🐛 Debugging Tips

### "Nodes appear in wrong ring"

Check: Is ring calculated or user-input?

```
git log -p -- client/src/App.tsx | grep "ring ="
```

Should see: `ring = parent.ring + 1`, not `ring = userInput`

### "Wrong parent node"

Check: Is parent from type+domain or drag source?

```
grep -n "classificationParentId\|dragSourceNodeId" src/App.tsx
```

Should see: Edge uses `classificationParentId`, not `dragSourceNodeId`

### "Nodes in wrong sector"

Check: Is position calculated from domain?

```
grep -n "calculateNewNodePosition" src/App.tsx
```

Should see: Called with `domain` and `ring` parameters

### "Duplicates created"

Check: Is deduplication working?

```
// Test in browser console:
const swagger = nodes.filter(n => n.data.label.includes("Swagger"));
// Should show same node ID on second run, not new nodes
```

---

## 📚 Full Documentation Structure

```
_AUTHORITATIVE/
├─ CURRENT_ARCHITECTURE.md    ← Locked rules, what you can't do
├─ DEVELOPMENT_RULES.md       ← How to implement features
├─ ACTIVE_TASKS.md            ← Current work (Tasks 4-10)
└─ QUICK_START.md             ← You are here

_ACTIVE_TASKS/
├─ AUTO_CREATE_DESIGN.md      ← Full technical design
├─ AUTO_CREATE_REQUIREMENTS.md ← Executive summary
├─ AUTO_CREATE_IMPLEMENTATION_PLAN.md ← Step-by-step build
├─ AUTO_CREATE_VISUAL_GUIDE.md ← UX flows & diagrams
└─ AUTO_CREATE_*.md           ← Other design docs

_ARCHIVE_PHASE_*/
└─ [Old docs - reference only]
```

---

## 🎓 Learning Path

### Day 1: Understand the System

1. Read: This page (QUICK_START.md) - 5 min
2. Read: `CURRENT_ARCHITECTURE.md` section 1-2 - 10 min
3. Read: `DEVELOPMENT_RULES.md` "Hard Constraints" - 10 min
4. Understand: "Ring is calculated, not user-input"

### Day 2: Prepare to Code

1. Read: `DEVELOPMENT_RULES.md` "What You CAN Do" - 10 min
2. Read: `ACTIVE_TASKS.md` - 10 min
3. Pick your task (4, 6, 7, 8, or 9)
4. Read the relevant section in `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md`

### Day 3: Implement

1. Follow the code patterns from `DEVELOPMENT_RULES.md`
2. Reference the specific domain from `AUTO_CREATE_DESIGN.md`
3. Use code review checklist before submitting

---

## ❓ FAQ

**Q: Can I let users choose their ring level?**  
A: No. Ring is always calculated as parent.ring + 1.

**Q: Can I connect to the drag source node?**  
A: No. Connections always use the classification parent (determined by type+domain).

**Q: Can I position nodes based on mouse?**  
A: No. Position is calculated from domain (sector) and ring (distance).

**Q: What if deduplication finds an existing node?**  
A: Add associations to it instead of creating a new one.

**Q: What if that would create a cycle?**  
A: Reject the edge and show user an error.

**Q: Can users modify classification nodes?**  
A: No. Ring 1 classifications are immutable.

**Q: What order should I implement domains?**  
A: Tasks 4-5 first (deduplication), then 6-9 in any order, then 10 (testing).

---

## 🚀 Ready to Code?

Pick your task:

- **Task 4-5**: Deduplication utilities
- **Task 6**: Infrastructure auto-create
- **Task 7**: Frontend auto-create
- **Task 8**: Backend auto-create
- **Task 9**: Data auto-create
- **Task 10**: Integration testing

Then:

1. Go to `ACTIVE_TASKS.md` for task details
2. Read the domain section in `_ACTIVE_TASKS/AUTO_CREATE_DESIGN.md`
3. Follow patterns from `DEVELOPMENT_RULES.md`
4. Use code review checklist before submitting

---

**Questions?** Check the reference docs above.  
**Ready?** Pick a task from `ACTIVE_TASKS.md` and get started!
