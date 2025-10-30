import { Router } from 'express'
import { ApplySuggestionBody, SuggestionRequestBody } from '../types/ai.js'
import { applySuggestion, generateSuggestions } from '../services/ai/suggestions.js'

const router = Router()

router.post('/generate', async (req, res) => {
  const parsed = SuggestionRequestBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const result = await generateSuggestions(parsed.data)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate suggestions' })
  }
})

router.post('/apply', async (req, res) => {
  const parsed = ApplySuggestionBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  try {
    const result = await applySuggestion(parsed.data.suggestionId)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to apply suggestion' })
  }
})

export default router
