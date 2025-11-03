import { z } from 'zod'

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')

export const SuggestedNodeSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  type: z.string().default('requirement'),
  summary: z.string().optional(),
  domain: z.string().optional(),
  ring: z.number().int().min(1).max(6).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const SuggestedEdgeSchema = z.object({
  id: z.string().optional(),
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  sourceLabel: z.string().optional(),
  targetLabel: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const SuggestionActionSchema = z.object({
  type: z.enum(['ADD_NODE', 'LINK', 'UPDATE_NODE', 'TAG', 'NOTE']),
  payload: z.record(z.unknown()),
})

const KnowledgeSectionSchema = z.object({
  title: z.string(),
  key: z.string().optional(),
  snippet: z.string(),
})

const KnowledgePrdSchema = z.object({
  id: z.string(),
  name: z.string(),
  sections: z.array(KnowledgeSectionSchema),
})

const KnowledgeFragmentSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
})

export const SuggestionKnowledgeSchema = z.object({
  filters: z.object({
    nodeTypes: z.array(z.string()),
    domains: z.array(z.string()),
    tags: z.array(z.string()),
  }),
  summary: z.string(),
  prds: z.array(KnowledgePrdSchema),
  fragments: z.array(KnowledgeFragmentSchema),
  questionHints: z.array(z.string()),
  promptContext: z.string().optional().default(''),
})

export const SuggestionResultSchema = z.object({
  sessionId: z.string().optional(),
  suggestions: z.array(SuggestedNodeSchema),
  edges: z.array(SuggestedEdgeSchema).optional(),
  rationale: z.string().optional(),
  source: z.enum(['ai', 'heuristic']).optional(),
  foundationInjected: z.boolean().optional(),
  knowledge: SuggestionKnowledgeSchema.optional(),
})

export const StartWizardBody = z.object({
  workspaceId: objectIdSchema,
  userText: z.string().min(1),
})

export const ContinueWizardBody = z.object({
  sessionId: objectIdSchema,
  userText: z.string().min(1),
})

export const SuggestionRequestBody = z.object({
  workspaceId: objectIdSchema,
  cursorNodeId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(10).optional(),
  focusLabel: z.string().min(1).optional(),
  focusSummary: z.string().min(1).optional(),
  focusType: z.string().min(1).optional(),
  focusDomain: z.string().min(1).optional(),
  focusRing: z.number().int().min(1).max(6).optional(),
  specReferenceId: z.string().regex(/^[0-9a-f]{64}$/i, 'Invalid spec reference').optional(),
  apiIntent: z.string().min(3).max(500).optional(),
})

export const ApplySuggestionBody = z.object({
  suggestionId: objectIdSchema,
})

export const FeedbackBody = z.object({
  workspaceId: objectIdSchema,
  sessionId: objectIdSchema.optional(),
  nodeIds: z.array(objectIdSchema).optional(),
  suggestionId: objectIdSchema.optional(),
  reason: z.string().min(1),
  flags: z.array(z.string()).default([]),
  context: z.record(z.unknown()).optional(),
})

export type SuggestedNode = z.infer<typeof SuggestedNodeSchema>
export type SuggestedEdge = z.infer<typeof SuggestedEdgeSchema>
export type SuggestionAction = z.infer<typeof SuggestionActionSchema>
export type SuggestionResult = z.infer<typeof SuggestionResultSchema>
export type SuggestionKnowledge = z.infer<typeof SuggestionKnowledgeSchema>
export type StartWizardBodyInput = z.infer<typeof StartWizardBody>
export type ContinueWizardBodyInput = z.infer<typeof ContinueWizardBody>
export type SuggestionRequestBodyInput = z.infer<typeof SuggestionRequestBody>
export type ApplySuggestionBodyInput = z.infer<typeof ApplySuggestionBody>
export type FeedbackBodyInput = z.infer<typeof FeedbackBody>
