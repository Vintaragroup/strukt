# Phase 3 API Reference - Complete Endpoint Guide

**Generated**: October 23, 2025  
**Phase 3 Status**: 50% Complete (Tasks 3.1-3.5)  
**Total Endpoints**: 18 fully documented  

---

## Base URL

```
http://localhost:5050/api
```

---

## PRD Templates (7 Endpoints)

### 1. List All PRD Templates
```
GET /prd-templates
```

**Description**: Retrieve all PRD templates

**Response**:
```json
{
  "templates": [
    {
      "_id": "ObjectId",
      "template_id": "frontend_react_002",
      "name": "React Frontend Application PRD",
      "category": "Frontend",
      "description": "Modern React web application...",
      "sections": [
        { "title": "Overview", "key": "overview", "content": "..." }
      ],
      "tags": ["react", "frontend", "vite"],
      "complexity": "medium"
    }
  ],
  "total": 10
}
```

---

### 2. Get Single PRD Template
```
GET /prd-templates/:id
```

**Parameters**: 
- `id` (string): MongoDB ObjectId

**Response**: Single template object

---

### 3. Filter by Category
```
GET /prd-templates/category/:category
```

**Parameters**:
- `category` (string): e.g., "Frontend", "Backend", "Mobile"

**Response**: Array of templates in category

**Example**: `GET /prd-templates/category/Frontend`

---

### 4. Filter by Tags
```
GET /prd-templates/search/by-tags
```

**Query Parameters**:
- `tags` (string array): Comma-separated or multiple params
- `matchAll` (boolean): true = AND, false = OR (default)

**Example**: 
```
GET /prd-templates/search/by-tags?tags=react,frontend&matchAll=true
```

**Response**:
```json
{
  "templates": [...],
  "count": 2
}
```

---

### 5. Get Statistics
```
GET /prd-templates/stats/summary
```

**Description**: Get overall PRD template statistics

**Response**:
```json
{
  "totalTemplates": 10,
  "categoriesCount": 10,
  "tagsCount": 48,
  "complexity": {
    "high": 5,
    "medium": 5,
    "low": 0
  },
  "allCategories": ["Frontend", "Backend", ...],
  "allTags": ["react", "typescript", ...]
}
```

---

### 6. Get All Categories
```
GET /prd-templates/categories
```

**Response**:
```json
{
  "categories": [
    { "name": "Frontend", "count": 2 },
    { "name": "Backend", "count": 2 }
  ]
}
```

---

### 7. Get All Tags
```
GET /prd-templates/tags
```

**Response**:
```json
{
  "tags": [
    { "name": "react", "count": 5 },
    { "name": "typescript", "count": 8 }
  ]
}
```

---

## Context Injection (4 Endpoints)

### 1. Get Full Context for Generation
```
POST /workspaces/:id/context
```

**Description**: Get complete context with system and user prompts

**Parameters**:
- `id` (string): Workspace MongoDB ObjectId

**Response**:
```json
{
  "success": true,
  "data": {
    "workspace": {
      "name": "E-Commerce Platform",
      "nodeCount": 6,
      "edgeCount": 6,
      "archetypes": ["root", "frontend", "backend", "requirement"],
      "technologies": ["React", "Node.js", "MongoDB"],
      "requirements": ["Browse products", "Checkout", "Payments"]
    },
    "prdTemplate": {
      "template_id": "frontend_react_002",
      "name": "React Frontend Application PRD",
      "matchConfidence": 59
    },
    "prompts": {
      "system": "You are an expert software architect...",
      "user": "## Workspace Analysis Request\n\n### Workspace Information..."
    },
    "context": "WORKSPACE CONTEXT SUMMARY\n========================\nName: E-Commerce Platform..."
  }
}
```

**Use Case**: Feed to GPT-4o for generation

---

### 2. Get Workspace Analysis
```
GET /workspaces/:id/analysis
```

**Description**: Get structured workspace analysis only

**Response**:
```json
{
  "success": true,
  "workspaceName": "E-Commerce Platform",
  "data": {
    "summary": "6 components with 6 connections. Types: root, frontend, backend, requirement.",
    "components": [
      { "type": "root", "count": 1 },
      { "type": "frontend", "count": 1 },
      { "type": "backend", "count": 1 },
      { "type": "requirement", "count": 3 }
    ],
    "complexity": "medium",
    "recommendations": []
  }
}
```

