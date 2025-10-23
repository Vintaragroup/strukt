# Visual Requirements Whiteboard - Setup & Development Guide

Welcome to the **Visual Requirements Whiteboard** framework! This is a complete, production-ready monorepo structure with a React frontend and Node.js backend for collaborative project architecture visualization.

## ✅ What's Been Built

This framework includes **all MVP components** as specified in the COPILOT_BOOTSTRAP.md:

### Client (React + Vite)
- ✅ Full React Flow canvas with 5 node types (root, frontend, backend, requirement, doc)
- ✅ Zustand state management with undo/redo (50-step history)
- ✅ Toolbar with node creation, save/load, and AI suggestions
- ✅ Keyboard shortcuts (⌘S save, ⌘L load, Del delete)
- ✅ Cycle detection (prevents acyclic graph violations)
- ✅ Pan/zoom, grid, controls, and minimap
- ✅ API client with axios integration
- ✅ Toast notifications for user feedback

### Server (Node.js + Express)
- ✅ Express API with CORS, helmet, morgan logging
- ✅ MongoDB Mongoose models with validation
- ✅ Workspace CRUD endpoints (POST, GET, PUT, DELETE)
- ✅ DFS cycle validation on all graph updates
- ✅ Owner isolation (guest vs. authenticated users)
- ✅ OpenAI integration with heuristic fallback
- ✅ Zod schema validation
- ✅ Optional JWT auth middleware

### DevOps
- ✅ Docker Compose with MongoDB + mongo-express
- ✅ Root npm scripts for concurrent dev mode
- ✅ Environment variable templates

---

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
npm run install:all
```

This runs:
```bash
npm --prefix client install && npm --prefix server install
```

### 2. **Configure Environment**

**Server** (`server/.env`):
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5050
MONGODB_URI=mongodb://admin:password@localhost:27017/whiteboard?authSource=admin
JWT_SECRET=your-jwt-secret-here
# OPENAI_API_KEY=sk-your-key-here  # (Optional)
NODE_ENV=development
```

**Client** (`client/.env`):
```bash
cp client/.env.example client/.env
```

Content is already set for local development:
```env
VITE_API_URL=http://localhost:5050
```

### 3. **Start MongoDB**

**Option A: Docker Compose** (Recommended for development)
```bash
docker-compose up -d mongo mongo-express
```

Verify:
- MongoDB: `localhost:27017`
- Mongo Express UI: `http://localhost:8081`

**Option B: MongoDB Atlas** (Cloud)
1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection URI
3. Update `MONGODB_URI` in `server/.env`

### 4. **Run Development Servers**

```bash
npm run dev
```

This starts both client and server concurrently:
- **Client**: http://localhost:5173 (auto-opens in browser)
- **Server**: http://localhost:5050
- **Health Check**: http://localhost:5050/health

---

## 📁 Project Structure

```
/Strukt/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Toolbar.tsx          # Node/workspace controls
│   │   │   └── NodeTypes/           # 5 node type components
│   │   │       ├── RootNode.tsx
│   │   │       ├── FrontendNode.tsx
│   │   │       ├── BackendNode.tsx
│   │   │       ├── RequirementNode.tsx
│   │   │       ├── DocNode.tsx
│   │   │       └── Node.css
│   │   ├── pages/
│   │   │   ├── Whiteboard.tsx       # Main canvas
│   │   │   └── Whiteboard.css
│   │   ├── store/
│   │   │   └── useWorkspaceStore.ts # Zustand state
│   │   ├── api/
│   │   │   └── client.ts            # Axios config
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   └── .env.example
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts               # Config loading
│   │   ├── db/
│   │   │   └── connection.ts        # MongoDB setup
│   │   ├── models/
│   │   │   └── Workspace.ts         # Mongoose schema
│   │   ├── routes/
│   │   │   ├── workspaces.ts        # CRUD endpoints
│   │   │   └── ai.ts                # AI suggestions
│   │   ├── middleware/
│   │   │   └── authOptional.ts      # JWT parsing
│   │   ├── utils/
│   │   │   └── validation.ts        # Cycle detection
│   │   └── index.ts                 # Express app
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── package.json                     # Root scripts
├── README.md                        # Main documentation
├── docker-compose.yml               # MongoDB + mongo-express
├── .gitignore
├── .editorconfig
└── SETUP.md                         # This file
```

