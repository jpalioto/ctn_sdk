import type { TraitVector, TraitStrategy } from '@ctn/language';
import type {
  ProjectionMatrix,
  ProjectionResult,
  ProjectionDetail,
  TraitContribution,
} from './types.js';

/**
 * Projects a trait vector through a projection matrix to produce API parameters.
 *
 * Mathematical formalism:
 * For each parameter j:
 *   p_j = clip(b_j + s_j * Σ(W_ji * τ_i), lo_j, hi_j)
 *
 * @param traits - The trait vector to project
 * @param matrix - The projection matrix
 * @param strategy - The trait strategy (for dimension labels)
 * @returns Projected parameters with computation details
 */
export function projectTraits(
  traits: TraitVector,
  matrix: ProjectionMatrix,
  strategy: TraitStrategy
): ProjectionResult {
  const params: Record<string, number> = {};
  const details: Record<string, ProjectionDetail> = {};

  // Iterate over baseline keys (not weights) per spec
  for (const param of Object.keys(matrix.baseline)) {
    const baseline = matrix.baseline[param]!;
    const scale = matrix.scale[param] ?? 1;
    const [lo, hi] = matrix.clamps[param] ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];

    // Get weights for this parameter (implicit zeros if not defined)
    const weights = matrix.weights[param] ?? new Array(traits.length).fill(0);

    // Compute dot product with trait contributions
    const contributions: TraitContribution[] = [];
    let dotProduct = 0;

    for (let i = 0; i < traits.length; i++) {
      const weight = weights[i] ?? 0;
      const traitValue = traits[i]!;
      const contribution = weight * traitValue;

      dotProduct += contribution;

      contributions.push({
        traitId: strategy.dimensions[i]?.id ?? `v${i + 1}`,
        traitIndex: i,
        weight,
        traitValue,
        contribution,
      });
    }

    // Apply scale
    const scaled = dotProduct * scale;
    const unclippedDelta = scaled;

    // Compute raw value
    const raw = baseline + scaled;

    // Clip to bounds
    const clipped = Math.max(lo, Math.min(hi, raw));
    const wasClipped = raw !== clipped;

    params[param] = clipped;
    details[param] = {
      baseline,
      dotProduct,
      scaled,
      unclippedDelta,
      raw,
      clipped,
      wasClipped,
      contributions,
    };
  }

  return { params, details };
}
