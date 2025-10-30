
# Strukt AI Backend — Step‑by‑Step Implementation Guide
**Goal:** Stand up the backend services that power the AI-guided project starter, node suggestions, and “mark wrong path” feedback loop — using **Node/Express + MongoDB Atlas**, optional **Redis + BullMQ** for jobs, and clean service boundaries that your current React/XYFlow client can call.

> Use this file as a Copilot-friendly scaffold. Work through the steps in order. Each step has concrete file adds/edits, snippets, and test commands.

---

## Table of Contents
1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [Environment Variables](#3-environment-variables)
4. [Core Models (Mongoose)](#4-core-models-mongoose)
5. [Shared Types & Zod Schemas](#5-shared-types--zod-schemas)
6. [Express App & Middleware](#6-express-app--middleware)
7. [AI Service (Provider-agnostic)](#7-ai-service-provider-agnostic)
8. [Wizard Sessions API](#8-wizard-sessions-api)
9. [Suggestion Engine API](#9-suggestion-engine-api)
10. [Apply/Commit Suggestions API](#10-applycommit-suggestions-api)
11. [Feedback: Mark Wrong Path](#11-feedback-mark-wrong-path)
12. [Background Jobs (Optional, BullMQ)](#12-background-jobs-optional-bullmq)
13. [Audit Log & Snapshots](#13-audit-log--snapshots)
14. [Auth (Lightweight, Optional)](#14-auth-lightweight-optional)
15. [Testing & cURL Recipes](#15-testing--curl-recipes)
16. [Production Notes](#16-production-notes)

---

## 1) Project Setup
```bash
# from /server (or your backend root)
npm init -y
npm i express cors helmet morgan compression dotenv zod
npm i mongoose
npm i openai # or your preferred AI SDK; implementation is provider-agnostic
npm i uuid
# OPTIONAL (recommended)
npm i bullmq ioredis
# Dev
npm i -D typescript ts-node-dev @types/node @types/express @types/cors @types/morgan @types/compression
npx tsc --init
```

Update **tsconfig.json** minimal essentials:
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Add **dev/start scripts** in `package.json`:
```jsonc
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## 2) Folder Structure
```
server/
  src/
    config/
      env.ts
      mongo.ts
      redis.ts            # optional
    types/
      dto.ts
      models.ts
    models/
      WizardSession.ts
      Workspace.ts
      Node.ts
      Suggestion.ts
      Feedback.ts
      Snapshot.ts
      AuditLog.ts
    services/
      ai/
        index.ts         # provider-agnostic
        prompts.ts
      suggestion/
        engine.ts
        apply.ts
      wizard/
        orchestrator.ts
    jobs/                 # optional bg work
      queue.ts
      workers/
        suggest.worker.ts
    routes/
      index.ts
      wizard.ts
      suggestions.ts
      feedback.ts
      workspace.ts
    utils/
      logger.ts
      http.ts
    index.ts
```

---

## 3) Environment Variables
Create `.env`:
```bash
PORT=5050
MONGODB_URI="mongodb+srv://..."
OPENAI_API_KEY="sk-..."
# Optional
REDIS_URL="redis://localhost:6379"
ALLOW_ORIGIN="http://localhost:5173"
```

**src/config/env.ts**
```ts
import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 5050),
  MONGODB_URI: process.env.MONGODB_URI!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  REDIS_URL: process.env.REDIS_URL || "",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "*",
};
```

---

## 4) Core Models (Mongoose)

**src/models/Workspace.ts**
```ts
import { Schema, model, Types } from 'mongoose';

export interface Workspace {
  _id: Types.ObjectId;
  name: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<Workspace>({
  name: { type: String, required: true },
  createdBy: String,
}, { timestamps: true });

export default model<Workspace>('Workspace', WorkspaceSchema);
```

**src/models/Node.ts**
```ts
import { Schema, model, Types } from 'mongoose';

export type Domain = 'business' | 'product' | 'tech' | 'data-ai' | 'operations';

export interface UINode {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  label: string;
  type: string;           // UI node type
  domain?: Domain;
  ring?: number;
  summary?: string;
  tags?: string[];
  position: { x: number; y: number };
  pinned?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NodeSchema = new Schema<UINode>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  domain: { type: String },
  ring: { type: Number },
  summary: String,
  tags: [String],
  position: { x: Number, y: Number },
  pinned: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default model<UINode>('Node', NodeSchema);
```

**src/models/WizardSession.ts**
```ts
import { Schema, model, Types } from 'mongoose';

export interface WizardTurn {
  userText: string;
  aiText?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

export interface WizardSession {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  status: 'active' | 'completed' | 'abandoned';
  turns: WizardTurn[];
  createdAt: Date;
  updatedAt: Date;
}

const TurnSchema = new Schema<WizardTurn>({
  userText: { type: String, required: true },
  aiText: String,
  payload: Schema.Types.Mixed,
}, { _id: false, timestamps: { createdAt: true, updatedAt: false } });

const WizardSessionSchema = new Schema<WizardSession>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  turns: [TurnSchema],
}, { timestamps: true });

export default model<WizardSession>('WizardSession', WizardSessionSchema);
```

**src/models/Suggestion.ts**
```ts
import { Schema, model, Types } from 'mongoose';

export interface Suggestion {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  title: string;
  rationale: string;
  domain?: string;
  ring?: number;
  actions: Array<{
    type: 'ADD_NODE' | 'LINK' | 'UPDATE_NODE' | 'TAG' | 'NOTE';
    payload: Record<string, unknown>;
  }>;
  status: 'pending' | 'applied' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema = new Schema<Suggestion>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'WizardSession' },
  title: String,
  rationale: String,
  domain: String,
  ring: Number,
  actions: [{
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
  }],
  status: { type: String, enum: ['pending', 'applied', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default model<Suggestion>('Suggestion', SuggestionSchema);
```

**src/models/Feedback.ts**
```ts
import { Schema, model, Types } from 'mongoose';

export interface Feedback {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  nodeIds?: Types.ObjectId[];
  suggestionId?: Types.ObjectId;
  reason: string; // free text
  flags: string[]; // e.g. ["wrong-path","duplicate","too-advanced"]
  createdAt: Date;
}

const FeedbackSchema = new Schema<Feedback>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'WizardSession' },
  nodeIds: [{ type: Schema.Types.ObjectId, ref: 'Node' }],
  suggestionId: { type: Schema.Types.ObjectId, ref: 'Suggestion' },
  reason: String,
  flags: [String],
}, { timestamps: { createdAt: true, updatedAt: false } });

export default model<Feedback>('Feedback', FeedbackSchema);
```

**src/models/Snapshot.ts & AuditLog.ts**
```ts
// Snapshot.ts
import { Schema, model, Types } from 'mongoose';
export interface Snapshot {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  nodes: any[];
  edges: any[];
  takenAt: Date;
}
const SnapshotSchema = new Schema<Snapshot>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  nodes: [Schema.Types.Mixed],
  edges: [Schema.Types.Mixed],
  takenAt: { type: Date, default: Date.now }
});
export default model<Snapshot>('Snapshot', SnapshotSchema);

// AuditLog.ts
import { Schema, model, Types } from 'mongoose';
export interface AuditLog {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  actor?: string;
  type: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}
const AuditLogSchema = new Schema<AuditLog>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  actor: String,
  type: { type: String, required: true },
  meta: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } });
export default model<AuditLog>('AuditLog', AuditLogSchema);
```

---

## 5) Shared Types & Zod Schemas

**src/types/dto.ts**
```ts
import { z } from 'zod';

export const StartWizardBody = z.object({
  workspaceId: z.string(),
  userText: z.string().min(1),
});
export type StartWizardBody = z.infer<typeof StartWizardBody>;

export const ContinueWizardBody = z.object({
  sessionId: z.string(),
  userText: z.string().min(1),
});
export type ContinueWizardBody = z.infer<typeof ContinueWizardBody>;

export const SuggestRequestBody = z.object({
  workspaceId: z.string(),
  cursorNodeId: z.string().optional(),
  limit: z.number().min(1).max(10).default(5)
});
export type SuggestRequestBody = z.infer<typeof SuggestRequestBody>;

export const ApplySuggestionBody = z.object({
  suggestionId: z.string()
});
export type ApplySuggestionBody = z.infer<typeof ApplySuggestionBody>;

export const FeedbackBody = z.object({
  workspaceId: z.string(),
  sessionId: z.string().optional(),
  nodeIds: z.array(z.string()).optional(),
  suggestionId: z.string().optional(),
  reason: z.string().min(1),
  flags: z.array(z.string()).default([])
});
export type FeedbackBody = z.infer<typeof FeedbackBody>;
```

---

## 6) Express App & Middleware

**src/config/mongo.ts**
```ts
import mongoose from 'mongoose';
import { env } from './env';

export async function connectMongo() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  console.log('[mongo] connected');
}
```

**src/config/redis.ts** (optional)
```ts
import { env } from './env';
import { Redis } from 'ioredis';

export function getRedis() {
  if (!env.REDIS_URL) return null;
  return new Redis(env.REDIS_URL);
}
```

**src/utils/logger.ts**
```ts
export const log = (...args: any[]) => console.log('[api]', ...args);
export const warn = (...args: any[]) => console.warn('[api]', ...args);
export const err = (...args: any[]) => console.error('[api]', ...args);
```

**src/utils/http.ts**
```ts
import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    (req as any).data = parsed.data;
    next();
  };
}
```

**src/routes/index.ts**
```ts
import { Router } from 'express';
import wizard from './wizard';
import suggestions from './suggestions';
import feedback from './feedback';
import workspace from './workspace';

const router = Router();
router.use('/wizard', wizard);
router.use('/suggestions', suggestions);
router.use('/feedback', feedback);
router.use('/workspace', workspace);

export default router;
```

**src/index.ts**
```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/env';
import { connectMongo } from './config/mongo';
import routes from './routes';

async function main() {
  await connectMongo();
  const app = express();

  app.use(cors({ origin: env.ALLOW_ORIGIN, credentials: true }));
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.use('/api', routes);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.listen(env.PORT, () => {
    console.log(`[api] listening on :${env.PORT}`);
  });
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
```

---

## 7) AI Service (Provider-agnostic)
**src/services/ai/prompts.ts**
```ts
export const SYSTEM_WIZARD = `
You are a product coach that helps a user go from vague idea to a concrete plan:
- Ask one concise question at a time.
- Extract domain (business/product/tech/data-ai/operations) and ring (1=core → 4=edge).
- Propose up to 3 next actions as structured JSON "suggestions".
- Keep it pragmatic.
`;

export function buildWizardUserPrompt(history: Array<{role:'user'|'assistant'; content:string}>, latest: string) {
  const lines = history.map(h => `${h.role.toUpperCase()}: ${h.content}`);
  lines.push(`USER: ${latest}`);
  lines.push(`ASSISTANT: reply with JSON { "message": "...", "suggestions":[{ "title":"...", "rationale":"...", "domain":"product", "ring":1, "actions":[{ "type":"ADD_NODE", "payload":{ "label":"...", "type":"requirement", "domain":"product", "ring":1 }}]}] }`);
  return lines.join("\n");
}
```

**src/services/ai/index.ts**
```ts
import { env } from '../../config/env';
import OpenAI from 'openai';

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function runWizardLLM(system: string, user: string): Promise<string> {
  if (!client) {
    // local/dev fallback: echo a deterministic stub
    return JSON.stringify({
      message: "Great—let's clarify your core outcome. What does success look like in 4–6 weeks?",
      suggestions: [{
        title: "Define MVP outcome",
        rationale: "Sets a measurable north star",
        domain: "product",
        ring: 1,
        actions: [{ type: "ADD_NODE", payload: { label: "MVP Outcome", type: "requirement", domain: "product", ring: 1 } }]
      }]
    });
  }

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });
  return resp.choices[0].message?.content ?? '{}';
}
```

---

## 8) Wizard Sessions API
**src/services/wizard/orchestrator.ts**
```ts
import WizardSession from '../../models/WizardSession';
import { buildWizardUserPrompt, SYSTEM_WIZARD } from '../ai/prompts';
import { runWizardLLM } from '../ai';

export async function startWizard(workspaceId: string, userText: string) {
  const ses = await WizardSession.create({
    workspaceId,
    turns: [{ userText }]
  });
  const prompt = buildWizardUserPrompt([], userText);
  const raw = await runWizardLLM(SYSTEM_WIZARD, prompt);
  await WizardSession.updateOne({ _id: ses._id }, { $push: { turns: { userText: "", aiText: raw } } });
  return { sessionId: String(ses._id), ai: JSON.parse(raw) };
}

export async function continueWizard(sessionId: string, userText: string) {
  const ses = await WizardSession.findById(sessionId);
  if (!ses) throw new Error('session not found');

  const history = ses.turns
    .filter(t => t.userText || t.aiText)
    .map(t => t.userText ? { role: 'user' as const, content: t.userText } : { role: 'assistant' as const, content: t.aiText! });

  const prompt = buildWizardUserPrompt(history, userText);
  const raw = await runWizardLLM(SYSTEM_WIZARD, prompt);

  await WizardSession.updateOne(
    { _id: ses._id },
    { $push: { turns: { userText, aiText: raw } } }
  );
  return { sessionId, ai: JSON.parse(raw) };
}
```

**src/routes/wizard.ts**
```ts
import { Router } from 'express';
import { validate } from '../utils/http';
import { StartWizardBody, ContinueWizardBody } from '../types/dto';
import { startWizard, continueWizard } from '../services/wizard/orchestrator';

const r = Router();

r.post('/start', validate(StartWizardBody), async (req, res) => {
  const { workspaceId, userText } = (req as any).data;
  const out = await startWizard(workspaceId, userText);
  res.json(out);
});

r.post('/continue', validate(ContinueWizardBody), async (req, res) => {
  const { sessionId, userText } = (req as any).data;
  const out = await continueWizard(sessionId, userText);
  res.json(out);
});

export default r;
```

---

## 9) Suggestion Engine API
**src/services/suggestion/engine.ts**
```ts
import Suggestion from '../../models/Suggestion';
import NodeModel from '../../models/Node';

export async function generateSuggestions(workspaceId: string, sessionId?: string, limit = 5) {
  // (A) Derive context from current graph
  const nodes = await NodeModel.find({ workspaceId }).lean();

  // (B) Use simple heuristics + LLM in future (stub now)
  const s = await Suggestion.create({
    workspaceId,
    sessionId,
    title: 'Add MVP Outcome',
    rationale: 'Clarify success in 4–6 weeks',
    domain: 'product',
    ring: 1,
    actions: [{
      type: 'ADD_NODE',
      payload: { label: 'MVP Outcome', type: 'requirement', domain: 'product', ring: 1 }
    }]
  });

  return [s];
}
```

**src/routes/suggestions.ts**
```ts
import { Router } from 'express';
import { validate } from '../utils/http';
import { SuggestRequestBody, ApplySuggestionBody } from '../types/dto';
import { generateSuggestions } from '../services/suggestion/engine';
import { applySuggestion } from '../services/suggestion/apply';

const r = Router();

r.post('/generate', validate(SuggestRequestBody), async (req, res) => {
  const { workspaceId, cursorNodeId, limit } = (req as any).data;
  const list = await generateSuggestions(workspaceId, undefined, limit);
  res.json({ items: list });
});

r.post('/apply', validate(ApplySuggestionBody), async (req, res) => {
  const { suggestionId } = (req as any).data;
  const result = await applySuggestion(suggestionId);
  res.json(result);
});

export default r;
```

---

## 10) Apply/Commit Suggestions API
**src/services/suggestion/apply.ts**
```ts
import Suggestion from '../../models/Suggestion';
import NodeModel from '../../models/Node'];
import AuditLog from '../../models/AuditLog';

export async function applySuggestion(suggestionId: string) {
  const s = await Suggestion.findById(suggestionId);
  if (!s) throw new Error('suggestion not found');
  if (s.status !== 'pending') return { ok: true, message: 'already processed' };

  const createdNodeIds: string[] = [];

  for (const a of s.actions) {
    if (a.type === 'ADD_NODE') {
      const { label, type, domain, ring, summary, tags } = a.payload as any;
      const node = await NodeModel.create({
        workspaceId: s.workspaceId,
        label, type, domain, ring, summary, tags,
        position: { x: 400 + Math.random()*80, y: 300 + Math.random()*80 }
      });
      createdNodeIds.push(String(node._id));
    }
    // TODO: LINK, UPDATE_NODE, TAG, NOTE
  }

  s.status = 'applied';
  await s.save();

  await AuditLog.create({
    workspaceId: s.workspaceId,
    type: 'suggestion.applied',
    meta: { suggestionId, createdNodeIds }
  });

  return { ok: true, createdNodeIds };
}
```

---

## 11) Feedback: Mark Wrong Path
**src/routes/feedback.ts**
```ts
import { Router } from 'express';
import { validate } from '../utils/http'];
import { FeedbackBody } from '../types/dto'];
import Feedback from '../models/Feedback'];

