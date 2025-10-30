import type { SuggestedNode } from '../../types/ai.js'

const ALLOWED_TYPES = new Set(['root', 'frontend', 'backend', 'requirement', 'doc'])
const ALLOWED_DOMAINS = new Set(['business', 'product', 'tech', 'data-ai', 'operations'])

function clampRing(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined
  const rounded = Math.round(value)
  return Math.min(6, Math.max(1, rounded))
}

function normalizeDomain(domain?: string): string | undefined {
  if (!domain) return undefined
  const normalized = domain.toLowerCase().trim()
  return ALLOWED_DOMAINS.has(normalized) ? normalized : undefined
}

function normalizeType(type?: string): SuggestedNode['type'] {
  if (!type) return 'requirement'
  const normalized = type.toLowerCase().trim()
  return (ALLOWED_TYPES.has(normalized) ? normalized : 'requirement') as SuggestedNode['type']
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
    type: normalizeType(input.type),
    summary,
    domain: normalizeDomain(input.domain),
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
