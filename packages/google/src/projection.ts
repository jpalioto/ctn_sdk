import type { ProjectionMatrix } from '@ctn/core';

/**
 * Projection matrix for Operational strategy on Google Gemini models.
 *
 * Gemini uses same parameter names as Anthropic but may have different
 * sensitivities. Starting with similar values, to be calibrated.
 */
export const OPERATIONAL_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 1.0,
    top_k: 40,
    top_p: 0.95,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7
    temperature: [-0.4, -0.2, 0.0, 0.0, 0.0, 0.5, 0.0],
    top_k: [0.3, 0.0, 0.0, 0.0, 0.0, -0.3, 0.0],
    top_p: [0.0, -0.1, 0.0, 0.0, 0.0, 0.2, 0.0],
  },

  scale: {
    temperature: 0.5,
    top_k: 30,
    top_p: 0.15,
  },

  clamps: {
    temperature: [0.0, 2.0], // Gemini allows up to 2.0
    top_k: [1, 100],
    top_p: [0.0, 1.0],
  },
};

/**
 * Projection matrix for CTN strategy on Google Gemini models.
 */
export const CTN_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 0.8,
    top_k: 50,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7
    temperature: [-0.3, -0.2, 0.0, -0.2, 0.0, 0.5, 0.0],
    top_k: [0.4, 0.0, 0.0, 0.3, 0.0, -0.4, 0.3],
  },

  scale: {
    temperature: 0.4,
    top_k: 25,
  },

  clamps: {
    temperature: [0.0, 2.0],
    top_k: [1, 100],
  },
};
