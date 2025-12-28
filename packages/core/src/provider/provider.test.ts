import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  OperationalStrategy,
  Composer,
  type AbstractConstraint,
  type KernelIR,
} from '@ctn/language';
import {
  BaseCTNProvider,
  XMLKernelRenderer,
  MarkdownKernelRenderer,
  PlainTextKernelRenderer,
  UnsupportedStrategyError,
  StrategyVersionMismatchError,
  InvalidProjectionMatrixError,
  ProviderModelError,
  resolveContextPolicy,
  applyContextPolicy,
  estimateTokens,
  calculateTokenBudget,
  type Message,
  type ModelConfig,
  type StrategySupport,
  type ProjectedConfig,
  type SendOptions,
  type ProviderResponse,
  type StreamChunk,
  type KernelRenderer,
} from './index.js';
import type { ProjectionMatrix } from '../projection/index.js';

// Concrete test implementation of BaseCTNProvider
class TestProvider extends BaseCTNProvider {
  readonly id = 'test';
  readonly name = 'Test Provider';
  readonly models: readonly ModelConfig[] = [
    {
      id: 'test-model',
      name: 'Test Model',
      contextWindow: 8192,
      defaultMaxTokens: 1024,
    },
  ];
  readonly supportedStrategies: readonly StrategySupport[] = [
    { name: 'operational', versionRange: '1.x' },
  ];

  protected readonly kernelRenderer: KernelRenderer = new XMLKernelRenderer();

  constructor() {
    super();

    const strategy = new OperationalStrategy();
    this.registerProjection(strategy, {
      baseline: { temperature: 1.0, top_k: 50 },
      weights: {
        temperature: [0.6, 0, 0, 0, -0.4, -0.2, 0],
        top_k: [-0.5, 0, 0, 0, 0.3, 0.4, 0],
      },
      scale: { temperature: 0.6, top_k: 40 },
      clamps: { temperature: [0, 1], top_k: [1, 100] },
    });
  }

  async send(): Promise<ProviderResponse> {
    return {
      id: 'test-id',
      model: 'test-model',
      content: 'Test response',
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 5 },
    };
  }

  async *sendStream(): AsyncIterableIterator<StreamChunk> {
    yield { type: 'text', text: 'Test' };
    yield { type: 'text', text: ' response' };
    yield { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } };
  }
}

