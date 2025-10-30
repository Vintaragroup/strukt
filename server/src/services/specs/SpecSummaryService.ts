import crypto from 'crypto'
import { z } from 'zod'

export type SpecType = 'openapi' | 'postman'

const MAX_DEFAULT_OPERATIONS = 15

const SupportedSpecSchema = z.object({
  specType: z.enum(['openapi', 'postman']),
  spec: z.unknown(),
  maxOperations: z.number().int().positive().max(50).optional(),
})

export interface OperationSummary {
  method: string
  path: string
  summary?: string
  category?: string
  auth?: string[]
  requestBodyTypes?: string[]
  successStatusCodes?: string[]
}

export interface SpecSummary {
  specType: SpecType
  title: string
  version?: string
  description?: string
  servers?: string[]
  auth?: string[]
  tags?: string[]
  operations: OperationSummary[]
  importHash: string
  generatedAt: string
}

function normaliseMethod(method: string): string {
  return method.toUpperCase()
}

function truncateArray<T>(items: T[], limit: number) {
  return items.slice(0, limit)
}

function computeHash(raw: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex')
}

function extractOpenApiAuth(doc: any): string[] {
  const schemes = doc?.components?.securitySchemes
  if (!schemes || typeof schemes !== 'object') return []
  return Object.entries(schemes)
    .map(([name, scheme]) => {
      if (!scheme || typeof scheme !== 'object') return undefined
      const type = typeof scheme.type === 'string' ? scheme.type : 'custom'
      const schemeName = typeof scheme.scheme === 'string' ? scheme.scheme : undefined
      return schemeName ? `${name} (${type}:${schemeName})` : `${name} (${type})`
    })
    .filter(Boolean) as string[]
}

function extractOpenApiOperations(doc: any, maxOperations: number): OperationSummary[] {
  const paths = doc?.paths
  if (!paths || typeof paths !== 'object') return []

  const operations: OperationSummary[] = []
  const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

  for (const [pathKey, pathValue] of Object.entries(paths)) {
    if (!pathValue || typeof pathValue !== 'object') continue
    for (const method of httpMethods) {
      const op = (pathValue as any)[method]
      if (!op || typeof op !== 'object') continue
      const successCodes = Object.keys(op.responses || {}).filter((status) => status.startsWith('2'))
      const contentTypes = op.requestBody?.content
        ? Object.keys(op.requestBody.content).map((key) => key.toLowerCase())
        : undefined
      const summary: OperationSummary = {
        method: normaliseMethod(method),
        path: pathKey,
        summary: typeof op.summary === 'string' ? op.summary : op.operationId,
        category: Array.isArray(op.tags) ? op.tags[0] : undefined,
        auth: Array.isArray(op.security)
          ? op.security.flatMap((sec: any) => Object.keys(sec || {}))
          : undefined,
        requestBodyTypes: contentTypes?.length ? Array.from(new Set(contentTypes)) : undefined,
        successStatusCodes: successCodes.length ? successCodes : undefined,
      }
      operations.push(summary)
    }
  }

  return truncateArray(operations, maxOperations)
}

function extractOpenApiTags(doc: any): string[] {
  const tags = doc?.tags
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag: any) => (typeof tag?.name === 'string' ? tag.name : undefined))
    .filter(Boolean) as string[]
}

function summariseOpenApiDocument(rawDoc: any, maxOperations: number): SpecSummary {
  const info = rawDoc?.info || {}
  const title =
    typeof info.title === 'string'
      ? info.title
      : 'OpenAPI Specification'

  const servers: string[] = Array.isArray(rawDoc?.servers)
    ? truncateArray(
        rawDoc.servers
          .map((srv: any) =>
            typeof srv?.url === 'string'
              ? srv.url
              : undefined
          )
          .filter(Boolean),
        3
      )
    : []

  const operations = extractOpenApiOperations(rawDoc, maxOperations)

  return {
    specType: 'openapi',
    title,
    version: typeof info.version === 'string' ? info.version : undefined,
    description: typeof info.description === 'string' ? info.description : undefined,
    servers,
    auth: extractOpenApiAuth(rawDoc),
    tags: extractOpenApiTags(rawDoc),
    operations,
    importHash: computeHash(rawDoc),
    generatedAt: new Date().toISOString(),
  }
}

