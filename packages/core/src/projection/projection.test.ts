import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy } from '@ctn/language';
import {
  projectTraits,
  validateProjectionMatrix,
  validateProjectionCoverage,
  computeProjectionHash,
  type ProjectionMatrix,
} from './index.js';

describe('Projection', () => {
  const strategy = new OperationalStrategy();

  // Sample projection matrix for testing
  const validMatrix: ProjectionMatrix = {
    baseline: {
      temperature: 1.0,
      top_k: 50,
    },
    weights: {
      temperature: [0.6, 0, 0, 0, -0.4, -0.2, 0],
      top_k: [-0.5, 0, 0, 0, 0.3, 0.4, 0],
    },
    scale: {
      temperature: 0.6,
      top_k: 40,
    },
    clamps: {
      temperature: [0, 1],
      top_k: [1, 100],
    },
  };

  describe('projectTraits', () => {
    it('projects zero vector to baseline', () => {
      const traits = [0, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, validMatrix, strategy);

      assert.equal(result.params.temperature, 1.0);
      assert.equal(result.params.top_k, 50);
    });

    it('applies positive trait influence correctly', () => {
      // v1 = 0.5 (creative/exploratory)
      const traits = [0.5, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, validMatrix, strategy);

      // temperature: 1.0 + (0.6 * 0.5) * 0.6 = 1.0 + 0.18 = 1.18 -> clipped to 1.0
      assert.equal(result.params.temperature, 1.0);
      assert.ok(result.details.temperature!.wasClipped);

      // top_k: 50 + (-0.5 * 0.5) * 40 = 50 - 10 = 40
      assert.equal(result.params.top_k, 40);
      assert.ok(!result.details.top_k!.wasClipped);
    });

    it('applies negative trait influence correctly', () => {
      // v1 = -0.5 (deterministic/grounded)
      const traits = [-0.5, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, validMatrix, strategy);

      // temperature: 1.0 + (0.6 * -0.5) * 0.6 = 1.0 - 0.18 = 0.82
      assert.ok(Math.abs(result.params.temperature! - 0.82) < 0.001);

      // top_k: 50 + (-0.5 * -0.5) * 40 = 50 + 10 = 60
      assert.equal(result.params.top_k, 60);
    });

    it('computes correct contributions', () => {
      const traits = [0.5, 0.3, 0, 0, 0.7, 0, 0];
      const result = projectTraits(traits, validMatrix, strategy);

      const tempDetail = result.details.temperature!;
      assert.equal(tempDetail.contributions.length, 7);

      const v1Contrib = tempDetail.contributions.find((c) => c.traitId === 'v1');
      assert.ok(v1Contrib);
      assert.equal(v1Contrib.weight, 0.6);
      assert.equal(v1Contrib.traitValue, 0.5);
      assert.ok(Math.abs(v1Contrib.contribution - 0.3) < 0.001);
    });

    it('clips values to bounds', () => {
      // Extreme positive v1 should push temperature above 1
      const traits = [1, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, validMatrix, strategy);

      assert.equal(result.params.temperature, 1.0);
      assert.ok(result.details.temperature!.wasClipped);
      assert.ok(result.details.temperature!.raw > 1.0);
    });

    it('handles parameters without weights (baseline-only)', () => {
      const matrixWithBaseline: ProjectionMatrix = {
        ...validMatrix,
        baseline: { ...validMatrix.baseline, max_tokens: 1024 },
        scale: { ...validMatrix.scale, max_tokens: 1 },
        clamps: { ...validMatrix.clamps, max_tokens: [1, 4096] },
      };

      const traits = [0.5, 0, 0, 0, 0.5, 0, 0];
      const result = projectTraits(traits, matrixWithBaseline, strategy);

      // max_tokens should be baseline (no weights)
      assert.equal(result.params.max_tokens, 1024);
    });
  });

  describe('validateProjectionMatrix', () => {
    it('validates correct matrix', () => {
      const errors = validateProjectionMatrix(validMatrix, strategy);
      assert.equal(errors.length, 0);
    });

    it('detects weight without baseline', () => {
      const invalidMatrix: ProjectionMatrix = {
        ...validMatrix,
        weights: {
          ...validMatrix.weights,
          unknown_param: [0, 0, 0, 0, 0, 0, 0],
        },
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);
      assert.ok(errors.some((e) => e.issue === 'weight_without_baseline'));
    });

    it('detects baseline without scale', () => {
      const invalidMatrix: ProjectionMatrix = {
        baseline: { temperature: 1.0, top_k: 50 },
        weights: validMatrix.weights,
        scale: { temperature: 0.6 }, // missing top_k
        clamps: validMatrix.clamps,
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);
      assert.ok(errors.some((e) => e.issue === 'baseline_without_scale'));
    });

    it('detects baseline without clamp', () => {
      const invalidMatrix: ProjectionMatrix = {
        baseline: { temperature: 1.0, top_k: 50 },
        weights: validMatrix.weights,
        scale: validMatrix.scale,
        clamps: { temperature: [0, 1] }, // missing top_k
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);
      assert.ok(errors.some((e) => e.issue === 'baseline_without_clamp'));
    });

    it('detects baseline out of bounds', () => {
      const invalidMatrix: ProjectionMatrix = {
        baseline: { temperature: 1.5 }, // above clamp
        weights: {},
        scale: { temperature: 0.6 },
        clamps: { temperature: [0, 1] },
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);
      const oobError = errors.find((e) => e.issue === 'baseline_out_of_bounds');
      assert.ok(oobError);
      assert.ok(oobError.details?.includes('1.5'));
    });

    it('detects dimension mismatch', () => {
      const invalidMatrix: ProjectionMatrix = {
        baseline: { temperature: 1.0 },
        weights: { temperature: [0.6, 0, 0] }, // wrong dimension count
        scale: { temperature: 0.6 },
        clamps: { temperature: [0, 1] },
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);
      assert.ok(errors.some((e) => e.issue === 'dimension_mismatch'));
    });
  });

  describe('validateProjectionCoverage', () => {
    it('detects lossy projections', () => {
      // Matrix has weights for v1, v5, v6 (temperature and top_k)
      const warnings = validateProjectionCoverage(strategy, validMatrix);

      // v2, v3, v4, v7 have no weights (all zeros)
      assert.equal(warnings.length, 4);
      assert.ok(warnings.some((w) => w.traitId === 'v2'));
      assert.ok(warnings.some((w) => w.traitId === 'v3'));
      assert.ok(warnings.some((w) => w.traitId === 'v4'));
      assert.ok(warnings.some((w) => w.traitId === 'v7'));
    });

    it('returns empty for full coverage', () => {
      const fullMatrix: ProjectionMatrix = {
        baseline: { param: 0.5 },
        weights: { param: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1] },
        scale: { param: 1 },
        clamps: { param: [0, 1] },
      };

      const warnings = validateProjectionCoverage(strategy, fullMatrix);
      assert.equal(warnings.length, 0);
    });
  });

  describe('computeProjectionHash', () => {
    it('produces consistent hash', () => {
      const hash1 = computeProjectionHash(validMatrix, strategy);
      const hash2 = computeProjectionHash(validMatrix, strategy);

      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 32); // 128-bit hex
    });

    it('produces different hash for different matrices', () => {
      const otherMatrix: ProjectionMatrix = {
        ...validMatrix,
        baseline: { ...validMatrix.baseline, temperature: 0.9 },
      };

      const hash1 = computeProjectionHash(validMatrix, strategy);
      const hash2 = computeProjectionHash(otherMatrix, strategy);

      assert.notEqual(hash1, hash2);
    });
  });
});

