import PRDTemplate from '../models/PRDTemplate.js'

/**
 * PRD Retrieval Service
 *
 * Handles intelligent retrieval and ranking of PRD templates
 * based on text search, semantic similarity, and metadata matching.
 */

export interface PRDQuery {
  text?: string
  category?: string
  tags?: string[]
  complexity?: string
  minEffort?: number
  maxEffort?: number
  limit?: number
  skip?: number
}

export interface RetrievalResult {
  template_id: string
  name: string
  category: string
  description: string
  tags: string[]
  complexity?: string
  estimated_effort_hours?: number
  relevance_score?: number
}

interface SearchResult {
  template: any
  score: number
  matched_fields: string[]
}

class PRDRetrievalService {
  /**
   * Simple LRU cache for frequently accessed templates
   */
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheMaxSize = 50
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Text search across PRD content
   *
   * @param searchText - Text to search for
   * @param limit - Maximum results (default: 10)
   * @returns Ranked results
   */
  async textSearch(searchText: string, limit: number = 10): Promise<RetrievalResult[]> {
    if (!searchText || searchText.trim().length === 0) {
      return []
    }

    const searchWords = searchText.toLowerCase().split(/\s+/).filter((w) => w.length > 0)

    try {
      const templates = await PRDTemplate.find({}).lean()

      // Score each template
      const results: SearchResult[] = templates
        .map((template) => {
          let score = 0
          const matched_fields: string[] = []

          // Search in name (highest weight)
          const nameLower = template.name.toLowerCase()
          searchWords.forEach((word) => {
            if (nameLower.includes(word)) {
              score += 10
              if (!matched_fields.includes('name')) {
                matched_fields.push('name')
              }
            }
          })

          // Search in description (medium weight)
          const descLower = template.description.toLowerCase()
          searchWords.forEach((word) => {
            if (descLower.includes(word)) {
              score += 5
              if (!matched_fields.includes('description')) {
                matched_fields.push('description')
              }
            }
          })

          // Search in tags (medium weight)
          template.tags.forEach((tag: string) => {
            const tagLower = tag.toLowerCase()
            searchWords.forEach((word) => {
              if (tagLower === word || tagLower.includes(word)) {
                score += 3
                if (!matched_fields.includes('tags')) {
                  matched_fields.push('tags')
                }
              }
            })
          })

          // Search in sections (low weight)
          if (template.sections) {
            template.sections.forEach((section: any) => {
              const sectionText =
                `${section.title} ${section.content}`.toLowerCase()
              searchWords.forEach((word) => {
                if (sectionText.includes(word)) {
                  score += 1
                  if (!matched_fields.includes('sections')) {
                    matched_fields.push('sections')
                  }
                }
              })
            })
          }

          // Search in technologies (low weight)
          if (template.suggested_technologies) {
            template.suggested_technologies.forEach((tech: string) => {
              const techLower = tech.toLowerCase()
              searchWords.forEach((word) => {
                if (techLower === word || techLower.includes(word)) {
                  score += 2
                  if (!matched_fields.includes('technologies')) {
                    matched_fields.push('technologies')
                  }
                }
              })
            })
          }

          return { template, score, matched_fields }
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return results.map((r) => ({
        template_id: r.template.template_id,
        name: r.template.name,
        category: r.template.category,
        description: r.template.description,
        tags: r.template.tags,
        complexity: r.template.complexity,
        estimated_effort_hours: r.template.estimated_effort_hours,
        relevance_score: r.score,
      }))
    } catch (error) {
      console.error('Text search error:', error)
      throw error
    }
  }

  /**
   * Advanced query with multiple filters and ranking
   */
  async advancedSearch(query: PRDQuery): Promise<RetrievalResult[]> {
    const { text, category, tags, complexity, minEffort, maxEffort, limit = 10, skip = 0 } =
      query

    try {
      // Build MongoDB filter
      const filter: Record<string, any> = {}

      if (category) {
        filter.category = category
      }

      if (complexity) {
        filter.complexity = complexity
      }

      if (tags && tags.length > 0) {
        filter.tags = { $in: tags }
      }

      if (minEffort !== undefined || maxEffort !== undefined) {
        filter.estimated_effort_hours = {}
        if (minEffort !== undefined) {
          filter.estimated_effort_hours.$gte = minEffort
        }
        if (maxEffort !== undefined) {
          filter.estimated_effort_hours.$lte = maxEffort
        }
      }

      let templates = await PRDTemplate.find(filter).lean()

      // Apply text search scoring if provided
      if (text && text.trim().length > 0) {
        const searchWords = text.toLowerCase().split(/\s+/).filter((w) => w.length > 0)

        templates = templates
          .map((template) => {
            let score = 0

            // Name matching (highest priority)
            if (template.name.toLowerCase().includes(text.toLowerCase())) {
              score += 100
            }

            // Word matching
            searchWords.forEach((word) => {
              if (template.name.toLowerCase().includes(word)) score += 20
              if (template.description.toLowerCase().includes(word)) score += 10
              if (template.tags.some((t: string) => t.toLowerCase().includes(word))) score += 15
              if (template.category.toLowerCase().includes(word)) score += 5
            })

            return { template, score }
          })
          .filter((r) => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((r) => r.template)
      }

      // Apply pagination
      const results = templates.slice(skip, skip + limit)

      return results.map((template) => ({
        template_id: template.template_id,
        name: template.name,
        category: template.category,
        description: template.description,
        tags: template.tags,
        complexity: template.complexity,
        estimated_effort_hours: template.estimated_effort_hours,
      }))
    } catch (error) {
      console.error('Advanced search error:', error)
      throw error
    }
  }

  /**
   * Get recommendations based on a template
   *
   * Finds similar templates based on shared tags and category
   */
  async getRecommendations(templateId: string, limit: number = 5): Promise<RetrievalResult[]> {
    try {
      const template = await PRDTemplate.findOne({ template_id: templateId }).lean()

      if (!template) {
        return []
      }

      // Find similar templates
      const similar = await PRDTemplate.find({
        template_id: { $ne: templateId },
        $or: [{ category: template.category }, { tags: { $in: template.tags } }],
      })
        .lean()
        .limit(limit)

      return similar.map((t) => ({
        template_id: t.template_id,
        name: t.name,
        category: t.category,
        description: t.description,
        tags: t.tags,
        complexity: t.complexity,
        estimated_effort_hours: t.estimated_effort_hours,
      }))
    } catch (error) {
      console.error('Recommendations error:', error)
      return []
    }
  }

  /**
   * Cache management
   */
  private setCacheItem(key: string, data: any): void {
    // Simple LRU eviction
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  private getCacheItem(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Check TTL
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      ttl: this.cacheTTL,
    }
  }
}

// Export singleton
export const prdRetrievalService = new PRDRetrievalService()

export default PRDRetrievalService
