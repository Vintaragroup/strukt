# The Root Cause: Collision Resolution Breaking Radial Layout

## The Problem in 3 Steps

### Step 1: Layout is Correct ✅
```
applyDomainRadialLayout() positions nodes:
- R0 center at (0, 0)
- R1 nodes at ~560px radius (domain-wedge layout)
- R2 nodes at ~1080px radius
```

### Step 2: Collision Resolution Moves Everything ❌
```
applyLayoutAndRelax() → resolveCollisions():
- Checks for AABB overlaps between node bounding boxes
- Pushes overlapping nodes AWAY from their current position
- Runs for up to 15 passes
- Doesn't care about ring hierarchy!
```

### Step 3: Result is Garbage ❌
```
Nodes end up scattered at random distances:
- R1 nodes move from 560px to 558-676px
- R2 nodes move unpredictably
- Ring hierarchy is destroyed
- But tests pass because tests don't use applyLayoutAndRelax!
```

---

## Why Tests Pass But Layout Breaks

**Test (`canvasLayoutVisualization.spec.ts`)**:
```typescript
const layoutedNodes = generateRadialLayout(allNodes)  // ✅ Works perfectly
// Tests verify ring distances - all pass
```

**App (`App.tsx`)**:
```typescript
const layoutedNodes = applyDomainRadialLayout(nodes, ...)  // ✅ Initially correct
applyLayoutAndRelax(layoutedNodes, ...)  // ❌ MOVES ALL NODES - Breaks layout!
setNodes(info.nodes)  // ❌ Uses collision-resolved positions
```

**The validation rules check the input** but not what `resolveCollisions` does to them.

---

## Root Cause: Line 2116-2140 in App.tsx

```typescript
// BEFORE: Layout is perfect, ring hierarchy intact
const baseNodes = applyDomainRadialLayout(nodes, config)

applyLayoutAndRelax = useCallback(async (baseNodes) => {
  setNodes(baseNodes)  // ✅ Perfect positions
  
  // This runs collision resolution:
  const info = resolveCollisions(fresh as any, {  // ❌ MOVES NODES
    padding,
    maxPasses: 15,  // ❌ 15 passes of pushing nodes around!
    measure: nodeDimensionsRef.current,
    fixedIds: fixedSet  // Only center + pinned are protected
  })
  
  let nextNodes = info.nodes  // ❌ Collision-resolved = scattered
  setNodes(nextNodes)  // ❌ Displays broken layout
})
```

**The collision resolver doesn't know about ring hierarchy** - it just sees overlapping rectangles and moves them.

---

## The Solution: Protect Radial Layout from Collision Resolution

### Option 1: Lock Ring Values During Collision Resolution ✅ RECOMMENDED

Modify `resolveCollisions` to understand and respect ring hierarchy:

```typescript
// In collision.ts resolveCollisions():
export function resolveCollisions(
  nodes: RFNode[],
  opts?: {
    padding?: number;
    maxPasses?: number;
    measure?: Record<string, { width: number; height: number }>;
    fixedIds?: string[];
    preserveRingHierarchy?: boolean;  // ← ADD THIS
  }
) {
  const preserveRings = opts?.preserveRingHierarchy ?? true;
  
  if (preserveRings) {
    // Group nodes by ring level
    const nodesByRing = new Map<number, RFNode[]>();
    for (const node of nodes) {
      const ring = node.data?.ring ?? 0;
      if (!nodesByRing.has(ring)) {
        nodesByRing.set(ring, []);
      }
      nodesByRing.get(ring)!.push(node);
    }
    
    // Solve collisions WITHIN each ring, not between rings
    for (const [ring, ringNodes] of nodesByRing.entries()) {
      if (ring === 0) continue;  // Center is already fixed
      
      // Add ring nodes to fixedIds so they don't move far
      // OR solve their positions locally within the ring
    }
  }
  
  // ... rest of collision resolution
}
```

### Option 2: Skip Collision Resolution in Radial Mode ⚡ FASTER

```typescript
// In App.tsx, line 3059:
if (viewMode === 'radial') {
  // Radial layout already positions nodes perfectly in rings
  // Don't run collision resolution - it breaks ring hierarchy
  setNodes(layoutedNodes);
} else {
  // Other modes can use collision resolution
  applyLayoutAndRelax(layoutedNodes, { ... });
}
```

