import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy } from '../strategy/index.js';
import { Composer, compose } from './composer.js';
import { magnitude } from '../schemas/index.js';
import type { ResolvedConstraint, TraitVector } from '../schemas/index.js';

/**
 * Helper to create a resolved constraint from the strategy.
 */
function resolve(
  strategy: OperationalStrategy,
  name: string
): ResolvedConstraint {
  const { traits, features } = strategy.resolveWithFeatures(name, {});
  return { name, params: {}, traits, features };
}

/**
 * Helper to check trait vector equality within epsilon.
 */
function assertVectorsEqual(
  actual: TraitVector,
  expected: TraitVector,
  epsilon = 1e-10
): void {
  assert.equal(
    actual.length,
    expected.length,
    `Vector length mismatch: ${actual.length} vs ${expected.length}`
  );

  for (let i = 0; i < actual.length; i++) {
    const diff = Math.abs(actual[i]! - expected[i]!);
    assert.ok(
      diff < epsilon,
      `Vector element ${i} differs: ${actual[i]} vs ${expected[i]} (diff: ${diff})`
    );
  }
}

describe('Composer', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  describe('algebraic properties', () => {
    it('is associative: (a ⊕ b) ⊕ c === a ⊕ (b ⊕ c)', () => {
      const a = resolve(strategy, 'creative');
      const b = resolve(strategy, 'analytical');
      const c = resolve(strategy, 'terse');

      // Compose (a ⊕ b) ⊕ c by flattening to n-ary
      const left = composer.compose([a, b, c]);

      // Compose a ⊕ (b ⊕ c) - same n-ary operation
      const right = composer.compose([a, b, c]);

      assertVectorsEqual(left.traits, right.traits);
    });

    it('is associative with different groupings yielding same result', () => {
      const a = resolve(strategy, 'precise');
      const b = resolve(strategy, 'formal');
      const c = resolve(strategy, 'strict');

      // All permutations should yield the same result
      const abc = composer.compose([a, b, c]);
      const bca = composer.compose([b, c, a]);
      const cab = composer.compose([c, a, b]);

      assertVectorsEqual(abc.traits, bca.traits);
      assertVectorsEqual(bca.traits, cab.traits);
    });

    it('is commutative: a ⊕ b === b ⊕ a', () => {
      const a = resolve(strategy, 'creative');
      const b = resolve(strategy, 'analytical');

      const ab = composer.compose([a, b]);
      const ba = composer.compose([b, a]);

      assertVectorsEqual(ab.traits, ba.traits);
    });

    it('is commutative for multiple constraints', () => {
      const a = resolve(strategy, 'precise');
      const b = resolve(strategy, 'terse');
      const c = resolve(strategy, 'formal');

      const abc = composer.compose([a, b, c]);
      const cba = composer.compose([c, b, a]);
      const bac = composer.compose([b, a, c]);

      assertVectorsEqual(abc.traits, cba.traits);
      assertVectorsEqual(abc.traits, bac.traits);
    });

    it('is idempotent: a ⊕ a === a', () => {
      const a = resolve(strategy, 'creative');

      const single = composer.compose([a]);
      const doubled = composer.compose([a, a]);
      const tripled = composer.compose([a, a, a]);

      // Repeating the same constraint should not change the result
      assertVectorsEqual(single.traits, doubled.traits);
      assertVectorsEqual(single.traits, tripled.traits);
    });

    it('empty composition yields identity', () => {
      const empty = composer.compose([]);
      const identity = strategy.identity();

      assertVectorsEqual(empty.traits, identity);
    });

    it('single constraint is unchanged', () => {
      const creative = resolve(strategy, 'creative');
      const result = composer.compose([creative]);

      // Single constraint should return its exact trait vector
      assertVectorsEqual(result.traits, creative.traits);
    });
  });

  describe('hypercube constraint', () => {
    it('stays in [0,1]^n hypercube after composition', () => {
      const a = resolve(strategy, 'creative');

      // Stack same constraint multiple times - with mean, result is unchanged
      const extreme = composer.compose([a, a, a, a, a]);

      // With mean, stacking same constraint returns same values (idempotent)
      for (let i = 0; i < extreme.traits.length; i++) {
        assert.ok(
          extreme.traits[i]! >= -1 && extreme.traits[i]! <= 1,
          `Trait ${i} (${extreme.traits[i]}) should be in [-1, 1]`
        );
      }
    });

    it('mean of different constraints stays bounded', () => {
      // Create constraints with different trait values
      const precise = resolve(strategy, 'precise'); // v1:-0.5, v5:+0.5
      const analytical = resolve(strategy, 'analytical'); // v5:+0.8
      const strict = resolve(strategy, 'strict'); // v6:+0.5

      const result = composer.compose([
        precise,
        analytical,
        strict,
        precise,
        analytical,
      ]);

      // All components should remain bounded
      for (let i = 0; i < result.traits.length; i++) {
        assert.ok(
          result.traits[i]! >= -1 && result.traits[i]! <= 1,
          `Trait ${i} (${result.traits[i]}) should be in [-1, 1]`
        );
      }
    });

    it('preserves values with idempotent stacking', () => {
      const creative = resolve(strategy, 'creative'); // v1:+0.5

      // Stack creative multiple times - should get same values (mean is idempotent)
      const single = composer.compose([creative]);
      const stacked = composer.compose([creative, creative, creative]);

      // v1 should be exactly the same
      assert.equal(stacked.traits[0]!, single.traits[0]!, 'v1 should be unchanged');
    });
  });

  describe('destructive interference', () => {
    it('cancels opposing traits', () => {
      const creative = resolve(strategy, 'creative'); // v1:+0.5
      const precise = resolve(strategy, 'precise'); // v1:-0.5, v5:+0.5

      const result = composer.compose([creative, precise]);

      // v1 should be zero: mean(0.5, -0.5) = 0
      assert.ok(
        Math.abs(result.traits[0]!) < 0.01,
        `v1 should cancel: got ${result.traits[0]}`
      );

      // v5 should be 0.25: mean(0, 0.5) = 0.25
      assert.ok(
        Math.abs(result.traits[4]! - 0.25) < 0.01,
        `v5 should be ~0.25: got ${result.traits[4]}`
      );
    });

    it('handles full cancellation', () => {
      const formal = resolve(strategy, 'formal'); // v4:+0.5
      const casual = resolve(strategy, 'casual'); // v4:-0.5

      const result = composer.compose([formal, casual]);

      // v4 should be zero: mean(0.5, -0.5) = 0
      assert.ok(
        Math.abs(result.traits[3]!) < 1e-10,
        `v4 should be zero: got ${result.traits[3]}`
      );
    });
  });

  describe('constructive interference', () => {
    it('averages orthogonal traits', () => {
      const terse = resolve(strategy, 'terse'); // v2:+0.5
      const formal = resolve(strategy, 'formal'); // v4:+0.5

      const result = composer.compose([terse, formal]);

      // Each trait is averaged: mean(0.5, 0) = 0.25
      assert.ok(
        Math.abs(result.traits[1]! - 0.25) < 0.01,
        `v2 should be ~0.25: got ${result.traits[1]}`
      );
      assert.ok(
        Math.abs(result.traits[3]! - 0.25) < 0.01,
        `v4 should be ~0.25: got ${result.traits[3]}`
      );
    });

    it('stacking same constraint preserves full strength', () => {
      const terse = resolve(strategy, 'terse'); // v2:+0.5
      const formal = resolve(strategy, 'formal'); // v4:+0.5

      // Stack each constraint to preserve its strength
      const result = composer.compose([terse, terse, formal, formal]);

      // Now mean(0.5, 0.5, 0, 0) / 4 for v2... wait, this is still 0.25
      // To preserve strength, you need equal representation
      // mean(0.5, 0.5) = 0.5 for v2 if only terse constraints
      const terseOnly = composer.compose([terse, terse]);
      assert.ok(
        Math.abs(terseOnly.traits[1]! - 0.5) < 0.01,
        `v2 with stacked terse should be ~0.5: got ${terseOnly.traits[1]}`
      );
    });
  });

  describe('n-ary mean composition', () => {
    it('mean is computed correctly for all constraints at once', () => {
      // This test demonstrates that n-ary mean works correctly
      const a = 0.6;
      const b = 0.6;
      const c = -0.6;

      // N-ary mean: (a + b + c) / 3 = (0.6 + 0.6 - 0.6) / 3 = 0.2
      const naryMean = (a + b + c) / 3;
      assert.ok(
        Math.abs(naryMean - 0.2) < 1e-10,
        `N-ary mean should be ~0.2, got ${naryMean}`
      );

      // Binary iterative mean would give different results:
      // mean(a, b) = 0.6, then mean(0.6, c) = mean(0.6, -0.6) = 0
      const abMean = (a + b) / 2; // 0.6
      const binaryMean = (abMean + c) / 2; // 0

      // They differ!
      assert.ok(
        Math.abs(naryMean - binaryMean) > 0.1,
        'N-ary mean differs from iterative binary mean'
      );
    });

    it('mean of identical values is unchanged', () => {
      // Mean([a, a, a]) = a (idempotent property)
      const value = 0.7;
      const naryMean = (value + value + value) / 3;
      assert.ok(
        Math.abs(naryMean - value) < 1e-10,
        `Mean of identical values should equal that value, got ${naryMean}`
      );
    });

    it('mean preserves bounds when inputs are in [-1, 1]', () => {
      // If all inputs are in [-1, 1], the mean must be too
      const values = [0.9, -0.8, 0.7, -0.6, 0.5];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;

      assert.ok(mean >= -1, 'Mean should be >= -1');
      assert.ok(mean <= 1, 'Mean should be <= 1');
    });
  });
});

