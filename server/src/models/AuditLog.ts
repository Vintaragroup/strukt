import { Schema, model, Types } from 'mongoose'

export interface AuditLog {
  _id: Types.ObjectId
  workspaceId: Types.ObjectId
  actor?: string
  type: string
  meta?: Record<string, unknown>
  createdAt: Date
}

const AuditLogSchema = new Schema<AuditLog>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    actor: { type: String },
    type: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default model<AuditLog>('AuditLog', AuditLogSchema)
