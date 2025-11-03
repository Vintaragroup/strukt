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
import { kbService } from '../KBService.js'

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
    metadata?: Record<string, unknown>
    intent?: {
      idea?: string
      problem?: string
      primaryAudience?: string
      coreOutcome?: string
      launchScope?: string
      primaryRisk?: string
      blueprintAutoKind?: string
    }
  }
  card: {
    id: string
    title: string
    description?: string
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
  provenance?: {
    kbPrds?: Array<{ id: string; name: string; path: string }>
    kbFragments?: Array<{ id: string; type: string }>
    matchStage?: string
    attempts?: Array<{ stage: string; matches: number; description: string }>
    intent?: NodeCardContext['intent']
  }
}

const SECTION_SYNONYMS: Record<string, string[]> = {
  overview: ['overview', 'summary', 'context', 'introduction', 'executive summary'],
  architecture: ['architecture', 'solution', 'design', 'system design', 'technical architecture'],
  interfaces: ['interfaces', 'integration', 'api', 'endpoints', 'surface', 'contracts'],
  deployment: ['deployment', 'infrastructure', 'release', 'environment', 'ci/cd', 'delivery'],
  testing: ['testing', 'quality', 'qa', 'validation', 'verification'],
  operations: ['operations', 'runbook', 'monitoring', 'observability', 'support', 'ops'],
  data: ['data', 'schema', 'model', 'dataset', 'information architecture'],
  security: ['security', 'compliance', 'hardening', 'governance'],
  risks: ['risks', 'risk', 'mitigation', 'constraints', 'assumptions'],
  kpis: ['kpis', 'metrics', 'measurement', 'analytics', 'goals'],
  personas: ['persona', 'audience', 'stakeholder', 'user'],
  tutorials: ['tutorial', 'guide', 'quickstart', 'walkthrough', 'playbook'],
  tooling: ['tooling', 'platform', 'stack', 'publishing', 'pipeline'],
  governance: ['governance', 'process', 'quality', 'standards', 'policy'],
}

const CARD_SECTION_HINTS: Record<string, string[]> = {
  technicalSpec: ['overview', 'architecture', 'data', 'interfaces', 'deployment', 'operations', 'testing', 'security'],
  apiContract: ['overview', 'interfaces', 'security', 'testing', 'risks'],
  adrSummary: ['overview', 'decision', 'risks'],
  dataPipelineSpec: ['overview', 'architecture', 'data', 'operations', 'testing', 'kpis'],
  modelCard: ['overview', 'data', 'testing', 'kpis', 'risks'],
  monitoringChecklist: ['operations', 'security', 'risks'],
  businessCase: ['overview', 'personas', 'kpis', 'risks'],
  operationsRunbook: ['overview', 'operations', 'interfaces', 'risks'],
  marketingCampaignBrief: ['overview', 'personas', 'kpis', 'risks'],
  launchChecklist: ['overview', 'operations', 'kpis'],
  personaSnapshot: ['overview', 'personas'],
  okrCard: ['overview', 'kpis'],
  raciMatrix: ['overview', 'governance'],
}

function canonicalKeyFromTitle(title: string | undefined): string | undefined {
  if (!title) return undefined
  const lower = title.toLowerCase().trim()
  for (const [canonical, synonyms] of Object.entries(SECTION_SYNONYMS)) {
    if (synonyms.some((syn) => lower.includes(syn))) {
      return canonical
    }
  }
  return undefined
}

function markdownList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n')
}

function tokenizeIntent(value?: string): string[] {
  if (!value) return []
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return []
  const tokens = new Set<string>([trimmed])
  const sanitized = trimmed.replace(/[^a-z0-9\s]+/g, ' ')
  for (const chunk of sanitized.split(/[,;\n]+/)) {
    const clean = chunk.trim()
    if (!clean) continue
    tokens.add(clean)
    clean.split(/\s+/).forEach((part) => {
      const word = part.trim()
      if (word) tokens.add(word)
    })
  }
  return Array.from(tokens)
}

type KBDraft = {
  sections: Array<{ title: string; description?: string; body: string }>
  checklist: string[]
  provenance: Required<ComposeResult>['provenance']
  prdTemplateId?: string
}

