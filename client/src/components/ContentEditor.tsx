import React, { useState, useEffect } from 'react'
import { Content } from '../types/index.js'
import './ContentEditor.css'

interface ContentEditorProps {
  content: Content
  isOpen: boolean
  onClose: () => void
  onSave: (content: Content) => void
  onDelete: () => void
}

const contentTypeLabels: Record<string, string> = {
  text: 'Text Content',
  todo: 'To-Do Item',
  help: 'Help Documentation',
  prd: 'Product Requirements',
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState(content.title)
  const [body, setBody] = useState(content.body)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(content.title)
    setBody(content.body)
  }, [content])

  if (!isOpen) return null

  const handleSave = () => {
    setIsSaving(true)
    try {
      onSave({
        ...content,
        title,
        body,
        updatedAt: new Date().toISOString(),
      })
      setIsSaving(false)
      onClose()
    } catch (error) {
      console.error('Failed to save content:', error)
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this content?')) {
      onDelete()
      onClose()
    }
  }

  return (
    <div className="content-editor-overlay" onClick={onClose}>
      <div className="content-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>{contentTypeLabels[content.type]}</h2>
          <button className="editor-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="editor-content">
          <div className="editor-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title"
              autoFocus
            />
          </div>

          <div className="editor-field">
            <label htmlFor="body">Content</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your content here..."
              className="editor-textarea"
            />
          </div>

          <div className="editor-meta">
            <span className="meta-label">Type:</span>
            <span className={`meta-badge badge-${content.type}`}>{content.type}</span>
            <span className="meta-label">Created:</span>
            <span className="meta-value">
              {new Date(content.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="editor-actions">
          <button
            onClick={handleDelete}
            className="btn btn-danger"
            title="Delete this content"
          >
            Delete
          </button>
          <div className="action-spacer" />
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="btn btn-success"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentEditor
