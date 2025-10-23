# 📋 Task 3.7 - Error Recovery & Retry Logic

**Date**: October 23, 2025  
**Phase**: Phase 3 - PRD-Powered Generation  
**Status**: ⏳ READY TO START  
**Estimated Duration**: 45 minutes  
**Prerequisites**: ✅ All (Tasks 3.1-3.6 complete)

---

## 🎯 Objective

Implement robust error recovery mechanisms to handle:
- API rate limits and temporary failures
- Graceful degradation to fallback model (gpt-4o-mini)
- Automatic retry with exponential backoff
- Circuit breaker pattern for API failures
- Queue system for managing concurrent requests

---

## 📊 Implementation Plan

### 1. RetryService

**File**: `server/src/services/RetryService.ts`

```typescript
export class RetryService {
  // Exponential backoff: 1s, 2s, 4s, 8s (max 4 retries)
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 4,
    initialDelay: number = 1000,
    maxDelay: number = 8000
  ): Promise<T>

  // Get retry delay for attempt number
  private getBackoffDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number
  ): number

  // Check if error is retryable
  private isRetryableError(error: any): boolean

  // Fallback to gpt-4o-mini on specific errors
  async fallbackToMiniModel(
    workspaceId: string,
    userPrompt: string,
    originalError: Error
  ): Promise<GenerationResponse>
}
```

**Logic**:
```
Attempt 1: Immediate (0ms)
  ↓ Fails
Attempt 2: Wait 1s, retry (1000ms)
  ↓ Fails
Attempt 3: Wait 2s, retry (2000ms)
  ↓ Fails
Attempt 4: Wait 4s, retry (4000ms)
  ↓ Fails
Attempt 5: Wait 8s, retry (8000ms)
  ↓ Fails
Return error with fallback option
```

---

### 2. CircuitBreaker Pattern

**File**: `server/src/services/CircuitBreaker.ts`

```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private failureThreshold: number = 5; // Open after 5 failures
  private resetTimeout: number = 60000; // Try to recover after 60s

  async execute<T>(
    operation: () => Promise<T>
  ): Promise<T>

  private changeState(newState: CircuitState): void

  private recordSuccess(): void

  private recordFailure(): void

  private shouldAttemptReset(): boolean
}
```

**State Transitions**:
```
CLOSED (normal operation)
  ├─ Success → CLOSED
  └─ Failures >= 5 → OPEN
       ↓
OPEN (reject all requests)
  └─ Wait 60s → HALF_OPEN
       ↓
HALF_OPEN (test if service recovered)
  ├─ Success → CLOSED
  └─ Failure → OPEN
```

---

### 3. Queue System

**File**: `server/src/services/GenerationQueue.ts`

```typescript
export interface QueuedGeneration {
  id: string;
  workspaceId: string;
  userPrompt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: GenerationResponse;
  error?: string;
}

export class GenerationQueue {
  private queue: QueuedGeneration[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 3; // Max 3 concurrent requests

  async enqueue(
    workspaceId: string,
    userPrompt: string
  ): Promise<string> // Returns job ID

  async getStatus(jobId: string): Promise<QueuedGeneration>

  async getResults(
    workspaceId: string,
    limit?: number
  ): Promise<QueuedGeneration[]>

  private async processQueue(): Promise<void>

  private async executeJob(job: QueuedGeneration): Promise<void>
}
```

---

### 4. Enhanced Generation Service

**File**: `server/src/services/GenerationService.ts` (updated)

Add methods:
```typescript
async generateWithRetry(
  workspace: IWorkspace,
  userPrompt: string,
  maxRetries?: number
): Promise<GenerationResponse>

async generateWithFallback(
  workspace: IWorkspace,
  userPrompt: string
): Promise<GenerationResponse>

async generateQueued(
  workspaceId: string,
  userPrompt: string
): Promise<{ jobId: string }>
```

---

### 5. API Routes

**File**: `server/src/routes/retry.ts` (new)

