import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fc from 'fast-check';

import { OperationalStrategy } from '@ctn/language';
import {
  projectTraits,
  validateProjectionMatrix,
  computeProjectionHash,
  type ProjectionMatrix,
} from './index.js';

/**
 * Tests for projection invariants and mathematical properties.
 *
 * These tests verify:
 * 1. Baseline invariant: baseline must be within [lo, hi] clamps
 * 2. unclippedDelta correctly captures s ⊙ (W · τ) before clipping
 * 3. projectionHash changes when matrix values are modified
 */

describe('Projection Invariants', () => {
  const strategy = new OperationalStrategy();

  describe('baseline invariant', () => {
    it('validateProjectionMatrix throws when baseline < lo', () => {
      const invalidMatrix: ProjectionMatrix = {
        baseline: { temperature: -0.5 }, // below clamp minimum
        weights: { temperature: [0, 0, 0, 0, 0, 0, 0] },
        scale: { temperature: 1 },
        clamps: { temperature: [0, 1] },
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);

      assert.ok(
        errors.some((e) => e.issue === 'baseline_out_of_bounds'),
        'Should detect baseline below lower bound'
      );
      assert.ok(
        errors.some((e) => e.details?.includes('-0.5')),
        'Error should include the invalid baseline value'
      );
    });

    it('validateProjectionMatrix throws when baseline > hi', () => {
      const invalidMatrix: ProjectionMatrix = {
        baseline: { temperature: 1.5 }, // above clamp maximum
        weights: { temperature: [0, 0, 0, 0, 0, 0, 0] },
        scale: { temperature: 1 },
        clamps: { temperature: [0, 1] },
      };

      const errors = validateProjectionMatrix(invalidMatrix, strategy);

      assert.ok(
        errors.some((e) => e.issue === 'baseline_out_of_bounds'),
        'Should detect baseline above upper bound'
      );
    });

    it('validateProjectionMatrix accepts baseline exactly at lo', () => {
      const validMatrix: ProjectionMatrix = {
        baseline: { temperature: 0 }, // exactly at lower bound
        weights: { temperature: [0, 0, 0, 0, 0, 0, 0] },
        scale: { temperature: 1 },
        clamps: { temperature: [0, 1] },
      };

      const errors = validateProjectionMatrix(validMatrix, strategy);
      assert.equal(errors.length, 0, 'Baseline at lo should be valid');
    });

    it('validateProjectionMatrix accepts baseline exactly at hi', () => {
      const validMatrix: ProjectionMatrix = {
        baseline: { temperature: 1 }, // exactly at upper bound
        weights: { temperature: [0, 0, 0, 0, 0, 0, 0] },
        scale: { temperature: 1 },
        clamps: { temperature: [0, 1] },
      };

      const errors = validateProjectionMatrix(validMatrix, strategy);
      assert.equal(errors.length, 0, 'Baseline at hi should be valid');
    });

    it('property: any baseline outside [lo, hi] is rejected', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          fc.float({ min: Math.fround(-2), max: Math.fround(2), noNaN: true }),
          (lo, range, baseline) => {
            const hi = lo + range;

            // Skip if baseline is within bounds
            if (baseline >= lo && baseline <= hi) {
              return true;
            }

            const matrix: ProjectionMatrix = {
              baseline: { param: baseline },
              weights: { param: [0, 0, 0, 0, 0, 0, 0] },
              scale: { param: 1 },
              clamps: { param: [lo, hi] },
            };

            const errors = validateProjectionMatrix(matrix, strategy);
            return errors.some((e) => e.issue === 'baseline_out_of_bounds');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('unclippedDelta calculation', () => {
    it('unclippedDelta equals s ⊙ (W · τ) before clipping', () => {
      const matrix: ProjectionMatrix = {
        baseline: { param: 0.5 },
        weights: { param: [0.6, -0.4, 0.2, 0, 0, 0, 0] },
        scale: { param: 2 },
        clamps: { param: [0, 1] },
      };

      const traits = [0.5, 0.3, 0.2, 0, 0, 0, 0];
      const result = projectTraits(traits, matrix, strategy);

      // Manual calculation:
      // dotProduct = 0.6*0.5 + (-0.4)*0.3 + 0.2*0.2 = 0.3 - 0.12 + 0.04 = 0.22
      // unclippedDelta = scale * dotProduct = 2 * 0.22 = 0.44
      const expectedDotProduct = 0.22;
      const expectedUnclippedDelta = 0.44;

      assert.ok(
        Math.abs(result.details.param!.dotProduct - expectedDotProduct) < 0.0001,
        `dotProduct should be ${expectedDotProduct}, got ${result.details.param!.dotProduct}`
      );
      assert.ok(
        Math.abs(result.details.param!.unclippedDelta - expectedUnclippedDelta) < 0.0001,
        `unclippedDelta should be ${expectedUnclippedDelta}, got ${result.details.param!.unclippedDelta}`
      );
    });

    it('unclippedDelta is computed before clipping is applied', () => {
      // Create a case where raw value exceeds clamp but unclippedDelta is still correct
      const matrix: ProjectionMatrix = {
        baseline: { param: 0.9 },
        weights: { param: [1, 0, 0, 0, 0, 0, 0] },
        scale: { param: 0.5 },
        clamps: { param: [0, 1] }, // Will clip above 1
      };

      const traits = [0.8, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, matrix, strategy);

      // unclippedDelta = 0.5 * 0.8 = 0.4
      // raw = 0.9 + 0.4 = 1.3 (exceeds clamp)
      // clipped = 1.0
      assert.ok(
        Math.abs(result.details.param!.unclippedDelta - 0.4) < 0.0001,
        'unclippedDelta should be 0.4 regardless of clipping'
      );
      assert.ok(
        result.details.param!.raw > 1,
        'raw should exceed clamp'
      );
      assert.equal(
        result.details.param!.clipped,
        1,
        'clipped should be at upper bound'
      );
      assert.ok(
        result.details.param!.wasClipped,
        'wasClipped should be true'
      );
    });

    it('property: unclippedDelta = scale * Σ(weight_i * trait_i)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(-1), max: Math.fround(1), noNaN: true }), { minLength: 7, maxLength: 7 }),
          fc.array(fc.float({ min: Math.fround(-1), max: Math.fround(1), noNaN: true }), { minLength: 7, maxLength: 7 }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(2), noNaN: true }),
          (traits, weights, scale) => {
            const matrix: ProjectionMatrix = {
              baseline: { param: 0.5 },
              weights: { param: weights },
              scale: { param: scale },
              clamps: { param: [-10, 10] }, // Wide clamps to avoid interference
            };

            const result = projectTraits(traits, matrix, strategy);

            // Calculate expected
            let expectedDot = 0;
            for (let i = 0; i < 7; i++) {
              expectedDot += weights[i]! * traits[i]!;
            }
            const expectedDelta = scale * expectedDot;

            return Math.abs(result.details.param!.unclippedDelta - expectedDelta) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('contributions array correctly decomposes unclippedDelta', () => {
      const matrix: ProjectionMatrix = {
        baseline: { param: 0.5 },
        weights: { param: [0.5, -0.3, 0.2, 0.1, -0.4, 0.3, 0] },
        scale: { param: 1 },
        clamps: { param: [0, 1] },
      };

      const traits = [0.4, 0.2, -0.3, 0.5, 0.1, -0.2, 0.6];
      const result = projectTraits(traits, matrix, strategy);

      const detail = result.details.param!;

      // Sum of contributions should equal dotProduct
      const contributionSum = detail.contributions.reduce(
        (sum, c) => sum + c.contribution,
        0
      );

      assert.ok(
        Math.abs(contributionSum - detail.dotProduct) < 0.0001,
        `Sum of contributions (${contributionSum}) should equal dotProduct (${detail.dotProduct})`
      );

      // Each contribution should be weight * traitValue
      for (const contrib of detail.contributions) {
        const expected = contrib.weight * contrib.traitValue;
        assert.ok(
          Math.abs(contrib.contribution - expected) < 0.0001,
          `Contribution for ${contrib.traitId} should be ${expected}, got ${contrib.contribution}`
        );
      }
    });
  });

  describe('projectionHash stability and sensitivity', () => {
    const baseMatrix: ProjectionMatrix = {
      baseline: { temperature: 0.7, top_k: 50 },
      weights: {
        temperature: [0.5, -0.3, 0, 0, 0.2, 0, 0],
        top_k: [-0.4, 0, 0, 0, 0.3, 0, 0],
      },
      scale: { temperature: 0.5, top_k: 40 },
      clamps: { temperature: [0, 1], top_k: [1, 100] },
    };

    it('hash changes when baseline is modified', () => {
      const modifiedMatrix: ProjectionMatrix = {
        ...baseMatrix,
        baseline: { ...baseMatrix.baseline, temperature: 0.8 },
      };

      const hash1 = computeProjectionHash(baseMatrix, strategy);
      const hash2 = computeProjectionHash(modifiedMatrix, strategy);

      assert.notEqual(hash1, hash2, 'Hash should change when baseline is modified');
    });

    it('hash changes when weights are modified', () => {
      const modifiedMatrix: ProjectionMatrix = {
        ...baseMatrix,
        weights: {
          ...baseMatrix.weights,
          temperature: [0.6, -0.3, 0, 0, 0.2, 0, 0], // Changed first weight
        },
      };

      const hash1 = computeProjectionHash(baseMatrix, strategy);
      const hash2 = computeProjectionHash(modifiedMatrix, strategy);

      assert.notEqual(hash1, hash2, 'Hash should change when weights are modified');
    });

    it('hash changes when scale is modified', () => {
      const modifiedMatrix: ProjectionMatrix = {
        ...baseMatrix,
        scale: { ...baseMatrix.scale, temperature: 0.6 },
      };

      const hash1 = computeProjectionHash(baseMatrix, strategy);
      const hash2 = computeProjectionHash(modifiedMatrix, strategy);

      assert.notEqual(hash1, hash2, 'Hash should change when scale is modified');
    });

    it('hash changes when clamps are modified', () => {
      const modifiedMatrix: ProjectionMatrix = {
        ...baseMatrix,
        clamps: { ...baseMatrix.clamps, temperature: [0.1, 1] },
      };

      const hash1 = computeProjectionHash(baseMatrix, strategy);
      const hash2 = computeProjectionHash(modifiedMatrix, strategy);

      assert.notEqual(hash1, hash2, 'Hash should change when clamps are modified');
    });

    it('hash changes when parameter is added', () => {
      const modifiedMatrix: ProjectionMatrix = {
        baseline: { ...baseMatrix.baseline, new_param: 0.5 },
        weights: { ...baseMatrix.weights },
        scale: { ...baseMatrix.scale, new_param: 1 },
        clamps: { ...baseMatrix.clamps, new_param: [0, 1] },
      };

      const hash1 = computeProjectionHash(baseMatrix, strategy);
      const hash2 = computeProjectionHash(modifiedMatrix, strategy);

      assert.notEqual(hash1, hash2, 'Hash should change when parameter is added');
    });

    it('hash is deterministic for same input', () => {
      const hash1 = computeProjectionHash(baseMatrix, strategy);
      const hash2 = computeProjectionHash(baseMatrix, strategy);
      const hash3 = computeProjectionHash(baseMatrix, strategy);

      assert.equal(hash1, hash2, 'Hash should be consistent');
      assert.equal(hash2, hash3, 'Hash should be consistent');
    });

    it('property: any value change produces different hash', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(0.5), noNaN: true }),
          (delta) => {
            const modifiedMatrix: ProjectionMatrix = {
              ...baseMatrix,
              baseline: {
                ...baseMatrix.baseline,
                temperature: baseMatrix.baseline.temperature! + delta,
              },
            };

            const hash1 = computeProjectionHash(baseMatrix, strategy);
            const hash2 = computeProjectionHash(modifiedMatrix, strategy);

            return hash1 !== hash2;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('hash length is 32 characters (128-bit hex)', () => {
      const hash = computeProjectionHash(baseMatrix, strategy);
      assert.equal(hash.length, 32, 'Hash should be 32 hex characters');
      assert.match(hash, /^[0-9a-f]{32}$/, 'Hash should be valid hex');
    });
  });
});
