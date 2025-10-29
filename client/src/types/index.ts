import { Node, Edge } from '@xyflow/react'

export type NodeType = 'root' | 'frontend' | 'backend' | 'requirement' | 'doc'

// Domain & Department Types (FlowForge)
export type DomainType = 'Business' | 'Product' | 'Tech' | 'DataAI' | 'Ops'
export type RelationshipType = 'satisfies' | 'depends_on' | 'informs' | 'duplicates' | 'blocks'

// Content Types
export type ContentType = 'text' | 'todo' | 'help' | 'prd'

export interface Content {
  id: string
  type: ContentType
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

// Enhanced with optional FlowForge fields
export interface WorkspaceNodeData {
  title: string
  summary?: string
  tags?: string[]
  stackHint?: string
  contents?: Content[]
  // Optional FlowForge fields (backward compatible)
  domain?: DomainType
  category?: string
  rationale?: string
  enrichment?: {
    history: Array<{ content: string; timestamp: string }>
    current?: { content: string; timestamp: string }
  }
}

export type WorkspaceNode = Node<any, NodeType>

// Enhanced Edge with optional relationship type
export type WorkspaceEdge = Edge & {
  data?: {
    relation?: RelationshipType
  }
}

export interface Workspace {
  _id?: string
  name: string
  ownerId?: string | null
  nodes: WorkspaceNode[]
  edges: WorkspaceEdge[]
  updatedAt?: string
  createdAt?: string
}

export interface WorkspaceState {
  // State
  nodes: WorkspaceNode[]
  edges: WorkspaceEdge[]
  activeWorkspaceId?: string
  activeWorkspaceName?: string
  isDirty: boolean
  history: Array<{ nodes: WorkspaceNode[]; edges: WorkspaceEdge[] }>
  historyIndex: number

  // Actions
  setNodes: (nodes: WorkspaceNode[]) => void
  setEdges: (edges: WorkspaceEdge[]) => void
  addNode: (node: WorkspaceNode) => void
  updateNode: (id: string, data: Partial<WorkspaceNodeData>) => void
  deleteNode: (id: string) => void
  addEdge: (edge: WorkspaceEdge) => void
  deleteEdge: (id: string) => void
  addNodeContent: (nodeId: string, content: Content) => void
  updateNodeContent: (nodeId: string, contentId: string, content: Partial<Content>) => void
  deleteNodeContent: (nodeId: string, contentId: string) => void
  setActiveWorkspace: (id?: string, name?: string) => void
  loadWorkspace: (workspace: Workspace) => void
  resetWorkspace: () => void
  markDirty: () => void
  markClean: () => void
  undo: () => void
  redo: () => void
}

export interface AISuggestion {
  type: NodeType
  data: WorkspaceNodeData
}

export interface AIResponse {
  suggestions: AISuggestion[]
}

export interface AuthState {
  accessToken?: string
  user?: { sub: string; email?: string }
  isAuthenticated: boolean
  setToken: (token: string) => void
  setUser: (user: { sub: string; email?: string }) => void
  logout: () => void
}

// Queue-related types
export type QueueJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface QueueJob {
  jobId: string
  status: QueueJobStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  retryCount: number
  error?: string
  progress: {
    pending: boolean
    processing: boolean
    completed: boolean
    failed: boolean
  }
}

export interface QueueStats {
  queueSize: number
  activeJobs: number
  totalProcessed: number
}

export interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  successCount: number
  lastFailureTime?: number
}

export interface GenerationMode {
  type: 'retry' | 'queue'
  label: string
  description: string
  icon: string
}

// Template types (UI-only for now)
export interface Template {
  id: string
  name: string
  description: string
  nodes: WorkspaceNode[]
  edges: WorkspaceEdge[]
  createdAt: string
}

// Snapshot types (UI-only for now)
export interface Snapshot {
  id: string
  workspaceId: string
  name: string
  nodes: WorkspaceNode[]
  edges: WorkspaceEdge[]
  createdAt: string
}

// Analytics types (UI-only for now)
export interface WorkspaceAnalytics {
  nodeCount: number
  edgeCount: number
  domainDistribution: Record<DomainType, number>
  typeDistribution: Record<NodeType, number>
  avgNodesPerDomain: number
}
