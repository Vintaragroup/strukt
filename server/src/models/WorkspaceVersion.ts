import mongoose, { Document, Schema } from 'mongoose';

/**
 * Immutable snapshots of workspace versions
 * Each version is tied to a generation event
 * Enables rollback and comparison functionality
 */
export interface IWorkspaceVersion extends Document {
  workspaceId: mongoose.Types.ObjectId;
  versionNumber: number;
  nodes: any[];
  edges: any[];
  summary: string;
  generationHistoryId: mongoose.Types.ObjectId;
  label: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceVersionSchema = new Schema<IWorkspaceVersion>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    nodes: {
      type: Schema.Types.Mixed,
      required: true,
      default: [],
    },
    edges: {
      type: Schema.Types.Mixed,
      required: true,
      default: [],
    },
    summary: {
      type: String,
      required: true,
    },
    generationHistoryId: {
      type: Schema.Types.ObjectId,
      ref: 'GenerationHistory',
      required: true,
    },
    label: {
      type: String,
      required: true,
      maxlength: 255,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'workspace_versions',
  }
);

// Compound index for unique version per workspace
workspaceVersionSchema.index({ workspaceId: 1, versionNumber: 1 }, { unique: true });

// Index for querying active versions
workspaceVersionSchema.index({ workspaceId: 1, isActive: 1 });

// Index for common retrieval patterns
workspaceVersionSchema.index({ workspaceId: 1, createdAt: -1 });

export const WorkspaceVersion = mongoose.model<IWorkspaceVersion>(
  'WorkspaceVersion',
  workspaceVersionSchema
);
