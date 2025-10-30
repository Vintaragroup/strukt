// @ts-nocheck
import { Node, Edge, getNodesBounds, getViewportForBounds } from '@xyflow/react';

const CENTER_ID_FALLBACKS = new Set(['center', 'center-node']);

function isCenterNode(node: Node | null | undefined): boolean {
  if (!node) return false;
  return node.type === 'center' || CENTER_ID_FALLBACKS.has(node.id);
}
import { toPng, toSvg } from 'html-to-image';

export interface ExportOptions {
  fileName?: string;
  backgroundColor?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/**
 * Export the React Flow canvas as a PNG image
 */
export async function exportToPNG(
  nodesBounds: ReturnType<typeof getNodesBounds>,
  transform: [number, number, number],
  options: ExportOptions = {}
): Promise<void> {
  const {
    fileName = 'flowforge-canvas.png',
    backgroundColor = '#ffffff',
    imageWidth = 1920,
    imageHeight = 1080,
  } = options;

  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewport) {
    throw new Error('Could not find React Flow viewport');
  }

  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw error;
  }
}

/**
 * Export the React Flow canvas as an SVG image
 */
export async function exportToSVG(
  nodesBounds: ReturnType<typeof getNodesBounds>,
  transform: [number, number, number],
  options: ExportOptions = {}
): Promise<void> {
  const {
    fileName = 'flowforge-canvas.svg',
    backgroundColor = '#ffffff',
    imageWidth = 1920,
    imageHeight = 1080,
  } = options;

  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewport) {
    throw new Error('Could not find React Flow viewport');
  }

  try {
    const dataUrl = await toSvg(viewport, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export SVG:', error);
    throw error;
  }
}

/**
 * Generate markdown documentation from nodes
 */
export function exportToMarkdown(
  nodes: Node[],
  edges: Edge[],
  workspaceName: string = 'My Workspace'
): string {
  let markdown = `# ${workspaceName}\n\n`;
  markdown += `*Generated from FlowForge on ${new Date().toLocaleDateString()}*\n\n`;
  markdown += `---\n\n`;

  // Find the center node
  const centerNode = nodes.find(n => n.type === 'center');
  if (centerNode) {
    markdown += `## ${centerNode.data.label}\n\n`;
    if (centerNode.data.description) {
      markdown += `${centerNode.data.description}\n\n`;
    }
    if (centerNode.data.link) {
      markdown += `🔗 [Link](${centerNode.data.link})\n\n`;
    }
    markdown += `---\n\n`;
  }

  // Group nodes by type
  const nodesByType: Record<string, Node[]> = {
    frontend: [],
    backend: [],
    requirement: [],
    doc: [],
    root: [],
  };

  nodes.forEach(node => {
    if (node.type === 'custom' && node.data.type) {
      const type = node.data.type;
      if (nodesByType[type]) {
        nodesByType[type].push(node);
      }
    }
  });

  // Export each type
  const typeNames: Record<string, string> = {
    root: 'Core Features',
    frontend: 'Frontend Components',
    backend: 'Backend Services',
    requirement: 'Requirements',
    doc: 'Documentation',
  };

  Object.entries(nodesByType).forEach(([type, typeNodes]) => {
    if (typeNodes.length === 0) return;

    markdown += `## ${typeNames[type]}\n\n`;

    typeNodes.forEach(node => {
      markdown += `### ${node.data.label}\n\n`;

      if (node.data.summary) {
        markdown += `${node.data.summary}\n\n`;
      }

      if (node.data.tags && node.data.tags.length > 0) {
        markdown += `**Tags:** ${node.data.tags.map((tag: string) => `\`${tag}\``).join(', ')}\n\n`;
      }

      // Export cards if present
      if (node.data.cards && node.data.cards.length > 0) {
        node.data.cards.forEach((card: any) => {
          markdown += `#### ${card.title}\n\n`;

          if (card.type === 'text' && card.content) {
            markdown += `${card.content}\n\n`;
          }

          if (card.type === 'todo' && card.todos && card.todos.length > 0) {
            card.todos.forEach((todo: any) => {
              const checkbox = todo.completed ? '[x]' : '[ ]';
              markdown += `- ${checkbox} ${todo.text}\n`;
            });
            markdown += `\n`;
          }
        });
      }

      // Find connected nodes
      const connectedEdges = edges.filter(
        e => e.source === node.id || e.target === node.id
      );

      if (connectedEdges.length > 0) {
        markdown += `**Connected to:**\n`;
        connectedEdges.forEach(edge => {
          const connectedNodeId = edge.source === node.id ? edge.target : edge.source;
          const connectedNode = nodes.find(n => n.id === connectedNodeId);
          if (connectedNode && !isCenterNode(connectedNode)) {
            markdown += `- ${connectedNode.data.label}\n`;
          }
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    });
  });

  return markdown;
}

