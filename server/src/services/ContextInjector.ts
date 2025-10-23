import { prdRetrievalService } from './PRDRetrievalService.js'
import type { IWorkspace, IWorkspaceNode, IWorkspaceEdge } from '../models/Workspace.js'
import PRDTemplate from '../models/PRDTemplate.js'

/**
 * ContextInjector Service
 *
 * Builds structured context for AI generation by:
 * 1. Analyzing user workspace
 * 2. Retrieving best-matching PRD template
 * 3. Assembling prompt context
 * 4. Preparing for GPT-4o generation
 */

export interface WorkspaceContext {
  workspace: {
    name: string
    nodeCount: number
    edgeCount: number
    archetypes: string[]
    technologies?: string[]
    requirements?: string[]
  }
  prdTemplate?: {
    template_id: string
    name: string
    category: string
    description: string
    sections: Array<{ title: string; content: string }>
  }
  analysis: {
    workspaceDescription: string
    suggestedCategory?: string
    matchConfidence?: number
  }
}

export interface PromptContext {
  workspace: WorkspaceContext
  systemPrompt: string
  userPrompt: string
  context: string
}

class ContextInjector {
  /**
   * Extract key information from workspace
   */
  private analyzeWorkspace(workspace: IWorkspace): {
    archetypes: string[]
    technologies: string[]
    requirements: string[]
    description: string
  } {
    const archetypes = new Set<string>()
    const technologies = new Set<string>()
    const requirements: string[] = []

    // Analyze nodes
    workspace.nodes.forEach((node: IWorkspaceNode) => {
      archetypes.add(node.type)

      if (node.data.stackHint) {
        node.data.stackHint
          .split(/[,\s]+/)
          .filter((s) => s.length > 0)
          .forEach((tech) => technologies.add(tech))
      }

      if (node.type === 'requirement' && node.data.summary) {
        requirements.push(node.data.summary)
      }
    })

    // Build description from nodes
    const nodeDescriptions = workspace.nodes
      .filter((n) => n.type !== 'root')
      .map((n) => `${n.type}: ${n.data.title}${n.data.summary ? ` (${n.data.summary})` : ''}`)
      .join('\n')

    return {
      archetypes: Array.from(archetypes),
      technologies: Array.from(technologies),
      requirements,
      description: nodeDescriptions || `Workspace: ${workspace.name}`,
    }
  }

  /**
   * Search for best matching PRD template
   */
  private async findBestPRDMatch(workspace: IWorkspace): Promise<{
    template: any
    matchScore: number
    matchedOn: string[]
  } | null> {
    const analysis = this.analyzeWorkspace(workspace)

    // Build search query from workspace characteristics
    const searchTerms: string[] = []
    searchTerms.push(workspace.name)
    searchTerms.push(...analysis.archetypes)
    searchTerms.push(...analysis.technologies)

    if (analysis.requirements.length > 0) {
      searchTerms.push(analysis.requirements[0])
    }

    const query = searchTerms.filter((t) => t.length > 0).join(' ')

    if (!query) {
      return null
    }

    try {
      // Use text search to find best match
      const results = await prdRetrievalService.textSearch(query, 5)

      if (results.length === 0) {
        return null
      }

      // Get full template for best result
      const bestResult = results[0]
      const template = await PRDTemplate.findOne({
        template_id: bestResult.template_id,
      }).lean()

      if (!template) {
        return null
      }

      return {
        template,
        matchScore: bestResult.relevance_score || 0,
        matchedOn: [
          ...analysis.archetypes.filter((a) => query.includes(a)),
          ...analysis.technologies.filter((t) => query.includes(t)),
        ],
      }
    } catch (error) {
      console.error('Error finding PRD match:', error)
      return null
    }
  }