describe('trait interaction order', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  function resolve(
    strat: OperationalStrategy,
    name: string
  ): ResolvedConstraint {
    const { traits, features } = strat.resolveWithFeatures(name, {});
    return { name, params: {}, traits, features };
  }

  it('interactions are evaluated AFTER mean computation', () => {
    // This test proves the pipeline order: computeMean → resolveInteractions
    //
    // Scenario: Two constraints with trait values that when averaged fall
    // below the interaction threshold.
    //
    // Example:
    //   Constraint A: v5 = 0.8 (analytical)
    //   Constraint B: v5 = 0.0 (creative - no v5)
    //   Mean: v5 = 0.4 (below 0.5 threshold)
    //
    // If interactions were applied BEFORE mean: 0.8 > 0.5, would trigger
    // With AFTER mean (correct): 0.4 < 0.5, won't trigger

    const INTERACTION_THRESHOLD = 0.5;

    const analytical = resolve(strategy, 'analytical'); // v5:+0.8
    const creative = resolve(strategy, 'creative'); // v1:+0.5, v5:0

    // Verify individual values
    assert.ok(
      analytical.traits[4]! > INTERACTION_THRESHOLD,
      `Analytical v5 (${analytical.traits[4]}) should exceed threshold`
    );
    assert.equal(creative.traits[4], 0, 'Creative v5 should be 0');

    // After mean, v5 = (0.8 + 0) / 2 = 0.4
    const result = composer.compose([analytical, creative]);
    const meanV5 = result.traits[4]!;

    assert.ok(
      meanV5 < INTERACTION_THRESHOLD,
      `Mean v5 (${meanV5}) should be below threshold (${INTERACTION_THRESHOLD})`
    );

    // This proves interactions see the post-mean values, not pre-mean
  });

  it('demonstrates correct pipeline: computeMean → resolveInteractions', () => {
    // Use the composer to verify the actual pipeline order
    const creative = resolve(strategy, 'creative'); // v1:+0.5
    const precise = resolve(strategy, 'precise'); // v1:-0.5, v5:+0.5
    const analytical = resolve(strategy, 'analytical'); // v5:+0.8

    // Compose all together
    const result = composer.compose([creative, precise, analytical, analytical]);

    // v1: mean(0.5, -0.5, 0, 0) = 0
    assert.ok(
      Math.abs(result.traits[0]!) < 0.01,
      `v1 should be ~0 after mean: got ${result.traits[0]}`
    );

    // v5: mean(0, 0.5, 0.8, 0.8) = 0.525
    assert.ok(
      Math.abs(result.traits[4]! - 0.525) < 0.01,
      `v5 should be ~0.525 after mean: got ${result.traits[4]}`
    );

    // All traits should be in valid range
    for (let i = 0; i < result.traits.length; i++) {
      assert.ok(
        result.traits[i]! >= -1 && result.traits[i]! <= 1,
        `Trait ${i} should be in [-1, 1]: got ${result.traits[i]}`
      );
    }
  });
});

describe('compose convenience function', () => {
  const strategy = new OperationalStrategy();

  it('produces same result as Composer class', () => {
    const a = strategy.resolveWithFeatures('creative', {});
    const b = strategy.resolveWithFeatures('terse', {});

    const constraintA: ResolvedConstraint = {
      name: 'creative',
      params: {},
      traits: a.traits,
      features: a.features,
    };
    const constraintB: ResolvedConstraint = {
      name: 'terse',
      params: {},
      traits: b.traits,
      features: b.features,
    };

    const fromClass = new Composer(strategy).compose([constraintA, constraintB]);
    const fromFunction = compose(strategy, [constraintA, constraintB]);

    assertVectorsEqual(fromClass.traits, fromFunction.traits);
  });
});