/**
 * Download markdown as a file
 */
export function downloadMarkdown(content: string, fileName: string = 'flowforge-documentation.md'): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export individual node data as JSON
 */
export function exportNodeAsJSON(node: Node, edges: Edge[]): void {
  // Find connected nodes
  const connectedEdges = edges.filter(
    e => e.source === node.id || e.target === node.id
  );

  const nodeData = {
    id: node.id,
    type: node.type,
    label: node.data.label,
    nodeType: node.data.type,
    summary: node.data.summary || '',
    tags: node.data.tags || [],
    cards: node.data.cards || [],
    position: node.position,
    connections: connectedEdges.map(edge => ({
      connectedNodeId: edge.source === node.id ? edge.target : edge.source,
      direction: edge.source === node.id ? 'outgoing' : 'incoming',
      edgeId: edge.id,
    })),
    exportedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(nodeData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${node.data.label.replace(/\s+/g, '-').toLowerCase()}-data.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export individual node data as Markdown
 */
export function exportNodeAsMarkdown(node: Node, edges: Edge[], allNodes: Node[]): void {
  let markdown = `# ${node.data.label}\n\n`;
  markdown += `*Exported from FlowForge on ${new Date().toLocaleDateString()}*\n\n`;
  markdown += `---\n\n`;

  // Node type
  if (node.data.type) {
    markdown += `**Type:** ${node.data.type.charAt(0).toUpperCase() + node.data.type.slice(1)}\n\n`;
  }

  // Summary
  if (node.data.summary) {
    markdown += `## Summary\n\n${node.data.summary}\n\n`;
  }

  // Tags
  if (node.data.tags && node.data.tags.length > 0) {
    markdown += `**Tags:** ${node.data.tags.map((tag: string) => `\`${tag}\``).join(', ')}\n\n`;
  }

  // Cards
  if (node.data.cards && node.data.cards.length > 0) {
    markdown += `## Details\n\n`;
    node.data.cards.forEach((card: any) => {
      markdown += `### ${card.title}\n\n`;

      if (card.type === 'text' && card.content) {
        markdown += `${card.content}\n\n`;
      }

      if (card.type === 'todo' && card.todos && card.todos.length > 0) {
        card.todos.forEach((todo: any) => {
          const checkbox = todo.completed ? '[x]' : '[ ]';
          markdown += `- ${checkbox} ${todo.text}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // Connected nodes
  const connectedEdges = edges.filter(
    e => e.source === node.id || e.target === node.id
  );

  if (connectedEdges.length > 0) {
    markdown += `## Connections\n\n`;
    
    const outgoing = connectedEdges.filter(e => e.source === node.id);
    const incoming = connectedEdges.filter(e => e.target === node.id);
    
    if (outgoing.length > 0) {
      markdown += `**Outgoing:**\n`;
      outgoing.forEach(edge => {
        const connectedNode = allNodes.find(n => n.id === edge.target);
        if (connectedNode) {
          markdown += `- ${connectedNode.data.label}\n`;
        }
      });
      markdown += `\n`;
    }
    
    if (incoming.length > 0) {
      markdown += `**Incoming:**\n`;
      incoming.forEach(edge => {
        const connectedNode = allNodes.find(n => n.id === edge.source);
        if (connectedNode) {
          markdown += `- ${connectedNode.data.label}\n`;
        }
      });
      markdown += `\n`;
    }
  }

  markdown += `---\n\n`;
  markdown += `*Position: (${Math.round(node.position.x)}, ${Math.round(node.position.y)})*\n`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${node.data.label.replace(/\s+/g, '-').toLowerCase()}.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Copy node data to clipboard as formatted text
 */
export async function copyNodeToClipboard(node: Node, edges: Edge[], allNodes: Node[]): Promise<void> {
  let text = `${node.data.label}\n`;
  text += `Type: ${node.data.type}\n`;
  
  if (node.data.summary) {
    text += `\n${node.data.summary}\n`;
  }
  
  if (node.data.tags && node.data.tags.length > 0) {
    text += `\nTags: ${node.data.tags.join(', ')}\n`;
  }
  
  // Cards
  if (node.data.cards && node.data.cards.length > 0) {
    text += `\nDetails:\n`;
    node.data.cards.forEach((card: any) => {
      text += `\n${card.title}\n`;
      if (card.type === 'text' && card.content) {
        text += `${card.content}\n`;
      }
      if (card.type === 'todo' && card.todos) {
        card.todos.forEach((todo: any) => {
          text += `${todo.completed ? '✓' : '○'} ${todo.text}\n`;
        });
      }
    });
  }
  
  // Connections
  const connectedEdges = edges.filter(
    e => e.source === node.id || e.target === node.id
  );
  
  if (connectedEdges.length > 0) {
    text += `\nConnected to: `;
    const connections = connectedEdges.map(edge => {
      const connectedNodeId = edge.source === node.id ? edge.target : edge.source;
      const connectedNode = allNodes.find(n => n.id === connectedNodeId);
      return connectedNode ? connectedNode.data.label : 'Unknown';
    });
    text += connections.join(', ');
  }

  await navigator.clipboard.writeText(text);
}

/**
 * Export multiple nodes as JSON (batch export)
 */
export function exportBatchAsJSON(nodes: Node[], edges: Edge[]): void {
  const nodesData = nodes.map(node => {
    const connectedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );

    return {
      id: node.id,
      type: node.type,
      label: node.data.label,
      nodeType: node.data.type,
      summary: node.data.summary || '',
      tags: node.data.tags || [],
      cards: node.data.cards || [],
      position: node.position,
      connections: connectedEdges.map(edge => ({
        connectedNodeId: edge.source === node.id ? edge.target : edge.source,
        direction: edge.source === node.id ? 'outgoing' : 'incoming',
        edgeId: edge.id,
      })),
    };
  });

  const exportData = {
    exportType: 'batch',
    nodeCount: nodes.length,
    exportedAt: new Date().toISOString(),
    nodes: nodesData,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `flowforge-batch-${nodes.length}-nodes.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export multiple nodes as Markdown (batch export)
 */
export function exportBatchAsMarkdown(nodes: Node[], edges: Edge[], allNodes: Node[]): void {
  let markdown = `# FlowForge Batch Export\n\n`;
  markdown += `*Exported ${nodes.length} nodes on ${new Date().toLocaleDateString()}*\n\n`;
  markdown += `---\n\n`;

  nodes.forEach((node, index) => {
    markdown += `## ${index + 1}. ${node.data.label}\n\n`;
    
    if (node.data.type) {
      markdown += `**Type:** ${node.data.type.charAt(0).toUpperCase() + node.data.type.slice(1)}\n\n`;
    }

    if (node.data.summary) {
      markdown += `${node.data.summary}\n\n`;
    }

    if (node.data.tags && node.data.tags.length > 0) {
      markdown += `**Tags:** ${node.data.tags.map((tag: string) => `\`${tag}\``).join(', ')}\n\n`;
    }

    if (node.data.cards && node.data.cards.length > 0) {
      markdown += `**Details:**\n\n`;
      node.data.cards.forEach((card: any) => {
        markdown += `- **${card.title}**\n`;
        if (card.type === 'text' && card.content) {
          markdown += `  ${card.content}\n`;
        }
        if (card.type === 'todo' && card.todos && card.todos.length > 0) {
          card.todos.forEach((todo: any) => {
            const checkbox = todo.completed ? '[x]' : '[ ]';
            markdown += `  - ${checkbox} ${todo.text}\n`;
          });
        }
      });
      markdown += `\n`;
    }

    const connectedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );

    if (connectedEdges.length > 0) {
      const connections = connectedEdges.map(edge => {
        const connectedNodeId = edge.source === node.id ? edge.target : edge.source;
        const connectedNode = allNodes.find(n => n.id === connectedNodeId);
        return connectedNode ? connectedNode.data.label : 'Unknown';
      });
      markdown += `**Connected to:** ${connections.join(', ')}\n\n`;
    }

    markdown += `---\n\n`;
  });

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `flowforge-batch-${nodes.length}-nodes.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export node with its connected subgraph
 */
export function exportSubgraphAsJSON(rootNode: Node, edges: Edge[], allNodes: Node[]): void {
  // Find all connected nodes (BFS traversal)
  const visited = new Set<string>();
  const queue: string[] = [rootNode.id];
  const subgraphNodeIds = new Set<string>();
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    subgraphNodeIds.add(currentId);
    
    // Find connected nodes
    const connectedEdges = edges.filter(
      e => e.source === currentId || e.target === currentId
    );
    
    connectedEdges.forEach(edge => {
      const connectedId = edge.source === currentId ? edge.target : edge.source;
      if (!visited.has(connectedId)) {
        queue.push(connectedId);
      }
    });
  }
  
  // Get all nodes in subgraph
  const subgraphNodes = allNodes.filter(n => subgraphNodeIds.has(n.id));
  
  // Get all edges in subgraph
  const subgraphEdges = edges.filter(
    e => subgraphNodeIds.has(e.source) && subgraphNodeIds.has(e.target)
  );
  
  // Create export data
  const nodesData = subgraphNodes.map(node => {
    const nodeEdges = subgraphEdges.filter(
      e => e.source === node.id || e.target === node.id
    );

    return {
      id: node.id,
      type: node.type,
      label: node.data.label,
      nodeType: node.data.type,
      summary: node.data.summary || '',
      tags: node.data.tags || [],
      cards: node.data.cards || [],
      position: node.position,
      connections: nodeEdges.map(edge => ({
        connectedNodeId: edge.source === node.id ? edge.target : edge.source,
        direction: edge.source === node.id ? 'outgoing' : 'incoming',
        edgeId: edge.id,
      })),
    };
  });

  const exportData = {
    exportType: 'subgraph',
    rootNode: rootNode.data.label,
    nodeCount: subgraphNodes.length,
    edgeCount: subgraphEdges.length,
    exportedAt: new Date().toISOString(),
    nodes: nodesData,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${rootNode.data.label.replace(/\s+/g, '-').toLowerCase()}-subgraph.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export node with its connected subgraph as Markdown
 */
export function exportSubgraphAsMarkdown(rootNode: Node, edges: Edge[], allNodes: Node[]): void {
  // Find all connected nodes (BFS traversal)
  const visited = new Set<string>();
  const queue: string[] = [rootNode.id];
  const subgraphNodeIds = new Set<string>();
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    subgraphNodeIds.add(currentId);
    
    const connectedEdges = edges.filter(
      e => e.source === currentId || e.target === currentId
    );
    
    connectedEdges.forEach(edge => {
      const connectedId = edge.source === currentId ? edge.target : edge.source;
      if (!visited.has(connectedId)) {
        queue.push(connectedId);
      }
    });
  }
  
  const subgraphNodes = allNodes.filter(n => subgraphNodeIds.has(n.id));
  const subgraphEdges = edges.filter(
    e => subgraphNodeIds.has(e.source) && subgraphNodeIds.has(e.target)
  );
  
  let markdown = `# ${rootNode.data.label} - Connected Subgraph\n\n`;
  markdown += `*Exported from FlowForge on ${new Date().toLocaleDateString()}*\n\n`;
  markdown += `**Subgraph Statistics:**\n`;
  markdown += `- Root Node: ${rootNode.data.label}\n`;
  markdown += `- Total Nodes: ${subgraphNodes.length}\n`;
  markdown += `- Total Connections: ${subgraphEdges.length}\n\n`;
  markdown += `---\n\n`;

  // Export root node first
  markdown += `## Root: ${rootNode.data.label}\n\n`;
  if (rootNode.data.type) {
    markdown += `**Type:** ${rootNode.data.type.charAt(0).toUpperCase() + rootNode.data.type.slice(1)}\n\n`;
  }
  if (rootNode.data.summary) {
    markdown += `${rootNode.data.summary}\n\n`;
  }
  markdown += `---\n\n`;

  // Export connected nodes
  markdown += `## Connected Nodes\n\n`;
  subgraphNodes
    .filter(n => n.id !== rootNode.id)
    .forEach((node, index) => {
      markdown += `### ${index + 1}. ${node.data.label}\n\n`;
      
      if (node.data.type) {
        markdown += `**Type:** ${node.data.type.charAt(0).toUpperCase() + node.data.type.slice(1)}\n\n`;
      }

      if (node.data.summary) {
        markdown += `${node.data.summary}\n\n`;
      }

      if (node.data.tags && node.data.tags.length > 0) {
        markdown += `**Tags:** ${node.data.tags.map((tag: string) => `\`${tag}\``).join(', ')}\n\n`;
      }

      // Show connections within subgraph
      const nodeEdges = subgraphEdges.filter(
        e => e.source === node.id || e.target === node.id
      );
      
      if (nodeEdges.length > 0) {
        const connections = nodeEdges.map(edge => {
          const connectedId = edge.source === node.id ? edge.target : edge.source;
          const connectedNode = allNodes.find(n => n.id === connectedId);
          return connectedNode ? connectedNode.data.label : 'Unknown';
        });
        markdown += `**Connected to:** ${connections.join(', ')}\n\n`;
      }

      markdown += `---\n\n`;
    });

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${rootNode.data.label.replace(/\s+/g, '-').toLowerCase()}-subgraph.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export nodes as CSV for data analysis
 */
export function exportAsCSV(nodes: Node[], edges: Edge[]): void {
  // CSV Header
  let csv = 'ID,Label,Type,Summary,Tags,Card Count,Connection Count,Position X,Position Y\n';
  
  // CSV Rows
  nodes.forEach(node => {
    const connectedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );
    
    const id = node.id;
    const label = `"${(node.data.label || '').replace(/"/g, '""')}"`;
    const type = node.data.type || '';
    const summary = `"${(node.data.summary || '').replace(/"/g, '""')}"`;
    const tags = `"${(node.data.tags || []).join(', ')}"`;
    const cardCount = (node.data.cards || []).length;
    const connectionCount = connectedEdges.length;
    const posX = Math.round(node.position.x);
    const posY = Math.round(node.position.y);
    
    csv += `${id},${label},${type},${summary},${tags},${cardCount},${connectionCount},${posX},${posY}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `flowforge-data-export.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export connections as CSV
 */
export function exportConnectionsAsCSV(edges: Edge[], nodes: Node[]): void {
  // CSV Header
  let csv = 'Source ID,Source Label,Target ID,Target Label,Edge ID\n';
  
  // CSV Rows
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    const sourceId = edge.source;
    const sourceLabel = `"${(sourceNode?.data.label || 'Unknown').replace(/"/g, '""')}"`;
    const targetId = edge.target;
    const targetLabel = `"${(targetNode?.data.label || 'Unknown').replace(/"/g, '""')}"`;
    const edgeId = edge.id;
    
    csv += `${sourceId},${sourceLabel},${targetId},${targetLabel},${edgeId}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `flowforge-connections-export.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Copy selected nodes to clipboard as formatted text
 */
export async function copySelectedNodesToClipboard(nodes: Node[], edges: Edge[]): Promise<void> {
  let text = `FlowForge - ${nodes.length} Selected Node${nodes.length > 1 ? 's' : ''}\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  nodes.forEach((node, index) => {
    text += `${index + 1}. ${node.data.label}\n`;
    text += `   Type: ${node.data.type || 'N/A'}\n`;
    
    if (node.data.summary) {
      text += `   Summary: ${node.data.summary}\n`;
    }
    
    if (node.data.tags && node.data.tags.length > 0) {
      text += `   Tags: ${node.data.tags.join(', ')}\n`;
    }
    
    const connectedEdges = edges.filter(
      e => e.source === node.id || e.target === node.id
    );
    
    if (connectedEdges.length > 0) {
      text += `   Connections: ${connectedEdges.length}\n`;
    }
    
    text += `\n`;
  });
  
  await navigator.clipboard.writeText(text);
}

/**
 * Generate export template from node configuration
 */
export function createNodeTemplate(node: Node): any {
  return {
    templateName: node.data.label,
    templateType: node.data.type,
    config: {
      summary: node.data.summary || '',
      tags: node.data.tags || [],
      cards: node.data.cards || [],
    },
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0',
    },
  };
}

/**
 * Export node as reusable template
 */
export function exportNodeAsTemplate(node: Node): void {
  const template = createNodeTemplate(node);
  const jsonString = JSON.stringify(template, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${node.data.label.replace(/\s+/g, '-').toLowerCase()}-template.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}
