/**
 * Domain Auto-Create Generators
 * 
 * Generates scaffold nodes for each domain (Infrastructure, Frontend, Backend, Data)
 * Integrates with deduplication utility to prevent duplicate nodes
 * Handles node creation, association creation, and layout
 */

import {
  findExistingNode,
  createAssociationsForExisting,
  NodeCandidate,
} from './autoDeduplicate'
import { WorkspaceNode, WorkspaceEdge, RelationshipType } from '../types/index'

/**
 * Configuration passed to domain generators
 */
export interface DomainGeneratorConfig {
  /** Target node ID (the node being auto-created from) */
  targetNodeId: string
  /** All current nodes on canvas */
  nodes: WorkspaceNode[]
  /** All current edges on canvas */
  edges: WorkspaceEdge[]
  /** Center node ID (for layout calculations) */
  centerNodeId: string
  /** Domain type */
  domain: string
}

/**
 * Result from domain generator
 */
export interface DomainGeneratorResult {
  /** New nodes to create */
  nodesToCreate: WorkspaceNode[]
  /** New edges to create */
  edgesToCreate: WorkspaceEdge[]
  /** Summary of what was generated */
  summary: string
  /** Count of reused nodes */
  reusedCount: number
  /** Count of new nodes */
  createdCount: number
}

/**
 * Generate unique node ID
 */
export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a new canvas node
 */
export function createCanvasNode(
  label: string,
  type: string = 'backend',
  domain: string = 'tech',
  summary?: string,
  ring?: number
): WorkspaceNode {
  return {
    id: generateNodeId(),
    type: 'custom',
    position: { x: 0, y: 0 }, // Will be calculated by layout engine
    data: {
      title: label,
      type,
      domain,
      summary,
      ring,
      tags: ['auto-created'],
    },
  }
}

/**
 * Create edge between nodes
 */
export function createCanvasEdge(
  sourceId: string,
  targetId: string,
  relationshipType: RelationshipType = 'depends_on'
): WorkspaceEdge {
  return {
    id: `edge-${sourceId}-to-${targetId}-${Date.now()}`,
    source: sourceId,
    target: targetId,
    type: 'custom',
    data: {
      relation: relationshipType,
    },
  }
}

/**
 * Find or create R2 domain parent node
 * 
 * Each domain (Infrastructure, Frontend, Backend, Data) has an R2 parent
 * that all R3 nodes attach to
 * 
 * @param domainName Name of domain
 * @param domainType Type (tech, product, etc.)
 * @param nodes Current nodes
 * @returns Node ID of R2 parent (existing or new)
 */
export function findOrCreateDomainParent(
  domainName: string,
  domainType: string,
  nodes: WorkspaceNode[]
): { nodeId: string; isNew: boolean; node: WorkspaceNode } {
  // Check if R2 parent already exists
  const existing = nodes.find(
    n => n.data?.title === domainName && n.data?.type === 'domain-parent'
  )

  if (existing) {
    return { nodeId: existing.id, isNew: false, node: existing }
  }

  // Create new R2 parent with ring = 2
  const newParent = createCanvasNode(domainName, 'domain-parent', domainType, undefined, 2)
  return { nodeId: newParent.id, isNew: true, node: newParent }
}

/**
 * Check if node exists (uses deduplication logic)
 */
export function checkNodeExists(
  label: string,
  type: string,
  domain: string,
  nodes: WorkspaceNode[]
): { exists: boolean; node?: WorkspaceNode } {
  const candidate: NodeCandidate = { label, type, domain }
  const result = findExistingNode(candidate, nodes)
  return {
    exists: result.found,
    node: result.existingNode,
  }
}

/**
 * Infrastructure Domain Generator
 * 
 * Creates scaffold for infrastructure setup:
 * - Container platform (Kubernetes, Docker, Serverless, VPS)
 * - CI/CD (GitHub Actions, GitLab CI, Jenkins, CircleCI)
 * - Monitoring (optional)
 * 
 * @param config Generator configuration
 * @param answers User answers to questions
 * @returns Generator result with nodes and edges
 */
