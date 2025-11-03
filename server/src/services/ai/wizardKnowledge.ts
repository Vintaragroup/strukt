import { kbService, type ComposeInput } from '../KBService.js'
import type { SuggestionKnowledge } from '../../types/ai.js'

const DOMAIN_KEYWORDS: Record<string, RegExp[]> = {
  business: [/(go[- ]?to[- ]?market|marketing|campaign|pricing|revenue|sales|commercial|business case|roi|customers?)/i],
  product: [/(product|feature|persona|journey|experience|ux|design|roadmap|story)/i],
  tech: [/(api|backend|integration|platform|infrastructure|architecture|service|deployment|engineering|devops|stack)/i],
  'data-ai': [/(data|analytics|insight|metric|ml|ai|model|training|pipeline|experiment)/i],
  operations: [/(operations?|runbook|support|on[- ]?call|incident|observability|monitoring|sla|compliance|governance|process)/i],
}

const NODE_KEYWORDS: Array<{ type: string; pattern: RegExp }> = [
  { type: 'frontend', pattern: /(frontend|front[- ]?end|ui|user interface|mobile app|web app|dashboard|portal)/i },
  { type: 'backend', pattern: /(backend|back[- ]?end|api|service|microservice|server)/i },
  { type: 'doc', pattern: /(documentation|doc|brief|runbook|spec|guid(e|ance)|playbook)/i },
  { type: 'domain', pattern: /(domain model|taxonomy|information architecture|knowledge base)/i },
]

const FRAGMENT_QUESTION_MAP: Record<string, string[]> = {
  acceptance_criteria: ['compliance'],
  kpi_set: ['telemetry_focus'],
  interface_pattern: ['integration_targets'],
  ux_states: ['experience_tone'],
  risk_mitigation: ['regulatory_reporting'],
  decision_matrix: ['growth_channels'],
  onboarding_flow: ['change_management'],
}

const DEFAULT_DOMAINS = ['product', 'business']
const DEFAULT_NODE_TYPES = ['root', 'requirement']

function normalizeUnique(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

function detectDomains(text: string): string[] {
  const matches = new Set<string>()
  for (const [domain, patterns] of Object.entries(DOMAIN_KEYWORDS)) {
    if (patterns.some((regex) => regex.test(text))) {
      matches.add(domain)
    }
  }
  if (matches.size === 0) {
    DEFAULT_DOMAINS.forEach((domain) => matches.add(domain))
  }
  return Array.from(matches)
}

function detectNodeTypes(text: string): string[] {
  const types = new Set<string>(DEFAULT_NODE_TYPES)
  for (const { type, pattern } of NODE_KEYWORDS) {
    if (pattern.test(text)) {
      types.add(type)
    }
  }
  if (/(analytics?|metric|dashboard|report)/i.test(text)) {
    types.add('frontend')
  }
  return Array.from(types)
}

function buildFilters(text: string): ComposeInput {
  const lower = text.toLowerCase()
  return {
    node_types: detectNodeTypes(lower),
    domains: detectDomains(lower),
    tags: [],
    limit: 5,
  }
}

function snippet(content: string | undefined, limit = 260): string {
  if (!content) return ''
  const clean = content.replace(/\s+/g, ' ').trim()
  if (clean.length <= limit) return clean
  return `${clean.slice(0, limit - 1).trim()}…`
}

function extractFragmentLabel(content: unknown): string | undefined {
  if (!content || typeof content !== 'object') {
    return undefined
  }
  const candidate = content as Record<string, unknown>
  const keys = ['title', 'name', 'label', 'summary', 'heading']
  for (const key of keys) {
    const value = candidate[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  if (Array.isArray(candidate['items'])) {
    const first = candidate['items'][0] as Record<string, unknown> | undefined
    if (first && typeof first === 'object') {
      const title = first['title']
      if (typeof title === 'string' && title.trim()) {
        return title.trim()
      }
    }
  }
  return undefined
}

function buildPromptContext(prds: SuggestionKnowledge['prds'], fragments: SuggestionKnowledge['fragments']): string {
  const chunks: string[] = []
  prds.forEach((prd) => {
    const sectionText = prd.sections
      .map((section) => `${section.title}: ${section.snippet}`)
      .join('\n')
    chunks.push(`PRD: ${prd.name}\n${sectionText}`)
  })
  fragments.forEach((fragment) => {
    const line = fragment.label ? `${fragment.type} • ${fragment.label}` : fragment.type
    chunks.push(`Fragment: ${line}`)
  })
  return chunks.join('\n\n')
}

export async function buildWizardKnowledge(idea: string): Promise<SuggestionKnowledge | null> {
  const filters = buildFilters(idea)
  const composed = await kbService.compose(filters)

  const prds = (composed.prds || []).slice(0, 2).map((prd) => ({
    id: prd.id,
    name: prd.name,
    sections: (prd.sections || []).slice(0, 3).map((section) => ({
      title: section.title,
      key: section.key,
      snippet: snippet(section.content),
    })),
  }))

  const fragments = (composed.fragments || []).slice(0, 4).map((fragment) => ({
    id: fragment.id,
    type: fragment.type,
    label: extractFragmentLabel(fragment.content),
  }))

  const domains = normalizeUnique(filters.domains || [])
  const questionHints = new Set<string>()

  domains.forEach((domain) => {
    if (domain === 'data-ai') {
      questionHints.add('data_strategy')
      questionHints.add('ai_training')
    }
    if (domain === 'business') {
      questionHints.add('revenue_model')
    }
    if (domain === 'operations') {
      questionHints.add('change_management')
      questionHints.add('telemetry_focus')
    }
    if (domain === 'compliance') {
      questionHints.add('compliance')
    }
    if (domain === 'marketing' || /marketing/.test(domain)) {
      questionHints.add('growth_channels')
    }
  })

  ;(composed.fragments || []).forEach((fragment) => {
    const mapped = FRAGMENT_QUESTION_MAP[fragment.type]
    if (mapped) {
      mapped.forEach((id) => questionHints.add(id))
    }
  })

  const nodeTypes = normalizeUnique(filters.node_types || [])
  if (nodeTypes.includes('backend')) {
    questionHints.add('integration_needs')
  }
  if (nodeTypes.includes('frontend')) {
    questionHints.add('experience_tone')
  }

  const summaryParts: string[] = []
  if (prds.length) {
    summaryParts.push(`Relevant PRDs: ${prds.map((prd) => prd.name).join(', ')}`)
  }
  if (fragments.length) {
    summaryParts.push(
      `Supporting fragments: ${fragments
        .map((fragment) => `${fragment.type}${fragment.label ? ` (${fragment.label})` : ''}`)
        .join(', ')}`
    )
  }
  if (!summaryParts.length) {
    summaryParts.push('Knowledge base filters aligned to your idea were identified but no direct matches were found.')
  }

  const promptContext = buildPromptContext(prds, fragments)

  return {
    filters: {
      nodeTypes,
      domains,
      tags: [],
    },
    summary: summaryParts.join('\n'),
    prds,
    fragments,
    questionHints: Array.from(questionHints),
    promptContext,
  }
}
