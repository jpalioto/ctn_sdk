import type { ProjectionMatrix } from '@ctn/core';

/**
 * Projection matrix for the Operational strategy on Anthropic Claude models.
 *
 * Maps the 7-dimensional trait space to Anthropic API parameters:
 * - temperature: Controls randomness (0-1)
 * - top_k: Limits token sampling pool (1-100+)
 * - top_p: Nucleus sampling threshold (0-1)
 *
 * Trait dimensions (Operational v1.0.0):
 *   v1 (idx 0): Stochasticity     (-1 = deterministic, +1 = creative)
 *   v2 (idx 1): Concision         (-1 = verbose, +1 = terse)
 *   v3 (idx 2): Agency            (-1 = reactive, +1 = proactive)
 *   v4 (idx 3): Formality         (-1 = casual, +1 = formal)
 *   v5 (idx 4): Reasoning         (-1 = intuitive, +1 = analytical)
 *   v6 (idx 5): Compliance        (-1 = flexible, +1 = strict)
 *   v7 (idx 6): Context Density   (-1 = minimal, +1 = heavy)
 *
 * Weight rationale:
 *
 * temperature:
 *   - v1 (+0.6): Primary driver - creative intent increases temperature
 *   - v5 (-0.4): Analytical reasoning benefits from lower temperature
 *   - v6 (-0.2): Strict compliance slightly reduces randomness
 *
 * top_k:
 *   - v1 (-0.5): Creative intent expands token pool (lower top_k restriction)
 *   - v5 (+0.3): Analytical reasoning narrows to likely tokens
 *   - v6 (+0.4): Strict compliance narrows token selection
 *
 * top_p:
 *   - v1 (+0.3): Creative intent uses more of probability mass
 *   - v5 (-0.2): Analytical reasoning focuses on high-probability tokens
 *   - v6 (-0.2): Strict compliance narrows nucleus
 *
 * Note: v2-v4, v7 have no direct API parameter mapping for Claude.
 * Their semantic intent is expressed via the kernel (system prompt).
 */
export const OPERATIONAL_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 1.0,
    top_k: 40,
    top_p: 0.95,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7
    temperature: [0.6, 0.0, 0.0, 0.0, -0.4, -0.2, 0.0],
    top_k: [-0.5, 0.0, 0.0, 0.0, 0.3, 0.4, 0.0],
    top_p: [0.3, 0.0, 0.0, 0.0, -0.2, -0.2, 0.0],
  },

  scale: {
    temperature: 0.5, // ±0.5 range from baseline
    top_k: 30, // ±30 from baseline (10-70 effective range)
    top_p: 0.15, // ±0.15 from baseline (0.8-1.0 effective range)
  },

  clamps: {
    temperature: [0.0, 1.0],
    top_k: [1, 100],
    top_p: [0.0, 1.0],
  },
};

/**
 * Example projections for reference:
 *
 * Zero vector (baseline):
 *   temperature: 1.0, top_k: 40, top_p: 0.95
 *
 * @precise [-0.5, 0, 0, 0, 0.5, 0, 0]:
 *   temperature: 1.0 + 0.5 * (0.6*-0.5 + -0.4*0.5) = 1.0 + 0.5*(-0.5) = 0.75
 *   top_k: 40 + 30 * (-0.5*-0.5 + 0.3*0.5) = 40 + 30*(0.4) = 52
 *   top_p: 0.95 + 0.15 * (0.3*-0.5 + -0.2*0.5) = 0.95 + 0.15*(-0.25) = 0.91
 *
 * @creative [0.5, 0, 0, 0, 0, 0, 0]:
 *   temperature: 1.0 + 0.5 * (0.6*0.5) = 1.0 + 0.15 = 1.0 (clipped)
 *   top_k: 40 + 30 * (-0.5*0.5) = 40 - 7.5 = 32.5
 *   top_p: 0.95 + 0.15 * (0.3*0.5) = 0.95 + 0.0225 = 0.97
 *
 * @analytical [0, 0, 0, 0, 0.8, 0, 0]:
 *   temperature: 1.0 + 0.5 * (-0.4*0.8) = 1.0 - 0.16 = 0.84
 *   top_k: 40 + 30 * (0.3*0.8) = 40 + 7.2 = 47.2
 *   top_p: 0.95 + 0.15 * (-0.2*0.8) = 0.95 - 0.024 = 0.926
 */
