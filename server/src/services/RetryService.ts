import { GenerationResponse } from './GenerationService.js';

/**
 * RetryService handles automatic retry logic with exponential backoff
 * Provides fallback to smaller model on specific errors
 */
export class RetryService {
  private readonly defaultMaxRetries = 4;
  private readonly defaultInitialDelay = 1000; // 1 second
  private readonly defaultMaxDelay = 8000; // 8 seconds

  /**
   * Retry an operation with exponential backoff
   * Delays: 1s, 2s, 4s, 8s (max 4 retries)
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.defaultMaxRetries,
    initialDelay: number = this.defaultInitialDelay,
    maxDelay: number = this.defaultMaxDelay
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on non-retryable errors
        if (!this.isRetryableError(error)) {
          throw lastError;
        }

        // Don't sleep after last attempt
        if (attempt < maxRetries) {
          const delay = this.getBackoffDelay(attempt, initialDelay, maxDelay);
          console.log(
            `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms for error: ${
              lastError.message
            }`
          );
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Operation failed after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Calculate exponential backoff delay
   * Formula: min(initialDelay * 2^attempt, maxDelay) + jitter
   */
  private getBackoffDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number
  ): number {
    // Exponential: 1s, 2s, 4s, 8s...
    const exponentialDelay = initialDelay * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, maxDelay);

    // Add small random jitter (0-100ms) to prevent thundering herd
    const jitter = Math.random() * 100;
    return cappedDelay + jitter;
  }

  /**
   * Check if error is retryable
   * Rate limits (429), timeouts (408), temporary failures should retry
   * Auth errors (401, 403) and not found (404) should not
   */
  private isRetryableError(error: any): boolean {
    // Check for rate limit
    if (error?.status === 429) {
      return true;
    }

    // Check for timeout
    if (error?.status === 408) {
      return true;
    }

    // Check for service unavailable
    if (error?.status === 503) {
      return true;
    }

    // Check for bad gateway
    if (error?.status === 502) {
      return true;
    }

    // Check for network errors
    if (error?.message?.includes('ECONNREFUSED')) {
      return true;
    }

    if (error?.message?.includes('ETIMEDOUT')) {
      return true;
    }

    if (error?.message?.includes('timeout')) {
      return true;
    }

    // Default: not retryable
    return false;
  }

  /**
   * Check if error is a rate limit error
   * Used to determine if fallback to mini model should be attempted
   */
  isRateLimitError(error: any): boolean {
    return error?.status === 429 || error?.message?.includes('rate limit');
  }

  /**
   * Check if error is an API key error
   */
  isApiKeyError(error: any): boolean {
    return error?.status === 401 || error?.message?.includes('API key');
  }

  /**
   * Get error category for logging
   */
  getErrorCategory(error: any): string {
    if (this.isRateLimitError(error)) {
      return 'RATE_LIMIT';
    }
    if (this.isApiKeyError(error)) {
      return 'API_KEY';
    }
    if (error?.status === 408) {
      return 'TIMEOUT';
    }
    if (error?.status === 503) {
      return 'SERVICE_UNAVAILABLE';
    }
    if (error?.message?.includes('network')) {
      return 'NETWORK_ERROR';
    }
    return 'UNKNOWN';
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new RetryService();
