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
    intent?: NodeCardContext['node']['intent']
    coverage?: {
      templatedSections: number
      kbSectionsApplied: number
      fragmentSectionsApplied: number
      metadataSectionsApplied: number
      prdBlendCount: number
    }
    candidates?: Array<{ id: string; name: string; score: number }>
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

function formatType(type: string | undefined): string {
  if (!type) return 'Requirement'
  return type
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function describeDomain(domain?: string): string {
  if (!domain) return 'the overall program'
  const formatted = domain.replace(/-/g, ' ')
  return `the ${formatted} domain`
}

function extractKeywords(...values: Array<string | undefined | null>): Set<string> {
  const keywords = new Set<string>()
  for (const value of values) {
    if (!value) continue
    const lower = value.toLowerCase()
    lower
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 2)
      .forEach((part) => keywords.add(part))
  }
  return keywords
}

function sharedKeywordCount(a: Set<string>, b: Set<string>): number {
  let count = 0
  for (const value of a) {
    if (b.has(value)) count += 1
  }
  return count
}

function buildFallbackPersonalisation(
  context: NodeCardContext,
  section: CardContentSection,
  index: number
): string | null {
  const pieces: string[] = []
  const label = context.node.label
  const typeName = formatType(context.node.type)
  const domainDesc = describeDomain(context.node.domain)

  if (index === 0) {
    pieces.push(`**${label} overview.** Position this ${typeName.toLowerCase()} as the anchor for ${domainDesc}.`)
    if (context.node.summary) {
      pieces.push(`Core intent: ${context.node.summary}`)
    }
    if (context.node.intent?.coreOutcome) {
      pieces.push(`Target outcome: ${context.node.intent.coreOutcome}`)
    }
  } else {
    pieces.push(`Tailor ${section.title} deliverables directly to **${label}**, making sure they reinforce ${domainDesc}.`)
  }

  if (context.node.tags?.length) {
    pieces.push(`Emphasise tagged themes: ${context.node.tags.slice(0, 4).join(', ')}.`)
  }

  if (typeof context.node.intent?.primaryRisk === 'string' && context.node.intent.primaryRisk.trim().length > 0) {
    pieces.push(`Account for the primary risk: ${context.node.intent.primaryRisk}.`)
  }

  if (pieces.length === 0) {
    return null
  }

  return pieces.join(' ')
}

