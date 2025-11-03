import OpenAI from 'openai'
import { IWorkspace } from '../models/Workspace.js'
import { contextInjector } from './ContextInjector.js'

export interface GenerationRequest {
  workspaceId: string
  userPrompt: string
  model?: 'gpt-4o' | 'gpt-4o-mini'
  temperature?: number
  maxTokens?: number
}

export interface GenerationResponse {
  success: boolean
  workspaceId: string
  generatedContent: string
  model: string
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
  error?: string
}

export interface ParsedGeneration {
  nodes: Array<{
    id: string
    type: string
    label: string
    description: string
    metadata?: Record<string, any>
  }>
  edges: Array<{
    source: string
    target: string
    label?: string
    type?: string
  }>
  summary?: string
  recommendations?: string[]
}

export interface CardContentRequest {
  node: {
    id?: string
    label: string
    type: string
    domain?: string
    summary?: string
    tags?: string[]
    relatedNodes?: Array<{
      id?: string
      label: string
      type: string
      relation?: string
      summary?: string
    }>
    metadata?: Record<string, unknown>
    intent?: {
      idea?: string
      problem?: string
      primaryAudience?: string
      coreOutcome?: string
      launchScope?: string
      primaryRisk?: string
      blueprintAutoKind?: string
    }
  }
  card: {
    title: string
    description?: string
    sections: Array<{ title: string; description?: string }>
    checklist?: string[]
  }
  prdContext?: {
    templateId: string
    name: string
    description?: string
    sections: Array<{ title: string; content: string }>
  }
  existingContent?: Array<{ title: string; body?: string }>
}

export interface CardContentSection {
  title: string
  body: string
}

export interface CardContentResponse {
  success: boolean
  sections: CardContentSection[]
  checklist?: string[]
  usedFallback: boolean
  tokensUsed?: {
    prompt: number
    completion: number
    total: number
  }
  warnings?: string[]
  rawOutput?: string
}

