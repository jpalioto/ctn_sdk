import type { TraitVector, MutableTraitVector } from '../schemas/index.js';
import { magnitude } from '../schemas/index.js';

/**
 * Saturating normalization for trait vectors.
 *
 * Enforces the unit-ball constraint: ‖τ‖ ≤ 1
 *
 * Formula: saturate(V) = V / max(1, ‖V‖)
 *
 * This preserves direction while clamping magnitude to at most 1.
 * Vectors already within the unit ball are unchanged.
 */
export function saturate(traits: TraitVector): TraitVector {
  const mag = magnitude(traits);

  // If already within unit ball, return as-is
  if (mag <= 1) {
    return traits;
  }

  // Scale down to unit ball boundary
  const result: MutableTraitVector = new Array(traits.length);
  for (let i = 0; i < traits.length; i++) {
    result[i] = traits[i]! / mag;
  }

  return Object.freeze(result);
}

/**
 * Checks if a trait vector is at the saturation boundary.
 * Returns true if the vector is on or very close to the unit sphere.
 */
export function isSaturated(traits: TraitVector, epsilon = 1e-10): boolean {
  const mag = magnitude(traits);
  return Math.abs(mag - 1) < epsilon;
}

/**
 * Information about saturation applied during composition.
 */
export interface SaturationResult {
  /** The normalized trait vector */
  readonly traits: TraitVector;
  /** Whether normalization was applied */
  readonly wasNormalized: boolean;
  /** Magnitude before normalization */
  readonly preMagnitude: number;
  /** Magnitude after normalization (always ≤ 1) */
  readonly postMagnitude: number;
}

/**
 * Saturates a trait vector and returns detailed information.
 */
export function saturateWithInfo(traits: TraitVector): SaturationResult {
  const preMagnitude = magnitude(traits);
  const wasNormalized = preMagnitude > 1;
  const normalizedTraits = wasNormalized ? saturate(traits) : traits;
  const postMagnitude = wasNormalized ? 1 : preMagnitude;

  return {
    traits: normalizedTraits,
    wasNormalized,
    preMagnitude,
    postMagnitude,
  };
}
