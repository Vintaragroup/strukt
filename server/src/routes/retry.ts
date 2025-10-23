import { Router, Request, Response } from 'express';
import Workspace from '../models/Workspace.js';
import { GenerationService } from '../services/GenerationService.js';
import { RetryService } from '../services/RetryService.js';
import { CircuitBreaker } from '../services/CircuitBreaker.js';
import GenerationQueue from '../services/GenerationQueue.js';
import mongoose from 'mongoose';

const router = Router();
const retryService = new RetryService();
const circuitBreaker = new CircuitBreaker();

/**
 * POST /api/generation/generate-with-retry
 * Generate with automatic retry on failure
 * Uses exponential backoff: 1s, 2s, 4s, 8s (max 4 retries)
 */
router.post('/generate-with-retry', async (req: Request, res: Response) => {
  try {
    const { workspaceId, userPrompt } = req.body;

    // Validate input
    if (!workspaceId || !userPrompt) {
      return res.status(400).json({
        success: false,
        error: 'workspaceId and userPrompt are required',
      });
    }

    // Fetch workspace
    let workspace;
    try {
      workspace = await Workspace.findById(new mongoose.Types.ObjectId(workspaceId));
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workspaceId format',
      });
    }

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Generate with retry using exponential backoff
    const startTime = Date.now();
    const result = await retryService.retryWithBackoff(
      async () => {
        return await GenerationService.fullGenerationPipeline(workspace, userPrompt, 'gpt-4o');
      },
      4, // max 4 retries
      1000, // 1s initial delay
      8000 // 8s max delay
    );
    const generationTime = (Date.now() - startTime) / 1000;

    res.json({
      success: result.success,
      parsed: result.parsed,
      tokensUsed: result.tokensUsed,
      generationTime: `${generationTime.toFixed(2)}s`,
      retryAttempted: true,
    });
  } catch (error) {
    console.error('Generate with retry error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
      retryExhausted: true,
    });
  }
});

/**
 * POST /api/generation/generate-queued
 * Queue a generation request for async processing
 * Returns immediately with jobId
 */
router.post('/generate-queued', async (req: Request, res: Response) => {
  try {
    const { workspaceId, userPrompt } = req.body;

    // Validate input
    if (!workspaceId || !userPrompt) {
      return res.status(400).json({
        success: false,
        error: 'workspaceId and userPrompt are required',
      });
    }

    // Verify workspace exists
    let workspace;
    try {
      workspace = await Workspace.findById(new mongoose.Types.ObjectId(workspaceId));
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workspaceId format',
      });
    }

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Enqueue generation
    const jobId = await GenerationQueue.enqueue(workspaceId, userPrompt);

    res.json({
      success: true,
      jobId,
      status: 'QUEUED',
      message: 'Generation queued successfully',
    });
  } catch (error) {
    console.error('Queue generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * GET /api/generation/queue/:jobId/status
 * Get status of a queued generation job
 */
router.get('/queue/:jobId/status', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await GenerationQueue.getStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      jobId,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      progress: {
        pending: job.status === 'PENDING',
        processing: job.status === 'PROCESSING',
        completed: job.status === 'COMPLETED',
        failed: job.status === 'FAILED',
      },
      retryCount: job.retryCount,
      error: job.error,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * GET /api/generation/queue/:jobId/result
 * Get result of a completed queued job
 */
router.get('/queue/:jobId/result', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await GenerationQueue.getStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
      return res.status(202).json({
        success: false,
        error: 'Job not yet complete',
        status: job.status,
      });
    }

    if (job.status === 'FAILED') {
      return res.status(400).json({
        success: false,
        error: job.error,
        status: 'FAILED',
      });
    }

    res.json({
      success: true,
      jobId,
      status: job.status,
      result: job.result,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('Get job result error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * GET /api/generation/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', (req: Request, res: Response) => {
  try {
    const stats = GenerationQueue.getStats();
    const circuitBreakerState = circuitBreaker.getState();
    const circuitBreakerStats = circuitBreaker.getStats();

    res.json({
      success: true,
      queue: stats,
      circuitBreaker: circuitBreakerStats,
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
