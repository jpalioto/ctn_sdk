import { z } from 'zod';
import type { TraitVector, TraitStrategy } from '@ctn/language';

// ============================================================================
// Projection Matrix Schema
// ============================================================================

/**
 * Schema for projection matrix clamp bounds.
 */
export const ClampBoundsSchema = z.tuple([z.number(), z.number()]).readonly()
  .refine(
    ([lo, hi]) => lo <= hi,
    { message: 'Lower bound must be <= upper bound' }
  );

export type ClampBounds = z.infer<typeof ClampBoundsSchema>;

/**
 * Schema for projection matrix with full validation.
 *
 * Validates:
 * - Key alignment: baseline keys = scale keys = clamps keys
 * - Weight keys ⊆ baseline keys
 * - Baseline invariant: lo ≤ b ≤ hi for all parameters
 */
export const ProjectionMatrixSchema = z.object({
  baseline: z.record(z.string(), z.number()),
  weights: z.record(z.string(), z.array(z.number()).readonly()),
  scale: z.record(z.string(), z.number()),
  clamps: z.record(z.string(), ClampBoundsSchema),
}).readonly().superRefine((data, ctx) => {
  const baselineKeys = new Set(Object.keys(data.baseline));
  const scaleKeys = new Set(Object.keys(data.scale));
  const clampKeys = new Set(Object.keys(data.clamps));
  const weightKeys = new Set(Object.keys(data.weights));

  // Check baseline keys = scale keys
  for (const key of baselineKeys) {
    if (!scaleKeys.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Parameter '${key}' has baseline but no scale`,
        path: ['scale'],
      });
    }
    if (!clampKeys.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Parameter '${key}' has baseline but no clamps`,
        path: ['clamps'],
      });
    }
  }

  // Check weight keys ⊆ baseline keys
  for (const key of weightKeys) {
    if (!baselineKeys.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Parameter '${key}' has weights but no baseline`,
        path: ['weights'],
      });
    }
  }

  // Check baseline is within clamps
  for (const [key, baseline] of Object.entries(data.baseline)) {
    const clamps = data.clamps[key];
    if (clamps) {
      const [lo, hi] = clamps;
      if (baseline < lo || baseline > hi) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Baseline ${baseline} outside clamp bounds [${lo}, ${hi}]`,
          path: ['baseline', key],
        });
      }
    }
  }
});

/**
 * Creates a validated projection matrix schema for a specific strategy.
 * Validates weight dimension match against strategy dimensions.
 */
export function createProjectionMatrixSchemaForStrategy(dimensionCount: number) {
  return ProjectionMatrixSchema.superRefine((data, ctx) => {
    for (const [key, weights] of Object.entries(data.weights)) {
      if (weights.length !== dimensionCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Weight row for '${key}' has ${weights.length} elements, expected ${dimensionCount}`,
          path: ['weights', key],
        });
      }
    }
  });
}

/**
 * Parses and validates a projection matrix.
 * @throws ZodError if validation fails
 */
export function parseProjectionMatrix(data: unknown): ProjectionMatrix {
  return ProjectionMatrixSchema.parse(data) as ProjectionMatrix;
}

/**
 * Parses and validates a projection matrix for a specific strategy.
 * @throws ZodError if validation fails
 */
export function parseProjectionMatrixForStrategy(
  data: unknown,
  strategy: TraitStrategy
): ProjectionMatrix {
  const schema = createProjectionMatrixSchemaForStrategy(strategy.dimensions.length);
  return schema.parse(data) as ProjectionMatrix;
}

/**
 * Projection matrix defining the mapping from trait space to API parameters.
 *
 * Mathematical formalism:
 * P = clip(b + s ⊙ (W · τ), lo, hi)
 *
 * Where:
 * - W: Weight matrix (weights)
 * - b: Baseline vector (baseline)
 * - s: Scale vector (scale)
 * - lo, hi: Clamp bounds (clamps)
 * - τ: Trait vector
 * - ⊙: Element-wise product
 */
export interface ProjectionMatrix {
  /**
   * Baseline values for each parameter.
   * These are the values when τ = 0 (zero vector).
   *
   * Invariant: lo[param] ≤ baseline[param] ≤ hi[param]
   */
  readonly baseline: Record<string, number>;

  /**
   * Weight matrix mapping traits to parameters.
   * weights[param][traitIndex] = weight for that trait's contribution.
   *
   * Parameters without weight rows are treated as baseline-only (implicit zeros).
   */
  readonly weights: Record<string, readonly number[]>;

  /**
   * Scale factors for each parameter.
   * Applied after dot product: scaled = dotProduct * scale[param]
   */
  readonly scale: Record<string, number>;

  /**
   * Clamp bounds [lo, hi] for each parameter.
   * Final value is clipped to this range.
   */
  readonly clamps: Record<string, readonly [number, number]>;
}

/**
 * Detailed projection computation for a single parameter.
 */
export interface ProjectionDetail {
  /** Baseline value before trait influence */
  readonly baseline: number;
  /** Dot product of weights and traits */
  readonly dotProduct: number;
  /** Scaled delta: dotProduct * scale */
  readonly scaled: number;
  /** Unclipped delta for tracing */
  readonly unclippedDelta: number;
  /** Raw value before clipping: baseline + scaled */
  readonly raw: number;
  /** Final value after clipping */
  readonly clipped: number;
  /** Whether clipping was applied */
  readonly wasClipped: boolean;
  /** Per-trait contributions for tracing */
  readonly contributions: readonly TraitContribution[];
}

/**
 * Single trait's contribution to a parameter.
 */
export interface TraitContribution {
  readonly traitId: string;
  readonly traitIndex: number;
  readonly weight: number;
  readonly traitValue: number;
  readonly contribution: number; // weight * traitValue
}

/**
 * Result of projecting a trait vector through a projection matrix.
 */
export interface ProjectionResult {
  /** Computed API parameters */
  readonly params: Record<string, number>;
  /** Detailed computation for each parameter */
  readonly details: Record<string, ProjectionDetail>;
}

/**
 * Validation error for projection matrix.
 */
export interface ProjectionValidationError {
  readonly parameter: string;
  readonly issue:
    | 'weight_without_baseline'
    | 'baseline_without_scale'
    | 'baseline_without_clamp'
    | 'baseline_out_of_bounds'
    | 'dimension_mismatch';
  readonly details?: string;
}

/**
 * Warning for lossy projection (traits with no weight).
 */
export interface LossyProjectionWarning {
  readonly traitId: string;
  readonly message: string;
}
