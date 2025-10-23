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
}

export const GenerationService = new GenerationServiceClass()
