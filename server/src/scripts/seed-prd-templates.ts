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
import PRDTemplate from '../models/PRDTemplate'
import { config } from 'dotenv'

config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/strukt'
const TEMPLATES_DIR = path.join(__dirname, '../data/prd_templates')

interface TemplateFile {
  template_id: string
  name: string
  version: string
  tags: string[]
  category: string
  description: string
  created_at: string
  updated_at: string
  sections: Array<{
    title: string
    key: string
    content: string
  }>
  suggested_technologies: string[]
  complexity: 'simple' | 'medium' | 'complex'
  estimated_effort_hours: number
  team_size: number
}

async function loadTemplates(): Promise<void> {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log(`✅ Connected to MongoDB at ${MONGO_URI}`)

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
