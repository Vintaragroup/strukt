import React, { useState } from 'react'
import { NodeProps } from 'reactflow'
import { WorkspaceNodeData, ContentType } from '../../types'
import NodeActionMenu from '../NodeActionMenu.js'
import { useWorkspaceStore } from '../../store/useWorkspaceStore.js'
import './Node.css'

const FrontendNode: React.FC<NodeProps<WorkspaceNodeData>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(data.title)
  const [summary, setSummary] = useState(data.summary || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const addNodeContent = useWorkspaceStore((state) => state.addNodeContent)

  const handleSave = () => {
    // TODO: Update store
    setIsEditing(false)
  }

  const handleAddContent = (type: ContentType) => {
    const content = {
      id: `content-${Date.now()}`,
      type,
      title: `New ${type}`,
      body: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addNodeContent(id, content)
  }

  return (
    <div className={`node node-frontend ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <div className="node-type-badge">Frontend</div>
        <button
          className="node-action-button"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Add content"
        >
          +
        </button>
      </div>
      <NodeActionMenu
        onAddContent={handleAddContent}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {data.contents && data.contents.length > 0 && (
        <div className="node-content-badges">
          {data.contents.map((content) => (
            <span key={content.id} className={`content-badge badge-${content.type}`}>
              {content.type === 'text' && '📝'}
              {content.type === 'todo' && '✓'}
              {content.type === 'help' && '❓'}
              {content.type === 'prd' && '📋'}
            </span>
          ))}
        </div>
      )}
      {isEditing ? (
        <div className="node-edit">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node title"
            autoFocus
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary (optional)"
          />
          <button onClick={handleSave}>Save</button>
        </div>
      ) : (
        <div className="node-content" onDoubleClick={() => setIsEditing(true)}>
          <div className="node-title">{title}</div>
          {summary && <div className="node-summary">{summary}</div>}
          {data.stackHint && <div className="node-stack">{data.stackHint}</div>}
        </div>
      )}
      <div className="node-handle"></div>
    </div>
  )
}

export default FrontendNode