export function generateInfrastructureScaffold(
  config: DomainGeneratorConfig,
  answers: {
    containerPlatform: string
    ciCd: string
    monitoring: boolean
  }
): DomainGeneratorResult {
  const { nodes } = config
  const nodesToCreate: WorkspaceNode[] = []
  const edgesToCreate: WorkspaceEdge[] = []
  let reusedCount = 0
  let createdCount = 0

  // Step 1: Find or create R2 parent
  const { nodeId: parentId, isNew: parentIsNew, node: parentNode } = findOrCreateDomainParent(
    'Infrastructure & Platform',
    'tech',
    nodes
  )
  if (parentIsNew) {
    nodesToCreate.push(parentNode)
    createdCount++
  }

  // Step 2: Prepare R3 nodes based on answers
  const r3Candidates: Array<{ label: string; type: string; summary?: string }> = []

  // Container platform
  if (answers.containerPlatform === 'kubernetes') {
    r3Candidates.push({
      label: 'Kubernetes Cluster',
      type: 'infrastructure',
      summary: 'Container orchestration, auto-scaling, networking',
    })
  } else if (answers.containerPlatform === 'docker') {
    r3Candidates.push({
      label: 'Docker Container Registry',
      type: 'infrastructure',
      summary: 'Container images, versioning, deployment',
    })
  } else if (answers.containerPlatform === 'serverless') {
    r3Candidates.push({
      label: 'Serverless Platform',
      type: 'infrastructure',
      summary: 'Functions, event-driven, auto-scaling',
    })
  } else if (answers.containerPlatform === 'vps') {
    r3Candidates.push({
      label: 'VPS Infrastructure',
      type: 'infrastructure',
      summary: 'Virtual machines, load balancing, networking',
    })
  }

  // CI/CD
  if (answers.ciCd === 'github-actions') {
    r3Candidates.push({
      label: 'GitHub Actions CI/CD',
      type: 'infrastructure',
      summary: 'Build, test, deploy workflows',
    })
  } else if (answers.ciCd === 'gitlab-ci') {
    r3Candidates.push({
      label: 'GitLab CI Pipeline',
      type: 'infrastructure',
      summary: 'Build stages, runners, artifacts',
    })
  } else if (answers.ciCd === 'jenkins') {
    r3Candidates.push({
      label: 'Jenkins Pipeline',
      type: 'infrastructure',
      summary: 'Job orchestration, plugins, webhooks',
    })
  } else if (answers.ciCd === 'circleci') {
    r3Candidates.push({
      label: 'CircleCI Pipeline',
      type: 'infrastructure',
      summary: 'Workflows, orbs, caching',
    })
  }

  // Monitoring (optional)
  if (answers.monitoring) {
    r3Candidates.push({
      label: 'Monitoring & Observability',
      type: 'infrastructure',
      summary: 'Metrics, logs, traces, alerting',
    })
  }

  // Step 3: Deduplicate R3 nodes
  // Only check against existing nodes on canvas, not newly created ones in this batch
  for (const candidate of r3Candidates) {
    const { exists, node: existingNode } = checkNodeExists(
      candidate.label,
      candidate.type,
      'tech',
      nodes  // Only check against original nodes, not newly created ones
    )

    if (exists && existingNode) {
      // Reuse existing node - create association
      const assocEdges = createAssociationsForExisting(existingNode, parentId)
      edgesToCreate.push(...assocEdges)
      reusedCount++
    } else {
      // Create new node with ring = 3 (R3 level)
      const newNode = createCanvasNode(
        candidate.label,
        candidate.type,
        'tech',
        candidate.summary,
        3
      )
      nodesToCreate.push(newNode)
      createdCount++

      // Create edge from parent to new node
      const edge = createCanvasEdge(parentId, newNode.id, 'depends_on')
      edgesToCreate.push(edge)
    }
  }

  return {
    nodesToCreate,
    edgesToCreate,
    summary: `Created ${createdCount} infrastructure nodes, reused ${reusedCount}`,
    reusedCount,
    createdCount,
  }
}

