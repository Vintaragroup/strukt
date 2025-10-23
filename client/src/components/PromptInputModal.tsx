/**
 * PromptInputModal - AI Workspace Generation Input
 * Allows users to describe their project and get AI-generated workspace structure
 */

import { useState, useRef, useEffect } from 'react'
import { examplePrompts, getAllCategories, getPromptsByCategory } from '../data/examplePrompts'
import type { ExamplePrompt } from '../data/examplePrompts'
import './PromptInputModal.css'

interface PromptInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (prompt: string, mode: 'retry' | 'queue') => Promise<void>
  isLoading?: boolean
}

function PromptInputModal({ isOpen, onClose, onSubmit, isLoading = false }: PromptInputModalProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showExamples, setShowExamples] = useState(false)
  const [generationMode, setGenerationMode] = useState<'retry' | 'queue'>('retry')
  const [filteredExamples, setFilteredExamples] = useState<ExamplePrompt[]>(examplePrompts)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update filtered examples when category changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredExamples(examplePrompts)
    } else {
      setFilteredExamples(getPromptsByCategory(selectedCategory as ExamplePrompt['category']))
    }
  }, [selectedCategory])

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && prompt.trim().length >= 50) {
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, prompt, onClose])

  const handleSubmit = async () => {
    if (prompt.trim().length < 50) {
      alert('Please enter at least 50 characters describing your project')
      return
    }

    if (prompt.trim().length > 2000) {
      alert('Prompt cannot exceed 2000 characters')
      return
    }

    try {
      await onSubmit(prompt, generationMode)
      setPrompt('')
      setShowExamples(false)
    } catch (error) {
      console.error('Error submitting prompt:', error)
    }
  }

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt)
    setShowExamples(false)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const charCount = prompt.length
  const isValid = charCount >= 50 && charCount <= 2000
  const charPercent = (charCount / 2000) * 100

  if (!isOpen) return null

  const categories = ['All', ...getAllCategories()]

  return (
    <div className="prompt-modal-overlay" onClick={onClose}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="prompt-modal-header">
          <h2>Generate Workspace from Prompt</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={isLoading} aria-label="Close modal">
            ×
          </button>
        </div>

        {/* Main Content */}
        <div className="prompt-modal-content">
          {/* Description */}
          <p className="prompt-description">
            Describe your project in detail. Include technologies, features, and requirements. AI will generate an optimized
            workspace structure.
          </p>

          {/* Textarea */}
          <div className="prompt-textarea-wrapper">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Build a modern e-commerce platform with React frontend, Node.js backend, PostgreSQL database, Stripe payments, JWT auth, and admin dashboard. Include product catalog, shopping cart, order management, and user reviews."
              className="prompt-textarea"
              disabled={isLoading}
              maxLength={2000}
            />
            {/* Character Counter */}
            <div className="prompt-char-counter">
              <div className="char-bar">
                <div
                  className={`char-bar-fill ${charCount < 50 ? 'warning' : charCount > 2000 ? 'error' : 'valid'}`}
                  style={{ width: `${Math.min(charPercent, 100)}%` }}
                />
              </div>
              <span className={`char-text ${charCount < 50 ? 'warning' : charCount > 2000 ? 'error' : ''}`}>
                {charCount}/2000 characters {charCount < 50 && `(${50 - charCount} more needed)`}
              </span>
            </div>
          </div>

          {/* Generation Mode Selection */}
          <div className="prompt-mode-section">
            <label className="mode-label">⚡ Generation Mode</label>
            <div className="mode-options">
              <label className="mode-option">
                <input
                  type="radio"
                  name="generation-mode"
                  value="retry"
                  checked={generationMode === 'retry'}
                  onChange={(e) => setGenerationMode(e.target.value as 'retry' | 'queue')}
                  disabled={isLoading}
                />
                <span className="mode-title">Fast (Retry)</span>
                <span className="mode-description">~3-4 seconds with exponential backoff</span>
              </label>
              <label className="mode-option">
                <input
                  type="radio"
                  name="generation-mode"
                  value="queue"
                  checked={generationMode === 'queue'}
                  onChange={(e) => setGenerationMode(e.target.value as 'retry' | 'queue')}
                  disabled={isLoading}
                />
                <span className="mode-title">Queue (Async)</span>
                <span className="mode-description">Async processing, check status later</span>
              </label>
            </div>
          </div>

          {/* Examples Toggle */}
          <div className="prompt-examples-section">
            <button
              className="examples-toggle-btn"
              onClick={() => setShowExamples(!showExamples)}
              disabled={isLoading}
              type="button"
            >
              {showExamples ? '▼' : '▶'} View Example Prompts ({examplePrompts.length})
            </button>

            {/* Examples List */}
            {showExamples && (
              <div className="prompt-examples-list">
                {/* Category Filter */}
                <div className="examples-category-filter">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`category-tag ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                      disabled={isLoading}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Example Prompts */}
                <div className="examples-items">
                  {filteredExamples.length > 0 ? (
                    filteredExamples.map((example, idx) => (
                      <div key={idx} className="example-item">
                        <button
                          className="example-button"
                          onClick={() => handleExampleClick(example.prompt)}
                          disabled={isLoading}
                        >
                          <div className="example-header">
                            <span className="example-title">{example.title}</span>
                            <span className="example-category-badge">{example.category}</span>
                          </div>
                          <p className="example-description">{example.description}</p>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-examples">No examples found for this category</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="prompt-modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-generate"
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            title={!isValid ? 'Enter 50-2000 characters' : ''}
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Generating...
              </>
            ) : (
              '✨ Generate Workspace'
            )}
          </button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="prompt-shortcut-hint">
          <small>Esc to close • Cmd+Enter to submit</small>
        </div>
      </div>
    </div>
  )
}

export default PromptInputModal
