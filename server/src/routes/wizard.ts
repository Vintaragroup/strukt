import { Router } from 'express'
import { ContinueWizardBody, StartWizardBody } from '../types/ai.js'
import { continueWizardSession, startWizardSession } from '../services/ai/wizard.js'

const router = Router()

router.post('/start', async (req, res) => {
  const parsed = StartWizardBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const result = await startWizardSession(parsed.data)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start wizard session' })
  }
})

router.post('/continue', async (req, res) => {
  const parsed = ContinueWizardBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const result = await continueWizardSession(parsed.data)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to continue wizard session' })
  }
})

export default router
