import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildApiIntegrationNodes } from '../utils.js'

describe('buildApiIntegrationNodes', () => {
  const specSummary = {
    specType: 'openapi' as const,
    title: 'Example Payments API',
    version: '1.2.0',
    description: 'Handle payments and refunds',
    servers: ['https://api.example.com'],
    auth: ['bearerAuth (http:bearer)'],
    tags: ['payments'],
    operations: [
      {
        method: 'POST',
        path: '/payments',
        summary: 'Create payment',
        category: 'payments',
        auth: ['bearerAuth'],
        requestBodyTypes: ['application/json'],
        successStatusCodes: ['201'],
      },
      {
        method: 'GET',
        path: '/payments/{id}',
        summary: 'Fetch payment detail',
        category: 'payments',
        auth: ['bearerAuth'],
        requestBodyTypes: undefined,
        successStatusCodes: ['200'],
      },
    ],
    importHash: 'abc123',
    generatedAt: new Date().toISOString(),
  }

  it('creates backend integration nodes with metadata', () => {
    const nodes = buildApiIntegrationNodes(specSummary, 2, {
      apiIntent: 'Process customer payments',
      parentId: 'backend-1',
    })

    assert.equal(nodes.length, 2)
    const [first] = nodes
    assert.equal(first.type, 'backend')
   assert.equal(first.domain, 'tech')
   assert.ok(first.metadata)
   assert.equal(first.metadata?.parentId, 'backend-1')
    const integration = (first.metadata as { apiIntegration?: { apiName?: string; recommendedCalls?: unknown } })?.apiIntegration
    assert.ok(integration)
    assert.equal(integration?.apiName, 'Example Payments API')
    assert.ok(Array.isArray(integration?.recommendedCalls))
  })
})
