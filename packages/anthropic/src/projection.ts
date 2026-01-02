import type { ProjectionMatrix } from '@ctn/core';

/**
 * Projection matrix for the Operational strategy on Anthropic Claude models.
 *
 * Maps the 7-dimensional trait space to Anthropic API parameters:
 * - temperature: Controls randomness (0-1)
 * - top_k: Limits token sampling pool (1-100+)
 *
 * Note: Claude 4.5 models don't support temperature + top_p together,
 * so we only use temperature and top_k for sampling control.
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
 * Note: v2-v4, v7 have no direct API parameter mapping for Claude.
 * Their semantic intent is expressed via the kernel (system prompt).
 */
export const OPERATIONAL_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 1.0,
    top_k: 40,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7
    temperature: [0.6, 0.0, 0.0, 0.0, -0.4, -0.2, 0.0],
    top_k: [-0.5, 0.0, 0.0, 0.0, 0.3, 0.4, 0.0],
  },

  scale: {
    temperature: 0.5, // ±0.5 range from baseline
    top_k: 30, // ±30 from baseline (10-70 effective range)
  },

  clamps: {
    temperature: [0.0, 1.0],
    top_k: [1, 100],
  },
};

/**
 * Example projections for reference:
 *
 * Zero vector (baseline):
 *   temperature: 1.0, top_k: 40
 *
 * @precise [-0.5, 0, 0, 0, 0.5, 0, 0]:
 *   temperature: 1.0 + 0.5 * (0.6*-0.5 + -0.4*0.5) = 1.0 + 0.5*(-0.5) = 0.75
 *   top_k: 40 + 30 * (-0.5*-0.5 + 0.3*0.5) = 40 + 30*(0.4) = 52
 *
 * @creative [0.5, 0, 0, 0, 0, 0, 0]:
 *   temperature: 1.0 + 0.5 * (0.6*0.5) = 1.0 + 0.15 = 1.0 (clipped)
 *   top_k: 40 + 30 * (-0.5*0.5) = 40 - 7.5 = 32.5
 *
 * @analytical [0, 0, 0, 0, 0.8, 0, 0]:
 *   temperature: 1.0 + 0.5 * (-0.4*0.8) = 1.0 - 0.16 = 0.84
 *   top_k: 40 + 30 * (0.3*0.8) = 40 + 7.2 = 47.2
 */

/**
 * Projection matrix for the CTN strategy on Anthropic Claude models.
 *
 * Maps the 9-dimensional CTN trait space (v1.0 spec) to Anthropic API parameters.
 * CTN uses 0-1 range (0 = no constraint, 1 = maximum constraint).
 *
 * CTN dimensions (v1.0.0 - 9D per ctn_core):
 *   v1 (idx 0): Atomic Derivation    (0-1, higher = sharper concept boundaries)
 *   v2 (idx 1): Assertion Rigor      (0-1, higher = smoother reasoning path)
 *   v3 (idx 2): Frame Isolation      (0-1, higher = more focused)
 *   v4 (idx 3): Global Invariance    (0-1, higher = global consistency)
 *   v5 (idx 4): Orthogonal Detachment (0-1, higher = reject false premises)
 *   v6 (idx 5): Unbound Search       (0-1, higher = more exploratory)
 *   v7 (idx 6): Syntactic Minimalism (0-1, higher = minimal output)
 *   v8 (idx 7): Anti Sycophancy      (0-1, higher = resist sycophancy)
 *   v9 (idx 8): Satisfiability Guard (0-1, higher = reject unsatisfiable)
 *
 * Weight rationale:
 *
 * temperature:
 *   - v1 (-0.3): Higher clarity → lower temperature (more deterministic)
 *   - v2 (-0.2): Smoother paths → slightly lower temperature
 *   - v4 (-0.2): Structure → lower temperature
 *   - v6 (+0.5): Exploration → higher temperature
 *   - v8 (-0.1): Anti-sycophancy → slightly lower temperature for precision
 *   - v9 (-0.1): Satisfiability guard → lower temperature for accuracy
 *
 * top_k:
 *   - v1 (+0.4): Higher clarity → narrower token pool
 *   - v4 (+0.3): Structure → narrower selection
 *   - v6 (-0.4): Exploration → broader token pool
 *   - v7 (+0.3): Syntactic minimalism → focused tokens
 *   - v9 (+0.2): Satisfiability guard → narrower selection
 *
 * Note: Baseline assumes moderate constraint (0.5 across dimensions).
 * Zero vector means "no constraints" so we use a neutral baseline.
 */
export const CTN_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 0.8,  // Slightly lower baseline for CTN's precision focus
    top_k: 50,         // Slightly narrower baseline
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7    v8    v9
    temperature: [-0.3, -0.2, 0.0, -0.2, 0.0, 0.5, 0.0, -0.1, -0.1],
    top_k: [0.4, 0.0, 0.0, 0.3, 0.0, -0.4, 0.3, 0.0, 0.2],
  },

  scale: {
    temperature: 0.4,  // ±0.4 range from baseline
    top_k: 25,         // ±25 from baseline
  },

  clamps: {
    temperature: [0.0, 1.0],
    top_k: [1, 100],
  },
};

/**
 * Example CTN projections:
 *
 * Zero vector (no constraints, baseline):
 *   temperature: 0.8, top_k: 50
 *
 * @stable [0.9, 0.9, 0.7, 0.9, 0.9, 0.3, 0.0]:
 *   temperature: 0.8 + 0.4 * (-0.3*0.9 + -0.2*0.9 + -0.2*0.9 + 0.5*0.3)
 *              = 0.8 + 0.4 * (-0.27 - 0.18 - 0.18 + 0.15) = 0.8 - 0.19 = 0.61
 *   top_k: 50 + 25 * (0.4*0.9 + 0.3*0.9 - 0.4*0.3)
 *        = 50 + 25 * (0.36 + 0.27 - 0.12) = 50 + 12.75 = 62.75
 *
 * @exploratory [0.6, 0.5, 0.3, 0.5, 0.7, 0.9, 0.0]:
 *   temperature: 0.8 + 0.4 * (-0.3*0.6 + -0.2*0.5 + -0.2*0.5 + 0.5*0.9)
 *              = 0.8 + 0.4 * (-0.18 - 0.1 - 0.1 + 0.45) = 0.8 + 0.03 = 0.83
 *   top_k: 50 + 25 * (0.4*0.6 + 0.3*0.5 - 0.4*0.9)
 *        = 50 + 25 * (0.24 + 0.15 - 0.36) = 50 + 0.75 = 50.75
 */

/**
 * Projection matrix for the Null strategy.
 *
 * The Null strategy has 0 dimensions and produces no system prompt.
 * Used for baseline testing with default API parameters.
 *
 * Empty weights arrays - no trait-based parameter adjustment.
 */
export const NULL_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 1.0,  // Default temperature
    top_k: 40,         // Default top_k
  },

  weights: {
    // No dimensions = no weights
    temperature: [],
    top_k: [],
  },

  scale: {
    temperature: 0.0,  // No adjustment
    top_k: 0,          // No adjustment
  },

  clamps: {
    temperature: [0.0, 1.0],
    top_k: [1, 100],
  },
};
