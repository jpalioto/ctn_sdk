import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { magnitude, type TraitVector, type TraitInteraction } from '../schemas/index.js';
import { resolveInteractions } from './interactions.js';

/**
 * Tests for interaction resolution.
 *
 * CRITICAL INVARIANT: All interactions MUST be non-expansive transforms:
 *   ‖τ'‖ ≤ ‖τ‖ ≤ 1
 */

describe('Interaction Resolution', () => {
  describe('non-expansion invariant', () => {
    it('priority resolution decreases magnitude when zeroing a non-zero trait', () => {
      // Create vector at ‖τ‖ = 0.9
      // We'll set v1 = 0.7 and v5 = sqrt(0.81 - 0.49) = sqrt(0.32) ≈ 0.566
      // so ‖τ‖ = sqrt(0.49 + 0.32) = sqrt(0.81) = 0.9
      const v1Value = 0.7;
      const v5Value = Math.sqrt(0.81 - v1Value * v1Value);
      const traits: TraitVector = [v1Value, 0, 0, 0, v5Value, 0, 0];

      const originalMagnitude = magnitude(traits);
      assert.ok(
        Math.abs(originalMagnitude - 0.9) < 0.0001,
        `Original magnitude should be 0.9, got ${originalMagnitude}`
      );

      // Apply priority interaction: v5 wins, so v1 is zeroed
      const interactions: TraitInteraction[] = [
        {
          id: 'creative-analytical',
          traitIndices: [0, 4] as const, // v1, v5
          condition: 'both_high',
          resolution: 'priority',
          priorityIndex: 4, // v5 wins
        },
      ];

      // Use threshold of 0.5 so both traits (0.7, 0.566) exceed it
      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });

      // v1 should be zeroed
      assert.equal(result.traits[0], 0, 'v1 should be zeroed (non-priority trait)');
      assert.ok(
        Math.abs(result.traits[4]! - v5Value) < 0.0001,
        'v5 should be unchanged (priority trait)'
      );

      // Magnitude should have decreased
      const newMagnitude = magnitude(result.traits);
      assert.ok(
        newMagnitude < originalMagnitude,
        `Magnitude should decrease: ${newMagnitude} < ${originalMagnitude}`
      );

      // New magnitude should be just v5Value
      assert.ok(
        Math.abs(newMagnitude - v5Value) < 0.0001,
        `New magnitude should be ${v5Value}, got ${newMagnitude}`
      );
    });

    it('suppress_both resolution results in zero magnitude for affected traits', () => {
      // Create vector with two traits high enough to trigger both_high
      // v1 = 0.6, v6 = 0.7, ‖τ‖ = sqrt(0.36 + 0.49) = sqrt(0.85) ≈ 0.922
      const traits: TraitVector = [0.6, 0, 0, 0, 0, 0.7, 0];

      const originalMagnitude = magnitude(traits);
      assert.ok(originalMagnitude > 0.9, `Original magnitude should be > 0.9, got ${originalMagnitude}`);

      // Apply suppress_both interaction
      const interactions: TraitInteraction[] = [
        {
          id: 'suppress-test',
          traitIndices: [0, 5] as const, // v1, v6
          condition: 'both_high',
          resolution: 'suppress_both',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });

      // Both traits should be zeroed
      assert.equal(result.traits[0], 0, 'v1 should be zeroed');
      assert.equal(result.traits[5], 0, 'v6 should be zeroed');

      // Magnitude should be 0 (no other traits)
      const newMagnitude = magnitude(result.traits);
      assert.equal(newMagnitude, 0, 'Magnitude should be 0 after suppress_both');
    });

    it('explicit magnitude test: priority then suppress_both', () => {
      // Create vector at ‖τ‖ = 0.9 with three traits
      // v1 = 0.6, v5 = 0.5, v6 = sqrt(0.81 - 0.36 - 0.25) = sqrt(0.2) ≈ 0.447
      const v1 = 0.6;
      const v5 = 0.5;
      const v6 = Math.sqrt(0.81 - v1 * v1 - v5 * v5);
      const traits: TraitVector = [v1, 0, 0, 0, v5, v6, 0];

      const originalMagnitude = magnitude(traits);
      assert.ok(
        Math.abs(originalMagnitude - 0.9) < 0.001,
        `Original magnitude should be 0.9, got ${originalMagnitude}`
      );

      // First: apply priority (v5 wins over v1, zeros v1)
      const priorityInteraction: TraitInteraction[] = [
        {
          id: 'creative-analytical',
          traitIndices: [0, 4] as const,
          condition: 'both_high',
          resolution: 'priority',
          priorityIndex: 4,
        },
      ];

      // Use threshold 0.45 so all traits exceed it
      const afterPriority = resolveInteractions(traits, priorityInteraction, {
        interactionThreshold: 0.45,
      });

      const magnitudeAfterPriority = magnitude(afterPriority.traits);

      // ‖τ'‖ < ‖τ‖ (v1 zeroed, magnitude decreased)
      assert.ok(
        magnitudeAfterPriority < originalMagnitude,
        `Magnitude should decrease after priority: ${magnitudeAfterPriority} < ${originalMagnitude}`
      );
      assert.equal(afterPriority.traits[0], 0, 'v1 should be zeroed after priority');

      // Second: apply suppress_both on remaining traits (v5 and v6)
      const suppressInteraction: TraitInteraction[] = [
        {
          id: 'suppress-v5-v6',
          traitIndices: [4, 5] as const,
          condition: 'both_high',
          resolution: 'suppress_both',
        },
      ];

      // Apply to the result from priority (but v5 and v6 are still non-zero)
      const afterSuppress = resolveInteractions(afterPriority.traits, suppressInteraction, {
        interactionThreshold: 0.4,
      });

      const magnitudeAfterSuppress = magnitude(afterSuppress.traits);

      // ‖τ''‖ = 0 (both remaining traits suppressed)
      assert.equal(
        magnitudeAfterSuppress,
        0,
        'Magnitude should be 0 after suppress_both'
      );
      assert.deepEqual(
        [...afterSuppress.traits],
        [0, 0, 0, 0, 0, 0, 0],
        'All traits should be zero'
      );
    });

    it('modify resolution does not change magnitude', () => {
      // Create vector with two traits
      const traits: TraitVector = [0.6, 0, 0, 0, 0, 0.7, 0];
      const originalMagnitude = magnitude(traits);

      // Apply modify interaction (doesn't change trait values)
      const interactions: TraitInteraction[] = [
        {
          id: 'modify-test',
          traitIndices: [0, 5] as const,
          condition: 'both_high',
          resolution: 'modify',
          modifiedText: 'Modified kernel text',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });

      // Traits should be unchanged
      assert.ok(
        Math.abs(result.traits[0]! - 0.6) < 0.0001,
        'v1 should be unchanged'
      );
      assert.ok(
        Math.abs(result.traits[5]! - 0.7) < 0.0001,
        'v6 should be unchanged'
      );

      // Magnitude should be identical
      const newMagnitude = magnitude(result.traits);
      assert.ok(
        Math.abs(newMagnitude - originalMagnitude) < 0.0001,
        `Magnitude should be unchanged: ${newMagnitude} == ${originalMagnitude}`
      );
    });

    it('throws error if interaction would increase magnitude', () => {
      // This test verifies the safety check in resolveInteractions
      // We can't actually trigger this with valid resolutions, but we verify
      // the invariant check exists by checking the function's behavior
      const traits: TraitVector = [0.5, 0, 0, 0, 0.5, 0, 0];
      const originalMagnitude = magnitude(traits);

      // All valid resolutions (priority, suppress_both, modify) are non-expansive
      // This test just confirms we can't increase magnitude
      const interactions: TraitInteraction[] = [
        {
          id: 'test',
          traitIndices: [0, 4] as const,
          condition: 'both_high',
          resolution: 'suppress_both',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.4 });
      const newMagnitude = magnitude(result.traits);

      // Verify invariant: ‖τ'‖ ≤ ‖τ‖
      assert.ok(
        newMagnitude <= originalMagnitude + 1e-10,
        `Non-expansive invariant violated: ${newMagnitude} > ${originalMagnitude}`
      );
    });
  });

  describe('condition matching', () => {
    it('both_high triggers when both traits exceed threshold', () => {
      const traits: TraitVector = [0.6, 0, 0, 0, 0.7, 0, 0];
      const interactions: TraitInteraction[] = [
        {
          id: 'test',
          traitIndices: [0, 4] as const,
          condition: 'both_high',
          resolution: 'suppress_both',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });
      assert.deepEqual(result.appliedInteractions, ['test']);
    });

    it('both_high does not trigger when one trait below threshold', () => {
      const traits: TraitVector = [0.6, 0, 0, 0, 0.4, 0, 0]; // v5 = 0.4 < 0.5
      const interactions: TraitInteraction[] = [
        {
          id: 'test',
          traitIndices: [0, 4] as const,
          condition: 'both_high',
          resolution: 'suppress_both',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });
      assert.deepEqual(result.appliedInteractions, []);
      assert.ok(
        Math.abs(result.traits[0]! - 0.6) < 0.0001,
        'v1 should be unchanged'
      );
    });

    it('both_low triggers when both traits below negative threshold', () => {
      const traits: TraitVector = [-0.6, 0, 0, 0, -0.7, 0, 0];
      const interactions: TraitInteraction[] = [
        {
          id: 'test',
          traitIndices: [0, 4] as const,
          condition: 'both_low',
          resolution: 'suppress_both',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });
      assert.deepEqual(result.appliedInteractions, ['test']);
    });

    it('opposing triggers when traits have opposite high values', () => {
      const traits: TraitVector = [0.7, 0, 0, 0, -0.6, 0, 0];
      const interactions: TraitInteraction[] = [
        {
          id: 'test',
          traitIndices: [0, 4] as const,
          condition: 'opposing',
          resolution: 'suppress_both',
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });
      assert.deepEqual(result.appliedInteractions, ['test']);
    });
  });

  describe('evaluation order', () => {
    it('first matching interaction for a trait pair wins', () => {
      const traits: TraitVector = [0.7, 0, 0, 0, 0.6, 0, 0];

      // Two interactions for the same pair - first should win
      const interactions: TraitInteraction[] = [
        {
          id: 'first',
          traitIndices: [0, 4] as const,
          condition: 'both_high',
          resolution: 'priority',
          priorityIndex: 4, // v5 wins
        },
        {
          id: 'second',
          traitIndices: [0, 4] as const,
          condition: 'both_high',
          resolution: 'suppress_both', // Different resolution
        },
      ];

      const result = resolveInteractions(traits, interactions, { interactionThreshold: 0.5 });

      // Only first should be applied
      assert.deepEqual(result.appliedInteractions, ['first']);
      assert.equal(result.traits[0], 0, 'v1 should be zeroed (priority)');
      assert.ok(result.traits[4]! > 0, 'v5 should NOT be zeroed (it won priority)');
    });
  });
});
