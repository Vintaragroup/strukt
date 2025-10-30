import { Schema, model, Types } from 'mongoose'

export interface Feedback {
  _id: Types.ObjectId
  workspaceId: Types.ObjectId
  sessionId?: Types.ObjectId
  nodeIds?: Types.ObjectId[]
  suggestionId?: Types.ObjectId
  reason: string
  flags: string[]
  context?: Record<string, unknown>
  createdAt: Date
}

const FeedbackSchema = new Schema<Feedback>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'WizardSession' },
    nodeIds: [{ type: Schema.Types.ObjectId, ref: 'Node' }],
    suggestionId: { type: Schema.Types.ObjectId, ref: 'Suggestion' },
    reason: { type: String, required: true },
    flags: { type: [String], default: [] },
    context: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default model<Feedback>('Feedback', FeedbackSchema)
