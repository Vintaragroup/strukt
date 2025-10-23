#!/usr/bin/env node

/**
 * Generate Embeddings Script
 *
 * Generates vector embeddings for all PRD templates using OpenAI's
 * text-embedding-3-large model and stores them in MongoDB.
 *
 * Usage:
 *   npm run generate:embeddings
 *
 * Requires:
 *   OPENAI_API_KEY environment variable set
 *   MongoDB connection working
 */

import { config } from 'dotenv'
config()

import mongoose from 'mongoose'
import PRDTemplate from '../models/PRDTemplate'
import { embeddingService } from '../services/EmbeddingService'

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard'

async function generateEmbeddings(): Promise<void> {
  try {
    console.log('🔍 Embedding Service Status')
    console.log('==========================')
    const modelInfo = embeddingService.getModelInfo()
    console.log(`Model: ${modelInfo.model}`)
    console.log(`Dimensions: ${modelInfo.dimensions}`)
    console.log(`Available: ${modelInfo.available ? '✅ Yes' : '❌ No'}`)

    if (!embeddingService.isAvailable()) {
      throw new Error('❌ OpenAI API key not configured. Set OPENAI_API_KEY environment variable.')
    }

    console.log('\n🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log(`✅ Connected to MongoDB`)

    console.log('\n📚 Fetching PRD templates...')
    const templates = await PRDTemplate.find({})
    console.log(`📋 Found ${templates.length} templates`)

    if (templates.length === 0) {
      throw new Error('No templates found in MongoDB. Run seed script first.')
    }

    console.log('\n🔄 Generating embeddings...')
    console.log('========================')

    let successCount = 0
    let errorCount = 0
    const errors: Array<{ template_id: string; error: string }> = []

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      const progress = `[${i + 1}/${templates.length}]`

      try {
        console.log(`${progress} Processing: ${template.name}...`)

        const embedding = await embeddingService.embedPRD({
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
          sections: template.sections,
          suggested_technologies: template.suggested_technologies,
        })

        // Update template with embedding
        template.embedding = embedding
        await template.save()

        console.log(`${progress} ✅ Embedded: ${template.template_id} (${embedding.length} dims)`)
        successCount++

        // Add small delay to avoid rate limiting (embeds are cheap but good practice)
        if (i < templates.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`${progress} ❌ Failed: ${template.template_id} - ${errorMsg}`)
        errorCount++
        errors.push({
          template_id: template.template_id,
          error: errorMsg,
        })
      }
    }

    console.log('\n📊 Embedding Summary')
    console.log('===================')
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${errorCount}`)

    if (errorCount > 0) {
      console.log('\n⚠️  Failed Templates:')
      errors.forEach((err) => {
        console.log(`   • ${err.template_id}: ${err.error}`)
      })
    }

    // Verify embeddings were stored
    console.log('\n🔍 Verifying stored embeddings...')
    const withEmbeddings = await PRDTemplate.countDocuments({ embedding: { $exists: true, $ne: null } })
    const withoutEmbeddings = templates.length - withEmbeddings

    console.log(`✅ Templates with embeddings: ${withEmbeddings}`)
    console.log(`❌ Templates without embeddings: ${withoutEmbeddings}`)

    // Show sample embedding stats
    console.log('\n📈 Embedding Statistics:')
    const samples = await PRDTemplate.find({ embedding: { $exists: true } }).limit(1)
    if (samples.length > 0 && samples[0].embedding) {
      const emb = samples[0].embedding
      const mean = emb.reduce((a, b) => a + b, 0) / emb.length
      const max = Math.max(...emb)
      const min = Math.min(...emb)
      console.log(`   Sample vector (${samples[0].name}):`)
      console.log(`   • Dimensions: ${emb.length}`)
      console.log(`   • Mean: ${mean.toFixed(4)}`)
      console.log(`   • Max: ${max.toFixed(4)}`)
      console.log(`   • Min: ${min.toFixed(4)}`)
    }

    if (errorCount === 0) {
      console.log('\n✨ All embeddings generated successfully!')
    } else {
      throw new Error(`${errorCount} templates failed to generate embeddings`)
    }
  } catch (error) {
    console.error(
      '💥 Fatal error:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

generateEmbeddings()
