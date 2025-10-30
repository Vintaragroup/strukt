import { Types } from 'mongoose'
import WizardSession from '../../models/WizardSession.js'
import Workspace from '../../models/Workspace.js'
import { buildMockNodes, ensureObjectId, summarizeWorkspace } from './utils.js'
import { generateWizardNodes } from './provider.js'
import { persistSuggestions } from './storage.js'
import { SuggestedNode, SuggestionResult } from '../../types/ai.js'

interface StartParams {
  workspaceId: string
  userText: string
}

interface ContinueParams {
  sessionId: string
  userText: string
}

export async function startWizardSession({ workspaceId, userText }: StartParams): Promise<SuggestionResult & { sessionId: string }> {
  const workspaceObjectId = ensureObjectId(workspaceId)

  const session = await WizardSession.create({
    workspaceId: workspaceObjectId,
    turns: [
      {
        userText,
      },
    ],
  })

  const workspace = await Workspace.findById(workspaceObjectId).lean()

  const aiResult = await generateWizardNodes({
    idea: userText,
    workspaceSummary: summarizeWorkspace(workspace),
    previousTurns: session.turns,
  })

  let nodes = aiResult.nodes
  if (!nodes.length) {
    nodes = buildMockNodes(userText)
  }

  const suggestions = await persistSuggestions({
    workspaceId: workspaceObjectId,
    sessionId: session._id,
    nodes,
    rationale: aiResult.rationale || `Seeded from: ${userText}`,
  })

  if (aiResult.rationale) {
    await WizardSession.updateOne(
      { _id: session._id },
      { $set: { 'turns.0.aiText': aiResult.rationale } }
    )
  }

  return {
    sessionId: session._id.toHexString(),
    suggestions,
  }
}

export async function continueWizardSession({ sessionId, userText }: ContinueParams): Promise<SuggestionResult & { sessionId: string }> {
  const sessionObjectId = ensureObjectId(sessionId)

  const session = await WizardSession.findById(sessionObjectId)
  if (!session) {
    throw new Error('Wizard session not found')
  }

  session.turns.push({ userText })
  await session.save()

  const workspace = await Workspace.findById(session.workspaceId).lean()

  const aiResult = await generateWizardNodes({
    idea: userText,
    workspaceSummary: summarizeWorkspace(workspace),
    previousTurns: session.turns,
  })

  let nodes = aiResult.nodes
  if (!nodes.length) {
    nodes = buildMockNodes(userText)
  }

  const suggestions = await persistSuggestions({
    workspaceId: session.workspaceId as Types.ObjectId,
    sessionId: session._id,
    nodes,
    rationale: aiResult.rationale || `Seeded from: ${userText}`,
  })

  if (aiResult.rationale) {
    const turnIndex = Math.max(session.turns.length - 1, 0)
    await WizardSession.updateOne(
      { _id: session._id },
      { $set: { [`turns.${turnIndex}.aiText`]: aiResult.rationale } }
    )
  }

  return {
    sessionId: session._id.toHexString(),
    suggestions,
  }
}
