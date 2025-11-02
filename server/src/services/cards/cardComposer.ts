import PRDTemplate from '../../models/PRDTemplate.js'
import {
  GenerationService,
  type CardContentRequest,
  type CardContentResponse,
  type CardContentSection,
} from '../GenerationService.js'
import {
  getCardTemplateById,
  type ServerCardTemplate,
} from './templatePlanner.js'

export interface NodeCardContext {
  node: {
    id: string
    label: string
    type: string
    domain?: string
    summary?: string
    tags?: string[]
    relatedNodes?: Array<{
      id?: string
      label: string
      type: string
      relation?: string
      summary?: string
    }>
  }
  card: {
    id: string
    title: string
    templateId?: string
    sections: Array<{
      title: string
      description?: string
      body?: string
    }>
    checklist?: string[]
  }
}

export interface ComposeResult {
  sections: CardContentSection[]
  checklist?: string[]
  usedFallback: boolean
  warnings?: string[]
  accuracy: {
    score: number
    status: 'fresh' | 'fallback'
    factors: string[]
    lastGeneratedAt: string
    qualityConfidence?: number
    needsReview?: boolean
  }
  template?: ServerCardTemplate
  prdTemplateId?: string
}

async function loadPrdContext(
  template?: ServerCardTemplate
): Promise<CardContentRequest['prdContext'] | undefined> {
  if (!template?.suggestedPrdTemplates?.length) {
    return undefined
  }

  for (const templateId of template.suggestedPrdTemplates) {
    const prdTemplate = await PRDTemplate.findOne({
      template_id: templateId,
    })
      .lean()
      .select({
        template_id: 1,
        name: 1,
        description: 1,
        sections: 1,
      })

    if (prdTemplate) {
      return {
        templateId: prdTemplate.template_id,
        name: prdTemplate.name,
        description: prdTemplate.description,
        sections:
          prdTemplate.sections?.map((section: any) => ({
            title: section.title,
            content: section.content,
          })) ?? [],
      }
    }
  }

  return undefined
}

function evaluateNodeAccuracy(
  context: NodeCardContext,
  template: ServerCardTemplate | undefined,
  prdTemplateId: string | undefined,
  generation: CardContentResponse
): ComposeResult['accuracy'] {
  let score = 40
  const factors: string[] = []

  const summaryLength = context.node.summary?.length ?? 0
  if (summaryLength >= 160) {
    score += 24
    factors.push('Detailed node summary provided (+24)')
  } else if (summaryLength >= 80) {
    score += 18
    factors.push('Good node summary context (+18)')
  } else if (summaryLength >= 40) {
    score += 12
    factors.push('Basic node summary available (+12)')
  } else if (summaryLength > 0) {
    score += 6
    factors.push('Minimal summary supplied (+6)')
  } else {
    factors.push('No node summary (0)')
  }

  const tagCount = context.node.tags?.length ?? 0
  if (tagCount >= 5) {
    score += 12
    factors.push('Rich tagging supports precision (+12)')
  } else if (tagCount >= 2) {
    score += 8
    factors.push('Some tags provided (+8)')
  } else if (tagCount === 1) {
    score += 4
    factors.push('Single tag supplied (+4)')
  } else {
    factors.push('No tags available (0)')
  }

  if (context.node.domain) {
    score += 6
    factors.push(`Domain classified as ${context.node.domain} (+6)`)
  } else {
    factors.push('Domain unspecified (0)')
  }

  if (context.node.relatedNodes?.length) {
    score += 6
    factors.push('Related nodes supplied for extra context (+6)')
  }

  if (template) {
    score += 10
    factors.push(`Template "${template.label}" matched (+10)`)
  }

  if (prdTemplateId) {
    score += 8
    factors.push(`Reference PRD ${prdTemplateId} connected (+8)`)
  }

  let qualityConfidence: number | undefined

  if (generation.rawOutput) {
    try {
      const parsed = JSON.parse(generation.rawOutput)
      if (parsed?.quality?.confidence !== undefined) {
        qualityConfidence = Number(parsed.quality.confidence)
      }
    } catch {
      // ignore parse failures
    }
  }

  if (typeof qualityConfidence === 'number' && !Number.isNaN(qualityConfidence)) {
    score = Math.round((score + qualityConfidence) / 2)
    factors.push(`Model confidence reported as ${qualityConfidence}`)
  }

  if (generation.usedFallback) {
    score -= 22
    factors.push('Fallback content used (-22)')
  }

  if (generation.warnings?.length) {
    const penalty = Math.min(generation.warnings.length * 5, 15)
    score -= penalty
    factors.push(`Warnings noted during generation (-${penalty})`)
  }

  score = Math.max(5, Math.min(100, score))

  return {
    score,
    status: generation.usedFallback ? 'fallback' : 'fresh',
    factors,
    lastGeneratedAt: new Date().toISOString(),
    qualityConfidence,
    needsReview: generation.usedFallback || (generation.warnings?.length ?? 0) > 0,
  }
}

export async function composeCardContent(
  context: NodeCardContext
): Promise<ComposeResult> {
  const template = context.card.templateId
    ? getCardTemplateById(context.card.templateId)
    : undefined

  const prdContext = await loadPrdContext(template)

  const effectiveSections = context.card.sections.length
    ? context.card.sections
    : template?.defaultSections?.map((section) => ({
        title: section.title,
        description: section.title,
      })) ?? [{ title: context.card.title, description: context.card.description }]

  const generationRequest: CardContentRequest = {
    node: context.node,
    card: {
      title: context.card.title,
      description: template?.description,
      sections: effectiveSections.map((section) => ({
        title: section.title,
        description: section.description,
      })),
      checklist: context.card.checklist ?? template?.defaultChecklist,
    },
    prdContext,
    existingContent: context.card.sections.map((section) => ({
      title: section.title,
      body: section.body,
    })),
  }

  const generation = await GenerationService.generateCardContent(generationRequest)

  const accuracy = evaluateNodeAccuracy(
    context,
    template,
    prdContext?.templateId,
    generation
  )

  return {
    sections: generation.sections,
    checklist: generation.checklist,
    usedFallback: generation.usedFallback,
    warnings: generation.warnings,
    accuracy,
    template,
    prdTemplateId: prdContext?.templateId,
  }
}
