import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

import type { SuggestedNode } from '../../types/ai.js'
import { normalizeSuggestedNodes } from './normalize.js'

const openAIApiKey = process.env.OPENAI_API_KEY
const openAIClient = openAIApiKey ? new OpenAI({ apiKey: openAIApiKey }) : null

type WizardTurn = {
  userText: string
  aiText?: string
}

interface WizardAIParams {
  idea: string
  workspaceSummary?: string
  previousTurns?: WizardTurn[]
}

interface NextSuggestionParams {
  workspaceSummary?: string
  focusSummary?: string
  limit?: number
}

interface AIResult {
  nodes: SuggestedNode[]
  rationale?: string
}

const BASE_SYSTEM_PROMPT = `You are Strukt AI, the lead architect for a software product team.\n` +
  `You are meeting with a client to plan their product. Respond ONLY in JSON with the following shape:\n` +
  `{"nodes":[{"label":"string","type":"root|frontend|backend|requirement|doc","summary":"string","domain":"business|product|tech|data-ai|operations","ring":1}],"rationale":"string"}\n` +
  `- "type" must be one of: root, frontend, backend, requirement, doc.\n` +
  `- "domain" must be one of: business, product, tech, data-ai, operations.\n` +
  `- "ring" is an integer between 1 and 6 indicating proximity to the center (1 is core).\n` +
  `- Keep labels short and specific. Summaries should be one sentence explaining the intent.\n` +
  `- Do NOT include Markdown, code fences, or commentary outside the JSON.\n`

const NEXT_SYSTEM_PROMPT = BASE_SYSTEM_PROMPT +
  `Focus on deepening or extending the existing architecture. Recommend 1-3 nodes that progress the plan without repeating existing work.`

export function isAIProviderAvailable() {
  return Boolean(openAIClient)
}

export async function generateWizardNodes(params: WizardAIParams): Promise<AIResult> {
  if (!openAIClient) {
    return { nodes: [] }
  }

  const messages = buildWizardMessages(params)

  try {
    const response = await openAIClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: params.previousTurns && params.previousTurns.length > 1 ? 0.45 : 0.75,
      max_tokens: 900,
      messages,
    })

    const content = response.choices?.[0]?.message?.content || ''
    const result = parseAiContent(content)
    if (result.nodes.length > 0) {
      return result
    }
  } catch (error) {
    console.warn('[ai] wizard suggestion generation failed', error)
  }

  return { nodes: [] }
}

export async function generateNextSuggestions(params: NextSuggestionParams): Promise<AIResult> {
  if (!openAIClient) {
    return { nodes: [] }
  }

  const messages = buildNextMessages(params)

  try {
    const response = await openAIClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 600,
      messages,
    })

    const content = response.choices?.[0]?.message?.content || ''
    const result = parseAiContent(content)
    if (result.nodes.length > 0) {
      if (params.limit && result.nodes.length > params.limit) {
        result.nodes = result.nodes.slice(0, params.limit)
      }
      return result
    }
  } catch (error) {
    console.warn('[ai] next suggestion generation failed', error)
  }

  return { nodes: [] }
}

function buildWizardMessages(params: WizardAIParams): ChatCompletionMessageParam[] {
  const context: string[] = []
  if (params.workspaceSummary) {
    context.push(`Current workspace plan:\n${params.workspaceSummary}`)
  }
  if (params.previousTurns && params.previousTurns.length > 1) {
    const history = params.previousTurns
      .slice(-5)
      .map((turn, index) => `Turn ${index + 1} - Client: ${turn.userText}${turn.aiText ? `\nAI Response: ${turn.aiText}` : ''}`)
      .join('\n\n')
    context.push(`Recent discussion:\n${history}`)
  }
  context.push(`Client request: ${params.idea}`)

  return [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
    { role: 'user', content: context.join('\n\n') },
  ] satisfies ChatCompletionMessageParam[]
}

function buildNextMessages(params: NextSuggestionParams): ChatCompletionMessageParam[] {
  const context: string[] = []
  if (params.workspaceSummary) {
    context.push(`Snapshot of current plan:\n${params.workspaceSummary}`)
  }
  if (params.focusSummary) {
    context.push(`Focus area:\n${params.focusSummary}`)
  }
  context.push('Suggest the next 1-3 concrete additions that progress this plan. Each node should describe a specific deliverable or action.')

  return [
    { role: 'system', content: NEXT_SYSTEM_PROMPT },
    { role: 'user', content: context.join('\n\n') },
  ] satisfies ChatCompletionMessageParam[]
}

function parseAiContent(content: string): AIResult {
  const parsed = extractJson(content)
  if (!parsed || !Array.isArray(parsed.nodes)) {
    return { nodes: [] }
  }

  const normalized = normalizeSuggestedNodes(parsed.nodes)
  return {
    nodes: normalized,
    rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
  }
}

function extractJson(content: string): any | null {
  if (!content) return null
  const trimmed = content.trim()
  const directParse = tryParse(trimmed)
  if (directParse) return directParse

  const braceStart = trimmed.indexOf('{')
  const braceEnd = trimmed.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    const candidate = trimmed.slice(braceStart, braceEnd + 1)
    return tryParse(candidate)
  }

  return null
}

function tryParse(value: string): any | null {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
