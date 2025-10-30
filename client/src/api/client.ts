import axios, { AxiosInstance, AxiosError } from 'axios'
import { Workspace, AIResponse } from '../types'
import ErrorHandler, { AppError } from '../utils/errorHandler'
import { globalResponseCache } from '../utils/performanceMonitor'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050'
const REQUEST_TIMEOUT = 15000 // 15 seconds
const WORKSPACE_UPDATE_TIMEOUT = 45000 // Auto-save can wait longer than default

// Optimized cache TTL values for different resource types (Task 3.9)
const CACHE_TTL = {
  WORKSPACE: 5 * 60 * 1000, // 5 minutes - stable metadata
  TEMPLATES: 30 * 60 * 1000, // 30 minutes - rarely change
  SEARCH_RESULTS: 10 * 60 * 1000, // 10 minutes - user-driven updates
  QUEUE_STATS: 2 * 60 * 1000, // 2 minutes - real-time updates needed
} as const

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT,
})

// Interceptor to add auth token if present
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

// Interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const appError = ErrorHandler.parseError(error)
    ErrorHandler.log(appError, 'API Response')
    return Promise.reject(appError)
  }
)

/**
 * Workspaces API
 */
export const workspacesAPI = {
  list: async (): Promise<Workspace[]> => {
    const cacheKey = 'workspaces_list'

    // Check cache first
    const cached = globalResponseCache.get(cacheKey)
    if (cached) {
      console.log('[API] Returning cached workspace list')
      return cached as Workspace[]
    }

    try {
      const { data } = await apiClient.get('/api/workspaces')
      // Cache the result (Task 3.9: 5 min TTL for stable metadata)
      globalResponseCache.set(cacheKey, data, CACHE_TTL.WORKSPACE)
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  get: async (name: string): Promise<Workspace> => {
    const cacheKey = `workspace_${name}`

    // Check cache first
    const cached = globalResponseCache.get(cacheKey)
    if (cached) {
      console.log(`[API] Returning cached workspace: ${name}`)
      return cached as Workspace
    }

    try {
      const { data } = await apiClient.get(`/api/workspaces/${name}`)
      // Cache individual workspace (Task 3.9: 5 min TTL)
      globalResponseCache.set(cacheKey, data, CACHE_TTL.WORKSPACE)
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  create: async (workspace: Omit<Workspace, '_id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> => {
    try {
      const { data } = await apiClient.post('/api/workspaces', workspace)
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  update: async (name: string, workspace: Partial<Workspace>): Promise<Workspace> => {
    try {
      const { data } = await apiClient.put(`/api/workspaces/${name}`, workspace, {
        timeout: WORKSPACE_UPDATE_TIMEOUT,
      })
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  delete: async (name: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/workspaces/${name}`)
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },
}

/**
 * AI Suggestions API
 */
export const aiAPI = {
  suggest: async (workspaceData: { nodes: any[]; edges: any[]; goal?: string }): Promise<AIResponse> => {
    try {
      const { data } = await apiClient.post('/api/ai/suggest', workspaceData)
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  generate: async (prompt: string): Promise<{
    success: boolean
    source: 'openai' | 'heuristic' | 'heuristic-fallback'
    workspace: {
      nodes: any[]
      edges: any[]
    }
    message: string
  }> => {
    try {
      const { data } = await apiClient.post('/api/ai/generate', { prompt })
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  generateWithRetry: async (prompt: string, workspaceId: string): Promise<{
    success: boolean
    parsed: { nodes: any[]; edges: any[]; summary: string }
    tokensUsed: { total: number }
    generationTime: string
    retryAttempted: boolean
  }> => {
    try {
      const { data } = await apiClient.post('/api/generation/generate-with-retry', {
        workspaceId,
        userPrompt: prompt,
      })
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  generateQueued: async (prompt: string, workspaceId: string): Promise<{
    success: boolean
    jobId: string
    status: string
    message: string
  }> => {
    try {
      const { data } = await apiClient.post('/api/generation/generate-queued', {
        workspaceId,
        userPrompt: prompt,
      })
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  getQueueStatus: async (jobId: string): Promise<{
    success: boolean
    jobId: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    createdAt: string
    startedAt?: string
    completedAt?: string
    progress: { pending: boolean; processing: boolean; completed: boolean; failed: boolean }
    retryCount: number
    error?: string
  }> => {
    try {
      const { data } = await apiClient.get(`/api/generation/queue/${jobId}/status`)
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  getQueueResult: async (jobId: string): Promise<{
    success: boolean
    jobId: string
    status: string
    result: {
      success: boolean
      parsed: { nodes: any[]; edges: any[]; summary: string }
      tokensUsed: number
      generationTime: number
    }
    completedAt: string
  }> => {
    try {
      const { data } = await apiClient.get(`/api/generation/queue/${jobId}/result`)
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },

  getQueueStats: async (): Promise<{
    success: boolean
    queue: { queueSize: number; activeJobs: number; totalProcessed: number }
    circuitBreaker: { state: string; failureCount: number; successCount: number }
  }> => {
    try {
      const { data } = await apiClient.get('/api/generation/queue/stats')
      return data
    } catch (error) {
      const appError = ErrorHandler.parseError(error)
      throw appError
    }
  },
}

/**
 * Error handling utilities
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Object && 'message' in error) {
    // AppError from our error handler
    if ('severity' in error && 'code' in error) {
      return ErrorHandler.getUserMessage(error as AppError)
    }
    // Regular error message
    return (error as any).message
  }

  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Object && 'shouldRetry' in error) {
    return (error as AppError).shouldRetry
  }

  if (axios.isAxiosError(error)) {
    // Retry on 5xx errors or timeout
    return error.response?.status ? error.response.status >= 500 : error.code === 'ECONNABORTED'
  }

  return false
}

/**
 * Get retry delay in milliseconds
 */
export const getRetryDelay = (error: unknown, attempt: number = 0): number => {
  if (error instanceof Object && 'retryAfter' in error && (error as AppError).retryAfter) {
    return (error as AppError).retryAfter || 1000
  }

  // Exponential backoff: 1s, 2s, 4s, 8s
  return Math.min(1000 * Math.pow(2, attempt), 8000)
}

export default apiClient
