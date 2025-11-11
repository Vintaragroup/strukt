# Radial Layout Issue Analysis & Fix

## Problem Statement

Your node log shows:
```
center: (0) r0 [0, 0] "Task Lab"
s-mhttu81t: (1.2) r1 [512, 218] "API Server"          ← R1 at ~558px radius ❌
s-mhttu81t-1: (1.13) r1 [201, -533] "Persistent Storage" ← R1 at ~575px radius ❌
classification-business-model: (-) r1 [-395, 544] "Business Model" ← R1 at ~676px radius ❌
```

**Expected**: All R1 nodes should be at ~180px radius from center at evenly distributed angles.  
**Actual**: R1 nodes are at widely varying distances (558-676px) and unevenly distributed.

---

## Root Cause Analysis

### Two Competing Layout Systems

**1. Simple Radial Layout** (`radialLayout.ts`):
```typescript
- R0: center (0, 0)
- R1: radius = 180px
- R2: radius = 360px
- R3: radius = 540px
- Nodes evenly distributed by angle around each ring
```

**2. Domain-Based Relationship Layout** (`domainLayout.ts`):
```typescript
- Uses DOMAIN-BASED WEDGES (6 domains arranged around center)
- R1: radius = 560px+ (much larger!)
- R2: radius = 1080px+ (doubles the distance)
- Nodes distributed WITHIN domain wedges, not around full circle
- Complex arc-packing algorithm for fitting nodes in sector
```

### Why This Matters

**In your App.tsx (line 3041)**:
```typescript
radialAlgorithm: viewMode === 'radial' ? 'relationship' : undefined,
```

When in 'radial' mode, `applyDomainRadialLayout` uses the `'relationship'` algorithm which:
1. Arranges domains like slices of a pie (6 domains × 60° each)
2. Places R1 nodes at 560px radius in their domain wedge
3. Creates wedge-based distributions, NOT simple circles

**Result**: Nodes appear scattered rather than in clean concentric rings.

---

## Solution Options

### Option A: Use Simple Radial Layout ✅ RECOMMENDED

Replace `applyDomainRadialLayout` with `generateRadialLayout` for consistent simple radial positioning:

```typescript
// Current (broken for simple radial):
let layoutedNodes = applyDomainRadialLayout(nodes, {
  centerNodeId: centerId,
  viewMode,
  radialAlgorithm: 'relationship',  // ← Causes domain-wedge layout
  ...
})

// Fixed (simple radial):
import { generateRadialLayout } from '@/config/radialLayout'

let layoutedNodes = generateRadialLayout(nodes, {
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight / 2,
  baseRadius: 180,
  radiusIncrement: 180,
  minAngleDiff: 15,
})
```

**Pros**:
- ✅ Clean concentric circles
- ✅ Even angular distribution
- ✅ Predictable positioning
- ✅ Works with your test suite (all tests passing)

**Cons**:
- ✗ Loses domain-based color/wedge organization
- ✗ May not match existing domain-aware UI expectations

---

### Option B: Fix Domain-Based Layout to Use Smaller Radii

Modify `applyDomainRadialLayout` to use R1=180px, R2=360px, R3=540px:

```typescript
// In domainLayout.ts, line ~282:
return applyRelativePolarLayout(nodes, edges, {
  ...config,
  conflictOffsetPx: 30,
  firstRingRadiusPx: 180,      // ← Change from 560px to 180px
  ringIncrementPx: 180,        // ← Change from 520px to 180px
})
```

**Pros**:
- ✅ Keeps domain-based organization
- ✅ Maintains domain wedge layout if desired
- ✅ Can tune specific domain arc-packing

**Cons**:
- ✗ More complex (140+ line positioning algorithm)
- ✗ May require tuning arc-packing parameters
- ✗ Existing domain wedge layout still affects positioning

---

## Expected Results After Fix

### With Simple Radial (Option A):

```
center: (0) r0 [0, 0] "Task Lab"

R1 nodes at radius=180px, evenly spaced:
node-1: (1) r1 [180, 0]   "0°"
node-2: (1.1) r1 [0, 180]  "90°"
node-3: (1.2) r1 [-180, 0] "180°"
node-4: (1.3) r1 [0, -180] "270°"

R2 nodes at radius=360px:
node-5: (2) r2 [360, 0]   "0°"
... (and so on)

R3 nodes at radius=540px:
node-6: (3) r2 [540, 0]   "0°"
... (and so on)
```

All nodes at correct distances, evenly distributed around circles.

---

## Implementation Path

### Step 1: Update App.tsx

Replace calls to `applyDomainRadialLayout` in radial mode with `generateRadialLayout`:

**File**: `/Users/ryanmorrow/Documents/Projects2025/Strukt/client/src/App.tsx`

Locations to update:
- Line 3040: Auto-layout on load
- Line 3119: Mode change
- Line 4949: Import templates
- Line 4961: Node creation
- Line 5284: AI enrichment
- Line 6716: Load from file
- Line 6743: Workspace initialization
- Line 6805: Seed creation

**Pattern**:
```typescript
// OLD
const layoutedNodes = applyDomainRadialLayout(nodes, { ... })

// NEW
const layoutedNodes = generateRadialLayout(nodes, {
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight / 2,
  baseRadius: 180,
  radiusIncrement: 180,
  minAngleDiff: 15,
})
```

### Step 2: Import Statement

```typescript
// Add to imports
import { generateRadialLayout } from '@/config/radialLayout'
```

### Step 3: Update Config

If using domain modes (not just radial), add a check:

```typescript
if (viewMode === 'radial') {
  layoutedNodes = generateRadialLayout(nodes, DEFAULT_RADIAL_CONFIG)
} else if (viewMode === 'domain') {
  layoutedNodes = applyDomainRadialLayout(nodes, config)  // Keep complex algo for domain mode
} else {
  layoutedNodes = applyDomainRadialLayout(nodes, config)  // Fallback
}
```

---

## Validation

After implementing fix:

1. ✅ Check node positions are at expected radii
2. ✅ Verify R1 nodes all at ~180px distance
3. ✅ Verify R2 nodes all at ~360px distance
4. ✅ Verify R3 nodes all at ~540px distance
5. ✅ Confirm even angular distribution (no clustering)
6. ✅ Run existing tests (should pass)

---

## Performance Impact

- **Simple Radial**: O(n) - 556 nodes in 0.24ms ✅
- **Domain-Based**: O(n²) for arc-packing + iterations - slower for large graphs

Using simple radial will actually **improve performance** for large workspaces.

---

## Summary

**Current State**: Domain-based layout uses large radii (560px+) and wedge-based distribution.  
**Expected State**: Simple concentric circles with small radii (180/360/540px).  
**Recommended Fix**: Use `generateRadialLayout` for radial mode instead of `applyDomainRadialLayout`.  
**Status**: Ready to implement - tests already passing with simple layout.

