import { Router, Request, Response } from 'express'
import Workspace from '../models/Workspace.js'
import { contextInjector } from '../services/ContextInjector.js'

const router = Router()

/**
 * POST /api/workspaces/:id/context
 * Build context for a workspace (PRD retrieval + prompt building)
 *
 * Returns:
 * - Workspace analysis
 * - Matched PRD template (if found)
 * - System and user prompts for AI generation
 * - Context summary for debugging
 */
router.post('/:id/context', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Fetch workspace
    const workspace = await Workspace.findById(id)
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      })
    }

    // Build prompt context
    const promptContext = await contextInjector.buildPromptContext(workspace)

    res.json({
      success: true,
      data: {
        workspace: promptContext.workspace,
        prompts: {
          system: promptContext.systemPrompt,
          user: promptContext.userPrompt,
        },
        context: promptContext.context,
        ready_for_generation: true,
      },
    })
  } catch (error) {
    console.error('Error building context:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build context',
    })
  }
})

/**
 * GET /api/workspaces/:id/analysis
 * Get structured analysis of workspace
 *
 * Returns:
 * - Summary of components
 * - Component breakdown by type
 * - Complexity assessment
 * - Improvement recommendations
 */
router.get('/:id/analysis', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Fetch workspace
    const workspace = await Workspace.findById(id)
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      })
    }

    // Analyze structure
    const analysis = await contextInjector.analyzeWorkspaceStructure(workspace)

    res.json({
      success: true,
      workspaceId: id,
      workspaceName: workspace.name,
      data: analysis,
    })
  } catch (error) {
    console.error('Error analyzing workspace:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze workspace',
    })
  }
})

/**
 * POST /api/workspaces/:id/context/prd-match
 * Find matching PRD template for workspace
 *
 * Returns:
 * - Matched PRD template
 * - Match confidence score
 * - Matched fields/archetypes
 */
router.post('/:id/context/prd-match', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Fetch workspace
    const workspace = await Workspace.findById(id)
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      })
    }

    // Build context to get PRD match
    const workspaceContext = await contextInjector.buildWorkspaceContext(workspace)

    res.json({
      success: true,
      workspaceId: id,
      prdMatch: workspaceContext.prdTemplate
        ? {
            template_id: workspaceContext.prdTemplate.template_id,
            name: workspaceContext.prdTemplate.name,
            category: workspaceContext.prdTemplate.category,
            description: workspaceContext.prdTemplate.description,
            matchConfidence: workspaceContext.analysis.matchConfidence,
          }
        : null,
      analysis: {
        workspaceDescription: workspaceContext.analysis.workspaceDescription,
        suggestedCategory: workspaceContext.analysis.suggestedCategory,
      },
    })
  } catch (error) {
    console.error('Error matching PRD:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to match PRD',
    })
  }
})

/**
 * GET /api/workspaces/:id/context/summary
 * Get context summary (lightweight, no detailed prompts)
 *
 * Useful for quick checks without full prompt generation
 */
router.get('/:id/context/summary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Fetch workspace
    const workspace = await Workspace.findById(id)
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      })
    }

    // Get workspace context
    const workspaceContext = await contextInjector.buildWorkspaceContext(workspace)

    res.json({
      success: true,
      workspaceId: id,
      data: {
        workspace: workspaceContext.workspace,
        analysis: workspaceContext.analysis,
        prdMatched: !!workspaceContext.prdTemplate,
      },
    })
  } catch (error) {
    console.error('Error getting context summary:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get context summary',
    })
  }
})

export default router
