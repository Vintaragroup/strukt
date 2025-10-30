import { Schema, model, Document } from 'mongoose'
import { z } from 'zod'

// Zod schemas for validation
export const PRDSectionSchema = z.object({
  title: z.string(),
  key: z.string(),
  content: z.string(),
})

const TechnologyProfileSchema = z.object({
  languages: z.array(z.string()).optional(),
  frontend: z.array(z.string()).optional(),
  backend: z.array(z.string()).optional(),
  mobile: z.array(z.string()).optional(),
  data: z.array(z.string()).optional(),
  devops: z.array(z.string()).optional(),
  testing: z.array(z.string()).optional(),
  tooling: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

const APIGuidanceSchema = z.object({
  name: z.string(),
  provider: z.string().optional(),
  category: z.string().optional(),
  rationale: z.string(),
  recommended_calls: z.array(z.string()).optional(),
  integration_points: z.array(z.string()).optional(),
})

export const PRDTemplateCreateSchema = z.object({
  template_id: z.string(),
  name: z.string(),
  version: z.string().optional().default('1.0.0'),
  tags: z.array(z.string()),
  category: z.string(),
  description: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  sections: z.array(PRDSectionSchema),
  suggested_technologies: z.array(z.string()).optional(),
  technology_profile: TechnologyProfileSchema.optional(),
  api_guidance: z.array(APIGuidanceSchema).optional(),
  complexity: z.enum(['simple', 'medium', 'complex', 'high']).optional(),
  estimated_effort_hours: z.number().optional(),
  team_size: z.number().optional(),
  knowledge_graph_tags: z.array(z.string()).optional(),
  embedding: z.array(z.number()).optional(),
})

export const PRDTemplateUpdateSchema = z.object({
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  embedding: z.array(z.number()).optional(),
})

// Mongoose Schemas
const PRDSectionSubSchema = new Schema(
  {
    title: { type: String, required: true },
    key: { type: String, required: true, index: true },
    content: { type: String, required: true },
  },
  { _id: false }
)

const PRDTemplateSchema = new Schema(
  {
    template_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    sections: [PRDSectionSubSchema],
    suggested_technologies: {
      type: [String],
      default: [],
    },
    technology_profile: {
      type: {
        languages: { type: [String], default: undefined },
        frontend: { type: [String], default: undefined },
        backend: { type: [String], default: undefined },
        mobile: { type: [String], default: undefined },
        data: { type: [String], default: undefined },
        devops: { type: [String], default: undefined },
        testing: { type: [String], default: undefined },
        tooling: { type: [String], default: undefined },
        notes: { type: String, default: undefined },
      },
      default: undefined,
    },
    api_guidance: {
      type: [
        new Schema(
          {
            name: { type: String, required: true },
            provider: { type: String, default: undefined },
            category: { type: String, default: undefined },
            rationale: { type: String, required: true },
            recommended_calls: { type: [String], default: undefined },
            integration_points: { type: [String], default: undefined },
          },
          { _id: false }
        ),
      ],
      default: undefined,
    },
    complexity: {
      type: String,
      enum: ['simple', 'medium', 'complex', 'high'],
      default: 'medium',
    },
    estimated_effort_hours: {
      type: Number,
      default: 40,
    },
    team_size: {
      type: Number,
      default: 1,
    },
    knowledge_graph_tags: {
      type: [String],
      default: undefined,
    },
    // Vector embedding for semantic search
    embedding: {
      type: [Number],
      default: undefined,
      // Vector search index will be configured separately in MongoDB Atlas
      // Index configuration:
      // {
      //   "fields": [
      //     {
      //       "type": "vector",
      //       "path": "embedding",
      //       "similarity": "cosine",
      //       "dimensions": 3072
      //     }
      //   ]
      // }
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Indexes for efficient querying
PRDTemplateSchema.index({ category: 1 })
PRDTemplateSchema.index({ tags: 1 })
PRDTemplateSchema.index({ complexity: 1 })
PRDTemplateSchema.index({ created_at: -1 })

// Vector search index (to be set up in MongoDB Atlas separately)
// The embedding field is prepared for the following index configuration:
/*
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "similarity": "cosine",
      "dimensions": 3072
    }
  ]
}
*/

export interface IPRDSection {
  title: string
  key: string
  content: string
}

export interface IPRDTemplate extends Document {
  template_id: string
  name: string
  version: string
  tags: string[]
  category: string
  description: string
  sections: IPRDSection[]
  suggested_technologies?: string[]
  technology_profile?: {
    languages?: string[]
    frontend?: string[]
    backend?: string[]
    mobile?: string[]
    data?: string[]
    devops?: string[]
    testing?: string[]
    tooling?: string[]
    notes?: string
  }
  api_guidance?: Array<{
    name: string
    provider?: string
    category?: string
    rationale: string
    recommended_calls?: string[]
    integration_points?: string[]
  }>
  complexity?: 'simple' | 'medium' | 'complex' | 'high'
  estimated_effort_hours?: number
  team_size?: number
  knowledge_graph_tags?: string[]
  embedding?: number[]
  created_at: Date
  updated_at: Date
}

const PRDTemplate = model<IPRDTemplate>('PRDTemplate', PRDTemplateSchema)

export default PRDTemplate
