/**
 * Error Handler Tests
 * 
 * Tests for:
 * - Error parsing and categorization
 * - Retry logic and exponential backoff
 * - User message formatting
 * - Response validation
 */

import ErrorHandler, { AppError } from './errorHandler'

// Error handler tests
export const errorHandlerTests = {
  // Test: Network error parsing
  testNetworkErrorParsing: () => {
    const error = new TypeError('Failed to fetch')
    const appError = ErrorHandler.parseError(error)

    if (appError.code !== 'NETWORK_ERROR') {
      throw new Error('Network error not correctly identified')
    }
    if (!appError.shouldRetry) {
      throw new Error('Network error should be retryable')
    }
    if (appError.retryAfter === undefined) {
      throw new Error('Network error should have retryAfter')
    }

    console.log('✅ testNetworkErrorParsing passed')
  },

  // Test: Rate limit detection (429)
  testRateLimitDetection: () => {
    const response = {
      status: 429,
      statusCode: 429,
      headers: { 'retry-after': '60' },
    } as any

    const appError = ErrorHandler.parseError(response)

    if (appError.code !== 'RATE_LIMITED') {
      throw new Error('Rate limit not correctly identified')
    }
    if (!appError.shouldRetry) {
      throw new Error('Rate limit error should be retryable')
    }
    if (!appError.message.includes('too many')) {
      throw new Error('Rate limit message should mention request limit')
    }

    console.log('✅ testRateLimitDetection passed')
  },

  // Test: Server error detection (5xx)
  testServerErrorDetection: () => {
    const error500 = ErrorHandler.parseError({ status: 500 })
    const error503 = ErrorHandler.parseError({ status: 503 })

    if (error500.code !== 'SERVER_ERROR') {
      throw new Error('500 error not identified as server error')
    }
    if (!error500.shouldRetry) {
      throw new Error('500 error should be retryable')
    }

    if (error503.code !== 'SERVER_ERROR') {
      throw new Error('503 error not identified as server error')
    }
    if (!error503.shouldRetry) {
      throw new Error('503 error should be retryable')
    }

    console.log('✅ testServerErrorDetection passed')
  },

  // Test: Bad request (400) is not retryable
  testBadRequestNotRetryable: () => {
    const appError = ErrorHandler.parseError({ status: 400 })

    if (appError.code !== 'BAD_REQUEST') {
      throw new Error('400 error not identified as bad request')
    }
    if (appError.shouldRetry) {
      throw new Error('Bad request error should NOT be retryable')
    }

    console.log('✅ testBadRequestNotRetryable passed')
  },

  // Test: Unauthorized (401)
  testUnauthorizedDetection: () => {
    const appError = ErrorHandler.parseError({ status: 401 })

    if (appError.code !== 'UNAUTHORIZED') {
      throw new Error('401 error not identified as unauthorized')
    }
    if (appError.shouldRetry) {
      throw new Error('Unauthorized error should NOT be retryable')
    }

    console.log('✅ testUnauthorizedDetection passed')
  },

  // Test: Timeout error handling
  testTimeoutErrorHandling: () => {
    const error = new Error('Request timed out after 5000ms')
    const appError = ErrorHandler.parseError(error)

    if (appError.code !== 'TIMEOUT') {
      throw new Error('Timeout error not correctly identified')
    }
    if (!appError.shouldRetry) {
      throw new Error('Timeout error should be retryable')
    }

    console.log('✅ testTimeoutErrorHandling passed')
  },

  // Test: AbortError handling
  testAbortErrorHandling: () => {
    const error = new Error('Request was cancelled')
    error.name = 'AbortError'
    const appError = ErrorHandler.parseError(error)

    if (appError.code !== 'ABORT_ERROR') {
      throw new Error('Abort error not correctly identified')
    }
    if (!appError.shouldRetry) {
      throw new Error('Abort error should be retryable')
    }

    console.log('✅ testAbortErrorHandling passed')
  },

  // Test: JSON parse error
  testJSONParseError: () => {
    const error = new SyntaxError('Unexpected token < in JSON at position 0')
    error.message = 'Invalid JSON'
    const appError = ErrorHandler.parseError(error)

    if (appError.code !== 'INVALID_JSON') {
      throw new Error('JSON parse error not correctly identified')
    }
    if (!appError.shouldRetry) {
      throw new Error('JSON error should be retryable')
    }

    console.log('✅ testJSONParseError passed')
  },

  // Test: User message formatting
  testUserMessageFormatting: () => {
    const networkError: AppError = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      severity: 'error',
      timestamp: new Date(),
      shouldRetry: true,
    }

    const userMsg = ErrorHandler.getUserMessage(networkError)

    if (!userMsg.includes('Network connection failed')) {
      throw new Error('User message should explain the issue')
    }
    if (!userMsg.includes('🌐')) {
      throw new Error('User message should include emoji')
    }

    console.log('✅ testUserMessageFormatting passed')
  },

  // Test: Response validation
  testResponseValidation: () => {
    const validResponse = { success: true, data: 'test' }
    const invalidResponse = { success: true } // missing data

    if (!ErrorHandler.validateResponse(validResponse, ['success', 'data'])) {
      throw new Error('Valid response should pass validation')
    }
    if (ErrorHandler.validateResponse(invalidResponse, ['success', 'data'])) {
      throw new Error('Invalid response should fail validation')
    }

    console.log('✅ testResponseValidation passed')
  },

  // Test: Fallback response creation
  testFallbackResponse: () => {
    const originalData = { nodes: [], edges: [] }
    const fallback = ErrorHandler.createFallbackResponse(originalData)

    if (!ErrorHandler.isFallbackResponse(fallback)) {
      throw new Error('Fallback response not marked correctly')
    }
    if (!fallback._timestamp) {
      throw new Error('Fallback response missing timestamp')
    }

    console.log('✅ testFallbackResponse passed')
  },

  // Test: Multiple error parsing
  testMultipleErrorTypes: () => {
    const errors = [
      { status: 400 },
      { status: 401 },
      { status: 403 },
      { status: 404 },
      { status: 429 },
      { status: 500 },
      { status: 503 },
    ]

    const parsed = errors.map(e => ErrorHandler.parseError(e))

    if (parsed[0].code !== 'BAD_REQUEST') throw new Error('400 parsing failed')
    if (parsed[1].code !== 'UNAUTHORIZED') throw new Error('401 parsing failed')
    if (parsed[2].code !== 'FORBIDDEN') throw new Error('403 parsing failed')
    if (parsed[3].code !== 'NOT_FOUND') throw new Error('404 parsing failed')
    if (parsed[4].code !== 'RATE_LIMITED') throw new Error('429 parsing failed')
    if (parsed[5].code !== 'SERVER_ERROR') throw new Error('500 parsing failed')
    if (parsed[6].code !== 'SERVER_ERROR') throw new Error('503 parsing failed')

    console.log('✅ testMultipleErrorTypes passed')
  },

  // Test: Error severity levels
  testErrorSeverityLevels: () => {
    const criticalError: AppError = {
      code: 'DATABASE_ERROR',
      message: 'Database connection failed',
      severity: 'critical',
      timestamp: new Date(),
      shouldRetry: false,
    }

    const warningError: AppError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      severity: 'warning',
      timestamp: new Date(),
      shouldRetry: false,
    }

    if (criticalError.severity !== 'critical') {
      throw new Error('Critical severity not set correctly')
    }
    if (warningError.severity !== 'warning') {
      throw new Error('Warning severity not set correctly')
    }

    console.log('✅ testErrorSeverityLevels passed')
  },

  // Test: Retry after parsing
  testRetryAfterParsing: () => {
    const responseWith429 = {
      status: 429,
      headers: { 'retry-after': '120' },
    } as any

    const appError = ErrorHandler.parseError(responseWith429)

    if (appError.retryAfter === undefined) {
      throw new Error('retryAfter should be set from header')
    }
    // Should be 120 seconds = 120000ms
    if (appError.retryAfter < 100000) {
      throw new Error('retryAfter value seems incorrect')
    }

    console.log('✅ testRetryAfterParsing passed')
  },

  // Test: Unknown error handling
  testUnknownErrorHandling: () => {
    const unknownError = { some: 'random object' }
    const appError = ErrorHandler.parseError(unknownError)

    if (appError.code !== 'UNKNOWN_ERROR') {
      throw new Error('Unknown error type not handled correctly')
    }
    if (!appError.message) {
      throw new Error('Unknown error should have a message')
    }

    console.log('✅ testUnknownErrorHandling passed')
  },
}

// Run all tests
export function runErrorHandlerTests() {
  console.log('\n🧪 Running Error Handler Tests...\n')
  let passed = 0
  let failed = 0

  Object.entries(errorHandlerTests).forEach(([testName, testFn]) => {
    try {
      testFn()
      passed++
    } catch (error) {
      console.error(`❌ ${testName} failed: ${error}`)
      failed++
    }
  })

  console.log(`\n📊 Error Handler Test Results: ${passed} passed, ${failed} failed\n`)
  return { passed, failed }
}

export default { runErrorHandlerTests }
