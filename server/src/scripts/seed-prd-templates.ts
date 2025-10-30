#!/usr/bin/env node

/**
 * Seed Script: Load PRD Templates into MongoDB
 *
 * Usage:
 *   npm run seed:prd-templates
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Clears existing PRD templates (if --reset flag provided)
 * 3. Loads all PRD templates from /data/prd_templates/
 * 4. Indexes templates for querying
 * 5. Reports success/failure
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import OpenAI from 'openai'
import PRDTemplate from '../models/PRDTemplate'
import { config } from 'dotenv'

config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/strukt'
const TEMPLATES_DIR = path.join(__dirname, '../data/prd_templates')
const GENERATE_EMBEDDINGS =
  process.argv.includes('--embed') || process.env.GENERATE_TEMPLATE_EMBEDDINGS === 'true'

interface TemplateFile {
  template_id: string
  name: string
  version: string
  tags: string[]
  category: string
  description: string
  created_at?: string
  updated_at?: string
  sections: Array<{
    title: string
    key: string
    content: string
  }>
  suggested_technologies?: string[]
  technology_profile?: {
    languages?: string[]
    frontend?: string[]
    backend?: string[]
    mobile?: string[]
    data?: string[]
    devops?: string[]
    testing?: string[]
    tooling?: string[]
    notes?: string
  }
  api_guidance?: Array<{
    name: string
    provider?: string
    category?: string
    rationale: string
    recommended_calls?: string[]
    integration_points?: string[]
  }>
  complexity?: 'simple' | 'medium' | 'complex' | 'high'
  estimated_effort_hours?: number
  team_size?: number
  knowledge_graph_tags?: string[]
  embedding?: number[]
}

const openAIApiKey = process.env.OPENAI_API_KEY
const openAIClient = GENERATE_EMBEDDINGS && openAIApiKey ? new OpenAI({ apiKey: openAIApiKey }) : null

function redactMongoUri(uri: string) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i, (_m, p1, user) => `${p1}${user}:******@`)
}

function summariseTemplate(template: TemplateFile) {
  const parts: string[] = [
    template.name,
    template.category,
    template.description,
    `tags: ${template.tags.join(', ')}`,
  ]

  if (template.suggested_technologies?.length) {
    parts.push(`suggested: ${template.suggested_technologies.join(', ')}`)
  }
  if (template.technology_profile) {
    const profileEntries = Object.entries(template.technology_profile)
      .filter(([, value]) => Array.isArray(value) ? value.length : Boolean(value))
      .map(([key, value]) =>
        Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`
      )
    if (profileEntries.length) {
      parts.push(`profile: ${profileEntries.join(' | ')}`)
    }
  }
  if (template.api_guidance?.length) {
    const apiHints = template.api_guidance
      .map((item) => `${item.name}: ${item.rationale}`)
      .join(' | ')
    parts.push(`apis: ${apiHints}`)
  }
  return parts.join('\n')
}

async function maybeGenerateEmbedding(templateData: TemplateFile): Promise<number[] | undefined> {
  if (!GENERATE_EMBEDDINGS) return undefined
  if (!openAIClient) {
    console.warn('⚠️  Skipping embeddings (OpenAI client unavailable)')
    return undefined
  }

  try {
    const summary = summariseTemplate(templateData)
    const response = await openAIClient.embeddings.create({
      model: process.env.TEMPLATE_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: summary,
    })
    const embedding = response.data?.[0]?.embedding
    if (!embedding) {
      console.warn(`⚠️  Received empty embedding for ${templateData.name}`)
      return undefined
    }
    return embedding
  } catch (error) {
    console.error(`⚠️  Failed to generate embedding for ${templateData.name}:`, error)
    return undefined
  }
}

async function loadTemplates(): Promise<void> {
  try {
  console.log('🔗 Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log(`✅ Connected to MongoDB at ${redactMongoUri(MONGO_URI)}`)

    // Check for --reset flag
    const shouldReset = process.argv.includes('--reset')
    if (shouldReset) {
      console.log('🗑️  Clearing existing templates...')
      await PRDTemplate.deleteMany({})
      console.log('✅ Templates cleared')
    }

    // Read all template files
    console.log('\n📂 Loading template files from', TEMPLATES_DIR)
    const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'))
    console.log(`📋 Found ${files.length} template files`)

    if (files.length === 0) {
      throw new Error('No template files found in ' + TEMPLATES_DIR)
    }

    // Load and seed each template
    const results = []
    for (const file of files) {
      const filePath = path.join(TEMPLATES_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const templateData: TemplateFile = JSON.parse(content)

      try {
        const embedding = templateData.embedding ?? (await maybeGenerateEmbedding(templateData))

        // Check if template already exists
        const existing = await PRDTemplate.findOne({
          template_id: templateData.template_id,
        })

        if (existing && !shouldReset) {
          console.log(`⏭️  Skipping (exists): ${templateData.name}`)
          results.push({
            file,
            status: 'skipped',
            message: 'Already exists',
          })
          continue
        }

        // Create or update template
        const template = await PRDTemplate.findOneAndUpdate(
          { template_id: templateData.template_id },
          {
            ...templateData,
            embedding,
            updated_at: new Date(),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        )

        console.log(`✅ Seeded: ${templateData.name}`)
        results.push({
          file,
          status: 'success',
          template_id: templateData.template_id,
        })
      } catch (error) {
        console.error(`❌ Failed to seed ${file}:`, error instanceof Error ? error.message : String(error))
        results.push({
          file,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Summary
    console.log('\n📊 Seeding Summary')
    console.log('=================')
    const successful = results.filter((r) => r.status === 'success').length
    const skipped = results.filter((r) => r.status === 'skipped').length
    const failed = results.filter((r) => r.status === 'error').length

    console.log(`✅ Successful: ${successful}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Failed: ${failed}`)

    // Verify count in DB
    const count = await PRDTemplate.countDocuments()
    console.log(`\n📈 Total templates in MongoDB: ${count}`)

    // List all templates
    console.log('\n📋 Loaded Templates:')
    const templates = await PRDTemplate.find({}, 'template_id name category').sort('template_id')
    templates.forEach((t) => {
      console.log(`  • ${t.template_id}: ${t.name} (${t.category})`)
    })

    if (failed > 0) {
      throw new Error(`${failed} templates failed to seed`)
    }

    console.log('\n✨ Seeding complete!')
  } catch (error) {
    console.error(
      '💥 Fatal error:',
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

loadTemplates()
