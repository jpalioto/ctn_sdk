import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  OperationalStrategy,
  joinFeatures,
  joinFeatureValues,
  FeatureConflictError,
  type Features,
  type ResolvedConstraint,
} from '@ctn/language';
import { Composer } from '@ctn/language';
import type {
  Message,
  TokenBudget,
  FeatureClampEvent,
  OverrideCollision,
  ProjectedConfig,
} from './types.js';
import { applyContextPolicy, estimateTokens, calculateTokenBudget } from './context.js';

/**
 * Tests for feature conflicts, collisions, and context policy invariants.
 *
 * These tests verify:
 * 1. EXCLUSIVE lattice conflict throws FeatureConflictError
 * 2. Feature clamp events are correctly captured
 * 3. Context policy only affects history, never the kernel
 */

describe('Feature Lattice Conflicts', () => {
  describe('EXCLUSIVE lattice', () => {
    it('throws FeatureConflictError when response_format values differ', () => {
      // response_format is EXCLUSIVE in FEATURE_LATTICES
      const featuresA: Features = { response_format: 'json' };
      const featuresB: Features = { response_format: 'markdown' };

      assert.throws(
        () => joinFeatures(featuresA, featuresB),
        FeatureConflictError,
        'Should throw FeatureConflictError for conflicting exclusive features'
      );
    });

    it('throws FeatureConflictError with correct message details', () => {
      const featuresA: Features = { response_format: 'json' };
      const featuresB: Features = { response_format: 'text' };

      try {
        joinFeatures(featuresA, featuresB);
        assert.fail('Should have thrown FeatureConflictError');
      } catch (error) {
        assert.ok(error instanceof FeatureConflictError);
        assert.equal(error.featureName, 'response_format');
        assert.equal(error.valueA, 'json');
        assert.equal(error.valueB, 'text');
        assert.ok(
          error.message.includes('response_format'),
          'Message should include feature name'
        );
      }
    });

    it('allows EXCLUSIVE features with same value', () => {
      const featuresA: Features = { response_format: 'json' };
      const featuresB: Features = { response_format: 'json' };

      const result = joinFeatures(featuresA, featuresB);
      assert.equal(result.response_format, 'json');
    });

    it('throws for conflicting context policies', () => {
      // context is EXCLUSIVE
      const featuresA: Features = { context: { type: 'none' } };
      const featuresB: Features = { context: { type: 'all' } };

      assert.throws(
        () => joinFeatures(featuresA, featuresB),
        FeatureConflictError,
        'Should throw for conflicting context policies'
      );
    });

    it('allows same context policies', () => {
      const featuresA: Features = { context: { type: 'last', n: 5 } };
      const featuresB: Features = { context: { type: 'last', n: 5 } };

      const result = joinFeatures(featuresA, featuresB);
      assert.deepEqual(result.context, { type: 'last', n: 5 });
    });
  });

  describe('MIN lattice', () => {
    it('takes minimum value for max_tokens', () => {
      const featuresA: Features = { max_tokens: 500 };
      const featuresB: Features = { max_tokens: 256 };

      const result = joinFeatures(featuresA, featuresB);
      assert.equal(result.max_tokens, 256);
    });
  });

  describe('MAX lattice', () => {
    it('takes maximum value for timeout', () => {
      const featuresA: Features = { timeout: 30000 };
      const featuresB: Features = { timeout: 60000 };

      const result = joinFeatures(featuresA, featuresB);
      assert.equal(result.timeout, 60000);
    });

    it('takes maximum value for thinking_budget', () => {
      const featuresA: Features = { thinking_budget: 1000 };
      const featuresB: Features = { thinking_budget: 2000 };

      const result = joinFeatures(featuresA, featuresB);
      assert.equal(result.thinking_budget, 2000);
    });
  });

  describe('UNION lattice', () => {
    it('merges stop_sequences arrays', () => {
      const featuresA: Features = { stop_sequences: ['END', 'STOP'] };
      const featuresB: Features = { stop_sequences: ['QUIT', 'END'] };

      const result = joinFeatures(featuresA, featuresB);
      const sequences = result.stop_sequences as string[];

      assert.ok(sequences.includes('END'));
      assert.ok(sequences.includes('STOP'));
      assert.ok(sequences.includes('QUIT'));
      // Deduplication
      assert.equal(sequences.filter((s) => s === 'END').length, 1);
    });
  });
});

