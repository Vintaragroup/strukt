import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import type { CardContentRequest, CardContentResponse } from '../../GenerationService.js'
import { GenerationService } from '../../GenerationService.js'
import type { ComposeResult, NodeCardContext } from '../../cards/cardComposer.js'
import { composeCardContent } from '../../cards/cardComposer.js'

type ComposeFixture = {
  name: string
  context: NodeCardContext
  expect: {
    minAccuracy: number
    minKbSections: number
    minFragmentSections?: number
    expectedPrdIds?: string[]
    requireFactors?: string[]
    allowFallback?: boolean
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixturesDir = path.resolve(__dirname, '..', '__fixtures__')

async function loadFixtures(): Promise<ComposeFixture[]> {
  const entries = await fs.readdir(fixturesDir)
  const jsonFiles = entries.filter((entry) => entry.endsWith('.json'))
  const fixtures: ComposeFixture[] = []

  for (const file of jsonFiles) {
    const raw = await fs.readFile(path.join(fixturesDir, file), 'utf-8')
    fixtures.push(JSON.parse(raw) as ComposeFixture)
  }

  return fixtures
}

test('card composer blends KB content for representative nodes', async (t) => {
  const fixtures = await loadFixtures()
  assert.ok(fixtures.length > 0, 'expected at least one compose fixture')

  const originalGenerator = GenerationService.generateCardContent.bind(GenerationService)
  t.after(() => {
    GenerationService.generateCardContent = originalGenerator
  })

  GenerationService.generateCardContent = async (
    request: CardContentRequest
  ): Promise<CardContentResponse> => {
    const sections =
      request.existingContent?.map((section) => ({
        title: section.title,
        body: section.body ?? '',
      })) ?? []

    return {
      success: true,
      sections,
      checklist: request.card.checklist,
      usedFallback: false,
      warnings: [],
    }
  }

  for (const fixture of fixtures) {
    await t.test(fixture.name, async () => {
      const result: ComposeResult = await composeCardContent(structuredClone(fixture.context))

      assert.ok(result.sections.length > 0, 'expected sections to be generated')
      assert.ok(
        result.sections.every((section) => section.body.trim().length > 0),
        'all sections should have populated body content'
      )

      assert.ok(
        result.accuracy.score >= fixture.expect.minAccuracy,
        `accuracy ${result.accuracy.score} below minimum ${fixture.expect.minAccuracy}`
      )

      if (fixture.expect.allowFallback === false) {
        assert.strictEqual(result.usedFallback, false, 'did not expect fallback content')
        assert.strictEqual(result.accuracy.status, 'fresh')
        assert.strictEqual(result.accuracy.needsReview, false)
      }

      const coverage = result.provenance?.coverage
      assert.ok(coverage, 'expected coverage metrics on provenance')
      assert.ok(
        coverage.kbSectionsApplied >= fixture.expect.minKbSections,
        `kbSectionsApplied ${coverage.kbSectionsApplied} below minimum ${fixture.expect.minKbSections}`
      )

      if (typeof fixture.expect.minFragmentSections === 'number') {
        assert.ok(
          coverage.fragmentSectionsApplied >= fixture.expect.minFragmentSections,
          `fragmentSectionsApplied ${coverage.fragmentSectionsApplied} below minimum ${fixture.expect.minFragmentSections}`
        )
      }

      if (fixture.expect.expectedPrdIds?.length) {
        const appliedIds = new Set(
          (result.provenance?.kbPrds ?? []).map((prd) => prd.id)
        )
        for (const expectedId of fixture.expect.expectedPrdIds) {
          assert.ok(
            appliedIds.has(expectedId),
            `expected PRD ${expectedId} to be part of the blended draft`
          )
        }
      }

      if (fixture.expect.requireFactors?.length) {
        for (const phrase of fixture.expect.requireFactors) {
          assert.ok(
            result.accuracy.factors.some((factor) => factor.includes(phrase)),
            `accuracy factors should include phrase "${phrase}"`
          )
        }
      }
    })
  }
})
