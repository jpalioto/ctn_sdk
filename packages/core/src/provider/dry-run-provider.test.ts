import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { DryRunProvider } from './dry-run-provider.js';
import type { ProjectedConfig, Message } from './types.js';
import type { KernelIR, ContextPolicy, Features } from '@ctn/language';

describe('DryRunProvider', () => {
  // Helper to create a minimal valid ProjectedConfig
  function createConfig(overrides: Partial<ProjectedConfig> = {}): ProjectedConfig {
    const defaultKernelIR: KernelIR = {
      strategyName: 'operational',
      strategyVersion: '1.0.0',
      clauses: [],
      omittedTraits: [],
      modifiedClauses: [],
    };

    const defaultContextPolicy: ContextPolicy = { type: 'all' };

    return {
      model: 'test-model',
      apiParams: { temperature: 0.7 },
      projectionDetails: {},
      kernel: 'You are a helpful assistant.',
      kernelIR: defaultKernelIR,
      contextPolicy: defaultContextPolicy,
      features: {} as Features,
      ...overrides,
    };
  }

  describe('send', () => {
    it('returns response with dryRun=true', async () => {
      const provider = new DryRunProvider('anthropic');
      const config = createConfig();
      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      const response = await provider.send(config, messages);

      assert.strictEqual(response.dryRun, true);
      assert.strictEqual(response.id, 'dry-run');
      assert.strictEqual(response.finishReason, 'stop');
    });

    it('returns zero token usage', async () => {
      const provider = new DryRunProvider('anthropic');
      const config = createConfig();
      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      const response = await provider.send(config, messages);

      assert.strictEqual(response.usage.inputTokens, 0);
      assert.strictEqual(response.usage.outputTokens, 0);
    });

    it('captures request with correct structure', async () => {
      const provider = new DryRunProvider('anthropic');
      const config = createConfig({
        model: 'claude-4-opus',
        kernel: 'Be analytical.',
        apiParams: { temperature: 0.3, top_k: 40 },
      });
      const messages: Message[] = [{ role: 'user', content: 'Analyze this.' }];

      const response = await provider.send(config, messages);

      assert.ok(response.request, 'request should be defined');
      assert.strictEqual(response.request.systemPrompt, 'Be analytical.');
      assert.deepStrictEqual(response.request.messages, messages);
      assert.deepStrictEqual(response.request.parameters, { temperature: 0.3, top_k: 40 });
      assert.strictEqual(response.request.model, 'claude-4-opus');
      assert.strictEqual(response.request.provider, 'anthropic');
    });

    it('includes request as JSON in content', async () => {
      const provider = new DryRunProvider('openai');
      const config = createConfig({ model: 'gpt-5-mini' });
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const response = await provider.send(config, messages);

      const parsed = JSON.parse(response.content);
      assert.strictEqual(parsed.model, 'gpt-5-mini');
      assert.strictEqual(parsed.provider, 'openai');
    });

    it('uses target provider from constructor', async () => {
      const provider = new DryRunProvider('google');
      const config = createConfig();
      const messages: Message[] = [{ role: 'user', content: 'Hello' }];

      const response = await provider.send(config, messages);

      assert.ok(response.request);
      assert.strictEqual(response.request.provider, 'google');
    });
  });

  describe('sendStream', () => {
    it('yields request as text chunk', async () => {
      const provider = new DryRunProvider('anthropic');
      const config = createConfig();
      const messages: Message[] = [{ role: 'user', content: 'Stream test' }];

      const chunks = [];
      for await (const chunk of provider.sendStream(config, messages)) {
        chunks.push(chunk);
      }

      assert.strictEqual(chunks.length, 2);
      assert.strictEqual(chunks[0]!.type, 'text');
      assert.ok(chunks[0]!.text?.includes('Stream test'));
    });

    it('yields done chunk with zero usage', async () => {
      const provider = new DryRunProvider('anthropic');
      const config = createConfig();
      const messages: Message[] = [{ role: 'user', content: 'Test' }];

      const chunks = [];
      for await (const chunk of provider.sendStream(config, messages)) {
        chunks.push(chunk);
      }

      const doneChunk = chunks.find((c) => c.type === 'done');
      assert.ok(doneChunk);
      assert.strictEqual(doneChunk.usage?.inputTokens, 0);
      assert.strictEqual(doneChunk.usage?.outputTokens, 0);
    });
  });

  describe('supportsStrategy', () => {
    it('returns true for any strategy', () => {
      const provider = new DryRunProvider('anthropic');

      assert.strictEqual(provider.supportsStrategy('operational', '1.0.0'), true);
      assert.strictEqual(provider.supportsStrategy('ctn', '2.0.0'), true);
      assert.strictEqual(provider.supportsStrategy('custom', '0.1.0'), true);
    });
  });

  describe('project', () => {
    it('throws error indicating it should not be called', () => {
      const provider = new DryRunProvider('anthropic');

      assert.throws(() => {
        provider.project({}, 'model');
      }, /should not be called/);
    });
  });

  describe('properties', () => {
    it('has correct id and name', () => {
      const provider = new DryRunProvider('anthropic');

      assert.strictEqual(provider.id, 'dry-run');
      assert.strictEqual(provider.name, 'Dry Run');
    });

    it('has empty models array', () => {
      const provider = new DryRunProvider('anthropic');

      assert.deepStrictEqual(provider.models, []);
    });

    it('supports all strategy versions', () => {
      const provider = new DryRunProvider('anthropic');

      assert.strictEqual(provider.supportedStrategies.length, 2);
      assert.strictEqual(provider.supportedStrategies[0]!.versionRange, '*');
    });
  });
});

describe('DryRunProvider invariants', () => {
  it('produces identical output for same input regardless of call count', async () => {
    const provider = new DryRunProvider('anthropic');
    const config: ProjectedConfig = {
      model: 'test-model',
      apiParams: { temperature: 0.5 },
      projectionDetails: {},
      kernel: 'Test kernel',
      kernelIR: {
        strategyName: 'operational',
        strategyVersion: '1.0.0',
        clauses: [],
        omittedTraits: [],
        modifiedClauses: [],
      },
      contextPolicy: { type: 'all' },
      features: {} as Features,
    };
    const messages: Message[] = [{ role: 'user', content: 'Test message' }];

    const response1 = await provider.send(config, messages);
    const response2 = await provider.send(config, messages);

    // Everything should be identical except potentially timing-based fields
    assert.strictEqual(response1.content, response2.content);
    assert.deepStrictEqual(response1.request, response2.request);
    assert.strictEqual(response1.dryRun, response2.dryRun);
  });

  it('request structure matches what real provider would receive', async () => {
    const provider = new DryRunProvider('anthropic');
    const config: ProjectedConfig = {
      model: 'claude-4-opus',
      apiParams: { temperature: 0.7, top_k: 50 },
      projectionDetails: {},
      kernel: 'You are an analytical assistant.',
      kernelIR: {
        strategyName: 'operational',
        strategyVersion: '1.0.0',
        clauses: [],
        omittedTraits: [],
        modifiedClauses: [],
      },
      contextPolicy: { type: 'all' },
      features: {} as Features,
    };
    const messages: Message[] = [
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'Response' },
      { role: 'user', content: 'Follow-up' },
    ];

    const response = await provider.send(config, messages);

    // Verify all components are captured
    assert.ok(response.request);
    assert.strictEqual(response.request.systemPrompt, config.kernel);
    assert.strictEqual(response.request.model, config.model);
    assert.deepStrictEqual(response.request.parameters, config.apiParams);
    assert.deepStrictEqual(response.request.messages, messages);
  });
});
