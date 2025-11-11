/**
 * useFoundationEdgesIntegration
 * 
 * Hook that automatically processes foundation nodes and generates missing edges
 * whenever nodes/edges are loaded or changed.
 */

import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { processFoundationEdges, formatEdgeReport } from '@/config/foundationEdges';

export interface FoundationEdgesIntegrationResult {
  nodes: Node[];
  edges: Edge[];
  report: string;
}

/**
 * Processes foundation nodes and returns updated nodes/edges with automatic
 * intermediate node generation and edge connections
 */
export function useFoundationEdgesIntegration() {
  const processNodes = useCallback(
    (nodes: Node[], edges: Edge[]): FoundationEdgesIntegrationResult => {
      try {
        // Check if there are any foundation nodes (ring 3 or higher)
        const foundationNodes = nodes.filter(n => {
          const ring = (n.data as any)?.ring;
          return ring && ring >= 3;
        });

        if (foundationNodes.length === 0) {
          // No foundation nodes, return as-is
          return {
            nodes,
            edges,
            report: '✅ No foundation nodes detected - no processing needed',
          };
        }

        // Process foundation edges
        const result = processFoundationEdges(nodes, edges);

        // Merge new nodes and edges with existing ones
        const updatedNodes = [...nodes, ...result.nodesToCreate];
        const updatedEdges = [...edges, ...result.edgesToCreate];
        const formattedReport = formatEdgeReport(result.report);

        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          report: formattedReport,
        };
      } catch (error) {
        console.error('[Foundation Edges Integration] Error processing foundation edges:', error);
        // Return original nodes/edges on error
        return {
          nodes,
          edges,
          report: `⚠️ Error processing foundation edges: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
    []
  );

  return { processNodes };
}