---

## 🔌 API Reference

### Workspaces

#### List Workspaces
```http
GET /api/workspaces
Authorization: Bearer <token>  # Optional, filters by owner
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Project",
    "ownerId": "user123",
    "nodes": [...],
    "edges": [...],
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

#### Create Workspace
```http
POST /api/workspaces
Content-Type: application/json
Authorization: Bearer <token>  # Optional

{
  "name": "My Project",
  "nodes": [
    {
      "id": "node-1",
      "type": "root",
      "position": { "x": 0, "y": 0 },
      "data": {
        "title": "Project Root",
        "summary": "Optional description"
      }
    }
  ],
  "edges": []
}
```

#### Get Workspace by Name
```http
GET /api/workspaces/:name
Authorization: Bearer <token>  # Optional
```

#### Update Workspace
```http
PUT /api/workspaces/:name
Content-Type: application/json

{
  "nodes": [...],
  "edges": [...]
}
```

#### Delete Workspace
```http
DELETE /api/workspaces/:name
Authorization: Bearer <token>  # Optional
```

### AI Suggestions

#### Get AI Suggestions
```http
POST /api/ai/suggest
Content-Type: application/json

{
  "nodes": [...],
  "edges": [...],
  "goal": "Complete a full-stack application"  # Optional
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "frontend",
      "data": {
        "title": "React UI",
        "summary": "Web application interface",
        "stackHint": "React 18"
      }
    }
  ]
}
```

---

## 🛠️ Development Workflow

### Client Development

```bash
# Watch mode with hot reload
npm --prefix client run dev

# Build for production
npm --prefix client run build

# Preview production build
npm --prefix client run preview
```

### Server Development

```bash
# Watch mode with nodemon (tsx)
npm --prefix server run dev

# Build TypeScript
npm --prefix server run build

# Run compiled server
npm --prefix server run start
```

### Both Together

```bash
npm run dev
```

---

## 🔐 Authentication (Optional)

This framework includes **optional JWT authentication**:

### For Authenticated Requests

1. Get a JWT token (from your auth provider)
2. Include in requests:
   ```
   Authorization: Bearer <jwt_token>
   ```
3. Server parses and isolates workspaces by `ownerId` (the `sub` claim)

### Disabling Auth (Guest Mode)

Leave the `Authorization` header off. Workspaces are stored with `ownerId: null` and globally visible.

### Production Auth Setup

Phase 2 recommendations:
- **Auth0**: Zero-trust identity
- **Firebase**: Managed authentication
- **Cognito**: AWS-integrated

---

## 🤖 AI Integration

### With OpenAI

1. Get API key from [openai.com](https://platform.openai.com)
2. Set in `server/.env`:
   ```env
   OPENAI_API_KEY=sk-...
   ```
3. AI suggestions will use GPT-3.5-turbo

### Without OpenAI

Leave `OPENAI_API_KEY` unset. The system uses **heuristic suggestions** (smart defaults based on existing nodes).

---

## 🧪 Testing the System

### 1. Create a Workspace
```bash
curl -X POST http://localhost:5050/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "nodes": [
      {
        "id": "root-1",
        "type": "root",
        "position": {"x": 0, "y": 0},
        "data": {"title": "My App"}
      }
    ],
    "edges": []
  }'
