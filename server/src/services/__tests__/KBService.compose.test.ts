import assert from 'node:assert/strict'
import test from 'node:test'

import { KBService } from '../KBService.js'

test('compose relaxes tag filters when strict match fails', async () => {
  const result = await KBService.compose({
    node_types: ['backend'],
    domains: ['Tech'],
    tags: ['nonexistent-tag'],
    limit: 3,
  })

  assert.ok(result.selectedCount > 0, 'expected fallback PRDs to be selected')
  assert.strictEqual(result.provenance?.matchStage, 'dropTags')

  const primary = result.prds[0]
  assert.ok(Array.isArray(primary.tags) && primary.tags.length > 0)
  assert.ok(Array.isArray(primary.stack_keywords) && primary.stack_keywords.length > 0)
})

test('compose falls back to catalog ordering when no filters match', async () => {
  const result = await KBService.compose({
    node_types: ['unknown-type'],
    domains: ['NonExistentDomain'],
    tags: ['irrelevant'],
    limit: 2,
  })

  assert.ok(result.selectedCount > 0, 'expected catalog fallback to return PRDs')
  assert.strictEqual(result.provenance?.matchStage, 'any')
})
