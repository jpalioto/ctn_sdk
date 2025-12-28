import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy } from '../strategy/index.js';
import {
  generateKernelIR,
  isEmptyKernel,
  summarizeKernel,
} from './generator.js';
import type { TraitInteraction } from '../schemas/index.js';
import { KERNEL_THRESHOLD } from '../schemas/index.js';

describe('KernelIR Generator', () => {
  const strategy = new OperationalStrategy();

  describe('generateKernelIR', () => {
    it('generates clauses for traits above threshold', () => {
      // v1: 0.5 (above threshold of 0.3)
      const traits = [0.5, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);

      assert.equal(kernelIR.strategyName, 'operational');
      assert.equal(kernelIR.strategyVersion, '1.0.0');
      assert.equal(kernelIR.clauses.length, 1);

      const clause = kernelIR.clauses[0]!;
      assert.equal(clause.traitId, 'v1');
      assert.equal(clause.traitIndex, 0);
      assert.equal(clause.polarity, 'positive');
      assert.equal(clause.intensity, 'medium'); // 0.5 is medium
      assert.equal(clause.text, 'creative, exploratory responses');
    });

    it('omits traits below threshold', () => {
      // v1: 0.2 (below threshold of 0.3)
      const traits = [0.2, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);

      assert.equal(kernelIR.clauses.length, 0);
      assert.ok(kernelIR.omittedTraits.includes('v1'));
    });

    it('handles negative polarity', () => {
      // v1: -0.6 (negative, above threshold)
      const traits = [-0.6, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);

      assert.equal(kernelIR.clauses.length, 1);
      const clause = kernelIR.clauses[0]!;
      assert.equal(clause.polarity, 'negative');
      assert.equal(clause.text, 'deterministic, grounded responses');
    });

    it('assigns correct intensity levels', () => {
      // Test low intensity (0.3-0.5)
      const lowTraits = [0.35, 0, 0, 0, 0, 0, 0];
      const lowKernel = generateKernelIR(lowTraits, strategy);
      assert.equal(lowKernel.clauses[0]!.intensity, 'low');

      // Test medium intensity (0.5-0.7)
      const medTraits = [0.55, 0, 0, 0, 0, 0, 0];
      const medKernel = generateKernelIR(medTraits, strategy);
      assert.equal(medKernel.clauses[0]!.intensity, 'medium');

      // Test high intensity (0.7+)
      const highTraits = [0.8, 0, 0, 0, 0, 0, 0];
      const highKernel = generateKernelIR(highTraits, strategy);
      assert.equal(highKernel.clauses[0]!.intensity, 'high');
    });

    it('generates multiple clauses for multiple active traits', () => {
      // v1: 0.5, v5: 0.8
      const traits = [0.5, 0, 0, 0, 0.8, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);

      assert.equal(kernelIR.clauses.length, 2);

      const v1Clause = kernelIR.clauses.find((c) => c.traitId === 'v1');
      const v5Clause = kernelIR.clauses.find((c) => c.traitId === 'v5');

      assert.ok(v1Clause);
      assert.ok(v5Clause);
      assert.equal(v1Clause.intensity, 'medium');
      assert.equal(v5Clause.intensity, 'high');
    });

    it('returns empty kernel for zero vector', () => {
      const traits = [0, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);

      assert.equal(kernelIR.clauses.length, 0);
      assert.equal(kernelIR.omittedTraits.length, 7); // All traits omitted
    });

    it('handles modify interactions correctly', () => {
      // v1 and v6 both high - creative-compliance interaction
      const traits = [0.6, 0, 0, 0, 0, 0.6, 0];

      const interaction: TraitInteraction = {
        id: 'creative-compliance',
        traitIndices: [0, 5],
        condition: 'both_high',
        resolution: 'modify',
        modifiedText: 'Balance creative exploration with adherence to constraints',
      };

      const kernelIR = generateKernelIR(traits, strategy, [interaction]);

      // v1 and v6 should be replaced by modified clause
      assert.equal(kernelIR.clauses.length, 0); // No regular clauses for v1, v6
      assert.equal(kernelIR.modifiedClauses.length, 1);

      const modClause = kernelIR.modifiedClauses[0]!;
      assert.equal(modClause.interactionId, 'creative-compliance');
      assert.deepEqual(modClause.replacedTraits, ['v1', 'v6']);
      assert.equal(modClause.text, 'Balance creative exploration with adherence to constraints');
    });

    it('does not modify traits for non-modify interactions', () => {
      const traits = [0.6, 0, 0, 0, 0.8, 0, 0];

      // Priority interaction doesn't create modified clauses
      const interaction: TraitInteraction = {
        id: 'creative-analytical',
        traitIndices: [0, 4],
        condition: 'both_high',
        resolution: 'priority',
        priorityIndex: 4,
      };

      const kernelIR = generateKernelIR(traits, strategy, [interaction]);

      // Should have normal clauses, not modified
      assert.equal(kernelIR.modifiedClauses.length, 0);
      assert.ok(kernelIR.clauses.length > 0);
    });
  });

  describe('isEmptyKernel', () => {
    it('returns true for zero vector kernel', () => {
      const traits = [0, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      assert.ok(isEmptyKernel(kernelIR));
    });

    it('returns false for kernel with clauses', () => {
      const traits = [0.5, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      assert.ok(!isEmptyKernel(kernelIR));
    });

    it('returns false for kernel with modified clauses', () => {
      const traits = [0.6, 0, 0, 0, 0, 0.6, 0];
      const interaction: TraitInteraction = {
        id: 'test',
        traitIndices: [0, 5],
        condition: 'both_high',
        resolution: 'modify',
        modifiedText: 'Test',
      };
      const kernelIR = generateKernelIR(traits, strategy, [interaction]);
      assert.ok(!isEmptyKernel(kernelIR));
    });
  });

  describe('summarizeKernel', () => {
    it('summarizes kernel with clauses', () => {
      const traits = [0.5, 0, 0, 0, 0.8, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      const summary = summarizeKernel(kernelIR);

      assert.ok(summary.includes('operational@1.0.0'));
      assert.ok(summary.includes('v1:positive:medium'));
      assert.ok(summary.includes('v5:positive:high'));
    });

    it('summarizes empty kernel', () => {
      const traits = [0, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      const summary = summarizeKernel(kernelIR);

      assert.ok(summary.includes('operational@1.0.0'));
      assert.ok(summary.includes('Omitted'));
    });
  });

  describe('threshold boundary', () => {
    it('includes traits at exactly threshold', () => {
      // The check is absValue < KERNEL_THRESHOLD, so exactly 0.3 IS included
      const traits = [KERNEL_THRESHOLD, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      assert.equal(kernelIR.clauses.length, 1);
    });

    it('excludes traits just below threshold', () => {
      const traits = [KERNEL_THRESHOLD - 0.01, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      assert.equal(kernelIR.clauses.length, 0);
    });

    it('includes traits just above threshold', () => {
      const traits = [KERNEL_THRESHOLD + 0.01, 0, 0, 0, 0, 0, 0];
      const kernelIR = generateKernelIR(traits, strategy);
      assert.equal(kernelIR.clauses.length, 1);
    });
  });
});
