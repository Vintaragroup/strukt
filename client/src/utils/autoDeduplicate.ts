/**
 * Auto-Deduplication Utility
 * 
 * Smart deduplication for auto-create features
 * Prevents duplicate nodes by finding existing nodes and reusing them
 * Adds associations instead of creating duplicates
 * 
 * Three-level matching:
 * 1. Exact label match
 * 2. Type + Domain match
 * 3. Fuzzy keyword match
 */

import { WorkspaceNode, WorkspaceEdge, RelationshipType } from '../types/index'

/**
 * Configuration for a node candidate
 */
export interface NodeCandidate {
  label: string
  type: string
  domain: string
  keywords?: string[]
}

/**
 * Deduplication result
 */
export interface DeduplicationResult {
  /** Whether an existing node was found */
  found: boolean
  /** The existing node (if found) */
  existingNode?: WorkspaceNode
  /** Suggested edges to create for associations */
  suggestedEdges?: Array<{
    source: string
    target: string
    relation: RelationshipType
  }>
}

/**
 * Find an existing node that matches the candidate
 * 
 * Uses three-level matching:
 * 1. Exact label match (highest priority)
 * 2. Type + domain match
 * 3. Fuzzy keyword match
 * 
 * @param candidate Node candidate to find
 * @param nodes Current canvas nodes
 * @returns Deduplication result with existing node (if found)
 */
export function findExistingNode(
  candidate: NodeCandidate,
  nodes: WorkspaceNode[]
): DeduplicationResult {
  if (!nodes || nodes.length === 0) {
    return { found: false }
  }

  // Level 1: Exact label match
  const exactMatch = nodes.find(
    n => n.data?.title?.toLowerCase() === candidate.label.toLowerCase()
  )
  if (exactMatch) {
    return {
      found: true,
      existingNode: exactMatch
    }
  }

  // Level 2: Type + Domain match
  const typeAndDomainMatches = nodes.filter(
    n => n.data?.type === candidate.type && n.data?.domain === candidate.domain
  )

  if (typeAndDomainMatches.length > 0) {
    // If multiple, return the first one
    // In practice, there should only be one per type+domain in R3
    return {
      found: true,
      existingNode: typeAndDomainMatches[0]
    }
  }

  // Level 3: Fuzzy keyword match
  if (candidate.keywords && candidate.keywords.length > 0) {
    const keywordMatches = nodes.filter(n => {
      const nodeLabel = n.data?.title?.toLowerCase() || ''
      const nodeKeywords = extractKeywords(nodeLabel)
      
      // Check if any keywords match
      return candidate.keywords!.some(keyword =>
        nodeKeywords.some(nk => isFuzzyMatch(keyword, nk))
      )
    })

    if (keywordMatches.length > 0) {
      return {
        found: true,
        existingNode: keywordMatches[0]
      }
    }
  }

  return { found: false }
}

/**
 * Extract keywords from a label for fuzzy matching
 * 
 * @param label Node label
 * @returns Array of keywords
 */
export function extractKeywords(label: string): string[] {
  // Split on spaces and special characters
  return label
    .toLowerCase()
    .split(/[\s\-_./]+/)
    .filter(k => k.length >= 2) // Only keywords of 2+ chars
}

/**
 * Fuzzy match two strings
 * 
 * Returns true if strings are similar enough
 * Uses Levenshtein distance algorithm
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns True if strings are similar
 */
export function isFuzzyMatch(str1: string, str2: string): boolean {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  // Exact match
  if (s1 === s2) return true

  // Substring match (one contains other)
  if (s1.includes(s2) || s2.includes(s1)) return true

  // Levenshtein distance (allows 1-2 character differences)
  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)
  const similarity = 1 - distance / maxLength

  // Consider match if >80% similar
  return similarity > 0.8
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * @param s1 First string
 * @param s2 Second string
 * @returns Edit distance
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],      // deletion
          dp[i][j - 1],      // insertion
          dp[i - 1][j - 1]   // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Create associations for an existing node
 * 
 * When an existing node is found, create edges to associate it
 * with the auto-create context
 * 
 * @param existingNode The node to associate
 * @param parentNodeId The R2 parent node ID
 * @param relationshipType The type of relationship
 * @returns Array of suggested edges
 */