interface PostmanNode {
  name?: string
  request?: {
    method?: string
    url?: {
      raw?: string
      host?: string[]
      path?: string[]
    } | string
    description?: string
    body?: {
      mode?: string
      raw?: string
      options?: Record<string, unknown>
    }
    header?: Array<{ key?: string; value?: string }>
  }
  response?: unknown[]
  description?: string
  item?: PostmanNode[]
  auth?: {
    type?: string
  }
}

function flattenPostmanNodes(nodes: PostmanNode[], accumulator: PostmanNode[] = []): PostmanNode[] {
  for (const node of nodes) {
    if (node.item && Array.isArray(node.item)) {
      flattenPostmanNodes(node.item, accumulator)
    } else {
      accumulator.push(node)
    }
  }
  return accumulator
}

function normalisePostmanUrl(url: PostmanNode['request']['url']): string {
  if (!url) return ''
  if (typeof url === 'string') return url
  if (typeof url.raw === 'string') return url.raw
  if (Array.isArray(url.host) || Array.isArray(url.path)) {
    const host = Array.isArray(url.host) ? url.host.join('.') : ''
    const path = Array.isArray(url.path) ? `/${url.path.join('/')}` : ''
    return `${host}${path}`
  }
  return ''
}

function extractPostmanOperations(collection: any, maxOperations: number): OperationSummary[] {
  const items: PostmanNode[] = Array.isArray(collection?.item) ? collection.item : []
  const flattened = flattenPostmanNodes(items)
  const operations: OperationSummary[] = []

  for (const node of flattened) {
    if (!node.request) continue
    const method = node.request.method ? normaliseMethod(node.request.method) : 'GET'
    const path = normalisePostmanUrl(node.request.url)

    const summary: OperationSummary = {
      method,
      path: path || node.name || 'Unnamed request',
      summary:
        typeof node.request.description === 'string'
          ? node.request.description
          : node.description,
    }

    const authType = node.auth?.type || collection?.auth?.type
    if (authType) {
      summary.auth = [authType]
    }

    if (node.request.body?.mode) {
      summary.requestBodyTypes = [node.request.body.mode]
    }

    operations.push(summary)
  }

  return truncateArray(operations, maxOperations)
}

function summarisePostmanCollection(rawDoc: any, maxOperations: number): SpecSummary {
  const info = rawDoc?.info || {}
  const title =
    typeof info.name === 'string'
      ? info.name
      : 'Postman Collection'

  const description = typeof info.description === 'string' ? info.description : undefined
  const authType = rawDoc?.auth?.type ? [rawDoc.auth.type] : undefined

  return {
    specType: 'postman',
    title,
    version: typeof info.version === 'string' ? String(info.version) : undefined,
    description,
    auth: authType,
    operations: extractPostmanOperations(rawDoc, maxOperations),
    importHash: computeHash(rawDoc),
    generatedAt: new Date().toISOString(),
  }
}

export function buildSpecSummary(input: unknown): SpecSummary {
  const { specType, spec, maxOperations } = SupportedSpecSchema.parse(input)
  const limit = maxOperations ?? MAX_DEFAULT_OPERATIONS

  if (specType === 'openapi') {
    return summariseOpenApiDocument(spec, limit)
  }

  return summarisePostmanCollection(spec, limit)
}

export function serialiseSpecSummary(summary: SpecSummary): string {
  const lines: string[] = [
    `Spec: ${summary.title} (${summary.specType})`,
  ]
  if (summary.version) {
    lines.push(`Version: ${summary.version}`)
  }
  if (summary.servers?.length) {
    lines.push(`Servers: ${summary.servers.join(', ')}`)
  }
  if (summary.auth?.length) {
    lines.push(`Auth: ${summary.auth.join(', ')}`)
  }
  if (summary.tags?.length) {
    lines.push(`Tags: ${summary.tags.join(', ')}`)
  }
  const operations = summary.operations
    .map((op) => {
      const parts = [`${op.method} ${op.path}`]
      if (op.summary) {
        parts.push(`- ${op.summary}`)
      }
      if (op.auth?.length) {
        parts.push(`auth: ${op.auth.join(', ')}`)
      }
      if (op.requestBodyTypes?.length) {
        parts.push(`body: ${op.requestBodyTypes.join(', ')}`)
      }
      if (op.successStatusCodes?.length) {
        parts.push(`success: ${op.successStatusCodes.join(', ')}`)
      }
      return parts.join(' ')
    })
    .join('\n')

  if (operations) {
    lines.push('Endpoints:')
    lines.push(operations)
  }

  return lines.join('\n')
}