---

### 3. Get PRD Match for Workspace
```
POST /workspaces/:id/context/prd-match
```

**Description**: Find best-matching PRD template for workspace

**Body** (optional):
```json
{
  "manualPrdId": "template_id"  // Optional override
}
```

**Response**:
```json
{
  "success": true,
  "prdMatch": {
    "template_id": "frontend_react_002",
    "name": "React Frontend Application PRD",
    "category": "Frontend",
    "matchConfidence": 59
  },
  "analysis": {
    "workspaceDescription": "frontend: React Frontend...",
    "suggestedCategory": "Frontend"
  }
}
```

---

### 4. Get Lightweight Context Summary
```
GET /workspaces/:id/context/summary
```

**Description**: Get context without full prompts (for caching/display)

**Response**:
```json
{
  "success": true,
  "data": {
    "workspace": {
      "name": "E-Commerce Platform",
      "nodeCount": 6,
      "technologies": ["React", "Node.js", "MongoDB"]
    },
    "analysis": {
      "workspaceDescription": "...",
      "suggestedCategory": "Frontend"
    },
    "prdMatched": true
  }
}
```

---

## Generation (4 Endpoints)

### 1. Check Generation Service Health
```
GET /generation/health
```

**Description**: Check if GPT-4o generation is available

**Response** (with API key):
```json
{
  "available": true,
  "model": "gpt-4o",
  "fallback": "gpt-4o-mini"
}
```

**Response** (without API key):
```json
{
  "available": false,
  "error": "OPENAI_API_KEY environment variable not set",
  "model": "gpt-4o",
  "fallback": "gpt-4o-mini"
}
```

---

### 2. Generate Workspace with Full Pipeline
```
POST /generation/generate
```

**Description**: Complete generation pipeline (context → AI → parse → validate)

**Body**:
```json
{
  "workspaceId": "68fa3e0ae9e42d7b41129a53",
  "userPrompt": "Generate an e-commerce platform with React frontend and Node.js backend",
  "model": "gpt-4o"
}
```

**Response** (success):
```json
{
  "success": true,
  "workspaceId": "68fa3e0ae9e42d7b41129a53",
  "generation": {
    "success": true,
    "content": "Based on the workspace analysis, I recommend...",
    "parsed": {
      "nodes": [
        {
          "id": "frontend",
          "type": "root",
          "label": "React UI",
          "description": "Customer-facing web interface"
        }
      ],
      "edges": [
        {
          "source": "frontend",
          "target": "backend",
          "label": "HTTP API calls"
        }
      ]
    },
    "validation": {
      "valid": true,
      "errors": []
    },
    "tokensUsed": {
      "prompt": 1250,
      "completion": 850,
      "total": 2100
    }
  }
}
```

**Response** (error - no API key):
```json
{
  "success": false,
  "generation": {
    "success": false,
    "error": "OPENAI_API_KEY environment variable not set"
  }
}
```

---

### 3. Parse AI-Generated Content
```
POST /generation/parse
```

**Description**: Parse AI response into structured format

