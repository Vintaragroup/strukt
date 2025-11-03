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

type FoundationRule = {
  key: string
  satisfiedBy: (node: SuggestedNode) => boolean
  build: () => SuggestedNode
}

const FOUNDATION_RULES: FoundationRule[] = [
  {
    key: 'foundation-backend-core',
    satisfiedBy: (node) => node.type === 'backend',
    build: () => ({
      label: 'Core Backend API Service',
      type: 'backend',
      summary: 'Design the primary API/service layer handling business logic, contracts, scaling, and reliability.',
      domain: 'tech',
      ring: 1,
      metadata: { foundationKey: 'foundation-backend-core' },
    }),
  },
  {
    key: 'foundation-data-layer',
    satisfiedBy: (node) => node.domain === 'data-ai' || /data|analytics|warehouse|storage/i.test(`${node.label} ${node.summary}`),
    build: () => ({
      label: 'Data Persistence & Pipeline Plan',
      type: 'backend',
      summary: 'Define data models, storage technology, ingestion pipelines, retention, and access patterns for the program.',
      domain: 'data-ai',
      ring: 1,
      metadata: { foundationKey: 'foundation-data-layer' },
    }),
  },
  {
    key: 'foundation-auth-access',
    satisfiedBy: (node) => /auth|identity|access|iam|login|permission/i.test(`${node.label} ${node.summary}`),
    build: () => ({
      label: 'Identity & Access Control',
      type: 'backend',
      summary: 'Implement authentication, authorization, session management, and compliance guardrails for all user flows.',
      domain: 'operations',
      ring: 1,
      metadata: { foundationKey: 'foundation-auth-access' },
    }),
  },
  {
    key: 'foundation-observability',
    satisfiedBy: (node) => /observability|monitor|telemetry|logging|alert/i.test(`${node.label} ${node.summary}`),
    build: () => ({
      label: 'Observability & Run Operations',
      type: 'doc',
      summary: 'Capture logging, metrics, tracing, and alerting needed to operate the platform reliably.',
      domain: 'operations',
      ring: 2,
      metadata: { foundationKey: 'foundation-observability' },
    }),
  },
]

export function ensureFoundationNodes(existing: SuggestedNode[]): SuggestedNode[] {
  const nodes = [...existing]
  const seenLabels = new Set<string>(
    nodes
      .map((node) => (typeof node.label === 'string' ? node.label.toLowerCase() : ''))
      .filter(Boolean)
  )

  for (const rule of FOUNDATION_RULES) {
    const alreadyPresent = nodes.some((node) => {
      if (typeof node.metadata?.foundationKey === 'string' && node.metadata.foundationKey === rule.key) {
        return true
      }
      return rule.satisfiedBy(node)
    })

    if (alreadyPresent) {
      continue
    }

    const baseNode = rule.build()
    let candidate = baseNode
    let duplicateCounter = 1

    while (seenLabels.has(candidate.label.toLowerCase())) {
      duplicateCounter += 1
      candidate = {
        ...baseNode,
        label: `${baseNode.label} ${duplicateCounter}`,
      }
    }

    seenLabels.add(candidate.label.toLowerCase())
    nodes.push(candidate)
  }

  return nodes
}

export function buildMockNodes(seed: string, count = 3): SuggestedNode[] {
  const domains = ['business', 'product', 'tech', 'data-ai', 'operations']
  const types = ['requirement', 'frontend', 'backend', 'doc']
  const base = Math.abs(hashString(seed))
  const nodes: SuggestedNode[] = ensureFoundationNodes([])
  const targetLength = Math.max(count, nodes.length)
  const seenLabels = new Set<string>(nodes.map((node) => node.label.toLowerCase()))

  let i = 0
  while (nodes.length < targetLength) {
    const domain = domains[(base + i) % domains.length]
    const type = types[(base + i) % types.length]
    const candidateLabel = suggestLabel(domain, type, i)
    if (!seenLabels.has(candidateLabel.toLowerCase())) {
      nodes.push({
        label: candidateLabel,
        type,
        summary: `Auto-generated ${type} for ${domain} focus`,
        domain,
        ring: (i % 3) + 1,
        metadata: undefined,
      })
      seenLabels.add(candidateLabel.toLowerCase())
    }
    i += 1
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
