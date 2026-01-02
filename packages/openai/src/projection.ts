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
 *
 * CTN v1.0 uses 9 dimensions per ctn_core:
 *   v1-v9: See Anthropic projection for full dimension list
 */
export const CTN_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 0.8,
    top_p: 0.95,
  },

  weights: {
    //              v1    v2    v3    v4    v5    v6    v7    v8    v9
    temperature: [-0.3, -0.2, 0.0, -0.2, 0.0, 0.5, 0.0, -0.1, -0.1],
    top_p: [-0.1, -0.1, 0.0, -0.1, 0.0, 0.2, 0.0, 0.0, -0.1],
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

/**
 * Projection matrix for Null strategy on OpenAI models.
 *
 * No dimensions, no system prompt. Default API parameters.
 */
export const NULL_PROJECTION_MATRIX: ProjectionMatrix = {
  baseline: {
    temperature: 1.0,
    top_p: 1.0,
  },

  weights: {
    temperature: [],
    top_p: [],
  },

  scale: {
    temperature: 0.0,
    top_p: 0.0,
  },

  clamps: {
    temperature: [0.0, 2.0],
    top_p: [0.0, 1.0],
  },
};
