import React, { useState } from 'react'
import { ContentType } from '../types/index.js'

interface NodeActionMenuProps {
  onAddContent: (type: ContentType) => void
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  type: ContentType
  label: string
  icon: string
  color: string
  description: string
}

const menuItems: MenuItem[] = [
  {
    type: 'text',
    label: 'Text',
    icon: '📝',
    color: '#3b82f6',
    description: 'Add text content'
  },
  {
    type: 'todo',
    label: 'To-Do',
    icon: '✓',
    color: '#10b981',
    description: 'Add a to-do item'
  },
  {
    type: 'help',
    label: 'Get Help',
    icon: '❓',
    color: '#f59e0b',
    description: 'Add help content'
  },
  {
    type: 'prd',
    label: 'Generate PRD',
    icon: '📋',
    color: '#8b5cf6',
    description: 'Generate requirements document'
  }
]

export const NodeActionMenu: React.FC<NodeActionMenuProps> = ({
  onAddContent,
  isOpen,
  onClose
}) => {
  const [hoveredType, setHoveredType] = useState<ContentType | null>(null)

  if (!isOpen) return null

  const handleMenuItemClick = (type: ContentType) => {
    onAddContent(type)
    onClose()
  }

  return (
    <div className="node-action-menu">
      <div className="menu-backdrop" onClick={onClose} />
      <div className="menu-container">
        <div className="menu-header">
          <h3>Add Content</h3>
          <button className="menu-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="menu-items">
          {menuItems.map((item) => (
            <button
              key={item.type}
              className={`menu-item ${hoveredType === item.type ? 'hovered' : ''}`}
              onClick={() => handleMenuItemClick(item.type)}
              onMouseEnter={() => setHoveredType(item.type)}
              onMouseLeave={() => setHoveredType(null)}
              title={item.description}
              style={{
                '--accent-color': item.color
              } as React.CSSProperties}
            >
              <span className="menu-item-icon">{item.icon}</span>
              <div className="menu-item-text">
                <span className="menu-item-label">{item.label}</span>
                <span className="menu-item-description">{item.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NodeActionMenu
