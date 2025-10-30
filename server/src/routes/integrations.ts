import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { buildSpecSummary, serialiseSpecSummary } from '../services/specs/SpecSummaryService.js'
import { cacheSpecSummary, getCachedSpecSummary, invalidateSpecSummaries } from '../services/specs/specCache.js'

const router = Router()

const MAX_SPEC_SIZE_BYTES = 1.5 * 1024 * 1024 // 1.5MB once stringified

const SpecUploadSchema = z.object({
  workspaceId: z.string().min(1),
  specType: z.enum(['openapi', 'postman']),
  spec: z.unknown(),
  maxOperations: z.number().int().positive().max(50).optional(),
  ttlSeconds: z.number().int().positive().max(3600).optional(),
})

const SpecLookupSchema = z.object({
  referenceId: z.string().min(10),
})

router.post('/spec/preview', async (req: Request, res: Response) => {
  try {
    const payload = SpecUploadSchema.parse(req.body)

    const serializedLength = Buffer.byteLength(JSON.stringify(payload.spec))
    if (serializedLength > MAX_SPEC_SIZE_BYTES) {
      return res.status(413).json({
        message: `Spec too large. Received ${serializedLength} bytes, limit is ${MAX_SPEC_SIZE_BYTES}.`,
      })
    }

    const summary = buildSpecSummary({
      specType: payload.specType,
      spec: payload.spec,
      maxOperations: payload.maxOperations,
    })

    const ttlMs = (payload.ttlSeconds ?? 300) * 1000
    const referenceId = cacheSpecSummary({
      workspaceId: payload.workspaceId,
      summary,
      ttlMs,
    })

    res.json({
      referenceId,
      summary,
      promptFragment: serialiseSpecSummary(summary),
      expiresInSeconds: ttlMs / 1000,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid spec payload',
        issues: error.issues,
      })
    }
    console.error('Spec preview error:', error)
    return res.status(500).json({ message: 'Failed to process spec' })
  }
})

router.post('/spec/discard', (req: Request, res: Response) => {
  try {
    const { workspaceId } = z
      .object({ workspaceId: z.string().min(1) })
      .parse(req.body)
    invalidateSpecSummaries(workspaceId)
    res.json({ status: 'cleared' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid discard payload',
        issues: error.issues,
      })
    }
    console.error('Spec discard error:', error)
    return res.status(500).json({ message: 'Failed to discard spec cache' })
  }
})

router.get('/spec/:referenceId', (req: Request, res: Response) => {
  try {
    const { referenceId } = SpecLookupSchema.parse(req.params)
    const summary = getCachedSpecSummary(referenceId)
    if (!summary) {
      return res.status(404).json({ message: 'Spec summary expired or not found' })
    }
    res.json({
      referenceId,
      summary,
      promptFragment: serialiseSpecSummary(summary),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid spec reference',
        issues: error.issues,
      })
    }
    console.error('Spec lookup error:', error)
    return res.status(500).json({ message: 'Failed to retrieve spec summary' })
  }
})

export default router
