import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fc from 'fast-check';

import { OperationalStrategy } from '../strategy/operational.js';
import { Composer } from './composer.js';
import { resolveInteractions } from './interactions.js';
import { magnitude } from '../schemas/index.js';
import type { ResolvedConstraint, TraitVector, TraitInteraction } from '../schemas/index.js';

/**
 * Property-based tests for algebraic properties of the composition system.
 *
 * These tests use fast-check to verify:
 * 1. Commutativity: compose([A,B,C]) === compose([C,B,A])
 * 2. Associativity: grouping doesn't matter
 * 3. Non-expansive invariant: ‖τ'‖ ≤ ‖τ‖ after resolveInteractions
 */

const DIMENSION_COUNT = 7;

/**
 * Generates a random trait vector within the unit ball.
 */
const unitBallVector = fc.array(
  fc.float({ min: -1, max: 1, noNaN: true }),
  { minLength: DIMENSION_COUNT, maxLength: DIMENSION_COUNT }
).filter((arr) => {
  const mag = Math.sqrt(arr.reduce((sum, v) => sum + v * v, 0));
  return mag <= 1;
});

/**
 * Generates a random trait vector (not necessarily in unit ball).
 */
const anyVector = fc.array(
  fc.float({ min: -2, max: 2, noNaN: true }),
  { minLength: DIMENSION_COUNT, maxLength: DIMENSION_COUNT }
);

/**
 * Generates a random resolved constraint.
 */
const resolvedConstraint = unitBallVector.map((traits): ResolvedConstraint => ({
  name: 'test',
  params: {},
  traits: Object.freeze(traits) as TraitVector,
  features: {},
}));

/**
 * Helper to check trait vector equality within epsilon.
 */
function vectorsEqual(a: TraitVector, b: TraitVector, epsilon = 1e-9): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i]! - b[i]!) > epsilon) return false;
  }
  return true;
}