class GenerationServiceClass {
  private client: OpenAI | null = null
  private contextInjector = contextInjector
  private apiKeyError: string | null = null

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      this.apiKeyError = 'OPENAI_API_KEY environment variable not set'
      return
    }
    this.client = new OpenAI({ apiKey })
  }

  /**
   * Check if service is healthy (API key configured)
   */
  isHealthy(): boolean {
    return this.client !== null
  }

  /**
   * Get health status details
   */
  getHealthStatus() {
    return {
      available: this.isHealthy(),
      error: this.apiKeyError,
      model: 'gpt-4o',
      fallback: 'gpt-4o-mini',
    }
  }

  /**
   * Generate workspace content using GPT-4o
   */
  async generateWorkspace(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    if (!this.client) {
      return {
        success: false,
        workspaceId: request.workspaceId,
        generatedContent: '',
        model: request.model || 'gpt-4o',
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        error: this.apiKeyError || 'OpenAI client not initialized',
      }
    }

    try {
      const response = await this.client.chat.completions.create({
        model: request.model || 'gpt-4o',
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        messages: [
          {
            role: 'system',
            content: `You are a software architecture expert. Generate architecture diagrams as valid JSON ONLY.
Output ONLY the JSON object. Do not include markdown, code blocks, explanations, or any text before or after the JSON.

JSON MUST use exactly these field names:
- "nodes" (array of objects with: id, type, label, description)
- "edges" (array of objects with: source, target, label)
- "summary" (string)

REQUIRED: Use "source" and "target" for edges, NOT "from" and "to".
REQUIRED: Use "id" for node identifiers, NOT "nodeId" or "node_id".

Example output (copy this exact format):
{"nodes":[{"id":"1","type":"frontend","label":"Web UI","description":"User-facing app"},{"id":"2","type":"backend","label":"API","description":"Server logic"}],"edges":[{"source":"1","target":"2","label":"API calls"}],"summary":"Simple two-tier app"}

Generate ONLY valid JSON. Start with { and end with }. No markdown. No explanation.`,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      })

      const generatedContent =
        response.choices[0].message.content || ''

      return {
        success: true,
        workspaceId: request.workspaceId,
        generatedContent,
        model: response.model,
        tokensUsed: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        success: false,
        workspaceId: request.workspaceId,
        generatedContent: '',
        model: request.model || 'gpt-4o',
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        error: `Generation failed: ${errorMessage}`,
      }
    }
  }

  /**
   * Generate with full context from workspace
   */
  async generateWithContext(
    workspace: IWorkspace,
    userPrompt?: string,
    model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o'
  ): Promise<GenerationResponse> {
    try {
      // Get full context from ContextInjector
      const context = await this.contextInjector.buildPromptContext(
        workspace
      )

      // Use provided user prompt or use generated one
      const finalUserPrompt = userPrompt || context.userPrompt

      return this.generateWorkspace({
        workspaceId: (workspace._id as any).toString(),
        userPrompt: finalUserPrompt,
        model,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return {
        success: false,
        workspaceId: (workspace._id as any).toString(),
        generatedContent: '',
        model,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        error: `Context generation failed: ${errorMessage}`,
      }
    }
  }

  /**
   * Parse AI-generated content into structured workspace
   */
  parseGeneration(content: string): ParsedGeneration | null {
    try {
      // Try to find JSON block in response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        return this.validateParsedGeneration(parsed)
      }

      // Try parsing as raw JSON
      const parsed = JSON.parse(content)
      return this.validateParsedGeneration(parsed)
    } catch (error) {
      // Try extracting from text response
      return this.parseTextGeneration(content)
    }
  }

  /**
   * Validate parsed generation structure
   */
  private validateParsedGeneration(obj: any): ParsedGeneration | null {
    if (!obj || typeof obj !== 'object') {
      return null
    }

    // Require at least nodes or edges
    if (!Array.isArray(obj.nodes) && !Array.isArray(obj.edges)) {
      return null
    }

    return {
      nodes: Array.isArray(obj.nodes) ? obj.nodes : [],
      edges: Array.isArray(obj.edges) ? obj.edges : [],
      summary: typeof obj.summary === 'string' ? obj.summary : undefined,
      recommendations: Array.isArray(obj.recommendations)
        ? obj.recommendations
        : undefined,
    }
  }

  /**
   * Parse text-based AI response
   */
  private parseTextGeneration(content: string): ParsedGeneration | null {
    // This is a heuristic parser for text responses
    const nodes: ParsedGeneration['nodes'] = []
    const edges: ParsedGeneration['edges'] = []

    // Look for node patterns: "- Node Name (type): description"
    const nodePattern = /^-\s+([^(]+)\s*\(([^)]+)\):\s*(.*)$/gm
    let match

    while ((match = nodePattern.exec(content)) !== null) {
      nodes.push({
        id: `node_${nodes.length}`,
        label: match[1].trim(),
        type: match[2].trim(),
        description: match[3].trim(),
      })
    }

    // Look for edge patterns: "connects from X to Y"
    const edgePattern = /(?:connects? from|links?)\s+([^t]+)\s+to\s+([^\n.]+)/gi
    while ((match = edgePattern.exec(content)) !== null) {
      edges.push({
        source: match[1].trim(),
        target: match[2].trim(),
      })
    }

    if (nodes.length === 0 && edges.length === 0) {
      return null
    }

    return { nodes, edges, summary: content.substring(0, 200) }
  }

  /**
   * Validate workspace structure
   */
  validateWorkspace(parsed: ParsedGeneration): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check minimum nodes
    if (!parsed.nodes || parsed.nodes.length < 1) {
      errors.push('At least 1 node required')
    }

    // Check node validity
    if (parsed.nodes) {
      for (const node of parsed.nodes) {
        if (!node.label || !node.type) {
          errors.push('All nodes require label and type')
          break
        }
      }
    }

    // Check edges reference valid nodes
    if (parsed.edges && parsed.nodes) {
      const nodeIds = new Set(
        parsed.nodes.map(n => n.id || n.label)
      )
      for (const edge of parsed.edges) {
        if (!nodeIds.has(edge.source)) {
          errors.push(
            `Edge source "${edge.source}" does not reference valid node`
          )
          break
        }
        if (!nodeIds.has(edge.target)) {
          errors.push(
            `Edge target "${edge.target}" does not reference valid node`
          )
          break
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Full generation pipeline: context -> AI -> parse -> validate
   */
  async fullGenerationPipeline(
    workspace: IWorkspace,
    userPrompt?: string,
    model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o'
  ): Promise<{
    success: boolean
    generatedContent: string
    parsed: ParsedGeneration | null
    validation: { valid: boolean; errors: string[] }
    tokensUsed: { prompt: number; completion: number; total: number }
    error?: string
  }> {
    // Step 1: Generate with AI
    const genResponse = await this.generateWithContext(
      workspace,
      userPrompt,
      model
    )

    if (!genResponse.success) {
      return {
        success: false,
        generatedContent: '',
        parsed: null,
        validation: { valid: false, errors: [genResponse.error!] },
        tokensUsed: genResponse.tokensUsed,
        error: genResponse.error,
      }
    }

    // Step 2: Parse response
    const parsed = this.parseGeneration(genResponse.generatedContent)

    if (!parsed) {
      return {
        success: false,
        generatedContent: genResponse.generatedContent,
        parsed: null,
        validation: {
          valid: false,
          errors: ['Failed to parse AI response'],
        },
        tokensUsed: genResponse.tokensUsed,
        error: 'Response parsing failed',
      }
    }

    // Step 3: Validate structure
    const validation = this.validateWorkspace(parsed)

    return {
      success: validation.valid,
      generatedContent: genResponse.generatedContent,
      parsed,
      validation,
      tokensUsed: genResponse.tokensUsed,
    }
  }

  /**
   * Generate detailed card content (markdown-ready) based on node context
   */
  async generateCardContent(
    request: CardContentRequest
  ): Promise<CardContentResponse> {
    const fallback = (
      reason: string,
      options: { warnings?: string[]; usedFallback?: boolean } = {}
    ): CardContentResponse => {
      const { warnings = [], usedFallback = true } = options
      // Prefer existing content, otherwise pull from PRD context, finally leave blank
      const lookupBody = (title: string, index: number): string => {
        const titleLower = title.toLowerCase()

        const existing = request.existingContent?.find(
          (section) => section.title?.toLowerCase() === titleLower
        )
        if (existing?.body && existing.body.trim().length > 0) {
          return existing.body
        }

        const prdMatch = request.prdContext?.sections?.find(
          (section) => {
            const sectionTitle = section.title?.toLowerCase() ?? ''
            return (
              sectionTitle === titleLower ||
              sectionTitle.includes(titleLower) ||
              titleLower.includes(sectionTitle)
            )
          }
        )
        if (prdMatch?.content) {
          return prdMatch.content
        }

        const body = buildSectionScaffold({
          request,
          title,
          index,
        })

        return body
      }

      const sections = request.card.sections.map((section, index) => ({
        title: section.title,
        body: lookupBody(section.title, index),
      }))

      return {
        success: !usedFallback,
        usedFallback,
        sections,
        checklist: request.card.checklist,
        warnings: [
          reason,
          ...(warnings.length ? warnings : []),
        ],
      }
    }

    if (!this.client) {
      return fallback(this.apiKeyError || 'OpenAI client not initialized')
    }

    const systemPrompt = `You are an expert product requirements author.
Respond ONLY with valid JSON matching this schema:
{
  "sections": [
    {
      "title": "string",
      "body": "markdown content tailored to the node"
    }
  ],
  "notes": "optional string explaining assumptions",
  "quality": {
    "confidence": "0-100 integer score estimating usefulness",
    "factors": ["short bullet list summarising why"]
  }
}
Do NOT wrap the JSON in markdown code fences.`

    type ScaffoldContext = {
      request: CardContentRequest
      title: string
      index: number
    }

    function buildSectionScaffold({ request, title, index }: ScaffoldContext): string {
      const normalized = title.toLowerCase()
      const isFirstSection = index === 0

      const { node, card, prdContext } = request
      const intent = node.intent ?? {}
      const blueprintKind =
        typeof node.metadata?.blueprintAutoKind === 'string'
          ? String(node.metadata.blueprintAutoKind)
          : undefined
      const domainText = node.domain ? `${node.domain} domain` : 'overall platform'
      const baseDescriptor =
        node.type === 'frontend'
          ? 'user experience layer'
          : node.type === 'backend'
          ? 'service layer'
          : node.type === 'doc'
          ? 'knowledge hub'
          : node.type === 'requirement'
          ? 'product capability'
          : 'node'

      const tagSnippet = node.tags?.length ? `Key tags: ${node.tags.join(', ')}.` : ''
      const relatedSnippet =
        node.relatedNodes && node.relatedNodes.length
          ? `Coordinate with related nodes such as ${node.relatedNodes
              .slice(0, 4)
              .map((rel) => `${rel.label}${rel.type ? ` (${rel.type})` : ''}`)
              .join(', ')}.`
          : ''
      const checklistSnippet =
        card.checklist && card.checklist.length
          ? `Ensure the following items are satisfied: ${card.checklist.join(', ')}.`
          : ''
      const prdSnippet = prdContext
        ? `Reference PRD template **${prdContext.name}**${
            prdContext.templateId ? ` (${prdContext.templateId})` : ''
          } for alignment.`
        : ''

      const introLines: string[] = []
      if (isFirstSection) {
        introLines.push(
          `**Purpose:** Define how **${node.label}** functions as a ${baseDescriptor} within the ${domainText}.`
        )
        if (node.summary) {
          introLines.push(`**Context summary:** ${node.summary}`)
        }
        if (tagSnippet) introLines.push(tagSnippet)
        if (relatedSnippet) introLines.push(relatedSnippet)
        if (prdSnippet) introLines.push(prdSnippet)
        if (intent.primaryAudience) {
          introLines.push(`**Primary audience:** ${intent.primaryAudience}`)
        }
        if (intent.coreOutcome) {
          introLines.push(`**Target outcome:** ${intent.coreOutcome}`)
        }
        if (intent.launchScope) {
          introLines.push(`**Launch must include:** ${intent.launchScope}`)
        }
        if (intent.primaryRisk) {
          introLines.push(`**Known risk:** ${intent.primaryRisk}`)
        }
        if (blueprintKind) {
          introLines.push(`**Blueprint focus:** auto-generated ${blueprintKind} detail from idea kickoff.`)
        }
      }

      const sectionLines: string[] = []

      const pushForTopic = (heading: string, content: string[]) => {
        sectionLines.push(`#### ${heading}`)
        sectionLines.push(...content)
      }

      const ensureCallouts = (content: string[]) => {
        if (checklistSnippet) {
          content.push(checklistSnippet)
        }
        if (relatedSnippet && !content.includes(relatedSnippet)) {
          content.push(relatedSnippet)
        }
      }

      if (normalized.includes('overview') || normalized.includes('summary')) {
        pushForTopic('Role & Scope', [
          `Describe the core responsibilities of **${node.label}** and how it fits into the ${domainText}.`,
          `Highlight the personas or systems that depend on this node.`,
        ])
        pushForTopic('Key Outcomes', [
          'List measurable outcomes or KPIs that indicate success.',
          'Identify any open questions or decisions still pending.',
        ])
      } else if (normalized.includes('architecture') || normalized.includes('design')) {
        if (node.type === 'frontend') {
          pushForTopic('UI Composition', [
            'Outline component hierarchy, shared layout primitives, and state management approach.',
            'Explain routing, navigation guards, and responsiveness requirements.',
          ])
          pushForTopic('Data Flow', [
            'Detail how data is fetched, cached, and synchronized with backend services.',
            'Document error-handling patterns and loading states.',
          ])
        } else if (node.type === 'backend') {
          pushForTopic('Service Responsibilities', [
            'Break down the primary modules and their responsibilities.',
            'Note API surface area, contracts, and performance expectations.',
          ])
          pushForTopic('Operational Concerns', [
            'Indicate deployment strategy, scaling expectations, and resilience patterns (circuit breakers, retries).',
          ])
        } else {
          pushForTopic('Structure', [
            `Document how the ${baseDescriptor} is organized (chapters, sections, or modules).`,
            'Mention ownership and maintenance model.',
          ])
        }
        ensureCallouts(sectionLines)
      } else if (normalized.includes('interface')) {
        pushForTopic('Consumers', [
          'List internal/external consumers and the entry points they use.',
          'Clarify how authentication/authorization or feature flags are enforced.',
        ])
        pushForTopic('Interaction Contracts', [
          'Document key request/response schemas, events, or UI interactions that must be stable.',
        ])
        ensureCallouts(sectionLines)
      } else if (normalized.includes('dependency')) {
        pushForTopic('Upstream Dependencies', [
          'Enumerate services, libraries, or data sources required by this node.',
          'Document version constraints, SLAs, and failure fallback behaviour.',
        ])
        pushForTopic('Downstream Impact', [
          'Call out modules that depend on this node and what breaks if it is unavailable.',
        ])
        ensureCallouts(sectionLines)
      } else if (normalized.includes('testing') || normalized.includes('validation')) {
        pushForTopic('Quality Strategy', [
          'Specify automated test coverage expectations (unit, integration, e2e).',
          'Describe manual validation steps or staging environments required.',
        ])
        pushForTopic('Monitoring & Alerts', [
          'List key metrics, logs, or tracing that confirm the node is healthy in production.',
        ])
        ensureCallouts(sectionLines)
      } else if (normalized.includes('roadmap') || normalized.includes('backlog')) {
        pushForTopic('Near-Term Deliverables', [
          'Capture the backlog items required to launch or iterate on this node.',
        ])
        pushForTopic('Risks & Mitigations', [
          'Identify risks, mitigations, and contingency plans.',
        ])
      } else {
        sectionLines.push(
          `Provide actionable guidance tailored to **${node.label}** for the **${title}** discipline.`
        )
        sectionLines.push('Highlight current state, desired target state, and concrete next steps.')
        ensureCallouts(sectionLines)
      }

      if (blueprintKind === 'persona') {
        sectionLines.push('#### Persona Snapshot')
        if (intent.primaryAudience) {
          sectionLines.push(
            `Describe the primary audience in clear terms (kickoff input: ${intent.primaryAudience}).`
          )
        }
        sectionLines.push('Capture needs, pains, and success signals for this audience. Tie them to the broader mission.')
      } else if (blueprintKind === 'outcome') {
        sectionLines.push('#### Outcome Guardrails')
        if (intent.coreOutcome) {
          sectionLines.push(`Anchor every deliverable to the desired outcome: ${intent.coreOutcome}.`)
        }
        sectionLines.push('Provide milestone KPIs and leading indicators so the team knows if they are on track.')
      } else if (blueprintKind === 'launch') {
        sectionLines.push('#### Launch Commitments')
        if (intent.launchScope) {
          sectionLines.push(`Remind the reader of the promised launch scope: ${intent.launchScope}.`)
        }
        sectionLines.push('List readiness checkpoints, owners, and cross-team dependencies that must be cleared before launch.')
      } else if (blueprintKind === 'risk') {
        sectionLines.push('#### Primary Risk')
        if (intent.primaryRisk) {
          sectionLines.push(`Explain the primary risk in detail: ${intent.primaryRisk}.`)
        }
        sectionLines.push('Outline mitigations, contingency plans, and monitoring required to manage this risk.')
      }

      const assembled = [`### ${title}`, ...introLines, ...sectionLines]
      return assembled.join('\n\n')
    }

    const parts: string[] = []
    parts.push(`### Node Context
- Label: ${request.node.label}
- Type: ${request.node.type}
${request.node.domain ? `- Domain: ${request.node.domain}` : ''}
${request.node.summary ? `- Summary: ${request.node.summary}` : ''}
${request.node.tags && request.node.tags.length ? `- Tags: ${request.node.tags.join(', ')}` : ''}`)

    if (request.node.relatedNodes?.length) {
      parts.push(
        `### Related Nodes\n${request.node.relatedNodes
          .map(
            (rel) =>
              `- ${rel.label} (${rel.type})${rel.relation ? ` – relation: ${rel.relation}` : ''}${
                rel.summary ? ` – ${rel.summary}` : ''
              }`
          )
          .join('\n')}`
      )
    }

    parts.push(
      `### Card Template
- Title: ${request.card.title}${request.card.description ? `\n- Description: ${request.card.description}` : ''}
- Sections:\n${request.card.sections
        .map(
          (section, index) =>
            `${index + 1}. ${section.title}${
              section.description ? ` – ${section.description}` : ''
            }`
        )
        .join('\n')}`
    )

    if (request.existingContent?.some((section) => section.body && section.body.trim().length > 0)) {
      parts.push(
        `### Draft Content\n${request.existingContent
          .map((section) => `#### ${section.title}\n${section.body || ''}`.trim())
          .join('\n\n')}`
      )
    }

    if (request.prdContext) {
      parts.push(
        `### Reference PRD
- Template: ${request.prdContext.name} (${request.prdContext.templateId})
- Overview: ${request.prdContext.description || 'n/a'}
- Key Sections:\n${request.prdContext.sections
          .slice(0, 10)
          .map(
            (section) =>
              `• ${section.title}: ${section.content.substring(0, 220)}${
                section.content.length > 220 ? '...' : ''
              }`
          )
          .join('\n')}`
      )
    }

    if (request.card.checklist?.length) {
      parts.push(
        `### Checklist Items to Cover
${request.card.checklist.map((item) => `- ${item}`).join('\n')}`
      )
    }

    const userPrompt = `${parts.join('\n\n')}\n\nProduce requirement content tailored to this node. Each section body must be specific to the node context, actionable, and written in markdown with headings, bullet lists, and tables when useful.`

    const timeoutMs = Number(process.env.CARD_GENERATION_TIMEOUT_MS ?? 12000)
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }, { signal: controller.signal })

      clearTimeout(timeoutHandle)

      const rawOutput = response.choices[0].message.content || ''
      const usage = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      }

      let parsed: any = null
      const trimmed = rawOutput.trim()

      try {
        parsed = JSON.parse(trimmed)
      } catch {
        const match = trimmed.match(/\{[\s\S]*\}/)
        if (match) {
          parsed = JSON.parse(match[0])
        }
      }

      if (!parsed || !Array.isArray(parsed.sections)) {
        return fallback('AI response could not be parsed', {
          warnings: ['Returned content was not valid JSON.'],
        })
      }

      const sections: CardContentSection[] = parsed.sections.map((section: any, index: number) => ({
        title:
          section.title && typeof section.title === 'string'
            ? section.title
            : request.card.sections[index]?.title || `Section ${index + 1}`,
        body:
          section.body && typeof section.body === 'string'
            ? section.body.trim()
            : '',
      }))

      const emptyBodies = sections.filter((section) => !section.body || section.body.length === 0)
      if (emptyBodies.length === sections.length) {
        return fallback('AI returned empty section bodies', {
          warnings: ['No section content generated.'],
        })
      }

      const warnings: string[] = []
      if (parsed.quality?.confidence && parsed.quality.confidence < 60) {
        warnings.push(
          `Model confidence reported as ${parsed.quality.confidence}—review recommended.`
        )
      }

      return {
        success: true,
        usedFallback: false,
        sections,
        checklist: request.card.checklist,
        tokensUsed: usage,
        warnings,
        rawOutput,
      }
    } catch (error) {
      clearTimeout(timeoutHandle)
      const warning =
        error instanceof Error
          ? error.name === 'AbortError'
            ? `Generation timed out after ${timeoutMs}ms`
            : error.message
          : 'Unknown error during card generation'
      return fallback('AI generation failed', {
        warnings: [warning],
      })
    }
  }
}

export const GenerationService = new GenerationServiceClass()
