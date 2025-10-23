import { GenerationHistory, IGenerationHistory } from '../models/GenerationHistory.js';
import { WorkspaceVersion, IWorkspaceVersion } from '../models/WorkspaceVersion.js';
import Workspace from '../models/Workspace.js';
import mongoose from 'mongoose';

interface GenerationResult {
  success: boolean;
  parsed?: {
    nodes: any[];
    edges: any[];
    summary: string;
  };
  validation?: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  tokensUsed?: number;
  generationTime?: number;
  modelUsed?: string;
}

interface VersionComparison {
  version1: { number: number; nodeCount: number; edgeCount: number };
  version2: { number: number; nodeCount: number; edgeCount: number };
  changes: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
    summary: string;
  };
}

/**
 * PersistenceService handles all workspace versioning and generation history management
 * Enables users to save, retrieve, restore, and compare workspace versions
 */
export class PersistenceService {
  /**
   * Save a generation result to history and create a workspace version
   */
  async saveGeneration(
    workspaceId: string,
    generationData: GenerationResult,
    userPrompt: string,
    prdTemplateId?: string,
    tags: string[] = [],
    userId: string = 'system'
  ): Promise<{ history: IGenerationHistory; version: IWorkspaceVersion }> {
    try {
      const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

      // Create generation history record
      const history = new GenerationHistory({
        workspaceId: workspaceObjectId,
        userId,
        prdTemplateId: prdTemplateId ? new mongoose.Types.ObjectId(prdTemplateId) : undefined,
        userPrompt,
        generatedContent: {
          nodes: generationData.parsed?.nodes || [],
          edges: generationData.parsed?.edges || [],
          summary: generationData.parsed?.summary || '',
        },
        tokensUsed: generationData.tokensUsed || 0,
        generationTime: generationData.generationTime || 0,
        modelUsed: generationData.modelUsed || 'gpt-4o',
        status: generationData.success ? 'success' : 'failed',
        validationResult: generationData.validation,
        tags,
      });

      await history.save();

      // Get next version number
      const lastVersion = await WorkspaceVersion.findOne({ workspaceId: workspaceObjectId })
        .sort({ versionNumber: -1 })
        .lean();

      const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

      // Create version snapshot
      const version = new WorkspaceVersion({
        workspaceId: workspaceObjectId,
        versionNumber: nextVersionNumber,
        nodes: generationData.parsed?.nodes || [],
        edges: generationData.parsed?.edges || [],
        summary: generationData.parsed?.summary || '',
        generationHistoryId: history._id,
        label: `v${nextVersionNumber} - ${new Date().toLocaleString()}`,
        isActive: true,
      });

      await version.save();

      // Set previous versions to inactive (only one active at a time)
      await WorkspaceVersion.updateMany(
        { workspaceId: workspaceObjectId, _id: { $ne: version._id } },
        { isActive: false }
      );

      return { history, version };
    } catch (error) {
      console.error('Error saving generation:', error);
      throw new Error(`Failed to save generation: ${(error as Error).message}`);
    }
  }

  /**
   * Get generation history for a workspace
   */
  async getGenerationHistory(
    workspaceId: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: 'date' | 'tokens' | 'status' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ total: number; generations: any[] }> {
    try {
      const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

      // Build sort object
      let sortObj: any = {};
      if (sortBy === 'date') {
        sortObj.createdAt = order === 'asc' ? 1 : -1;
      } else if (sortBy === 'tokens') {
        sortObj.tokensUsed = order === 'asc' ? 1 : -1;
      } else if (sortBy === 'status') {
        sortObj.status = order === 'asc' ? 1 : -1;
        sortObj.createdAt = -1;
      }

      const total = await GenerationHistory.countDocuments({ workspaceId: workspaceObjectId });

      const generations = await GenerationHistory.find({ workspaceId: workspaceObjectId })
        .sort(sortObj)
        .skip(offset)
        .limit(limit)
        .populate('prdTemplateId', 'name category')
        .lean();

      return {
        total,
        generations: generations.map((g: any) => ({
          id: g._id,
          userPrompt: g.userPrompt,
          prdTemplate: g.prdTemplateId?.name || 'None',
          status: g.status,
          tokensUsed: g.tokensUsed,
          generatedAt: g.createdAt,
          versionNumber: this.getVersionNumberFromHistory(g._id), // Will implement helper
          tags: g.tags,
          nodeCount: g.generatedContent?.nodes?.length || 0,
          edgeCount: g.generatedContent?.edges?.length || 0,
        })),
      };
    } catch (error) {
      console.error('Error getting generation history:', error);
      throw new Error(`Failed to get generation history: ${(error as Error).message}`);
    }
  }

