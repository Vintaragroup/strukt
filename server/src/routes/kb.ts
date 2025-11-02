import { Router, Request, Response } from 'express'
import { kbService } from '../services/KBService.js'
import path from 'node:path'

const router = Router()

// GET /api/kb/health — lightweight health with kb_version and item count
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const catalog = await kbService.loadCatalog()
    res.json({ success: true, status: 'ok', kb_version: catalog.kb_version, items: catalog.items?.length || 0 })
  } catch (e) {
    res.status(500).json({ success: false, status: 'error', error: (e as Error).message })
  }
})

// GET /api/kb/catalog — return the KB catalog.json
router.get('/catalog', async (_req: Request, res: Response) => {
  try {
    const catalog = await kbService.loadCatalog()
    res.json({ success: true, data: catalog })
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

// POST /api/kb/compose — deterministic composition by filters
router.post('/compose', async (req: Request, res: Response) => {
  try {
    const { node_types, domains, tags, limit } = req.body || {}

    if (
      (node_types && !Array.isArray(node_types)) ||
      (domains && !Array.isArray(domains)) ||
      (tags && !Array.isArray(tags))
    ) {
      return res.status(400).json({ success: false, error: 'node_types, domains, and tags must be arrays' })
    }

    const result = await kbService.compose({
      node_types: node_types || [],
      domains: domains || [],
      tags: tags || [],
      limit: typeof limit === 'number' ? limit : undefined,
    })

    res.json({ success: true, data: result })
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

export default router
