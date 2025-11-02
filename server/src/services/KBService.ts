import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type Catalog = {
  kb_version?: string
  items: Array<{
    id: string
    name: string
    version: string
    node_types: string[]
    domains: string[]
    tags?: string[]
    path: string
    embedding: string
    raw: string
  }>
}

type PRD = {
  id: string
  name: string
  version: string
  node_types?: string[]
  domains?: string[]
  sections: { title: string; key: string; content: string }[]
}

type Fragment = {
  id: string
  type: 'acceptance_criteria' | 'kpi_set' | 'interface_pattern' | 'ux_states' | 'risk_mitigation' | 'decision_matrix' | 'onboarding_flow' | string
  for: string[]
  content: unknown
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// server root (works from dist or src)
const serverRoot = path.resolve(__dirname, '..') // services -> src
const repoServerRoot = path.resolve(serverRoot, '..') // -> server
const kbRoot = path.join(repoServerRoot, 'src', 'data', 'prd_kb')

const FRAGMENT_PRIORITY: Record<string, number> = {
  decision_matrix: 10,
  interface_pattern: 9,
  onboarding_flow: 8,
  acceptance_criteria: 7,
  kpi_set: 6,
  ux_states: 5,
  risk_mitigation: 4,
}

export type ComposeInput = {
  node_types?: string[]
  domains?: string[]
  tags?: string[]
  limit?: number
}

export class KBService {
  static async readJSON<T>(p: string): Promise<T> {
    const raw = await fs.readFile(p, 'utf-8')
    return JSON.parse(raw) as T
  }

  static resolveKBPath(...segments: string[]): string {
    return path.join(kbRoot, ...segments)
  }

  static async loadCatalog(): Promise<Catalog> {
    const p = this.resolveKBPath('catalog.json')
    return this.readJSON<Catalog>(p)
  }

  static async loadPRD(relPath: string): Promise<PRD> {
    const p = this.resolveKBPath(relPath)
    return this.readJSON<PRD>(p)
  }

  static async listFragments(): Promise<Fragment[]> {
    const root = this.resolveKBPath('fragments')
    const cats = await fs.readdir(root)
    const all: Fragment[] = []
    for (const c of cats) {
      const cDir = path.join(root, c)
      const stat = await fs.stat(cDir)
      if (!stat.isDirectory()) continue
      const files = await fs.readdir(cDir)
      for (const f of files) {
        if (!f.endsWith('.json')) continue
        const frag = await this.readJSON<Fragment>(path.join(cDir, f))
        all.push(frag)
      }
    }
    return all
  }

  static scoreItem(item: Catalog['items'][number], filters: ComposeInput): number {
    let score = 0
    const { node_types = [], domains = [], tags = [] } = filters
    if (node_types.length > 0) {
      score += (item.node_types || []).some((t) => node_types.includes(t)) ? 2 : 0
    }
    if (domains.length > 0) {
      score += (item.domains || []).some((d) => domains.includes(d)) ? 2 : 0
    }
    if (tags.length > 0) {
      score += (item.tags || []).some((tg) => tags.includes(tg)) ? 1 : 0
    }
    return score
  }

  static matches(item: Catalog['items'][number], filters: ComposeInput): boolean {
    const { node_types = [], domains = [], tags = [] } = filters
    const ntOk = node_types.length === 0 || (item.node_types || []).some((t) => node_types.includes(t))
    const dOk = domains.length === 0 || (item.domains || []).some((d) => domains.includes(d))
    const tagOk = tags.length === 0 || (item.tags || []).some((tg) => tags.includes(tg))
    return ntOk && dOk && tagOk
  }

  static pickFragments(all: Fragment[], filters: ComposeInput): Fragment[] {
    const scopes = new Set([...(filters.node_types || []), ...(filters.domains || [])])
    const selected = all.filter((f) => f.for?.some((s) => scopes.has(s)))
    // de-dup and order by priority then id for stability
    const seen = new Set<string>()
    const deduped: Fragment[] = []
    for (const f of selected) {
      if (seen.has(f.id)) continue
      seen.add(f.id)
      deduped.push(f)
    }
    deduped.sort((a, b) => {
      const pa = FRAGMENT_PRIORITY[a.type] || 0
      const pb = FRAGMENT_PRIORITY[b.type] || 0
      if (pb !== pa) return pb - pa
      return a.id.localeCompare(b.id)
    })
    return deduped
  }

  static async compose(filters: ComposeInput) {
    const catalog = await this.loadCatalog()
    const limit = Math.min(Math.max(1, filters.limit ?? 5), 20)
    const candidates = catalog.items
      .filter((it) => this.matches(it, filters))
      .map((it) => ({ it, score: this.scoreItem(it, filters) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.it.id.localeCompare(b.it.id))
      .slice(0, limit)

    const prds: Array<{ id: string; name: string; path: string; sections: PRD['sections'] }> = []
    for (const { it } of candidates) {
      const prd = await this.loadPRD(it.path)
      prds.push({ id: prd.id, name: prd.name, path: it.path, sections: prd.sections })
    }

    const fragments = this.pickFragments(await this.listFragments(), filters)

    return {
      input: filters,
      selectedCount: prds.length,
      prds,
      fragments,
      provenance: {
        catalog: this.resolveKBPath('catalog.json'),
        fragmentRoot: this.resolveKBPath('fragments'),
      },
    }
  }
}

export const kbService = KBService
