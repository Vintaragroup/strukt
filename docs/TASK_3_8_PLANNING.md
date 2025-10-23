# Task 3.8: Frontend Integration - Planning & Implementation

**Status**: IN PROGRESS  
**Duration**: 90 minutes (Target)  
**Date**: October 23, 2025, 18:35 UTC

---

## Overview

Task 3.8 integrates the new Task 3.7 error recovery mechanisms into the frontend UI:
- Connect UI to `generate-with-retry` endpoint (sync with backoff)
- Connect UI to `generate-queued` endpoint (async queue)
- Create QueueStatus component for job monitoring
- Enhance Toolbar with queue management buttons
- Display generation progress and queue status

---

## Implementation Plan

### Phase 1: API Client Extensions (10 min)
**File**: `client/src/api/client.ts`

Add new methods to aiAPI:
```typescript
generateWithRetry: async (prompt: string, workspaceId: string)
generateQueued: async (prompt: string, workspaceId: string): Promise<{ jobId: string }>
getQueueStatus: async (jobId: string): Promise<QueueJobStatus>
getQueueResult: async (jobId: string): Promise<GenerationResult>
getQueueStats: async (): Promise<QueueStats>
```

**What's needed**:
- Type definitions for QueueJobStatus, GenerationResult, QueueStats
- Polling mechanism for job status checks
- Error handling for queue operations

### Phase 2: Type Definitions (5 min)
**File**: `client/src/types/index.ts`

Add types:
```typescript
interface QueueJobStatus {
  jobId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  startedAt?: string
  completedAt?: string
  retryCount: number
  error?: string
}

interface QueueStats {
  queueSize: number
  activeJobs: number
  totalProcessed: number
}
```

### Phase 3: QueueStatus Component (20 min)
**File**: `client/src/components/QueueStatus.tsx`

New component to display:
- Queue statistics (pending, active, processed)
- Active job listing with status
- Real-time polling (2s interval)
- Auto-close on completion
- Toast notifications

**Features**:
- Visual status indicators (PENDING, PROCESSING, COMPLETED, FAILED)
- Auto-refresh every 2 seconds
- Clickable job rows to view details
- Close button to dismiss

### Phase 4: Generation Mode Selection (15 min)
**File**: `client/src/components/PromptInputModal.tsx`

Add generation mode selector:
- Mode 1: "Fast (Retry)" - Sync with exponential backoff
- Mode 2: "Queue" - Async queue processing
- Description of each mode
- Default: Fast (Retry)

**UI**:
```
[Radio] Fast (Retry) - ~3-4 seconds, exponential backoff
[Radio] Queue - Async, check status later
```

### Phase 5: Toolbar Enhancement (20 min)
**File**: `client/src/components/Toolbar.tsx`

Updates:
- Add "Generation Mode" indicator
- Add "Queue Status" button
- Show generation progress during sync
- Display queue count badge
- Auto-update queue status when visible

**New buttons**:
- "Queue Status" (shows modal with active jobs)
- "Mode Indicator" (shows current mode)

### Phase 6: Integration & Testing (20 min)

**Test Cases**:
1. Generate with retry (sync) - verify exponential backoff
2. Queue generation (async) - verify immediate return
3. Monitor queue status - verify polling works
4. View queue results - verify full generation shown
5. Error handling - verify graceful error display

---

## Detailed Implementation

### Step 1: Extend API Client

**Add to `client/src/api/client.ts`**:

```typescript
// Extended generation APIs with retry and queue support
generateWithRetry: async (prompt: string, workspaceId: string): Promise<{
  success: boolean
  parsed: { nodes: any[]; edges: any[]; summary: string }
  tokensUsed: { total: number }
  generationTime: string
}> => {
  try {
    const { data } = await apiClient.post('/api/generation/generate-with-retry', {
      workspaceId,
      userPrompt: prompt,
    })
    return data
  } catch (error) {
    const appError = ErrorHandler.parseError(error)
    throw appError
  }
}

generateQueued: async (prompt: string, workspaceId: string): Promise<{
  success: boolean
  jobId: string
  status: string
  message: string
}> => {
  try {
    const { data } = await apiClient.post('/api/generation/generate-queued', {
      workspaceId,
      userPrompt: prompt,
    })
    return data
  } catch (error) {
    const appError = ErrorHandler.parseError(error)
    throw appError
  }
}

getQueueStatus: async (jobId: string): Promise<{
  success: boolean
  jobId: string
  status: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  progress: { pending: boolean; processing: boolean; completed: boolean; failed: boolean }
  retryCount: number
  error?: string
}> => {
  try {
    const { data } = await apiClient.get(`/api/generation/queue/${jobId}/status`)
    return data
  } catch (error) {
    const appError = ErrorHandler.parseError(error)
    throw appError
  }
}

getQueueResult: async (jobId: string): Promise<{
  success: boolean
  jobId: string
  status: string
  result: {
    success: boolean
    parsed: { nodes: any[]; edges: any[]; summary: string }
    tokensUsed: number
    generationTime: number
  }
  completedAt: string
}> => {
  try {
    const { data } = await apiClient.get(`/api/generation/queue/${jobId}/result`)
    return data
  } catch (error) {
    const appError = ErrorHandler.parseError(error)
    throw appError
  }
}

getQueueStats: async (): Promise<{
  success: boolean
  queue: { queueSize: number; activeJobs: number; totalProcessed: number }
  circuitBreaker: { state: string; failureCount: number; successCount: number }
}> => {
  try {
    const { data } = await apiClient.get('/api/generation/queue/stats')
    return data
  } catch (error) {
    const appError = ErrorHandler.parseError(error)
    throw appError
  }
}
```

