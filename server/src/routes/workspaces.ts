import { Router, Request, Response } from 'express'
import { z } from 'zod'
import Workspace, {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  IWorkspace,
} from '../models/Workspace.js'
import { AuthRequest } from '../middleware/authOptional.js'
import { hasCycle, countRootNodes } from '../utils/validation.js'

const router = Router()

// Helper to filter by owner
function getOwnerFilter(user?: { sub: string }) {
  return user ? { ownerId: user.sub } : { ownerId: null }
}

/**
 * GET /api/workspaces
 * List workspaces (filtered by owner if authenticated)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const filter = getOwnerFilter(req.user)
    const workspaces = await Workspace.find(filter).sort({ updatedAt: -1 })
    res.json(workspaces)
  } catch (error) {
    console.error('Failed to list workspaces:', error)
    res.status(500).json({ message: 'Failed to list workspaces' })
  }
})

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const payload = CreateWorkspaceSchema.parse({
      ...req.body,
      ownerId: req.user?.sub || null,
    })

    // Validate single root node
    if (countRootNodes(payload.nodes) !== 1) {
      return res.status(400).json({ message: 'Workspace must have exactly one root node' })
    }

    // Validate no cycles
    if (hasCycle(payload.nodes, payload.edges)) {
      return res.status(400).json({ message: 'Graph contains cycles; must be acyclic' })
    }

    const workspace = new Workspace({
      name: payload.name,
      ownerId: payload.ownerId,
      nodes: payload.nodes,
      edges: payload.edges,
    })

    await workspace.save()
    res.status(201).json(workspace)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid workspace data', errors: error.errors })
    }
    if ((error as any).code === 11000) {
      return res.status(409).json({ message: 'Workspace name already exists' })
    }
    console.error('Failed to create workspace:', error)
    res.status(500).json({ message: 'Failed to create workspace' })
  }
})

/**
 * GET /api/workspaces/:name
 * Get workspace by name
 */
router.get('/:name', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params
    const filter = { name, ...getOwnerFilter(req.user) }

    const workspace = await Workspace.findOne(filter)
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' })
    }

    res.json(workspace)
  } catch (error) {
    console.error('Failed to get workspace:', error)
    res.status(500).json({ message: 'Failed to get workspace' })
  }
})

/**
 * PUT /api/workspaces/:name
 * Update workspace
 */
router.put('/:name', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params
    const payload = UpdateWorkspaceSchema.parse(req.body)

    const filter = { name, ...getOwnerFilter(req.user) }
    let workspace = await Workspace.findOne(filter)

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' })
    }

    // Validate updates
    if (payload.nodes) {
      if (countRootNodes(payload.nodes) !== 1) {
        return res.status(400).json({ message: 'Workspace must have exactly one root node' })
      }
    }

    if (payload.edges || payload.nodes) {
      const nodesToCheck = payload.nodes || workspace.nodes
      const edgesToCheck = payload.edges || workspace.edges
      if (hasCycle(nodesToCheck, edgesToCheck)) {
        return res.status(400).json({ message: 'Graph contains cycles; must be acyclic' })
      }
    }

    // Update fields
    if (payload.name) workspace.name = payload.name
    if (payload.nodes) workspace.nodes = payload.nodes
    if (payload.edges) workspace.edges = payload.edges
    workspace.updatedAt = new Date()

    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
        await workspace.save()
        res.json(workspace)
        return
      } catch (error: any) {
        // Handle Mongoose VersionError (optimistic locking conflict)
        if (error.name === 'VersionError') {
          retries++
          if (retries >= maxRetries) {
            console.error(`Version conflict after ${maxRetries} retries:`, error.message)
            return res.status(409).json({ 
              message: 'Workspace conflict after multiple retries',
              detail: 'Please reload and try again'
            })
          }
          console.warn(`Version conflict detected (attempt ${retries}/${maxRetries}), retrying:`, error.message)
          
          // Reload the document and reapply updates
          workspace = await Workspace.findOne(filter)
          if (!workspace) {
            return res.status(404).json({ message: 'Workspace no longer exists' })
          }
          
          // Reapply updates to fresh version
          if (payload.name) workspace.name = payload.name
          if (payload.nodes) workspace.nodes = payload.nodes
          if (payload.edges) workspace.edges = payload.edges
          workspace.updatedAt = new Date()
          
          // Small delay before retry to avoid tight loop
          await new Promise(resolve => setTimeout(resolve, 50 * retries))
          continue
        }
        
        // If not a version error, rethrow
        throw error
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid workspace data', errors: error.errors })
    }
    if ((error as any).code === 11000) {
      return res.status(409).json({ message: 'Workspace name already exists' })
    }
    console.error('Failed to update workspace:', error)
    res.status(500).json({ message: 'Failed to update workspace' })
  }
})

/**
 * DELETE /api/workspaces/:name
 * Delete workspace
 */
router.delete('/:name', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params
    const filter = { name, ...getOwnerFilter(req.user) }

    const workspace = await Workspace.findOneAndDelete(filter)
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' })
    }

    res.json({ message: 'Workspace deleted' })
  } catch (error) {
    console.error('Failed to delete workspace:', error)
    res.status(500).json({ message: 'Failed to delete workspace' })
  }
})

export default router