/**
 * Frontend Domain Generator
 * 
 * Creates scaffold for frontend setup:
 * - Framework (React, Vue, Angular, Svelte, Next.js)
 * - Bundler (Vite, Webpack, Esbuild, Parcel)
 * - State Management (Redux, Zustand, MobX, Context, None)
 * - Testing (Yes/No)
 */
export function generateFrontendScaffold(
  config: DomainGeneratorConfig,
  answers: {
    framework: string
    bundler: string
    stateManagement: string
    testing: boolean
  }
): DomainGeneratorResult {
  const { nodes } = config
  const nodesToCreate: WorkspaceNode[] = []
  const edgesToCreate: WorkspaceEdge[] = []
  let reusedCount = 0
  let createdCount = 0

  // Step 1: Find or create R2 parent
  const { nodeId: parentId, isNew: parentIsNew, node: parentNode } = findOrCreateDomainParent(
    'Frontend & UI',
    'tech',
    nodes
  )
  if (parentIsNew) {
    nodesToCreate.push(parentNode)
    createdCount++
  }

  // Step 2: Prepare R3 nodes
  const r3Candidates: Array<{ label: string; type: string; summary?: string }> = []

  // Framework
  const frameworkMap: Record<string, { label: string; summary: string }> = {
    react: { label: 'React', summary: 'Component library, hooks, JSX' },
    vue: { label: 'Vue.js', summary: 'Progressive framework, single-file components' },
    angular: { label: 'Angular', summary: 'Full framework, TypeScript, dependency injection' },
    svelte: { label: 'Svelte', summary: 'Compiler framework, reactive bindings' },
    nextjs: { label: 'Next.js', summary: 'React framework, SSR, API routes' },
  }
  if (frameworkMap[answers.framework]) {
    r3Candidates.push({
      label: frameworkMap[answers.framework].label,
      type: 'frontend',
      summary: frameworkMap[answers.framework].summary,
    })
  }

  // Bundler
  const bundlerMap: Record<string, { label: string; summary: string }> = {
    vite: { label: 'Vite', summary: 'Fast bundler, HMR, native ES modules' },
    webpack: { label: 'Webpack', summary: 'Module bundler, plugins, loaders' },
    esbuild: { label: 'esbuild', summary: 'Go-based bundler, ultra-fast' },
    parcel: { label: 'Parcel', summary: 'Zero-config bundler, multi-format' },
  }
  if (bundlerMap[answers.bundler]) {
    r3Candidates.push({
      label: bundlerMap[answers.bundler].label,
      type: 'frontend',
      summary: bundlerMap[answers.bundler].summary,
    })
  }

  // State Management
  if (answers.stateManagement !== 'none') {
    const stateMap: Record<string, { label: string; summary: string }> = {
      redux: { label: 'Redux', summary: 'Predictable state container, middleware' },
      zustand: { label: 'Zustand', summary: 'Lightweight state management' },
      mobx: { label: 'MobX', summary: 'Reactive state management' },
      context: { label: 'React Context', summary: 'Built-in state management' },
    }
    if (stateMap[answers.stateManagement]) {
      r3Candidates.push({
        label: stateMap[answers.stateManagement].label,
        type: 'frontend',
        summary: stateMap[answers.stateManagement].summary,
      })
    }
  }

  // Testing
  if (answers.testing) {
    r3Candidates.push({
      label: 'Testing Framework',
      type: 'frontend',
      summary: 'Unit tests, integration tests, E2E tests (Vitest, Jest, Playwright)',
    })
  }

  // UI Library
  r3Candidates.push({
    label: 'UI Component Library',
    type: 'frontend',
    summary: 'Design system, component library, styling (Tailwind, Material-UI, etc.)',
  })

  // Step 3: Deduplicate R3 nodes
  // Only check against existing nodes on canvas, not newly created ones in this batch
  for (const candidate of r3Candidates) {
    const { exists, node: existingNode } = checkNodeExists(
      candidate.label,
      candidate.type,
      'tech',
      nodes  // Only check against original nodes, not newly created ones
    )

    if (exists && existingNode) {
      const assocEdges = createAssociationsForExisting(existingNode, parentId)
      edgesToCreate.push(...assocEdges)
      reusedCount++
    } else {
      const newNode = createCanvasNode(
        candidate.label,
        candidate.type,
        'tech',
        candidate.summary,
        3
      )
      nodesToCreate.push(newNode)
      createdCount++

      const edge = createCanvasEdge(parentId, newNode.id, 'depends_on')
      edgesToCreate.push(edge)
    }
  }

  return {
    nodesToCreate,
    edgesToCreate,
    summary: `Created ${createdCount} frontend nodes, reused ${reusedCount}`,
    reusedCount,
    createdCount,
  }
}

