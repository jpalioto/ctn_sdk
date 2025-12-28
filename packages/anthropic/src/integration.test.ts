import { describe, it, before } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy, Composer } from '@ctn/language';
import { AnthropicProvider } from './provider.js';

/**
 * Integration tests that make real API calls to Anthropic.
 *
 * These tests require ANTHROPIC_API_KEY to be set in the environment.
 * They are skipped if the API key is not present.
 */
describe('Anthropic Integration', { skip: !process.env.ANTHROPIC_API_KEY }, () => {
  let provider: AnthropicProvider;
  let strategy: OperationalStrategy;
  let composer: Composer<OperationalStrategy>;

  before(() => {
    provider = new AnthropicProvider();
    strategy = new OperationalStrategy();
    composer = new Composer(strategy);
  });

  it('sends @precise @terse request to claude-sonnet-latest and receives response', async () => {
    // Resolve constraints
    const precise = strategy.resolve('precise', {});
    const terse = strategy.resolve('terse', {});

    // Compose constraints
    const ir = composer.compose([
      { name: 'precise', params: {}, traits: precise, features: {} },
      { name: 'terse', params: {}, traits: terse, features: { max_tokens: 256 } },
    ]);

    // Project to Anthropic config
    const config = provider.project(ir, 'claude-sonnet-latest');

    // Verify projected config
    assert.ok(config.apiParams.temperature, 'should have temperature');
    assert.ok(config.kernel.includes('<behavioral_constraints>'), 'kernel should be XML');

    console.log('\n--- Projected Config ---');
    console.log('Model:', config.model);
    console.log('Temperature:', config.apiParams.temperature);
    console.log('Top K:', config.apiParams.top_k);
    console.log('Kernel:\n', config.kernel);

    // Send request
    const response = await provider.send(config, [
      { role: 'user', content: 'What is 2 + 2? Answer briefly.' },
    ]);

    // Verify response
    assert.ok(response.id, 'response should have id');
    assert.ok(response.model, 'response should have model');
    assert.ok(response.content, 'response should have content');
    assert.ok(response.content.length > 0, 'response content should not be empty');
    assert.equal(response.finishReason, 'stop', 'should finish normally');
    assert.ok(response.usage.inputTokens > 0, 'should have input tokens');
    assert.ok(response.usage.outputTokens > 0, 'should have output tokens');

    console.log('\n--- Response ---');
    console.log('ID:', response.id);
    console.log('Model:', response.model);
    console.log('Finish Reason:', response.finishReason);
    console.log('Usage:', response.usage);
    console.log('Content:', response.content);
  });

  it('streams @precise @terse request to claude-sonnet-latest', async () => {
    // Resolve and compose constraints
    const precise = strategy.resolve('precise', {});
    const terse = strategy.resolve('terse', {});

    const ir = composer.compose([
      { name: 'precise', params: {}, traits: precise, features: {} },
      { name: 'terse', params: {}, traits: terse, features: { max_tokens: 256 } },
    ]);

    const config = provider.project(ir, 'claude-sonnet-latest');

    // Stream request
    const chunks: string[] = [];
    let finalUsage: { inputTokens: number; outputTokens: number } | undefined;

    console.log('\n--- Streaming Response ---');
    process.stdout.write('Content: ');

    for await (const chunk of provider.sendStream(config, [
      { role: 'user', content: 'What is the capital of France? One word answer.' },
    ])) {
      if (chunk.type === 'text' && chunk.text) {
        chunks.push(chunk.text);
        process.stdout.write(chunk.text);
      } else if (chunk.type === 'done') {
        finalUsage = chunk.usage;
      } else if (chunk.type === 'error') {
        throw chunk.error;
      }
    }

    console.log('\nUsage:', finalUsage);

    // Verify streamed response
    const fullContent = chunks.join('');
    assert.ok(fullContent.length > 0, 'should have streamed content');
    assert.ok(finalUsage, 'should have final usage');
    assert.ok(finalUsage!.inputTokens > 0, 'should have input tokens');
    assert.ok(finalUsage!.outputTokens > 0, 'should have output tokens');
  });

  it('respects max_tokens from @terse constraint', async () => {
    const terse = strategy.resolve('terse', {});

    const ir = composer.compose([
      { name: 'terse', params: {}, traits: terse, features: { max_tokens: 50 } },
    ]);

    const config = provider.project(ir, 'claude-sonnet-latest');

    const response = await provider.send(config, [
      {
        role: 'user',
        content: 'Write a very long essay about the history of computing.',
      },
    ]);

    // With max_tokens: 50, the response should be truncated
    console.log('\n--- Max Tokens Test ---');
    console.log('Output tokens:', response.usage.outputTokens);
    console.log('Finish reason:', response.finishReason);
    console.log('Content length:', response.content.length);

    // Should hit the token limit
    assert.ok(
      response.usage.outputTokens <= 60, // Some buffer for tokenization differences
      `Output tokens (${response.usage.outputTokens}) should be close to max_tokens (50)`
    );
  });

  it('applies @analytical constraint for reasoning', async () => {
    const analytical = strategy.resolve('analytical', {});

    const ir = composer.compose([
      { name: 'analytical', params: {}, traits: analytical, features: { max_tokens: 512 } },
    ]);

    const config = provider.project(ir, 'claude-sonnet-latest');

    console.log('\n--- Analytical Constraint ---');
    console.log('Temperature:', config.apiParams.temperature);
    console.log('Kernel:\n', config.kernel);

    // Analytical should lower temperature for more deterministic reasoning
    assert.ok(
      (config.apiParams.temperature as number) < 1.0,
      'analytical should lower temperature'
    );

    const response = await provider.send(config, [
      { role: 'user', content: 'What is 15% of 80? Show your work.' },
    ]);

    console.log('Response:', response.content);

    assert.ok(response.content.length > 0, 'should have response');
    // The response should contain the answer (12)
    assert.ok(
      response.content.includes('12'),
      'response should contain correct answer'
    );
  });
});