describe('Projection Mathematical Properties', () => {
  const strategy = new OperationalStrategy();

  it('baseline is returned for zero vector', () => {
    const matrix: ProjectionMatrix = {
      baseline: { temperature: 0.7, top_p: 0.9 },
      weights: {
        temperature: [0.5, 0, 0, 0, 0, 0, 0],
        top_p: [0, 0.3, 0, 0, 0, 0, 0],
      },
      scale: { temperature: 1, top_p: 1 },
      clamps: { temperature: [0, 1], top_p: [0, 1] },
    };

    const traits = [0, 0, 0, 0, 0, 0, 0];
    const result = projectTraits(traits, matrix, strategy);

    assert.equal(result.params.temperature, 0.7);
    assert.equal(result.params.top_p, 0.9);
  });

  it('projection is linear within clamps', () => {
    const matrix: ProjectionMatrix = {
      baseline: { param: 0.5 },
      weights: { param: [1, 0, 0, 0, 0, 0, 0] },
      scale: { param: 0.2 },
      clamps: { param: [0, 1] },
    };

    const traits1 = [0.2, 0, 0, 0, 0, 0, 0];
    const traits2 = [0.4, 0, 0, 0, 0, 0, 0];

    const result1 = projectTraits(traits1, matrix, strategy);
    const result2 = projectTraits(traits2, matrix, strategy);

    // param1 = 0.5 + 0.2 * 0.2 = 0.54
    // param2 = 0.5 + 0.4 * 0.2 = 0.58
    // Difference should be linear
    const diff = result2.params.param! - result1.params.param!;
    assert.ok(Math.abs(diff - 0.04) < 0.0001);
  });

  it('projection respects weight sparsity', () => {
    const matrix: ProjectionMatrix = {
      baseline: { param: 0.5 },
      weights: { param: [1, 0, 0, 0, 0, 0, 0] }, // Only v1 affects param
      scale: { param: 0.2 },
      clamps: { param: [0, 1] },
    };

    // Only v2-v7 active, v1 = 0
    const traits = [0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const result = projectTraits(traits, matrix, strategy);

    // Should be baseline since v1=0 and only v1 has weight
    assert.equal(result.params.param, 0.5);
  });
});
