import { Types } from 'mongoose'
import WizardSession from '../../models/WizardSession.js'
import Workspace from '../../models/Workspace.js'
import { buildMockNodes, ensureObjectId, summarizeWorkspace } from './utils.js'
import { generateWizardNodes } from './provider.js'
import { persistSuggestions } from './storage.js'
import { SuggestedNode, SuggestionResult, type SuggestionKnowledge } from '../../types/ai.js'
import { buildWizardKnowledge } from './wizardKnowledge.js'

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
  const knowledge = await buildWizardKnowledge(userText)

  const aiResult = await generateWizardNodes({
    idea: userText,
    workspaceSummary: summarizeWorkspace(workspace),
    previousTurns: session.turns,
    knowledgeContext: knowledge?.promptContext,
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

  const updates: Record<string, unknown> = {}
  if (aiResult.rationale) {
    updates['turns.0.aiText'] = aiResult.rationale
  }
  if (knowledge) {
    updates['turns.0.payload'] = {
      ...(session.turns?.[0]?.['payload'] as Record<string, unknown> | undefined),
      knowledge,
    }
  }
  if (Object.keys(updates).length > 0) {
    await WizardSession.updateOne(
      { _id: session._id },
      { $set: updates }
    )
  }

  return {
    sessionId: session._id.toHexString(),
    suggestions,
    knowledge: knowledge ?? undefined,
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
  let knowledge: SuggestionKnowledge | null | undefined =
    (session.turns?.[0]?.payload as Record<string, unknown> | undefined)?.['knowledge'] as SuggestionKnowledge | null | undefined

  if (!knowledge || !knowledge.promptContext) {
    const aggregateIdea = session.turns.map((turn) => turn.userText).join(' ')
    knowledge = await buildWizardKnowledge(aggregateIdea || userText)
    if (knowledge) {
      await WizardSession.updateOne(
        { _id: session._id },
        {
          $set: {
            'turns.0.payload': {
              ...(session.turns?.[0]?.payload as Record<string, unknown> | undefined),
              knowledge,
            },
          },
        }
      )
    }
  }

  const aiResult = await generateWizardNodes({
    idea: userText,
    workspaceSummary: summarizeWorkspace(workspace),
    previousTurns: session.turns,
    knowledgeContext: knowledge?.promptContext,
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
    knowledge: knowledge ?? undefined,
  }
}