function personaliseFallbackSections(
  context: NodeCardContext,
  sections: CardContentSection[],
  usedFallback: boolean
): CardContentSection[] {
  if (!usedFallback || !Array.isArray(sections) || sections.length === 0) {
    return sections
  }

  const labelLower = context.node.label.toLowerCase()

  return sections.map((section, index) => {
    let body = section.body || ''
    const intro = buildFallbackPersonalisation(context, section, index)

    if (intro && !body.toLowerCase().includes(labelLower)) {
      body = `${intro}\n\n${body}`
    }

    return {
      ...section,
      body,
    }
  })
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

type SectionContribution = {
  body: string
  source: 'existing' | 'kb-prd' | 'fragment' | 'metadata'
  prdId?: string
  prdName?: string
  fragmentId?: string
  fragmentType?: string
  sectionTitle?: string
}

type SectionAggregate = {
  title: string
  description?: string
  canonical?: string
  hints: string[]
  keywords: Set<string>
  bodies: SectionContribution[]
}

async function buildKBDraft(
  context: NodeCardContext,
  template: ServerCardTemplate | undefined
): Promise<KBDraft | null> {
  const intentTokens = new Set<string>()
  const tagTokens = new Set<string>((context.node.tags ?? []).map((tag) => tag.toLowerCase()))

  if (context.node.metadata?.blueprintAutoKind) {
    tagTokens.add(String(context.node.metadata.blueprintAutoKind).toLowerCase())
  }

  const collectIntent = (value?: string) => {
    tokenizeIntent(value).forEach((token) => {
      intentTokens.add(token)
      tagTokens.add(token)
    })
  }

  const nodeIntent = context.node.intent ?? {}
  collectIntent(nodeIntent.primaryAudience)
  collectIntent(nodeIntent.coreOutcome)
  collectIntent(nodeIntent.launchScope)
  collectIntent(nodeIntent.primaryRisk)
  collectIntent(nodeIntent.idea)
  collectIntent(nodeIntent.problem)

  const filters = {
    node_types: [context.node.type],
    domains: context.node.domain ? [context.node.domain] : [],
    tags: Array.from(tagTokens),
  }

  const composed = await kbService.compose(filters)
  if (!composed.prds.length) {
    return null
  }

  const topPrds = composed.prds.slice(0, Math.min(3, composed.prds.length))
  const targetHints = template?.id ? CARD_SECTION_HINTS[template.id] ?? [] : []
  const templateSections = context.card.sections ?? []

  const aggregates: SectionAggregate[] = []
  const canonicalMap = new Map<string, SectionAggregate>()
  const titleMap = new Map<string, SectionAggregate>()
  const prdUsage = new Set<string>()

  const normaliseCanonical = (value?: string): string | undefined => {
    if (!value) return undefined
    const canonical = canonicalKeyFromTitle(value)
    return canonical ? canonical.toLowerCase() : value.toLowerCase()
  }

  const registerAggregate = (aggregate: SectionAggregate) => {
    aggregates.push(aggregate)
    if (aggregate.canonical) {
      const canonicalKey = aggregate.canonical.toLowerCase()
      if (!canonicalMap.has(canonicalKey)) {
        canonicalMap.set(canonicalKey, aggregate)
      }
      const synonyms = SECTION_SYNONYMS[canonicalKey] ?? []
      synonyms.forEach((synonym) => {
        const key = synonym.toLowerCase()
        if (!canonicalMap.has(key)) {
          canonicalMap.set(key, aggregate)
        }
      })
    }
    aggregate.hints.forEach((hint) => {
      const key = hint.toLowerCase()
      if (!canonicalMap.has(key)) {
        canonicalMap.set(key, aggregate)
      }
    })
    titleMap.set(aggregate.title.toLowerCase(), aggregate)
  }

  const createAggregate = (title: string, canonicalGuess?: string, description?: string): SectionAggregate => {
    const canonical = normaliseCanonical(canonicalGuess)
    const synonyms = canonical ? SECTION_SYNONYMS[canonical] ?? [] : []
    const hints = new Set<string>()
    if (canonical) hints.add(canonical)
    synonyms.forEach((synonym) => hints.add(synonym.toLowerCase()))
    const keywords = extractKeywords(title, description, ...synonyms)
    intentTokens.forEach((token) => keywords.add(token))
    const aggregate: SectionAggregate = {
      title,
      description,
      canonical: canonical ?? canonicalGuess,
      hints: Array.from(hints),
      keywords,
      bodies: [],
    }
    registerAggregate(aggregate)
    return aggregate
  }

  const locateAggregate = (canonicalGuess?: string, fallbackTitle?: string): SectionAggregate | undefined => {
    const canonical = normaliseCanonical(canonicalGuess)
    if (canonical && canonicalMap.has(canonical)) {
      return canonicalMap.get(canonical)
    }
    if (fallbackTitle) {
      const titleKey = fallbackTitle.toLowerCase()
      if (titleMap.has(titleKey)) {
        return titleMap.get(titleKey)
      }
      const derived = normaliseCanonical(fallbackTitle)
      if (derived && canonicalMap.has(derived)) {
        return canonicalMap.get(derived)
      }
    }
    return undefined
  }

  const ensureAggregate = (title: string, canonicalGuess?: string, description?: string): SectionAggregate => {
    return locateAggregate(canonicalGuess, title) ?? createAggregate(title, canonicalGuess, description)
  }

  const addContribution = (
    canonicalGuess: string | undefined,
    fallbackTitle: string,
    body: string,
    source: SectionContribution['source'],
    meta: Omit<SectionContribution, 'body' | 'source'>
  ) => {
    const trimmed = body.trim()
    if (!trimmed) return
    const aggregate = ensureAggregate(fallbackTitle, canonicalGuess, meta.sectionTitle)
    extractKeywords(fallbackTitle).forEach((keyword) => aggregate.keywords.add(keyword))
    aggregate.bodies.push({
      body: trimmed,
      source,
      ...meta,
    })
  }

  const scoreAggregate = (
    aggregate: SectionAggregate,
    candidateCanonical: string | undefined,
    candidateKeywords: Set<string>
  ): number => {
    let score = 0
    if (candidateCanonical && aggregate.canonical) {
      if (candidateCanonical.toLowerCase() === aggregate.canonical.toLowerCase()) {
        score += 12
      }
    }
    if (candidateCanonical && aggregate.hints.some((hint) => hint === candidateCanonical.toLowerCase())) {
      score += 6
    }
    if (candidateCanonical && aggregate.keywords.has(candidateCanonical.toLowerCase())) {
      score += 2
    }
    const shared = sharedKeywordCount(aggregate.keywords, candidateKeywords)
    if (shared > 0) {
      score += Math.min(6, shared * 2)
    }
    if (!aggregate.bodies.some((entry) => entry.source === 'kb-prd')) {
      score += 2
    } else {
      score -= aggregate.bodies.filter((entry) => entry.source === 'kb-prd').length
    }
    return score
  }

  templateSections.forEach((section, index) => {
    const hint = targetHints[index]
    const canonical =
      canonicalKeyFromTitle(section.title) ??
      canonicalKeyFromTitle(section.description) ??
      canonicalKeyFromTitle(hint) ??
      hint
    const synonyms = canonical ? SECTION_SYNONYMS[canonical] ?? [] : []
    const hints = new Set<string>()
    if (hint) hints.add(hint.toLowerCase())
    if (canonical) hints.add(canonical.toLowerCase())
    synonyms.forEach((synonym) => hints.add(synonym.toLowerCase()))
    const keywords = extractKeywords(section.title, section.description, hint, ...synonyms)
    intentTokens.forEach((token) => keywords.add(token))

    const aggregate: SectionAggregate = {
      title: section.title,
      description: section.description,
      canonical: canonical,
      hints: Array.from(hints),
      keywords,
      bodies: [],
    }

    if (section.body?.trim()) {
      aggregate.bodies.push({
        body: section.body.trim(),
        source: 'existing',
        sectionTitle: section.title,
      })
    }

    registerAggregate(aggregate)
  })

  for (const prd of topPrds) {
    const sections = prd.sections ?? []
    sections.forEach((section, idx) => {
      const body = section.content?.trim()
      if (!body) return
      const fallbackTitle = section.title || `Section ${idx + 1}`
      const canonical =
        canonicalKeyFromTitle(section.key) ??
        canonicalKeyFromTitle(section.title) ??
        section.key?.toLowerCase()
      const candidateKeywords = extractKeywords(section.title, section.key)

      let bestAggregate: SectionAggregate | undefined
      let bestScore = -Infinity
      for (const aggregate of aggregates) {
        const score = scoreAggregate(aggregate, canonical, candidateKeywords)
        if (score > bestScore) {
          bestScore = score
          bestAggregate = aggregate
        }
      }

      const targetAggregate =
        bestAggregate && (bestScore > 0 || !bestAggregate.bodies.length)
          ? bestAggregate
          : ensureAggregate(fallbackTitle, canonical, section.title)

      targetAggregate.bodies.push({
        body,
        source: 'kb-prd',
        prdId: prd.id,
        prdName: prd.name,
        sectionTitle: fallbackTitle,
      })
      prdUsage.add(prd.id)
    })
  }

  if (!aggregates.length) {
    // No template sections existed; seed using PRD order.
    for (const prd of topPrds) {
      (prd.sections ?? []).forEach((section, idx) => {
        const fallbackTitle = section.title || `Section ${idx + 1}`
        const canonical =
          canonicalKeyFromTitle(section.key) ??
          canonicalKeyFromTitle(section.title) ??
          section.key?.toLowerCase()
        const aggregate = ensureAggregate(fallbackTitle, canonical, section.title)
        if (!aggregate.bodies.some((entry) => entry.prdId === prd.id && entry.sectionTitle === fallbackTitle)) {
          const body = section.content?.trim()
          if (body) {
            aggregate.bodies.push({
              body,
              source: 'kb-prd',
              prdId: prd.id,
              prdName: prd.name,
              sectionTitle: fallbackTitle,
            })
            prdUsage.add(prd.id)
          }
        }
      })
    }
  }

  const checklistSet = new Set<string>(context.card.checklist ?? [])

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
          addContribution(
            'kpis',
            'Key Metrics',
            markdownList(items),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
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
          addContribution(
            'risks',
            'Risks & Mitigations',
            parts.join('\n\n'),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
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
        if (parts.length) {
          const title = fragment.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          addContribution(
            'interfaces',
            title,
            parts.join('\n\n'),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
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
          addContribution(
            'governance',
            'Guidelines',
            parts.join('\n\n'),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
        }
        break
      }
      case 'decision_matrix': {
        const items = Array.isArray(fragment.content) ? fragment.content : []
        if (items.length) {
          addContribution(
            'decision',
            'Decision Considerations',
            markdownList(items),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
        }
        break
      }
      case 'template': {
        const value = fragment.content as { sections?: string[] }
        if (value?.sections?.length) {
          addContribution(
            'template',
            'Template Structure',
            value.sections.map((sectionTitle, idx) => `${idx + 1}. ${sectionTitle}`).join('\n'),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
        }
        break
      }
      case 'onboarding_flow':
      case 'ux_states': {
        const items = Array.isArray(fragment.content) ? fragment.content : []
        if (items.length) {
          const title = fragment.type === 'onboarding_flow' ? 'Onboarding Flow' : 'Experience States'
          addContribution(
            fragment.type === 'onboarding_flow' ? 'personas' : 'operations',
            title,
            markdownList(items.map(String)),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
        }
        break
      }
      default: {
        if (Array.isArray(fragment.content) && fragment.content.length) {
          addContribution(
            undefined,
            'Additional Context',
            markdownList(fragment.content),
            'fragment',
            { fragmentId: fragment.id, fragmentType: fragment.type }
          )
        }
        break
      }
    }
  }

  const addMetadataSection = (title: string, items: string[] | undefined, canonicalGuess?: string) => {
    if (!items?.length) return
    addContribution(
      canonicalGuess,
      title,
      markdownList(items),
      'metadata',
      { sectionTitle: title }
    )
  }

  const primaryPrd = topPrds[0]
  addMetadataSection('Recommended Tags', primaryPrd?.tags)
  addMetadataSection('Technical Stack', primaryPrd?.stack_keywords, 'tooling')
  addMetadataSection('Risk Profile', primaryPrd?.risk_profile, 'risks')
  addMetadataSection('Key Metrics', primaryPrd?.kpi_examples, 'kpis')

  const sections = aggregates.map((aggregate, index) => {
    const seenBodies = new Set<string>()
    const parts: string[] = []

    aggregate.bodies.forEach((entry) => {
      const trimmed = entry.body.trim()
      if (!trimmed) return
      const signature = `${entry.source}:${trimmed}`
      if (seenBodies.has(signature)) return
      seenBodies.add(signature)

      if (entry.source === 'kb-prd' && entry.prdName) {
        parts.push(`**${entry.prdName}:**\n${trimmed}`)
      } else {
        parts.push(trimmed)
      }
    })

    return {
      title: aggregate.title || `Section ${index + 1}`,
      description: aggregate.description,
      body: parts.join(parts.length > 1 ? '\n\n---\n\n' : '\n\n'),
    }
  })

  const kbSectionsApplied = aggregates.filter((aggregate) => aggregate.bodies.some((entry) => entry.source === 'kb-prd')).length
  const fragmentSectionsApplied = aggregates.filter((aggregate) => aggregate.bodies.some((entry) => entry.source === 'fragment')).length
  const metadataSectionsApplied = aggregates.filter((aggregate) => aggregate.bodies.some((entry) => entry.source === 'metadata')).length

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
    intent: context.node.intent,
    coverage: {
      templatedSections: templateSections.length,
      kbSectionsApplied,
      fragmentSectionsApplied,
      metadataSectionsApplied,
      prdBlendCount: prdUsage.size,
    },
    candidates: composed.candidates?.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      score: candidate.score,
    })),
  }

  return {
    sections,
    checklist: Array.from(checklistSet),
    provenance,
    prdTemplateId: topPrds[0]?.id,
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
  generation: CardContentResponse,
  kbCoverage?: {
    templatedSections: number
    kbSectionsApplied: number
    fragmentSectionsApplied: number
    metadataSectionsApplied: number
    prdBlendCount: number
  }
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

  if (kbCoverage) {
    if (kbCoverage.kbSectionsApplied >= 4) {
      score += 20
      factors.push('Multiple KB sections mapped into template (+20)')
    } else if (kbCoverage.kbSectionsApplied >= 2) {
      score += 14
      factors.push('KB sections blended into draft (+14)')
    } else if (kbCoverage.kbSectionsApplied >= 1) {
      score += 8
      factors.push('Single KB section leveraged (+8)')
    }

    if (kbCoverage.fragmentSectionsApplied > 0) {
      const fragmentBonus = Math.min(10, kbCoverage.fragmentSectionsApplied * 4)
      score += fragmentBonus
      factors.push(`Fragment context applied in ${kbCoverage.fragmentSectionsApplied} section(s) (+${fragmentBonus})`)
    }

    if (kbCoverage.metadataSectionsApplied > 0) {
      score += 4
      factors.push('Metadata enrichments added (+4)')
    }

    if (kbCoverage.prdBlendCount > 1) {
      score += 6
      factors.push(`Blended insights from ${kbCoverage.prdBlendCount} PRDs (+6)`)
    }
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

  const enhancedFallback =
    generation.usedFallback &&
    kbCoverage !== undefined &&
    (kbCoverage.kbSectionsApplied > 0 || kbCoverage.fragmentSectionsApplied > 0)

  if (generation.usedFallback) {
    const penalty = enhancedFallback ? 8 : 22
    score -= penalty
    factors.push(
      enhancedFallback
        ? 'Fallback output enriched with KB content (-8)'
        : 'Fallback content used (-22)'
    )
  }

  if (generation.warnings?.length) {
    const penalty = Math.min(generation.warnings.length * 5, 15)
    score -= penalty
    factors.push(`Warnings noted during generation (-${penalty})`)
  }

  let maxCap = 100
  if (generation.usedFallback) {
    if (enhancedFallback) {
      maxCap = Math.min(maxCap, 88)
      factors.push('Score capped at 88 until fallback content is replaced')
    } else {
      maxCap = Math.min(maxCap, 75)
      factors.push('Score capped at 75 because content relies on raw fallback')
    }
  }

  if ((generation.warnings?.length ?? 0) > 0) {
    maxCap = Math.min(maxCap, 92)
    factors.push('Score capped below 92 while warnings are present')
  }

  if (score > maxCap) {
    score = maxCap
  }

  score = Math.max(5, Math.min(100, score))

  return {
    score,
    status: generation.usedFallback ? 'fallback' : 'fresh',
    factors,
    lastGeneratedAt: new Date().toISOString(),
    qualityConfidence,
    needsReview:
      (generation.warnings?.length ?? 0) > 0 ||
      (generation.usedFallback && !enhancedFallback),
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
    generation,
    kbDraft?.provenance?.coverage
  )

  const sections = personaliseFallbackSections(
    context,
    generation.sections,
    generation.usedFallback
  )

  return {
    sections,
    checklist: generation.checklist,
    usedFallback: generation.usedFallback,
    warnings: generation.warnings,
    accuracy,
    template,
    prdTemplateId: kbDraft?.prdTemplateId ?? prdContext?.templateId,
    provenance: kbDraft?.provenance,
  }
}
