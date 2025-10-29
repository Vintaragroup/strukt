import React from 'react'

type ErrorBoundaryState = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
          <div className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm max-w-md text-center">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-4">An unexpected error occurred while rendering the canvas.</p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-sm px-3 py-2 hover:bg-indigo-700 shadow"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
