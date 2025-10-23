import { randomUUID } from 'crypto';
import { GenerationService } from './GenerationService.js';
import Workspace from '../models/Workspace.js';
import mongoose from 'mongoose';

export interface QueuedGeneration {
  id: string;
  workspaceId: string;
  userPrompt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: {
    success: boolean;
    parsed?: {
      nodes: any[];
      edges: any[];
      summary: string;
    };
    tokensUsed?: number;
    generationTime?: number;
  };
  error?: string;
  retryCount: number;
}

/**
 * GenerationQueue manages async generation requests
 * Limits concurrent operations to prevent API overload
 */
export class GenerationQueue {
  private queue: QueuedGeneration[] = [];
  private processing: boolean = false;
  private readonly maxConcurrent: number = 3;
  private activeCount: number = 0;
  private readonly maxRetries: number = 2;

  /**
   * Enqueue a generation request
   */
  async enqueue(workspaceId: string, userPrompt: string): Promise<string> {
    const jobId = randomUUID();

    const queuedGen: QueuedGeneration = {
      id: jobId,
      workspaceId,
      userPrompt,
      status: 'PENDING',
      createdAt: new Date(),
      retryCount: 0,
    };

    this.queue.push(queuedGen);
    console.log(`Queue: Enqueued job ${jobId}, queue size: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue().catch((err) => {
        console.error('Queue processing error:', err);
      });
    }

    return jobId;
  }

  /**
   * Get status of a queued job
   */
  async getStatus(jobId: string): Promise<QueuedGeneration | null> {
    return this.queue.find((job) => job.id === jobId) || null;
  }

  /**
   * Get all results for a workspace
   */
  async getResults(workspaceId: string, limit: number = 50): Promise<QueuedGeneration[]> {
    return this.queue
      .filter((job) => job.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    activeJobs: number;
    totalProcessed: number;
  } {
    return {
      queueSize: this.queue.filter((j) => j.status === 'PENDING').length,
      activeJobs: this.activeCount,
      totalProcessed: this.queue.filter((j) => j.status === 'COMPLETED' || j.status === 'FAILED')
        .length,
    };
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
        // Find next pending job
        const job = this.queue.find((j) => j.status === 'PENDING');
        if (!job) {
          break;
        }

        this.activeCount++;
        this.executeJob(job).finally(() => {
          this.activeCount--;
        });
      }
    } finally {
      this.processing = false;

      // Continue processing if there are more jobs
      if (this.queue.some((j) => j.status === 'PENDING') && this.activeCount < this.maxConcurrent) {
        setTimeout(() => this.processQueue().catch(console.error), 100);
      }
    }
  }

  /**
   * Execute a single job
   */
  private async executeJob(job: QueuedGeneration): Promise<void> {
    try {
      job.status = 'PROCESSING';
      job.startedAt = new Date();

      console.log(`Queue: Processing job ${job.id}`);

      // Fetch workspace
      let workspace;
      try {
        workspace = await Workspace.findById(new mongoose.Types.ObjectId(job.workspaceId));
      } catch (err) {
        throw new Error(`Workspace not found: ${job.workspaceId}`);
      }

      if (!workspace) {
        throw new Error(`Workspace not found: ${job.workspaceId}`);
      }

      // Execute generation
      const startTime = Date.now();
      const result = await GenerationService.fullGenerationPipeline(
        workspace,
        job.userPrompt,
        'gpt-4o'
      );
      const generationTime = (Date.now() - startTime) / 1000;

      // Store result
      job.result = {
        success: result.success,
        parsed: result.parsed
          ? {
              nodes: result.parsed.nodes,
              edges: result.parsed.edges,
              summary: result.parsed.summary || '',
            }
          : undefined,
        tokensUsed: result.tokensUsed.total,
        generationTime,
      };

      job.status = 'COMPLETED';
      job.completedAt = new Date();

      console.log(`Queue: Job ${job.id} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Retry logic
      if (job.retryCount < this.maxRetries) {
        job.retryCount++;
        job.status = 'PENDING'; // Re-queue for retry
        job.error = `${errorMessage} (retry ${job.retryCount}/${this.maxRetries})`;
        console.log(`Queue: Job ${job.id} failed, queued for retry ${job.retryCount}`);
      } else {
        job.status = 'FAILED';
        job.error = errorMessage;
        job.completedAt = new Date();
        console.error(`Queue: Job ${job.id} failed permanently: ${errorMessage}`);
      }
    }
  }

  /**
   * Clear completed jobs older than 1 hour (for memory management)
   */
  clearOldCompleted(): number {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const beforeLength = this.queue.length;

    this.queue = this.queue.filter((job) => {
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        if (job.completedAt && job.completedAt.getTime() < oneHourAgo) {
          return false; // Remove
        }
      }
      return true; // Keep
    });

    const removed = beforeLength - this.queue.length;
    if (removed > 0) {
      console.log(`Queue: Cleared ${removed} old completed jobs`);
    }

    return removed;
  }
}

export default new GenerationQueue();
