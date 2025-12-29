import { z } from 'zod';

/**
 * Schema for clause intensity level.
 * Determined by absolute value of trait:
 * - low:    |value| >= 0.3 && |value| < 0.5
 * - medium: |value| >= 0.5 && |value| < 0.7
 * - high:   |value| >= 0.7
 */
export const ClauseIntensitySchema = z.enum(['low', 'medium', 'high']);

export type ClauseIntensity = z.infer<typeof ClauseIntensitySchema>;

/**
 * Schema for clause polarity.
 */
export const ClausePolaritySchema = z.enum(['positive', 'negative']);

export type ClausePolarity = z.infer<typeof ClausePolaritySchema>;

/**
 * Schema for a single kernel clause representing one active trait.
 */
export const KernelClauseSchema = z.object({
  /** Dimension ID (e.g., "v1") */
  traitId: z.string(),
  /** Index in the trait vector */
  traitIndex: z.number().int().nonnegative(),
  /** Intensity level based on |value| */
  intensity: ClauseIntensitySchema,
  /** Direction (positive or negative) */
  polarity: ClausePolaritySchema,
  /** The text content for this clause */
  text: z.string(),
}).readonly();

export type KernelClause = z.infer<typeof KernelClauseSchema>;

/**
 * Schema for a clause modified by a trait interaction.
 */
export const ModifiedClauseSchema = z.object({
  /** Interaction ID that generated this clause */
  interactionId: z.string(),
  /** Trait IDs that were replaced by this clause */
  replacedTraits: z.array(z.string()).readonly(),
  /** The modified text to use instead */
  text: z.string(),
}).readonly();

export type ModifiedClause = z.infer<typeof ModifiedClauseSchema>;

/**
 * Schema for the provider-agnostic kernel intermediate representation.
 */
export const KernelIRSchema = z.object({
  /** Name of the strategy that generated this kernel */
  strategyName: z.string(),
  /** Version of the strategy */
  strategyVersion: z.string(),
  /** Active trait clauses above threshold */
  clauses: z.array(KernelClauseSchema).readonly(),
  /** Trait IDs that were below threshold and omitted */
  omittedTraits: z.array(z.string()).readonly(),
  /** Clauses modified by trait interactions */
  modifiedClauses: z.array(ModifiedClauseSchema).readonly(),
  /** The composed trait vector (for renderers that need exact values) */
  traitVector: z.array(z.number()).readonly().optional(),
}).readonly();

export type KernelIR = z.infer<typeof KernelIRSchema>;

/**
 * Threshold for including a trait in kernel clauses.
 * Traits with |value| < KERNEL_THRESHOLD are omitted.
 */
export const KERNEL_THRESHOLD = 0.3;

/**
 * Determines the intensity level based on trait value magnitude.
 */
export function getClauseIntensity(absValue: number): ClauseIntensity {
  if (absValue >= 0.7) return 'high';
  if (absValue >= 0.5) return 'medium';
  return 'low';
}

/**
 * Determines the polarity based on trait value sign.
 */
export function getClausePolarity(value: number): ClausePolarity {
  return value > 0 ? 'positive' : 'negative';
}

/**
 * Creates an empty KernelIR for the identity (zero) vector.
 */
export function emptyKernelIR(
  strategyName: string,
  strategyVersion: string,
  traitVector?: readonly number[]
): KernelIR {
  return {
    strategyName,
    strategyVersion,
    clauses: [],
    omittedTraits: [],
    modifiedClauses: [],
    traitVector: traitVector ? [...traitVector] : undefined,
  };
}

/**
 * Validates a KernelIR structure.
 */
export function parseKernelIR(data: unknown): KernelIR {
  return KernelIRSchema.parse(data);
}

/**
 * Safely validates KernelIR, returning result object.
 */
export function safeParseKernelIR(data: unknown) {
  return KernelIRSchema.safeParse(data);
}

/**
 * Validates a KernelClause structure.
 */
export function parseKernelClause(data: unknown): KernelClause {
  return KernelClauseSchema.parse(data);
}