  /**
   * Build workspace context with PRD template
   */
  async buildWorkspaceContext(workspace: IWorkspace): Promise<WorkspaceContext> {
    const analysis = this.analyzeWorkspace(workspace)
    const prdMatch = await this.findBestPRDMatch(workspace)

    return {
      workspace: {
        name: workspace.name,
        nodeCount: workspace.nodes.length,
        edgeCount: workspace.edges.length,
        archetypes: analysis.archetypes,
        technologies: analysis.technologies,
        requirements: analysis.requirements,
      },
      prdTemplate: prdMatch
        ? {
            template_id: prdMatch.template.template_id,
            name: prdMatch.template.name,
            category: prdMatch.template.category,
            description: prdMatch.template.description,
            sections: prdMatch.template.sections || [],
          }
        : undefined,
      analysis: {
        workspaceDescription: analysis.description,
        suggestedCategory: prdMatch?.template.category,
        matchConfidence: prdMatch?.matchScore,
      },
    }
  }

  /**
   * Build system prompt for GPT-4o
   */
  private buildSystemPrompt(): string {
    return `Output ONLY valid JSON. No explanations. No markdown. No code blocks.

Your output must be EXACTLY this format:
{"nodes":[{"id":"","type":"","label":"","description":""}],"edges":[{"source":"","target":"","label":""}],"summary":""}`
  }

  /**
   * Build user prompt with workspace context
   */
  private buildUserPrompt(context: WorkspaceContext): string {
    const parts: string[] = []

    // Workspace overview
    parts.push(`## Workspace Analysis Request

### Workspace Information
- **Name**: ${context.workspace.name}
- **Components**: ${context.workspace.nodeCount} nodes
- **Connections**: ${context.workspace.edgeCount} edges
- **Component Types**: ${context.workspace.archetypes.join(', ')}

### Component Details
${context.analysis.workspaceDescription}`)

    // Technologies
    if (context.workspace.technologies && context.workspace.technologies.length > 0) {
      parts.push(
        `### Technologies in Use
${context.workspace.technologies.map((t) => `- ${t}`).join('\n')}`
      )
    }

    // Requirements
    if (context.workspace.requirements && context.workspace.requirements.length > 0) {
      parts.push(
        `### Key Requirements
${context.workspace.requirements.map((r) => `- ${r}`).join('\n')}`
      )
    }

    // PRD Template context
    if (context.prdTemplate) {
      parts.push(`### Reference Architecture: ${context.prdTemplate.name}

This workspace aligns with the **${context.prdTemplate.category}** architectural pattern.

**Pattern Description**: ${context.prdTemplate.description}

#### Relevant Pattern Sections:`)

      if (context.prdTemplate.sections && context.prdTemplate.sections.length > 0) {
        context.prdTemplate.sections.forEach((section) => {
          parts.push(`
**${section.title}**
${section.content}`)
        })
      }
    }

    // Request
    parts.push(`### IMPORTANT: Generate JSON ONLY

Return your response as ONLY valid JSON in this exact format. NO markdown. NO explanations. JUST JSON:

{
  "nodes": [
    {"id": "node1", "type": "frontend", "label": "UI Layer", "description": "Customer-facing interface"},
    {"id": "node2", "type": "backend", "label": "API Server", "description": "Business logic"},
    {"id": "node3", "type": "database", "label": "Data Store", "description": "Persistent storage"}
  ],
  "edges": [
    {"source": "node1", "target": "node2", "label": "HTTP/REST"},
    {"source": "node2", "target": "node3", "label": "SQL queries"}
  ],
  "summary": "A three-tier architecture with separation of concerns"
}

Respond with ONLY the JSON object. No additional text.`)

    return parts.join('\n')
  }

  /**
   * Build integrated prompt context for GPT-4o
   */
  async buildPromptContext(workspace: IWorkspace): Promise<PromptContext> {
    const workspaceContext = await this.buildWorkspaceContext(workspace)

    return {
      workspace: workspaceContext,
      systemPrompt: this.buildSystemPrompt(),
      userPrompt: this.buildUserPrompt(workspaceContext),
      context: this.formatContextSummary(workspaceContext),
    }
  }

