import { Router, Request, Response } from 'express'
import { generateCardDrafts, getCardTemplateById, ServerNodeType, ServerDomainType } from '../services/cards/templatePlanner.js'
import { composeCardContent, type NodeCardContext } from '../services/cards/cardComposer.js'

const router = Router()

router.post('/generate', (req: Request, res: Response) => {
  const { nodeType, domain, templateId, templateIds } = req.body as {
    nodeType?: ServerNodeType
    domain?: ServerDomainType
    templateId?: string
    templateIds?: string[]
  }

  const resolvedTemplateIds = templateId
    ? [templateId]
    : Array.isArray(templateIds)
      ? templateIds
      : undefined

  if (!resolvedTemplateIds && !nodeType) {
    return res.status(400).json({ message: 'nodeType is required when templateId(s) not provided' })
  }

  const drafts = generateCardDrafts({
    nodeType: (nodeType ?? 'doc') as ServerNodeType,
    domain: domain as ServerDomainType | undefined,
    templateIds: resolvedTemplateIds,
  })

  const cards = drafts.map((draft) => ({
    templateId: draft.template.id,
    title: draft.template.label,
    type: draft.template.cardType,
    sections: draft.defaultSections,
    checklist: draft.defaultChecklist,
    description: draft.template.description,
    suggestedPrdTemplates: draft.template.suggestedPrdTemplates,
    tags: draft.template.tags,
    reason: draft.reason,
  }))

  res.json({ cards })
})

router.get('/templates/:templateId', (req: Request, res: Response) => {
  const template = getCardTemplateById(req.params.templateId)
  if (!template) {
    return res.status(404).json({ message: 'Template not found' })
  }
  res.json({ template })
})

router.post('/generate-content', async (req: Request, res: Response) => {
  const { node, card } = req.body as { node?: NodeCardContext['node']; card?: NodeCardContext['card'] }

  if (!node || !card) {
    return res.status(400).json({ message: 'Both node and card payloads are required' })
  }

  if (!card.templateId) {
    return res.status(400).json({ message: 'card.templateId is required to generate content' })
  }

  try {
    const context: NodeCardContext = {
      node: {
        id: node.id || 'node',
        label: node.label,
        type: node.type,
        domain: node.domain,
        summary: node.summary,
        tags: node.tags ?? [],
        relatedNodes: node.relatedNodes ?? [],
        metadata: node.metadata ?? undefined,
        intent: node.intent ?? undefined,
      },
      card: {
        id: card.id,
        title: card.title,
        templateId: card.templateId,
        sections: card.sections ?? [],
        checklist: card.checklist ?? [],
      },
    }

    const result = await composeCardContent(context)

    return res.json({
      card: {
        sections: result.sections,
        checklist: result.checklist,
        warnings: result.warnings,
        usedFallback: result.usedFallback,
      },
      accuracy: result.accuracy,
      template: result.template
        ? {
            id: result.template.id,
            label: result.template.label,
            description: result.template.description,
          }
        : undefined,
      prdTemplateId: result.prdTemplateId,
      provenance: result.provenance,
    })
  } catch (error) {
    console.error('Card generation failed:', error)
    return res.status(500).json({
      message: 'Failed to generate card content',
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

export default router
