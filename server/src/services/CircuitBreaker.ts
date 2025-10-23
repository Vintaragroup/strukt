/**
 * CircuitBreaker implements the circuit breaker pattern to prevent cascading failures
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery) → CLOSED
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;

  // Configuration
  private readonly failureThreshold: number = 5; // Open after 5 failures
  private readonly resetTimeout: number = 60000; // Try recovery after 60 seconds
  private readonly successThreshold: number = 2; // Need 2 successes in HALF_OPEN to close

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && this.shouldAttemptReset()) {
      console.log('CircuitBreaker: Attempting recovery (HALF_OPEN)');
      this.changeState('HALF_OPEN');
      this.successCount = 0;
    }

    // Reject requests if circuit is open
    if (this.state === 'OPEN') {
      throw new Error(
        `CircuitBreaker OPEN: Service is not available. Last failure: ${
          Date.now() - this.lastFailureTime
        }ms ago`
      );
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Manually close the circuit (for testing or recovery)
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.changeState('CLOSED');
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get stats for monitoring
   */
  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Record successful operation
   */
  private recordSuccess(): void {
    this.failureCount = 0; // Reset failures on success

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        console.log(
          `CircuitBreaker: Service recovered after ${this.successCount} successes`
        );
        this.changeState('CLOSED');
        this.successCount = 0;
      }
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0; // Reset success counter on failure

    if (this.state === 'HALF_OPEN') {
      console.log('CircuitBreaker: Recovery failed, returning to OPEN');
      this.changeState('OPEN');
    } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      console.log(
        `CircuitBreaker: Failure threshold reached (${this.failureCount}/${this.failureThreshold}), opening circuit`
      );
      this.changeState('OPEN');
    }
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.resetTimeout;
  }

  /**
   * Change state and log transition
   */
  private changeState(newState: CircuitState): void {
    if (newState !== this.state) {
      const transitionMsg = `CircuitBreaker: ${this.state} → ${newState}`;
      console.log(transitionMsg);
      this.state = newState;

      // Reset counters on transitions
      if (newState === 'CLOSED') {
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }
}

export default new CircuitBreaker();
