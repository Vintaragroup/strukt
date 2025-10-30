#!/usr/bin/env tsx

/**
 * Convert Markdown-based PRD templates to our JSON template schema.
 *
 * Usage:
 *   npx tsx src/scripts/convert-md-templates.ts [--input src/data/prd_templates] [--force]
 *
 * The script looks for .md files, parses common sections, and produces JSON
 * counterparts next to them. Manually review the generated files to fine-tune
 * metadata (tags, technologies, api_guidance, etc.) before seeding.
 */

import fs from 'fs'
import path from 'path'
import process from 'process'

type TechnologyProfile = {
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

type TemplateFile = {
  template_id: string
  name: string
  version: string
  tags: string[]
  category: 'Product' | 'Frontend' | 'Backend' | 'Mobile' | 'Data & AI' | 'Operations' | 'Planning'
  description: string
  created_at: string
  updated_at: string
  sections: Array<{ title: string; key: string; content: string }>
  suggested_technologies: string[]
  technology_profile?: TechnologyProfile
  api_guidance?: Array<{
    name: string
    provider?: string
    category?: string
    rationale: string
    recommended_calls?: string[]
    integration_points?: string[]
  }>
  complexity: 'simple' | 'medium' | 'high'
  estimated_effort_hours: number
  team_size: number
  knowledge_graph_tags?: string[]
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const inputArgIndex = args.indexOf('--input')
const inputDir = inputArgIndex !== -1 ? args[inputArgIndex + 1] : path.join(process.cwd(), 'src', 'data', 'prd_templates')

if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
  console.error(`Input directory not found: ${inputDir}`)
  process.exit(1)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function detectCategory(name: string): TemplateFile['category'] {
  const lower = name.toLowerCase()
  if (lower.includes('mobile') || lower.includes('react native') || lower.includes('flutter')) return 'Mobile'
  if (
    lower.includes('frontend') ||
    lower.includes('ux') ||
    lower.includes('design') ||
    lower.includes('next.js') ||
    lower.includes('web app')
  ) {
    return 'Frontend'
  }
  if (
    lower.includes('backend') ||
    lower.includes('api') ||
    lower.includes('microservice') ||
    lower.includes('platform')
  ) {
    return 'Backend'
  }
  if (lower.includes('data') || lower.includes('ml') || lower.includes('ai') || lower.includes('analytics')) {
    return 'Data & AI'
  }
  if (lower.includes('operations') || lower.includes('ops')) return 'Operations'
  return 'Product'
}

function toTags(name: string, description: string) {
  const words = (name + ' ' + description)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
  const unique = Array.from(new Set(words))
  return unique.slice(0, 8)
}

function keyFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function parseSections(markdown: string) {
  const lines = markdown.split('\n')
  let currentHeading: string | null = null
  const contentMap = new Map<string, string[]>()
  let intro: string[] = []

  for (const line of lines) {
    const headingMatch = /^##\s+(.*)/.exec(line)
    if (headingMatch) {
      currentHeading = headingMatch[1].trim()
      if (!contentMap.has(currentHeading)) {
        contentMap.set(currentHeading, [])
      }
      continue
    }

    if (currentHeading) {
      contentMap.get(currentHeading)?.push(line)
    } else {
      intro.push(line)
    }
  }

  const sections: Array<{ title: string; key: string; content: string }> = []
  for (const [title, contentLines] of contentMap.entries()) {
    const cleaned = contentLines.join('\n').trim()
    if (!cleaned) continue
    sections.push({
      title,
      key: keyFromTitle(title),
      content: cleaned,
    })
  }

  const introText = intro.join('\n').trim()
  return { sections, intro: introText }
}

function parseTechnicalOverview(section: string | undefined): { profile: TechnologyProfile; suggested: string[] } {
  const profile: TechnologyProfile = {}
  const suggested: string[] = []
  if (!section) return { profile, suggested }

  const lines = section.split('\n')
  for (const line of lines) {
    const match = /^\s*-\s+\*\*(.+?):\*\*\s*(.+)$/.exec(line.trim())
    if (!match) continue
    const key = match[1].toLowerCase()
    const values = match[2].split(/[,•]/).map((v) => v.trim()).filter(Boolean)
    suggested.push(...values)

    const assign = (field: keyof TechnologyProfile) => {
      profile[field] = Array.from(new Set([...(profile[field] ?? []), ...values]))
    }

    if (key.includes('framework') || key.includes('runtime') || key.includes('language')) {
      assign('backend')
      if (key.includes('language')) {
        assign('languages')
      }
    } else if (key.includes('frontend') || key.includes('ui') || key.includes('design')) {
      assign('frontend')
    } else if (key.includes('mobile')) {
      assign('mobile')
    } else if (key.includes('database') || key.includes('data') || key.includes('storage')) {
      assign('data')
    } else if (key.includes('authentication') || key.includes('authorization')) {
      assign('backend')
    } else if (key.includes('devops') || key.includes('deployment') || key.includes('infrastructure')) {
      assign('devops')
    } else if (key.includes('testing')) {
      assign('testing')
    } else if (key.includes('documentation') || key.includes('tool')) {
      assign('tooling')
    } else {
      assign('backend')
    }
  }

  return { profile, suggested }
}

function buildTemplate(mdPath: string, markdown: string): TemplateFile {
  const baseName = path.basename(mdPath, '.md')
  const templateId = slugify(baseName)
  const titleMatch = /^#\s+(.*)$/m.exec(markdown)
  const name = titleMatch ? titleMatch[1].trim() : baseName.replace(/_/g, ' ')

  const { sections, intro } = parseSections(markdown)

  const description = intro
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .slice(0, 2)
    .join(' ')

  const technicalSection = sections.find((section) => section.title.toLowerCase().includes('technical overview'))
  const { profile, suggested } = parseTechnicalOverview(technicalSection?.content)

  const category = detectCategory(name)
  const tags = Array.from(new Set([...toTags(name, description), category.toLowerCase()])).slice(0, 10)

  const now = new Date().toISOString().split('T')[0]

  const template: TemplateFile = {
    template_id: templateId,
    name,
    version: '1.0.0',
    tags,
    category,
    description: description || `Template generated from ${baseName}`,
    created_at: now,
    updated_at: now,
    sections,
    suggested_technologies: Array.from(new Set(suggested)),
    technology_profile: Object.keys(profile).length ? profile : undefined,
    api_guidance: [],
    complexity: sections.length > 6 ? 'high' : sections.length > 3 ? 'medium' : 'simple',
    estimated_effort_hours: sections.length > 6 ? 120 : sections.length > 3 ? 80 : 40,
    team_size: sections.length > 6 ? 4 : 3,
    knowledge_graph_tags: Array.from(new Set([category.toLowerCase(), ...tags])),
  }

  return template
}

function writeTemplate(mdFile: string) {
  const fullPath = path.join(inputDir, mdFile)
  const markdown = fs.readFileSync(fullPath, 'utf-8')
  const template = buildTemplate(fullPath, markdown)

  const outputPath = path.join(inputDir, `${path.basename(mdFile, '.md')}.json`)
  if (!force && fs.existsSync(outputPath)) {
    console.log(`Skipping existing JSON: ${outputPath}`)
    return
  }

  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2) + '\n', 'utf-8')
  console.log(`Generated template: ${outputPath}`)
}

const mdFiles = fs
  .readdirSync(inputDir)
  .filter((file) => file.endsWith('.md'))

if (!mdFiles.length) {
  console.log('No Markdown templates found to convert.')
  process.exit(0)
}

mdFiles.forEach(writeTemplate)

console.log('\nConversion complete. Please review generated JSON files for accuracy before seeding.')
