# 📋 Task 3.6 - Persistence & Versioning

**Date**: October 23, 2025  
**Phase**: Phase 3 - PRD-Powered Generation  
**Status**: ⏳ READY TO START  
**Estimated Duration**: 60 minutes  
**Prerequisites**: ✅ All (Tasks 3.1-3.5 complete)

---

## 🎯 Objective

Enable users to save generated workspaces to the database and maintain version history for rollback capabilities.

---

## 📊 Implementation Plan

### 1. Database Models

#### GenerationHistory Model
```typescript
// server/src/models/GenerationHistory.ts
- workspaceId: ObjectId (ref to Workspace)
- userId: string
- prdTemplateId: ObjectId (which PRD was used)
- userPrompt: string
- generatedContent: {
    nodes: Node[]
    edges: Edge[]
    summary: string
  }
- tokensUsed: number
- generationTime: Date
- modelUsed: string (gpt-4o, gpt-4o-mini)
- status: 'success' | 'partial' | 'failed'
- validationResult: object
- createdAt: Date
- tags: string[] (for user labeling)
```

#### WorkspaceVersion Model
```typescript
// server/src/models/WorkspaceVersion.ts
- workspaceId: ObjectId (ref to Workspace)
- versionNumber: number (auto-increment)
- nodes: Node[]
- edges: Edge[]
- summary: string
- generationHistoryId: ObjectId (which generation created this)
- createdAt: Date
- updatedAt: Date
- label: string (e.g., "v1.2 - Architecture", auto-generated)
- isActive: boolean
```

### 2. API Endpoints

#### POST `/api/workspaces/:id/generate-and-save`
**Purpose**: Generate new workspace content and automatically save as new version

**Request**:
```json
{
  "userPrompt": "Generate complete architecture",
  "prdTemplateId": "...",
  "tags": ["architecture", "initial"],
  "saveAsVersion": true
}
```

**Response**:
```json
{
  "success": true,
  "workspaceId": "...",
  "versionId": "...",
  "versionNumber": 1,
  "generated": {
    "nodes": [...],
    "edges": [...],
    "summary": "..."
  },
  "tokensUsed": 745,
  "generationTime": 3.2,
  "savedAt": "2025-10-23T10:05:00Z"
}
```

---

#### GET `/api/workspaces/:id/generation-history`
**Purpose**: Retrieve all generations for a workspace

**Query Parameters**:
- `limit`: number (default 20, max 100)
- `offset`: number (default 0)
- `sortBy`: 'date' | 'tokens' | 'status' (default 'date')
- `order`: 'asc' | 'desc' (default 'desc')

**Response**:
```json
{
  "success": true,
  "workspaceId": "...",
  "total": 5,
  "generations": [
    {
      "id": "...",
      "userPrompt": "Generate...",
      "prdTemplate": "E-Commerce Template",
      "status": "success",
      "tokensUsed": 745,
      "generatedAt": "2025-10-23T10:05:00Z",
      "versionNumber": 1,
      "tags": ["architecture", "initial"],
      "nodeCount": 12,
      "edgeCount": 18
    }
  ]
}
```

---

#### GET `/api/workspaces/:id/versions`
**Purpose**: List all versions of a workspace

**Query Parameters**:
- `limit`: number (default 50)
- `offset`: number (default 0)

**Response**:
```json
{
  "success": true,
  "workspaceId": "...",
  "totalVersions": 3,
  "activeVersion": 3,
  "versions": [
    {
      "versionId": "...",
      "versionNumber": 3,
      "label": "v3 - Full Architecture",
      "nodeCount": 15,
      "edgeCount": 22,
      "isActive": true,
      "createdAt": "2025-10-23T10:10:00Z",
      "generationId": "..."
    }
  ]
}
```

---

#### POST `/api/workspaces/:id/versions/:versionId/restore`
**Purpose**: Restore a workspace to a previous version

**Request**:
```json
{
  "createNewVersion": true
}
```

**Response**:
```json
{
  "success": true,
  "workspaceId": "...",
  "restoredVersionId": "...",
  "restoredVersionNumber": 2,
  "newVersionNumber": 4,
  "label": "v4 - Restored from v2",
  "nodes": [...],
  "edges": [...]
}
```

---

#### POST `/api/workspaces/:id/versions/:versionId/compare`
**Purpose**: Compare two versions

**Request**:
```json
{
  "compareWithVersionId": "..."
}
```

