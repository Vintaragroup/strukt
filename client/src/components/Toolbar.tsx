import React, { useState, useEffect } from 'react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { workspacesAPI, aiAPI, getErrorMessage } from '../api/client'
import { WorkspaceNode, NodeType } from '../types'
import PromptInputModal from './PromptInputModal'
import GenerationResultsPanel, { GenerationResult } from './GenerationResultsPanel'
import QueueStatusPanel from './QueueStatus'
import { validateWorkspace, sanitizeWorkspace, formatValidationMessages } from '../utils/workspaceValidator'
import './Toolbar.css'
import { UI_VERSION } from '../uiVersion'

const Toolbar: React.FC = () => {
  const store = useWorkspaceStore()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [showResultsPanel, setShowResultsPanel] = useState(false)
  const [showQueueStatus, setShowQueueStatus] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceList, setWorkspaceList] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAISuggesting, setIsAISuggesting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pendingGeneration, setPendingGeneration] = useState<any>(null)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [queueCount, setQueueCount] = useState(0)

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load workspace list
  const loadWorkspaceList = async () => {
    try {
      const workspaces = await workspacesAPI.list()
      setWorkspaceList(workspaces.map((w) => w.name))
    } catch (error) {
      console.error('Failed to load workspace list:', error)
    }
  }

  // Add node action
  const handleAddNode = (type: NodeType) => {
    if (type === 'root' && store.nodes.some((n: WorkspaceNode) => n.type === 'root')) {
      showToast('Only one root node allowed', 'error')
      return
    }

    const newNode: WorkspaceNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
      },
      data: {
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        summary: 'Click to edit',
      },
    }
    store.addNode(newNode)
    showToast(`Added ${type} node`)
  }

  // Save workspace
  const handleSaveWorkspace = async () => {
    if (!workspaceName.trim()) {
      showToast('Please enter a workspace name', 'error')
      return
    }

    setIsSaving(true)
    try {
      await workspacesAPI.update(workspaceName, {
        name: workspaceName,
        nodes: store.nodes,
        edges: store.edges,
      })
      store.setActiveWorkspace(undefined, workspaceName)
      store.markClean()
      setShowSaveDialog(false)
      setWorkspaceName('')
      showToast(`Workspace "${workspaceName}" saved`)
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Load workspace
  const handleLoadWorkspace = async (name: string) => {
    setIsLoading(true)
    try {
      const workspace = await workspacesAPI.get(name)
      store.loadWorkspace(workspace)
      setShowLoadDialog(false)
      showToast(`Workspace "${name}" loaded`)
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // AI suggest
  const handleAISuggest = async () => {
    setIsAISuggesting(true)
    try {
      const response = await aiAPI.suggest({
        nodes: store.nodes,
        edges: store.edges,
      })

      if (response.suggestions && response.suggestions.length > 0) {
        response.suggestions.forEach((suggestion) => {
          const newNode: WorkspaceNode = {
            id: `${suggestion.type}-${Date.now()}-${Math.random()}`,
            type: suggestion.type,
            position: {
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
            },
            data: suggestion.data,
          }
          store.addNode(newNode)
        })
        showToast(`Added ${response.suggestions.length} suggestions`)
      }
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setIsAISuggesting(false)
    }
  }

  // Handle prompt submission for generation
  const handlePromptSubmit = async (prompt: string, mode: 'retry' | 'queue') => {
    setIsGenerating(true)
    try {
      if (mode === 'retry') {
        // Sync generation with retry
        const result = await aiAPI.generateWithRetry(prompt, store.activeWorkspaceId || '')
        
        if (!result.success) {
          showToast('Generation failed', 'error')
          return
        }

        const generatedWorkspace = {
          nodes: result.parsed.nodes || [],
          edges: result.parsed.edges || [],
        }

        const validation = validateWorkspace(generatedWorkspace)
        
        if (!validation.isValid || validation.messages.length > 0) {
          const validationMessages = formatValidationMessages(validation.messages)
          validationMessages.forEach(msg => {
            console.warn(msg)
          })
        }

        const criticalErrors = validation.messages.filter(m => m.severity === 'error')
        if (criticalErrors.length > 0) {
          showToast(`Generation has ${criticalErrors.length} validation error(s)`, 'error')
          return
        }

        const { nodes: generatedNodes, edges: generatedEdges } = sanitizeWorkspace(generatedWorkspace)

        const nodeTypeCount: { [key: string]: number } = {}
        generatedNodes.forEach((node) => {
          nodeTypeCount[node.type] = (nodeTypeCount[node.type] || 0) + 1
        })

        const nodeTypes = Object.entries(nodeTypeCount).map(([type, count]) => `${count} ${type}`).join(', ')
        const summary = `Generated a workspace structure with ${nodeTypes}`

        setPendingGeneration({
          nodes: generatedNodes,
          edges: generatedEdges,
        })

        const generationResult: GenerationResult = {
          nodeCount: generatedNodes.length,
          edgeCount: generatedEdges.length,
          nodeTypes: nodeTypeCount,
          suggestedName: prompt.split(' ').slice(0, 5).join(' '),
          summary: summary,
        }

        setGenerationResult(generationResult)
        setShowResultsPanel(true)
        setShowPromptModal(false)
        showToast(`✨ Generation complete (${result.generationTime})`, 'success')
      } else {
        // Queue mode - just queue the job
        const result = await aiAPI.generateQueued(prompt, store.activeWorkspaceId || '')
        
        if (!result.success) {
          showToast('Failed to queue generation', 'error')
          return
        }

        showToast(`✨ Generation queued (Job: ${result.jobId.substring(0, 8)}...)`, 'success')
        setShowPromptModal(false)
        setQueueCount(prev => prev + 1)
        
        // Auto-open queue status panel
        setShowQueueStatus(true)
      }
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle accepting the generation results
  const handleAcceptGeneration = () => {
    if (!pendingGeneration) return

    const { nodes: generatedNodes, edges: generatedEdges } = pendingGeneration

    // Add nodes to store
    generatedNodes.forEach((node: WorkspaceNode) => {
      store.addNode({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          title: node.data.title,
          summary: node.data.summary || '',
          stackHint: node.data.stackHint,
        },
      })
    })

    // Add edges to store
    generatedEdges.forEach((edge: any) => {
      store.addEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })
    })

    showToast(`✨ Added ${generatedNodes.length} nodes to workspace`, 'success')
    setShowResultsPanel(false)
    setPendingGeneration(null)
    setGenerationResult(null)
  }

  // Handle discarding the generation results
  const handleDiscardGeneration = () => {
    showToast('Generation discarded', 'success')
    setShowResultsPanel(false)
    setPendingGeneration(null)
    setGenerationResult(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        setShowSaveDialog(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        setShowLoadDialog(true)
        loadWorkspaceList()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // TODO: Delete selected nodes
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [store])

  return (
    <div className="toolbar">
      <div className="toolbar-header-row">
        <div className="version-badge" title="UI Version">UI {UI_VERSION}</div>
      </div>
      <div className="toolbar-section">
        <h2>Workspace</h2>
        <button onClick={() => handleAddNode('root')} className="btn btn-primary">
          Add Root
        </button>      </div>

      <div className="toolbar-section">
        <h2>Nodes</h2>
        <button onClick={() => handleAddNode('frontend')} className="btn btn-frontend">
          Frontend
        </button>
        <button onClick={() => handleAddNode('backend')} className="btn btn-backend">
          Backend
        </button>
        <button onClick={() => handleAddNode('requirement')} className="btn btn-requirement">
          Requirement
        </button>
        <button onClick={() => handleAddNode('doc')} className="btn btn-doc">
          Doc
        </button>
      </div>

      <div className="toolbar-section">
        <h2>Persist</h2>
        <button onClick={() => setShowSaveDialog(true)} className="btn btn-success">
          Save (⌘S)
        </button>
        <button
          onClick={() => {
            loadWorkspaceList()
            setShowLoadDialog(true)
          }}
          className="btn btn-info"
        >
          Load (⌘L)
        </button>
      </div>

      <div className="toolbar-section">
        <h2>AI • Phase 3</h2>
        <button
          onClick={() => setShowPromptModal(true)}
          className="btn btn-ai"
        >
          Generate
        </button>
        <button
          onClick={handleAISuggest}
          disabled={isAISuggesting}
          className="btn btn-ai"
        >
          {isAISuggesting ? 'Suggesting...' : 'Suggest'}
        </button>
        <button
          onClick={() => setShowQueueStatus(true)}
          className="btn btn-ai"
          title="View queue status and active generation jobs"
        >
          📊 Queue {queueCount > 0 && `(${queueCount})`}
        </button>
      </div>

      <div className="toolbar-section">
        <h2>Edit</h2>
        <button onClick={() => store.undo()} className="btn btn-secondary">
          Undo
        </button>
        <button onClick={() => store.redo()} className="btn btn-secondary">
          Redo
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save Workspace</h3>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleSaveWorkspace()}
            />
            <div className="modal-actions">
              <button onClick={() => setShowSaveDialog(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveWorkspace} disabled={isSaving} className="btn btn-success">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="modal-overlay" onClick={() => setShowLoadDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Load Workspace</h3>
            <div className="workspace-list">
              {workspaceList.length === 0 ? (
                <p>No workspaces found</p>
              ) : (
                workspaceList.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleLoadWorkspace(name)}
                    disabled={isLoading}
                    className="btn btn-workspace"
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowLoadDialog(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* Generation Results Panel */}
      {generationResult && (
        <GenerationResultsPanel
          result={generationResult}
          isOpen={showResultsPanel}
          onAccept={handleAcceptGeneration}
          onDiscard={handleDiscardGeneration}
        />
      )}

      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSubmit={handlePromptSubmit}
        isLoading={isGenerating}
      />

      {/* Queue Status Panel */}
      <QueueStatusPanel
        isOpen={showQueueStatus}
        onClose={() => setShowQueueStatus(false)}
        onJobComplete={(jobId, result) => {
          setPendingGeneration({
            nodes: result.parsed.nodes,
            edges: result.parsed.edges,
          })

          const nodeTypeCount: { [key: string]: number } = {}
          result.parsed.nodes.forEach((node: any) => {
            nodeTypeCount[node.type] = (nodeTypeCount[node.type] || 0) + 1
          })

          const generationResult: GenerationResult = {
            nodeCount: result.parsed.nodes.length,
            edgeCount: result.parsed.edges.length,
            nodeTypes: nodeTypeCount,
            suggestedName: `Generated (${jobId.substring(0, 8)}...)`,
            summary: result.parsed.summary,
          }

          setGenerationResult(generationResult)
          setShowResultsPanel(true)
          showToast('✨ Generation complete! Review and add to workspace', 'success')
        }}
      />
    </div>
  )
}

export default Toolbar
