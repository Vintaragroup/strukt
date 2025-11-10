# Ring Hierarchy Enforcement - Architecture Rules

## Overview
The Strukt system enforces strict ring hierarchy rules to maintain proper architectural organization. These rules prevent nodes from being placed at incorrect hierarchy levels.

## Ring Hierarchy Rules

### Ring Levels
```
R0: Center (Project root)
  └─ R1: Classification Pillars (5 nodes - business/product/tech/ops domains)
      └─ R2: Classification Domains (5 nodes - supporting areas)
          └─ R3: Templates (55+ foundation templates)
              └─ R4: Specializations (15+ specialized nodes)
```

### Connection Constraints

**Critical Rules:**
1. **Ring 1 nodes MUST connect ONLY to Center (R0)**
   - Example: "Business Model" → Center
   - Cannot connect to other R1 nodes
   - Cannot connect to R2+ nodes

2. **Ring 2+ nodes MUST connect to their Classification Parent (one ring lower)**
   - Ring 2 nodes MUST connect to R1 classification (not center)
   - Ring 3 nodes MUST connect to R2 classification
   - Ring 4+ nodes MUST connect to R3 template
   - Enforced via `getClassificationParentId()` lookup

3. **User Drag Operations Don't Override Hierarchy**
   - Users can drag nodes for visual positioning
   - But the connection parent is determined by ring and domain classification
   - Drag source is ignored if it violates hierarchy

4. **Maximum Direct Children**
   - Center has exactly 5 direct children (R1 classifications)
   - Each R1 classification has exactly 5 children (R2 classifications)
   - R2+ classifications can have unlimited children within their domain

## Implementation

### Code Location
`client/src/App.tsx` - `handleAddNode()` function (lines 4420-4455)

### Logic Flow
```typescript
if (enforcedRing === 1) {
  // Ring 1 nodes always connect to center
  connectionSourceId = centerId;
} else if (enforcedRing >= 2) {
  // Ring 2+ nodes connect to classification parent
  connectionSourceId = classificationParentId;
  
  // Warn if no parent found (error case)
  if (!connectionSourceId) {
    console.warn(`Ring ${enforcedRing} node has no classification parent`);
  }
}
```

### Classification Parent Resolution
The `getClassificationParentId()` function determines the correct parent:
1. Looks up the node's domain
2. Finds the matching R1 or R2 classification
3. Returns that classification's node ID

Example:
- Node with domain: "backend" → Parent: "classification-app-backend" (R1)
- Node with domain: "backend", deeper classification → Parent: "classification-infrastructure" (R2)

## Valid vs Invalid Connections

### ✅ VALID Examples
```
Center (R0)
  ├─ Business Model (R1) ← correct
  │   └─ Business Strategy (R2) ← correct child of Business Model
  │
  ├─ Application Backend (R1) ← correct
  │   ├─ API Gateway (R2) ← correct child
  │   └─ Data Pipeline (R3) ← correct grandchild
  │       └─ ML Model (R4) ← correct great-grandchild
```

### ❌ INVALID Examples (now prevented)
```
WRONG: Center has 8 R1 children
  └─ Should only have 5 (the classifications)

WRONG: R2 node directly off Center
  └─ Should connect to R1 classification instead

WRONG: Backend node connects to Business Model
  └─ Wrong domain classification parent

WRONG: User drags R2 node from R1, connecting to different R1
  └─ Classification parent is overridden by user drag
  └─ Now prevented - maintains domain hierarchy
```

## Benefits

1. **Prevents Visual Clutter**
   - Center stays uncluttered with exactly 5 pillars
   - Each pillar has predictable structure

2. **Maintains Semantic Meaning**
   - Ring reflects hierarchical depth
   - Domain matches business/product structure

3. **Enables Automatic Layout**
   - Radial layout algorithm knows expected structure
   - Collision detection works with predictable hierarchies

4. **Improves Filtering**
   - Ring-based filtering in node pickers works correctly
   - Can confidently show only valid options

5. **Supports Analytics**
   - Consistent structure enables metrics
   - Easier to query "all backend nodes" or "dependencies"

## Migration for Existing Workspaces

When a workspace loads with incorrect connections:
1. Classification migration detects wrong structure
2. Nodes are reassigned to correct classification parent
3. Edges are recreated to reflect proper hierarchy
4. Visual position is preserved, only parent connection updates

## Testing Connection Constraints

Try these actions and observe the behavior:

1. **Add R2 node to "Application Backend" classification**
   - ✅ Should connect to "Application Backend" (R1)
   - ❌ Should NOT connect to "Business Model" (different domain)
   - ❌ Should NOT connect to Center

2. **Add R3 template to existing R2 node**
   - ✅ Should connect to its domain's R1 classification
   - ❌ Drag source ignored if different classification

3. **Drag node around canvas**
   - ✅ Visual position updates (nodes move)
   - ✅ Parent connection unchanged (respects hierarchy)

## Debugging

When issues arise, check the browser console for:
```
[handleAddNode] Ring N node has no classification parent
```

This warning indicates:
- Node created with invalid ring value
- No matching classification found
- Fallback to center was applied (undesired)

**Solution**: Verify:
1. Node domain is in supported domains list
2. Classification definitions include that domain
3. Ring value is correct for that domain
