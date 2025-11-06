# Workspace: Database Migration

## Context
Migrate user table from v1 schema to v2 with minimal downtime.

## Components
- UserService (backend)
- MigrationJob (backend)

## Requirements
- Dual-write during migration window
- Backfill existing records
- Verification step and fallback

## Notes
- Communicate maintenance window if needed
- Track progress and errors
