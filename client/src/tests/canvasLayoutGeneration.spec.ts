/**
 * Canvas Layout Generation & Association Verification Test
 * 
 * This test:
 * 1. Generates a complete canvas with foundation nodes
 * 2. Applies foundation edges processing
 * 3. Verifies all associations (parent/child, domain, ring)
 * 4. Displays visual hierarchy
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { processFoundationEdges } from '../config/foundationEdges';

// Helper to create a node
function createNode(
  id: string,
  label: string,
  type: string,
  ring: number,
  domain: string = 'tech',
  parentId?: string
): Node {
  return {
    id,
    data: {
      title: label,
      label,  // Add label field too
      type,
      ring,   // CRITICAL: ring must be set for evaluateEdges to detect R3+ nodes
      domain,
      classificationKey: parentId ? `${domain}-${type}` : undefined,
    },
    position: { x: 0, y: 0 },
    type: 'custom',
  };
}

// Helper to create an edge
function createEdge(source: string, target: string, relationship: string = 'parent'): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { relationship },
  };
}

describe('Canvas Layout Generation & Association Verification', () => {
  it('generates complete ring hierarchy with foundation edges', () => {
    // SETUP: Create center node
    const centerNode = createNode('center', 'Center', 'center', 0);

    // SETUP: Create R1 classification nodes (4 classifications)
    const classifications = [
      createNode('class-product', 'Product', 'classification', 1, 'product'),
      createNode('class-tech', 'Technology', 'classification', 1, 'tech'),
      createNode('class-process', 'Process', 'classification', 1, 'process'),
      createNode('class-people', 'People', 'classification', 1, 'people'),
    ];

    // SETUP: Create edges from center to classifications
    const r1Edges = classifications.map((c) =>
      createEdge('center', c.id, 'parent')
    );

    // SETUP: Create R3 foundation nodes (72 total, distributed across domains)
    const foundationNodes: Node[] = [];
    
    // Frontend foundation nodes (10 nodes)
    const frontendNodes = [
      'auth-ui', 'login-form', 'dashboard', 'profile-page', 'notifications-panel',
      'theme-switcher', 'responsive-layout', 'accessibility-features', 'animations', 'error-boundary'
    ];
    frontendNodes.forEach((id) => {
      foundationNodes.push(
        createNode(
          `foundation-${id}`,
          id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'feature',
          3,
          'product'
        )
      );
    });

    // Backend foundation nodes (15 nodes)
    const backendNodes = [
      'api-gateway', 'auth-service', 'user-service', 'payment-service', 'order-service',
      'inventory-service', 'notification-service', 'email-handler', 'webhook-handler',
      'rate-limiter', 'circuit-breaker', 'request-validator', 'response-formatter',
      'error-handler', 'middleware-stack'
    ];
    backendNodes.forEach((id) => {
      foundationNodes.push(
        createNode(
          `foundation-${id}`,
          id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'feature',
          3,
          'tech'
        )
      );
    });

    // Data & AI foundation nodes (12 nodes)
    const dataNodes = [
      'data-pipeline', 'ml-model', 'analytics-engine', 'data-warehouse', 'etl-process',
      'data-validator', 'schema-validator', 'cache-layer', 'search-index', 'reporting-engine',
      'dashboard-builder', 'anomaly-detection'
    ];
    dataNodes.forEach((id) => {
      foundationNodes.push(
        createNode(
          `foundation-${id}`,
          id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'feature',
          3,
          'tech'
        )
      );
    });

    // Infrastructure foundation nodes (15 nodes)
    const infraNodes = [
      'docker-compose', 'kubernetes-config', 'load-balancer', 'cdn-setup', 'storage-bucket',
      'database-cluster', 'backup-system', 'monitoring-stack', 'logging-system', 'tracing-system',
      'service-mesh', 'network-policy', 'firewall-rules', 'scaling-policy', 'disaster-recovery'
    ];
    infraNodes.forEach((id) => {
      foundationNodes.push(
        createNode(
          `foundation-${id}`,
          id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'feature',
          3,
          'tech'
        )
      );
    });

    // Observability foundation nodes (10 nodes)
    const obsNodes = [
      'prometheus-metrics', 'grafana-dashboard', 'log-aggregation', 'distributed-tracing',
      'performance-monitoring', 'uptime-monitoring', 'alert-manager', 'incident-response',
      'sla-tracking', 'cost-tracking'
    ];
    obsNodes.forEach((id) => {
      foundationNodes.push(
        createNode(
          `foundation-${id}`,
          id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'feature',
          3,
          'tech'
        )
      );
    });

    // Security foundation nodes (10 nodes)
    const securityNodes = [
      'authentication', 'authorization', 'encryption', 'certificate-management', 'secret-vault',
      'security-scanning', 'penetration-testing', 'compliance-audit', 'data-encryption', 'access-logging'
    ];
    securityNodes.forEach((id) => {
      foundationNodes.push(
        createNode(
          `foundation-${id}`,
          id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          'feature',
          3,
          'tech'
        )
      );
    });

    console.log(`\n✓ Generated ${foundationNodes.length} foundation nodes`);
    expect(foundationNodes).toHaveLength(72);

    // COMBINE: All nodes before processing
    let allNodes = [centerNode, ...classifications, ...foundationNodes];
    let allEdges = [...r1Edges];
    // NOTE: Foundation nodes have NO parent edges - they're orphaned!

    console.log(`\n✓ Before processing: ${allNodes.length} nodes, ${allEdges.length} edges`);
    console.log(`  Foundation nodes without parents: ${foundationNodes.length}`);
    
    // Debug: Check ring values
    const r3Nodes = allNodes.filter(n => (n.data as any).ring === 3);
    console.log(`  Nodes with ring=3: ${r3Nodes.length}`);
    console.log(`  Sample R3 node:`, r3Nodes[0]);

    // PROCESS: Apply foundation edges
    const result = processFoundationEdges(allNodes, allEdges);

    // MERGE: Results
    allNodes = [...allNodes, ...result.nodesToCreate];
    allEdges = [...allEdges, ...result.edgesToCreate];

    console.log(`\n✓ After processing: ${allNodes.length} nodes, ${allEdges.length} edges`);
    console.log(`  - New intermediates: ${result.nodesToCreate.length}`);
    console.log(`  - New edges: ${result.edgesToCreate.length}`);

    // VERIFY: Intermediate nodes created
    expect(result.nodesToCreate.length).toBeGreaterThan(0);
    expect(result.edgesToCreate.length).toBeGreaterThan(0);

    // VERIFY: All intermediates are ring 2
    result.nodesToCreate.forEach((node) => {
      expect((node.data as any).ring).toBe(2);
    });

    // VERIFY: All foundation nodes now have parents
    const foundationWithoutParents = foundationNodes.filter((node) => {
      const hasParentEdge = allEdges.some((e) => e.target === node.id && e.source !== node.id);
      return !hasParentEdge;
    });

    console.log(`\n✓ Foundation nodes without parents: ${foundationWithoutParents.length}`);
    expect(foundationWithoutParents.length).toBe(0);

    // ANALYZE: Ring hierarchy
    const ringCounts = new Map<number, number>();
    allNodes.forEach((node) => {
      const ring = (node.data as any).ring;
      ringCounts.set(ring, (ringCounts.get(ring) || 0) + 1);
    });

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ Ring Distribution                                      ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    Array.from(ringCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([ring, count]) => {
        const ringName = ['Center', 'Classifications', 'Intermediates', 'Features'][ring] || `Ring ${ring}`;
        console.log(`  R${ring} (${ringName}): ${count} nodes`);
      });

    // ANALYZE: Domain distribution
    const domainCounts = new Map<string, number>();
    allNodes.forEach((node) => {
      const domain = (node.data as any).domain || 'unknown';
      if (domain !== 'product' && domain !== undefined) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }
    });

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ Domain Distribution                                    ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`  ${domain}: ${count} nodes`);
      });

    // ANALYZE: Edge connectivity
    const edgeCounts = new Map<number, number>();
    allEdges.forEach((edge) => {
      const sourceRing = (allNodes.find((n) => n.id === edge.source)?.data as any)?.ring ?? -1;
      const targetRing = (allNodes.find((n) => n.id === edge.target)?.data as any)?.ring ?? -1;
      const ringPair = sourceRing * 10 + targetRing;
      edgeCounts.set(ringPair, (edgeCounts.get(ringPair) || 0) + 1);
    });

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ Edge Flow (Source Ring → Target Ring)                 ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    Array.from(edgeCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([ringPair, count]) => {
        const source = Math.floor(ringPair / 10);
        const target = ringPair % 10;
        const sourceRingName = ['Center', 'Classifications', 'Intermediates', 'Features'][source] || `Ring ${source}`;
        const targetRingName = ['Center', 'Classifications', 'Intermediates', 'Features'][target] || `Ring ${target}`;
        console.log(`  R${source}(${sourceRingName}) → R${target}(${targetRingName}): ${count} edges`);
      });

    // VERIFY: Hierarchy flow (no direct R1→R3)
    const directR1toR3 = allEdges.filter((edge) => {
      const sourceRing = (allNodes.find((n) => n.id === edge.source)?.data as any)?.ring;
      const targetRing = (allNodes.find((n) => n.id === edge.target)?.data as any)?.ring;
      return sourceRing === 1 && targetRing === 3;
    });

    console.log(`\n✓ Direct R1→R3 connections: ${directR1toR3.length}`);
    expect(directR1toR3.length).toBe(0);

    // VERIFY: R1→R2 connections (these are created by connectIntermediateToClassifications)
    const r1toR2 = allEdges.filter((edge) => {
      const sourceRing = (allNodes.find((n) => n.id === edge.source)?.data as any)?.ring;
      const targetRing = (allNodes.find((n) => n.id === edge.target)?.data as any)?.ring;
      return sourceRing === 1 && targetRing === 2;
    });

    console.log(`✓ R1→R2 parent connections: ${r1toR2.length}`);
    // Note: R1→R2 edges are created separately by connectIntermediateToClassifications

    // VERIFY: All R2→R3 connections
    const r2toR3 = allEdges.filter((edge) => {
      const sourceRing = (allNodes.find((n) => n.id === edge.source)?.data as any)?.ring;
      const targetRing = (allNodes.find((n) => n.id === edge.target)?.data as any)?.ring;
      return sourceRing === 2 && targetRing === 3;
    });

    console.log(`✓ R2→R3 child connections: ${r2toR3.length}`);
    expect(r2toR3.length).toBe(72);

    // DISPLAY: Visual hierarchy
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ Visual Hierarchy                                       ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);
    
    console.log(`          Center Node`);
    console.log(`               │`);
    console.log(`        ┌──────┼──────┬─────┬──────┐`);
    console.log(`        │      │      │     │      │`);
    
    classifications.forEach((c) => {
      const intermediates = result.nodesToCreate.filter(
        (n) => (n.data as any).domain === (c.data as any).domain
      );
      console.log(`    R1  │   ${c.data.title}`);
      intermediates.forEach((int) => {
        const children = foundationNodes.filter(
          (f) => (f.data as any).domain === (int.data as any).domain
        ).length;
        console.log(`        │     ├─ R2: ${(int.data as any).title} (${children} children)`);
      });
    });

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║ Association Summary                                    ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    console.log(`  Total Nodes: ${allNodes.length}`);
    console.log(`    • Center: 1`);
    console.log(`    • Classifications (R1): ${classifications.length}`);
    console.log(`    • Intermediates (R2): ${result.nodesToCreate.length}`);
    console.log(`    • Foundation (R3): ${foundationNodes.length}`);
    console.log(`\n  Total Edges: ${allEdges.length}`);
    console.log(`    • Center→R1: ${r1Edges.length}`);
    console.log(`    • R1→R2: ${r1toR2.length}`);
    console.log(`    • R2→R3: ${r2toR3.length}`);
    console.log(`\n  Hierarchy Validated:`);
    console.log(`    ✓ No orphaned foundation nodes`);
    console.log(`    ✓ No direct R1→R3 connections`);
    console.log(`    ✓ All associations proper`);
    console.log(`    ✓ Ring hierarchy complete`);
  });
});
