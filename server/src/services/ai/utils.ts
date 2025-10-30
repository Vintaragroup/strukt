import { Types } from 'mongoose'

export function ensureObjectId(value: string): Types.ObjectId {
  if (Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value)
  }
  throw new Error(`Invalid ObjectId: ${value}`)
}

export function buildMockNodes(seed: string, count = 3) {
  const domains = ['business', 'product', 'tech', 'data-ai', 'operations']
  const types = ['requirement', 'frontend', 'backend', 'doc']
  const base = Math.abs(hashString(seed))
  const nodes = []

  for (let i = 0; i < count; i++) {
    const domain = domains[(base + i) % domains.length]
    const type = types[(base + i) % types.length]
    nodes.push({
      label: suggestLabel(domain, type, i),
      type,
      summary: `Auto-generated ${type} for ${domain} focus`,
      domain,
      ring: (i % 3) + 1,
    })
  }

  return nodes
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
