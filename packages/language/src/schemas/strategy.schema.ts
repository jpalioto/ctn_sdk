import { z } from 'zod';
import {
  TraitVectorSchema,
  TraitDimensionSchema,
  LabeledTraitsSchema,
  type TraitVector,
  type TraitDimension,
  type LabeledTraits,
} from './trait.schema.js';

/**
 * Schema for constraint parameters.
 */
export const ConstraintParamsSchema = z.record(z.string(), z.unknown()).readonly();

export type ConstraintParams = z.infer<typeof ConstraintParamsSchema>;

/**
 * Schema for strategy threshold configuration.
 */
export const StrategyThresholdsSchema = z.object({
  /** Threshold for including a trait in kernel clauses. Default: 0.3 */
  kernel: z.number().min(0).max(1).default(0.3),
  /** Threshold for trait interaction conditions. Default: 0.5 */
  interaction: z.number().min(0).max(1).default(0.5),
}).readonly();

export type StrategyThresholds = z.infer<typeof StrategyThresholdsSchema>;

/** Default threshold values */
export const DEFAULT_THRESHOLDS: StrategyThresholds = Object.freeze({
  kernel: 0.3,
  interaction: 0.5,
});

/**
 * Schema for strategy metadata (serializable portion).
 */
export const StrategyMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  dimensionCount: z.number().int().positive(),
  dimensionIds: z.array(z.string()).readonly(),
  thresholds: StrategyThresholdsSchema.optional(),
}).readonly();

export type StrategyMetadata = z.infer<typeof StrategyMetadataSchema>;

/**
 * The TraitStrategy interface defines the semantic meaning of the trait space.
 *
 * Note: This is an interface with methods, so we define it manually
 * rather than deriving from a schema. The schema is used for metadata only.
 */
export interface TraitStrategy {
  readonly name: string;
  readonly version: string;
  readonly dimensions: readonly TraitDimension[];
  /** Configurable thresholds for kernel generation and interactions */
  readonly thresholds: StrategyThresholds;

  identity(): TraitVector;
  add(a: TraitVector, b: TraitVector): TraitVector;
  resolve(name: string, params: ConstraintParams): TraitVector;
  formatVector(traits: TraitVector): LabeledTraits;
  formatVectorCompact(traits: TraitVector): string;
}

/**
 * Extracts metadata from a strategy for serialization.
 */
export function getStrategyMetadata(strategy: TraitStrategy): StrategyMetadata {
  return {
    name: strategy.name,
    version: strategy.version,
    dimensionCount: strategy.dimensions.length,
    dimensionIds: strategy.dimensions.map((d) => d.id),
    thresholds: strategy.thresholds,
  };
}

/**
 * Validates strategy metadata structure.
 */
export function parseStrategyMetadata(data: unknown): StrategyMetadata {
  return StrategyMetadataSchema.parse(data);
}
