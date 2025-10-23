import { Router, Request, Response } from 'express'
import OpenAI from 'openai'
import { config } from '../config/env.js'

const router = Router()

// Heuristic suggestions when OpenAI API key is not available
function getHeuristicSuggestions(
  nodes: Array<{ type: string }>,
  edges: Array<{ source: string; target: string }>
) {
  const nodeTypes = new Set(nodes.map((n) => n.type))
  const suggestions = []

  // Suggest missing basic components
  if (!nodeTypes.has('frontend')) {
    suggestions.push({
      type: 'frontend',
      data: {
        title: 'Web UI',
        summary: 'React/Vue/Angular frontend application',
        stackHint: 'React',
      },
    })
  }

  if (!nodeTypes.has('backend')) {
    suggestions.push({
      type: 'backend',
      data: {
        title: 'REST API',
        summary: 'Backend server with REST endpoints',
        stackHint: 'Node.js + Express',
      },
    })
  }

  if (!nodeTypes.has('requirement')) {
    suggestions.push({
      type: 'requirement',
      data: {
        title: 'User Authentication',
        summary: 'User login and session management',
      },
    })
  }

  if (!nodeTypes.has('doc')) {
    suggestions.push({
      type: 'doc',
      data: {
        title: 'API Documentation',
        summary: 'OpenAPI/Swagger specification',
      },
    })
  }

  return suggestions
}

/**
 * Generate workspace structure from project prompt using heuristics
 * Parses the prompt to extract key technologies and creates appropriate nodes
 */
function generateFromPromptHeuristic(prompt: string) {
  const nodes = []
  const edges = []

  // Root node
  const rootId = 'root-generated'
  // Track detected backend node id for linking database requirement
  let detectedBackendId: string | null = null
  nodes.push({
    id: rootId,
    type: 'root',
    position: { x: 0, y: 0 },
    data: {
      title: 'Project Root',
      summary: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    },
  })

  let yOffset = 150

  // Detect frontend frameworks
  const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'frontend', 'ui', 'web']
  if (frontendKeywords.some((k) => prompt.toLowerCase().includes(k))) {
    const frontendFramework = frontendKeywords.find((k) => prompt.toLowerCase().includes(k))
    const frontendId = `frontend-${Date.now()}-1`
    nodes.push({
      id: frontendId,
      type: 'frontend',
      position: { x: -300, y: yOffset },
      data: {
        title: `${frontendFramework?.charAt(0).toUpperCase()}${frontendFramework?.slice(1) || 'Frontend'}`,
        summary: `User interface built with ${frontendFramework || 'modern framework'}`,
        stackHint: frontendFramework,
      },
    })
    edges.push({ id: `edge-root-frontend`, source: rootId, target: frontendId })
  }

  // Detect backend frameworks
  const backendKeywords = [
    'node.js',
    'nodejs',
    'express',
    'django',
    'flask',
    'fastapi',
    'spring',
    'go',
    'rust',
    'backend',
    'api',
    'server',
  ]
  if (backendKeywords.some((k) => prompt.toLowerCase().includes(k))) {
    const backendFramework = backendKeywords.find((k) => prompt.toLowerCase().includes(k))
    detectedBackendId = `backend-${Date.now()}-1`
    nodes.push({
      id: detectedBackendId,
      type: 'backend',
      position: { x: 300, y: yOffset },
      data: {
        title: `${backendFramework?.charAt(0).toUpperCase()}${backendFramework?.slice(1) || 'Backend'}`,
        summary: `Server-side API built with ${backendFramework || 'backend framework'}`,
        stackHint: backendFramework,
      },
    })
    edges.push({ id: `edge-root-backend`, source: rootId, target: detectedBackendId })
  }

  yOffset += 200

  // Detect database requirements
  const dbKeywords = ['mongodb', 'postgresql', 'mysql', 'firebase', 'redis', 'database', 'sql', 'nosql']
  if (dbKeywords.some((k) => prompt.toLowerCase().includes(k))) {
    const dbType = dbKeywords.find((k) => prompt.toLowerCase().includes(k))
    const dbId = `requirement-db-${Date.now()}`
    nodes.push({
      id: dbId,
      type: 'requirement',
      position: { x: 300, y: yOffset },
      data: {
        title: `${dbType?.toUpperCase() || 'Database'}`,
        summary: `Data persistence with ${dbType || 'database'}`,
      },
    })
    // Link DB requirement to backend if present, otherwise to root
    edges.push({ id: `edge-backend-db`, source: detectedBackendId || rootId, target: dbId })
  }

  // Detect authentication
  const authKeywords = ['jwt', 'oauth', 'auth', 'login', 'authentication', 'user', 'session']
  if (authKeywords.some((k) => prompt.toLowerCase().includes(k))) {
    const authId = `requirement-auth-${Date.now()}`
    nodes.push({
      id: authId,
      type: 'requirement',
      position: { x: 0, y: yOffset },
      data: {
        title: 'Authentication',
        summary: 'User login, JWT tokens, or OAuth2',
      },
    })
    edges.push({ id: `edge-root-auth`, source: rootId, target: authId })
  }

  yOffset += 200

  // Add documentation node
  const docId = `doc-${Date.now()}`
  nodes.push({
    id: docId,
    type: 'doc',
    position: { x: -300, y: yOffset },
    data: {
      title: 'API Documentation',
      summary: 'OpenAPI/Swagger specification',
    },
  })
  edges.push({ id: `edge-root-doc`, source: rootId, target: docId })

  return { nodes, edges }
}

