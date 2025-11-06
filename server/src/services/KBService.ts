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
  tags?: string[]
  stack_keywords?: string[]
  risk_profile?: string[]
  kpi_examples?: string[]
  sections: { title: string; key: string; content: string }[]
}

type CatalogMatch = {
  it: Catalog['items'][number]
  score: number
}

type ComposeAttempt = {
  stage: 'strict' | 'dropTags' | 'nodeAndDomain' | 'domainOnly' | 'nodeOnly' | 'any'
  description: string
  filters: ComposeInput
  matches: number
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
  private static _ttlMs = Number(process.env.KB_CACHE_TTL_MS || '60000')
  private static _cache = {
    catalog: { value: null as Catalog | null, ts: 0 },
    fragments: { value: null as Fragment[] | null, ts: 0 },
    prd: new Map<string, { value: PRD; ts: number }>(),
  }

  private static isFresh(ts: number) {
    return Date.now() - ts < this._ttlMs
  }

  private static normalize(values?: string[] | null): string[] {
    return (values ?? [])
      .map((value) => value.toLowerCase().trim())
      .filter(Boolean)
  }

  private static anyOverlap(a: string[], b: string[]): boolean {
    if (!a.length || !b.length) return false
    const set = new Set(a.map((v) => v.toLowerCase()))
    return b.some((v) => set.has(v.toLowerCase()))
  }

  private static overlapCount(a: string[], b: string[]): number {
    if (!a.length || !b.length) return 0
    const set = new Set(b.map((v) => v.toLowerCase()))
    let count = 0
    for (const value of a) {
      if (set.has(value.toLowerCase())) {
        count += 1
      }
    }
    return count
  }
  static async readJSON<T>(p: string): Promise<T> {
    const raw = await fs.readFile(p, 'utf-8')
    return JSON.parse(raw) as T
  }

  static resolveKBPath(...segments: string[]): string {
    return path.join(kbRoot, ...segments)
  }

  static async loadCatalog(): Promise<Catalog> {
    const now = Date.now()
    if (this._cache.catalog.value && this.isFresh(this._cache.catalog.ts)) {
      return this._cache.catalog.value
    }
    const p = this.resolveKBPath('catalog.json')
    const cat = await this.readJSON<Catalog>(p)
    this._cache.catalog = { value: cat, ts: now }
    return cat
  }

  static async loadPRD(relPath: string): Promise<PRD> {
    const now = Date.now()
    const hit = this._cache.prd.get(relPath)
    if (hit && this.isFresh(hit.ts)) return hit.value
    const p = this.resolveKBPath(relPath)
    const prd = await this.readJSON<PRD>(p)
    this._cache.prd.set(relPath, { value: prd, ts: now })
    return prd
  }

  static async listFragments(): Promise<Fragment[]> {
    const now = Date.now()
    if (this._cache.fragments.value && this.isFresh(this._cache.fragments.ts)) {
      return this._cache.fragments.value
    }
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
    this._cache.fragments = { value: all, ts: now }
    return all
  }

  static scoreItem(item: Catalog['items'][number], filters: ComposeInput): number {
    const node_types = this.normalize(filters.node_types)
    const domains = this.normalize(filters.domains)
    const tags = this.normalize(filters.tags)

    const itemNodeTypes = this.normalize(item.node_types)
    const itemDomains = this.normalize(item.domains)
    const itemTags = this.normalize(item.tags)

    const nodeCount = this.overlapCount(node_types, itemNodeTypes)
    const domainCount = this.overlapCount(domains, itemDomains)
    const tagCount = this.overlapCount(tags, itemTags)

    let score = 0

    if (nodeCount > 0) {
      score += 6 + Math.min(4, nodeCount - 1) * 2
    }
    if (domainCount > 0) {
      score += 4 + Math.min(3, domainCount - 1)
    }
    if (tagCount > 0) {
      score += Math.min(5, tagCount)
    }

    // Encourage PRDs that satisfy multiple facets simultaneously.
    if (nodeCount > 0 && domainCount > 0) {
      score += 4
    }
    if (nodeCount > 0 && tagCount > 0) {
      score += 2
    }
    if (domainCount > 0 && tagCount > 0) {
      score += 1
    }

    // Reward fresher catalog ordering when scores tie.
    if (score === 0 && (node_types.length || domains.length || tags.length)) {
      score -= 1
    }

    return score
  }

  static matches(item: Catalog['items'][number], filters: ComposeInput): boolean {
    const node_types = this.normalize(filters.node_types)
    const domains = this.normalize(filters.domains)
    const tags = this.normalize(filters.tags)

    const itemNodeTypes = this.normalize(item.node_types)
    const itemDomains = this.normalize(item.domains)
    const itemTags = this.normalize(item.tags)

    const ntOk = node_types.length === 0 || this.anyOverlap(node_types, itemNodeTypes)
    const dOk = domains.length === 0 || this.anyOverlap(domains, itemDomains)
    const tagOk = tags.length === 0 || this.anyOverlap(tags, itemTags)
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

  private static rankCatalogItems(
    items: Catalog['items'],
    filters: ComposeInput,
    limit: number,
    { requireScore }: { requireScore: boolean }
  ): CatalogMatch[] {
    const scored = items
      .filter((it) => this.matches(it, filters))
      .map((it) => ({ it, score: this.scoreItem(it, filters) }))

    const filtered = requireScore ? scored.filter((entry) => entry.score > 0) : scored

    return filtered
      .sort((a, b) => b.score - a.score || a.it.id.localeCompare(b.it.id))
      .slice(0, limit)
  }

  private static buildAttempts(input: ComposeInput): Array<Omit<ComposeAttempt, 'matches'>> {
    const hasTags = Boolean(input.tags?.length)
    const hasNodeTypes = Boolean(input.node_types?.length)
    const hasDomains = Boolean(input.domains?.length)

    const attempts: Array<Omit<ComposeAttempt, 'matches'>> = [
      {
        stage: 'strict',
        description: 'Strict match on node type, domain, and tags',
        filters: input,
      },
    ]

    if (hasTags) {
      attempts.push({
        stage: 'dropTags',
        description: 'Relax tag requirement (node type + domain only)',
        filters: { ...input, tags: [] },
      })
    }

    if (hasNodeTypes && hasDomains) {
      attempts.push({
        stage: 'nodeAndDomain',
        description: 'Allow partial overlap between node type and domain',
        filters: { node_types: input.node_types, domains: input.domains, tags: [] },
      })
    }

    if (hasDomains) {
      attempts.push({
        stage: 'domainOnly',
        description: 'Domain-only PRD match',
        filters: { domains: input.domains },
      })
    }

    if (hasNodeTypes) {
      attempts.push({
        stage: 'nodeOnly',
        description: 'Node-type only match',
        filters: { node_types: input.node_types },
      })
    }

    attempts.push({
      stage: 'any',
      description: 'Fallback to catalog ordering when no filters produce matches',
      filters: {},
    })

    return attempts
  }

  static async compose(filters: ComposeInput) {
    const catalog = await this.loadCatalog()
    const limit = Math.min(Math.max(1, filters.limit ?? 5), 20)
    const attemptSummaries: ComposeAttempt[] = []
    const attempts = this.buildAttempts(filters)

    let selectedMatches: CatalogMatch[] = []
    let selectedAttempt: ComposeAttempt | null = null

    for (const attempt of attempts) {
      const requireScore = attempt.stage !== 'any'
      const matches = this.rankCatalogItems(catalog.items, attempt.filters, limit, { requireScore })
      const summary: ComposeAttempt = { ...attempt, matches: matches.length }
      attemptSummaries.push(summary)

      if (matches.length && !selectedAttempt) {
        selectedAttempt = summary
        selectedMatches = matches
      }

      if (matches.length) {
        break
      }
    }

    const prds: Array<{
      id: string
      name: string
      path: string
      sections: PRD['sections']
      node_types?: string[]
      domains?: string[]
      tags?: string[]
      stack_keywords?: string[]
      risk_profile?: string[]
      kpi_examples?: string[]
    }> = []
    for (const { it } of selectedMatches) {
      const prd = await this.loadPRD(it.path)
      prds.push({
        id: prd.id,
        name: prd.name,
        path: it.path,
        sections: prd.sections,
        node_types: prd.node_types ?? it.node_types,
        domains: prd.domains ?? it.domains,
        tags: prd.tags ?? it.tags,
        stack_keywords: prd.stack_keywords,
        risk_profile: prd.risk_profile,
        kpi_examples: prd.kpi_examples,
      })
    }

    const fragments = this.pickFragments(await this.listFragments(), filters)
    const candidates = selectedMatches.map(({ it, score }) => ({
      id: it.id,
      name: it.name,
      score,
      path: it.path,
    }))

    return {
      input: filters,
      selectedCount: prds.length,
      prds,
      fragments,
      candidates,
      provenance: {
        catalog: this.resolveKBPath('catalog.json'),
        fragmentRoot: this.resolveKBPath('fragments'),
        matchStage: selectedAttempt?.stage ?? 'none',
        attempts: attemptSummaries,
      },
    }
  }
}

export const kbService = KBService
