import { create } from 'zustand'
import { WorkspaceState, WorkspaceNode, WorkspaceEdge, Workspace } from '../types'

const MAX_HISTORY = 50

/**
 * DFS-based cycle detection: check if adding an edge would create a cycle
 */
function wouldCreateCycle(
  _nodes: WorkspaceNode[],
  edges: WorkspaceEdge[],
  newEdge: WorkspaceEdge,
): boolean {
  const adjacency: Record<string, string[]> = {}

  // Build adjacency list with existing edges
  for (const edge of edges) {
    if (!adjacency[edge.source]) adjacency[edge.source] = []
    adjacency[edge.source].push(edge.target)
  }

  // Temporarily add new edge and check if there's a path from target to source
  if (!adjacency[newEdge.source]) adjacency[newEdge.source] = []
  adjacency[newEdge.source].push(newEdge.target)

  // DFS to find if there's a path from newEdge.target to newEdge.source
  const visited = new Set<string>()
  const hasPath = (from: string, to: string): boolean => {
    if (from === to) return true
    if (visited.has(from)) return false
    visited.add(from)

    const neighbors = adjacency[from] || []
    for (const neighbor of neighbors) {
      if (hasPath(neighbor, to)) return true
    }
    return false
  }

  return hasPath(newEdge.target, newEdge.source)
}

function updateHistory(
  history: Array<{ nodes: WorkspaceNode[]; edges: WorkspaceEdge[] }>,
  historyIndex: number,
  nodes: WorkspaceNode[],
  edges: WorkspaceEdge[],
): { history: Array<{ nodes: WorkspaceNode[]; edges: WorkspaceEdge[] }>; historyIndex: number } {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push({ nodes, edges })
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift()
  }
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

const createDefaultRootNode = (): WorkspaceNode => ({
  id: 'root-node',
  type: 'root',
  position: { x: 0, y: 0 },
  data: {
    title: 'Project Root',
    summary: 'Click to edit',
  },
})

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // Initial state
  nodes: [createDefaultRootNode()],
  edges: [],
  activeWorkspaceId: undefined,
  activeWorkspaceName: undefined,
  isDirty: false,
  history: [],
  historyIndex: -1,

  // Actions
  setNodes: (nodes: WorkspaceNode[]) => {
    set((state) => {
      const historyUpdate = updateHistory(state.history, state.historyIndex, nodes, state.edges)
      return {
        nodes,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  setEdges: (edges: WorkspaceEdge[]) => {
    set((state) => {
      const historyUpdate = updateHistory(state.history, state.historyIndex, state.nodes, edges)
      return {
        edges,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  addNode: (node: WorkspaceNode) => {
    set((state) => {
      // Enforce single root rule
      if (node.type === 'root' && state.nodes.some((n) => n.type === 'root')) {
        console.warn('Only one root node allowed per workspace')
        return state
      }
      const newNodes = [...state.nodes, node]
      const historyUpdate = updateHistory(state.history, state.historyIndex, newNodes, state.edges)
      return {
        nodes: newNodes,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  updateNode: (id: string, data: Partial<{ title?: string; summary?: string; tags?: string[]; stackHint?: string }>) => {
    set((state) => {
      const newNodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
      )
      const historyUpdate = updateHistory(state.history, state.historyIndex, newNodes, state.edges)
      return {
        nodes: newNodes,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  deleteNode: (id: string) => {
    set((state) => {
      const newNodes = state.nodes.filter((n) => n.id !== id)
      const newEdges = state.edges.filter((e) => e.source !== id && e.target !== id)
      const historyUpdate = updateHistory(state.history, state.historyIndex, newNodes, newEdges)
      return {
        nodes: newNodes,
        edges: newEdges,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  addEdge: (edge: WorkspaceEdge) => {
    set((state) => {
      // Check for cycle before adding
      if (wouldCreateCycle(state.nodes, state.edges, edge)) {
        console.warn('Cannot add edge: would create cycle')
        return state
      }
      const newEdges = [...state.edges, edge]
      const historyUpdate = updateHistory(state.history, state.historyIndex, state.nodes, newEdges)
      return {
        edges: newEdges,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  deleteEdge: (id: string) => {
    set((state) => {
      const newEdges = state.edges.filter((e) => e.id !== id)
      const historyUpdate = updateHistory(state.history, state.historyIndex, state.nodes, newEdges)
      return {
        edges: newEdges,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  addNodeContent: (nodeId: string, content: any) => {
    set((state) => {
      const newNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          const contents = n.data.contents || []
          return {
            ...n,
            data: {
              ...n.data,
              contents: [...contents, content],
            },
          }
        }
        return n
      })
      const historyUpdate = updateHistory(state.history, state.historyIndex, newNodes, state.edges)
      return {
        nodes: newNodes,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  updateNodeContent: (nodeId: string, contentId: string, contentUpdate: any) => {
    set((state) => {
      const newNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          const contents = n.data.contents || []
          return {
            ...n,
            data: {
              ...n.data,
              contents: contents.map((c) =>
                c.id === contentId ? { ...c, ...contentUpdate } : c,
              ),
            },
          }
        }
        return n
      })
      const historyUpdate = updateHistory(state.history, state.historyIndex, newNodes, state.edges)
      return {
        nodes: newNodes,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  deleteNodeContent: (nodeId: string, contentId: string) => {
    set((state) => {
      const newNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          const contents = n.data.contents || []
          return {
            ...n,
            data: {
              ...n.data,
              contents: contents.filter((c) => c.id !== contentId),
            },
          }
        }
        return n
      })
      const historyUpdate = updateHistory(state.history, state.historyIndex, newNodes, state.edges)
      return {
        nodes: newNodes,
        isDirty: true,
        ...historyUpdate,
      }
    })
  },

  setActiveWorkspace: (id?: string, name?: string) => {
    set({ activeWorkspaceId: id, activeWorkspaceName: name })
  },

  loadWorkspace: (workspace: Workspace) => {
    set({
      nodes: workspace.nodes,
      edges: workspace.edges,
      activeWorkspaceId: workspace._id,
      activeWorkspaceName: workspace.name,
      isDirty: false,
      history: [],
      historyIndex: -1,
    })
  },

  resetWorkspace: () => {
    set({
      nodes: [createDefaultRootNode()],
      edges: [],
      activeWorkspaceId: undefined,
      activeWorkspaceName: undefined,
      isDirty: false,
      history: [],
      historyIndex: -1,
    })
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  recordHistory: () => {
    // This method is now handled implicitly in other actions
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      const snapshot = state.history[newIndex]
      return {
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        historyIndex: newIndex,
        isDirty: true,
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      const snapshot = state.history[newIndex]
      return {
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        historyIndex: newIndex,
        isDirty: true,
      }
    })
  },
}))