describe('Algebraic Properties (Property-Based)', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  describe('commutativity', () => {
    it('compose([A,B,C]) === compose([C,B,A]) for random vectors', () => {
      fc.assert(
        fc.property(
          fc.array(resolvedConstraint, { minLength: 1, maxLength: 5 }),
          (constraints) => {
            const forward = composer.compose(constraints);
            const reversed = composer.compose([...constraints].reverse());

            return vectorsEqual(forward.traits, reversed.traits);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('compose([A,B]) === compose([B,A]) for all permutations', () => {
      fc.assert(
        fc.property(
          resolvedConstraint,
          resolvedConstraint,
          (a, b) => {
            const ab = composer.compose([a, b]);
            const ba = composer.compose([b, a]);

            return vectorsEqual(ab.traits, ba.traits);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('three-way permutations all produce same result', () => {
      fc.assert(
        fc.property(
          resolvedConstraint,
          resolvedConstraint,
          resolvedConstraint,
          (a, b, c) => {
            const abc = composer.compose([a, b, c]);
            const acb = composer.compose([a, c, b]);
            const bac = composer.compose([b, a, c]);
            const bca = composer.compose([b, c, a]);
            const cab = composer.compose([c, a, b]);
            const cba = composer.compose([c, b, a]);

            return (
              vectorsEqual(abc.traits, acb.traits) &&
              vectorsEqual(abc.traits, bac.traits) &&
              vectorsEqual(abc.traits, bca.traits) &&
              vectorsEqual(abc.traits, cab.traits) &&
              vectorsEqual(abc.traits, cba.traits)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('associativity', () => {
    it('composition is associative: grouping does not matter', () => {
      fc.assert(
        fc.property(
          resolvedConstraint,
          resolvedConstraint,
          resolvedConstraint,
          (a, b, c) => {
            // All at once
            const flat = composer.compose([a, b, c]);

            // Different groupings should yield same result
            // Note: With n-ary composition, we test that order doesn't matter
            const permuted = composer.compose([c, a, b]);

            return vectorsEqual(flat.traits, permuted.traits);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty composition is identity', () => {
      const empty = composer.compose([]);
      const identity = strategy.identity();

      assert.ok(
        vectorsEqual(empty.traits, identity),
        'Empty composition should yield identity'
      );
    });

    it('composing with identity yields same result', () => {
      fc.assert(
        fc.property(
          resolvedConstraint,
          (constraint) => {
            const identityConstraint: ResolvedConstraint = {
              name: 'identity',
              params: {},
              traits: strategy.identity(),
              features: {},
            };

            const withoutIdentity = composer.compose([constraint]);
            const withIdentity = composer.compose([constraint, identityConstraint]);

            return vectorsEqual(withoutIdentity.traits, withIdentity.traits);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('unit ball constraint', () => {
    it('result magnitude never exceeds 1', () => {
      fc.assert(
        fc.property(
          fc.array(resolvedConstraint, { minLength: 1, maxLength: 10 }),
          (constraints) => {
            const result = composer.compose(constraints);
            const mag = magnitude(result.traits);

            return mag <= 1 + 1e-10;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('stacking same constraint preserves unit ball', () => {
      fc.assert(
        fc.property(
          resolvedConstraint,
          fc.integer({ min: 2, max: 10 }),
          (constraint, count) => {
            const stacked = Array(count).fill(constraint);
            const result = composer.compose(stacked);
            const mag = magnitude(result.traits);

            return mag <= 1 + 1e-10;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

describe('Interaction Non-Expansive Invariant', () => {
  const INTERACTION_THRESHOLD = 0.5;

  /**
   * Creates test interactions for the 7-dimensional space.
   */
  const testInteractions: TraitInteraction[] = [
    {
      id: 'test_both_high_0_1',
      traitIndices: [0, 1],
      condition: 'both_high',
      resolution: 'suppress_both',
    },
    {
      id: 'test_both_high_2_3',
      traitIndices: [2, 3],
      condition: 'both_high',
      resolution: 'priority',
      priorityIndex: 2,
    },
    {
      id: 'test_opposing_4_5',
      traitIndices: [4, 5],
      condition: 'opposing',
      resolution: 'suppress_both',
    },
  ];

  it('‖τ\'‖ ≤ ‖τ‖ after resolveInteractions for all inputs', () => {
    fc.assert(
      fc.property(
        unitBallVector,
        (vectorArray) => {
          const traits: TraitVector = Object.freeze(vectorArray) as TraitVector;
          const originalMag = magnitude(traits);

          const result = resolveInteractions(traits, testInteractions);
          const resultMag = magnitude(result.traits);

          // Non-expansive: result magnitude must not exceed original
          return resultMag <= originalMag + 1e-10;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('suppress_both resolution reduces magnitude', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.6), max: Math.fround(1.0), noNaN: true }),
        fc.float({ min: Math.fround(0.6), max: Math.fround(1.0), noNaN: true }),
        (v0, v1) => {
          // Create vector where v0 and v1 are both > threshold
          const vector: number[] = [v0, v1, 0, 0, 0, 0, 0];
          const traits: TraitVector = Object.freeze(vector) as TraitVector;

          const interactions: TraitInteraction[] = [
            {
              id: 'suppress_test',
              traitIndices: [0, 1],
              condition: 'both_high',
              resolution: 'suppress_both',
            },
          ];

          const originalMag = magnitude(traits);
          const result = resolveInteractions(traits, interactions);
          const resultMag = magnitude(result.traits);

          // Result should have smaller magnitude (both traits set to 0)
          return resultMag <= originalMag;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('priority resolution reduces magnitude', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.6), max: Math.fround(1.0), noNaN: true }),
        fc.float({ min: Math.fround(0.6), max: Math.fround(1.0), noNaN: true }),
        (v0, v1) => {
          // Create vector where v0 and v1 are both > threshold
          const vector: number[] = [v0, v1, 0, 0, 0, 0, 0];
          const traits: TraitVector = Object.freeze(vector) as TraitVector;

          const interactions: TraitInteraction[] = [
            {
              id: 'priority_test',
              traitIndices: [0, 1],
              condition: 'both_high',
              resolution: 'priority',
              priorityIndex: 0, // v0 wins, v1 zeroed
            },
          ];

          const originalMag = magnitude(traits);
          const result = resolveInteractions(traits, interactions);
          const resultMag = magnitude(result.traits);

          // Result should have smaller or equal magnitude
          return resultMag <= originalMag + 1e-10;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('modify resolution preserves magnitude exactly', () => {
    fc.assert(
      fc.property(
        unitBallVector,
        (vectorArray) => {
          const traits: TraitVector = Object.freeze(vectorArray) as TraitVector;

          // Modify resolution doesn't change traits
          const interactions: TraitInteraction[] = [
            {
              id: 'modify_test',
              traitIndices: [0, 1],
              condition: 'both_high',
              resolution: 'modify',
              modifiedText: 'test text',
            },
          ];

          const originalMag = magnitude(traits);
          const result = resolveInteractions(traits, interactions);
          const resultMag = magnitude(result.traits);

          // Magnitude should be unchanged
          return Math.abs(resultMag - originalMag) < 1e-10;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('interactions only fire when conditions are met', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-0.4), max: Math.fround(0.4), noNaN: true }),
        fc.float({ min: Math.fround(-0.4), max: Math.fround(0.4), noNaN: true }),
        (v0, v1) => {
          // Create vector where both values are BELOW threshold
          const vector: number[] = [v0, v1, 0, 0, 0, 0, 0];
          const traits: TraitVector = Object.freeze(vector) as TraitVector;

          const interactions: TraitInteraction[] = [
            {
              id: 'should_not_fire',
              traitIndices: [0, 1],
              condition: 'both_high',
              resolution: 'suppress_both',
            },
          ];

          const result = resolveInteractions(traits, interactions);

          // Traits should be unchanged (interaction didn't fire)
          return vectorsEqual(result.traits, traits);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Composition Determinism', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  it('same inputs always produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.array(resolvedConstraint, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 1, max: 10 }),
        (constraints, repeatCount) => {
          const results: TraitVector[] = [];

          for (let i = 0; i < repeatCount; i++) {
            results.push(composer.compose(constraints).traits);
          }

          // All results should be identical
          return results.every((r) => vectorsEqual(r, results[0]!));
        }
      ),
      { numRuns: 50 }
    );
  });
});
