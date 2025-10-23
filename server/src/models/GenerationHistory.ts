import mongoose, { Document, Schema } from 'mongoose';

/**
 * Tracks all AI-generated content for audit trail and analytics
 * Immutable record of each generation request and result
 */
export interface IGenerationHistory extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: string;
  prdTemplateId?: mongoose.Types.ObjectId;
  userPrompt: string;
  generatedContent: {
    nodes: any[];
    edges: any[];
    summary: string;
  };
  tokensUsed: number;
  generationTime: number; // in seconds
  modelUsed: string; // 'gpt-4o', 'gpt-4o-mini', etc.
  status: 'success' | 'partial' | 'failed';
  validationResult?: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  tags: string[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const generationHistorySchema = new Schema<IGenerationHistory>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    prdTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'PRDTemplate',
    },
    userPrompt: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    generatedContent: {
      nodes: {
        type: [Schema.Types.Mixed],
        default: [],
      },
      edges: {
        type: [Schema.Types.Mixed],
        default: [],
      },
      summary: {
        type: String,
        default: '',
      },
    },
    tokensUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    generationTime: {
      type: Number,
      required: true,
      min: 0,
    },
    modelUsed: {
      type: String,
      required: true,
      enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      default: 'gpt-4o',
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'partial', 'failed'],
      default: 'success',
      index: true,
    },
    validationResult: {
      isValid: Boolean,
      errors: [String],
      warnings: [String],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    errorMessage: String,
  },
  {
    timestamps: true,
    collection: 'generation_history',
  }
);

// Index for common queries
generationHistorySchema.index({ workspaceId: 1, createdAt: -1 });
generationHistorySchema.index({ userId: 1, createdAt: -1 });
generationHistorySchema.index({ status: 1, createdAt: -1 });
generationHistorySchema.index({ prdTemplateId: 1 });

// Text index for searching prompts and summaries
generationHistorySchema.index({
  userPrompt: 'text',
  'generatedContent.summary': 'text',
});

export const GenerationHistory = mongoose.model<IGenerationHistory>(
  'GenerationHistory',
  generationHistorySchema
);
