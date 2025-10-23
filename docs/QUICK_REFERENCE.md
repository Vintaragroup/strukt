# 🚀 Quick Reference Guide

## One-Liner Setup

```bash
npm run install:all && \
cp server/.env.example server/.env && \
cp client/.env.example client/.env && \
docker-compose up -d mongo mongo-express && \
npm run dev
```

Then open **http://localhost:5173** ✨

---

## Key Files at a Glance

| File | Purpose |
|------|---------|
| `client/src/pages/Whiteboard.tsx` | React Flow canvas |
| `client/src/components/Toolbar.tsx` | Controls & dialogs |
| `client/src/store/useWorkspaceStore.ts` | State (Zustand) |
| `server/src/index.ts` | Express app |
| `server/src/routes/workspaces.ts` | API endpoints |
| `server/src/models/Workspace.ts` | Mongoose schema |
| `package.json` | Root scripts |
| `docker-compose.yml` | MongoDB setup |

---

## Useful Commands

```bash
# Development
npm run dev                      # Start both client + server
npm --prefix client run dev      # Client only
npm --prefix server run dev      # Server only

# Production
npm run build                    # Build both
npm --prefix server run start    # Start server

# Database
docker-compose up -d             # Start MongoDB
docker-compose down              # Stop MongoDB
docker-compose ps                # Check status

# Installation
npm run install:all              # Install all deps
npm install                      # Root deps only
npm --prefix client install      # Client deps only
npm --prefix server install      # Server deps only
```

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5050
MONGODB_URI=mongodb://admin:password@localhost:27017/whiteboard?authSource=admin
JWT_SECRET=dev-secret
OPENAI_API_KEY=sk-...           # Optional
NODE_ENV=development
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5050
```

---

## API Quick Reference

### List Workspaces
```bash
curl http://localhost:5050/api/workspaces
```

### Create Workspace
```bash
curl -X POST http://localhost:5050/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "nodes": [{"id":"root-1","type":"root","position":{"x":0,"y":0},"data":{"title":"Root"}}],
    "edges": []
  }'
```

### Get Workspace
```bash
curl http://localhost:5050/api/workspaces/My%20App
```

### Update Workspace
```bash
curl -X PUT http://localhost:5050/api/workspaces/My%20App \
  -H "Content-Type: application/json" \
  -d '{"nodes":[...],"edges":[...]}'
```

### Get AI Suggestions
```bash
curl -X POST http://localhost:5050/api/ai/suggest \
  -H "Content-Type: application/json" \
  -d '{"nodes":[...],"edges":[...]}'
```

---

## Node Content Operations (Phase 1)

### Adding Content to Nodes

1. Click the **+** button on any node
2. Select content type from menu:
   - **📝 Text** - Free-form text content
   - **✓ To-Do** - Task or checklist item
   - **❓ Get Help** - Documentation or help text
   - **📋 Generate PRD** - Requirements document

### Content Types

| Type | Icon | Use Case |
|------|------|----------|
| Text | 📝 | General notes and descriptions |
| To-Do | ✓ | Tasks, checklist items |
| Help | ❓ | Documentation, API references |
| PRD | 📋 | Product requirements |

### Editing Content

1. Click on any content badge (emoji) on a node
2. ContentEditor modal opens
3. Edit title and body text
4. Click Save to persist changes
5. Click Delete to remove content

### Content Features (Phase 1)

**✅ Content Types** (4 types):
- 📝 **Text**: Store text content, notes, descriptions
- ✓ **To-Do**: Track action items and tasks
- ❓ **Get Help**: Link to documentation and help resources
- 📋 **Generate PRD**: Store product requirement documents

**✅ Content Operations**:
- Add content: Click **+** button on any node
- Edit content: Click any content badge
- Delete content: Click Delete in editor modal
- Full undo/redo support (50-step history)
- Persists on save/load
- Timestamps (created/updated)
- Mobile responsive

### Example Usage

```
Root Node
├── 📝 Text: "Main API endpoints"
├── ✓ To-Do: "Implement authentication"
└── ❓ Help: "See OAuth 2.0 docs"

Frontend Node
├── 📋 PRD: "User interface requirements"
└── ✓ To-Do: "Build login form"
```

### How to Add Content

```
1. Click the '+' button on any node
2. Select content type from menu:
   - 📝 Text → Add text content
   - ✓ To-Do → Create a task
   - ❓ Get Help → Link documentation
   - 📋 Generate PRD → Add requirements
3. Content badge appears on node
4. Click badge to edit or delete
5. Save workspace to persist
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+S / Ctrl+S | Save workspace |
| Cmd+L / Ctrl+L | Load workspace |
| Cmd+Z / Ctrl+Z | Undo changes |
| Cmd+Y / Ctrl+Y | Redo changes |
| Escape | Close menu/modal |
| Delete / Backspace | Delete selected node |
| Double-click node | Edit node title/summary |

---

## Troubleshooting

### MongoDB Won't Connect
```bash
# Check if running
docker-compose ps

# Restart
docker-compose restart mongo

# Check logs
docker-compose logs mongo
```