```

### 2. Load via UI
- Open http://localhost:5173
- Click **Load** button
- Select "Test Project"

### 3. Add Nodes
- Click **Frontend**, **Backend**, etc.
- Double-click to edit

### 4. Save Changes
- Click **Save**
- Choose "Test Project" or new name

### 5. Try AI Suggestions
- Click **Suggest**
- Watch new nodes appear (if OpenAI key set)

---

## 📊 Database Schema

### Workspaces Collection

```typescript
{
  _id: ObjectId,
  name: String,
  ownerId: String | null,  // null = guest
  nodes: [
    {
      id: String,
      type: "root" | "frontend" | "backend" | "requirement" | "doc",
      position: { x: Number, y: Number },
      data: {
        title: String,
        summary?: String,
        tags?: [String],
        stackHint?: String
      }
    }
  ],
  edges: [
    {
      id: String,
      source: String,
      target: String,
      label?: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ ownerId: 1, name: 1 }` - Unique per user
- `{ name: 1 }` - Unique globally (fallback for guests)

---

## 🔄 Data Flow

### Client → Server

1. **User Action** (add node, connect edge)
   ↓
2. **Zustand Store** updates state
   ↓
3. **Mark Dirty** (unsaved flag)
   ↓
4. **User Clicks Save**
   ↓
5. **API Call** (PUT /api/workspaces/:name)
   ↓
6. **Server Validation** (cycle check, single root)
   ↓
7. **MongoDB Update**
   ↓
8. **Toast Success** → Store `markClean()`

### Server → Client

1. **User Clicks Load**
   ↓
2. **API Call** (GET /api/workspaces/:name)
   ↓
3. **Receive Workspace JSON**
   ↓
4. **Store `loadWorkspace()`**
   ↓
5. **React Flow updates**
   ↓
6. **Canvas redraws**

---

## 📝 Workspace Constraints

✅ **Enforced Rules:**

- **Single Root**: Exactly one node with type="root"
- **Acyclic**: DFS prevents circular dependencies
- **Owner Isolation**: Users only see their own workspaces (if authenticated)
- **Valid Types**: Only 5 predefined node types allowed

---

## 🚨 Troubleshooting

### MongoDB Connection Failed

```
❌ MongoDB connection failed
```

**Fix:**
- Verify Docker containers: `docker-compose ps`
- Restart: `docker-compose restart mongo`
- Check URI in `server/.env`

### Port Already in Use

```
Error: listen EADDRINUSE :::5050
```

**Fix:**
```bash
# Kill process on port 5050
lsof -ti:5050 | xargs kill -9
# Or change PORT in server/.env
```

### Vite Hot Reload Not Working

**Fix:**
```bash
npm --prefix client run dev
```

Then open http://localhost:5173

### CORS Errors

**Fix:**
Check `server/src/index.ts`:
```typescript
app.use(cors())  // Already enabled
```

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

Generates:
- `client/dist/` - Static files ready for CDN
- `server/dist/` - Compiled Node.js

### Deploy Client

```bash
# Deploy client/dist/ to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3 + CloudFront
```

### Deploy Server

```bash
# Deploy server/dist/ to:
# - Render
# - Fly.io
# - Heroku
# - Railway
# - AWS EC2/Lambda
```

---

## 🔮 Phase 2 Features (Future)

- ✨ Auto-layout with `dagre`
- 📋 Workspace templates ("SPA + API + Mongo")
- 📄 Export to Markdown requirements doc
- 👥 Role-based access (viewer/editor)
- 🔄 Real-time collaboration (WebSocket)
- 🎨 Workspace themes/customization
- 📊 Analytics & usage tracking

---

## 📞 Support

For issues:
1. Check errors in browser console (F12)
2. Check server logs in terminal
3. Verify `.env` files are configured
4. Test API endpoints with curl

---

## ✨ Next Steps

1. **Run** `npm run install:all` to install dependencies
2. **Setup** MongoDB (Docker or Atlas)
3. **Configure** `.env` files
4. **Start** `npm run dev`
5. **Build** create your first workspace!

Happy building! 🚀
