/**
 * Validator Runner - Tests domainGenerators against ring hierarchy rules
 * 
 * Simulates each domain generator and validates output
 */

import { validateRingHierarchy, formatValidationResult } from './ringHierarchyValidator'
import {
  generateInfrastructureScaffold,
  generateFrontendScaffold,
  generateBackendScaffold,
  generateDataScaffold,
} from './domainGenerators'
import { WorkspaceNode, WorkspaceEdge } from '../types/index'

/**
 * Create a center node for testing
 */
function createCenterNode(): WorkspaceNode {
  return {
    id: 'center',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      title: 'Center',
      type: 'root',
      domain: 'domain',
      ring: 0,
      tags: [],
    },
  }
}

/**
 * Run validation on generator output
 */
function validateGeneratorOutput(
  generatorName: string,
  nodes: WorkspaceNode[],
  edges: WorkspaceEdge[]
) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`  ${generatorName}`)
  console.log(`${'='.repeat(70)}`)

  const result = validateRingHierarchy(nodes, edges)
  console.log(formatValidationResult(result))
  console.log('')

  return result
}

/**
 * Main test runner
 */
export function runValidationReport() {
  console.log('\n')
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║  RING HIERARCHY VALIDATION REPORT - Domain Generators           ║')
  console.log('╚' + '═'.repeat(68) + '╝')

  const results: Record<string, any> = {}
  let totalErrors = 0
  let totalWarnings = 0

  // Test Infrastructure Generator
  try {
    const centerNode = createCenterNode()
    const infraResult = generateInfrastructureScaffold(
      {
        targetNodeId: 'center',
        nodes: [centerNode],
        edges: [],
        centerNodeId: 'center',
        domain: 'tech',
      },
      {
        containerPlatform: 'kubernetes',
        ciCd: 'github-actions',
        monitoring: true,
      }
    )

    const infraNodes = [centerNode, ...infraResult.nodesToCreate]
    const result = validateGeneratorOutput(
      'Infrastructure Scaffold',
      infraNodes,
      infraResult.edgesToCreate
    )
    results['infrastructure'] = result
    totalErrors += result.violations.filter(v => v.severity === 'error').length
    totalWarnings += result.violations.filter(v => v.severity === 'warning').length
  } catch (error) {
    console.error('Error testing Infrastructure generator:', error)
    results['infrastructure'] = { error: String(error) }
  }

  // Test Frontend Generator
  try {
    const centerNode = createCenterNode()
    const feResult = generateFrontendScaffold(
      {
        targetNodeId: 'center',
        nodes: [centerNode],
        edges: [],
        centerNodeId: 'center',
        domain: 'tech',
      },
      {
        framework: 'react',
        bundler: 'vite',
        stateManagement: 'zustand',
        testing: true,
      }
    )

    const feNodes = [centerNode, ...feResult.nodesToCreate]
    const result = validateGeneratorOutput('Frontend Scaffold', feNodes, feResult.edgesToCreate)
    results['frontend'] = result
    totalErrors += result.violations.filter(v => v.severity === 'error').length
    totalWarnings += result.violations.filter(v => v.severity === 'warning').length
  } catch (error) {
    console.error('Error testing Frontend generator:', error)
    results['frontend'] = { error: String(error) }
  }

  // Test Backend Generator
  try {
    const centerNode = createCenterNode()
    const beResult = generateBackendScaffold(
      {
        targetNodeId: 'center',
        nodes: [centerNode],
        edges: [],
        centerNodeId: 'center',
        domain: 'tech',
      },
      {
        runtime: 'nodejs',
        framework: 'express',
        apiType: 'rest',
        database: 'postgres',
      }
    )

    const beNodes = [centerNode, ...beResult.nodesToCreate]
    const result = validateGeneratorOutput('Backend Scaffold', beNodes, beResult.edgesToCreate)
    results['backend'] = result
    totalErrors += result.violations.filter(v => v.severity === 'error').length
    totalWarnings += result.violations.filter(v => v.severity === 'warning').length
  } catch (error) {
    console.error('Error testing Backend generator:', error)
    results['backend'] = { error: String(error) }
  }

  // Test Data Generator
  try {
    const centerNode = createCenterNode()
    const dataResult = generateDataScaffold(
      {
        targetNodeId: 'center',
        nodes: [centerNode],
        edges: [],
        centerNodeId: 'center',
        domain: 'tech',
      },
      {
        pipeline: 'airflow',
        mlFramework: 'pytorch',
        analytics: 'snowflake',
        vectorStore: 'pinecone',
      }
    )

    const dataNodes = [centerNode, ...dataResult.nodesToCreate]
    const result = validateGeneratorOutput('Data & AI Scaffold', dataNodes, dataResult.edgesToCreate)
    results['data'] = result
    totalErrors += result.violations.filter(v => v.severity === 'error').length
    totalWarnings += result.violations.filter(v => v.severity === 'warning').length
  } catch (error) {
    console.error('Error testing Data generator:', error)
    results['data'] = { error: String(error) }
  }

  // Summary
  console.log('\n')
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║  SUMMARY                                                       ║')
  console.log('╚' + '═'.repeat(68) + '╝')
  console.log(`Total Errors:   ${totalErrors}`)
  console.log(`Total Warnings: ${totalWarnings}`)
  console.log('')

  if (totalErrors === 0) {
    console.log('✅ All domain generators produce valid ring hierarchies!')
  } else {
    console.log(`❌ Found ${totalErrors} error(s) in domain generators.`)
    console.log('Please fix the violations above.')
  }

  console.log('\n')

  return {
    results,
    totalErrors,
    totalWarnings,
  }
}

// Export for use
export default runValidationReport
