import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cacheSpecSummary, getCachedSpecSummary, invalidateSpecSummaries } from '../specCache.js'

const mockSummary = {
  specType: 'openapi' as const,
  title: 'Mock API',
  version: '1.0.0',
  operations: [],
  importHash: 'hash123',
  generatedAt: new Date().toISOString(),
}

describe('specCache', () => {
  it('stores and retrieves a summary while respecting workspace boundaries', () => {
    const workspaceId = 'workspace-1'
    const referenceId = cacheSpecSummary({ workspaceId, summary: mockSummary })

    const retrieved = getCachedSpecSummary(referenceId)
    assert.ok(retrieved)
    assert.equal(retrieved?.title, 'Mock API')

    invalidateSpecSummaries(workspaceId)
    const afterInvalidate = getCachedSpecSummary(referenceId)
    assert.equal(afterInvalidate, undefined)
  })

  it('purges entries based on ttl', async () => {
    const workspaceId = 'workspace-ttl'
    const referenceId = cacheSpecSummary({ workspaceId, summary: mockSummary, ttlMs: 10 })

    // Ensure available immediately
    assert.ok(getCachedSpecSummary(referenceId))

    await new Promise((resolve) => setTimeout(resolve, 20))

    const expired = getCachedSpecSummary(referenceId)
    assert.equal(expired, undefined)
  })
})
