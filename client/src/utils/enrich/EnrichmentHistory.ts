import { GeneratedContent } from "./MockAIGenerator";

export interface EnrichmentHistoryEntry {
  nodeId: string;
  timestamp: number;
  content: GeneratedContent;
}

/**
 * Manages enrichment history (last 3 generations per node)
 */
export class EnrichmentHistory {
  private history: Map<string, EnrichmentHistoryEntry[]> = new Map();
  private readonly MAX_ENTRIES = 3;

  /**
   * Add a new generation to history
   */
  add(nodeId: string, content: GeneratedContent): void {
    const nodeHistory = this.history.get(nodeId) || [];
    
    // Add new entry at the beginning
    nodeHistory.unshift({
      nodeId,
      timestamp: content.timestamp,
      content,
    });

    // Keep only last 3 entries
    if (nodeHistory.length > this.MAX_ENTRIES) {
      nodeHistory.pop();
    }

    this.history.set(nodeId, nodeHistory);
  }

  /**
   * Get history for a specific node
   */
  get(nodeId: string): EnrichmentHistoryEntry[] {
    return this.history.get(nodeId) || [];
  }

  /**
   * Get the most recent generation for a node
   */
  getLatest(nodeId: string): EnrichmentHistoryEntry | null {
    const nodeHistory = this.history.get(nodeId);
    return nodeHistory && nodeHistory.length > 0 ? nodeHistory[0] : null;
  }

  /**
   * Clear history for a specific node
   */
  clear(nodeId: string): void {
    this.history.delete(nodeId);
  }

  /**
   * Clear all history
   */
  clearAll(): void {
    this.history.clear();
  }

  /**
   * Get count of generations for a node
   */
  getCount(nodeId: string): number {
    return this.history.get(nodeId)?.length || 0;
  }
}

export const enrichmentHistory = new EnrichmentHistory();
