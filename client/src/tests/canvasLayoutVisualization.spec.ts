import { describe, it, expect } from 'vitest'
import { generateRadialLayout, visualizeRadialLayout, generateLayoutStats } from '../config/radialLayout'
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react'

interface NodeData {
  label: string
  ring?: number
  domain?: string
  parentId?: string
  [key: string]: unknown
}

const createNode = (
  id: string,
  label: string,
  ring: number,
  domain: string = 'tech',
  parentId?: string
): FlowNode => ({
  id,
  data: { label, ring, domain, parentId },
  position: { x: 0, y: 0 }, // Will be set by layout
  type: ring === 0 ? 'center' : ring === 1 ? 'classification' : ring === 2 ? 'intermediate' : 'feature',
})

const createEdge = (source: string, target: string, id?: string): FlowEdge => ({
  id: id || `${source}-${target}`,
  source,
  target,
})

describe('Canvas Layout Visualization', () => {
  it('Should generate and display a complete radial layout', () => {
    console.log('\n=== CANVAS LAYOUT GENERATION ===\n')

    // Create a small but complete hierarchy for visualization
    let allNodes: FlowNode[] = []
    let allEdges: FlowEdge[] = []

    // R0: Center
    const centerNode = createNode('center', 'Center Node', 0, 'tech')
    allNodes.push(centerNode)

    // R1: Classifications (4 nodes)
    const classifications = [
      createNode('class-product', 'Product', 1, 'product'),
      createNode('class-tech', 'Technology', 1, 'tech'),
      createNode('class-process', 'Process', 1, 'process'),
      createNode('class-people', 'People', 1, 'people'),
    ]

    classifications.forEach((classNode) => {
      allNodes.push(classNode)
      allEdges.push(createEdge('center', classNode.id))
    })

    // R2: Intermediates (12 nodes - 3 per classification)
    let intermediateCount = 0
    classifications.forEach((classNode, classIdx) => {
      for (let i = 0; i < 3; i++) {
        const intermediateId = `inter-${classIdx}-${i}`
        const intermediateNode = createNode(
          intermediateId,
          `${(classNode.data as NodeData).label} Sub-${i + 1}`,
          2,
          (classNode.data as NodeData).domain || 'tech'
        )
        allNodes.push(intermediateNode)
        allEdges.push(createEdge(classNode.id, intermediateId))
        intermediateCount++
      }
    })

    // R3: Features (36 nodes - 3 per intermediate)
    let featureCount = 0
    const intermediateNodes = allNodes.filter((n) => (n.data as NodeData).ring === 2)
    intermediateNodes.forEach((intermediateNode, intermediateIdx) => {
      for (let i = 0; i < 3; i++) {
        const featureId = `feature-${intermediateIdx}-${i}`
        const featureNode = createNode(
          featureId,
          `Feature ${intermediateIdx}-${i + 1}`,
          3,
          (intermediateNode.data as NodeData).domain || 'tech'
        )
        allNodes.push(featureNode)
        allEdges.push(createEdge(intermediateNode.id, featureId))
        featureCount++
      }
    })

    console.log('✓ Created hierarchy:')
    console.log(`  - Center nodes: 1`)
    console.log(`  - Classification nodes: ${classifications.length}`)
    console.log(`  - Intermediate nodes: ${intermediateCount}`)
    console.log(`  - Feature nodes: ${featureCount}`)
    console.log(`  - Total: ${allNodes.length} nodes, ${allEdges.length} edges\n`)

    // Apply radial layout
    const layoutedNodes = generateRadialLayout(allNodes)

    console.log('✓ Applied radial layout:')
    layoutedNodes.forEach((node) => {
      const data = node.data as NodeData
      console.log(
        `  ${node.id.padEnd(20)} (R${data.ring}): position (${node.position.x.toFixed(0)}, ${node.position.y.toFixed(0)})`
      )
    })

    // Verify all nodes have positions
    const nodesWithPositions = layoutedNodes.filter((n) => n.position.x !== 0 || n.position.y !== 0 || (n.data as NodeData).ring === 0)
    console.log(`\n✓ Positioned nodes: ${nodesWithPositions.length}/${layoutedNodes.length}`)
    expect(nodesWithPositions.length).toBe(layoutedNodes.length)

    // Verify center node is at origin
    const center = layoutedNodes.find((n) => n.id === 'center')
    expect(center?.position.x).toBeCloseTo(400, 1)
    expect(center?.position.y).toBeCloseTo(300, 1)
    console.log(`✓ Center node at origin: (${center?.position.x.toFixed(0)}, ${center?.position.y.toFixed(0)})`)

    // Verify ring distances
    const r1Nodes = layoutedNodes.filter((n) => (n.data as NodeData).ring === 1)
    if (r1Nodes.length > 0) {
      const r1Node = r1Nodes[0]
      const distanceFromCenter = Math.sqrt(
        Math.pow(r1Node.position.x - 400, 2) + Math.pow(r1Node.position.y - 300, 2)
      )
      console.log(`✓ R1 nodes at radius: ~${distanceFromCenter.toFixed(0)}px (expected ~180px)`)
      expect(distanceFromCenter).toBeCloseTo(180, -1) // Within 10px
    }

    const r2Nodes = layoutedNodes.filter((n) => (n.data as NodeData).ring === 2)
    if (r2Nodes.length > 0) {
      const r2Node = r2Nodes[0]
      const distanceFromCenter = Math.sqrt(
        Math.pow(r2Node.position.x - 400, 2) + Math.pow(r2Node.position.y - 300, 2)
      )
      console.log(`✓ R2 nodes at radius: ~${distanceFromCenter.toFixed(0)}px (expected ~360px)`)
      expect(distanceFromCenter).toBeCloseTo(360, -1) // Within 10px
    }

    const r3Nodes = layoutedNodes.filter((n) => (n.data as NodeData).ring === 3)
    if (r3Nodes.length > 0) {
      const r3Node = r3Nodes[0]
      const distanceFromCenter = Math.sqrt(
        Math.pow(r3Node.position.x - 400, 2) + Math.pow(r3Node.position.y - 300, 2)
      )
      console.log(`✓ R3 nodes at radius: ~${distanceFromCenter.toFixed(0)}px (expected ~540px)`)
      expect(distanceFromCenter).toBeCloseTo(540, -1) // Within 10px
    }

    // Generate visualization
    console.log('\n' + visualizeRadialLayout(layoutedNodes))

    // Generate layout statistics
    const stats = generateLayoutStats(layoutedNodes)
    console.log('\n✓ Layout Statistics:')
    console.log(`  Total Nodes: ${stats.totalNodes}`)
    console.log(`  Rings: ${Object.keys(stats.nodesByRing).length}`)
    console.log(`  Domains: ${Object.keys(stats.nodesByDomain).length}`)

    // Verify complete structure
    expect(layoutedNodes.length).toBe(allNodes.length)
    expect(Object.keys(stats.nodesByRing).length).toBe(4) // R0, R1, R2, R3
  })

  it('Should handle large-scale layout with 500+ nodes', () => {
    console.log('\n=== LARGE CANVAS LAYOUT (500+ nodes) ===\n')

    let allNodes: FlowNode[] = []
    let allEdges: FlowEdge[] = []

    // Build large hierarchy
    const centerNode = createNode('center', 'Center', 0, 'tech')
    allNodes.push(centerNode)

    // R1: 5 classifications
    const domains = ['product', 'tech', 'process', 'people', 'resources']
    const classificationNodes: FlowNode[] = []

    domains.forEach((domain, idx) => {
      const classNode = createNode(`class-${idx}`, domain.toUpperCase(), 1, domain)
      classificationNodes.push(classNode)
      allNodes.push(classNode)
      allEdges.push(createEdge('center', `class-${idx}`))
    })

    // R2: 50 intermediates (10 per classification)
    const intermediateNodes: FlowNode[] = []
    classificationNodes.forEach((classNode, classIdx) => {
      for (let i = 0; i < 10; i++) {
        const intermediateId = `inter-${classIdx}-${i}`
        const intermediateNode = createNode(
          intermediateId,
          `Inter_${classIdx}_${i}`,
          2,
          (classNode.data as NodeData).domain || 'tech'
        )
        intermediateNodes.push(intermediateNode)
        allNodes.push(intermediateNode)
        allEdges.push(createEdge(`class-${classIdx}`, intermediateId))
      }
    })

    // R3: 500 features (10 per intermediate)
    intermediateNodes.forEach((intermediateNode, intermediateIdx) => {
      for (let i = 0; i < 10; i++) {
        const featureId = `feature-${intermediateIdx}-${i}`
        const featureNode = createNode(
          featureId,
          `Feature_${intermediateIdx}_${i}`,
          3,
          (intermediateNode.data as NodeData).domain || 'tech'
        )
        allNodes.push(featureNode)
        allEdges.push(createEdge(intermediateNode.id, featureId))
      }
    })

    console.log(`✓ Created large hierarchy: ${allNodes.length} nodes`)

    const startLayout = performance.now()
    const layoutedNodes = generateRadialLayout(allNodes)
    const endLayout = performance.now()

    console.log(`✓ Layout applied in ${(endLayout - startLayout).toFixed(2)}ms`)

    // Verify positioning
    const nodesWithValidPositions = layoutedNodes.filter((n) => {
      const hasValidX = typeof n.position.x === 'number' && !isNaN(n.position.x)
      const hasValidY = typeof n.position.y === 'number' && !isNaN(n.position.y)
      return hasValidX && hasValidY
    })

    console.log(`✓ Positioned nodes: ${nodesWithValidPositions.length}/${layoutedNodes.length}`)
    expect(nodesWithValidPositions.length).toBe(layoutedNodes.length)

    // Display visualization
    console.log('\n' + visualizeRadialLayout(layoutedNodes))

    // Verify ring distribution
    const stats = generateLayoutStats(layoutedNodes)
    console.log('\n✓ Ring Distribution:')
    Object.entries(stats.nodesByRing).forEach(([ring, count]) => {
      console.log(`  R${ring}: ${count} nodes`)
    })

    expect(stats.totalNodes).toBe(556) // 1 + 5 + 50 + 500
  })

  it('Should generate canvas data for rendering', () => {
    console.log('\n=== CANVAS RENDERING DATA ===\n')

    // Create a small layout
    let allNodes: FlowNode[] = []
    let allEdges: FlowEdge[] = []

    const centerNode = createNode('center', 'Center', 0, 'tech')
    allNodes.push(centerNode)

    for (let i = 0; i < 3; i++) {
      const classNode = createNode(`class-${i}`, `Class ${i}`, 1, 'tech')
      allNodes.push(classNode)
      allEdges.push(createEdge('center', `class-${i}`))

      for (let j = 0; j < 2; j++) {
        const intermediateId = `inter-${i}-${j}`
        const intermediateNode = createNode(intermediateId, `Inter ${i}-${j}`, 2, 'tech')
        allNodes.push(intermediateNode)
        allEdges.push(createEdge(`class-${i}`, intermediateId))

        for (let k = 0; k < 3; k++) {
          const featureId = `feature-${i}-${j}-${k}`
          const featureNode = createNode(featureId, `Feature ${i}-${j}-${k}`, 3, 'tech')
          allNodes.push(featureNode)
          allEdges.push(createEdge(intermediateId, featureId))
        }
      }
    }

    // Apply layout
    const layoutedNodes = generateRadialLayout(allNodes)

    console.log('✓ Canvas Data Generated:')
    console.log(`  Nodes: ${layoutedNodes.length}`)
    console.log(`  Edges: ${allEdges.length}`)
    console.log(`  Canvas Center: (400, 300)`)
    console.log(`  Canvas Size: 1200x900`)

    // Generate rendering data
    const renderData = {
      nodes: layoutedNodes,
      edges: allEdges,
      bounds: {
        minX: Math.min(...layoutedNodes.map((n) => n.position.x)),
        maxX: Math.max(...layoutedNodes.map((n) => n.position.x)),
        minY: Math.min(...layoutedNodes.map((n) => n.position.y)),
        maxY: Math.max(...layoutedNodes.map((n) => n.position.y)),
      },
      viewport: {
        zoom: 1,
        x: 0,
        y: 0,
      },
    }

    console.log('\n✓ Rendering Bounds:')
    console.log(`  X: ${renderData.bounds.minX.toFixed(0)} to ${renderData.bounds.maxX.toFixed(0)}`)
    console.log(`  Y: ${renderData.bounds.minY.toFixed(0)} to ${renderData.bounds.maxY.toFixed(0)}`)
    console.log(`  Width: ${(renderData.bounds.maxX - renderData.bounds.minX).toFixed(0)}px`)
    console.log(`  Height: ${(renderData.bounds.maxY - renderData.bounds.minY).toFixed(0)}px`)

    // Verify data structure
    expect(renderData.nodes.length).toBe(layoutedNodes.length)
    expect(renderData.edges.length).toBe(allEdges.length)
    expect(renderData.bounds.minX).toBeLessThan(renderData.bounds.maxX)
    expect(renderData.bounds.minY).toBeLessThan(renderData.bounds.maxY)

    console.log('\n✓ Sample Nodes (first 5):')
    layoutedNodes.slice(0, 5).forEach((node) => {
      const data = node.data as NodeData
      console.log(`  ${node.id.padEnd(20)} at (${node.position.x.toFixed(0).padStart(4)}, ${node.position.y.toFixed(0).padStart(4)}) - R${data.ring}`)
    })

    console.log('\n✓ Canvas ready for rendering!')
    expect(renderData.nodes.length).toBeGreaterThan(0)
  })
})
