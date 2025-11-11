/**
 * Auto-Deduplicate Utility Tests
 * 
 * Comprehensive tests for deduplication logic
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  findExistingNode,
  extractKeywords,
  isFuzzyMatch,
  levenshteinDistance,
  normalizeLabel,
  checkNodeOverlap,
  findPotentialConflicts,
  getDeduplicationSummary,
  NodeCandidate,
} from '../autoDeduplicate'
import { WorkspaceNode } from '../../types/index'

describe('autoDeduplicate', () => {
  let mockNode1: WorkspaceNode
  let mockNode2: WorkspaceNode
  let mockNode3: WorkspaceNode

  beforeEach(() => {
    mockNode1 = {
      id: 'node-1',
      type: 'backend',
      position: { x: 0, y: 0 },
      data: {
        title: 'Swagger API Server',
        type: 'backend',
        domain: 'tech'
      }
    }

    mockNode2 = {
      id: 'node-2',
      type: 'frontend',
      position: { x: 100, y: 100 },
      data: {
        title: 'React Application',
        type: 'frontend',
        domain: 'tech'
      }
    }

    mockNode3 = {
      id: 'node-3',
      type: 'backend',
      position: { x: 200, y: 200 },
      data: {
        title: 'PostgreSQL Database',
        type: 'backend',
        domain: 'tech'
      }
    }
  })

  describe('findExistingNode', () => {
    it('should find exact label match', () => {
      const candidate: NodeCandidate = {
        label: 'Swagger API Server',
        type: 'backend',
        domain: 'tech'
      }

      const result = findExistingNode(candidate, [mockNode1, mockNode2])

      expect(result.found).toBe(true)
      expect(result.existingNode?.id).toBe('node-1')
    })

    it('should find exact label match (case insensitive)', () => {
      const candidate: NodeCandidate = {
        label: 'swagger api server',
        type: 'backend',
        domain: 'tech'
      }

      const result = findExistingNode(candidate, [mockNode1, mockNode2])

      expect(result.found).toBe(true)
      expect(result.existingNode?.id).toBe('node-1')
    })

    it('should find type+domain match when label differs', () => {
      const candidate: NodeCandidate = {
        label: 'REST API',
        type: 'backend',
        domain: 'tech'
      }

      const result = findExistingNode(candidate, [mockNode1, mockNode3])

      expect(result.found).toBe(true)
      expect(result.existingNode?.type).toBe('backend')
    })

    it('should find fuzzy keyword match', () => {
      const candidate: NodeCandidate = {
        label: 'Swagger Server',
        type: 'backend',
        domain: 'tech',
        keywords: ['swagger', 'api', 'server']
      }

      const result = findExistingNode(candidate, [mockNode1, mockNode2])

      expect(result.found).toBe(true)
    })

    it('should return not found when no matches', () => {
      const candidate: NodeCandidate = {
        label: 'Unknown Service',
        type: 'backend',
        domain: 'product'
      }

      const result = findExistingNode(candidate, [mockNode1, mockNode2])

      expect(result.found).toBe(false)
      expect(result.existingNode).toBeUndefined()
    })

    it('should handle empty nodes array', () => {
      const candidate: NodeCandidate = {
        label: 'Swagger API Server',
        type: 'backend',
        domain: 'tech'
      }

      const result = findExistingNode(candidate, [])

      expect(result.found).toBe(false)
    })
  })

  describe('extractKeywords', () => {
    it('should extract keywords from label', () => {
      const keywords = extractKeywords('Swagger API Server')

      expect(keywords).toContain('swagger')
      expect(keywords).toContain('api')
      expect(keywords).toContain('server')
    })

    it('should handle hyphenated labels', () => {
      const keywords = extractKeywords('ci-cd-pipeline')

      expect(keywords).toContain('ci')
      expect(keywords).toContain('cd')
      expect(keywords).toContain('pipeline')
    })

    it('should filter out single-character keywords', () => {
      const keywords = extractKeywords('a b c API')

      expect(keywords).not.toContain('a')
      expect(keywords).not.toContain('b')
      expect(keywords).not.toContain('c')
      expect(keywords).toContain('api') // 3+ chars are included
    })

    it('should handle empty string', () => {
      const keywords = extractKeywords('')

      expect(keywords).toEqual([])
    })
  })

  describe('isFuzzyMatch', () => {
    it('should match exact strings', () => {
      expect(isFuzzyMatch('swagger', 'swagger')).toBe(true)
    })

    it('should match case-insensitive', () => {
      expect(isFuzzyMatch('Swagger', 'swagger')).toBe(true)
    })

    it('should match substring', () => {
      expect(isFuzzyMatch('swagger', 'swagger-ui')).toBe(true)
      expect(isFuzzyMatch('swagger-ui', 'swagger')).toBe(true)
    })

    it('should match similar strings (>80% similarity)', () => {
      expect(isFuzzyMatch('swagger', 'swager')).toBe(true) // 1 char diff
      expect(isFuzzyMatch('postgres', 'postgresql')).toBe(true)
    })

    it('should not match dissimilar strings', () => {
      expect(isFuzzyMatch('swagger', 'django')).toBe(false)
      expect(isFuzzyMatch('api', 'database')).toBe(false)
    })
  })

  describe('levenshteinDistance', () => {
    it('should calculate distance correctly', () => {
      expect(levenshteinDistance('swagger', 'swagger')).toBe(0)
      expect(levenshteinDistance('swagger', 'swager')).toBe(1) // 1 deletion
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3) // known example
    })

    it('should be symmetric', () => {
      expect(levenshteinDistance('abc', 'def')).toBe(
        levenshteinDistance('def', 'abc')
      )
    })

    it('should handle empty strings', () => {
      expect(levenshteinDistance('abc', '')).toBe(3)
      expect(levenshteinDistance('', '')).toBe(0)
    })
  })

  describe('normalizeLabel', () => {
    it('should lowercase and trim', () => {
      expect(normalizeLabel('  Swagger API  ')).toBe('swagger api')
    })

    it('should collapse multiple spaces', () => {
      expect(normalizeLabel('Swagger   API   Server')).toBe('swagger api server')
    })

    it('should remove special characters', () => {
      expect(normalizeLabel('Swagger-API_Server')).toBe('swaggerapiserver')
    })

    it('should handle already normalized', () => {
      expect(normalizeLabel('swagger')).toBe('swagger')
    })
  })

  describe('checkNodeOverlap', () => {
    it('should detect same type+domain as overlap', () => {
      const node2: WorkspaceNode = {
        id: 'node-2b',
        type: 'backend',
        position: { x: 100, y: 100 },
        data: {
          title: 'Different API',
          type: 'backend',
          domain: 'tech'
        }
      }

      expect(checkNodeOverlap(mockNode1, node2)).toBe(true)
    })

    it('should detect similar labels as overlap', () => {
      const node2: WorkspaceNode = {
        id: 'node-2b',
        type: 'backend',
        position: { x: 100, y: 100 },
        data: {
          title: 'Swagger Server',
          type: 'other',
          domain: 'other'
        }
      }

      expect(checkNodeOverlap(mockNode1, node2)).toBe(true)
    })

    it('should not overlap different types+domains with different labels', () => {
      expect(checkNodeOverlap(mockNode1, mockNode2)).toBe(false)
    })
  })

  describe('findPotentialConflicts', () => {
    it('should find type+domain conflicts', () => {
      const candidate: NodeCandidate = {
        label: 'Another API',
        type: 'backend',
        domain: 'tech'
      }

      const conflicts = findPotentialConflicts(candidate, [
        mockNode1,
        mockNode2,
        mockNode3
      ])

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts.some(n => n.data?.type === 'backend')).toBe(true)
    })

    it('should find similar label conflicts', () => {
      const candidate: NodeCandidate = {
        label: 'Swager API',
        type: 'frontend',
        domain: 'other',
        keywords: ['swagger']
      }

      const conflicts = findPotentialConflicts(candidate, [mockNode1, mockNode2])

      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('should return empty when no conflicts', () => {
      const candidate: NodeCandidate = {
        label: 'Completely Different Service',
        type: 'doc',
        domain: 'business'
      }

      const conflicts = findPotentialConflicts(candidate, [
        mockNode1,
        mockNode2
      ])

      expect(conflicts).toEqual([])
    })
  })

  describe('getDeduplicationSummary', () => {
    it('should generate not-found summary', () => {
      const candidate: NodeCandidate = {
        label: 'New Service',
        type: 'backend',
        domain: 'tech'
      }

      const summary = getDeduplicationSummary(candidate, { found: false })

      expect(summary).toContain('No existing node found')
      expect(summary).toContain('Creating new node')
    })

    it('should generate found summary', () => {
      const candidate: NodeCandidate = {
        label: 'Swagger API Server',
        type: 'backend',
        domain: 'tech'
      }

      const summary = getDeduplicationSummary(candidate, {
        found: true,
        existingNode: mockNode1
      })

      expect(summary).toContain('Found existing node')
      expect(summary).toContain('Reusing')
    })
  })

  describe('Integration tests', () => {
    it('should deduplicate across multiple runs', () => {
      const candidate1: NodeCandidate = {
        label: 'Swagger API Server',
        type: 'backend',
        domain: 'tech'
      }

      // First run - not found
      const result1 = findExistingNode(candidate1, [])
      expect(result1.found).toBe(false)

      // Simulate adding the node
      const newNode: WorkspaceNode = {
        id: 'new-node',
        type: 'backend',
        position: { x: 0, y: 0 },
        data: {
          title: 'Swagger API Server',
          type: 'backend',
          domain: 'tech'
        }
      }

      // Second run - should find it
      const result2 = findExistingNode(candidate1, [newNode])
      expect(result2.found).toBe(true)
      expect(result2.existingNode?.id).toBe('new-node')
    })

    it('should handle partial keyword matches', () => {
      const candidate: NodeCandidate = {
        label: 'API Gateway',
        type: 'backend',
        domain: 'tech',
        keywords: ['api', 'swagger', 'server']
      }

      const result = findExistingNode(candidate, [mockNode1])

      // Should find "Swagger API Server" because of keyword overlap
      expect(result.found).toBe(true)
    })
  })
})