**Body**:
```json
{
  "content": "```json\n{\"nodes\": [...], \"edges\": [...]}\n```"
}
```

**Supported Formats**:
1. JSON code block: \`\`\`json {...}\`\`\`
2. Raw JSON: {...}
3. Text patterns: "- Node Name (type): description"

**Response**:
```json
{
  "success": true,
  "parsed": {
    "nodes": [...],
    "edges": [...],
    "summary": "Generated architecture..."
  },
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

---

### 4. Validate Workspace Structure
```
POST /generation/validate
```

**Description**: Pre-flight validation of workspace structure

**Body**:
```json
{
  "nodes": [
    {
      "id": "frontend",
      "type": "root",
      "label": "Frontend",
      "description": "React UI"
    }
  ],
  "edges": [
    {
      "source": "frontend",
      "target": "backend"
    }
  ]
}
```

**Validation Rules**:
- ✓ Minimum 1 node required
- ✓ All nodes must have `label` and `type`
- ✓ All edge references must point to valid node IDs

**Response** (valid):
```json
{
  "success": true,
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

**Response** (invalid):
```json
{
  "success": false,
  "validation": {
    "valid": false,
    "errors": [
      "At least 1 node required",
      "Edge source \"unknown\" does not reference valid node"
    ]
  }
}
```

---

## Workspace Management (3 Endpoints)

### 1. Create Workspace
```
POST /workspaces
```

**Body**:
```json
{
  "name": "E-Commerce Platform",
  "nodes": [
    {
      "id": "root",
      "type": "root",
      "label": "Platform",
      "description": "E-commerce system"
    }
  ],
  "edges": []
}
```

**Response**: Created workspace object with `_id`

---

### 2. Get All Workspaces
```
GET /workspaces
```

**Response**: Array of workspace objects

---

### 3. Get Workspace by ID
```
GET /workspaces/:id
```

**Response**: Single workspace object

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 404 | Resource not found |
| 500 | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": "Detailed error message",
  "validation": {
    "errors": ["Specific issue 1", "Specific issue 2"]
  }
}
```

---

## Environment Requirements

### Required

- `NODE_ENV` = "development" or "production"
- `MONGODB_URI` = MongoDB connection string
- `PORT` = Server port (default: 5050)

### Optional (for generation)

- `OPENAI_API_KEY` = OpenAI API key
  - Leave unset to use heuristic generation
  - Set to use GPT-4o for full capabilities

---

## Usage Examples

### Complete Generation Workflow

```bash
# 1. Check if generation available
curl http://localhost:5050/api/generation/health

# 2. Get full context
curl -X POST http://localhost:5050/api/workspaces/68fa3e0ae9e42d7b41129a53/context

# 3. Generate workspace
curl -X POST http://localhost:5050/api/generation/generate \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "68fa3e0ae9e42d7b41129a53",
    "userPrompt": "Create a real-time chat application"
  }'

# 4. Parse response (if needed)
curl -X POST http://localhost:5050/api/generation/parse \
  -H "Content-Type: application/json" \
  -d '{"content": "..."}'

# 5. Validate structure
curl -X POST http://localhost:5050/api/generation/validate \
  -H "Content-Type: application/json" \
  -d '{"nodes": [...], "edges": [...]}'
```

### Get PRD Recommendations

```bash
# Find all Frontend templates
curl "http://localhost:5050/api/prd-templates/category/Frontend"

# Search by tags
curl "http://localhost:5050/api/prd-templates/search/by-tags?tags=react,typescript"

# Get all available tags
curl "http://localhost:5050/api/prd-templates/tags"
```

---

## Performance Considerations

### Caching

- **PRD Retrieval**: LRU cache (50 items, 5 min TTL)
- **Context**: No cache (generated fresh)
- **Generation**: Depends on OpenAI response time (1-5 sec)

### Rate Limiting

- Not yet implemented
- Recommend adding before production
- OpenAI has built-in rate limits

### Token Costs

- Small workspace: ~500-1000 tokens (~$0.01)
- Medium workspace: ~1000-2000 tokens (~$0.02)
- Large workspace: ~2000-4000 tokens (~$0.04)

---

## Data Models

### Workspace
```typescript
{
  _id: ObjectId,
  name: string,
  nodes: Array<{id, type, label, description}>,
  edges: Array<{source, target, label}>,
  createdAt: Date,
  updatedAt: Date
}
```

### PRDTemplate
```typescript
{
  _id: ObjectId,
  template_id: string,
  name: string,
  category: string,
  description: string,
  sections: Array<{title, key, content}>,
  tags: string[],
  complexity: "low" | "medium" | "high",
  embedding: Vector3072,
  createdAt: Date
}
```

### GenerationRequest
```typescript
{
  _id: ObjectId,
  workspaceId: string,
  userPrompt: string,
  modelName: "gpt-4o" | "gpt-4o-mini",
  status: "pending" | "processing" | "complete" | "failed",
  generatedContent?: string,
  parsedContent?: {nodes, edges},
  validation?: {valid, errors},
  tokensUsed?: {prompt, completion, total},
  error?: string,
  completedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Next Features (Tasks 3.6-3.10)

- [ ] Persistence: Save generated workspaces
- [ ] Versioning: Track workspace history
- [ ] Error Recovery: Retry logic
- [ ] Frontend UI: Integration with React whiteboard
- [ ] Performance: Optimization and monitoring
