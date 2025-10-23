import { Router, Request, Response } from 'express'
import PRDTemplate from '../models/PRDTemplate.js'
import { embeddingService } from '../services/EmbeddingService.js'
import EmbeddingService from '../services/EmbeddingService.js'
import { prdRetrievalService } from '../services/PRDRetrievalService.js'

const router = Router()

/**
 * GET /api/prd-templates
 * Retrieve all PRD templates with optional filtering
 *
 * Query parameters:
 * - category?: string - Filter by category
 * - tags?: string (comma-separated) - Filter by tags
 * - complexity?: 'simple' | 'medium' | 'complex' - Filter by complexity
 * - limit?: number - Limit results (default: 100)
 * - skip?: number - Skip results (default: 0)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      tags,
      complexity,
      limit = 100,
      skip = 0,
    } = req.query

    // Build filter
    const filter: Record<string, any> = {}

    if (category) {
      filter.category = category
    }

    if (tags) {
      const tagArray = (tags as string).split(',').map((t) => t.trim())
      filter.tags = { $in: tagArray }
    }

    if (complexity) {
      filter.complexity = complexity
    }

    // Execute query
    const templates = await PRDTemplate.find(filter)
      .limit(Number(limit))
      .skip(Number(skip))
      .select('-embedding') // Don't return embedding vector unless specifically requested
      .sort({ created_at: -1 })

    const total = await PRDTemplate.countDocuments(filter)

    res.json({
      success: true,
      data: templates,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: Number(skip) + Number(limit) < total,
      },
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
    })
  }
})

/**
 * GET /api/prd-templates/category/:category
 * Retrieve templates by category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params
    const { limit = 10, skip = 0 } = req.query

    const templates = await PRDTemplate.find({ category })
      .limit(Number(limit))
      .skip(Number(skip))
      .select('-embedding')
      .sort({ created_at: -1 })

    res.json({
      success: true,
      category,
      data: templates,
    })
  } catch (error) {
    console.error('Error fetching templates by category:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
    })
  }
})

/**
 * GET /api/prd-templates/:templateId
 * Retrieve a single PRD template by ID
 */
router.get('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params

    const template = await PRDTemplate.findOne({ template_id: templateId }).select(
      '-embedding'
    )

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      })
    }

    res.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch template',
    })
  }
})

/**
 * GET /api/prd-templates/tags/:tags
 * Retrieve templates by multiple tags
 */
router.get('/tags/:tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.params
    const tagArray = tags.split(',').map((t) => t.trim())

    const templates = await PRDTemplate.find({
      tags: { $in: tagArray },
    })
      .select('-embedding')
      .sort({ created_at: -1 })

    res.json({
      success: true,
      query: { tags: tagArray },
      data: templates,
      count: templates.length,
    })
  } catch (error) {
    console.error('Error fetching templates by tags:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
    })
  }
})

/**
 * GET /api/prd-templates/list/categories
 * Get all available categories
 */
router.get('/list/categories', async (req: Request, res: Response) => {
  try {
    const categories = await PRDTemplate.distinct('category').sort()

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    })
  }
})

/**
 * GET /api/prd-templates/list/tags
 * Get all available tags across templates
 */
router.get('/list/tags', async (req: Request, res: Response) => {
  try {
    const tags = await PRDTemplate.distinct('tags').sort()

    res.json({
      success: true,
      data: tags,
      count: tags.length,
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tags',
    })
  }
})

/**
 * GET /api/prd-templates/stats
 * Get statistics about available templates
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const total = await PRDTemplate.countDocuments()
    const categories = await PRDTemplate.distinct('category')
    const tags = await PRDTemplate.distinct('tags')
    const complexities = await PRDTemplate.distinct('complexity')

    const stats = {
      total_templates: total,
      categories: categories.length,
      tags_count: tags.length,
      complexity_distribution: {},
    }

    for (const complexity of complexities) {
      const count = await PRDTemplate.countDocuments({ complexity })
      stats.complexity_distribution = {
        ...stats.complexity_distribution,
        [complexity]: count,
      }
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    })
  }
})

/**
 * POST /api/prd-templates/search/semantic
 * Semantic search using vector similarity
 *
 * Body:
 *   query: string - Search query text
 *   limit?: number - Number of results (default: 5, max: 20)
 *   minSimilarity?: number - Minimum similarity score (0-1, default: 0.5)
 */