### Option 3: Add Nodes to fixedIds to Prevent Movement

```typescript
// In App.tsx, before calling applyLayoutAndRelax:
const centerId = centerNodeIdRef.current || 'center';

// In radial mode, protect all nodes by ring to prevent collision resolution from scattering them
const ringProtectedIds = viewMode === 'radial' 
  ? [
      centerId,
      ...nodes
        .filter(n => n.data?.ring === 1)
        .map(n => n.id),  // Protect all R1 nodes
      ...nodes
        .filter(n => n.data?.ring === 2)
        .map(n => n.id),  // Protect all R2 nodes
    ]
  : [centerId];

await applyLayoutAndRelax(layoutedNodes, {
  fixedIds: ringProtectedIds,  // ← Prevents collision resolution from moving them
  ...
});
```

---

## Why This Happens

### Validation Checks (but doesn't enforce during layout):
```
- ringHierarchyValidator.ts: Checks rules exist ✓
- foundationEdges.ts: Checks edges are valid ✓
- graphOps.ts: Checks ring values during creation ✓
- BUT: None of these prevent collision resolution!
```

### What Gets Checked vs What Doesn't:
```
✓ Node creation: ring values validated
✓ Edge formation: hierarchy checked  
✓ Tests: generateRadialLayout works perfectly
❌ Layout execution: collision resolution moves nodes anyway
❌ Ring preservation: no code protects rings during relaxation
❌ Runtime: no assertions that positions respect hierarchy
```

---

## The Disconnect

```
Graph:
  validation rules ──→ ✓ pass
  node creation ─────→ ✓ correct rings
  applyDomainRadialLayout ─→ ✓ perfect positions
  applyLayoutAndRelax ──────→ ❌ resolveCollisions moves them
  final display ────────────→ ❌ shows scattered nodes

                            GAP: No enforcement between
                            layout and display!
```

---

## Recommended Fix Path

### Priority 1: Skip Collision Resolution in Radial Mode (FAST)
**File**: `App.tsx`  
**Lines**: 3040-3070 (and all other layout calls)  
**Change**:
```typescript
// Instead of always running applyLayoutAndRelax:
if (viewMode === 'radial') {
  setNodes(layoutedNodes);  // ← Skip collision resolution for radial
} else {
  await applyLayoutAndRelax(layoutedNodes, { ... });
}
```

### Priority 2: Add Ring Preservation to resolveCollisions
**File**: `collision.ts`  
**Lines**: 70+  
**Change**: Add `preserveRingHierarchy` parameter that keeps nodes in their ring

### Priority 3: Add Assertions After Layout
**File**: `App.tsx`  
**After setNodes**:
```typescript
// Validate that ring hierarchy is preserved
const sorted = nextNodes.sort((a, b) => {
  const ringA = a.data?.ring ?? 0;
  const ringB = b.data?.ring ?? 0;
  return ringA - ringB;
});

for (const node of sorted) {
  const ring = node.data?.ring ?? 0;
  if (ring === 0) continue;
  
  const expectedRadius = 180 + (ring - 1) * 180;
  const actualRadius = Math.hypot(node.position.x, node.position.y);
  
  if (Math.abs(actualRadius - expectedRadius) > 100) {
    console.warn(`[RING VIOLATION] ${node.id}: ring=${ring}, expected radius=${expectedRadius}, actual=${actualRadius}`);
  }
}
```

---

## Summary

| Step | Status | Problem |
|------|--------|---------|
| Create nodes | ✅ OK | Ring values set correctly |
| Validate rules | ✅ OK | All rules pass |
| Initial layout | ✅ OK | Positions are perfect |
| **Collision resolution** | ❌ **BREAKS** | **Moves all nodes unpredictably** |
| Final display | ❌ BROKEN | Nodes at wrong radii |

**Root Cause**: `resolveCollisions` doesn't understand ring hierarchy and moves nodes to "fix" overlaps, destroying the carefully-positioned radial layout.

**Root Fix**: Either skip collision resolution in radial mode, or make it preserve ring hierarchy.

**Current Tests Pass**: Because tests use `generateRadialLayout` directly, which never calls `resolveCollisions`.