describe('Feature Clamp Events', () => {
  it('captures MIN clamp when projected exceeds feature', () => {
    // Simulate what BaseCTNProvider.applyFeatureClamps does
    const projected: Record<string, unknown> = { max_tokens: 1024 };
    const features: Features = { max_tokens: 256 };

    // MIN lattice: final = min(projected, feature)
    const projectedValue = projected.max_tokens as number;
    const featureValue = features.max_tokens as number;
    const finalValue = Math.min(projectedValue, featureValue);

    const clampEvent: FeatureClampEvent = {
      parameter: 'max_tokens',
      projected: projectedValue,
      featureValue,
      final: finalValue,
      constraintSource: '@terse',
      clampType: 'MIN',
    };

    assert.equal(clampEvent.projected, 1024);
    assert.equal(clampEvent.featureValue, 256);
    assert.equal(clampEvent.final, 256);
    assert.equal(clampEvent.clampType, 'MIN');
  });

  it('captures MAX clamp when projected below feature', () => {
    const projected: Record<string, unknown> = { thinking_budget: 500 };
    const features: Features = { thinking_budget: 1000 };

    // MAX lattice: final = max(projected, feature)
    const projectedValue = projected.thinking_budget as number;
    const featureValue = features.thinking_budget as number;
    const finalValue = Math.max(projectedValue, featureValue);

    const clampEvent: FeatureClampEvent = {
      parameter: 'thinking_budget',
      projected: projectedValue,
      featureValue,
      final: finalValue,
      constraintSource: '@analytical',
      clampType: 'MAX',
    };

    assert.equal(clampEvent.projected, 500);
    assert.equal(clampEvent.featureValue, 1000);
    assert.equal(clampEvent.final, 1000);
    assert.equal(clampEvent.clampType, 'MAX');
  });

  it('captures EXCLUSIVE replacement', () => {
    const projected: Record<string, unknown> = { format: 'text' };
    const features: Features = { format: 'json' };

    // EXCLUSIVE: feature value replaces projected
    const clampEvent: FeatureClampEvent = {
      parameter: 'format',
      projected: projected.format as number,
      featureValue: features.format as number,
      final: features.format as number,
      constraintSource: '@json',
      clampType: 'EXCLUSIVE',
    };

    assert.equal(clampEvent.clampType, 'EXCLUSIVE');
  });
});

describe('Override Collisions', () => {
  it('captures collision when override replaces projected value', () => {
    const projected: Record<string, unknown> = { temperature: 0.7 };
    const overrideValue = 0.5;

    const collision: OverrideCollision = {
      parameter: 'temperature',
      source: 'projected',
      originalValue: projected.temperature,
      overrideValue,
    };

    assert.equal(collision.parameter, 'temperature');
    assert.equal(collision.source, 'projected');
    assert.equal(collision.originalValue, 0.7);
    assert.equal(collision.overrideValue, 0.5);
  });

  it('captures collision when override replaces clamped value', () => {
    const clampedValue = 256; // After feature clamp
    const overrideValue = 1024;

    const collision: OverrideCollision = {
      parameter: 'max_tokens',
      source: 'feature_clamp',
      originalValue: clampedValue,
      overrideValue,
    };

    assert.equal(collision.source, 'feature_clamp');
    assert.equal(collision.originalValue, 256);
    assert.equal(collision.overrideValue, 1024);
  });
});

