/**
 * Ring Hierarchy Validator Tests
 */

import {
  validateRingHierarchy,
  getNodesWithErrors,
  getNodeViolations,
} from './ringHierarchyValidator'
import { WorkspaceNode, WorkspaceEdge } from '../types/index'

describe('Ring Hierarchy Validator', () => {
  function createNode(
    id: string,
    title: string,
    type: string = 'feature',
    ring?: number
  ): WorkspaceNode {
    return {
      id,
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        title,
        type,
        ring,
        tags: [],
      },
    }
  }

  function createEdge(id: string, source: string, target: string): WorkspaceEdge {
    return {
      id,
      source,
      target,
      type: 'custom',
      data: { relation: 'depends_on' },
    }
  }

  describe('Center Node Rules', () => {
    test('should have center node', () => {
      const nodes = [createNode('center', 'Center', 'root', 0)]
      const edges: WorkspaceEdge[] = []
      const result = validateRingHierarchy(nodes, edges)
      expect(result.isValid).toBe(true)
    })

    test('should detect missing center node', () => {
      const nodes = [createNode('node-1', 'Node 1', 'feature')]
      const edges: WorkspaceEdge[] = []
      const result = validateRingHierarchy(nodes, edges)
      expect(result.violations.length).toBeGreaterThan(0)
    })
  })

  describe('Parent-Child Relationships', () => {
    test('should allow valid parent-child edges', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('child', 'Child', 'feature', 1),
      ]
      const edges = [createEdge('e1', 'center', 'child')]
      const result = validateRingHierarchy(nodes, edges)
      const childViolations = getNodeViolations('child', result)
      expect(childViolations.filter(v => v.issue.includes('parent'))).toHaveLength(0)
    })

    test('should detect orphan nodes', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('orphan', 'Orphan', 'feature'),
      ]
      const edges: WorkspaceEdge[] = []
      const result = validateRingHierarchy(nodes, edges)
      const orphanViolations = result.violations.filter(v =>
        v.issue.includes('orphan')
      )
      expect(orphanViolations.length).toBeGreaterThan(0)
    })

    test('should validate ring increment', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('r1', 'R1 Node', 'feature', 1),
        createNode('r2', 'R2 Node', 'feature', 2),
      ]
      const edges = [
        createEdge('e1', 'center', 'r1'),
        createEdge('e2', 'r1', 'r2'),
      ]
      const result = validateRingHierarchy(nodes, edges)
      expect(result.violations.length).toBe(0)
    })
  })

  describe('Helper Functions', () => {
    test('getNodesWithErrors should return nodes with errors', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('bad', 'Bad', 'feature'),
      ]
      const edges: WorkspaceEdge[] = []
      const result = validateRingHierarchy(nodes, edges)
      const errorNodes = getNodesWithErrors(result)
      expect(errorNodes.size).toBeGreaterThan(0)
    })

    test('getNodeViolations should filter by node', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('orphan', 'Orphan', 'feature'),
      ]
      const edges: WorkspaceEdge[] = []
      const result = validateRingHierarchy(nodes, edges)
      const violations = getNodeViolations('orphan', result)
      violations.forEach(v => {
        expect(v.nodeId).toBe('orphan')
      })
    })
  })

  describe('Domain Scaffold Scenarios', () => {
    test('should validate complete infrastructure scaffold', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('domain-1', 'Infrastructure', 'domain-parent', 1),
        createNode('k8s', 'Kubernetes', 'infrastructure', 2),
        createNode('ci', 'CI/CD', 'infrastructure', 2),
      ]
      const edges = [
        createEdge('e1', 'center', 'domain-1'),
        createEdge('e2', 'domain-1', 'k8s'),
        createEdge('e3', 'domain-1', 'ci'),
      ]
      const result = validateRingHierarchy(nodes, edges)
      expect(result.violations.length).toBe(0)
    })

    test('should validate backend scaffold output', () => {
      const nodes = [
        createNode('center', 'Center', 'root', 0),
        createNode('backend', 'Backend & APIs', 'domain-parent', 1),
        createNode('express', 'Express Server', 'backend', 2),
        createNode('postgres', 'PostgreSQL', 'backend', 2),
        createNode('redis', 'Redis', 'backend', 2),
      ]
      const edges = [
        createEdge('e1', 'center', 'backend'),
        createEdge('e2', 'backend', 'express'),
        createEdge('e3', 'backend', 'postgres'),
        createEdge('e4', 'backend', 'redis'),
      ]
      const result = validateRingHierarchy(nodes, edges)
      expect(result.violations.filter(v => v.severity === 'error')).toHaveLength(0)
    })
  })
})