```typescript
/**
 * POST /api/generation/generate-with-retry
 * Generate with automatic retry on failure
 */
router.post('/generate-with-retry', async (req, res) => {
  // Fetch workspace
  // Call GenerationService.generateWithRetry()
  // Return result with retry attempt count
})

/**
 * POST /api/generation/generate-queued
 * Queue generation request
 */
router.post('/generate-queued', async (req, res) => {
  // Enqueue generation
  // Return job ID immediately
})

/**
 * GET /api/generation/queue/:jobId/status
 * Get status of queued generation
 */
router.get('/queue/:jobId/status', async (req, res) => {
  // Get job status
  // Return current state
})

/**
 * GET /api/generation/queue/:jobId/result
 * Get result of completed generation
 */
router.get('/queue/:jobId/result', async (req, res) => {
  // Get completed job result
  // Return parsed content
})
```

---

## ✅ Acceptance Criteria

### Code Quality
- [ ] RetryService implemented with exponential backoff
- [ ] CircuitBreaker pattern implemented
- [ ] GenerationQueue managing concurrent requests
- [ ] Enhanced GenerationService with retry methods
- [ ] 4 new API endpoints
- [ ] All TypeScript strict mode checks pass
- [ ] Zero build errors

### Functionality
- [ ] Retries work with exponential backoff (1s, 2s, 4s, 8s)
- [ ] Fallback to gpt-4o-mini on rate limits
- [ ] Circuit breaker opens after 5 failures
- [ ] Circuit breaker resets after 60 seconds
- [ ] Queue limits to 3 concurrent requests
- [ ] Job IDs generated and returned immediately

### Testing
- [ ] Retry endpoint tested with simulated failures
- [ ] Queue endpoint tested with multiple requests
- [ ] Status endpoint returns correct job info
- [ ] Result endpoint returns completed work
- [ ] Fallback model works when gpt-4o unavailable
- [ ] Circuit breaker prevents cascading failures

### Documentation
- [ ] API endpoints documented
- [ ] Error handling documented
- [ ] Queue status documented
- [ ] Fallback behavior documented

---

## 📈 Expected Outcomes

### Performance Improvements
- **Rate Limit Handling**: Automatic fallback to mini model
- **Reliability**: Retry up to 5 times before failing
- **Concurrency**: Queue system handles up to 3 concurrent
- **Resilience**: Circuit breaker prevents cascade failures

### User Experience
- **Transparency**: Job IDs for async tracking
- **Feedback**: Real-time status updates
- **Reliability**: Automatic recovery from transient errors
- **Fallback**: Graceful degradation to mini model

---

## 🔧 Implementation Strategy

### Phase 1: Core Services (20 min)
1. Create RetryService with backoff logic
2. Create CircuitBreaker pattern
3. Implement GenerationQueue system
4. Test each service independently

### Phase 2: Integration (15 min)
1. Add retry methods to GenerationService
2. Add fallback logic
3. Register retry routes
4. Update index.ts with new router

### Phase 3: Testing (10 min)
1. Test retry endpoint
2. Test queue endpoint
3. Test status/result endpoints
4. Verify error handling
5. Build and Docker restart

---

## 🎯 Success Criteria

- ✅ All 4 endpoints working
- ✅ Retry logic functioning (exponential backoff)
- ✅ Circuit breaker preventing cascades
- ✅ Queue managing concurrency
- ✅ Fallback to mini model on rate limits
- ✅ 0 TypeScript errors
- ✅ Production-ready code

---

## ⏳ Timeline

**Total Duration**: 45 minutes
- Design & Setup: 5 min
- Core Services: 20 min
- Integration: 15 min
- Testing: 5 min

**Target Completion**: Oct 23, 12:00 UTC (+ 45 min from start)

---

## 📝 Notes

- Exponential backoff prevents overwhelming a recovering API
- Circuit breaker prevents cascading failures across system
- Queue system allows async job tracking for UI
- Fallback to mini model ensures generation never fully fails
- All services follow existing error handling patterns

---

## ✨ After Task 3.7

Once complete:
- Phase 3 will be 70% complete (7 of 10 tasks)
- Time remaining: ~3 hours 30 minutes
- Next: Task 3.8 (Frontend Integration - 90 min)

---

**Status**: Ready to implement  
**Estimated Completion**: Oct 23, 12:00 UTC
