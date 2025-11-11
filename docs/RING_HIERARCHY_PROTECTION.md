# Ring Hierarchy Protection Protocol

## Sacred Structure (DO NOT BREAK)

This is the **immutable foundation** that all application logic depends on:

```
Ring 0: center
  ↓
Ring 1 (5 Pillars - ALWAYS directly under center)
  ├── classification-business-model (business domain)
  ├── classification-business-operations (operations domain)
  ├── classification-marketing-gtm (product domain)
  ├── classification-app-frontend (tech domain, frontend)
  └── classification-app-backend (tech domain, backend)
       ↓
Ring 2 (5 Domains - ALWAYS under specific R1 parents)
  ├── (under app-backend)
  │  ├── classification-data-ai
  │  ├── classification-infrastructure
  │  ├── classification-observability
  │  └── classification-security
  └── (under marketing-gtm)
     └── classification-customer-experience
          ↓
Ring 3+ (Templates - ALWAYS under appropriate R2 classifications)
  ├── (under app-backend classification)
  │  ├── backend-server
  │  └── backend-authentication
  └── (under marketing-gtm classification)
     └── frontend-mobile-app
```

## Invariants (MUST ALWAYS BE TRUE)

1. **Ring 1 ALWAYS connects to center** - Never to another node
2. **Ring 2 ALWAYS connects to specific Ring 1** - Never to center, never to other R2
3. **Ring 3+ ALWAYS connects to Ring 2** - Never to center, never to R1
4. **Exactly 5 Ring 1 nodes** - No more, no fewer
5. **Exactly 5 Ring 2 nodes** - No more, no fewer
6. **Parent mapping MUST NOT change** without explicit decision

## R2→R1 Parent Mapping (IMMUTABLE)

```typescript
RING2_TO_RING1_PARENT_MAP = {
  dataAI: "appBackend", // Data pipelines → Backend
  infrastructure: "appBackend", // CI/CD, platform → Backend
  observability: "appBackend", // Monitoring, logging → Backend
  security: "appBackend", // Auth, secrets → Backend
  customerExperience: "marketingGTM", // Support, success → Marketing
};
```

## Code Locations That Enforce This

| File                                   | Function                         | Purpose                                 |
| -------------------------------------- | -------------------------------- | --------------------------------------- |
| `client/src/config/classifications.ts` | `RING2_TO_RING1_PARENT_MAP`      | Defines immutable mapping               |
| `client/src/config/classifications.ts` | `ensureClassificationBackbone()` | Enforces R2→R1 edges for existing nodes |
| `client/src/App.tsx`                   | `enforceRingHierarchyEdges()`    | Reconstructs edges on load              |
| `client/src/App.tsx`                   | `handleAddNode()`                | Validates ring and parent on creation   |

## What CAN Change (Controlled)

- Node labels and summaries
- Node descriptions and documentation
- Node tags and metadata
- Ring 3+ node creation and connections (must respect R2 parents)
- R3 connections to different R2 classifications (e.g., moving a template)

## What CANNOT Change (Forbidden)

- Ring values for classifications (R1 = R1, R2 = R2, always)
- R1→center connections
- R2→R1 parent mappings without explicit approval
- Number of R1 or R2 classifications
- Classification IDs or keys

## Testing the Structure

Always verify after any significant change:

```bash
# Check structure is intact
curl -s http://localhost:5050/api/workspaces | jq '.[] | {
  nodes: (.nodes | length),
  edges: (.edges | length),
  r1_to_center: [.edges[] | select(.source == "center") | .target] | length,
  r2_to_r1: [.edges[] | select(.source | startswith("classification-") and . != "center") | select(.target | startswith("classification-")) | .target] | length
}'

# Expected output:
# nodes: 14 (1 R0 + 5 R1 + 5 R2 + 3 R3)
# edges: 13 (5 R1→center + 5 R2→R1 + 3 R3→R2)
# r1_to_center: 5
# r2_to_r1: 5
```

## Modification Protocol

If you need to change the hierarchy:

1. **Document the reason** - Why is this change necessary?
2. **Update RING2_TO_RING1_PARENT_MAP** if mappings change
3. **Update this file** with new structure
4. **Run full test suite** to verify no breaks
5. **Commit with explicit message**: "BREAKING: Ring hierarchy change - [reason]"
6. **Tag the commit** for easy rollback: `git tag hierarchy-change-[date]`

## Emergency Rollback

If the structure breaks:

```bash
# Find the last good commit
git log --oneline docs/RING_HIERARCHY_PROTECTION.md | head -5

# Rollback to last working state
git checkout <commit-hash> -- client/src/config/classifications.ts client/src/App.tsx
docker-compose down && docker-compose up -d --build
```
