# 🏗️ Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                      http://localhost:5173                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌─────────────────────────────────┐   │
│  │  Whiteboard  │◄────────►│   React Flow Canvas            │   │
│  │   Component  │         │   • Grid, Pan, Zoom            │   │
│  └──────┬───────┘         │   • 5 Node Types               │   │
│         │                  │   • Connection Edges            │   │
│         │                  │   • Mini Map, Controls          │   │
│         ▼                  └─────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Zustand Store (useWorkspaceStore)             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ State:                                                   │   │
│  │  • nodes[]       - Current nodes                        │   │
│  │  • edges[]       - Current edges                        │   │
│  │  • isDirty       - Unsaved flag                         │   │
│  │  • history[]     - Undo/redo (50 steps)                │   │
│  │ Actions:                                                │   │
│  │  • addNode, deleteNode, updateNode                      │   │
│  │  • addEdge, deleteEdge                                  │   │
│  │  • undo, redo                                           │   │
│  │  • save/load workspace                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         │         ┌──────────────┐                              │
│         └────────►│   Toolbar    │                              │
│                   ├──────────────┤                              │
│                   │ • Add Node   │                              │
│                   │ • Save/Load  │                              │
│                   │ • AI Suggest │                              │
│                   │ • Undo/Redo  │                              │
│                   └──────┬───────┘                              │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│   ┌──────────┐   ┌──────────┐   ┌──────────────┐               │
│   │ API Call │   │  Dialog  │   │  Toast      │               │
│   │ (axios)  │   │ (Save,   │   │ (Notify)    │               │
│   │          │   │  Load)   │   │             │               │
│   └────┬─────┘   └──────────┘   └──────────────┘               │
│        │                                                        │
└────────┼────────────────────────────────────────────────────────┘
         │ HTTP
         │ JSON
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js/Express)                     │
│                    http://localhost:5050                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Express Server (index.ts)                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Middleware:                                              │   │
│  │  • Helmet (security headers)                            │   │
│  │  • CORS (cross-origin)                                  │   │
│  │  • Morgan (logging)                                     │   │
│  │  • authOptional (JWT parsing)                           │   │
│  │                                                          │   │
│  │ Routes:                                                  │   │
│  │  • GET  /api/workspaces           - List                │   │
│  │  • POST /api/workspaces           - Create              │   │
│  │  • GET  /api/workspaces/:name     - Get                 │   │
│  │  • PUT  /api/workspaces/:name     - Update              │   │
│  │  • DEL  /api/workspaces/:name     - Delete              │   │
│  │  • POST /api/ai/suggest           - AI suggestions      │   │
│  └──────┬──────────────────────────────────────────────────┘   │
│         │                                                        │
│         ├─────────────────────┬────────────────────┐            │
│         ▼                     ▼                    ▼            │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐     │
│  │  Workspace  │     │ Validation   │     │  AI Router  │     │
│  │  Routes     │     │ Utils        │     │             │     │
│  ├─────────────┤     ├──────────────┤     ├─────────────┤     │
│  │ • CRUD ops  │     │ • hasCycle   │     │ • OpenAI    │     │
│  │ • Validation│────►│ • countRoots │────►│ • Heuristics│     │
│  │ • Owner     │     │ • Edge valid │     │             │     │
│  │   isolation │     │              │     │             │     │
│  └─────────────┘     └──────────────┘     └─────────────┘     │
│         │                                                        │
│         │             ┌──────────────────┐                      │
│         └────────────►│  Workspace Model │                      │
│                       ├──────────────────┤                      │
│                       │ Mongoose Schema: │                      │
│                       │  • name          │                      │
│                       │  • ownerId       │                      │
│                       │  • nodes[]       │                      │
│                       │  • edges[]       │                      │
│                       │  • timestamps    │                      │
│                       └────────┬─────────┘                      │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │ Query/Insert/Update
                                 ▼
                    ┌─────────────────────────┐
                    │   MongoDB Atlas         │
                    │  mongodb://...          │
                    ├─────────────────────────┤
                    │ Database: whiteboard    │
                    │ Collection: workspaces  │
                    │                         │
                    │ Documents:              │
                    │ {_id, name, ownerId,    │
                    │  nodes[], edges[],      │
                    │  timestamps}            │
                    └─────────────────────────┘
