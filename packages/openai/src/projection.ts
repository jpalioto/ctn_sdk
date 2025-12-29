import type { ProjectionMatrix } from '@ctn/core';

/**
 * Projection matrix for Operational strategy on OpenAI models.
 *
 * OpenAI uses temperature and top_p (no top_k).
 * Temperature range: 0-2
 * Top_p range: 0-1
 */
export const OPERATIONAL_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 1.0,
    top_p: 1.0,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7
    temperature: [-0.4, -0.2, 0.0, 0.0, 0.0, 0.5, 0.0],
    top_p: [-0.1, -0.1, 0.0, 0.0, 0.0, 0.2, 0.0],
  },

  scale: {
    temperature: 0.5,
    top_p: 0.3,
  },

  clamps: {
    temperature: [0.0, 2.0],
    top_p: [0.0, 1.0],
  },
};

/**
 * Projection matrix for CTN strategy on OpenAI models.
 */
export const CTN_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 0.8,
    top_p: 0.95,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7
    temperature: [-0.3, -0.2, 0.0, -0.2, 0.0, 0.5, 0.0],
    top_p: [-0.1, -0.1, 0.0, -0.1, 0.0, 0.2, 0.0],
  },

  scale: {
    temperature: 0.4,
    top_p: 0.2,
  },

  clamps: {
    temperature: [0.0, 2.0],
    top_p: [0.0, 1.0],
  },
};
