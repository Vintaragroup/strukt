/**
 * Error Handling Utilities
 * 
 * Comprehensive error handling with:
 * - Network error detection and recovery
 * - Timeout handling with retry logic
 * - Rate limit detection and backoff
 * - Invalid response validation
 * - User-friendly error messages
 * - Error tracking and logging
 * - Fallback strategies
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AppError {
  code: string
  message: string
  severity: ErrorSeverity
  details?: any
  timestamp: Date
  shouldRetry: boolean
  retryAfter?: number // milliseconds
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAYS = [1000, 2000, 4000] // exponential backoff
  private static readonly REQUEST_TIMEOUT = 15000 // 15 seconds

  /**
   * Parse and normalize various error types into AppError
   */
  static parseError(error: unknown): AppError {
    const now = new Date()

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        severity: 'error',
        details: { originalError: error.message },
        timestamp: now,
        shouldRetry: true,
        retryAfter: this.RETRY_DELAYS[0],
      }
    }

    // API error responses
    if (error instanceof Response || (error && typeof error === 'object' && 'status' in error)) {
      const response = error as any
      const status = response.status || response.statusCode

      switch (status) {
        case 400:
          return {
            code: 'BAD_REQUEST',
            message: 'Invalid request. Please check your input.',
            severity: 'warning',
            details: response.data,
            timestamp: now,
            shouldRetry: false,
          }

        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Please log in.',
            severity: 'error',
            details: { status },
            timestamp: now,
            shouldRetry: false,
          }

        case 403:
          return {
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action.',
            severity: 'error',
            details: { status },
            timestamp: now,
            shouldRetry: false,
          }

        case 404:
          return {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found.',
            severity: 'warning',
            details: { status },
            timestamp: now,
            shouldRetry: false,
          }

        case 429:
          return {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment before trying again.',
            severity: 'warning',
            details: { status },
            timestamp: now,
            shouldRetry: true,
            retryAfter: this.parseRetryAfter(response),
          }

        case 500:
        case 502:
        case 503:
        case 504:
          return {
            code: 'SERVER_ERROR',
            message: 'Server error. The service is temporarily unavailable. Please try again later.',
            severity: 'error',
            details: { status },
            timestamp: now,
            shouldRetry: true,
            retryAfter: this.RETRY_DELAYS[0],
          }

        default:
          return {
            code: `HTTP_${status}`,
            message: `HTTP error ${status}. Please try again.`,
            severity: 'error',
            details: { status },
            timestamp: now,
            shouldRetry: status >= 500,
          }
      }
    }

    // Timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. The server took too long to respond. Please try again.',
        severity: 'warning',
        details: { originalError: error.message },
        timestamp: now,
        shouldRetry: true,
        retryAfter: this.RETRY_DELAYS[0],
      }
    }

    // AbortError from fetch
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        code: 'ABORT_ERROR',
        message: 'Request was cancelled. Please try again.',
        severity: 'info',
        details: { originalError: error.message },
        timestamp: now,
        shouldRetry: true,
      }
    }

    // JSON parse errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        code: 'INVALID_JSON',
        message: 'Server returned invalid data. Please try again.',
        severity: 'error',
        details: { originalError: error.message },
        timestamp: now,
        shouldRetry: true,
        retryAfter: this.RETRY_DELAYS[0],
      }
    }

    // Validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        severity: 'warning',
        details: { originalError: error },
        timestamp: now,
        shouldRetry: false,
      }
    }

    // Generic error
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred. Please try again.',
        severity: 'error',
        details: { originalError: error },
        timestamp: now,
        shouldRetry: false,
      }
    }

    // Fallback for non-Error objects
    return {
      code: 'UNKNOWN_ERROR',
      message: String(error) || 'An unexpected error occurred. Please try again.',
      severity: 'error',
      details: { originalError: error },
      timestamp: now,
      shouldRetry: false,
    }
  }

  /**
   * Extract retry-after value from response headers
   */
  private static parseRetryAfter(response: any): number {
    if (!response.headers) return this.RETRY_DELAYS[0]

    const retryAfter = response.headers.get?.('retry-after') || response.headers['retry-after']

    if (!retryAfter) return this.RETRY_DELAYS[0]

    // If it's a number, assume seconds
    const seconds = parseInt(retryAfter, 10)
    if (!isNaN(seconds)) {
      return seconds * 1000
    }

    // Otherwise assume HTTP date
    const date = new Date(retryAfter)
    const now = new Date()
    const delay = date.getTime() - now.getTime()
    return Math.max(delay, this.RETRY_DELAYS[0])
  }

  /**
   * Validates API response format
   */
  static validateResponse(response: any, expectedFields?: string[]): boolean {
    if (!response || typeof response !== 'object') {
      return false
    }

    if (expectedFields) {
      return expectedFields.every(field => field in response)
    }

    return true
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting ${operationName} (${attempt + 1}/${maxRetries + 1})...`)
        return await this.withTimeout(operation(), this.REQUEST_TIMEOUT)
      } catch (error) {
        lastError = error as Error
        const appError = this.parseError(error)

        if (!appError.shouldRetry || attempt === maxRetries) {
          throw appError
        }

        const delayMs = this.RETRY_DELAYS[Math.min(attempt, this.RETRY_DELAYS.length - 1)]
        console.warn(
          `${operationName} failed (${appError.code}). Retrying in ${delayMs}ms...`
        )

        await this.delay(delayMs)
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  /**
   * Execute operation with timeout
   */
  private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      promise
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * Delay for a given number of milliseconds
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    const messages: { [key: string]: string } = {
      NETWORK_ERROR: '🌐 Network connection failed. Please check your internet.',
      TIMEOUT: '⏱️ Request timed out. Please try again.',
      RATE_LIMITED: '⏱️ Too many requests. Please wait before trying again.',
      SERVER_ERROR: '🔧 Server error. Our team has been notified. Please try again later.',
      BAD_REQUEST: '❌ Invalid request. Please check your input.',
      UNAUTHORIZED: '🔐 Please log in to continue.',
      FORBIDDEN: '🚫 You do not have permission for this action.',
      NOT_FOUND: '❓ The requested resource was not found.',
      INVALID_JSON: '📦 Invalid response from server. Please try again.',
      VALIDATION_ERROR: `⚠️ ${error.message}`,
      ABORT_ERROR: '⏹️ Request was cancelled. Please try again.',
      UNKNOWN_ERROR: '❌ An unexpected error occurred. Please try again.',
    }

    return messages[error.code] || messages.UNKNOWN_ERROR
  }

  /**
   * Log error for debugging
   */
  static log(error: AppError, context: string = 'App'): void {
    const logLevel =
      error.severity === 'critical' ? 'error' :
      error.severity === 'error' ? 'error' :
      error.severity === 'warning' ? 'warn' :
      'info'

    console[logLevel](
      `[${context}] ${error.code}: ${error.message}`,
      {
        severity: error.severity,
        timestamp: error.timestamp,
        details: error.details,
        shouldRetry: error.shouldRetry,
      }
    )
  }

  /**
   * Create fallback response for offline or failed requests
   */
  static createFallbackResponse<T>(data: T): T & { _isFallback: true; _timestamp: Date } {
    return {
      ...data,
      _isFallback: true,
      _timestamp: new Date(),
    } as any
  }

  /**
   * Check if response is from fallback
   */
  static isFallbackResponse(response: any): boolean {
    return response && response._isFallback === true
  }
}

/**
 * Fetch wrapper with built-in error handling and retries
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { maxRetries?: number; timeout?: number } = {}
): Promise<Response> {
  const { maxRetries = 3, timeout = 15000, ...fetchOptions } = options

  const operation = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        ;(error as any).response = response
        throw error
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  return ErrorHandler.retry(operation, maxRetries, `fetch ${url}`)
}

/**
 * API call wrapper with automatic error handling
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit & { expectedFields?: string[] } = {}
): Promise<T> {
  const { expectedFields, ...fetchOptions } = options

  try {
    const response = await fetchWithRetry(url, fetchOptions)
    const data = await response.json()

    // Validate response format
    if (!ErrorHandler.validateResponse(data, expectedFields)) {
      throw new Error('Invalid response format from server')
    }

    return data as T
  } catch (error) {
    const appError = ErrorHandler.parseError(error)
    ErrorHandler.log(appError, 'API Call')
    throw appError
  }
}

export default ErrorHandler
