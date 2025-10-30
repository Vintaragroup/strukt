import crypto from 'crypto'
import type { SpecSummary } from './SpecSummaryService.js'

interface CachedSummary {
  summary: SpecSummary
  expiresAt: number
  workspaceId: string
  specHash: string
}

const cache = new Map<string, CachedSummary>()

function buildCacheKey(workspaceId: string, specHash: string) {
  return `${workspaceId}:${specHash}`
}

function buildPublicId(workspaceId: string, specHash: string) {
  return crypto.createHash('sha256').update(buildCacheKey(workspaceId, specHash)).digest('hex')
}

function purgeExpired() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key)
    }
  }
}

export function cacheSpecSummary(params: {
  workspaceId: string
  summary: SpecSummary
  ttlMs?: number
}) {
  purgeExpired()

  const ttl = params.ttlMs ?? 5 * 60 * 1000 // default 5 minutes
  const { workspaceId, summary } = params
  const publicId = buildPublicId(workspaceId, summary.importHash)

  cache.set(publicId, {
    summary,
    expiresAt: Date.now() + ttl,
    workspaceId,
    specHash: summary.importHash,
  })

  return publicId
}

export function getCachedSpecSummary(publicId: string): SpecSummary | undefined {
  purgeExpired()
  const cached = cache.get(publicId)
  if (!cached) return undefined

  if (cached.expiresAt <= Date.now()) {
    cache.delete(publicId)
    return undefined
  }
  return cached.summary
}

export function invalidateSpecSummaries(workspaceId: string) {
  purgeExpired()
  for (const [key, value] of cache.entries()) {
    if (value.workspaceId === workspaceId) {
      cache.delete(key)
    }
  }
}