router.post('/search/semantic', async (req: Request, res: Response) => {
  try {
    const { query, limit = 5, minSimilarity = 0.5 } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query text is required',
      })
    }

    if (!embeddingService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Semantic search is not available. OpenAI API not configured.',
      })
    }

    const limitNum = Math.min(Math.max(1, Number(limit)), 20)
    const similarityThreshold = Math.max(0, Math.min(1, Number(minSimilarity)))

    // Generate embedding for query
    const queryEmbedding = await embeddingService.embedText(query)

    // Get all templates with embeddings
    const templates = await PRDTemplate.find({
      embedding: { $exists: true, $ne: null },
    })

    if (templates.length === 0) {
      return res.json({
        success: true,
        query,
        results: [],
        message: 'No templates with embeddings found',
      })
    }

    // Calculate similarity scores
    const results = templates
      .map((template) => {
        if (!template.embedding) {
          return null
        }

        const similarity = EmbeddingService.cosineSimilarity(
          queryEmbedding,
          template.embedding
        )

        return {
          template_id: template.template_id,
          name: template.name,
          category: template.category,
          description: template.description,
          similarity: Number(similarity.toFixed(4)),
          tags: template.tags,
          complexity: template.complexity,
        }
      })
      .filter((r) => r !== null && r.similarity >= similarityThreshold)
      .sort((a, b) => (b?.similarity || 0) - (a?.similarity || 0))
      .slice(0, limitNum)

    res.json({
      success: true,
      query,
      resultsCount: results.length,
      data: results,
    })
  } catch (error) {
    console.error('Error in semantic search:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Semantic search failed',
    })
  }
})

/**
 * GET /api/prd-templates/search/health
 * Check embedding service health and statistics
 */
router.get('/search/health', async (req: Request, res: Response) => {
  try {
    const modelInfo = embeddingService.getModelInfo()
    const templatesWithEmbeddings = await PRDTemplate.countDocuments({
      embedding: { $exists: true, $ne: null },
    })
    const totalTemplates = await PRDTemplate.countDocuments()

    res.json({
      success: true,
      data: {
        embeddingService: {
          available: modelInfo.available,
          model: modelInfo.model,
          dimensions: modelInfo.dimensions,
        },
        templates: {
          total: totalTemplates,
          withEmbeddings: templatesWithEmbeddings,
          withoutEmbeddings: totalTemplates - templatesWithEmbeddings,
          readyForSemanticSearch: templatesWithEmbeddings > 0,
        },
      },
    })
  } catch (error) {
    console.error('Error checking search health:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
    })
  }
})

/**
 * POST /api/prd-templates/retrieve/text-search
 * Text search across PRD content with ranking
 *
 * Body:
 *   query: string - Search text
 *   limit?: number - Results limit (default: 10)
 */
router.post('/retrieve/text-search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query text is required',
      })
    }

    const results = await prdRetrievalService.textSearch(query, Math.min(Number(limit), 20))

    res.json({
      success: true,
      query,
      resultsCount: results.length,
      data: results,
    })
  } catch (error) {
    console.error('Error in text search:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Text search failed',
    })
  }
})

/**
 * POST /api/prd-templates/retrieve/advanced-search
 * Advanced search with multiple filters and ranking
 *
 * Body:
 *   text?: string - Search text
 *   category?: string - Filter by category
 *   tags?: string[] - Filter by tags
 *   complexity?: string - Filter by complexity
 *   minEffort?: number - Minimum effort hours
 *   maxEffort?: number - Maximum effort hours
 *   limit?: number - Results limit (default: 10)
 *   skip?: number - Pagination offset (default: 0)
 */
router.post('/retrieve/advanced-search', async (req: Request, res: Response) => {
  try {
    const {
      text,
      category,
      tags,
      complexity,
      minEffort,
      maxEffort,
      limit = 10,
      skip = 0,
    } = req.body

    const results = await prdRetrievalService.advancedSearch({
      text,
      category,
      tags: Array.isArray(tags) ? tags : undefined,
      complexity,
      minEffort: minEffort !== undefined ? Number(minEffort) : undefined,
      maxEffort: maxEffort !== undefined ? Number(maxEffort) : undefined,
      limit: Math.min(Number(limit), 50),
      skip: Math.max(0, Number(skip)),
    })

    res.json({
      success: true,
      filters: {
        text: text || undefined,
        category: category || undefined,
        tags: tags || undefined,
        complexity: complexity || undefined,
        effort: minEffort !== undefined || maxEffort !== undefined ? { min: minEffort, max: maxEffort } : undefined,
      },
      resultsCount: results.length,
      data: results,
    })
  } catch (error) {
    console.error('Error in advanced search:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Advanced search failed',
    })
  }
})

/**
 * GET /api/prd-templates/:templateId/recommendations
 * Get recommendations based on a template
 */
router.get('/:templateId/recommendations', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params
    const { limit = 5 } = req.query

    const recommendations = await prdRetrievalService.getRecommendations(
      templateId,
      Math.min(Number(limit), 10)
    )

    res.json({
      success: true,
      templateId,
      recommendationsCount: recommendations.length,
      data: recommendations,
    })
  } catch (error) {
    console.error('Error getting recommendations:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendations',
    })
  }
})

/**
 * GET /api/prd-templates/retrieve/cache-stats
 * Get cache statistics
 */
router.get('/retrieve/cache-stats', async (req: Request, res: Response) => {
  try {
    const stats = prdRetrievalService.getCacheStats()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cache stats',
    })
  }
})

export default router
