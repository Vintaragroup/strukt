import Workspace from '../../models/Workspace.js'
import { ensureObjectId, summarizeWorkspace, summarizeNode, buildMockNodes } from './utils.js'
import { generateNextSuggestions } from './provider.js'
import { persistSuggestions } from './storage.js'
import { SuggestedNode, SuggestionResult } from '../../types/ai.js'
import Suggestion from '../../models/Suggestion.js'
import WizardSession from '../../models/WizardSession.js'

interface GenerateParams {
  workspaceId: string
  limit?: number
  cursorNodeId?: string
  focusLabel?: string
  focusSummary?: string
  focusType?: string
  focusDomain?: string
  focusRing?: number
}

export async function generateSuggestions({ workspaceId, limit = 3, cursorNodeId, focusDomain, focusLabel, focusSummary, focusType, focusRing }: GenerateParams): Promise<SuggestionResult> {
  const workspaceObjectId = ensureObjectId(workspaceId)
  const workspace = await Workspace.findById(workspaceObjectId).lean()
  const focusNode = workspace?.nodes?.find((node: any) => node.id === cursorNodeId)

  const derivedFocusLabel = focusLabel
    || focusNode?.data?.title
    || focusNode?.data?.label
    || focusNode?.label
    || focusNode?.id
    || undefined

  const derivedFocusSummary = focusSummary || summarizeNode(focusNode)
  const derivedFocusType = focusType || focusNode?.type
  const derivedFocusDomain = focusDomain || focusNode?.data?.domain
  const derivedFocusRing = typeof focusRing === 'number'
    ? focusRing
    : typeof focusNode?.data?.ring === 'number'
      ? focusNode?.data?.ring
      : undefined

  const aiResult = await generateNextSuggestions({
    workspaceSummary: summarizeWorkspace(workspace),
    focusSummary: derivedFocusSummary,
    focusLabel: derivedFocusLabel,
    focusType: derivedFocusType,
    focusDomain: derivedFocusDomain,
    focusRing: derivedFocusRing,
    focusId: cursorNodeId,
    limit,
  })

  let nodes = aiResult.nodes
  if (!nodes.length) {
    nodes = buildMockNodes(cursorNodeId || new Date().toISOString(), limit)
  }

  if (cursorNodeId) {
    nodes = nodes.map((node) => ({
      ...node,
      metadata: {
        ...(node.metadata || {}),
        parentId: cursorNodeId,
      },
    }))
  }

  const persisted = await persistSuggestions({
    workspaceId: workspaceObjectId,
    sessionId: null,
    nodes,
    rationale: aiResult.rationale,
  })

  return {
    suggestions: persisted,
  }
}

export async function applySuggestion(suggestionId: string) {
  const suggestionObjectId = ensureObjectId(suggestionId)
  const suggestion = await Suggestion.findById(suggestionObjectId)
  if (!suggestion) {
    throw new Error('Suggestion not found')
  }

  suggestion.status = 'applied'
  await suggestion.save()

  const nodes = suggestion.actions
    .filter((action) => action.type === 'ADD_NODE')
    .map((action) => {
      const payload = action.payload as Record<string, unknown>
      return payload?.node as SuggestedNode | undefined
    })
    .filter(Boolean) as SuggestedNode[]

  return {
    suggestionId: suggestion._id.toHexString(),
    nodes,
    status: suggestion.status,
  }
}

export async function markSuggestionAs(sessionId: string, status: 'completed' | 'abandoned') {
  const sessionObjectId = ensureObjectId(sessionId)
  await WizardSession.updateOne({ _id: sessionObjectId }, { status })
}
