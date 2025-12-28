import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy } from './operational.js';
import { Composer } from '../composer/composer.js';
import { resolveInteractions } from '../composer/interactions.js';
import { generateKernelIR } from '../kernel/generator.js';
import { DEFAULT_THRESHOLDS } from '../schemas/index.js';
import type { ResolvedConstraint, TraitVector, TraitInteraction } from '../schemas/index.js';

/**
 * Tests for configurable thresholds in StrategyConfig.
 *
 * These tests verify:
 * 1. KERNEL_THRESHOLD can be customized via strategy.thresholds.kernel
 * 2. INTERACTION_THRESHOLD can be customized via strategy.thresholds.interaction
 * 3. Custom thresholds are respected in kernel generation
 * 4. Custom thresholds are respected in interaction resolution
 */

describe('Configurable Thresholds', () => {
  describe('default thresholds', () => {
    it('uses default kernel threshold of 0.3', () => {
      const strategy = new OperationalStrategy();
      assert.equal(strategy.thresholds.kernel, 0.3);
      assert.equal(strategy.thresholds.kernel, DEFAULT_THRESHOLDS.kernel);
    });

    it('uses default interaction threshold of 0.5', () => {
      const strategy = new OperationalStrategy();
      assert.equal(strategy.thresholds.interaction, 0.5);
      assert.equal(strategy.thresholds.interaction, DEFAULT_THRESHOLDS.interaction);
    });
  });

  describe('custom thresholds', () => {
    it('accepts custom kernel threshold', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.4 },
      });
      assert.equal(strategy.thresholds.kernel, 0.4);
      assert.equal(strategy.thresholds.interaction, 0.5); // default
    });

    it('accepts custom interaction threshold', () => {
      const strategy = new OperationalStrategy({
        thresholds: { interaction: 0.6 },
      });
      assert.equal(strategy.thresholds.kernel, 0.3); // default
      assert.equal(strategy.thresholds.interaction, 0.6);
    });

    it('accepts both custom thresholds', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.2, interaction: 0.7 },
      });
      assert.equal(strategy.thresholds.kernel, 0.2);
      assert.equal(strategy.thresholds.interaction, 0.7);
    });
  });

  describe('kernel threshold behavior', () => {
    it('includes traits above custom threshold', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.2 }, // Lower than default 0.3
      });

      // Trait value of 0.25 is above 0.2 but below default 0.3
      const traits: TraitVector = [0.25, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(
        kernelIR.clauses.length,
        1,
        'Should include trait at 0.25 when threshold is 0.2'
      );
      assert.equal(kernelIR.clauses[0]!.traitId, 'v1');
    });

    it('excludes traits below custom threshold', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.5 }, // Higher than default 0.3
      });

      // Trait value of 0.4 is above default 0.3 but below custom 0.5
      const traits: TraitVector = [0.4, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(
        kernelIR.clauses.length,
        0,
        'Should exclude trait at 0.4 when threshold is 0.5'
      );
      assert.ok(kernelIR.omittedTraits.includes('v1'));
    });

    it('different thresholds produce different kernel IR', () => {
      const lowThreshold = new OperationalStrategy({
        thresholds: { kernel: 0.2 },
      });
      const highThreshold = new OperationalStrategy({
        thresholds: { kernel: 0.4 },
      });

      const traits: TraitVector = [0.35, 0, 0, 0, 0, 0, 0];

      const lowKernel = generateKernelIR(traits, lowThreshold, []);
      const highKernel = generateKernelIR(traits, highThreshold, []);

      // 0.35 is above 0.2 (included) but below 0.4 (excluded)
      assert.equal(lowKernel.clauses.length, 1, 'Low threshold should include');
      assert.equal(highKernel.clauses.length, 0, 'High threshold should exclude');
    });
  });

  describe('interaction threshold behavior', () => {
    const createInteraction = (): TraitInteraction => ({
      id: 'test_interaction',
      traitIndices: [0, 1],
      condition: 'both_high',
      resolution: 'suppress_both',
    });

    it('fires interaction when above custom threshold', () => {
      // Values 0.55 are above custom threshold 0.5
      const traits: TraitVector = [0.55, 0.55, 0, 0, 0, 0, 0];

      const result = resolveInteractions(
        traits,
        [createInteraction()],
        { interactionThreshold: 0.5 }
      );

      assert.equal(result.appliedInteractions.length, 1);
      assert.equal(result.traits[0], 0);
      assert.equal(result.traits[1], 0);
    });

    it('does not fire interaction when below custom threshold', () => {
      // Values 0.55 are below custom threshold 0.6
      const traits: TraitVector = [0.55, 0.55, 0, 0, 0, 0, 0];

      const result = resolveInteractions(
        traits,
        [createInteraction()],
        { interactionThreshold: 0.6 }
      );

      assert.equal(result.appliedInteractions.length, 0);
      assert.equal(result.traits[0], 0.55);
      assert.equal(result.traits[1], 0.55);
    });

    it('different thresholds produce different interaction results', () => {
      const traits: TraitVector = [0.55, 0.55, 0, 0, 0, 0, 0];
      const interaction = createInteraction();

      const lowResult = resolveInteractions(
        traits,
        [interaction],
        { interactionThreshold: 0.5 }
      );
      const highResult = resolveInteractions(
        traits,
        [interaction],
        { interactionThreshold: 0.6 }
      );

      assert.equal(lowResult.appliedInteractions.length, 1, 'Low threshold fires');
      assert.equal(highResult.appliedInteractions.length, 0, 'High threshold does not fire');
    });
  });

  describe('composer uses strategy thresholds', () => {
    it('composer respects custom interaction threshold', () => {
      const strategy = new OperationalStrategy({
        thresholds: { interaction: 0.7 }, // High threshold
      });
      const composer = new Composer(strategy);

      // Create constraints that produce traits at 0.6
      const constraint: ResolvedConstraint = {
        name: 'test',
        params: {},
        traits: [0.6, 0.6, 0, 0, 0, 0, 0],
        features: {},
      };

      // Create interaction that would fire with default 0.5 but not 0.7
      const interaction: TraitInteraction = {
        id: 'test',
        traitIndices: [0, 1],
        condition: 'both_high',
        resolution: 'suppress_both',
      };

      // With high threshold, interaction should NOT fire
      const result = composer.compose([constraint], [interaction]);

      // Traits should be unchanged (interaction didn't fire)
      assert.ok(
        result.traits[0]! > 0.5,
        `Trait 0 should remain > 0.5, got ${result.traits[0]}`
      );
      assert.ok(
        result.traits[1]! > 0.5,
        `Trait 1 should remain > 0.5, got ${result.traits[1]}`
      );
    });

    it('composer respects custom kernel threshold', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.5 }, // High threshold
      });
      const composer = new Composer(strategy);

      const constraint: ResolvedConstraint = {
        name: 'test',
        params: {},
        traits: [0.4, 0, 0, 0, 0, 0, 0], // Below custom threshold
        features: {},
      };

      const result = composer.compose([constraint]);

      // Kernel should have no clauses (trait below threshold)
      assert.equal(
        result.kernelIR.clauses.length,
        0,
        'No clauses should be generated for trait below threshold'
      );
    });
  });

  describe('edge cases', () => {
    it('includes trait at exactly threshold value', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.5 },
      });

      // Trait at exactly threshold value - should be INCLUDED (uses < not <=)
      // absValue < threshold means: 0.5 < 0.5 is false, so NOT omitted
      const traits: TraitVector = [0.5, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(
        kernelIR.clauses.length,
        1,
        'Trait at exactly threshold should be included (absValue is NOT less than threshold)'
      );
    });

    it('handles threshold just above trait value', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.500001 },
      });

      const traits: TraitVector = [0.5, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(kernelIR.clauses.length, 0);
    });

    it('handles threshold just below trait value', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.499999 },
      });

      const traits: TraitVector = [0.5, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(kernelIR.clauses.length, 1);
    });

    it('extreme low threshold includes almost all traits', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.01 },
      });

      const traits: TraitVector = [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(kernelIR.clauses.length, 7, 'All traits should be included');
    });

    it('extreme high threshold excludes almost all traits', () => {
      const strategy = new OperationalStrategy({
        thresholds: { kernel: 0.99 },
      });

      const traits: TraitVector = [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9];
      const kernelIR = generateKernelIR(traits, strategy, []);

      assert.equal(kernelIR.clauses.length, 0, 'No traits should be included');
    });
  });
});
