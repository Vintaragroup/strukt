import { Schema, model, Types } from 'mongoose'

export interface WizardTurn {
  userText: string
  aiText?: string
  payload?: Record<string, unknown>
  createdAt?: Date
}

export interface WizardSession {
  _id: Types.ObjectId
  workspaceId: Types.ObjectId
  status: 'active' | 'completed' | 'abandoned'
  turns: WizardTurn[]
  createdAt: Date
  updatedAt: Date
}

const TurnSchema = new Schema<WizardTurn>(
  {
    userText: { type: String, required: true },
    aiText: { type: String },
    payload: { type: Schema.Types.Mixed },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
)

const WizardSessionSchema = new Schema<WizardSession>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    turns: { type: [TurnSchema], default: [] },
  },
  { timestamps: true }
)

export default model<WizardSession>('WizardSession', WizardSessionSchema)
