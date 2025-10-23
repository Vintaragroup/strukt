import express, { Request, Response } from 'express'
import Workspace from '../models/Workspace.js'
import { GenerationService } from '../services/GenerationService.js'

const router = express.Router()

/**
 * GET /api/generation/health
 * Check if GPT-4o generation is available
 */
router.get('/health', (_req: Request, res: Response) => {
  const status = GenerationService.getHealthStatus()
  res.json(status)
})

/**
 * POST /api/generation/generate
 * Generate workspace content from user prompt
 *
 * Body:
 * {
 *   workspaceId: string
 *   userPrompt: string (optional - uses default if not provided)
 *   model: "gpt-4o" | "gpt-4o-mini" (default: gpt-4o)
 * }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { workspaceId, userPrompt, model } = req.body

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: 'workspaceId is required',
      })
    }

    // Fetch workspace
    const workspace = await Workspace.findById(workspaceId)
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      })
    }

    // Run full pipeline
    const result = await GenerationService.fullGenerationPipeline(
      workspace,
      userPrompt,
      model || 'gpt-4o'
    )

    res.json({
      success: result.success,
      workspaceId,
      generation: {
        success: result.success,
        content: result.generatedContent,
        parsed: result.parsed,
        validation: result.validation,
        tokensUsed: result.tokensUsed,
      },
      error: result.error,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
    res.status(500).json({
      success: false,
      error: `Generation failed: ${message}`,
    })
  }
})

/**
 * POST /api/generation/parse
 * Parse existing AI-generated content
 *
 * Body:
 * {
 *   content: string (AI-generated content to parse)
 * }
 */
router.post('/parse', (req: Request, res: Response) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content is required',
      })
    }

    const parsed = GenerationService.parseGeneration(content)

    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse content',
      })
    }

    const validation = GenerationService.validateWorkspace(parsed)

    res.json({
      success: validation.valid,
      parsed,
      validation,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
    res.status(500).json({
      success: false,
      error: `Parse failed: ${message}`,
    })
  }
})

/**
 * POST /api/generation/validate
 * Validate parsed workspace structure
 *
 * Body:
 * {
 *   nodes: Array of {id, type, label, description}
 *   edges: Array of {source, target, label, type}
 * }
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const parsed = req.body

    const validation = GenerationService.validateWorkspace(parsed)

    res.json({
      success: validation.valid,
      validation,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
    res.status(500).json({
      success: false,
      error: `Validation failed: ${message}`,
    })
  }
})

export default router
