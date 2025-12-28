import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy, Composer } from '@ctn/language';
import {
  BaseCTNProvider,
  XMLKernelRenderer,
  applyContextPolicy,
  type Message,
  type ModelConfig,
  type StrategySupport,
  type ProjectedConfig,
  type ProviderResponse,
  type StreamChunk,
  type KernelRenderer,
} from './index.js';

/**
 * Integration test: System Never Sliced
 *
 * This test verifies that context policy only affects the message history,
 * NOT the system prompt (kernel). The kernel must always be sent in full
 * regardless of context policy settings.
 *
 * From the CTN specification:
 * - Context policy (`{ type: 'last', n: 5 }`) filters conversation history
 * - System prompt (containing the kernel) is NOT subject to context policy
 * - The kernel provides behavioral constraints and must remain intact
 */

// Mock provider that captures what would be sent to the API
class MockProvider extends BaseCTNProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider';
  readonly models: readonly ModelConfig[] = [
    {
      id: 'mock-model',
      name: 'Mock Model',
      contextWindow: 100000, // Large context window for 100+ messages
      defaultMaxTokens: 1024,
    },
  ];
  readonly supportedStrategies: readonly StrategySupport[] = [
    { name: 'operational', versionRange: '1.x' },
  ];

  protected readonly kernelRenderer: KernelRenderer = new XMLKernelRenderer();

  // Capture what would be sent
  public lastSystemPrompt: string = '';
  public lastMessages: readonly Message[] = [];

  constructor() {
    super();

    const strategy = new OperationalStrategy();
    this.registerProjection(strategy, {
      baseline: { temperature: 0.7 },
      weights: { temperature: [0.3, 0, 0, 0, -0.2, 0, 0] },
      scale: { temperature: 0.4 },
      clamps: { temperature: [0, 1] },
    });
  }

  async send(
    config: ProjectedConfig,
    messages: readonly Message[]
  ): Promise<ProviderResponse> {
    // Apply context policy to simulate real provider behavior
    const history = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];
    const filteredHistory = applyContextPolicy(history, config.contextPolicy);
    const allMessages = currentMessage
      ? [...filteredHistory, currentMessage]
      : [...filteredHistory];

    // Capture for assertions
    this.lastSystemPrompt = config.kernel;
    this.lastMessages = allMessages;

    return {
      id: 'mock-response',
      model: 'mock-model',
      content: 'Mock response',
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 50 },
    };
  }

  async *sendStream(): AsyncIterableIterator<StreamChunk> {
    yield { type: 'text', text: 'Mock' };
    yield { type: 'done', usage: { inputTokens: 100, outputTokens: 50 } };
  }
}

