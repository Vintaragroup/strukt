import React, { useState, useEffect } from 'react'
import { aiAPI, getErrorMessage } from '../api/client'
import { QueueJob, QueueStats, CircuitBreakerStats } from '../types'
import './QueueStatus.css'

interface QueueStatusPanelProps {
  isOpen: boolean
  onClose: () => void
  onJobComplete?: (jobId: string, result: any) => void
}

/**
 * QueueStatusPanel
 * 
 * Displays real-time queue status with:
 * - Active job list with status indicators
 * - Queue statistics (pending, active, processed)
 * - Circuit breaker state
 * - Auto-refresh every 2 seconds
 * - Job details on click
 */
const QueueStatusPanel: React.FC<QueueStatusPanelProps> = ({
  isOpen,
  onClose,
  onJobComplete,
}) => {
  const [jobs, setJobs] = useState<Map<string, QueueJob>>(new Map())
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerStats | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [jobResult, setJobResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch queue status
  const fetchQueueStatus = async () => {
    setIsRefreshing(true)
    try {
      const statsData = await aiAPI.getQueueStats()
      setStats(statsData.queue)
      const cbState: CircuitBreakerStats = {
        state: (statsData.circuitBreaker.state as 'CLOSED' | 'OPEN' | 'HALF_OPEN'),
        failureCount: statsData.circuitBreaker.failureCount,
        successCount: statsData.circuitBreaker.successCount,
      }
      setCircuitBreaker(cbState)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
      console.error('Failed to fetch queue stats:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch job status
  const fetchJobStatus = async (jobId: string) => {
    try {
      const jobStatus = await aiAPI.getQueueStatus(jobId)
      
      const updatedJobs = new Map(jobs)
      updatedJobs.set(jobId, {
        jobId,
        status: jobStatus.status,
        createdAt: jobStatus.createdAt,
        startedAt: jobStatus.startedAt,
        completedAt: jobStatus.completedAt,
        retryCount: jobStatus.retryCount,
        error: jobStatus.error,
        progress: jobStatus.progress,
      })
      setJobs(updatedJobs)

      // Auto-fetch result when completed
      if (jobStatus.status === 'COMPLETED' && onJobComplete) {
        try {
          const result = await aiAPI.getQueueResult(jobId)
          onJobComplete(jobId, result.result)
        } catch (err) {
          console.error('Failed to fetch job result:', err)
        }
      }

      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
      console.error('Failed to fetch job status:', err)
    }
  }

  // Get selected job result
  const fetchJobResult = async (jobId: string) => {
    try {
      const result = await aiAPI.getQueueResult(jobId)
      setJobResult(result)
      setError(null)
    } catch (err) {
      // Job might not be completed yet
      const errorMsg = getErrorMessage(err)
      if (errorMsg.includes('not yet complete')) {
        setJobResult(null)
      } else {
        setError(errorMsg)
      }
    }
  }

  // Polling effect
  useEffect(() => {
    if (!isOpen) return

    // Initial fetch
    fetchQueueStatus()

    // Fetch status for all tracked jobs
    jobs.forEach((_, jobId) => {
      fetchJobStatus(jobId)
    })

    // If a job is selected, try to fetch its result
    if (selectedJob) {
      fetchJobResult(selectedJob)
    }

    // Set up polling interval (2 seconds)
    const pollInterval = setInterval(() => {
      fetchQueueStatus()

      jobs.forEach((_, jobId) => {
        fetchJobStatus(jobId)
      })

      if (selectedJob) {
        fetchJobResult(selectedJob)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [isOpen, jobs, selectedJob])

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '⏳'
      case 'PROCESSING':
        return '⚙️'
      case 'COMPLETED':
        return '✅'
      case 'FAILED':
        return '❌'
      default:
        return '❓'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'status-pending'
      case 'PROCESSING':
        return 'status-processing'
      case 'COMPLETED':
        return 'status-completed'
      case 'FAILED':
        return 'status-failed'
      default:
        return 'status-unknown'
    }
  }

  const getCircuitBreakerColor = (state: string): string => {
    switch (state) {
      case 'CLOSED':
        return 'cb-closed'
      case 'OPEN':
        return 'cb-open'
      case 'HALF_OPEN':
        return 'cb-half-open'
      default:
        return 'cb-unknown'
    }
  }

  const formatTime = (dateStr?: string): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleTimeString()
  }

  const getElapsedTime = (createdAt: string, completedAt?: string): string => {
    const start = new Date(createdAt).getTime()
    const end = completedAt ? new Date(completedAt).getTime() : Date.now()
    const elapsed = (end - start) / 1000
    return `${elapsed.toFixed(1)}s`
  }

  if (!isOpen) return null

  const jobArray = Array.from(jobs.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="queue-status-overlay" onClick={onClose}>
      <div className="queue-status-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="queue-header">
          <div>
            <h2>📊 Queue Status</h2>
            <p className="queue-subtitle">Real-time generation queue monitoring</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="queue-content">
          {error && <div className="queue-error">Error: {error}</div>}

          {/* Statistics Section */}
          {stats && (
            <div className="queue-stats-section">
              <h3>📈 Queue Statistics</h3>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-value">{stats.queueSize}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{stats.activeJobs}</div>
                  <div className="stat-label">Active</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{stats.totalProcessed}</div>
                  <div className="stat-label">Processed</div>
                </div>
              </div>
            </div>
          )}

          {/* Circuit Breaker Section */}
          {circuitBreaker && (
            <div className="circuit-breaker-section">
              <h3>🔌 Circuit Breaker</h3>
              <div className={`cb-status ${getCircuitBreakerColor(circuitBreaker.state)}`}>
                <div className="cb-state">{circuitBreaker.state}</div>
                <div className="cb-details">
                  <span>Failures: {circuitBreaker.failureCount}</span>
                  <span>Successes: {circuitBreaker.successCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Jobs Section */}
          <div className="jobs-section">
            <h3>📋 Active Jobs ({jobArray.length})</h3>
            {jobArray.length === 0 ? (
              <div className="no-jobs">
                <p>No jobs in queue</p>
              </div>
            ) : (
              <div className="jobs-list">
                {jobArray.map((job) => (
                  <div
                    key={job.jobId}
                    className={`job-item ${getStatusColor(job.status)} ${
                      selectedJob === job.jobId ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedJob(job.jobId)}
                  >
                    <div className="job-header">
                      <span className="job-icon">{getStatusIcon(job.status)}</span>
                      <span className="job-id">{job.jobId.substring(0, 8)}...</span>
                      <span className="job-status">{job.status}</span>
                      {job.retryCount > 0 && (
                        <span className="job-retry">Retry: {job.retryCount}</span>
                      )}
                    </div>
                    <div className="job-times">
                      <span className="time-label">Created:</span>
                      <span>{formatTime(job.createdAt)}</span>
                      {job.completedAt && (
                        <>
                          <span className="time-label">Duration:</span>
                          <span>{getElapsedTime(job.createdAt, job.completedAt)}</span>
                        </>
                      )}
                    </div>
                    {job.error && <div className="job-error">Error: {job.error}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job Result Section */}
          {selectedJob && jobResult && (
            <div className="job-result-section">
              <h3>✨ Generation Result</h3>
              <div className="result-details">
                <div className="result-item">
                  <span className="result-label">Nodes:</span>
                  <span className="result-value">{jobResult.result.parsed.nodes.length}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Edges:</span>
                  <span className="result-value">{jobResult.result.parsed.edges.length}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Tokens:</span>
                  <span className="result-value">{jobResult.result.tokensUsed}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Time:</span>
                  <span className="result-value">{jobResult.result.generationTime.toFixed(2)}s</span>
                </div>
              </div>
              <div className="result-summary">
                <p>{jobResult.result.parsed.summary}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="queue-footer">
          <div className="refresh-indicator">
            {isRefreshing && <span className="spinner-small"></span>}
            Auto-refresh enabled (2s)
          </div>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default QueueStatusPanel
