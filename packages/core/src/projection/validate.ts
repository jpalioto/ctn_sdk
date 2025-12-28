import type { TraitStrategy } from '@ctn/language';
import type {
  ProjectionMatrix,
  ProjectionValidationError,
  LossyProjectionWarning,
} from './types.js';

/**
 * Validates a projection matrix against a strategy.
 *
 * Checks:
 * 1. Key alignment: weights keys ⊆ baseline keys
 * 2. All baseline keys have scale and clamps entries
 * 3. Baseline values are within clamp bounds
 * 4. Weight row dimensions match strategy dimensions
 *
 * @param matrix - The projection matrix to validate
 * @param strategy - The trait strategy to validate against
 * @returns List of validation errors (empty if valid)
 */
export function validateProjectionMatrix(
  matrix: ProjectionMatrix,
  strategy: TraitStrategy
): ProjectionValidationError[] {
  const errors: ProjectionValidationError[] = [];
  const baselineKeys = new Set(Object.keys(matrix.baseline));
  const dims = strategy.dimensions.length;

  // Check weight keys exist in baseline
  for (const param of Object.keys(matrix.weights)) {
    if (!baselineKeys.has(param)) {
      errors.push({
        parameter: param,
        issue: 'weight_without_baseline',
      });
    }

    // Check dimension count matches
    const weights = matrix.weights[param]!;
    if (weights.length !== dims) {
      errors.push({
        parameter: param,
        issue: 'dimension_mismatch',
        details: `Expected ${dims} weights, got ${weights.length}`,
      });
    }
  }

  // Check all baseline keys have scale and clamps
  for (const param of baselineKeys) {
    if (!(param in matrix.scale)) {
      errors.push({
        parameter: param,
        issue: 'baseline_without_scale',
      });
    }

    if (!(param in matrix.clamps)) {
      errors.push({
        parameter: param,
        issue: 'baseline_without_clamp',
      });
    }

    // Check baseline is within clamps
    const clamps = matrix.clamps[param];
    if (clamps) {
      const [lo, hi] = clamps;
      const b = matrix.baseline[param]!;
      if (b < lo || b > hi) {
        errors.push({
          parameter: param,
          issue: 'baseline_out_of_bounds',
          details: `Baseline ${b} outside [${lo}, ${hi}]`,
        });
      }
    }
  }

  return errors;
}

/**
 * Detects lossy projections where traits have no influence on any parameter.
 *
 * A trait is considered "lossy" if no parameter has a non-zero weight for it,
 * meaning the trait's intent is only expressed via the kernel, not API params.
 *
 * @param strategy - The trait strategy
 * @param matrix - The projection matrix
 * @returns Warnings for each lossy trait
 */
export function validateProjectionCoverage(
  strategy: TraitStrategy,
  matrix: ProjectionMatrix
): LossyProjectionWarning[] {
  const warnings: LossyProjectionWarning[] = [];

  for (const dim of strategy.dimensions) {
    const hasWeight = Object.values(matrix.weights).some(
      (row) => row[dim.index] !== 0
    );

    if (!hasWeight) {
      warnings.push({
        traitId: dim.id,
        message: `Trait '${dim.label}' has no projection weight; semantic intent expressed via kernel only`,
      });
    }
  }

  return warnings;
}
