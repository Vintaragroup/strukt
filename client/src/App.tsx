import React, { useState, useEffect } from 'react'
import Whiteboard from './pages/Whiteboard'
import './App.css'
import { UI_VERSION } from './uiVersion'

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize app
    setIsLoading(false)
    // Reflect UI version in the document title for quick verification
    const baseTitle = 'Visual Requirements Whiteboard'
    document.title = `${baseTitle} — ${UI_VERSION}`
  }, [])

  if (isLoading) {
    return <div className="app-loading">Loading...</div>
  }

  return (
    <div className="app">
      <Whiteboard />
    </div>
  )
}

export default App