describe('BaseCTNProvider', () => {
  const strategy = new OperationalStrategy();
  const composer = new Composer(strategy);

  describe('supportsStrategy', () => {
    it('returns true for supported strategy', () => {
      const provider = new TestProvider();
      assert.ok(provider.supportsStrategy('operational', '1.0.0'));
    });

    it('returns true for compatible minor version', () => {
      const provider = new TestProvider();
      assert.ok(provider.supportsStrategy('operational', '1.2.3'));
    });

    it('returns false for unsupported strategy', () => {
      const provider = new TestProvider();
      assert.ok(!provider.supportsStrategy('unknown', '1.0.0'));
    });

    it('returns false for incompatible major version', () => {
      const provider = new TestProvider();
      assert.ok(!provider.supportsStrategy('operational', '2.0.0'));
    });
  });

  describe('project', () => {
    it('projects constraints to config', () => {
      const provider = new TestProvider();
      const precise = strategy.resolve('precise', {});
      const ir = composer.compose([{ name: 'precise', params: {}, traits: precise, features: {} }]);

      const config = provider.project(ir, 'test-model');

      assert.equal(config.model, 'test-model');
      assert.ok('temperature' in config.apiParams);
      assert.ok('top_k' in config.apiParams);
      assert.ok(config.kernel.includes('<behavioral_constraints>'));
    });

    it('throws for unsupported strategy', () => {
      const provider = new TestProvider();
      const fakeIr: AbstractConstraint = {
        strategy: {
          name: 'unknown',
          version: '1.0.0',
          dimensions: [],
          thresholds: { kernel: 0.3, interaction: 0.5 },
          identity: () => [],
          add: (a: number[]) => a,
          resolve: () => [],
          formatVector: () => ({}),
          formatVectorCompact: () => '',
        },
        traits: [0, 0, 0, 0, 0, 0, 0],
        features: {},
        kernelIR: {
          strategyName: 'unknown',
          strategyVersion: '1.0.0',
          clauses: [],
          omittedTraits: [],
          modifiedClauses: [],
        },
      };

      assert.throws(() => provider.project(fakeIr, 'test-model'), UnsupportedStrategyError);
    });

    it('throws for unsupported model', () => {
      const provider = new TestProvider();
      const precise = strategy.resolve('precise', {});
      const ir = composer.compose([{ name: 'precise', params: {}, traits: precise, features: {} }]);

      assert.throws(() => provider.project(ir, 'unknown-model'), ProviderModelError);
    });
  });

  describe('renderKernel', () => {
    it('renders kernel IR', () => {
      const provider = new TestProvider();
      const kernelIR: KernelIR = {
        strategyName: 'operational',
        strategyVersion: '1.0.0',
        clauses: [
          {
            traitId: 'v1',
            traitIndex: 0,
            polarity: 'negative',
            intensity: 'medium',
            text: 'deterministic, grounded responses',
          },
        ],
        omittedTraits: [],
        modifiedClauses: [],
      };

      const rendered = provider.renderKernel(kernelIR);
      assert.ok(rendered.includes('<behavioral_constraints>'));
      assert.ok(rendered.includes('deterministic, grounded responses'));
    });
  });

  describe('projection matrix validation', () => {
    it('throws on invalid matrix registration', () => {
      class BadProvider extends BaseCTNProvider {
        readonly id = 'bad';
        readonly name = 'Bad Provider';
        readonly models: readonly ModelConfig[] = [];
        readonly supportedStrategies: readonly StrategySupport[] = [];
        protected readonly kernelRenderer: KernelRenderer = new XMLKernelRenderer();

        constructor() {
          super();
          const strategy = new OperationalStrategy();
          // Invalid: baseline out of clamps
          this.registerProjection(strategy, {
            baseline: { temperature: 1.5 },
            weights: { temperature: [0.6, 0, 0, 0, 0, 0, 0] },
            scale: { temperature: 0.6 },
            clamps: { temperature: [0, 1] },
          });
        }

        async send(): Promise<ProviderResponse> {
          throw new Error('Not implemented');
        }
        async *sendStream(): AsyncIterableIterator<StreamChunk> {
          throw new Error('Not implemented');
        }
      }

      assert.throws(() => new BadProvider(), InvalidProjectionMatrixError);
    });
  });
});

describe('Kernel Renderers', () => {
  const kernelIR: KernelIR = {
    strategyName: 'operational',
    strategyVersion: '1.0.0',
    clauses: [
      {
        traitId: 'v1',
        traitIndex: 0,
        polarity: 'positive',
        intensity: 'high',
        text: 'creative, exploratory responses',
      },
      {
        traitId: 'v5',
        traitIndex: 4,
        polarity: 'positive',
        intensity: 'medium',
        text: 'step-by-step analytical reasoning',
      },
    ],
    omittedTraits: ['v2', 'v3', 'v4'],
    modifiedClauses: [
      {
        interactionId: 'test-interaction',
        replacedTraits: ['v6', 'v7'],
        text: 'Balance exploration with constraints',
      },
    ],
  };

  describe('XMLKernelRenderer', () => {
    it('renders with XML tags', () => {
      const renderer = new XMLKernelRenderer();
      const output = renderer.render(kernelIR);

      assert.ok(output.includes('<behavioral_constraints>'));
      assert.ok(output.includes('</behavioral_constraints>'));
      assert.ok(output.includes('<constraint id="v1">'));
      assert.ok(output.includes('Strongly favor creative'));
      assert.ok(output.includes('Moderately favor step-by-step'));
    });

    it('renders modified clauses', () => {
      const renderer = new XMLKernelRenderer();
      const output = renderer.render(kernelIR);

      assert.ok(output.includes('<constraint id="test-interaction">'));
      assert.ok(output.includes('Balance exploration with constraints'));
    });
  });

  describe('MarkdownKernelRenderer', () => {
    it('renders with Markdown format', () => {
      const renderer = new MarkdownKernelRenderer();
      const output = renderer.render(kernelIR);

      assert.ok(output.includes('## Behavioral Constraints'));
      assert.ok(output.includes('- **v1**:'));
      assert.ok(output.includes('Strongly favor creative'));
    });
  });

  describe('PlainTextKernelRenderer', () => {
    it('renders as plain text', () => {
      const renderer = new PlainTextKernelRenderer();
      const output = renderer.render(kernelIR);

      assert.ok(output.includes('Behavioral Constraints:'));
      assert.ok(output.includes('v1: Strongly favor creative'));
    });
  });
});

