import { z } from 'zod';

/**
 * Schema for TraitVector - a point in the bounded trait space.
 * Domain: τ ∈ ℝⁿ with ‖τ‖ ≤ 1 (unit ball, L2 norm)
 */
export const TraitVectorSchema = z.array(z.number()).readonly();

export type TraitVector = z.infer<typeof TraitVectorSchema>;

/**
 * Mutable version for internal computation.
 */
export type MutableTraitVector = number[];

/**
 * Schema for TraitPoles - semantic meaning at each extreme.
 */
export const TraitPolesSchema = z.object({
  /** Text describing positive direction (+1) */
  positive: z.string(),
  /** Text describing negative direction (-1) */
  negative: z.string(),
}).readonly();

export type TraitPoles = z.infer<typeof TraitPolesSchema>;

/**
 * Schema for TraitDimension - defines a single dimension in trait space.
 */
export const TraitDimensionSchema = z.object({
  /** Unique identifier (e.g., "v1", "v2") */
  id: z.string(),
  /** Zero-based index in the trait vector */
  index: z.number().int().nonnegative(),
  /** Human-readable name (e.g., "Stochasticity") */
  label: z.string(),
  /** Description of what this dimension controls */
  description: z.string(),
  /** Semantic meaning at each pole */
  poles: TraitPolesSchema,
}).readonly();

export type TraitDimension = z.infer<typeof TraitDimensionSchema>;

/**
 * Schema for labeled trait values as a record.
 */
export const LabeledTraitsSchema = z.record(z.string(), z.number()).readonly();

export type LabeledTraits = z.infer<typeof LabeledTraitsSchema>;

/**
 * Validates a trait vector structure.
 */
export function parseTraitVector(data: unknown): TraitVector {
  return TraitVectorSchema.parse(data);
}

/**
 * Safely validates a trait vector, returning result object.
 */
export function safeParseTraitVector(data: unknown) {
  return TraitVectorSchema.safeParse(data);
}

/**
 * Validates a trait dimension structure.
 */
export function parseTraitDimension(data: unknown): TraitDimension {
  return TraitDimensionSchema.parse(data);
}

/**
 * Computes the L2 (Euclidean) magnitude of a trait vector.
 * ‖τ‖ = √(Σ τᵢ²)
 */
export function magnitude(traits: TraitVector): number {
  return Math.sqrt(traits.reduce((sum, x) => sum + x * x, 0));
}

/**
 * Creates a zero vector (identity) of the specified dimension.
 */
export function zeroVector(dimensions: number): TraitVector {
  return Object.freeze(new Array(dimensions).fill(0));
}

/**
 * Validates that a trait vector is within the unit ball.
 * Returns true if ‖τ‖ ≤ 1.
 */
export function isWithinUnitBall(traits: TraitVector): boolean {
  return magnitude(traits) <= 1;
}

/**
 * Refinement schema that validates unit ball constraint.
 */
export const UnitBallTraitVectorSchema = TraitVectorSchema.refine(
  isWithinUnitBall,
  { message: 'Trait vector must be within unit ball (‖τ‖ ≤ 1)' }
);

/**
 * Validates a trait vector is within unit ball.
 */
export function parseUnitBallTraitVector(data: unknown): TraitVector {
  return UnitBallTraitVectorSchema.parse(data);
}
