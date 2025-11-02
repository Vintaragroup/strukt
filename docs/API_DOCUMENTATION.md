# Complete API Reference - Strukt Phase 3

**Version**: 1.0.0  
**Last Updated**: October 23, 2025  
**Status**: ✅ Complete  

---

## Table of Contents

1. [Overview](#overview)
2. [PRD Templates (Task 3.1)](#prd-templates)
3. [Semantic Search (Task 3.2)](#semantic-search)
4. [Retrieval & Search (Task 3.3)](#retrieval-search)
5. [Context Injection (Task 3.4)](#context-injection)
6. [Generation Pipeline (Task 3.5)](#generation-pipeline)
7. [Persistence (Task 3.6)](#persistence)
8. [Error Recovery & Queue (Task 3.7)](#error-recovery)
9. [Best Practices](#best-practices)

---

## Overview

**Base URL**: `http://localhost:5050` (or configured VITE_API_URL)  
**Default Timeout**: 15 seconds  
**Content-Type**: `application/json`

**Total Endpoints**: 31+

---

## PRD Templates (Task 3.1)

### 1. List All Templates
```
GET /api/prd-templates
```

**Query Parameters**:
- `category` (optional): Filter by category
- `tags` (optional): Comma-separated tags
- `complexity` (optional): simple|medium|complex|high
- `limit` (optional): Default 100, max 1000
- `skip` (optional): Pagination offset

**Response**:
```json
{
  "success": true,
  "data": [{
    "template_id": "backend_api_001",
    "name": "Backend API",
    "category": "Backend",
    "description": "REST API with authentication",
    "tags": ["api", "backend", "authentication"],
    "complexity": "medium",
    "estimated_effort_hours": 40
  }],
  "pagination": {
    "total": 10,
    "limit": 100,
    "skip": 0,
    "hasMore": false
  }
}
```

### 2. Get Single Template
```
GET /api/prd-templates/:templateId
```

**Response**: Single template object

### 3. Filter by Category
```
GET /api/prd-templates/category/:category
```

### 4. Filter by Tags
```
GET /api/prd-templates/tags/:tags
```

**Parameters**: Comma-separated tag list

### 5. Get Categories
```
GET /api/prd-templates/list/categories
```

**Response**: Array of category strings

### 6. Get Tags
```
GET /api/prd-templates/list/tags
```

**Response**: Array of tag strings

### 7. Template Statistics
```
GET /api/prd-templates/stats/summary
```

**Response**:
```json
{
  "success": true,
  "total": 10,
  "byCategory": {...},
  "byComplexity": {...},
  "avgEffort": 45
}
```

---

## Semantic Search (Task 3.2)

### 1. Semantic Vector Search
```
POST /api/prd-templates/search/semantic
```

**Request Body**:
```json
{
  "query": "backend API with authentication",
  "limit": 5,
  "threshold": 0.7
}
```

**Response**:
```json
{
  "success": true,
  "results": [{
    "template_id": "backend_api_001",
    "name": "Backend API",
    "similarity_score": 0.89
  }]
}
```

**Features**:
- Vector embeddings (3072 dimensions)
- Cosine similarity matching
- Configurable threshold
- Caching enabled (10 min TTL)

---

## Retrieval & Search (Task 3.3)

### 1. Text Search
```
POST /api/prd-templates/retrieve/text-search
```

**Request Body**:
```json
{
  "query": "backend",
  "limit": 10,
  "fields": ["name", "description", "tags"]
}
```

**Features**:
- Full-text search across name, description, tags
- Relevance scoring
- Result ranking

### 2. Advanced Search
```
POST /api/prd-templates/retrieve/advanced-search
```

**Request Body**:
```json
{
  "category": "Backend",
  "complexity": "medium",
  "tags": ["api", "authentication"],
  "minEffort": 30,
  "maxEffort": 60,
  "limit": 10
}
```

**Features**:
- Multi-field filtering
- Range queries
- Combined criteria

### 3. Template Recommendations
```
GET /api/prd-templates/:id/recommendations
```

**Response**: Array of similar templates

### 4. Cache Statistics
```
GET /api/prd-templates/retrieve/cache-stats
```

**Response**:
```json
{
  "cacheSize": 45,
  "maxSize": 50,
  "hitRate": 0.87,
  "entries": [...]
}
```

---

## Context Injection (Task 3.4)

### 1. Get Workspace Context
```
GET /api/workspaces/:workspaceId/context
```

**Response**:
```json
{
  "success": true,
  "context": {
    "nodes": 12,
    "edges": 15,
    "components": {...},
    "analysis": {...}
  }
}
```

### 2. Analyze Workspace
```
POST /api/workspaces/:workspaceId/context/analyze
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "complexity": "medium",
    "nodeTypes": {...},
    "dependencies": {...},
    "recommendations": [...]
  }
}
```

### 3. Context Summary
```
GET /api/workspaces/:workspaceId/context/summary
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "title": "Workspace Summary",
    "description": "...",
    "keyComponents": [...]
  }
}
```

### 4. Clear Context Cache
```
POST /api/workspaces/:workspaceId/context/cache-clear
```

---

## Generation Pipeline (Task 3.5)

### 1. Get AI Suggestions
```
POST /api/generation/suggest
```

**Request Body**:
```json
{
  "workspaceId": "...",
  "goal": "Add payment processing"
}
```

### 2. Validate Generation
```
POST /api/generation/validate
```

**Request Body**:
```json
{
  "workspaceId": "...",
  "userPrompt": "Create a microservices architecture"
}
```

### 3. Generate PRD
```
POST /api/generation/generate
```

**Request Body**:
```json
{
  "prompt": "Build a real-time collaboration tool"
}
```

**Response**:
```json
{
  "success": true,
  "workspace": {
    "nodes": [...],
    "edges": [...]
  },
  "tokensUsed": 1250,
  "generationTime": "5.2s"
}
```

### 4. Generation Health
```
GET /api/generation/health
```

---

## Persistence (Task 3.6)

### 1. Get Generation History
```
GET /api/workspaces/:workspaceId/history
```

**Query Parameters**:
- `limit`: Number of records (default: 10)
- `skip`: Offset (default: 0)

**Response**:
```json
{
  "success": true,
  "history": [{
    "timestamp": "2025-10-23T19:00:00Z",
    "prompt": "...",
    "result": {...},
    "tokensUsed": 1250
  }]
}
```

### 2. Get Versions
```
GET /api/workspaces/:workspaceId/versions
```

### 3. Create Version
```
POST /api/workspaces/:workspaceId/versions
```

**Request Body**:
```json
{
  "name": "v1.0.0",
  "description": "Initial release",
  "tags": ["release", "stable"]
}
```

### 4. Persistence Statistics
```
GET /api/workspaces/:workspaceId/persistence-stats
```

### 5. Export Workspace
```
POST /api/workspaces/:workspaceId/export
```

**Request Body**:
```json
{
  "format": "json|yaml|pdf"
}
```

### 6. Save Checkpoint
```
POST /api/workspaces/:workspaceId/save-checkpoint
```

**Request Body**:
```json
{
  "name": "checkpoint-1",
  "description": "Before major refactor"
}
```

---

## Error Recovery & Queue (Task 3.7)

### 1. Generate with Retry
```
POST /api/generation/generate-with-retry
```

**Request Body**:
```json
{
  "workspaceId": "...",
  "userPrompt": "Add authentication and rate limiting"
}
```

**Features**:
- Automatic retry on failure
- Exponential backoff: 1s, 2s, 4s, 8s
- Max 4 retries
- Synchronous response

**Response**:
```json
{
  "success": true,
  "parsed": {
    "nodes": [...],
    "edges": [...]
  },
  "tokensUsed": 1250,
  "generationTime": "5.2s",
  "retryAttempted": false
}
```

### 2. Generate Queued
```
POST /api/generation/generate-queued
```

**Request Body**:
```json
{
  "workspaceId": "...",
  "userPrompt": "Create a mobile app"
}
```

**Features**:
- Asynchronous queue
- Immediate response with jobId
- Max 3 concurrent jobs
- Real-time monitoring

**Response**:
```json
{
  "success": true,
  "jobId": "uuid-here",
  "status": "PENDING",
  "createdAt": "2025-10-23T19:00:00Z"
}
```

### 3. Get Job Status
```
GET /api/generation/queue/:jobId/status
```

**Response**:
```json
{
  "success": true,
  "jobId": "...",
  "status": "PENDING|PROCESSING|COMPLETED|FAILED",
  "progress": 0-100,
  "retryCount": 0,
  "error": null
}
```

### 4. Get Job Result
```
GET /api/generation/queue/:jobId/result
```

**Response**:
```json
{
  "success": true,
  "jobId": "...",
  "status": "COMPLETED",
  "result": {
    "success": true,
    "parsed": {...},
    "tokensUsed": 1250,
    "generationTime": 5200
  },
  "completedAt": "2025-10-23T19:05:00Z"
}
```

### 5. Queue Statistics
```
GET /api/generation/queue/stats
```

**Response**:
```json
{
  "success": true,
  "queue": {
    "queueSize": 2,
    "activeJobs": 1,
    "totalProcessed": 45
  },
  "circuitBreaker": {
    "state": "CLOSED|OPEN|HALF_OPEN",
    "failureCount": 0,
    "successCount": 45
  }
}
```

---

## Best Practices

### Caching Strategy
- **Templates**: 30 min cache (rarely change)
- **Workspaces**: 5 min cache (stable metadata)
- **Search results**: 10 min cache
- **Queue stats**: 2 min cache (real-time)

### Error Handling
- Check `success` field in all responses
- Use `error` field for error messages
- Implement retry logic for 5xx errors
- Respect circuit breaker state

### Performance
- Use pagination for large result sets
- Leverage caching for repeated queries
- Monitor response times
- Profile with performance tools

### Security
- Always include authentication headers if needed
- Validate input data
- Use HTTPS in production
- Rotate API keys regularly

### Rate Limiting
- Implement client-side rate limiting
- Respect server timeout (15 seconds)
- Queue long-running operations
- Monitor circuit breaker state

---

## Example Usage

### Complete Flow Example

```javascript
// 1. Get workspace
const workspaces = await fetch('/api/workspaces').then(r => r.json());
const workspaceId = workspaces[0]._id;

// 2. Generate with retry (fast, synchronous)
const result1 = await fetch('/api/generation/generate-with-retry', {
  method: 'POST',
  body: JSON.stringify({
    workspaceId,
    userPrompt: "Add authentication"
  })
}).then(r => r.json());

// 3. Generate queued (async, monitor progress)
const queueResult = await fetch('/api/generation/generate-queued', {
  method: 'POST',
  body: JSON.stringify({
    workspaceId,
    userPrompt: "Add real-time features"
  })
}).then(r => r.json());

// 4. Poll job status
const checkStatus = async (jobId) => {
  const status = await fetch(`/api/generation/queue/${jobId}/status`)
    .then(r => r.json());
  return status;
};

// 5. Get result when complete
const result = await fetch(`/api/generation/queue/${queueResult.jobId}/result`)
  .then(r => r.json());
```

---

## Support & Documentation

- **Status**: /health
- **API Health**: /api/generation/health
- **KB Health**: /api/kb/health
- **Issues**: Check error messages and circuit breaker state
- **Monitoring**: Queue stats at /api/generation/queue/stats

---

**API Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 2, 2025