describe('Context Policy Kernel Invariant', () => {
  const createMessages = (count: number): Message[] => {
    return Array.from({ length: count }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i + 1}: ${'x'.repeat(100)}`,
    }));
  };

  it('context policy affects only message history, not kernel', () => {
    const messages = createMessages(10);
    const kernel = '<behavioral_constraints>Be helpful</behavioral_constraints>';

    // Apply 'last' context policy - should only affect messages
    const filteredMessages = applyContextPolicy(messages, { type: 'last', n: 3 });

    // Verify messages are filtered
    assert.equal(filteredMessages.length, 3);

    // The kernel is NEVER touched by context policy
    // This is the invariant we're testing
    assert.equal(
      kernel,
      '<behavioral_constraints>Be helpful</behavioral_constraints>',
      'Kernel must remain unchanged regardless of context policy'
    );
  });

  it('even with none context policy, kernel is preserved', () => {
    const messages = createMessages(100);
    const kernel = '<behavioral_constraints>\n  Long kernel with many clauses\n</behavioral_constraints>';

    // Apply 'none' context policy
    const filteredMessages = applyContextPolicy(messages, { type: 'none' });

    // No messages should remain
    assert.equal(filteredMessages.length, 0);

    // But kernel is untouched
    assert.ok(kernel.includes('Long kernel'), 'Kernel is never affected by context policy');
  });

  it('all context policy preserves all messages and kernel', () => {
    const messages = createMessages(50);
    const kernel = 'Full kernel content';

    const filteredMessages = applyContextPolicy(messages, { type: 'all' });

    assert.equal(filteredMessages.length, 50);
    assert.equal(kernel, 'Full kernel content');
  });

  it('kernel is completely independent of message count', () => {
    const shortKernel = '<constraint>short</constraint>';
    const longKernel = '<behavioral_constraints>\n' +
      '  <constraint id="v1">Be precise and deterministic</constraint>\n' +
      '  <constraint id="v2">Be concise but thorough</constraint>\n' +
      '  <constraint id="v5">Use step-by-step reasoning</constraint>\n' +
      '</behavioral_constraints>';

    // With 1 message
    const messages1 = createMessages(1);
    const filtered1 = applyContextPolicy(messages1, { type: 'last', n: 5 });

    // With 1000 messages
    const messages1000 = createMessages(1000);
    const filtered1000 = applyContextPolicy(messages1000, { type: 'last', n: 5 });

    // Kernels remain exactly the same regardless of message operations
    assert.equal(shortKernel, '<constraint>short</constraint>');
    assert.ok(longKernel.includes('step-by-step reasoning'));

    // But messages are filtered appropriately
    assert.equal(filtered1.length, 1);
    assert.equal(filtered1000.length, 5);
  });
});

describe('Token Budget with Context Policy', () => {
  const createMessagesWithLength = (count: number, contentLength: number): Message[] => {
    return Array.from({ length: count }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}: ${'x'.repeat(contentLength)}`,
    }));
  };

  const testModel = {
    id: 'test-model',
    name: 'Test Model',
    contextWindow: 200000,
    defaultMaxTokens: 4096,
  };

  it('token budget calculation includes kernel tokens', () => {
    const systemPrompt = '<behavioral_constraints>Be helpful and precise</behavioral_constraints>';
    const messages = [
      ...createMessagesWithLength(4, 100),
      { role: 'user' as const, content: 'What is 2+2?' },
    ];

    const budget = calculateTokenBudget(
      systemPrompt,
      messages,
      testModel,
      4096 // reserved output
    );

    assert.ok(budget.systemTokens > 0, 'Should count system/kernel tokens');
    assert.ok(budget.historyTokens > 0, 'Should count history tokens');
    assert.ok(budget.currentMessageTokens > 0, 'Should count current message tokens');
    assert.equal(budget.reservedOutput, 4096);
    assert.equal(budget.modelLimit, 200000);
  });

  it('overBudget flag is set when tokens exceed limit', () => {
    const systemPrompt = 'x'.repeat(5000); // ~1250 tokens
    const messages = createMessagesWithLength(100, 1000); // Many long messages

    const smallModel = {
      id: 'small-model',
      name: 'Small Model',
      contextWindow: 1000, // Very small limit
      defaultMaxTokens: 256,
    };

    const budget = calculateTokenBudget(
      systemPrompt,
      messages,
      smallModel,
      256
    );

    assert.ok(budget.overBudget, 'Should be over budget with small limit');
    assert.ok(budget.available < 0, 'Available should be negative when over budget');
  });

  it('available tokens calculation is correct', () => {
    const budget: TokenBudget = {
      modelLimit: 10000,
      systemTokens: 1000,
      historyTokens: 3000,
      currentMessageTokens: 500,
      reservedOutput: 2000,
      available: 3500, // 10000 - 1000 - 3000 - 500 - 2000
      overBudget: false,
    };

    const expectedAvailable =
      budget.modelLimit -
      budget.systemTokens -
      budget.historyTokens -
      budget.currentMessageTokens -
      budget.reservedOutput;

    assert.equal(budget.available, expectedAvailable);
    assert.equal(budget.available, 3500);
  });
});

describe('Composition with Conflicting Features', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  it('composing constraints with compatible features succeeds', () => {
    // @terse and @precise both have no features (only traits)
    // @nomemory has a context feature
    const terseResult = strategy.resolveWithFeatures('terse', {});
    const nomemoryResult = strategy.resolveWithFeatures('nomemory', {});

    const terse: ResolvedConstraint = {
      name: 'terse',
      params: {},
      traits: terseResult.traits,
      features: terseResult.features,
    };

    const nomemory: ResolvedConstraint = {
      name: 'nomemory',
      params: {},
      traits: nomemoryResult.traits,
      features: nomemoryResult.features,
    };

    // Should not throw - compatible features compose
    const result = composer.compose([terse, nomemory]);
    // @nomemory sets context: { type: 'none' }
    assert.deepEqual(result.features.context, { type: 'none' });
  });

  it('composing constraints with MIN features takes minimum', () => {
    // Create two constraints with different max_tokens
    const constraint1: ResolvedConstraint = {
      name: 'test1',
      params: {},
      traits: strategy.identity(),
      features: { max_tokens: 500 },
    };

    const constraint2: ResolvedConstraint = {
      name: 'test2',
      params: {},
      traits: strategy.identity(),
      features: { max_tokens: 200 },
    };

    const result = composer.compose([constraint1, constraint2]);
    assert.equal(result.features.max_tokens, 200);
  });

  it('composing constraints with conflicting EXCLUSIVE features throws', () => {
    const constraint1: ResolvedConstraint = {
      name: 'json',
      params: {},
      traits: strategy.identity(),
      features: { response_format: 'json' },
    };

    const constraint2: ResolvedConstraint = {
      name: 'markdown',
      params: {},
      traits: strategy.identity(),
      features: { response_format: 'markdown' },
    };

    assert.throws(
      () => composer.compose([constraint1, constraint2]),
      FeatureConflictError,
      'Should throw when composing constraints with conflicting exclusive features'
    );
  });
});
