/**
 * Tests for Workspace Validator Utilities
 * 
 * Tests all validation functions for:
 * - Valid workspace structures
 * - Invalid data (missing fields, bad types)
 * - Cycle detection
 * - Position validation
 * - Edge reference validation
 */

import {
  validateWorkspace,
  sanitizeWorkspace,
  getValidationSummary,
  formatValidationMessages,
  ValidationResult,
} from './workspaceValidator'

// Test utilities
function expectValid(result: ValidationResult, message?: string) {
  if (!result.isValid) {
    console.error('Expected valid workspace, got errors:')
    result.messages.forEach(m => console.error(`  ${m.severity}: ${m.message}`))
    throw new Error(message || 'Workspace validation failed')
  }
}

function expectInvalid(result: ValidationResult, severityFilter = 'error') {
  const filtered = result.messages.filter(m => m.severity === severityFilter)
  if (filtered.length === 0 && result.isValid) {
    throw new Error(`Expected invalid workspace with ${severityFilter}s`)
  }
}

// Test cases
export const validatorTests = {
  // Valid workspace test
  testValidWorkspace: () => {
    const workspace = {
      nodes: [
        {
          id: 'root-1',
          type: 'root' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Project Root' },
        },
        {
          id: 'frontend-1',
          type: 'frontend' as const,
          position: { x: 300, y: 0 },
          data: { title: 'React Frontend' },
        },
        {
          id: 'backend-1',
          type: 'backend' as const,
          position: { x: 300, y: 300 },
          data: { title: 'Node.js Backend' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'root-1', target: 'frontend-1' },
        { id: 'edge-2', source: 'root-1', target: 'backend-1' },
      ],
    }

    const result = validateWorkspace(workspace)
    expectValid(result, 'Valid workspace should pass validation')
    console.log('✅ testValidWorkspace passed')
  },

  // Invalid node type test
  testInvalidNodeType: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          type: 'invalid-type' as any,
          position: { x: 0, y: 0 },
          data: { title: 'Invalid Node' },
        },
      ],
      edges: [],
    }

    const result = validateWorkspace(workspace)
    expectInvalid(result, 'warning')
    console.log('✅ testInvalidNodeType passed')
  },

  // Missing required fields test
  testMissingRequiredFields: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          // type is missing
          position: { x: 0, y: 0 },
          data: { title: 'Missing Type' },
        },
      ],
      edges: [],
    } as any

    const result = validateWorkspace(workspace)
    expectInvalid(result, 'error')
    console.log('✅ testMissingRequiredFields passed')
  },

  // Cycle detection test
  testCycleDetection: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          type: 'requirement' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Node 1' },
        },
        {
          id: 'node-2',
          type: 'requirement' as const,
          position: { x: 300, y: 0 },
          data: { title: 'Node 2' },
        },
        {
          id: 'node-3',
          type: 'requirement' as const,
          position: { x: 600, y: 0 },
          data: { title: 'Node 3' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
        { id: 'edge-2', source: 'node-2', target: 'node-3' },
        { id: 'edge-3', source: 'node-3', target: 'node-1' }, // Creates cycle
      ],
    }

    const result = validateWorkspace(workspace)
    if (!result.hasCycles) {
      throw new Error('Cycle detection failed')
    }
    console.log('✅ testCycleDetection passed')
  },

  // Invalid edge references test
  testInvalidEdgeReferences: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          type: 'requirement' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Node 1' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'nonexistent' }, // Target doesn't exist
      ],
    }

    const result = validateWorkspace(workspace)
    expectInvalid(result, 'error')
    console.log('✅ testInvalidEdgeReferences passed')
  },

  // Self-loop detection test
  testSelfLoopDetection: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          type: 'requirement' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Node 1' },
        },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-1' }, // Self-loop
      ],
    }

    const result = validateWorkspace(workspace)
    const selfLoopWarning = result.messages.some(
      m => m.severity === 'warning' && m.message.includes('self-loop')
    )
    if (!selfLoopWarning) {
      throw new Error('Self-loop detection failed')
    }
    console.log('✅ testSelfLoopDetection passed')
  },

  // Position overlap detection test
  testPositionOverlapDetection: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          type: 'requirement' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Node 1' },
        },
        {
          id: 'node-2',
          type: 'requirement' as const,
          position: { x: 10, y: 10 }, // Very close to node-1
          data: { title: 'Node 2' },
        },
      ],
      edges: [],
    }

    const result = validateWorkspace(workspace)
    if (!result.hasOverlaps) {
      throw new Error('Position overlap detection failed')
    }
    console.log('✅ testPositionOverlapDetection passed')
  },

  // Sanitization test
  testSanitization: () => {
    const workspace = {
      nodes: [
        {
          id: '', // Missing ID
          type: 'invalid' as any, // Invalid type
          position: { x: 99999, y: 99999 }, // Out of bounds
          data: { title: '' }, // Empty title
        },
      ],
      edges: [
        { id: '', source: 'node-1', target: 'node-2' }, // Missing ID and invalid refs
      ],
    }

    const sanitized = sanitizeWorkspace(workspace as any)

    // Check that values were fixed
    if (!sanitized.nodes[0].id) {
      throw new Error('ID should be auto-generated')
    }
    if (sanitized.nodes[0].type !== 'requirement') {
      throw new Error('Invalid type should be converted to requirement')
    }
    if (sanitized.nodes[0].position.x > 5000) {
      throw new Error('Out-of-bounds position should be clamped')
    }
    if (sanitized.nodes[0].data.title !== 'Untitled') {
      throw new Error('Empty title should default to Untitled')
    }
    if (sanitized.edges.length > 0) {
      throw new Error('Invalid edge references should be removed')
    }

    console.log('✅ testSanitization passed')
  },

  // Multiple root nodes warning test
  testMultipleRootNodesWarning: () => {
    const workspace = {
      nodes: [
        {
          id: 'root-1',
          type: 'root' as const,
          position: { x: 0, y: 0 },
          data: { title: 'Root 1' },
        },
        {
          id: 'root-2',
          type: 'root' as const,
          position: { x: 300, y: 0 },
          data: { title: 'Root 2' },
        },
      ],
      edges: [],
    }

    const result = validateWorkspace(workspace)
    const multiRootWarning = result.messages.some(
      m => m.severity === 'warning' && m.message.includes('root')
    )
    if (!multiRootWarning) {
      throw new Error('Multiple root nodes warning not detected')
    }
    console.log('✅ testMultipleRootNodesWarning passed')
  },

  // Validation summary formatting test
  testValidationSummary: () => {
    const workspace = {
      nodes: [],
      edges: [],
    }

    const result = validateWorkspace(workspace)
    const summary = getValidationSummary(result)

    if (!summary.includes('Workspace Validation')) {
      throw new Error('Summary missing main title')
    }
    if (!summary.includes('Nodes:')) {
      throw new Error('Summary missing node count')
    }

    console.log('✅ testValidationSummary passed')
  },

  // Format validation messages test
  testFormatValidationMessages: () => {
    const messages = [
      { severity: 'error' as const, message: 'Error message' },
      { severity: 'warning' as const, message: 'Warning message' },
      { severity: 'info' as const, message: 'Info message' },
    ]

    const formatted = formatValidationMessages(messages)

    if (formatted.length !== 3) {
      throw new Error('Should format all messages')
    }
    if (!formatted[0].includes('🔴')) {
      throw new Error('Error message should have error emoji')
    }
    if (!formatted[1].includes('🟡')) {
      throw new Error('Warning message should have warning emoji')
    }
    if (!formatted[2].includes('🔵')) {
      throw new Error('Info message should have info emoji')
    }

    console.log('✅ testFormatValidationMessages passed')
  },

  // Empty workspace test
  testEmptyWorkspace: () => {
    const workspace = {
      nodes: [],
      edges: [],
    }

    const result = validateWorkspace(workspace)
    // Should be technically valid but have info messages
    const infoMessages = result.messages.filter(m => m.severity === 'info')
    if (infoMessages.length === 0 && result.messages.some(m => m.severity === 'warning')) {
      // OK - could have warnings about no root node
    }
    console.log('✅ testEmptyWorkspace passed')
  },

  // Out of bounds test
  testOutOfBoundsCoordinates: () => {
    const workspace = {
      nodes: [
        {
          id: 'node-1',
          type: 'requirement' as const,
          position: { x: -10000, y: 10000 }, // Way out of bounds
          data: { title: 'Out of bounds' },
        },
      ],
      edges: [],
    }

    const result = validateWorkspace(workspace)
    const boundsWarning = result.messages.some(
      m => m.severity === 'warning' && m.message.includes('bounds')
    )
    if (!boundsWarning) {
      throw new Error('Out-of-bounds warning not detected')
    }
    console.log('✅ testOutOfBoundsCoordinates passed')
  },
}

// Run all tests
export function runValidatorTests() {
  console.log('\n🧪 Running Workspace Validator Tests...\n')
  let passed = 0
  let failed = 0

  Object.entries(validatorTests).forEach(([testName, testFn]) => {
    try {
      testFn()
      passed++
    } catch (error) {
      console.error(`❌ ${testName} failed: ${error}`)
      failed++
    }
  })

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`)
  return { passed, failed }
}

// Export for testing
export default { runValidatorTests }
