import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type CatalogItem = {
  id: string
  name: string
  version: string
  node_types: string[]
  domains: string[]
  tags?: string[]
  path: string
  embedding: string
  raw: string
}

type PRD = {
  id: string
  name: string
  version: string
  sections: { title: string; key: string; content: string }[]
}

type Fragment = {
  id: string
  type: string
  for: string[]
  content: unknown
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// server root from scripts directory (dist or src agnostic)
const serverRoot = path.resolve(__dirname, '..') // src/scripts -> src
const kbRoot = path.join(path.resolve(serverRoot, '..'), 'src', 'data', 'prd_kb')

function hasPlaceholder(s: string): boolean {
  const lower = s.toLowerCase()
  return lower.includes('tbd') || lower.includes('lorem ipsum') || lower.includes('to be decided')
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function readJSON<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, 'utf-8')
  return JSON.parse(raw) as T
}

async function validateCatalog(): Promise<number> {
  let errors = 0
  const catalogPath = path.join(kbRoot, 'catalog.json')
  if (!(await exists(catalogPath))) {
    console.error(`KB error: catalog.json missing at ${catalogPath}`)
    return 1
  }

  const catalog = await readJSON<{ items: CatalogItem[] }>(catalogPath)
  const seenIds = new Set<string>()
  for (const item of catalog.items) {
    // basic shape
    if (!item.id || !item.path || !item.raw || !item.embedding) {
      console.error(`KB error: catalog item missing required fields: ${item.id}`)
      errors++
      continue
    }
    if (seenIds.has(item.id)) {
      console.error(`KB error: duplicate catalog id: ${item.id}`)
      errors++
    }
    seenIds.add(item.id)

    // file existence
    const prdPath = path.join(kbRoot, item.path)
    const rawPath = path.join(kbRoot, item.raw)
    const embPath = path.join(kbRoot, item.embedding)
    for (const [label, p] of [
      ['PRD', prdPath],
      ['RAW', rawPath],
      ['EMB', embPath],
    ] as const) {
      if (!(await exists(p))) {
        console.error(`KB error: missing ${label} file for ${item.id}: ${p}`)
        errors++
      }
    }

    // section validation
    try {
      const prd = await readJSON<PRD>(prdPath)
      const keys = new Set<string>()
      for (const s of prd.sections || []) {
        if (!s.key || !s.title) {
          console.error(`KB error: section missing key/title in ${item.id}`)
          errors++
        }
        if (keys.has(s.key)) {
          console.error(`KB error: duplicate section key '${s.key}' in ${item.id}`)
          errors++
        }
        keys.add(s.key)
        if (!s.content || typeof s.content !== 'string' || hasPlaceholder(s.content)) {
          console.error(`KB error: invalid or placeholder content in ${item.id} section '${s.key}'`)
          errors++
        }
      }
    } catch (e) {
      console.error(`KB error: failed reading PRD JSON for ${item.id}:`, (e as Error).message)
      errors++
    }
  }
  return errors
}

async function validateFragments(): Promise<number> {
  let errors = 0
  const fragRoot = path.join(kbRoot, 'fragments')
  const categories = await fs.readdir(fragRoot)
  for (const c of categories) {
    const cDir = path.join(fragRoot, c)
    const stat = await fs.stat(cDir)
    if (!stat.isDirectory()) continue
    const files = await fs.readdir(cDir)
    for (const f of files) {
      const fPath = path.join(cDir, f)
      try {
        const frag = await readJSON<Fragment>(fPath)
        if (!frag.id || !frag.type || !Array.isArray(frag.for)) {
          console.error(`KB error: bad fragment shape at ${fPath}`)
          errors++
        }
      } catch (e) {
        console.error(`KB error: fragment JSON parse failed at ${fPath}:`, (e as Error).message)
        errors++
      }
    }
  }
  return errors
}

async function main() {
  console.log(`KB validate: scanning ${kbRoot}`)
  const catalogErrors = await validateCatalog()
  const fragmentErrors = await validateFragments()
  const total = catalogErrors + fragmentErrors
  if (total === 0) {
    console.log('KB validate: OK (no issues found)')
    process.exit(0)
  } else {
    console.error(`KB validate: FAILED with ${total} issues`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('KB validate: unexpected error', e)
  process.exit(1)
})
