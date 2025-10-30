import FeedbackModel from '../../models/Feedback.js'
import { ensureObjectId } from './utils.js'
import { FeedbackBodyInput } from '../../types/ai.js'

export async function recordFeedback(input: FeedbackBodyInput) {
  const workspaceId = ensureObjectId(input.workspaceId)

  const doc = await FeedbackModel.create({
    workspaceId,
    sessionId: input.sessionId ? ensureObjectId(input.sessionId) : undefined,
    nodeIds: input.nodeIds?.map(ensureObjectId),
    suggestionId: input.suggestionId ? ensureObjectId(input.suggestionId) : undefined,
    reason: input.reason,
    flags: input.flags,
    context: input.context,
  })

  return { id: doc._id.toHexString(), createdAt: doc.createdAt }
}