/**
 * Backend Domain Generator
 * 
 * Creates scaffold for backend setup:
 * - Runtime (Node.js, Python, Go, Rust, Java)
 * - Framework (Express, FastAPI, Gin, Actix, Spring)
 * - API (REST, GraphQL, gRPC, Both)
 * - Database (PostgreSQL, MongoDB, MySQL, DynamoDB)
 */
export function generateBackendScaffold(
  config: DomainGeneratorConfig,
  answers: {
    runtime: string
    framework: string
    apiType: string
    database: string
  }
): DomainGeneratorResult {
  const { nodes } = config
  const nodesToCreate: WorkspaceNode[] = []
  const edgesToCreate: WorkspaceEdge[] = []
  let reusedCount = 0
  let createdCount = 0

  // Step 1: Find or create R2 parent
  const { nodeId: parentId, isNew: parentIsNew, node: parentNode } = findOrCreateDomainParent(
    'Backend & APIs',
    'tech',
    nodes
  )
  if (parentIsNew) {
    nodesToCreate.push(parentNode)
    createdCount++
  }

  // Step 2: Prepare R3 nodes
  const r3Candidates: Array<{ label: string; type: string; summary?: string }> = []

  // Runtime + Framework
  const runtimeFrameworkMap: Record<string, Record<string, { label: string; summary: string }>> = {
    nodejs: {
      express: { label: 'Express Server', summary: 'Minimal, flexible Node.js framework' },
      fastify: { label: 'Fastify Server', summary: 'High-performance Node.js framework' },
      nestjs: { label: 'NestJS Server', summary: 'Progressive Node.js framework, TypeScript' },
    },
    python: {
      fastapi: { label: 'FastAPI Server', summary: 'Modern, fast Python framework' },
      django: { label: 'Django Server', summary: 'Full-featured Python framework' },
      flask: { label: 'Flask Server', summary: 'Lightweight Python microframework' },
    },
    go: {
      gin: { label: 'Gin Server', summary: 'Fast Go web framework' },
      echo: { label: 'Echo Server', summary: 'High-performance Go framework' },
    },
    rust: {
      actix: { label: 'Actix Server', summary: 'Powerful Rust web framework' },
      rocket: { label: 'Rocket Server', summary: 'Type-safe Rust framework' },
    },
    java: {
      spring: { label: 'Spring Boot', summary: 'Production-ready Java framework' },
      quarkus: { label: 'Quarkus', summary: 'Cloud-native Java framework' },
    },
  }

  if (runtimeFrameworkMap[answers.runtime]?.[answers.framework]) {
    const item = runtimeFrameworkMap[answers.runtime][answers.framework]
    r3Candidates.push({
      label: item.label,
      type: 'backend',
      summary: item.summary,
    })
  }

  // API Server (Swagger/OpenAPI if REST)
  if (answers.apiType === 'rest' || answers.apiType === 'both') {
    r3Candidates.push({
      label: 'Swagger API Server',
      type: 'backend',
      summary: 'OpenAPI/Swagger documentation, REST endpoints',
    })
  }

  // GraphQL (if GraphQL)
  if (answers.apiType === 'graphql' || answers.apiType === 'both') {
    r3Candidates.push({
      label: 'GraphQL Server',
      type: 'backend',
      summary: 'GraphQL schema, resolvers, subscriptions',
    })
  }

  // Database
  const databaseMap: Record<string, { label: string; summary: string }> = {
    postgres: { label: 'PostgreSQL Database', summary: 'Relational DB, ACID, advanced features' },
    mongodb: { label: 'MongoDB', summary: 'Document database, flexible schema' },
    mysql: { label: 'MySQL Database', summary: 'Relational DB, reliable, widely used' },
    dynamodb: { label: 'DynamoDB', summary: 'AWS NoSQL, serverless, managed' },
  }
  if (databaseMap[answers.database]) {
    r3Candidates.push({
      label: databaseMap[answers.database].label,
      type: 'backend',
      summary: databaseMap[answers.database].summary,
    })
  }

  // Additional infrastructure
  r3Candidates.push(
    {
      label: 'Redis Cache',
      type: 'backend',
      summary: 'In-memory cache, sessions, rate limiting',
    },
    {
      label: 'Job Queue',
      type: 'backend',
      summary: 'Background jobs, async processing (Bull, Celery, etc.)',
    },
    {
      label: 'Logging Service',
      type: 'backend',
      summary: 'Structured logs, aggregation, alerting',
    }
  )

  // Step 3: Deduplicate R3 nodes
  // Only check against existing nodes on canvas, not newly created ones in this batch
  for (const candidate of r3Candidates) {
    const { exists, node: existingNode } = checkNodeExists(
      candidate.label,
      candidate.type,
      'tech',
      nodes  // Only check against original nodes, not newly created ones
    )

    if (exists && existingNode) {
      const assocEdges = createAssociationsForExisting(existingNode, parentId)
      edgesToCreate.push(...assocEdges)
      reusedCount++
    } else {
      const newNode = createCanvasNode(
        candidate.label,
        candidate.type,
        'tech',
        candidate.summary,
        3
      )
      nodesToCreate.push(newNode)
      createdCount++

      const edge = createCanvasEdge(parentId, newNode.id, 'depends_on')
      edgesToCreate.push(edge)
    }
  }

  return {
    nodesToCreate,
    edgesToCreate,
    summary: `Created ${createdCount} backend nodes, reused ${reusedCount}`,
    reusedCount,
    createdCount,
  }
}

