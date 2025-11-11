/**
 * Domain Generators Tests
 * 
 * Tests for Infrastructure, Frontend, Backend, and Data scaffolding
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateInfrastructureScaffold,
  generateFrontendScaffold,
  generateBackendScaffold,
  generateDataScaffold,
  DomainGeneratorConfig,
  findOrCreateDomainParent,
} from '../domainGenerators'
import { WorkspaceNode } from '../../types/index'

describe('Domain Generators', () => {
  let config: DomainGeneratorConfig
  let baseNode: WorkspaceNode

  beforeEach(() => {
    baseNode = {
      id: 'center-node',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        title: 'Center',
        type: 'root',
        domain: 'tech',
      },
    }

    config = {
      targetNodeId: 'target-node',
      nodes: [baseNode],
      edges: [],
      centerNodeId: 'center-node',
      domain: 'tech',
    }
  })

  describe('Infrastructure Scaffold', () => {
    it('should create Kubernetes infrastructure', () => {
      const result = generateInfrastructureScaffold(config, {
        containerPlatform: 'kubernetes',
        ciCd: 'github-actions',
        monitoring: true,
      })

      expect(result.createdCount).toBeGreaterThan(0)
      expect(result.reusedCount).toBe(0)
      expect(result.nodesToCreate.length).toBeGreaterThan(0)

      // Should have R2 parent
      const parent = result.nodesToCreate.find(n => n.data?.title === 'Infrastructure & Platform')
      expect(parent).toBeDefined()

      // Should have R3 nodes
      const kubernetes = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Kubernetes')
      )
      expect(kubernetes).toBeDefined()

      const ciCd = result.nodesToCreate.find(n =>
        n.data?.title?.includes('GitHub Actions')
      )
      expect(ciCd).toBeDefined()

      const monitoring = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Monitoring')
      )
      expect(monitoring).toBeDefined()
    })

    it('should create Serverless infrastructure', () => {
      const result = generateInfrastructureScaffold(config, {
        containerPlatform: 'serverless',
        ciCd: 'circleci',
        monitoring: false,
      })

      expect(result.createdCount).toBeGreaterThan(0)

      const serverless = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Serverless')
      )
      expect(serverless).toBeDefined()

      // Should NOT have monitoring node
      const monitoring = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Monitoring')
      )
      expect(monitoring).toBeUndefined()
    })

    it('should deduplicate on second run', () => {
      // First run
      const result1 = generateInfrastructureScaffold(config, {
        containerPlatform: 'docker',
        ciCd: 'jenkins',
        monitoring: true,
      })

      const firstRunCount = result1.createdCount
      expect(firstRunCount).toBeGreaterThan(0)

      // Simulate second run with same results already in canvas
      const config2: DomainGeneratorConfig = {
        ...config,
        nodes: [...config.nodes, ...result1.nodesToCreate],
      }

      const result2 = generateInfrastructureScaffold(config2, {
        containerPlatform: 'docker',
        ciCd: 'jenkins',
        monitoring: true,
      })

      // Second run should reuse nodes
      expect(result2.reusedCount).toBeGreaterThan(0)
      expect(result2.createdCount).toBeLessThan(firstRunCount)
    })
  })

  describe('Frontend Scaffold', () => {
    it('should create React+Vite frontend', () => {
      const result = generateFrontendScaffold(config, {
        framework: 'react',
        bundler: 'vite',
        stateManagement: 'zustand',
        testing: true,
      })

      expect(result.createdCount).toBeGreaterThan(0)

      // Should have R2 parent
      const parent = result.nodesToCreate.find(n => n.data?.title === 'Frontend & UI')
      expect(parent).toBeDefined()

      // Should have React
      const react = result.nodesToCreate.find(n => n.data?.title === 'React')
      expect(react).toBeDefined()

      // Should have Vite
      const vite = result.nodesToCreate.find(n => n.data?.title === 'Vite')
      expect(vite).toBeDefined()

      // Should have Zustand
      const zustand = result.nodesToCreate.find(n => n.data?.title === 'Zustand')
      expect(zustand).toBeDefined()

      // Should have Testing Framework
      const testing = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Testing')
      )
      expect(testing).toBeDefined()
    })

    it('should create Next.js frontend without state management', () => {
      const result = generateFrontendScaffold(config, {
        framework: 'nextjs',
        bundler: 'webpack',
        stateManagement: 'none',
        testing: false,
      })

      expect(result.createdCount).toBeGreaterThan(0)

      // Should have Next.js
      const nextjs = result.nodesToCreate.find(n => n.data?.title === 'Next.js')
      expect(nextjs).toBeDefined()

      // Should NOT have state management
      const zustand = result.nodesToCreate.find(n => n.data?.title === 'Zustand')
      expect(zustand).toBeUndefined()

      // Should NOT have testing
      const testing = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Testing')
      )
      expect(testing).toBeUndefined()
    })

    it('should always include UI library', () => {
      const result = generateFrontendScaffold(config, {
        framework: 'vue',
        bundler: 'parcel',
        stateManagement: 'context',
        testing: false,
      })

      const uiLibrary = result.nodesToCreate.find(n =>
        n.data?.title?.includes('UI Component')
      )
      expect(uiLibrary).toBeDefined()
    })
  })

  describe('Backend Scaffold', () => {
    it('should create Node.js+Express+PostgreSQL backend', () => {
      const result = generateBackendScaffold(config, {
        runtime: 'nodejs',
        framework: 'express',
        apiType: 'rest',
        database: 'postgres',
      })

      expect(result.createdCount).toBeGreaterThan(0)

      // Should have R2 parent
      const parent = result.nodesToCreate.find(n => n.data?.title === 'Backend & APIs')
      expect(parent).toBeDefined()

      // Should have Express
      const express = result.nodesToCreate.find(n => n.data?.title === 'Express Server')
      expect(express).toBeDefined()

      // Should have Swagger (REST API)
      const swagger = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Swagger')
      )
      expect(swagger).toBeDefined()

      // Should have PostgreSQL
      const postgres = result.nodesToCreate.find(n =>
        n.data?.title?.includes('PostgreSQL')
      )
      expect(postgres).toBeDefined()

      // Should have Redis
      const redis = result.nodesToCreate.find(n => n.data?.title === 'Redis Cache')
      expect(redis).toBeDefined()

      // Should have Job Queue
      const queue = result.nodesToCreate.find(n => n.data?.title === 'Job Queue')
      expect(queue).toBeDefined()
    })

    it('should create Python+FastAPI+MongoDB backend with GraphQL', () => {
      const result = generateBackendScaffold(config, {
        runtime: 'python',
        framework: 'fastapi',
        apiType: 'graphql',
        database: 'mongodb',
      })

      expect(result.createdCount).toBeGreaterThan(0)

      const fastapi = result.nodesToCreate.find(n => n.data?.title === 'FastAPI Server')
      expect(fastapi).toBeDefined()

      // Should have GraphQL (not Swagger for non-REST)
      const graphql = result.nodesToCreate.find(n =>
        n.data?.title?.includes('GraphQL')
      )
      expect(graphql).toBeDefined()

      const mongodb = result.nodesToCreate.find(n => n.data?.title === 'MongoDB')
      expect(mongodb).toBeDefined()
    })

    it('should support both REST and GraphQL', () => {
      const result = generateBackendScaffold(config, {
        runtime: 'go',
        framework: 'gin',
        apiType: 'both',
        database: 'mysql',
      })

      // Should have both
      const swagger = result.nodesToCreate.find(n =>
        n.data?.title?.includes('Swagger')
      )
      expect(swagger).toBeDefined()

      const graphql = result.nodesToCreate.find(n =>
        n.data?.title?.includes('GraphQL')
      )
      expect(graphql).toBeDefined()
    })

    it('should deduplicate Swagger across multiple runs', () => {
      // First run
      const result1 = generateBackendScaffold(config, {
        runtime: 'nodejs',
        framework: 'express',
        apiType: 'rest',
        database: 'postgres',
      })

      expect(
        result1.nodesToCreate.some(n => n.data?.title?.includes('Swagger'))
      ).toBe(true)

      // Second run with same config
      const config2: DomainGeneratorConfig = {
        ...config,
        nodes: [...config.nodes, ...result1.nodesToCreate],
      }

      const result2 = generateBackendScaffold(config2, {
        runtime: 'nodejs',
        framework: 'fastify',
        apiType: 'rest',
        database: 'mysql',
      })

      // Swagger should be reused
      expect(result2.reusedCount).toBeGreaterThan(0)
      // Should only create new framework and database
      expect(result2.createdCount).toBeLessThan(result1.createdCount)
    })
  })

  describe('Data Scaffold', () => {
    it('should create Airflow+PyTorch+BigQuery data setup', () => {
      const result = generateDataScaffold(config, {
        pipeline: 'airflow',
        mlFramework: 'pytorch',
        analytics: 'bigquery',
        vectorStore: 'pinecone',
      })

      expect(result.createdCount).toBeGreaterThan(0)

      // Should have R2 parent
      const parent = result.nodesToCreate.find(n => n.data?.title === 'Data & AI')
      expect(parent).toBeDefined()

      // Should have pipeline
      const airflow = result.nodesToCreate.find(n => n.data?.title === 'Apache Airflow')
      expect(airflow).toBeDefined()

      // Should have ML framework
      const pytorch = result.nodesToCreate.find(n => n.data?.title === 'PyTorch')
      expect(pytorch).toBeDefined()

      // Should have analytics
      const bigquery = result.nodesToCreate.find(n =>
        n.data?.title === 'BigQuery'
      )
      expect(bigquery).toBeDefined()

      // Should have vector store
      const pinecone = result.nodesToCreate.find(n =>
        n.data?.title === 'Pinecone'
      )
      expect(pinecone).toBeDefined()
    })

    it('should create dbt+TensorFlow+Redshift data setup', () => {
      const result = generateDataScaffold(config, {
        pipeline: 'dbt',
        mlFramework: 'tensorflow',
        analytics: 'redshift',
        vectorStore: 'weaviate',
      })

      expect(result.createdCount).toBeGreaterThan(0)

      const dbt = result.nodesToCreate.find(n => n.data?.title === 'dbt')
      expect(dbt).toBeDefined()

      const tf = result.nodesToCreate.find(n => n.data?.title === 'TensorFlow')
      expect(tf).toBeDefined()

      const redshift = result.nodesToCreate.find(n =>
        n.data?.title === 'Amazon Redshift'
      )
      expect(redshift).toBeDefined()
    })

    it('should always include Feature Store and Data Catalog', () => {
      const result = generateDataScaffold(config, {
        pipeline: 'spark',
        mlFramework: 'sklearn',
        analytics: 'snowflake',
        vectorStore: 'milvus',
      })

      const featureStore = result.nodesToCreate.find(n =>
        n.data?.title === 'Feature Store'
      )
      expect(featureStore).toBeDefined()

      const catalog = result.nodesToCreate.find(n =>
        n.data?.title === 'Data Catalog'
      )
      expect(catalog).toBeDefined()
    })
  })

  describe('findOrCreateDomainParent', () => {
    it('should create R2 parent if not exists', () => {
      const result = findOrCreateDomainParent('Test Domain', 'tech', [baseNode])

      expect(result.isNew).toBe(true)
      expect(result.node.data?.title).toBe('Test Domain')
      expect(result.node.data?.type).toBe('domain-parent')
    })

    it('should reuse R2 parent if exists', () => {
      const parentNode: WorkspaceNode = {
        id: 'parent-1',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: {
          title: 'Test Domain',
          type: 'domain-parent',
          domain: 'tech',
        },
      }

      const result = findOrCreateDomainParent('Test Domain', 'tech', [baseNode, parentNode])

      expect(result.isNew).toBe(false)
      expect(result.nodeId).toBe('parent-1')
      expect(result.node.id).toBe('parent-1')
    })
  })

  describe('Edge Creation', () => {
    it('should create edges from parent to R3 nodes', () => {
      const result = generateBackendScaffold(config, {
        runtime: 'nodejs',
        framework: 'express',
        apiType: 'rest',
        database: 'postgres',
      })

      expect(result.edgesToCreate.length).toBeGreaterThan(0)

      // All edges should have depends_on relationship
      const allDependsOn = result.edgesToCreate.every(e => e.data?.relation === 'depends_on')
      expect(allDependsOn).toBe(true)
    })

    it('should create associations for reused nodes', () => {
      // First run to create Swagger
      const result1 = generateBackendScaffold(config, {
        runtime: 'nodejs',
        framework: 'express',
        apiType: 'rest',
        database: 'postgres',
      })

      // Second run - should reuse and create associations
      const config2: DomainGeneratorConfig = {
        ...config,
        nodes: [...config.nodes, ...result1.nodesToCreate],
      }

      const result2 = generateBackendScaffold(config2, {
        runtime: 'python',
        framework: 'fastapi',
        apiType: 'rest',
        database: 'mongodb',
      })

      // Should have associations for reused nodes
      if (result2.reusedCount > 0) {
        expect(result2.edgesToCreate.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Summary Generation', () => {
    it('should include counts in summary', () => {
      const result = generateInfrastructureScaffold(config, {
        containerPlatform: 'kubernetes',
        ciCd: 'github-actions',
        monitoring: true,
      })

      expect(result.summary).toContain('Created')
      expect(result.summary).toContain('infrastructure nodes')
      expect(result.summary).toContain(result.createdCount.toString())
    })
  })
})
