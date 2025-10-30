import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildSpecSummary, serialiseSpecSummary } from '../SpecSummaryService.js'

describe('SpecSummaryService', () => {
  it('summarises OpenAPI documents', () => {
    const spec = {
      openapi: '3.1.0',
      info: {
        title: 'Payments API',
        version: '1.0.0',
        description: 'Process payments and refunds',
      },
      servers: [{ url: 'https://api.example.com' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
      paths: {
        '/payments': {
          post: {
            summary: 'Create payment',
            requestBody: {
              content: {
                'application/json': {},
              },
            },
            responses: {
              '201': {},
            },
            tags: ['payments'],
          },
        },
      },
    }

    const summary = buildSpecSummary({
      specType: 'openapi',
      spec,
      maxOperations: 5,
    })

    assert.equal(summary.specType, 'openapi')
    assert.equal(summary.title, 'Payments API')
    assert.equal(summary.servers?.[0], 'https://api.example.com')
    assert.equal(summary.auth?.[0], 'bearerAuth (http:bearer)')
    assert.equal(summary.operations.length, 1)
    assert.equal(summary.operations[0]?.method, 'POST')
    assert.equal(summary.operations[0]?.path, '/payments')

    const prompt = serialiseSpecSummary(summary)
    assert.ok(prompt.includes('POST /payments'))
  })

  it('summarises Postman collections', () => {
    const collection = {
      info: {
        name: 'Inventory API',
      },
      item: [
        {
          name: 'Get inventory',
          request: {
            method: 'GET',
            url: {
              raw: 'https://example.com/inventory',
            },
            description: 'Retrieve inventory list',
          },
        },
      ],
    }

    const summary = buildSpecSummary({
      specType: 'postman',
      spec: collection,
    })

    assert.equal(summary.specType, 'postman')
    assert.equal(summary.title, 'Inventory API')
    assert.equal(summary.operations.length, 1)
    assert.equal(summary.operations[0]?.method, 'GET')
    assert.equal(summary.operations[0]?.path, 'https://example.com/inventory')
  })
})