const r = Router();

r.post('/mark', validate(FeedbackBody), async (req, res) => {
  const data = (req as any).data;
  const fb = await Feedback.create(data);
  res.json({ ok: true, id: String(fb._id) });
});

export default r;
```

---

## 12) Background Jobs (Optional, BullMQ)
**src/jobs/queue.ts**
```ts
import { Queue } from 'bullmq';
import { env } from '../config/env';
import { getRedis } from '../config/redis';

export const redis = getRedis();
export const suggestQueue = redis ? new Queue('suggest', { connection: redis }) : null;
```

**src/jobs/workers/suggest.worker.ts**
```ts
import { Worker } from 'bullmq';
import { getRedis } from '../../config/redis';
import { generateSuggestions } from '../../services/suggestion/engine';

const redis = getRedis();
if (redis) {
  new Worker('suggest', async (job) => {
    const { workspaceId, sessionId } = job.data;
    await generateSuggestions(workspaceId, sessionId);
  }, { connection: redis });
}
```

---

## 13) Audit Log & Snapshots
**src/routes/workspace.ts**
```ts
import { Router } from 'express';
import Snapshot from '../models/Snapshot';
import { z } from 'zod';

const SnapshotBody = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any())
});
const r = Router();

r.post('/:id/snapshot', async (req, res) => {
  const parsed = SnapshotBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { id } = req.params;
  const snap = await Snapshot.create({
    workspaceId: id,
    nodes: parsed.data.nodes,
    edges: parsed.data.edges
  });
  res.json({ ok: true, id: String(snap._id) });
});

