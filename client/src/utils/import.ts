import { Node, Edge } from 'reactflow';

/**
 * Validate imported JSON node data
 */
export function validateNodeJSON(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON format' };
  }

  // Check required fields
  if (!data.label || typeof data.label !== 'string') {
    return { valid: false, error: 'Missing or invalid label' };
  }

  if (!data.nodeType || typeof data.nodeType !== 'string') {
    return { valid: false, error: 'Missing or invalid node type' };
  }

  // Validate node type
  const validTypes = ['root', 'frontend', 'backend', 'requirement', 'doc'];
  if (!validTypes.includes(data.nodeType)) {
    return { valid: false, error: `Invalid node type: ${data.nodeType}` };
  }

  return { valid: true };
}

/**
 * Import a node from JSON data
 */
export function importNodeFromJSON(
  jsonData: any,
  position: { x: number; y: number }
): { node: Node; success: boolean; error?: string } {
  // Validate the data
  const validation = validateNodeJSON(jsonData);
  if (!validation.valid) {
    return { node: null as any, success: false, error: validation.error };
  }

  // Generate new ID
  const newId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create the node
  const newNode: Node = {
    id: newId,
    type: 'custom',
    position: position,
    data: {
      label: jsonData.label,
      type: jsonData.nodeType,
      summary: jsonData.summary || '',
      tags: Array.isArray(jsonData.tags) ? jsonData.tags : [],
      cards: Array.isArray(jsonData.cards) ? jsonData.cards : [],
      isNew: true,
    } as any,
  };

  return { node: newNode, success: true };
}

/**
 * Import multiple nodes from JSON array
 */
export function importMultipleNodesFromJSON(
  jsonData: any,
  startPosition: { x: number; y: number }
): { nodes: Node[]; edges: Edge[]; success: boolean; error?: string } {
  if (!Array.isArray(jsonData)) {
    return { nodes: [], edges: [], success: false, error: 'Data must be an array of nodes' };
  }

  const importedNodes: Node[] = [];
  const importedEdges: Edge[] = [];
  const idMapping: { [oldId: string]: string } = {};

  // First pass: create nodes
  jsonData.forEach((nodeData, index) => {
    const validation = validateNodeJSON(nodeData);
    if (!validation.valid) {
      console.warn(`Skipping invalid node at index ${index}:`, validation.error);
      return;
    }

    const newId = `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
    idMapping[nodeData.id] = newId;

    const position = nodeData.position || {
      x: startPosition.x + (index * 250),
      y: startPosition.y + (Math.floor(index / 3) * 200),
    };

    const newNode: Node = {
      id: newId,
      type: 'custom',
      position: position,
      data: {
        label: nodeData.label,
        type: nodeData.nodeType,
        summary: nodeData.summary || '',
        tags: Array.isArray(nodeData.tags) ? nodeData.tags : [],
        cards: Array.isArray(nodeData.cards) ? nodeData.cards : [],
        isNew: true,
      } as any,
    };

    importedNodes.push(newNode);
  });

  // Second pass: recreate edges if connection data exists
  jsonData.forEach((nodeData) => {
    if (nodeData.connections && Array.isArray(nodeData.connections)) {
      nodeData.connections.forEach((conn: any) => {
        if (conn.direction === 'outgoing' && idMapping[nodeData.id] && idMapping[conn.connectedNodeId]) {
          const edgeId = `e${idMapping[nodeData.id]}-${idMapping[conn.connectedNodeId]}`;
          importedEdges.push({
            id: edgeId,
            source: idMapping[nodeData.id],
            target: idMapping[conn.connectedNodeId],
            type: 'custom',
          });
        }
      });
    }
  });

  return { nodes: importedNodes, edges: importedEdges, success: true };
}

/**
 * Parse and validate file content
 */
export async function parseImportFile(file: File): Promise<{ data: any; success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        resolve({ data, success: true });
      } catch (error) {
        resolve({ data: null, success: false, error: 'Invalid JSON file' });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, success: false, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}

/**
 * Detect import type (single node, multiple nodes, or subgraph)
 */
export function detectImportType(data: any): 'single' | 'multiple' | 'subgraph' | 'unknown' {
  if (!data) return 'unknown';

  // Check if it's an array (multiple nodes or subgraph)
  if (Array.isArray(data)) {
    // Check if any node has connections data (indicates subgraph export)
    const hasConnections = data.some(node => node.connections && Array.isArray(node.connections));
    return hasConnections ? 'subgraph' : 'multiple';
  }

  // Check if it's a single node
  if (data.label && data.nodeType) {
    return 'single';
  }

  return 'unknown';
}
