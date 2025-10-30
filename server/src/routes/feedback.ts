import { Router } from 'express'
import { FeedbackBody } from '../types/ai.js'
import { recordFeedback } from '../services/ai/feedback.js'

const router = Router()

router.post('/mark', async (req, res) => {
  const parsed = FeedbackBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const result = await recordFeedback(parsed.data)
    res.json({ ok: true, id: result.id, createdAt: result.createdAt })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record feedback' })
  }
})

export default router
