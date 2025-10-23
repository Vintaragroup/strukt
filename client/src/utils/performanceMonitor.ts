/**
 * Performance Monitoring & Optimization Utilities
 * 
 * Features:
 * - Request debouncing and throttling
 * - Response caching with TTL
 * - Lazy loading helpers
 * - Performance metrics collection
 * - Bundle analysis utilities
 * - Memory management
 */

/**
 * Cache entry with time-to-live
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

/**
 * Simple LRU cache for API responses
 */
export class ResponseCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private readonly maxSize: number = 50

  /**
   * Get cached value if not expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cache value with TTL
   */
  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  /**
   * Clear specific key or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number; entries: Array<{ key: string; age: number }> } {
    const now = Date.now()
    const entries: Array<{ key: string; age: number }> = []

    this.cache.forEach((entry, key) => {
      entries.push({
        key,
        age: now - entry.timestamp,
      })
    })

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: entries.sort((a, b) => b.age - a.age),
    }
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delayMs)
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delayMs) {
      fn(...args)
      lastCall = now
    }
  }
}

/**
 * Lazy load a module
 */
export async function lazyLoad<T>(loader: () => Promise<T>): Promise<T> {
  return loader()
}

/**
 * Performance metrics
 */
export interface PerformanceMetric {
  name: string
  duration: number // milliseconds
  startTime: number
  endTime: number
  metadata?: Record<string, any>
}

/**
 * Performance tracker
 */
export class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private marks: Map<string, number> = new Map()
  private readonly maxMetricsPerName = 100

  /**
   * Mark start of operation
   */
  mark(name: string): void {
    this.marks.set(name, Date.now())
  }

  /**
   * Record duration of operation
   */
  measure(name: string, metadata?: Record<string, any>): number {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`No mark found for "${name}". Call mark() first.`)
      return 0
    }

    const now = Date.now()
    const duration = now - startTime

    const metric: PerformanceMetric = {
      name,
      duration,
      startTime,
      endTime: now,
      metadata,
    }

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metricsForName = this.metrics.get(name)!
    if (metricsForName.length >= this.maxMetricsPerName) {
      metricsForName.shift()
    }
    metricsForName.push(metric)

    // Clean up mark
    this.marks.delete(name)

    return duration
  }

  /**
   * Get average duration for operation
   */
  getAverage(name: string): number | null {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return null

    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  /**
   * Get all metrics for operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || []
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; average: number; min: number; max: number }> = {}

    this.metrics.forEach((metrics, name) => {
      if (metrics.length === 0) return

      const durations = metrics.map(m => m.duration)
      const total = durations.reduce((sum, d) => sum + d, 0)

      summary[name] = {
        count: metrics.length,
        average: total / metrics.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
      }
    })

    return summary
  }

  /**
   * Clear metrics
   */
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name)
      this.marks.delete(name)
    } else {
      this.metrics.clear()
      this.marks.clear()
    }
  }

  /**
   * Log metrics to console
   */
  log(name?: string): void {
    if (name) {
      const metrics = this.getMetrics(name)
      const avg = this.getAverage(name)
      console.table({
        name,
        count: metrics.length,
        average: avg?.toFixed(2),
        min: Math.min(...metrics.map(m => m.duration)),
        max: Math.max(...metrics.map(m => m.duration)),
      })
    } else {
      console.table(this.getSummary())
    }
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>()

  return function (...args: Parameters<T>) {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value as string | undefined
      if (firstKey) {
        cache.delete(firstKey)
      }
    }

    return result
  } as T
}

/**
 * Batch operations to reduce re-renders
 */
export class OperationBatcher {
  private operations: Array<() => void> = []
  private isScheduled = false
  private delayMs: number

  constructor(delayMs: number = 16) {
    this.delayMs = delayMs
  }

  /**
   * Queue an operation
   */
  queue(fn: () => void): void {
    this.operations.push(fn)

    if (!this.isScheduled) {
      this.isScheduled = true
      setTimeout(() => this.flush(), this.delayMs)
    }
  }

  /**
   * Execute all queued operations
   */
  flush(): void {
    const ops = this.operations
    this.operations = []
    this.isScheduled = false

    ops.forEach(op => {
      try {
        op()
      } catch (error) {
        console.error('Error in batched operation:', error)
      }
    })
  }

  /**
   * Get queued operation count
   */
  count(): number {
    return this.operations.length
  }

  /**
   * Clear all queued operations
   */
  clear(): void {
    this.operations = []
    this.isScheduled = false
  }
}

/**
 * Request deduplicator - prevents multiple identical requests
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map()

  /**
   * Execute request, returning cached promise if duplicate
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Return existing promise if one is in flight
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }

    // Create new promise
    const promise = fn()
      .then(result => {
        this.pending.delete(key)
        return result
      })
      .catch(error => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, promise)
    return promise
  }

  /**
   * Get pending request count
   */
  pendingCount(): number {
    return this.pending.size
  }

  /**
   * Cancel pending request
   */
  cancel(key: string): void {
    this.pending.delete(key)
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pending.clear()
  }
}

/**
 * Global performance tracker instance
 */
export const globalPerformanceTracker = new PerformanceTracker()

/**
 * Global cache instance
 */
export const globalResponseCache = new ResponseCache()

/**
 * Global request deduplicator
 */
export const globalRequestDeduplicator = new RequestDeduplicator()

/**
 * Helper to measure operation duration
 */
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  globalPerformanceTracker.mark(name)
  return fn()
    .then(result => {
      const duration = globalPerformanceTracker.measure(name)
      console.log(`[${name}] completed in ${duration}ms`)
      return result
    })
    .catch(error => {
      globalPerformanceTracker.measure(name)
      throw error
    })
}

/**
 * Helper to measure operation duration (synchronous)
 */
export function measure<T>(name: string, fn: () => T): T {
  globalPerformanceTracker.mark(name)
  const result = fn()
  const duration = globalPerformanceTracker.measure(name)
  console.log(`[${name}] completed in ${duration}ms`)
  return result
}

export default {
  ResponseCache,
  PerformanceTracker,
  OperationBatcher,
  RequestDeduplicator,
  debounce,
  throttle,
  lazyLoad,
  memoize,
  measureAsync,
  measure,
  globalPerformanceTracker,
  globalResponseCache,
  globalRequestDeduplicator,
}
