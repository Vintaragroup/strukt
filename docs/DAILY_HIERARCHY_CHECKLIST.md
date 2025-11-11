# Daily Ring Hierarchy Checklist

Run this daily to ensure the foundation structure is intact:

## Quick Verification

```bash
#!/bin/bash
# Save as: scripts/verify-hierarchy.sh

echo "🔍 Verifying Ring Hierarchy Structure..."

RESULT=$(curl -s http://localhost:5050/api/workspaces | jq '.[] | {
  nodeCount: (.nodes | length),
  edgeCount: (.edges | length),
  r1_count: ([.nodes[] | select(.data.ring == 1)] | length),
  r2_count: ([.nodes[] | select(.data.ring == 2)] | length),
  r3_count: ([.nodes[] | select(.data.ring == 3)] | length),
  r1_to_center: ([.edges[] | select(.source == "center" and (.target | startswith("classification-"))) ] | length),
  r2_to_r1: ([.edges[] | select((.source | startswith("classification-")) and (.target | startswith("classification-")) and .source != "center")] | length),
  r3_to_r2: ([.edges[] | select((.source | startswith("classification-")) and (.target | startswith("backend-") or .target | startswith("frontend-")))] | length)
}')

echo "$RESULT" | jq '
  if .nodeCount == 14 and .edgeCount == 13 and
     .r1_count == 5 and .r2_count == 5 and .r3_count == 3 and
     .r1_to_center == 5 and .r2_to_r1 == 5 and .r3_to_r2 == 3
  then "✅ HIERARCHY INTACT"
  else "❌ HIERARCHY BROKEN - IMMEDIATE ACTION REQUIRED"
  end'

echo ""
echo "Detailed counts:"
echo "$RESULT" | jq '{nodeCount, edgeCount, r1_count, r2_count, r3_count, r1_to_center, r2_to_r1, r3_to_r2}'
```

## Expected Output

```json
{
  "nodeCount": 14,
  "edgeCount": 13,
  "r1_count": 5,
  "r2_count": 5,
  "r3_count": 3,
  "r1_to_center": 5,
  "r2_to_r1": 5,
  "r3_to_r2": 3
}
```

## Node Type Verification

Each node type should resolve to correct parent:

```bash
# Check frontend nodes → classification-app-frontend
curl -s http://localhost:5050/api/workspaces | jq '.[] | [
  .nodes[] | select(.type == "frontend") |
  {id, type, ring, domain} + {parent_edge: ([.., .edges[] | select(.target == .id)] | .[0].source)}
]'

# Check backend nodes → classification-app-backend
curl -s http://localhost:5050/api/workspaces | jq '.[] | [
  .nodes[] | select(.type == "backend") |
  {id, type, ring, domain} + {parent_edge: ([.., .edges[] | select(.target == .id)] | .[0].source)}
]'
```

## What's Protected

| Item                 | Current        | Protected | Reason                   |
| -------------------- | -------------- | --------- | ------------------------ |
| Ring 1 nodes         | 5              | ✅ YES    | Foundation pillars       |
| Ring 2 nodes         | 5              | ✅ YES    | Domain classifications   |
| R1→Center edges      | 5              | ✅ YES    | All R1 must go to center |
| R2→R1 parent map     | Fixed          | ✅ YES    | Immutable mapping        |
| Node type resolution | Priority-based | ✅ YES    | Type > Domain fallback   |

## What to Watch

🚨 **Red Flags** - If any of these happen, STOP and investigate:

1. **Node count changes** (should always be 14)
2. **Edge count changes** (should always be 13)
3. **New nodes appear directly under center** (except R1)
4. **Classification nodes with wrong ring values**
5. **Frontend nodes not under app-frontend**
6. **Backend nodes not under app-backend**
7. **Data/Infrastructure/Security/Observability not under app-backend**
8. **Customer-Experience not under marketing-gtm**

## Incident Response

If hierarchy breaks:

1. **Stop all changes** - Don't modify nodes until fixed
2. **Document the break** - What was the last action?
3. **Check recent commits** - Look at code changes
4. **Run verification** - Get exact counts of broken state
5. **Rollback if needed** - Use commit tags for quick revert
6. **Report in issue** - Create GitHub issue with reproduction steps

## Test Cases for New Features

Before adding ANY new feature that touches nodes/edges, test:

```bash
# Before feature
BEFORE=$(curl -s http://localhost:5050/api/workspaces | jq '.[] | {nodeCount: (.nodes | length), edgeCount: (.edges | length)}')

# Run feature

# After feature
AFTER=$(curl -s http://localhost:5050/api/workspaces | jq '.[] | {nodeCount: (.nodes | length), edgeCount: (.edges | length)}')

# Verify no accidental changes to structure
diff <(echo "$BEFORE") <(echo "$AFTER")
```

## Automated Monitoring

For production, add to CI/CD:

```yaml
# .github/workflows/hierarchy-check.yml
name: Ring Hierarchy Integrity Check

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Verify hierarchy code exists
        run: |
          grep -q "RING2_TO_RING1_PARENT_MAP" client/src/config/classifications.ts
          grep -q "enforceRingHierarchyEdges" client/src/App.tsx
          grep -q "Ring 1 ALWAYS connects to center" docs/RING_HIERARCHY_PROTECTION.md
```