describe('System Never Sliced Integration Test', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  it('context policy slices messages but preserves full kernel', () => {
    const provider = new MockProvider();

    // Create a constraint with rich behavioral instructions
    const { traits, features } = strategy.resolveWithFeatures('precise', {});
    const constraint = composer.compose([
      { name: 'precise', params: {}, traits, features },
    ], strategy.interactions);

    // Project the constraint
    const config = provider.project(constraint, 'mock-model');

    // The kernel should contain behavioral constraints
    assert.ok(
      config.kernel.includes('<behavioral_constraints>'),
      'Kernel should contain behavioral constraints'
    );

    // Store the original kernel length
    const originalKernelLength = config.kernel.length;
    assert.ok(
      originalKernelLength > 100,
      'Kernel should have substantial content'
    );

    // Create 100+ messages to simulate a long conversation
    const messages: Message[] = [];
    for (let i = 0; i < 50; i++) {
      messages.push({ role: 'user', content: `User message ${i + 1}: This is a test message with some content.` });
      messages.push({ role: 'assistant', content: `Assistant response ${i + 1}: This is a response with some content.` });
    }
    // Add the current message
    messages.push({ role: 'user', content: 'Current user message - this should always be included.' });

    assert.equal(messages.length, 101, 'Should have 101 messages (100 history + 1 current)');

    // Set context policy to only keep last 5 messages (from history)
    const configWithContextPolicy: ProjectedConfig = {
      ...config,
      contextPolicy: { type: 'last', n: 5 },
    };

    // Send the request
    provider.send(configWithContextPolicy, messages);

    // CRITICAL ASSERTION: Kernel is NOT sliced
    assert.equal(
      provider.lastSystemPrompt,
      config.kernel,
      'System prompt (kernel) should be unchanged'
    );
    assert.equal(
      provider.lastSystemPrompt.length,
      originalKernelLength,
      'Kernel length should be unchanged'
    );
    assert.ok(
      provider.lastSystemPrompt.includes('<behavioral_constraints>'),
      'Full kernel should still contain behavioral constraints'
    );

    // CRITICAL ASSERTION: Messages ARE sliced
    // With n=5 from history (100 messages) + 1 current = 6 messages total
    assert.equal(
      provider.lastMessages.length,
      6,
      'Should have exactly 6 messages (5 from history + 1 current)'
    );

    // Verify the current message is included
    assert.equal(
      provider.lastMessages[5]?.content,
      'Current user message - this should always be included.',
      'Current message should be the last message'
    );

    // Verify we got the last 5 history messages (indices 95-99 from original)
    // The last history messages were at index 99 (assistant) and 98 (user), etc.
    const historyMessages = provider.lastMessages.slice(0, 5);
    assert.equal(
      historyMessages[4]?.role,
      'assistant',
      'Message at index 4 should be assistant (last from history)'
    );
    assert.ok(
      historyMessages[4]?.content.includes('response 50'),
      'Should be the 50th assistant response'
    );
  });

  it('context policy "all" preserves all messages and full kernel', () => {
    const provider = new MockProvider();

    // Simple constraint
    const { traits, features } = strategy.resolveWithFeatures('creative', {});
    const constraint = composer.compose([
      { name: 'creative', params: {}, traits, features },
    ], strategy.interactions);

    const config = provider.project(constraint, 'mock-model');
    const originalKernelLength = config.kernel.length;

    // Create 20 messages
    const messages: Message[] = [];
    for (let i = 0; i < 10; i++) {
      messages.push({ role: 'user', content: `Message ${i + 1}` });
      messages.push({ role: 'assistant', content: `Response ${i + 1}` });
    }

    // Context policy: all
    const configWithAll: ProjectedConfig = {
      ...config,
      contextPolicy: { type: 'all' },
    };

    provider.send(configWithAll, messages);

    // Kernel unchanged
    assert.equal(provider.lastSystemPrompt.length, originalKernelLength);

    // All messages preserved
    assert.equal(provider.lastMessages.length, 20);
  });

  it('context policy "none" removes all history but preserves kernel and current message', () => {
    const provider = new MockProvider();

    const { traits, features } = strategy.resolveWithFeatures('formal', {});
    const constraint = composer.compose([
      { name: 'formal', params: {}, traits, features },
    ], strategy.interactions);

    const config = provider.project(constraint, 'mock-model');

    // Create messages
    const messages: Message[] = [
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' },
      { role: 'assistant', content: 'Second response' },
      { role: 'user', content: 'Current message' }, // Current
    ];

    // Context policy: none
    const configWithNone: ProjectedConfig = {
      ...config,
      contextPolicy: { type: 'none' },
    };

    provider.send(configWithNone, messages);

    // Kernel should be unchanged
    assert.ok(
      provider.lastSystemPrompt.length > 0,
      'Kernel should not be empty'
    );

    // Only current message should remain (history is empty)
    assert.equal(
      provider.lastMessages.length,
      1,
      'Should have only the current message'
    );
    assert.equal(
      provider.lastMessages[0]?.content,
      'Current message',
      'Should be the current message'
    );
  });

  it('kernel content is complete regardless of message count', () => {
    const provider = new MockProvider();

    // Use a complex constraint combination that generates substantial kernel
    const analytical = strategy.resolveWithFeatures('analytical', {});
    const precise = strategy.resolveWithFeatures('precise', {});

    const constraint = composer.compose([
      { name: 'analytical', params: {}, traits: analytical.traits, features: analytical.features },
      { name: 'precise', params: {}, traits: precise.traits, features: precise.features },
    ], strategy.interactions);

    const config = provider.project(constraint, 'mock-model');

    // The kernel should contain meaningful behavioral instructions
    assert.ok(config.kernel.includes('<behavioral_constraints>'), 'Should have XML structure');
    assert.ok(config.kernel.includes('</behavioral_constraints>'), 'Should have closing tag');

    // Count constraints in kernel
    const constraintMatches = config.kernel.match(/<constraint/g);
    assert.ok(
      constraintMatches && constraintMatches.length > 0,
      'Kernel should contain at least one constraint'
    );

    // Send with tiny context window but kernel should be unchanged
    const configWithTinyContext: ProjectedConfig = {
      ...config,
      contextPolicy: { type: 'last', n: 1 },
    };

    // Create many messages
    const messages: Message[] = [];
    for (let i = 0; i < 200; i++) {
      messages.push({ role: 'user', content: `Long message ${i}` });
    }
    messages.push({ role: 'user', content: 'Current' });

    provider.send(configWithTinyContext, messages);

    // Kernel is FULLY preserved
    assert.equal(
      provider.lastSystemPrompt,
      config.kernel,
      'Kernel must be identical regardless of message count'
    );

    // But messages are heavily filtered
    assert.equal(
      provider.lastMessages.length,
      2,
      'Should have 2 messages (1 from history + current)'
    );
  });
});