```

---

## Component Hierarchy

```
App
├── Whiteboard
│   ├── Toolbar
│   │   ├── Add Root Button
│   │   ├── Add Node Buttons (Frontend, Backend, Requirement, Doc)
│   │   ├── Save Button
│   │   │   └── Save Dialog Modal
│   │   ├── Load Button
│   │   │   └── Load Dialog Modal
│   │   ├── AI Suggest Button
│   │   ├── Undo/Redo Buttons
│   │   └── Toast Notifications
│   └── ReactFlow Canvas
│       ├── RootNode
│       │   ├── Badge
│       │   ├── Content (or Edit Mode)
│       │   └── Handle (for connections)
│       ├── FrontendNode
│       │   ├── Badge
│       │   ├── Content (or Edit Mode)
│       │   └── Handle
│       ├── BackendNode
│       │   ├── Badge
│       │   ├── Content (or Edit Mode)
│       │   └── Handle
│       ├── RequirementNode
│       │   ├── Badge
│       │   ├── Content (or Edit Mode)
│       │   └── Handle
│       ├── DocNode
│       │   ├── Badge
│       │   ├── Content (or Edit Mode)
│       │   └── Handle
│       ├── Edges (connections between nodes)
│       ├── Background (grid)
│       ├── Controls (zoom, fit)
│       └── MiniMap
```

---

## Data Flow: Save Workspace

```
User clicks "Save"
        │
        ▼
┌───────────────────┐
│ Save Dialog Opens │
└────────┬──────────┘
         │
         ▼ User enters name
┌───────────────────┐
│ Validate Name     │
└────────┬──────────┘
         │
         ▼
┌───────────────────────────────────────┐
│ API Call: PUT /api/workspaces/:name   │
│ Body: {nodes[], edges[]}              │
└────────┬────────────────────────────────┘
         │ Axios with auth header
         ▼
┌─────────────────────────────────────┐
│ Server Receives Request              │
└────────┬────────────────────────────┘
         │
         ├─────────────────────────────┐
         ▼                             ▼
    ┌─────────────┐        ┌──────────────────┐
    │  Auth       │        │  Validate Schema │
    │  Middleware │        │  (Zod)           │
    │  Parse JWT  │        │                  │
    └────┬────────┘        └────────┬─────────┘
         │                         │
         ▼                         ▼
    ┌──────────────┐        ┌────────────────────┐
    │  Extract     │        │  Count Root Nodes  │
    │  ownerId     │        │  (must be 1)       │
    └────┬─────────┘        └────────┬───────────┘
         │                          │
         ├─────────────────────────┬┴────────────┐
         │                         │            │
         ▼                         ▼            ▼
    ┌──────────┐        ┌─────────────────┐  ┌──────────┐
    │  Filter  │        │  DFS Cycle      │  │ Validate │
    │  by Owner│        │  Detection      │  │ Node     │
    │          │        │                 │  │ Types    │
    └────┬─────┘        └────────┬────────┘  └────┬─────┘
         │                       │                │
         └───────────┬───────────┴────────────────┘
                     │
                     ▼ All validations pass?
              ┌─────────────────┐
              │  YES: Continue  │
              └────────┬────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │  MongoDB Update:     │
              │  findOneAndUpdate    │
              │  {name, ownerId}     │
              └────────┬─────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │ Update Successful    │
              └────────┬─────────────┘
                       │
                       ▼ Send back updated document
              ┌──────────────────────┐
              │  Client receives 200 │
              │  Response JSON       │
              └────────┬─────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │  Store.markClean()   │
              │  Close Modal         │
              │  Show Toast Success  │
              └──────────────────────┘

              If validation fails:
                       │
                       ▼ (at any step above)
              ┌──────────────────────┐
              │  Return 400/409      │
              │  Error Message       │
              └────────┬─────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │  Client receives err │
              └────────┬─────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │  Show Toast Error    │
              │  Stay in Dialog      │
              └──────────────────────┘
```

---

## Data Flow: Load Workspace

```
User clicks "Load"
        │
        ▼
┌──────────────────────┐
│ List Dialog Opens    │
│ API: GET /api/...    │
└────────┬─────────────┘
         │
         ▼ Server filters by ownerId
