import { Schema, model, Document } from 'mongoose'
import { z } from 'zod'

// Zod schemas for validation
export const WorkspaceNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['root', 'frontend', 'backend', 'requirement', 'doc']),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    title: z.string(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    stackHint: z.string().optional(),
    domain: z.string().optional(),
    ring: z.number().int().optional(),
    metadata: z.record(z.unknown()).optional(),
    coreIdea: z.string().optional(),
    coreProblem: z.string().optional(),
    coreOutcome: z.string().optional(),
    primaryAudience: z.string().optional(),
    launchScope: z.string().optional(),
    primaryRisk: z.string().optional(),
    kickoffCompletedAt: z.string().optional(),
  }),
  label: z.string().optional(),
})

export const WorkspaceEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
})

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  ownerId: z.string().optional().nullable(),
  nodes: z.array(WorkspaceNodeSchema),
  edges: z.array(WorkspaceEdgeSchema),
})

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  nodes: z.array(WorkspaceNodeSchema).optional(),
  edges: z.array(WorkspaceEdgeSchema).optional(),
})

// Mongoose Schemas
const NodeDataSchema = new Schema(
  {
    title: { type: String, required: true },
    summary: String,
    tags: [String],
    stackHint: String,
    domain: String,
    ring: Number,
    metadata: Schema.Types.Mixed,
    coreIdea: String,
    coreProblem: String,
    coreOutcome: String,
    primaryAudience: String,
    launchScope: String,
    primaryRisk: String,
    kickoffCompletedAt: String,
  },
  { _id: false }
)

const NodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['root', 'frontend', 'backend', 'requirement', 'doc'],
      required: true,
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: NodeDataSchema,
    label: { type: String },
  },
  { _id: false }
)

const EdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    label: String,
  },
  { _id: false }
)

const WorkspaceSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: String, index: true, sparse: true },
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Compound index for owner + name uniqueness
WorkspaceSchema.index({ ownerId: 1, name: 1 }, { unique: true, sparse: true })
WorkspaceSchema.index({ name: 1 }, { unique: true, sparse: true })

export interface IWorkspaceNode {
  id: string
  type: 'root' | 'frontend' | 'backend' | 'requirement' | 'doc'
  position: { x: number; y: number }
  data: {
    title: string
    summary?: string
    tags?: string[]
    stackHint?: string
    domain?: string
    ring?: number
    metadata?: Record<string, unknown>
    coreIdea?: string
    coreProblem?: string
    coreOutcome?: string
    primaryAudience?: string
    launchScope?: string
    primaryRisk?: string
    kickoffCompletedAt?: string
  }
  label?: string
}

export interface IWorkspaceEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface IWorkspace extends Document {
  name: string
  ownerId?: string | null
  nodes: IWorkspaceNode[]
  edges: IWorkspaceEdge[]
  updatedAt: Date
  createdAt: Date
}

const Workspace = model<IWorkspace>('Workspace', WorkspaceSchema)

export default Workspace