describe('Context Utilities', () => {
  describe('resolveContextPolicy', () => {
    it('returns all when no context in features', () => {
      const policy = resolveContextPolicy({});
      assert.deepEqual(policy, { type: 'all' });
    });

    it('returns context from features', () => {
      const policy = resolveContextPolicy({ context: { type: 'last', n: 5 } });
      assert.deepEqual(policy, { type: 'last', n: 5 });
    });
  });

  describe('applyContextPolicy', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
      { role: 'user', content: 'How are you?' },
      { role: 'assistant', content: 'I am fine.' },
    ];

    it('returns all messages for all policy', () => {
      const result = applyContextPolicy(messages, { type: 'all' });
      assert.equal(result.length, 4);
    });

    it('returns empty for none policy', () => {
      const result = applyContextPolicy(messages, { type: 'none' });
      assert.equal(result.length, 0);
    });

    it('returns last N messages for last policy', () => {
      const result = applyContextPolicy(messages, { type: 'last', n: 2 });
      assert.equal(result.length, 2);
      assert.equal(result[0]!.content, 'How are you?');
      assert.equal(result[1]!.content, 'I am fine.');
    });
  });

  describe('estimateTokens', () => {
    it('estimates tokens for string', () => {
      const tokens = estimateTokens('Hello, world!');
      assert.ok(tokens > 0);
      assert.ok(tokens < 10);
    });

    it('estimates tokens for message', () => {
      const tokens = estimateTokens({ role: 'user', content: 'Test message' });
      assert.ok(tokens > 0);
    });

    it('estimates tokens for message array', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ];
      const tokens = estimateTokens(messages);
      assert.ok(tokens > 0);
    });
  });

  describe('calculateTokenBudget', () => {
    const model: ModelConfig = {
      id: 'test',
      name: 'Test',
      contextWindow: 8192,
      defaultMaxTokens: 1024,
    };

    it('calculates budget correctly', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
        { role: 'user', content: 'Current message' },
      ];

      const budget = calculateTokenBudget('System prompt', messages, model);

      assert.equal(budget.modelLimit, 8192);
      assert.ok(budget.systemTokens > 0);
      assert.ok(budget.historyTokens > 0);
      assert.ok(budget.currentMessageTokens > 0);
      assert.equal(budget.reservedOutput, 1024);
      assert.ok(budget.available > 0);
      assert.ok(!budget.overBudget);
    });

    it('detects over budget', () => {
      const smallModel: ModelConfig = { ...model, contextWindow: 100 };
      const messages: Message[] = [
        { role: 'user', content: 'A very long message that exceeds the tiny context window' },
      ];

      const budget = calculateTokenBudget('System prompt', messages, smallModel);

      assert.ok(budget.overBudget);
      assert.ok(budget.available < 0);
    });
  });
});