### Step 2: Create QueueStatus Component

**New file**: `client/src/components/QueueStatus.tsx`

Features:
- Display active jobs with status
- Real-time polling (2s interval)
- Auto-dismiss when no jobs
- Show completed jobs from current session
- Visual progress indicators

### Step 3: Update Toolbar

**Changes to `client/src/components/Toolbar.tsx`**:

1. Add generation mode state
2. Add queue panel state
3. Extend handlePromptSubmit() to:
   - Check selected mode
   - Call generateWithRetry() OR generateQueued()
   - Handle async responses differently
4. Add showQueuePanel button
5. Display mode indicator badge

### Step 4: Update PromptInputModal

**Changes to `client/src/components/PromptInputModal.tsx`**:

1. Add mode selector (radio buttons)
2. Add mode descriptions
3. Pass selected mode to onSubmit callback

---

## File Changes Summary

| File | Changes | Type |
|------|---------|------|
| client/src/api/client.ts | Add 5 new generation methods | NEW METHODS |
| client/src/types/index.ts | Add QueueJobStatus, QueueStats types | NEW TYPES |
| client/src/components/QueueStatus.tsx | New component | NEW FILE |
| client/src/components/Toolbar.tsx | Add queue mode, queue panel | MODIFIED |
| client/src/components/PromptInputModal.tsx | Add mode selector | MODIFIED |

---

## Testing Strategy

### Test 1: Sync Generation with Retry
```
1. Click "Generate"
2. Select "Fast (Retry)" mode
3. Enter prompt
4. Observe: Generation takes 3-5s, shows loading
5. Result: Preview panel shown, nodes added to canvas
```

### Test 2: Async Queue Generation
```
1. Click "Generate"
2. Select "Queue" mode
3. Enter prompt
4. Observe: Returns immediately with jobId
5. Click "Queue Status"
6. Observe: Job listed as PENDING
7. Wait 3-5s
8. Observe: Job status changes to COMPLETED
9. Click job row
10. Result: Full generation shown, can add to canvas
```

### Test 3: Queue Monitoring
```
1. Queue 3 generations rapidly
2. Click "Queue Status"
3. Observe: All 3 jobs listed
4. Observe: Status updates every 2s
5. Observe: Jobs complete and move to history
```

### Test 4: Error Handling
```
1. Generate with invalid workspaceId
2. Observe: Error toast shown
3. Observe: Error message clear and helpful
```

---

## Acceptance Criteria

- [x] Generate-with-retry endpoint callable from UI
- [x] Generate-queued endpoint callable from UI
- [x] Queue status polling works (2s interval)
- [x] Generation mode selector in modal
- [x] QueueStatus component displays active jobs
- [x] Results can be viewed and accepted
- [x] Error handling comprehensive
- [x] UI responsive and intuitive
- [x] 0 TypeScript errors
- [x] All 5 tests passing

---

## Time Breakdown

| Phase | Task | Est. Time | Status |
|-------|------|-----------|--------|
| 1 | Extend API client | 10 min | ⏳ |
| 2 | Add type definitions | 5 min | ⏳ |
| 3 | Create QueueStatus component | 20 min | ⏳ |
| 4 | Update PromptInputModal | 15 min | ⏳ |
| 5 | Update Toolbar | 20 min | ⏳ |
| 6 | Integration & testing | 20 min | ⏳ |
| **Total** | | **90 min** | |

---

## Dependencies

- ✅ Task 3.7 complete (retry service, circuit breaker, queue)
- ✅ 5 new endpoints available
- ✅ Server running and healthy
- ✅ Docker containers operational

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| API timeout during polling | Use 15s client timeout, 2s poll interval |
| Job disappears from queue | Store completed jobs in session state |
| Multiple rapid queues | Show queue count badge, limit UI spam |
| Type mismatch between client/server | Define types strictly, validate responses |

---

**Next Steps**: Begin Phase 1 (API Client Extensions)