/**
 * POST /api/ai/suggest
 * Get AI suggestions for workspace nodes
 */
router.post('/suggest', async (req: Request, res: Response) => {
  try {
    const { nodes = [], edges = [] } = req.body

    // Use heuristics if no API key
    if (!config.openaiApiKey) {
      const suggestions = getHeuristicSuggestions(nodes, edges)
      return res.json({ suggestions })
    }

    // Call OpenAI API
    const client = new OpenAI({ apiKey: config.openaiApiKey })

    const systemPrompt = `You are a helpful AI assistant for software architecture planning. 
The user will provide a workspace with existing nodes and edges representing project components.
Your task is to suggest 1-3 new nodes that would help complete their architecture.

Node types are: root, frontend, backend, requirement, doc

For each suggestion, return a JSON object with:
- type: one of the allowed types above
- data: { title: string, summary?: string, stackHint?: string }

Respond with ONLY a valid JSON array, no other text.
Example: [{"type":"frontend","data":{"title":"Web App","summary":"React UI","stackHint":"React"}}]`

    const userMessage = `Current workspace nodes (types): ${JSON.stringify(
      nodes.map((n: any) => ({ id: n.id, type: n.type, title: n.data?.title }))
    )}

Current edges: ${edges.length}

What 1-3 nodes would you suggest adding to improve this architecture?`

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = completion.choices[0]?.message?.content || '[]'
    const suggestions = JSON.parse(content)

    res.json({ suggestions })
  } catch (error) {
    console.error('AI suggestion error:', error)
    // Fall back to heuristics on error
    const { nodes = [] } = req.body
    const suggestions = getHeuristicSuggestions(nodes, [])
    res.json({ suggestions })
  }
})

/**
 * POST /api/ai/generate
 * Generate a complete workspace structure from a project prompt
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' })
    }

    if (prompt.length < 50) {
      return res.status(400).json({ error: 'Prompt must be at least 50 characters' })
    }

    if (prompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt cannot exceed 2000 characters' })
    }

    // Use heuristics if no API key (default behavior)
    if (!config.openaiApiKey) {
      const result = generateFromPromptHeuristic(prompt)
      return res.json({
        success: true,
        source: 'heuristic',
        workspace: result,
        message: 'Generated workspace using intelligent pattern matching',
      })
    }

    // Call OpenAI API for better generation
    const client = new OpenAI({ apiKey: config.openaiApiKey })

    const systemPrompt = `You are an expert software architect. The user will provide a project description.
Your task is to generate a realistic workspace structure with nodes representing different components.

Generate a JSON response with this exact structure:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "root|frontend|backend|requirement|doc",
      "position": { "x": number, "y": number },
      "data": {
        "title": "Node title",
        "summary": "Brief description",
        "stackHint": "Technology used (optional)"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id"
    }
  ]
}

Guidelines:
- Create 1 root node (the project itself)
- Add 2-4 frontend, backend, requirement, or doc nodes based on the prompt
- Position nodes logically (root at top-center, dependencies below)
- Ensure edges form a valid DAG (no cycles)
- Use realistic node IDs (e.g., "frontend-1", "backend-1", "db-requirement")
- Keep summaries concise (1-2 sentences)

Respond with ONLY valid JSON, no other text.`

    const userMessage = `Generate a workspace structure for this project:

${prompt}

Create nodes for: root, frontend, backend, database, authentication, and documentation components as appropriate.`

    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const content = completion.choices[0]?.message?.content || ''

    // Parse response
    let workspace
    try {
      workspace = JSON.parse(content)
    } catch {
      // If AI response fails to parse, fall back to heuristics
      workspace = generateFromPromptHeuristic(prompt)
    }

    res.json({
      success: true,
      source: 'openai',
      workspace,
      message: 'Generated workspace using AI',
    })
  } catch (error) {
    console.error('AI generation error:', error)

    // Fall back to heuristics on any error
    const { prompt } = req.body
    if (prompt) {
      const workspace = generateFromPromptHeuristic(prompt)
      return res.json({
        success: true,
        source: 'heuristic-fallback',
        workspace,
        message: 'Generated workspace using fallback algorithm',
      })
    }

    res.status(500).json({
      error: 'Generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router