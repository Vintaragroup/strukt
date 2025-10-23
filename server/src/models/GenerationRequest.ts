import { Schema, model, Document } from 'mongoose'

export interface IGenerationRequestDoc extends Document {
  workspaceId: string
  userPrompt: string
  modelName: 'gpt-4o' | 'gpt-4o-mini'
  status: 'pending' | 'processing' | 'complete' | 'failed'
  generatedContent?: string
  parsedContent?: {
    nodes: Array<{ id: string; type: string; label: string; description: string }>
    edges: Array<{ source: string; target: string; label?: string }>
  }
  validation?: {
    valid: boolean
    errors: string[]
  }
  tokensUsed?: {
    prompt: number
    completion: number
    total: number
  }
  error?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

const GenerationRequestSchema = new Schema<IGenerationRequestDoc>(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    userPrompt: {
      type: String,
      required: true,
    },
    modelName: {
      type: String,
      enum: ['gpt-4o', 'gpt-4o-mini'],
      default: 'gpt-4o',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'pending',
      index: true,
    },
    generatedContent: String,
    parsedContent: {
      nodes: [
        {
          id: String,
          type: String,
          label: String,
          description: String,
        },
      ],
      edges: [
        {
          source: String,
          target: String,
          label: String,
        },
      ],
    },
    validation: {
      valid: Boolean,
      errors: [String],
    },
    tokensUsed: {
      prompt: Number,
      completion: Number,
      total: Number,
    },
    error: String,
    completedAt: Date,
  },
  { timestamps: true }
)

export default model<IGenerationRequestDoc>(
  'GenerationRequest',
  GenerationRequestSchema
)
