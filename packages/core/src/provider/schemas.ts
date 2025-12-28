import { z } from 'zod';
import {
  KernelIRSchema,
  ContextPolicySchema,
  FeaturesSchema,
  TraitVectorSchema,
} from '@ctn/language';
import { ProjectionMatrixSchema } from '../projection/types.js';

// ============================================================================
// API Parameters Schema
// ============================================================================

/**
 * Schema for API parameter values.
 * Restricts to safe primitive types only.
 */
export const ApiParamValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.array(z.string()).readonly(),
]);

export type ApiParamValue = z.infer<typeof ApiParamValueSchema>;

/**
 * Schema for API parameters object.
 */
export const ApiParamsSchema = z.record(z.string(), ApiParamValueSchema).readonly();

export type ApiParams = z.infer<typeof ApiParamsSchema>;

// ============================================================================
// Message Schema
// ============================================================================

/**
 * Schema for conversation messages.
 */
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
}).readonly();

export type Message = z.infer<typeof MessageSchema>;

/**
 * Schema for array of messages.
 */
export const MessagesSchema = z.array(MessageSchema).readonly();

// ============================================================================
// Model Configuration Schema (for provider validation)
// ============================================================================

/**
 * Schema for model configuration used in provider responses.
 * Note: This is for runtime validation, not YAML loading.
 * For YAML-based config loading, use ModelConfigSchema from config/index.js
 */
export const ProviderModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextWindow: z.number().int().positive(),
  defaultMaxTokens: z.number().int().positive(),
  supportsThinking: z.boolean().optional(),
  supportsStreaming: z.boolean().optional(),
}).readonly();

export type ProviderModelConfig = z.infer<typeof ProviderModelConfigSchema>;

// ============================================================================
// Projection Detail Schema
// ============================================================================

/**
 * Schema for trait contribution.
 */
export const TraitContributionSchema = z.object({
  traitId: z.string(),
  traitIndex: z.number().int().nonnegative(),
  weight: z.number(),
  traitValue: z.number(),
  contribution: z.number(),
}).readonly();

/**
 * Schema for projection detail.
 */
export const ProjectionDetailSchema = z.object({
  baseline: z.number(),
  dotProduct: z.number(),
  scaled: z.number(),
  unclippedDelta: z.number(),
  raw: z.number(),
  clipped: z.number(),
  wasClipped: z.boolean(),
  contributions: z.array(TraitContributionSchema).readonly(),
}).readonly();

// ============================================================================
// Projected Config Schema
// ============================================================================

/**
 * Schema for projected configuration.
 */
export const ProjectedConfigSchema = z.object({
  model: z.string(),
  apiParams: ApiParamsSchema,
  projectionDetails: z.record(z.string(), ProjectionDetailSchema),
  kernel: z.string(),
  kernelIR: KernelIRSchema,
  contextPolicy: ContextPolicySchema,
  features: FeaturesSchema,
}).readonly();

export type ProjectedConfig = z.infer<typeof ProjectedConfigSchema>;

// ============================================================================
// Provider Response Schema
// ============================================================================

/**
 * Schema for usage statistics.
 */
export const UsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
}).readonly();

/**
 * Schema for finish reason.
 */
export const FinishReasonSchema = z.enum([
  'stop',
  'length',
  'content_filter',
  'tool_calls',
  'error',
]);

/**
 * Schema for provider response.
 */
export const ProviderResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  content: z.string(),
  finishReason: FinishReasonSchema,
  usage: UsageSchema,
}).readonly();

export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

// ============================================================================
// Token Budget Schema
// ============================================================================

/**
 * Schema for token budget.
 */
export const TokenBudgetSchema = z.object({
  modelLimit: z.number().int().positive(),
  systemTokens: z.number().int().nonnegative(),
  historyTokens: z.number().int().nonnegative(),
  currentMessageTokens: z.number().int().nonnegative(),
  reservedOutput: z.number().int().nonnegative(),
  available: z.number().int(),
  overBudget: z.boolean(),
}).readonly();

export type TokenBudget = z.infer<typeof TokenBudgetSchema>;

// ============================================================================
// Request Snapshot Schema
// ============================================================================

/**
 * Schema for request snapshot.
 * Captures the complete state of a request for debugging and audit.
 */
export const RequestSnapshotSchema = z.object({
  timestamp: z.date(),
  model: z.string(),
  config: ProjectedConfigSchema,
  tokenBudget: TokenBudgetSchema,
  messages: MessagesSchema,
  systemPrompt: z.string(),
  finalParams: ApiParamsSchema,
}).readonly();

export type RequestSnapshot = z.infer<typeof RequestSnapshotSchema>;

// ============================================================================
// Response Snapshot Schema
// ============================================================================

/**
 * Schema for response snapshot.
 * Captures the complete response for debugging and audit.
 */
export const ResponseSnapshotSchema = z.object({
  timestamp: z.date(),
  response: ProviderResponseSchema,
  durationMs: z.number().nonnegative(),
}).readonly();

export type ResponseSnapshot = z.infer<typeof ResponseSnapshotSchema>;

// ============================================================================
// Abstract Constraint Schema (for boundary validation)
// ============================================================================

/**
 * Schema for strategy reference.
 * Used to validate the strategy portion of an AbstractConstraint.
 */
export const StrategyRefSchema = z.object({
  name: z.string(),
  version: z.string(),
  dimensions: z.array(z.object({
    id: z.string(),
    index: z.number().int().nonnegative(),
    label: z.string(),
    description: z.string(),
    poles: z.object({
      positive: z.string(),
      negative: z.string(),
    }).readonly(),
  }).readonly()).readonly(),
}).passthrough(); // Allow method properties

/**
 * Schema for validating AbstractConstraint at provider boundaries.
 * Only validates the serializable data portions.
 */
export const AbstractConstraintDataSchema = z.object({
  traits: TraitVectorSchema,
  features: FeaturesSchema,
  kernelIR: KernelIRSchema,
}).readonly();

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates API parameters.
 */
export function parseApiParams(data: unknown): ApiParams {
  return ApiParamsSchema.parse(data);
}

/**
 * Validates a message.
 */
export function parseMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

/**
 * Validates provider response.
 */
export function parseProviderResponse(data: unknown): ProviderResponse {
  return ProviderResponseSchema.parse(data);
}

/**
 * Validates request snapshot.
 */
export function parseRequestSnapshot(data: unknown): RequestSnapshot {
  return RequestSnapshotSchema.parse(data);
}

/**
 * Validates response snapshot.
 */
export function parseResponseSnapshot(data: unknown): ResponseSnapshot {
  return ResponseSnapshotSchema.parse(data);
}

/**
 * Validates AbstractConstraint data at provider boundary.
 */
export function validateAbstractConstraintData(data: unknown): z.infer<typeof AbstractConstraintDataSchema> {
  return AbstractConstraintDataSchema.parse(data);
}
