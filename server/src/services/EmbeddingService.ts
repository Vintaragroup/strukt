import { OpenAI } from 'openai'
import { config } from '../config/env.js'

/**
 * EmbeddingService
 *
 * Handles generation of vector embeddings for PRD content using OpenAI.
 * Uses text-embedding-3-large model for semantic search.
 *
 * Model Info:
 * - text-embedding-3-large: 3072 dimensions, excellent for semantic search
 * - Input limit: 8191 tokens
 * - Cost: $0.13 per 1M input tokens
 */

const EMBEDDING_MODEL = 'text-embedding-3-large'
const EMBEDDING_DIMENSIONS = 3072

class EmbeddingService {
  private openai: OpenAI | null = null

  constructor() {
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey,
      })
    }
  }

  /**
   * Check if embeddings are available
   */
  isAvailable(): boolean {
    return this.openai !== null
  }

  /**
   * Generate a single embedding for text
   *
   * @param text - The text to embed
   * @returns Vector embedding (3072 dimensions)
   * @throws Error if OpenAI is not configured
   */
  async embedText(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot embed empty text')
    }

    try {
      const response = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data returned from OpenAI')
      }

      const embedding = response.data[0].embedding
      if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
        )
      }

      return embedding
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate embedding: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Generate embeddings for PRD template content
   *
   * Concatenates relevant sections of PRD to create a comprehensive embedding
   *
   * @param prdData - PRD template data
   * @returns Vector embedding
   */
  async embedPRD(prdData: {
    name: string
    description: string
    category: string
    tags: string[]
    sections?: Array<{ title: string; content: string }>
    suggested_technologies?: string[]
  }): Promise<number[]> {
    // Build comprehensive text from PRD components
    const parts: string[] = [
      `Title: ${prdData.name}`,
      `Category: ${prdData.category}`,
      `Description: ${prdData.description}`,
      `Tags: ${prdData.tags.join(', ')}`,
    ]

    if (prdData.suggested_technologies && prdData.suggested_technologies.length > 0) {
      parts.push(`Technologies: ${prdData.suggested_technologies.join(', ')}`)
    }

    if (prdData.sections && prdData.sections.length > 0) {
      prdData.sections.forEach((section) => {
        parts.push(`${section.title}:\n${section.content}`)
      })
    }

    const combinedText = parts.join('\n\n')

    // Truncate to avoid token limit issues (8191 tokens ≈ 32k characters)
    const truncated = combinedText.substring(0, 30000)

    return this.embedText(truncated)
  }

  /**
   * Batch embed multiple texts
   *
   * @param texts - Array of texts to embed
   * @returns Array of embeddings
   */
  async batchEmbed(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }

    if (texts.length === 0) {
      return []
    }

    if (texts.length > 100) {
      throw new Error('Batch size exceeds limit of 100')
    }

    try {
      // Filter out empty texts
      const validTexts = texts.filter((t) => t && t.trim().length > 0)

      if (validTexts.length === 0) {
        throw new Error('No valid texts to embed')
      }

      const response = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: validTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data returned from OpenAI')
      }

      // Sort by index to maintain input order
      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to batch embed: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Cosine similarity score (0-1)
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * Get embedding model info
   */
  getModelInfo(): {
    model: string
    dimensions: number
    available: boolean
  } {
    return {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      available: this.isAvailable(),
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService()

export default EmbeddingService