  /**
   * Get all versions of a workspace
   */
  async getVersions(
    workspaceId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ totalVersions: number; activeVersion: number; versions: any[] }> {
    try {
      const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

      const totalVersions = await WorkspaceVersion.countDocuments({
        workspaceId: workspaceObjectId,
      });

      const activeVersion = await WorkspaceVersion.findOne({
        workspaceId: workspaceObjectId,
        isActive: true,
      })
        .select('versionNumber')
        .lean();

      const versions = await WorkspaceVersion.find({ workspaceId: workspaceObjectId })
        .sort({ versionNumber: -1 })
        .skip(offset)
        .limit(limit)
        .select(
          'versionNumber label isActive nodeCount edgeCount createdAt generationHistoryId nodes edges'
        )
        .lean();

      return {
        totalVersions,
        activeVersion: activeVersion?.versionNumber || 0,
        versions: versions.map((v: any) => ({
          versionId: (v as any)._id,
          versionNumber: v.versionNumber,
          label: v.label,
          nodeCount: Array.isArray(v.nodes) ? v.nodes.length : 0,
          edgeCount: Array.isArray(v.edges) ? v.edges.length : 0,
          isActive: v.isActive,
          createdAt: v.createdAt,
          generationId: v.generationHistoryId,
        })),
      };
    } catch (error) {
      console.error('Error getting versions:', error);
      throw new Error(`Failed to get versions: ${(error as Error).message}`);
    }
  }

