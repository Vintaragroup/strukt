import express, { Router, Request, Response } from 'express';
import PersistenceService from '../services/PersistenceService.js';
import { GenerationService } from '../services/GenerationService.js';
import Workspace from '../models/Workspace.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * POST /api/workspaces/:id/generate-and-save
 * Generate new workspace content and automatically save as version
 */
router.post('/:id/generate-and-save', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.id;
    const { userPrompt, tags = [] } = req.body;

    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        error: 'userPrompt is required',
      });
    }

    // Fetch workspace
    let workspace;
    try {
      workspace = await Workspace.findById(new mongoose.Types.ObjectId(workspaceId));
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workspace ID',
      });
    }

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
      });
    }

    // Generate using full pipeline
    const startTime = Date.now();
    const generationData = await GenerationService.fullGenerationPipeline(
      workspace,
      userPrompt,
      'gpt-4o'
    );
    const generationTime = (Date.now() - startTime) / 1000;

    if (!generationData.success) {
      return res.status(400).json({
        success: false,
        error: 'Generation failed',
        details: generationData.error,
      });
    }

    // Transform response to match PersistenceService expectations
    const transformedData = {
      success: generationData.success,
      parsed: {
        nodes: generationData.parsed?.nodes || [],
        edges: generationData.parsed?.edges || [],
        summary: generationData.parsed?.summary || 'Generated content',
      },
      validation: {
        isValid: generationData.validation.valid,
        errors: generationData.validation.errors,
      },
      tokensUsed: generationData.tokensUsed.total,
      generationTime,
      modelUsed: 'gpt-4o',
    };

    // Save to history and create version
    const { history, version } = await PersistenceService.saveGeneration(
      workspaceId,
      transformedData,
      userPrompt,
      undefined,
      tags,
      req.body.userId || 'system'
    );

    res.json({
      success: true,
      workspaceId,
      generationId: history._id,
      versionId: version._id,
      versionNumber: version.versionNumber,
      generated: {
        nodes: version.nodes,
        edges: version.edges,
        summary: version.summary,
      },
      tokensUsed: history.tokensUsed,
      generationTime: history.generationTime,
      savedAt: history.createdAt,
    });
  } catch (error) {
    console.error('Error in generate-and-save:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/workspaces/:id/generation-history
 * Retrieve generation history for a workspace
 */
router.get('/:id/generation-history', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const sortBy = (req.query.sortBy as 'date' | 'tokens' | 'status') || 'date';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';

    const result = await PersistenceService.getGenerationHistory(
      workspaceId,
      limit,
      offset,
      sortBy,
      order
    );

    res.json({
      success: true,
      workspaceId,
      total: result.total,
      limit,
      offset,
      generations: result.generations,
    });
  } catch (error) {
    console.error('Error getting generation history:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/workspaces/:id/versions
 * Get all versions of a workspace
 */
router.get('/:id/versions', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await PersistenceService.getVersions(workspaceId, limit, offset);

    res.json({
      success: true,
      workspaceId,
      totalVersions: result.totalVersions,
      activeVersion: result.activeVersion,
      limit,
      offset,
      versions: result.versions,
    });
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/workspaces/:id/versions/:versionId/restore
 * Restore a workspace to a previous version
 */
router.post('/:id/versions/:versionId/restore', async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, versionId } = req.params;
    const { createNewVersion = true } = req.body;

    const result = await PersistenceService.restoreVersion(workspaceId, versionId, createNewVersion);

    res.json({
      success: result.success,
      message: result.message,
      workspaceId,
      restoredVersionId: versionId,
      newVersionNumber: result.newVersionNumber,
      content: result.restoredContent,
      restoredAt: new Date(),
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/workspaces/:id/versions/:versionId/compare
 * Compare two versions
 */
router.post('/:id/versions/:versionId/compare', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const { compareWithVersionId } = req.body;

    if (!compareWithVersionId) {
      return res.status(400).json({
        success: false,
        error: 'compareWithVersionId is required',
      });
    }

    const comparison = await PersistenceService.compareVersions(versionId, compareWithVersionId);

    res.json({
      success: true,
      version1: comparison.version1,
      version2: comparison.version2,
      changes: comparison.changes,
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/workspaces/:id/stats
 * Get workspace generation statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.id;

    const stats = await PersistenceService.getWorkspaceStats(workspaceId);

    res.json({
      success: true,
      workspaceId,
      stats,
    });
  } catch (error) {
    console.error('Error getting workspace stats:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