async function buildKBDraft(
  context: NodeCardContext,
  template: ServerCardTemplate | undefined
): Promise<KBDraft | null> {
  const filters = {
    node_types: [context.node.type],
    domains: context.node.domain ? [context.node.domain] : [],
    tags: (() => {
      const base = new Set<string>((context.node.tags ?? []).map((tag) => tag.toLowerCase()))
      if (context.node.metadata?.blueprintAutoKind) {
        base.add(String(context.node.metadata.blueprintAutoKind).toLowerCase())
      }
      const intent = context.intent ?? {}
      tokenizeIntent(intent.primaryAudience).forEach((token) => base.add(token))
      tokenizeIntent(intent.coreOutcome).forEach((token) => base.add(token))
      tokenizeIntent(intent.launchScope).forEach((token) => base.add(token))
      tokenizeIntent(intent.primaryRisk).forEach((token) => base.add(token))
      tokenizeIntent(intent.idea).forEach((token) => base.add(token))
      tokenizeIntent(intent.problem).forEach((token) => base.add(token))
      return Array.from(base)
    })(),
  }

  const composed = await kbService.compose(filters)
  if (!composed.prds.length) {
    return null
  }

  const primary = composed.prds[0]
  const kbSections = primary.sections ?? []
  const usedSectionIndices = new Set<number>()

  const baseSections: Array<{ title: string; description?: string; body: string }> = []
  const targetHints = template?.id ? CARD_SECTION_HINTS[template.id] ?? [] : []

  const findMatchingSection = (canonical: string | undefined, fallbackTitle: string): { body: string; index: number | null } => {
    if (canonical) {
      const hintMatchIndex = kbSections.findIndex(
        (section, idx) => !usedSectionIndices.has(idx) && (section.key?.toLowerCase() === canonical || canonicalKeyFromTitle(section.title) === canonical)
      )
      if (hintMatchIndex !== -1) {
        usedSectionIndices.add(hintMatchIndex)
        return { body: kbSections[hintMatchIndex].content ?? '', index: hintMatchIndex }
      }
    }

    const fallbackMatchIndex = kbSections.findIndex(
      (section, idx) => !usedSectionIndices.has(idx) && section.title?.toLowerCase().includes(fallbackTitle.toLowerCase())
    )
    if (fallbackMatchIndex !== -1) {
      usedSectionIndices.add(fallbackMatchIndex)
      return { body: kbSections[fallbackMatchIndex].content ?? '', index: fallbackMatchIndex }
    }

    const firstUnused = kbSections.findIndex((_, idx) => !usedSectionIndices.has(idx))
    if (firstUnused !== -1) {
      usedSectionIndices.add(firstUnused)
      return { body: kbSections[firstUnused].content ?? '', index: firstUnused }
    }

    return { body: '', index: null }
  }

  const templateSections = context.card.sections ?? []
  templateSections.forEach((section, index) => {
    const hint = targetHints[index]
    const canonical =
      canonicalKeyFromTitle(section.title) ??
      canonicalKeyFromTitle(section.description) ??
      hint
    const fallbackTitle = hint ?? section.title
    const match = findMatchingSection(canonical, fallbackTitle || section.title)
    baseSections.push({
      title: section.title,
      description: section.description,
      body: match.body,
    })
  })

  // Add leftover KB sections that were not mapped if template had no sections
  if (baseSections.length === 0) {
    kbSections.forEach((section, idx) => {
      baseSections.push({
        title: section.title || `Section ${idx + 1}`,
        body: section.content ?? '',
      })
    })
  } else {
    kbSections.forEach((section, idx) => {
      if (!usedSectionIndices.has(idx)) {
        baseSections.push({
          title: section.title || `Additional Context ${idx + 1}`,
          body: section.content ?? '',
        })
      }
    })
  }

  const checklistSet = new Set<string>(context.card.checklist ?? [])
  const extraSectionsMap = new Map<string, string[]>()

  const appendSectionContent = (title: string, body: string) => {
    if (!body?.trim()) return
    const entries = extraSectionsMap.get(title) ?? []
    entries.push(body)
    extraSectionsMap.set(title, entries)
  }

  for (const fragment of composed.fragments) {
    switch (fragment.type) {
      case 'acceptance_criteria': {
        const items = Array.isArray(fragment.content) ? fragment.content : []
        items.forEach((item) => {
          if (typeof item === 'string') {
            checklistSet.add(item)
          }
        })
        break
      }
      case 'kpi_set': {
        const items = Array.isArray(fragment.content) ? fragment.content : []
        if (items.length) {
          appendSectionContent('Key Metrics', markdownList(items))
        }
        break
      }
      case 'risk_mitigation': {
        const value = fragment.content as {
          risk?: string
          signals?: string[]
          mitigations?: string[]
        }
        const parts: string[] = []
        if (value?.risk) {
          parts.push(`**Risk:** ${value.risk}`)
        }
        if (value?.signals?.length) {
          parts.push(`**Signals**\n${markdownList(value.signals)}`)
        }
        if (value?.mitigations?.length) {
          parts.push(`**Mitigations**\n${markdownList(value.mitigations)}`)
        }
        if (parts.length) {
          appendSectionContent('Risks & Mitigations', parts.join('\n\n'))
        }
        break
      }
      case 'interface_pattern': {
        const value = fragment.content as {
          description?: string
          schema?: Record<string, unknown>
          steps?: string[]
          requirements?: string[]
          instrumentation?: string[]
          slo?: string
        }
        const parts: string[] = []
        if (value?.description) {
          parts.push(value.description)
        }
        if (value?.schema) {
          parts.push('```json\n' + JSON.stringify(value.schema, null, 2) + '\n```')
        }
        if (value?.steps?.length) {
          parts.push(`**Steps**\n${markdownList(value.steps)}`)
        }
        if (value?.requirements?.length) {
          parts.push(`**Requirements**\n${markdownList(value.requirements)}`)
        }
        if (value?.instrumentation?.length) {
          parts.push(`**Instrumentation**\n${markdownList(value.instrumentation)}`)
        }
        if (value?.slo) {
          parts.push(`**SLO:** ${value.slo}`)
        }
        const title = fragment.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        if (parts.length) {
          appendSectionContent(title, parts.join('\n\n'))
        }
        break
      }
      case 'guideline': {
        const value = fragment.content as Record<string, unknown>
        const parts: string[] = []
        if (value) {
          for (const [key, val] of Object.entries(value)) {
            if (Array.isArray(val)) {
              parts.push(`**${key.replace(/_/g, ' ')}**\n${markdownList(val.map(String))}`)
            } else if (typeof val === 'string') {
              parts.push(`**${key.replace(/_/g, ' ')}:** ${val}`)
            } else if (val && typeof val === 'object') {
              parts.push(`**${key.replace(/_/g, ' ')}**\n${markdownList(Object.entries(val).map(([k, v]) => `${k}: ${v}`))}`)
            }
          }
        }
        if (parts.length) {
          appendSectionContent('Guidelines', parts.join('\n\n'))
        }
        break
      }
      case 'decision_matrix': {
        const items = Array.isArray(fragment.content) ? fragment.content : []
        if (items.length) {
          appendSectionContent('Decision Considerations', markdownList(items))
        }
        break
      }
      case 'template': {
        const value = fragment.content as { sections?: string[] }
        if (value?.sections?.length) {
          appendSectionContent(
            'Template Structure',
            value.sections.map((sectionTitle, idx) => `${idx + 1}. ${sectionTitle}`).join('\n')
          )
        }
        break
      }
      case 'onboarding_flow':
      case 'ux_states': {
        const items = Array.isArray(fragment.content) ? fragment.content : []
        if (items.length) {
          const title = fragment.type === 'onboarding_flow' ? 'Onboarding Flow' : 'Experience States'
          appendSectionContent(title, markdownList(items.map(String)))
        }
        break
      }
      default: {
        if (Array.isArray(fragment.content) && fragment.content.length) {
          appendSectionContent('Additional Context', markdownList(fragment.content))
        }
        break
      }
    }
  }

  const addMetadataSection = (title: string, items: string[] | undefined, formatter: (values: string[]) => string = markdownList) => {
    if (!items?.length) return
    appendSectionContent(title, formatter(items))
  }

  addMetadataSection('Recommended Tags', primary.tags)
  addMetadataSection('Technical Stack', primary.stack_keywords)
  addMetadataSection('Risk Profile', primary.risk_profile)
  addMetadataSection('Key Metrics', primary.kpi_examples)

  const extraSections: Array<{ title: string; body: string }> = []
  for (const [title, bodies] of extraSectionsMap.entries()) {
    extraSections.push({
      title,
      body: bodies.join('\n\n'),
    })
  }

  const sections = [...baseSections, ...extraSections]

  const provenance: Required<ComposeResult>['provenance'] = {
    kbPrds: composed.prds.map((prd) => ({
      id: prd.id,
      name: prd.name,
      path: prd.path,
    })),
    kbFragments: composed.fragments.map((fragment) => ({
      id: fragment.id,
      type: fragment.type,
    })),
    matchStage: composed.provenance?.matchStage,
    attempts: composed.provenance?.attempts?.map((attempt) => ({
      stage: attempt.stage,
      matches: attempt.matches,
      description: attempt.description,
    })),
    intent: context.intent,
  }

  return {
    sections,
    checklist: Array.from(checklistSet),
    provenance,
    prdTemplateId: primary.id,
  }
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

  const kbDraft = await buildKBDraft(context, template)
  const prdContext = await loadPrdContext(template)

  const effectiveSections =
    kbDraft?.sections ??
    (context.card.sections.length
      ? context.card.sections.map((section) => ({
          title: section.title,
          description: section.description,
          body: section.body ?? '',
        }))
      : template?.defaultSections?.map((section) => ({
          title: section.title,
          description: section.title,
          body: '',
        })) ?? [{ title: context.card.title, description: context.card.description ?? context.card.title, body: '' }])

  const generationRequest: CardContentRequest = {
    node: context.node,
    card: {
      title: context.card.title,
      description: template?.description,
      sections: effectiveSections.map((section) => ({
        title: section.title,
        description: section.description,
      })),
      checklist: kbDraft?.checklist ?? context.card.checklist ?? template?.defaultChecklist,
    },
    prdContext,
    existingContent: effectiveSections.map((section) => ({
      title: section.title,
      body: section.body ?? '',
    })),
  }

  const generation = await GenerationService.generateCardContent(generationRequest)

  const accuracy = evaluateNodeAccuracy(
    context,
    template,
    kbDraft?.prdTemplateId ?? prdContext?.templateId,
    generation
  )

  return {
    sections: generation.sections,
    checklist: generation.checklist,
    usedFallback: generation.usedFallback,
    warnings: generation.warnings,
    accuracy,
    template,
    prdTemplateId: kbDraft?.prdTemplateId ?? prdContext?.templateId,
    provenance: kbDraft?.provenance,
  }
}