  /**
   * Restore a workspace to a previous version
   */
  async restoreVersion(
    workspaceId: string,
    versionId: string,
    createNewVersion: boolean = true
  ): Promise<{ success: boolean; message: string; restoredContent: any; newVersionNumber?: number }> {
    try {
      const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
      const versionObjectId = new mongoose.Types.ObjectId(versionId);

      // Get the version to restore
      const versionToRestore = await WorkspaceVersion.findById(versionObjectId);
      if (!versionToRestore) {
        throw new Error('Version not found');
      }

      if (versionToRestore.workspaceId.toString() !== workspaceId) {
        throw new Error('Version does not belong to this workspace');
      }

      if (!createNewVersion) {
        // Just make this version active
        await WorkspaceVersion.updateMany(
          { workspaceId: workspaceObjectId },
          { isActive: false }
        );

        await WorkspaceVersion.updateOne({ _id: versionObjectId }, { isActive: true });

        return {
          success: true,
          message: 'Version restored successfully',
          restoredContent: {
            nodes: versionToRestore.nodes,
            edges: versionToRestore.edges,
            summary: versionToRestore.summary,
          },
        };
      } else {
        // Create new version as a copy of the restored version
        const lastVersion = await WorkspaceVersion.findOne({ workspaceId: workspaceObjectId })
          .sort({ versionNumber: -1 })
          .lean();

        const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

        const newVersion = new WorkspaceVersion({
          workspaceId: workspaceObjectId,
          versionNumber: nextVersionNumber,
          nodes: versionToRestore.nodes,
          edges: versionToRestore.edges,
          summary: versionToRestore.summary,
          generationHistoryId: versionToRestore.generationHistoryId,
          label: `v${nextVersionNumber} - Restored from v${versionToRestore.versionNumber}`,
          isActive: true,
        });

        await newVersion.save();

        // Set previous versions to inactive
        await WorkspaceVersion.updateMany(
          { workspaceId: workspaceObjectId, _id: { $ne: newVersion._id } },
          { isActive: false }
        );

        return {
          success: true,
          message: 'New version created from restoration',
          restoredContent: {
            nodes: newVersion.nodes,
            edges: newVersion.edges,
            summary: newVersion.summary,
          },
          newVersionNumber: nextVersionNumber,
        };
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      throw new Error(`Failed to restore version: ${(error as Error).message}`);
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionComparison> {
    try {
      const v1 = await WorkspaceVersion.findById(versionId1);
      const v2 = await WorkspaceVersion.findById(versionId2);

      if (!v1 || !v2) {
        throw new Error('One or both versions not found');
      }

      // Simple node and edge comparison
      const nodes1 = new Set((v1.nodes || []).map((n: any) => n.id));
      const nodes2 = new Set((v2.nodes || []).map((n: any) => n.id));

      const nodesAdded = Array.from(nodes2).filter((id) => !nodes1.has(id)).length;
      const nodesRemoved = Array.from(nodes1).filter((id) => !nodes2.has(id)).length;

      // Calculate modified nodes (same id but different properties)
      let nodesModified = 0;
      const v1Map = new Map((v1.nodes || []).map((n: any) => [n.id, n]));
      const v2Map = new Map((v2.nodes || []).map((n: any) => [n.id, n]));

      for (const id of Array.from(nodes1).filter((id) => nodes2.has(id))) {
        if (JSON.stringify(v1Map.get(id)) !== JSON.stringify(v2Map.get(id))) {
          nodesModified++;
        }
      }

      // Edge comparison
      const edges1 = new Set((v1.edges || []).map((e: any) => `${e.source}-${e.target}`));
      const edges2 = new Set((v2.edges || []).map((e: any) => `${e.source}-${e.target}`));

      const edgesAdded = Array.from(edges2).filter((id) => !edges1.has(id)).length;
      const edgesRemoved = Array.from(edges1).filter((id) => !edges2.has(id)).length;

      const changeSummary = [
        nodesAdded > 0 ? `Added ${nodesAdded} node(s)` : null,
        nodesRemoved > 0 ? `Removed ${nodesRemoved} node(s)` : null,
        nodesModified > 0 ? `Modified ${nodesModified} node(s)` : null,
        edgesAdded > 0 ? `Added ${edgesAdded} edge(s)` : null,
        edgesRemoved > 0 ? `Removed ${edgesRemoved} edge(s)` : null,
      ]
        .filter((s) => s !== null)
        .join(', ');

      return {
        version1: {
          number: v1.versionNumber,
          nodeCount: (v1.nodes || []).length,
          edgeCount: (v1.edges || []).length,
        },
        version2: {
          number: v2.versionNumber,
          nodeCount: (v2.nodes || []).length,
          edgeCount: (v2.edges || []).length,
        },
        changes: {
          nodesAdded,
          nodesRemoved,
          nodesModified,
          edgesAdded,
          edgesRemoved,
          summary: changeSummary || 'No changes detected',
        },
      };
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw new Error(`Failed to compare versions: ${(error as Error).message}`);
    }
  }

  /**
   * Get version number from generation history ID (helper)
   */
  private getVersionNumberFromHistory(historyId: any): number {
    // This would need actual implementation by querying WorkspaceVersion
    // For now, returning 0 as placeholder - will be populated in actual usage
    return 0;
  }

  /**
   * Delete old generations (soft delete - archive)
   */
  async archiveOldGenerations(
    workspaceId: string,
    daysOld: number = 30
  ): Promise<{ archived: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

      // Mark as archived (soft delete)
      const result = await GenerationHistory.updateMany(
        {
          workspaceId: workspaceObjectId,
          createdAt: { $lt: cutoffDate },
        },
        {
          $set: { tags: { $push: 'archived' } },
        }
      );

      return { archived: result.modifiedCount };
    } catch (error) {
      console.error('Error archiving generations:', error);
      throw new Error(`Failed to archive generations: ${(error as Error).message}`);
    }
  }

  /**
   * Get statistics for a workspace
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    totalGenerations: number;
    totalVersions: number;
    successfulGenerations: number;
    failedGenerations: number;
    totalTokensUsed: number;
    averageTokensPerGeneration: number;
    averageGenerationTime: number;
  }> {
    try {
      const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

      const historyStats = await GenerationHistory.aggregate([
        { $match: { workspaceId: workspaceObjectId } },
        {
          $group: {
            _id: null,
            totalGenerations: { $sum: 1 },
            successfulGenerations: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
            },
            failedGenerations: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
            totalTokensUsed: { $sum: '$tokensUsed' },
            avgTokens: { $avg: '$tokensUsed' },
            avgGenerationTime: { $avg: '$generationTime' },
          },
        },
      ]);

      const versionCount = await WorkspaceVersion.countDocuments({
        workspaceId: workspaceObjectId,
      });

      const stats = historyStats[0] || {
        totalGenerations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        totalTokensUsed: 0,
        avgTokens: 0,
        avgGenerationTime: 0,
      };

      return {
        totalGenerations: stats.totalGenerations,
        totalVersions: versionCount,
        successfulGenerations: stats.successfulGenerations,
        failedGenerations: stats.failedGenerations,
        totalTokensUsed: stats.totalTokensUsed,
        averageTokensPerGeneration: Math.round(stats.avgTokens),
        averageGenerationTime: Math.round(stats.avgGenerationTime * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting workspace stats:', error);
      throw new Error(`Failed to get workspace stats: ${(error as Error).message}`);
    }
  }
}

export default new PersistenceService();
