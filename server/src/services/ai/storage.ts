import { Types } from 'mongoose'
import Suggestion from '../../models/Suggestion.js'
import type { SuggestedNode } from '../../types/ai.js'
import { normalizeSuggestedNodes } from './normalize.js'

interface PersistInput {
  workspaceId: Types.ObjectId
  sessionId?: Types.ObjectId | null
  nodes: SuggestedNode[]
  rationale?: string
}

export async function persistSuggestions({ workspaceId, sessionId, nodes, rationale }: PersistInput): Promise<SuggestedNode[]> {
  if (!nodes || nodes.length === 0) {
    return []
  }

  const normalized = normalizeSuggestedNodes(nodes)

  const documents = await Suggestion.create(
    normalized.map((node) => ({
      workspaceId,
      sessionId: sessionId ?? undefined,
      title: node.label,
      rationale: rationale || undefined,
      domain: node.domain,
      ring: node.ring,
      actions: [
        {
          type: 'ADD_NODE',
          payload: {
            node,
          },
        },
        // LINK actions will expect { sourceId, targetId, metadata? }
        // UPDATE_NODE actions will expect { nodeId, changes }
        // TAG actions will expect { nodeId, tags }
        // NOTE actions will expect { nodeId, content }
      ],
    }))
  )

  return documents.map((doc, index) => ({
    id: doc._id.toHexString(),
    label: doc.title || normalized[index].label,
    type: normalized[index].type,
    summary: normalized[index].summary || doc.rationale,
    domain: doc.domain || normalized[index].domain,
    ring: doc.ring ?? normalized[index].ring,
    tags: normalized[index].tags,
    metadata: normalized[index].metadata,
  }))
}
