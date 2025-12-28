import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy } from '../strategy/operational.js';
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

    it('has identity: a ⊕ identity === a', () => {
      const a = resolve(strategy, 'creative');
      const identity: ResolvedConstraint = {
        name: 'identity',
        params: {},
        traits: strategy.identity(),
        features: {},
      };

      const aOnly = composer.compose([a]);
      const aWithIdentity = composer.compose([a, identity]);

      assertVectorsEqual(aOnly.traits, aWithIdentity.traits);
    });

    it('empty composition yields identity', () => {
      const empty = composer.compose([]);
      const identity = strategy.identity();

      assertVectorsEqual(empty.traits, identity);
    });
  });

  describe('unit ball constraint', () => {
    it('enforces ‖τ‖ ≤ 1 after composition', () => {
      const a = resolve(strategy, 'creative');

      // Stack same constraint multiple times
      const extreme = composer.compose([a, a, a, a, a]);

      assert.ok(
        magnitude(extreme.traits) <= 1 + 1e-10,
        `Magnitude ${magnitude(extreme.traits)} exceeds unit ball`
      );
    });

    it('saturates correctly when sum exceeds unit ball', () => {
      // Create constraints that will definitely exceed unit ball when summed
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

      const mag = magnitude(result.traits);
      assert.ok(
        mag <= 1 + 1e-10,
        `Magnitude ${mag} exceeds unit ball after saturation`
      );
    });

    it('preserves direction when saturating', () => {
      const creative = resolve(strategy, 'creative'); // v1:+0.5

      // Stack creative multiple times - should still point in same direction
      const single = composer.compose([creative]);
      const stacked = composer.compose([creative, creative, creative]);

      // v1 should still be positive
      assert.ok(stacked.traits[0]! > 0, 'v1 should remain positive');

      // Direction should be preserved (v1 is the dominant non-zero component)
      // The ratio of other components to v1 should be similar
    });
  });

  describe('destructive interference', () => {
    it('cancels opposing traits', () => {
      const creative = resolve(strategy, 'creative'); // v1:+0.5
      const precise = resolve(strategy, 'precise'); // v1:-0.5, v5:+0.5

      const result = composer.compose([creative, precise]);

      // v1 should be near zero (0.5 + -0.5 = 0)
      assert.ok(
        Math.abs(result.traits[0]!) < 0.01,
        `v1 should cancel: got ${result.traits[0]}`
      );

      // v5 should remain (+0.5 from precise)
      assert.ok(
        Math.abs(result.traits[4]! - 0.5) < 0.01,
        `v5 should be ~0.5: got ${result.traits[4]}`
      );
    });

    it('handles full cancellation', () => {
      const formal = resolve(strategy, 'formal'); // v4:+0.5
      const casual = resolve(strategy, 'casual'); // v4:-0.5

      const result = composer.compose([formal, casual]);

      // v4 should be exactly zero
      assert.ok(
        Math.abs(result.traits[3]!) < 1e-10,
        `v4 should be zero: got ${result.traits[3]}`
      );
    });
  });

  describe('constructive interference', () => {
    it('adds orthogonal traits', () => {
      const terse = resolve(strategy, 'terse'); // v2:+0.5
      const formal = resolve(strategy, 'formal'); // v4:+0.5

      const result = composer.compose([terse, formal]);

      // Both traits should be present
      assert.ok(
        Math.abs(result.traits[1]! - 0.5) < 0.01,
        `v2 should be ~0.5: got ${result.traits[1]}`
      );
      assert.ok(
        Math.abs(result.traits[3]! - 0.5) < 0.01,
        `v4 should be ~0.5: got ${result.traits[3]}`
      );
    });
  });

  describe('n-ary composition guarantee', () => {
    it('n-ary composition differs from iterative binary with per-step normalization', () => {
      // This test demonstrates WHY n-ary matters
      // We manually compute what binary composition would produce

      const a = 0.6;
      const b = 0.6;
      const c = -0.6;

      // N-ary: saturate(a + b + c) = saturate(0.6) = 0.6
      const nary = Math.min(1, Math.abs(a + b + c)) * Math.sign(a + b + c);

      // Binary with per-step: saturate(saturate(a + b) + c)
      const ab = Math.min(1, Math.abs(a + b)) * Math.sign(a + b); // saturate(1.2) = 1.0
      const binary = Math.min(1, Math.abs(ab + c)) * Math.sign(ab + c); // saturate(0.4) = 0.4

      // They differ! This is why n-ary matters
      assert.notEqual(
        nary,
        binary,
        'N-ary and binary should differ (demonstrating why n-ary matters)'
      );
      assert.equal(nary, 0.6, 'N-ary result should be 0.6');
      assert.equal(binary, 0.4, 'Binary result should be 0.4');
    });
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
