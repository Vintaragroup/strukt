import { Schema, model, Types } from 'mongoose'

export interface Snapshot {
  _id: Types.ObjectId
  workspaceId: Types.ObjectId
  nodes: unknown[]
  edges: unknown[]
  takenAt: Date
}

const SnapshotSchema = new Schema<Snapshot>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

export default model<Snapshot>('Snapshot', SnapshotSchema)
