import React from 'react'
import './GenerationResultsPanel.css'

export interface GenerationResult {
  nodeCount: number
  edgeCount: number
  nodeTypes: { [key: string]: number }
  suggestedName: string
  summary: string
}

interface GenerationResultsPanelProps {
  result: GenerationResult
  isOpen: boolean
  isLoading?: boolean
  onAccept: () => void
  onDiscard: () => void
}

/**
 * GenerationResultsPanel
 * 
 * Displays a preview of generated workspace before adding to canvas.
 * Allows user to review and confirm or reject the generation.
 * 
 * Features:
 * - Node/edge count summary
 * - Breakdown by node type
 * - Auto-suggested workspace name
 * - Accept/Discard buttons
 * - Smooth animations
 */
const GenerationResultsPanel: React.FC<GenerationResultsPanelProps> = ({
  result,
  isOpen,
  isLoading = false,
  onAccept,
  onDiscard,
}) => {
  if (!isOpen) return null

  const getNodeTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      root: '🏗️',
      frontend: '🎨',
      backend: '⚙️',
      requirement: '📋',
      doc: '📄',
    }
    return icons[type] || '📦'
  }

  const getNodeTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      root: 'Root',
      frontend: 'Frontend',
      backend: 'Backend',
      requirement: 'Requirement',
      doc: 'Documentation',
    }
    return labels[type] || type
  }

  return (
    <div className="generation-results-overlay">
      <div className="generation-results-panel">
        {/* Header */}
        <div className="results-header">
          <div>
            <h2>✨ Generation Preview</h2>
            <p className="results-subtitle">Review the generated workspace</p>
          </div>
          <button className="close-btn" onClick={onDiscard} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="results-content">
          {isLoading ? (
            <div className="results-loading">
              <div className="spinner"></div>
              <p>Processing generation...</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="results-stats">
                <div className="stat-item">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <div className="stat-value">{result.nodeCount}</div>
                    <div className="stat-label">Nodes</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🔗</div>
                  <div className="stat-info">
                    <div className="stat-value">{result.edgeCount}</div>
                    <div className="stat-label">Connections</div>
                  </div>
                </div>
              </div>

              {/* Node Type Breakdown */}
              <div className="results-breakdown">
                <h3>Node Breakdown</h3>
                <div className="breakdown-grid">
                  {Object.entries(result.nodeTypes).map(([type, count]) => (
                    <div key={type} className="breakdown-item">
                      <span className="breakdown-icon">{getNodeTypeIcon(type)}</span>
                      <span className="breakdown-label">{getNodeTypeLabel(type)}</span>
                      <span className="breakdown-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {result.summary && (
                <div className="results-summary">
                  <h3>What We Generated</h3>
                  <p>{result.summary}</p>
                </div>
              )}

              {/* Suggested Name */}
              <div className="results-name-section">
                <label htmlFor="workspace-name">Workspace Name</label>
                <input
                  id="workspace-name"
                  type="text"
                  className="results-name-input"
                  defaultValue={result.suggestedName}
                  placeholder="e.g., E-commerce Platform"
                />
                <p className="results-name-hint">This is just a suggestion. You can change it later.</p>
              </div>

              {/* Information Box */}
              <div className="results-info">
                <p>
                  ℹ️ You can still edit, add, or remove nodes after adding them to the canvas.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="results-footer">
          <button
            className="btn btn-outline"
            onClick={onDiscard}
            disabled={isLoading}
          >
            Discard
          </button>
          <button
            className="btn btn-primary"
            onClick={onAccept}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Add to Workspace'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GenerationResultsPanel