  /**
   * Format context summary for logging/debugging
   */
  private formatContextSummary(context: WorkspaceContext): string {
    return `
WORKSPACE CONTEXT SUMMARY
========================
Name: ${context.workspace.name}
Components: ${context.workspace.nodeCount} nodes, ${context.workspace.edgeCount} edges
Types: ${context.workspace.archetypes.join(', ')}
Technologies: ${context.workspace.technologies?.join(', ') || 'Not specified'}
Requirements: ${context.workspace.requirements?.length || 0} items

${context.prdTemplate ? `MATCHED PRD TEMPLATE
==================
Name: ${context.prdTemplate.name}
Category: ${context.prdTemplate.category}
Confidence: ${context.analysis.matchConfidence?.toFixed(2) || 'N/A'}
` : 'NO PRD TEMPLATE MATCHED'}

ANALYSIS
========
${context.analysis.workspaceDescription}
`
  }

  /**
   * Get context for a specific workspace node
   */
  async getNodeContext(node: IWorkspaceNode): Promise<string> {
    const parts: string[] = [
      `### ${node.data.title}`,
      `Type: ${node.type}`,
      `Position: (${node.position.x}, ${node.position.y})`,
    ]

    if (node.data.summary) {
      parts.push(`Description: ${node.data.summary}`)
    }

    if (node.data.tags && node.data.tags.length > 0) {
      parts.push(`Tags: ${node.data.tags.join(', ')}`)
    }

    if (node.data.stackHint) {
      parts.push(`Stack: ${node.data.stackHint}`)
    }

    return parts.join('\n')
  }

  /**
   * Get context for workspace edges (relationships)
   */
  async getEdgeContext(edges: IWorkspaceEdge[]): Promise<string> {
    if (edges.length === 0) {
      return 'No connections defined'
    }

    const relationships = edges
      .map((edge) => {
        const label = edge.label ? ` [${edge.label}]` : ''
        return `- ${edge.source} → ${edge.target}${label}`
      })
      .join('\n')

    return `### Relationships\n${relationships}`
  }

  /**
   * Generate structured analysis
   */
  async analyzeWorkspaceStructure(workspace: IWorkspace): Promise<{
    summary: string
    components: Array<{ type: string; count: number }>
    complexity: 'simple' | 'medium' | 'complex'
    recommendations: string[]
  }> {
    const typeCounts = new Map<string, number>()
    const technologies = new Set<string>()
    const recommendations: string[] = []

    // Count component types
    workspace.nodes.forEach((node) => {
      typeCounts.set(node.type, (typeCounts.get(node.type) || 0) + 1)
      if (node.data.stackHint) {
        node.data.stackHint
          .split(/[,\s]+/)
          .forEach((tech) => technologies.add(tech))
      }
    })

    // Determine complexity
    const totalNodes = workspace.nodes.length
    let complexity: 'simple' | 'medium' | 'complex' = 'simple'
    if (totalNodes > 10) complexity = 'complex'
    else if (totalNodes > 5) complexity = 'medium'

    // Generate recommendations
    if (workspace.edges.length === 0) {
      recommendations.push('Define relationships between components')
    }

    if (technologies.size === 0) {
      recommendations.push('Specify technology stack for components')
    }

    if (!workspace.nodes.some((n) => n.type === 'backend')) {
      recommendations.push('Consider adding backend component')
    }

    if (!workspace.nodes.some((n) => n.type === 'frontend')) {
      recommendations.push('Consider adding frontend component')
    }

    const summary = `${totalNodes} components with ${workspace.edges.length} connections. ` +
      `Types: ${Array.from(typeCounts.keys()).join(', ')}. ` +
      `Complexity: ${complexity}.`

    return {
      summary,
      components: Array.from(typeCounts.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      complexity,
      recommendations,
    }
  }
}

// Export singleton
export const contextInjector = new ContextInjector()

export default ContextInjector