/**
 * Data & AI Domain Generator
 * 
 * Creates scaffold for data/AI setup:
 * - Pipeline (Airflow, dbt, Spark, Prefect)
 * - ML Framework (TensorFlow, PyTorch, scikit-learn, HuggingFace)
 * - Analytics (BigQuery, Redshift, Snowflake, ClickHouse)
 * - Vector Store (Pinecone, Milvus, Weaviate, Chroma)
 */
export function generateDataScaffold(
  config: DomainGeneratorConfig,
  answers: {
    pipeline: string
    mlFramework: string
    analytics: string
    vectorStore: string
  }
): DomainGeneratorResult {
  const { nodes } = config
  const nodesToCreate: WorkspaceNode[] = []
  const edgesToCreate: WorkspaceEdge[] = []
  let reusedCount = 0
  let createdCount = 0

  // Step 1: Find or create R2 parent
  const { nodeId: parentId, isNew: parentIsNew, node: parentNode } = findOrCreateDomainParent(
    'Data & AI',
    'tech',
    nodes
  )
  if (parentIsNew) {
    nodesToCreate.push(parentNode)
    createdCount++
  }

  // Step 2: Prepare R3 nodes
  const r3Candidates: Array<{ label: string; type: string; summary?: string }> = []

  // Data Pipeline
  const pipelineMap: Record<string, { label: string; summary: string }> = {
    airflow: { label: 'Apache Airflow', summary: 'Workflow orchestration, DAGs, scheduling' },
    dbt: { label: 'dbt', summary: 'Data transformation, version control, testing' },
    spark: { label: 'Apache Spark', summary: 'Distributed computing, big data processing' },
    prefect: { label: 'Prefect', summary: 'Modern workflow orchestration, cloud-native' },
  }
  if (pipelineMap[answers.pipeline]) {
    r3Candidates.push({
      label: pipelineMap[answers.pipeline].label,
      type: 'data-ai',
      summary: pipelineMap[answers.pipeline].summary,
    })
  }

  // ML Framework
  const mlMap: Record<string, { label: string; summary: string }> = {
    tensorflow: { label: 'TensorFlow', summary: 'Deep learning, large-scale ML' },
    pytorch: { label: 'PyTorch', summary: 'Deep learning, research-friendly' },
    sklearn: { label: 'scikit-learn', summary: 'Classical ML, preprocessing' },
    huggingface: { label: 'Hugging Face', summary: 'LLMs, transformers, NLP' },
  }
  if (mlMap[answers.mlFramework]) {
    r3Candidates.push({
      label: mlMap[answers.mlFramework].label,
      type: 'data-ai',
      summary: mlMap[answers.mlFramework].summary,
    })
  }

  // Analytics Warehouse
  const analyticsMap: Record<string, { label: string; summary: string }> = {
    bigquery: { label: 'BigQuery', summary: 'Serverless data warehouse, SQL, ML' },
    redshift: { label: 'Amazon Redshift', summary: 'Data warehouse, analytics, scalable' },
    snowflake: { label: 'Snowflake', summary: 'Cloud data warehouse, flexible, shareable' },
    clickhouse: { label: 'ClickHouse', summary: 'Columnar database, analytics, fast' },
  }
  if (analyticsMap[answers.analytics]) {
    r3Candidates.push({
      label: analyticsMap[answers.analytics].label,
      type: 'data-ai',
      summary: analyticsMap[answers.analytics].summary,
    })
  }

  // Vector Store
  const vectorMap: Record<string, { label: string; summary: string }> = {
    pinecone: { label: 'Pinecone', summary: 'Managed vector database, search, filtering' },
    milvus: { label: 'Milvus', summary: 'Open-source vector DB, embeddings' },
    weaviate: { label: 'Weaviate', summary: 'Vector search engine, semantic search' },
    chroma: { label: 'Chroma', summary: 'Lightweight vector database, embeddings' },
  }
  if (vectorMap[answers.vectorStore]) {
    r3Candidates.push({
      label: vectorMap[answers.vectorStore].label,
      type: 'data-ai',
      summary: vectorMap[answers.vectorStore].summary,
    })
  }

  // Additional data infrastructure
  r3Candidates.push(
    {
      label: 'Feature Store',
      type: 'data-ai',
      summary: 'Centralized features, versioning, serving',
    },
    {
      label: 'Data Catalog',
      type: 'data-ai',
      summary: 'Metadata management, lineage tracking, governance',
    }
  )

  // Step 3: Deduplicate R3 nodes
  // Only check against existing nodes on canvas, not newly created ones in this batch
  for (const candidate of r3Candidates) {
    const { exists, node: existingNode } = checkNodeExists(
      candidate.label,
      candidate.type,
      'tech',
      nodes  // Only check against original nodes, not newly created ones
    )

    if (exists && existingNode) {
      const assocEdges = createAssociationsForExisting(existingNode, parentId)
      edgesToCreate.push(...assocEdges)
      reusedCount++
    } else {
      const newNode = createCanvasNode(
        candidate.label,
        candidate.type,
        'tech',
        candidate.summary,
        3
      )
      nodesToCreate.push(newNode)
      createdCount++

      const edge = createCanvasEdge(parentId, newNode.id, 'depends_on')
      edgesToCreate.push(edge)
    }
  }

  return {
    nodesToCreate,
    edgesToCreate,
    summary: `Created ${createdCount} data nodes, reused ${reusedCount}`,
    reusedCount,
    createdCount,
  }
}