### Port 5050 Already in Use
```bash
# Kill process
lsof -ti:5050 | xargs kill -9

# Or change PORT in server/.env
```

### Vite Not Serving
```bash
npm --prefix client run dev
# Then open http://localhost:5173
```

### Dependencies Not Found
```bash
npm run install:all
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript |
| State | Zustand |
| UI | React Flow, CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| Security | Helmet, CORS |
| Optional | OpenAI API, JWT |

---

## Component Structure

```
Whiteboard (canvas)
├── Toolbar (controls)
│   ├── Add Node buttons
│   ├── Save/Load dialogs
│   ├── AI Suggest button
│   └── Undo/Redo buttons
├── React Flow Canvas
│   ├── RootNode (purple)
│   ├── FrontendNode (blue)
│   ├── BackendNode (green)
│   ├── RequirementNode (orange)
│   ├── DocNode (indigo)
│   ├── Edges (connections)
│   ├── Background (grid)
│   ├── Controls (zoom, fit)
│   └── MiniMap (overview)
└── Toast Notifications
```

---

## State Flow

```
User Action
  ↓
useWorkspaceStore (Zustand)
  ├── Update nodes/edges
  ├── Record history
  └── Mark dirty
  ↓
React Flow re-renders
  ↓
User clicks Save
  ↓
API call to PUT /api/workspaces/:name
  ↓
Server validates (cycles, root, owner)
  ↓
MongoDB save
  ↓
Toast success
  ↓
Store markClean()
```

---

## Validation Rules

✅ **Client-side**
- Maximum 1 root node
- No cycles (DFS check)
- Valid node types only

✅ **Server-side**
- Same checks + database uniqueness
- Owner isolation
- Zod schema validation
- Returns 400 on invalid data

---

## Deployment Checklist

- [ ] Build: `npm run build`
- [ ] Test: `npm run dev` works locally
- [ ] Set production env vars
- [ ] Configure MongoDB Atlas
- [ ] Deploy client to Netlify/Vercel
- [ ] Deploy server to Render/Fly.io
- [ ] Test all API endpoints
- [ ] Setup monitoring/logging
- [ ] Configure auth provider (Phase 2)

---

## File Structure Quick View

```
Strukt/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Toolbar, NodeTypes
│   │   ├── pages/           # Whiteboard
│   │   ├── store/           # Zustand
│   │   ├── api/             # Axios client
│   │   ├── types/           # TypeScript
│   │   └── App.tsx, main.tsx, index.css
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── config/          # Env config
│   │   ├── db/              # MongoDB
│   │   ├── models/          # Schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth
│   │   ├── utils/           # Validation
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── package.json             # Root scripts
├── README.md
├── SETUP.md
├── docker-compose.yml
└── .gitignore, .editorconfig
```

---

## What Each Directory Does

| Dir | Contains |
|-----|----------|
| `client/src/components/` | React UI components |
| `client/src/pages/` | Page-level components |
| `client/src/store/` | Zustand state management |
| `client/src/api/` | Axios API client |
| `client/src/types/` | TypeScript interfaces |
| `server/src/config/` | Environment & settings |
| `server/src/db/` | MongoDB connection |
| `server/src/models/` | Mongoose schemas |
| `server/src/routes/` | REST API endpoints |
| `server/src/middleware/` | Express middleware |
| `server/src/utils/` | Helper functions |

---

## Common Tasks

### Add a New Node Type
1. Edit `server/src/models/Workspace.ts` - add to enum
2. Create `client/src/components/NodeTypes/MyNode.tsx`
3. Register in `client/src/pages/Whiteboard.tsx`
4. Add button in `client/src/components/Toolbar.tsx`

### Add API Endpoint
1. Create route handler in `server/src/routes/`
2. Import and register in `server/src/index.ts`
3. Use in client via `src/api/client.ts`

### Customize Styling
1. Edit `.css` files in `client/src/components/`
2. Update colors, fonts, spacing
3. Restart dev server

### Enable OpenAI
1. Get API key from openai.com
2. Set `OPENAI_API_KEY` in `server/.env`
3. Restart server
4. Click "Suggest" button

---

## Status Indicators

| Indicator | Meaning |
|-----------|---------|
| ✅ | Feature complete |
| 🔄 | Work in progress |
| 🔮 | Planned (Phase 2) |
| 📋 | Documented |
| 🧪 | Ready to test |

---

## Support Resources

1. **`README.md`** - Main documentation
2. **`SETUP.md`** - Detailed setup guide
3. **`FRAMEWORK_COMPLETE.md`** - Build summary
4. **`BUILD_CHECKLIST.md`** - Feature checklist
5. **This file** - Quick reference
6. **Code comments** - Inline explanations
7. **TypeScript types** - Type safety

---

## Remember

- 📁 All files are in `/Users/ryanmorrow/Documents/Projects2025/Strukt`
- 🚀 Start with `npm run dev` to test
- 💾 Commit often! (Git is already configured)
- 🧪 Test locally before deploying
- 📚 Read SETUP.md for detailed instructions

---

**Ready to build? Let's go! 🎉**
