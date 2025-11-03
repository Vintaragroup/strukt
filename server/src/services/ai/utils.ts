import { Types } from 'mongoose'
import type { SpecSummary } from '../specs/SpecSummaryService.js'
import type { SuggestedNode } from '../../types/ai.js'

interface IntegrationNodeOptions {
  apiIntent?: string
  parentId?: string
}

export function ensureObjectId(value: string): Types.ObjectId {
  if (Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value)
  }
  throw new Error(`Invalid ObjectId: ${value}`)
}

export function buildMockNodes(seed: string, count = 3): SuggestedNode[] {
  const domains = ['business', 'product', 'tech', 'data-ai', 'operations']
  const types = ['requirement', 'frontend', 'backend', 'doc']
  const base = Math.abs(hashString(seed))
  const nodes: SuggestedNode[] = []

  for (let i = 0; i < count; i++) {
    const domain = domains[(base + i) % domains.length]
    const type = types[(base + i) % types.length]
    nodes.push({
      label: suggestLabel(domain, type, i),
      type,
      summary: `Auto-generated ${type} for ${domain} focus`,
      domain,
      ring: (i % 3) + 1,
      metadata: undefined,
    })
  }

  return nodes
}

export function buildApiIntegrationNodes(
  summary: SpecSummary,
  count = 3,
  options: IntegrationNodeOptions = {}
): SuggestedNode[] {
  const operations = summary.operations.slice(0, count)
  if (!operations.length) {
    return buildMockNodes(summary.importHash, count)
  }

  return operations.map((operation): SuggestedNode => {
    const labelBase = operation.summary
      ? operation.summary.split('.')[0]
      : `${operation.method} ${operation.path}`
    const label = truncateLabel(labelBase || `${summary.title} integration`, 48)
    const recommendedCalls = [`${operation.method} ${operation.path}`]
    const nodeSummaryParts = [
      `Connect to ${summary.title} endpoint ${operation.method} ${operation.path}`,
    ]
    if (operation.summary) {
      nodeSummaryParts.push(`Purpose: ${operation.summary}`)
    }
    if (options.apiIntent) {
      nodeSummaryParts.push(`Supports intent: ${options.apiIntent}`)
    }

    return {
      label,
      type: 'backend',
      summary: nodeSummaryParts.join('. '),
      domain: 'tech',
      ring: 2,
      metadata: {
        ...(options.parentId ? { parentId: options.parentId } : {}),
        apiIntegration: {
          apiName: summary.title,
          specHash: summary.importHash,
          specType: summary.specType,
          rationale:
            operation.summary ||
            options.apiIntent ||
            `Enable ${summary.title} integration`,
          recommendedCalls,
          integrationPoints: options.parentId ? ['linked-parent-node'] : ['integration-service'],
        },
      },
    }
  })
}

export function summarizeWorkspace(workspace: any, limit = 10): string | undefined {
  if (!workspace || !Array.isArray(workspace.nodes) || workspace.nodes.length === 0) {
    return undefined
  }
  const lines = workspace.nodes.slice(0, limit).map((node: any) => {
    const title = node?.data?.title || node?.label || node?.id
    const type = node?.type || 'unknown'
    const summary = node?.data?.summary ? ` - ${node.data.summary}` : ''
    return `• ${title} (${type})${summary}`
  })
  return lines.join('\n')
}

export function summarizeNode(node: any): string | undefined {
  if (!node) return undefined
  const title = node?.data?.title || node?.label || node?.id
  const type = node?.type || 'unknown'
  const summary = node?.data?.summary ? `Summary: ${node.data.summary}` : undefined
  const tags = Array.isArray(node?.data?.tags) && node.data.tags.length
    ? `Tags: ${node.data.tags.join(', ')}`
    : undefined
  return [
    `${title} (${type})`,
    summary,
    tags,
  ].filter(Boolean).join('\n')
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function suggestLabel(domain: string, type: string, index: number) {
  const domainLabel = domain.replace(/-/g, ' ')
  const capitalized = domainLabel.charAt(0).toUpperCase() + domainLabel.slice(1)
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
  return `${capitalized} ${typeLabel} #${index + 1}`
}

function truncateLabel(label: string, maxLength: number) {
  if (label.length <= maxLength) return label
  return `${label.slice(0, maxLength - 3)}...`
}
