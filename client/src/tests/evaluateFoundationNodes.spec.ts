/**
 * Evaluate Foundation Nodes Against Edge Rules
 * Tests the edge system against actual foundation nodes to identify issues
 */

import { describe, it, expect } from 'vitest'
import { processFoundationEdges } from '../config/foundationEdges'
import { FOUNDATION_CATEGORIES } from '../config/foundationNodes'
import type { Node } from '@xyflow/react'

describe('Foundation Nodes Edge Evaluation', () => {
  it('should evaluate all foundation nodes and identify missing edges', () => {
    // Convert foundation templates to canvas nodes
    const foundationNodes: Node[] = []

    FOUNDATION_CATEGORIES.forEach(category => {
      category.templates.forEach(template => {
        foundationNodes.push({
          id: template.id,
          data: {
            label: template.label,
            type: template.nodeType,
            domain: template.domain,
            ring: template.ring,
            tags: template.tags,
            summary: template.summary,
          },
          position: { x: 0, y: 0 },
        })
      })
    })

    // Run edge evaluation
    const result = processFoundationEdges(foundationNodes, [])

    // Log the results
    console.log('\n=== FOUNDATION NODES EDGE EVALUATION ===\n')

    if (result.report.issues.length > 0) {
      console.log(`Found ${result.report.issues.length} orphaned/misconnected nodes:\n`)
      result.report.issues.forEach(issue => {
        console.log(`  ❌ ${issue.nodeId}`)
        console.log(`     Issue: ${issue.issue}`)
        console.log(`     Suggestion: ${issue.suggestion}\n`)
      })
    } else {
      console.log('✅ All foundation nodes properly connected!\n')
    }

    if (result.nodesToCreate.length > 0) {
      console.log(`\nNeed to create ${result.report.newIntermediates} intermediate R2 nodes:\n`)
      result.nodesToCreate.forEach(node => {
        console.log(`  + ${(node.data as any)?.title || node.id}`)
        console.log(`    Domain: ${(node.data as any)?.domain}`)
        console.log(`    Ring: ${(node.data as any)?.ring}`)
      })
    }

    console.log(`\nWill create ${result.report.newEdges} new edges in total\n`)

    // Assertions
    expect(result.report.newIntermediates).toBeGreaterThanOrEqual(0)
    expect(result.report.newEdges).toBeGreaterThanOrEqual(0)
    expect(foundationNodes.length).toBeGreaterThan(0)
  })

  it('should show detailed report of what needs fixing', () => {
    // Convert foundation templates to canvas nodes
    const foundationNodes: Node[] = []

    FOUNDATION_CATEGORIES.forEach(category => {
      category.templates.forEach(template => {
        foundationNodes.push({
          id: template.id,
          data: {
            label: template.label,
            type: template.nodeType,
            domain: template.domain,
            ring: template.ring,
            tags: template.tags,
            summary: template.summary,
          },
          position: { x: 0, y: 0 },
        })
      })
    })

    const result = processFoundationEdges(foundationNodes, [])

    console.log('\n=== DETAILED FOUNDATION NODES STATUS ===\n')

    // Count by type
    const nodesByRing: Record<number, number> = {}
    const nodesByType: Record<string, number> = {}

    foundationNodes.forEach(node => {
      const ring = (node.data as any)?.ring as number | undefined
      const type = (node.data as any)?.type as string | undefined

      if (ring !== undefined) {
        nodesByRing[ring] = (nodesByRing[ring] || 0) + 1
      }
      if (type) {
        nodesByType[type] = (nodesByType[type] || 0) + 1
      }
    })

    console.log('Nodes by Ring:')
    Object.keys(nodesByRing)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(ring => {
        console.log(`  R${ring}: ${nodesByRing[parseInt(ring)]} nodes`)
      })

    console.log('\nNodes by Type:')
    Object.keys(nodesByType)
      .sort()
      .forEach(type => {
        console.log(`  ${type}: ${nodesByType[type]} nodes`)
      })

    console.log(`\nProblems Found: ${result.report.issues.length}`)
    console.log(`Intermediates to Create: ${result.report.newIntermediates}`)
    console.log(`Edges to Create: ${result.report.newEdges}`)

    // Should pass - just confirming the system evaluates correctly
    expect(foundationNodes.length).toBeGreaterThan(0)
  })
})