┌──────────────────────┐
│ Returns workspace    │
│ list                 │
└────────┬─────────────┘
         │
         ▼ Display in dialog
User selects workspace
        │
        ▼
┌──────────────────────────────┐
│ API: GET /api/workspaces/:name
└────────┬─────────────────────┘
         │
         ▼ Server validates owner
┌──────────────────────────┐
│ Returns workspace JSON   │
│ {nodes[], edges[]}       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ store.loadWorkspace()    │
│ Replace state with data  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ React Flow re-renders    │
│ Canvas updates           │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Close Dialog             │
│ Show Toast Success       │
└──────────────────────────┘
```

---

## Database Schema Visualization

```
┌────────────────────────────────────────────────────────────────┐
│                    Workspaces Collection                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Document {                                                     │
│   _id: ObjectId,                                               │
│   name: "My SPA Project",                                      │
│   ownerId: "user123" | null,                                   │
│                                                                 │
│   nodes: [                                                     │
│     {                                                          │
│       id: "root-1",                                            │
│       type: "root",                                            │
│       position: { x: 0, y: 0 },                                │
│       data: {                                                  │
│         title: "SPA Monorepo",                                 │
│         summary: "Full-stack React + Node app",               │
│         stackHint: "React, Node.js, MongoDB"                   │
│       }                                                        │
│     },                                                         │
│     {                                                          │
│       id: "frontend-1",                                        │
│       type: "frontend",                                        │
│       position: { x: -200, y: 100 },                           │
│       data: {                                                  │
│         title: "Web UI",                                       │
│         summary: "React components",                           │
│         stackHint: "React 18, Vite"                            │
│       }                                                        │
│     },                                                         │
│     {                                                          │
│       id: "backend-1",                                         │
│       type: "backend",                                         │
│       position: { x: 200, y: 100 },                            │
│       data: {                                                  │
│         title: "REST API",                                     │
│         summary: "Express server",                             │
│         stackHint: "Node.js, Express"                          │
│       }                                                        │
│     },                                                         │
│     ...                                                        │
│   ],                                                           │
│                                                                 │
│   edges: [                                                     │
│     {                                                          │
│       id: "edge-1",                                            │
│       source: "root-1",                                        │
│       target: "frontend-1"                                     │
│     },                                                         │
│     {                                                          │
│       id: "edge-2",                                            │
│       source: "root-1",                                        │
│       target: "backend-1"                                      │
│     },                                                         │
│     ...                                                        │
│   ],                                                           │
│                                                                 │
│   createdAt: "2025-01-15T10:30:00Z",                           │
│   updatedAt: "2025-01-15T12:45:00Z"                            │
│ }                                                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## State Machine: Workspace States

```
┌─────────────────┐
│   NEW/EMPTY     │ ← User creates/loads workspace
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   EDITING       │ ← User modifies nodes/edges
└────────┬────────┘
         │
         ├─ isDirty = true
         │
         ▼
┌─────────────────┐
│   UNSAVED       │ ← Waiting for save
└────────┬────────┘
         │
         ├─ User clicks Save
         │
         ▼
┌─────────────────┐
│   SAVING        │ ← API in flight
└────────┬────────┘
         │
         ├─ Success? Yes ──►┌──────────────┐
         │                  │   SAVED      │ ← isDirty = false
         │                  └──────────────┘
         │
         └─ Failure ──────────┐
                              │
                              ▼
                        ┌──────────────┐
                        │   ERROR      │ ← Show toast, stay in UNSAVED
                        └──────────────┘
```

---

## Validation Flow

```
Client-Side Validation
(Instant)
│
├─ Only 1 root node?
├─ No cycles? (DFS check)
├─ Valid node types?
├─ Valid positions?
│
└─ Block if fails
   (No API call)

    │
    ▼

Server-Side Validation
(On save/update)
│
├─ Zod schema check
├─ Only 1 root node?
├─ No cycles? (DFS check)
├─ Valid node types?
├─ Owner match?
├─ MongoDB unique constraint
│
└─ Reject with 400/409 if fails
   (Return error message)

    │
    ▼

Data Persisted
(Success)
```

---

This framework is production-ready and fully visualized! 🎉