**Response**:
```json
{
  "success": true,
  "version1": {
    "number": 2,
    "nodeCount": 10
  },
  "version2": {
    "number": 3,
    "nodeCount": 15
  },
  "changes": {
    "nodesAdded": 5,
    "nodesRemoved": 0,
    "nodesModified": 2,
    "edgesAdded": 7,
    "edgesRemoved": 1,
    "summary": "Added 5 new components, modified 2 existing"
  }
}
```

---

### 3. Service Layer

#### PersistenceService
```typescript
// server/src/services/PersistenceService.ts
export class PersistenceService {
  // Save generation to history
  async saveGeneration(
    workspaceId: string,
    generationData: GenerationResult,
    userPrompt: string,
    prdTemplateId: string,
    tags: string[]
  ): Promise<GenerationHistory>

  // Create version from generation
  async createVersion(
    workspaceId: string,
    generationHistoryId: string,
    nodes: Node[],
    edges: Edge[],
    summary: string
  ): Promise<WorkspaceVersion>

  // Get generation history
  async getGenerationHistory(
    workspaceId: string,
    limit: number,
    offset: number,
    sortBy: string,
    order: 'asc' | 'desc'
  ): Promise<{ total: number; generations: GenerationHistory[] }>

  // Get versions
  async getVersions(
    workspaceId: string,
    limit: number,
    offset: number
  ): Promise<{ totalVersions: number; versions: WorkspaceVersion[] }>

  // Restore version
  async restoreVersion(
    workspaceId: string,
    versionId: string,
    createNewVersion: boolean
  ): Promise<WorkspaceVersion>

  // Compare versions
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<VersionComparison>
}
```

---

### 4. Routes

#### `/server/src/routes/persistence.ts`
```typescript
- POST /api/workspaces/:id/generate-and-save
- GET /api/workspaces/:id/generation-history
- GET /api/workspaces/:id/versions
- POST /api/workspaces/:id/versions/:versionId/restore
- POST /api/workspaces/:id/versions/:versionId/compare
```

---

## ✅ Acceptance Criteria

- [ ] GenerationHistory model created and tested
- [ ] WorkspaceVersion model created and tested
- [ ] PersistenceService fully implemented
- [ ] All 5 API endpoints working
- [ ] Generate-and-save flow tested end-to-end
- [ ] History retrieval working with pagination
- [ ] Version restoration working correctly
- [ ] Version comparison algorithm accurate
- [ ] MongoDB queries optimized with indexes
- [ ] Error handling for edge cases
- [ ] Documentation updated
- [ ] Zero TypeScript errors
- [ ] Clean build output

---

## 🔗 Dependencies

**Already Complete**:
- ✅ Workspace model (Tasks 1.1, 2.1)
- ✅ MongoDB (Task 1.2)
- ✅ GenerationService (Task 3.5)
- ✅ PRD system (Tasks 3.1-3.3)

**Required for this task**:
- New models: GenerationHistory, WorkspaceVersion
- New service: PersistenceService
- New routes: persistence.ts
- Updated: server/src/index.ts to register routes

---

## 📝 Files to Create

1. `server/src/models/GenerationHistory.ts` (~80 lines)
2. `server/src/models/WorkspaceVersion.ts` (~80 lines)
3. `server/src/services/PersistenceService.ts` (~300 lines)
4. `server/src/routes/persistence.ts` (~120 lines)

---

## 📈 Testing Strategy

1. **Unit Tests**:
   - Model validation
   - Service methods
   - Edge cases (no history, restore non-existent version)

2. **Integration Tests**:
   - Full generate-and-save flow
   - History retrieval with pagination
   - Version restoration with new version creation
   - Version comparison accuracy

3. **Manual Testing**:
   - cURL tests for each endpoint
   - Verify MongoDB records created correctly
   - Test version rollback scenarios

---

## 🎯 Success Metrics

- ✅ All 5 endpoints respond in < 200ms (non-generation)
- ✅ Database queries use proper indexes
- ✅ History pagination works correctly (20/50 items per page)
- ✅ Version restoration is instant (<50ms)
- ✅ No data loss during version transitions
- ✅ Clear error messages for invalid requests

---

## 📌 Notes

- Each workspace can have unlimited versions
- Versions are immutable (can't modify after creation)
- Active version is tracked separately
- Generation history is append-only (no deletion, only archival)
- Implement soft deletes for audit trail compliance

---

## ⏭️ Next Task (3.7)

**Error Recovery & Retry Logic**
- Implement retry mechanism for failed generations
- Add fallback to gpt-4o-mini on rate limits
- Queue system for handling concurrent requests
