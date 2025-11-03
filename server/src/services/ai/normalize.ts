import type { SuggestedNode } from '../../types/ai.js'

const ALLOWED_TYPES = new Set(['root', 'frontend', 'backend', 'requirement', 'doc'])
const ALLOWED_DOMAINS = new Set(['business', 'product', 'tech', 'data-ai', 'operations'])

const TYPE_SYNONYMS: Array<{ match: RegExp; type: SuggestedNode['type'] }> = [
  { match: /(api|service)[-\s]?gateway/i, type: 'backend' },
  { match: /(api|integration|platform)\s+(service|layer)/i, type: 'backend' },
  { match: /(backend|service)\s+(plan|blueprint|capability)/i, type: 'backend' },
  { match: /(auth|identity|login|access)\s+(service|layer)/i, type: 'backend' },
  { match: /data\s+(pipeline|platform|mesh|lake|warehouse)/i, type: 'backend' },
  { match: /(observability|monitoring|telemetry)\s+(stack|service)/i, type: 'doc' },
  { match: /(ui|client|front[-\s]?end)/i, type: 'frontend' },
]

const DOMAIN_SYNONYMS: Array<{ match: RegExp; domain: string }> = [
  { match: /(engineering|platform|architecture|api|service)/i, domain: 'tech' },
  { match: /(data|analytics|insights|ml|ai|warehouse|lake)/i, domain: 'data-ai' },
  { match: /(operations|ops|sre|observability|monitoring)/i, domain: 'operations' },
  { match: /(business|strategy|go-to-market|gtm|program)/i, domain: 'business' },
  { match: /(product|roadmap|feature)/i, domain: 'product' },
]

function clampRing(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined
  const rounded = Math.round(value)
  return Math.min(6, Math.max(1, rounded))
}

function normalizeDomain(domain?: string, label?: string, summary?: string): string | undefined {
  const candidates = [domain, label, summary].filter((value): value is string => typeof value === 'string')
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase().trim()
    if (ALLOWED_DOMAINS.has(normalized)) {
      return normalized
    }
    const synonym = DOMAIN_SYNONYMS.find(({ match }) => match.test(candidate))
    if (synonym) {
      return synonym.domain
    }
  }
  return undefined
}

function normalizeType(type?: string, label?: string): SuggestedNode['type'] {
  const candidates = [type, label]
  for (const candidate of candidates) {
    if (!candidate) continue
    const normalized = candidate.toLowerCase().trim()
    if (ALLOWED_TYPES.has(normalized)) {
      return normalized as SuggestedNode['type']
    }
    const synonym = TYPE_SYNONYMS.find(({ match }) => match.test(candidate))
    if (synonym) {
      return synonym.type
    }
  }
  return 'requirement'
}

export function normalizeSuggestedNode(input: Partial<SuggestedNode>, index = 0): SuggestedNode {
  const label = typeof input.label === 'string' && input.label.trim().length > 0
    ? input.label.trim()
    : `Suggested Node ${index + 1}`

  const summary = typeof input.summary === 'string' && input.summary.trim().length > 0
    ? input.summary.trim()
    : buildFallbackSummary(label, input.type, input.domain)

  const tags = Array.isArray(input.tags)
    ? input.tags.filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
    : undefined

  const metadata = input.metadata && typeof input.metadata === 'object'
    ? input.metadata
    : undefined

  return {
    id: typeof input.id === 'string' ? input.id : undefined,
    label,
    type: normalizeType(input.type, label),
    summary,
    domain: normalizeDomain(input.domain, label, summary),
    ring: clampRing(input.ring),
    tags,
    metadata,
  }
}

function buildFallbackSummary(label: string, type?: string, domain?: string): string {
  const typeLabel = typeof type === 'string' ? type.toLowerCase() : 'requirement'
  const domainLabel = typeof domain === 'string' ? domain.replace(/-/g, ' ') : undefined

  const focus = domainLabel ? `${domainLabel} ${typeLabel}` : typeLabel
  return `${label} outlines the next step for the ${focus} track.`
}

export function normalizeSuggestedNodes(nodes: Partial<SuggestedNode>[]): SuggestedNode[] {
  return nodes.map((node, index) => normalizeSuggestedNode(node, index))
}
