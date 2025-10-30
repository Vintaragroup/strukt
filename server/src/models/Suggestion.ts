import { Schema, model, Types } from 'mongoose'

export type SuggestionActionType = 'ADD_NODE' | 'LINK' | 'UPDATE_NODE' | 'TAG' | 'NOTE'

export interface SuggestionAction {
  type: SuggestionActionType
  payload: Record<string, unknown>
}

export interface Suggestion {
  _id: Types.ObjectId
  workspaceId: Types.ObjectId
  sessionId?: Types.ObjectId
  title?: string
  rationale?: string
  domain?: string
  ring?: number
  actions: SuggestionAction[]
  status: 'pending' | 'applied' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const SuggestionSchema = new Schema<Suggestion>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'WizardSession' },
    title: { type: String },
    rationale: { type: String },
    domain: { type: String },
    ring: { type: Number },
    actions: {
      type: [
        new Schema<SuggestionAction>(
          {
            type: { type: String, required: true },
            payload: { type: Schema.Types.Mixed, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    status: { type: String, enum: ['pending', 'applied', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

export default model<Suggestion>('Suggestion', SuggestionSchema)
