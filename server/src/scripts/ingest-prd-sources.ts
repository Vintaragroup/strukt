#!/usr/bin/env tsx

/**
 * Fetch external PRD templates and store them locally for conversion.
 *
 * The script reads docs/prd_sources.json, downloads each entry, and writes
 * the content into server/src/data/prd_templates/ (or a custom directory per entry).
 * Supported formats: markdown, json, plain text. After downloading, it logs
 * next steps (e.g., running the converter for Markdown assets).
 */

import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type SourceFormat = 'markdown' | 'json' | 'text'

interface PRDSource {
  id: string
  name?: string
  url: string
  format: SourceFormat
  output_dir?: string
  filename?: string
  headers?: Record<string, string>
}

const SERVER_ROOT = path.resolve(__dirname, '../..')
const REPO_ROOT = path.resolve(__dirname, '../../..')
const DEFAULT_OUTPUT = path.join(SERVER_ROOT, 'src', 'data', 'prd_templates')
const SOURCES_FILE = path.resolve(REPO_ROOT, 'docs/prd_sources.json')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function extensionFor(format: SourceFormat) {
  switch (format) {
    case 'markdown':
      return '.md'
    case 'json':
      return '.json'
    default:
      return '.txt'
  }
}

async function downloadSource(source: PRDSource) {
  const outputDir = source.output_dir
    ? path.resolve(REPO_ROOT, source.output_dir)
    : DEFAULT_OUTPUT

  ensureDir(outputDir)

  const ext = extensionFor(source.format)
  const fileName = source.filename
    ? source.filename
    : `${source.id}${ext}`

  const outputPath = path.join(outputDir, fileName)

  const response = await fetch(source.url, {
    headers: source.headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.url}: ${response.status} ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  const content = Buffer.from(buffer)
  fs.writeFileSync(outputPath, content)

  return { outputPath, format: source.format }
}

function loadSources(): PRDSource[] {
  if (!fs.existsSync(SOURCES_FILE)) {
    console.warn(`Source list missing: ${SOURCES_FILE}`)
    console.warn('Create docs/prd_sources.json with an array of PRD sources to ingest.')
    return []
  }

  const raw = fs.readFileSync(SOURCES_FILE, 'utf-8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('docs/prd_sources.json must contain an array of sources')
  }
  return parsed as PRDSource[]
}

async function main() {
  const sources = loadSources()
  if (!sources.length) {
    console.log('No sources to ingest. Update docs/prd_sources.json and rerun.')
    return
  }

  const results: Array<{ id: string; outputPath: string; format: SourceFormat }> = []

  for (const source of sources) {
    try {
      console.log(`Fetching ${source.id} from ${source.url}...`)
      const result = await downloadSource(source)
      results.push({ id: source.id, outputPath: result.outputPath, format: result.format })
      console.log(`  ✓ Saved to ${result.outputPath}`)
    } catch (error) {
      console.error(`  ✗ Failed to fetch ${source.id}:`, error instanceof Error ? error.message : error)
    }
  }

  const markdownDownloads = results.filter((r) => r.format === 'markdown')
  if (markdownDownloads.length) {
    console.log('\nNext step: convert Markdown templates into JSON:')
    console.log('  npm --prefix server run convert:templates -- --force')
  }

  console.log('\nIngestion complete. Review downloaded files before seeding.')
}

main().catch((error) => {
  console.error('Fatal error during ingestion:', error)
  process.exit(1)
})