export default r;
```

---

## 14) Auth (Lightweight, Optional)
- If you need minimal auth: add an `X-Workspace-Token` header and verify against a shared secret per workspace.
- For multi-user later: add JWT + user collection and join on `createdBy` fields.

---

## 15) Testing & cURL Recipes

**Health**
```bash
curl -s http://localhost:5050/health
```

**Start Wizard**
```bash
curl -s -X POST http://localhost:5050/api/wizard/start  -H "Content-Type: application/json"  -d '{"workspaceId":"000000000000000000000001","userText":"I want to build a simple lead capture tool for bail bonds"}' | jq
```

**Continue Wizard**
```bash
curl -s -X POST http://localhost:5050/api/wizard/continue  -H "Content-Type: application/json"  -d '{"sessionId":"<paste_from_start>", "userText":"Mobile-first, SMS follow-up, dashboard"}' | jq
```

**Generate Suggestions**
```bash
curl -s -X POST http://localhost:5050/api/suggestions/generate  -H "Content-Type: application/json"  -d '{"workspaceId":"000000000000000000000001","limit":3}' | jq
```

**Apply Suggestion**
```bash
curl -s -X POST http://localhost:5050/api/suggestions/apply  -H "Content-Type: application/json"  -d '{"suggestionId":"<id_from_generate>"}' | jq
```

**Mark Wrong Path**
```bash
curl -s -X POST http://localhost:5050/api/feedback/mark  -H "Content-Type: application/json"  -d '{"workspaceId":"000000000000000000000001","reason":"Too advanced","flags":["wrong-path"]}' | jq
```

**Snapshot**
```bash
curl -s -X POST http://localhost:5050/api/workspace/000000000000000000000001/snapshot  -H "Content-Type: application/json"  -d '{"nodes":[{"id":"center"}],"edges":[]}' | jq
```

---

## 16) Production Notes
- **Error Handling:** wrap controllers with try/catch or a central error middleware.
- **Rate Limits:** for AI endpoints, add per-workspace rate limiting.
- **Prompt Tuning:** incorporate stored `Feedback` to suppress repeated failed patterns (e.g., add a negative instruction with recent flags).
- **Observability:** add request IDs, write `AuditLog` for all mutations.
- **Security:** CORS to your client origin, validate object IDs, sanitize text.

---

## Done — What Next?
1. Wire your frontend calls:
   - Start/continue wizard → hydrate the UI “Start Wizard” and “Suggestion Panel” you built.
   - Apply suggestion → after `createdNodeIds`, refresh nodes and run `applyLayoutAndRelax` (pinned center).
2. Replace the LLM stub with your preferred model, tune prompts, and add tool outputs → structured actions.
3. Add more action types: `LINK`, `UPDATE_NODE`, `TAG`, plus domain-aware heuristics.
4. (Optional) Move suggestion generation to background jobs for large graphs.
