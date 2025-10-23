# Visual Requirements Whiteboard

A collaborative web-based whiteboard for mapping project architecture, dependencies, and requirements.

## Features

- **Visual Node Graph**: Create and connect nodes representing frontend, backend, requirements, and documentation.
- **Workspace Management**: Save and load workspaces by name.
- **Guest & Authenticated Modes**: Browse as a guest or sign in to manage personal workspaces.
- **AI Suggestions** (Optional): Get intelligent node suggestions powered by OpenAI (or heuristics if API key not set).
- **Real-time Collaboration**: Autosave with explicit save/load controls.
- **Cycle Prevention**: Maintains acyclic graph structure automatically.
- **Undo/Redo**: Up to 50 steps of local history.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (Atlas or local via Docker)

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Environment Configuration

**server/.env**
```
PORT=5050
MONGODB_URI=mongodb://localhost:27017/whiteboard
# OPENAI_API_KEY= (optional)
JWT_SECRET=your-secret-key
```

**client/.env**
```
VITE_API_URL=http://localhost:5050
```

### Run Locally

**Option 1: Start MongoDB locally with Docker**
```bash
docker-compose up -d mongo mongo-express
```

**Option 2: Use MongoDB Atlas**
- Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Update `MONGODB_URI` in `server/.env`

**Start the dev server & client**
```bash
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:5050
- **Mongo Express** (if using Docker): http://localhost:8081

## Project Structure

```
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components (Whiteboard)
│   │   ├── store/               # Zustand state management
│   │   ├── api/                 # API client & hooks
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                      # Node.js + Express backend
│   ├── src/
│   │   ├── config/              # Configuration (env, constants)
│   │   ├── db/                  # Database connection
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Auth, validation, logging
│   │   ├── utils/               # Helper functions
│   │   └── index.ts             # Entry point
│   ├── tsconfig.json
│   ├── package.json
│   └── .env (not committed)
│
├── docker-compose.yml           # MongoDB + mongo-express
├── package.json                 # Root scripts
└── README.md
```

## API Endpoints

### Workspaces

- `GET /api/workspaces` — List workspaces (filtered by `ownerId` if authenticated)
- `POST /api/workspaces` — Create new workspace
- `GET /api/workspaces/:name` — Get workspace by name
- `PUT /api/workspaces/:name` — Update workspace (nodes, edges)
- `DELETE /api/workspaces/:name` — Delete workspace

### AI Suggestions

- `POST /api/ai/suggest` — Get node suggestions for current workspace

## Development

### Client Development

```bash
npm --prefix client run dev
npm --prefix client run build
npm --prefix client run lint
```

### Server Development

```bash
npm --prefix server run dev
npm --prefix server run build
npm --prefix server run lint
```

### Both Simultaneously

```bash
npm run dev
```

## Tech Stack

- **Frontend**: React 18, Vite, React Flow, Zustand, Axios, TypeScript
- **Backend**: Node.js, Express, MongoDB, Mongoose, Zod, Helmet, Morgan
- **Optional**: OpenAI API for AI suggestions
- **DevOps**: Docker, Docker Compose

## Acceptance Criteria (MVP)

- ✅ Open `http://localhost:5173` and see grid canvas with toolbar
- ✅ Add exactly one `root` node per workspace
- ✅ Add frontend/backend/requirement/doc nodes and connect them
- ✅ Graph prevents cycles (DAG enforcement)
- ✅ Save to MongoDB and load by name
- ✅ AI Suggest returns typed suggestions (OpenAI if key set, heuristics otherwise)
- ✅ Server validates input shapes and returns 400 on invalid data

## Roadmap (Phase 2)

- Auto-layout with `dagre` or `elkjs`
- Pre-built templates ("SPA + API + Mongo", etc.)
- Export workspace to Markdown requirements doc
- Role-based access (viewer/editor)
- Cloud deployment (Render/Fly.io + Netlify/Vercel)
- Real-time multiplayer sync (WebSocket)

## License

MIT