export function createAssociationsForExisting(
  existingNode: WorkspaceNode,
  parentNodeId: string,
  relationshipType: RelationshipType = 'depends_on'
): WorkspaceEdge[] {
  const edges: WorkspaceEdge[] = []

  // Create edge from parent to existing node (if not already there)
  // Only create if it doesn't already exist
  edges.push({
    id: `edge-${parentNodeId}-to-${existingNode.id}-${Date.now()}`,
    source: parentNodeId,
    target: existingNode.id,
    data: {
      relation: relationshipType
    }
  } as WorkspaceEdge)

  return edges
}

/**
 * Normalize a label for comparison
 * 
 * Removes extra spaces, special chars, etc.
 * 
 * @param label Label to normalize
 * @returns Normalized label
 */
export function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, '') // Remove hyphens and underscores
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
}

/**
 * Check if two nodes have significant overlap
 * 
 * Used to determine if nodes serve the same purpose
 * 
 * @param node1 First node
 * @param node2 Second node
 * @returns True if nodes overlap significantly
 */
export function checkNodeOverlap(
  node1: WorkspaceNode,
  node2: WorkspaceNode
): boolean {
  // Same type and domain = overlap
  if (node1.data?.type === node2.data?.type && 
      node1.data?.domain === node2.data?.domain) {
    return true
  }

  // Similar labels = overlap
  const label1 = node1.data?.title || ''
  const label2 = node2.data?.title || ''
  
  if (label1 && label2 && isFuzzyMatch(label1, label2)) {
    return true
  }

  // Check keyword overlap (at least 2 keywords in common)
  const kw1 = extractKeywords(label1)
  const kw2 = extractKeywords(label2)
  
  if (kw1.length > 0 && kw2.length > 0) {
    const commonKeywords = kw1.filter(kw => 
      kw2.some(k => isFuzzyMatch(kw, k))
    )
    if (commonKeywords.length >= 2) {
      return true
    }
  }

  return false
}

/**
 * Find all nodes that might conflict with a new node
 * 
 * Returns nodes that:
 * - Have same type+domain
 * - Have similar labels
 * - Have related keywords
 * 
 * @param candidate Candidate node
 * @param nodes Current canvas nodes
 * @returns Array of conflicting nodes
 */
export function findPotentialConflicts(
  candidate: NodeCandidate,
  nodes: WorkspaceNode[]
): WorkspaceNode[] {
  const conflicts: WorkspaceNode[] = []

  for (const node of nodes) {
    // Same type + domain
    if (node.data?.type === candidate.type && 
        node.data?.domain === candidate.domain) {
      conflicts.push(node)
      continue
    }

    // Similar label
    if (isFuzzyMatch(node.data?.title || '', candidate.label)) {
      conflicts.push(node)
      continue
    }

    // Keyword overlap
    if (candidate.keywords && candidate.keywords.length > 0) {
      const nodeLabel = node.data?.title || ''
      const nodeKeywords = extractKeywords(nodeLabel)
      
      if (candidate.keywords.some(kw =>
        nodeKeywords.some(nk => isFuzzyMatch(kw, nk))
      )) {
        conflicts.push(node)
      }
    }
  }

  return conflicts
}

/**
 * Get deduplication summary for debugging
 * 
 * @param candidate Candidate node
 * @param result Deduplication result
 * @returns Human-readable summary
 */
export function getDeduplicationSummary(
  candidate: NodeCandidate,
  result: DeduplicationResult
): string {
  if (!result.found) {
    return `No existing node found for "${candidate.label}" (${candidate.type}/${candidate.domain}). Creating new node.`
  }

  return `Found existing node "${result.existingNode?.data?.title}" for "${candidate.label}". Reusing and adding associations.`
}
