import { describe, it, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy, Composer } from '@ctn/language';
import { projectTraits } from '@ctn/core';
import {
  AnthropicProvider,
  getClaudeModels,
  getModelAliases,
  resolveModelId,
  getModelConfig,
  OPERATIONAL_PROJECTION_MATRIX,
} from './index.js';

describe('Claude Model Configurations', () => {
  it('has all expected models', () => {
    const models = getClaudeModels();
    const modelIds = models.map((m) => m.id);

    // Claude 4.5 Series
    assert.ok(modelIds.includes('claude-sonnet-4-5-20250929'));
    assert.ok(modelIds.includes('claude-opus-4-5-20251101'));
    assert.ok(modelIds.includes('claude-haiku-4-5-20251001'));
  });

  it('all models have required properties', () => {
    const models = getClaudeModels();
    for (const model of models) {
      assert.ok(model.id, 'model should have id');
      assert.ok(model.name, 'model should have name');
      assert.ok(model.contextWindow > 0, 'contextWindow should be positive');
      assert.ok(model.defaultMaxTokens > 0, 'defaultMaxTokens should be positive');
      assert.ok(model.defaultMaxTokens <= model.contextWindow, 'defaultMaxTokens <= contextWindow');
    }
  });

  it('Claude 4.5 models with thinking capability are marked correctly', () => {
    const models = getClaudeModels();
    // Sonnet and Opus support thinking, Haiku doesn't
    const sonnet = models.find((m) => m.id.includes('sonnet'));
    const opus = models.find((m) => m.id.includes('opus'));
    const haiku = models.find((m) => m.id.includes('haiku'));

    assert.ok(sonnet?.supportsThinking, 'Sonnet should support thinking');
    assert.ok(opus?.supportsThinking, 'Opus should support thinking');
    assert.ok(!haiku?.supportsThinking, 'Haiku should not support thinking');
  });

  it('all models support streaming', () => {
    const models = getClaudeModels();
    for (const model of models) {
      assert.ok(model.supportsStreaming, `${model.id} should support streaming`);
    }
  });
});

describe('Model ID Resolution', () => {
  it('resolves aliases to canonical IDs', () => {
    assert.equal(resolveModelId('sonnet'), 'claude-sonnet-4-5-20250929');
    assert.equal(resolveModelId('opus'), 'claude-opus-4-5-20251101');
    assert.equal(resolveModelId('haiku'), 'claude-haiku-4-5-20251001');
    assert.equal(resolveModelId('claude-sonnet-latest'), 'claude-sonnet-4-5-20250929');
    assert.equal(resolveModelId('sonnet-4.5'), 'claude-sonnet-4-5-20250929');
  });

  it('returns canonical ID unchanged', () => {
    assert.equal(resolveModelId('claude-sonnet-4-5-20250929'), 'claude-sonnet-4-5-20250929');
    assert.equal(resolveModelId('claude-opus-4-5-20251101'), 'claude-opus-4-5-20251101');
  });

  it('returns unknown IDs unchanged', () => {
    assert.equal(resolveModelId('unknown-model'), 'unknown-model');
  });
});

describe('getModelConfig', () => {
  it('gets config by canonical ID', () => {
    const config = getModelConfig('claude-sonnet-4-5-20250929');
    assert.ok(config);
    assert.equal(config.name, 'Claude Sonnet 4.5');
  });

  it('gets config by alias', () => {
    const config = getModelConfig('sonnet');
    assert.ok(config);
    assert.equal(config.id, 'claude-sonnet-4-5-20250929');
  });

  it('returns undefined for unknown model', () => {
    const config = getModelConfig('unknown-model');
    assert.equal(config, undefined);
  });
});

describe('Operational Projection Matrix', () => {
  const strategy = new OperationalStrategy();

  it('has valid structure', () => {
    assert.ok(OPERATIONAL_PROJECTION_MATRIX.baseline);
    assert.ok(OPERATIONAL_PROJECTION_MATRIX.weights);
    assert.ok(OPERATIONAL_PROJECTION_MATRIX.scale);
    assert.ok(OPERATIONAL_PROJECTION_MATRIX.clamps);
  });

  it('has correct parameters', () => {
    const params = Object.keys(OPERATIONAL_PROJECTION_MATRIX.baseline);
    assert.ok(params.includes('temperature'));
    assert.ok(params.includes('top_k'));
    // Note: top_p removed - Claude 4.5 doesn't support temperature + top_p together
  });

  it('weight dimensions match strategy', () => {
    const dims = strategy.dimensions.length;

    for (const [param, weights] of Object.entries(OPERATIONAL_PROJECTION_MATRIX.weights)) {
      assert.equal(
        weights.length,
        dims,
        `${param} weights should have ${dims} dimensions`
      );
    }
  });

  it('baselines are within clamps', () => {
    for (const param of Object.keys(OPERATIONAL_PROJECTION_MATRIX.baseline)) {
      const baseline = OPERATIONAL_PROJECTION_MATRIX.baseline[param]!;
      const [lo, hi] = OPERATIONAL_PROJECTION_MATRIX.clamps[param]!;

      assert.ok(
        baseline >= lo && baseline <= hi,
        `${param} baseline ${baseline} should be within [${lo}, ${hi}]`
      );
    }
  });

  describe('projection results', () => {
    it('zero vector produces baseline', () => {
      const traits = [0, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

      assert.equal(result.params.temperature, 1.0);
      assert.equal(result.params.top_k, 40);
    });

    it('@precise trait vector lowers temperature', () => {
      // @precise: v1=-0.5, v5=+0.5
      const traits = [-0.5, 0, 0, 0, 0.5, 0, 0];
      const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

      // temperature should decrease (more deterministic)
      assert.ok(
        result.params.temperature! < 1.0,
        `temperature ${result.params.temperature} should be < 1.0`
      );

      // top_k should increase (more focused)
      assert.ok(
        result.params.top_k! > 40,
        `top_k ${result.params.top_k} should be > 40`
      );
    });

    it('@creative trait vector increases temperature', () => {
      // @creative: v1=+0.5
      const traits = [0.5, 0, 0, 0, 0, 0, 0];
      const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

      // temperature should increase (more creative), but clipped to 1.0
      assert.ok(
        result.params.temperature! >= 1.0 || result.details.temperature!.raw > 1.0,
        'temperature should trend higher'
      );

      // top_k should decrease (broader sampling)
      assert.ok(
        result.params.top_k! < 40,
        `top_k ${result.params.top_k} should be < 40`
      );
    });

    it('@analytical trait vector adjusts for reasoning', () => {
      // @analytical: v5=+0.8
      const traits = [0, 0, 0, 0, 0.8, 0, 0];
      const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

      // temperature should decrease
      assert.ok(
        result.params.temperature! < 1.0,
        `temperature ${result.params.temperature} should be < 1.0`
      );

      // top_k should increase
      assert.ok(
        result.params.top_k! > 40,
        `top_k ${result.params.top_k} should be > 40`
      );
    });

    it('@strict trait vector narrows sampling', () => {
      // @strict: v6=+0.5
      const traits = [0, 0, 0, 0, 0, 0.5, 0];
      const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

      // top_k should increase (more compliant = narrower)
      assert.ok(
        result.params.top_k! > 40,
        `top_k ${result.params.top_k} should be > 40`
      );

      // temperature should decrease (stricter = more deterministic)
      assert.ok(
        result.params.temperature! < 1.0,
        `temperature ${result.params.temperature} should be < 1.0`
      );
    });

    it('composed constraints project correctly', () => {
      const composer = new Composer(strategy);

      const precise = strategy.resolve('precise', {});
      const terse = strategy.resolve('terse', {});

      const ir = composer.compose([
        { name: 'precise', params: {}, traits: precise, features: {} },
        { name: 'terse', params: {}, traits: terse, features: { max_tokens: 256 } },
      ]);

      const result = projectTraits(ir.traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

      // Should have projected parameters
      assert.ok('temperature' in result.params);
      assert.ok('top_k' in result.params);

      // All within bounds
      assert.ok(result.params.temperature! >= 0 && result.params.temperature! <= 1);
      assert.ok(result.params.top_k! >= 1 && result.params.top_k! <= 100);
    });
  });
});

describe('AnthropicProvider', () => {
  // Note: These tests don't make actual API calls

  it('has correct provider metadata', () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' });

    assert.equal(provider.id, 'anthropic');
    assert.equal(provider.name, 'Anthropic');
    assert.ok(provider.models.length > 0);
  });

  it('supports operational strategy', () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' });

    assert.ok(provider.supportsStrategy('operational', '1.0.0'));
    assert.ok(provider.supportsStrategy('operational', '1.2.3'));
    assert.ok(!provider.supportsStrategy('operational', '2.0.0'));
    assert.ok(!provider.supportsStrategy('unknown', '1.0.0'));
  });

  it('projects constraints correctly', () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' });
    const strategy = new OperationalStrategy();
    const composer = new Composer(strategy);

    const precise = strategy.resolve('precise', {});
    const ir = composer.compose([
      { name: 'precise', params: {}, traits: precise, features: {} },
    ]);

    const config = provider.project(ir, 'claude-sonnet-latest');

    assert.equal(config.model, 'claude-sonnet-latest');
    assert.ok('temperature' in config.apiParams);
    assert.ok(config.kernel.includes('<behavioral_constraints>'));
  });

  it('renders kernel in XML format', () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' });
    const strategy = new OperationalStrategy();
    const composer = new Composer(strategy);

    const precise = strategy.resolve('precise', {});
    const ir = composer.compose([
      { name: 'precise', params: {}, traits: precise, features: {} },
    ]);

    const kernel = provider.renderKernel(ir.kernelIR);

    assert.ok(kernel.includes('<behavioral_constraints>'));
    assert.ok(kernel.includes('</behavioral_constraints>'));
    assert.ok(kernel.includes('<constraint'));
  });

  it('handles model aliases in projection', () => {
    const provider = new AnthropicProvider({ apiKey: 'test-key' });
    const strategy = new OperationalStrategy();
    const composer = new Composer(strategy);

    const ir = composer.compose([]);

    // Should work with alias
    const config = provider.project(ir, 'opus');
    assert.equal(config.model, 'opus');
  });
});

describe('Projection Math Verification', () => {
  const strategy = new OperationalStrategy();

  it('@precise produces documented values', () => {
    // From projection.ts comments:
    // @precise [-0.5, 0, 0, 0, 0.5, 0, 0]:
    //   temperature: 1.0 + 0.5 * (0.6*-0.5 + -0.4*0.5) = 1.0 + 0.5*(-0.5) = 0.75
    //   top_k: 40 + 30 * (-0.5*-0.5 + 0.3*0.5) = 40 + 30*(0.4) = 52

    const traits = [-0.5, 0, 0, 0, 0.5, 0, 0];
    const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

    assert.ok(
      Math.abs(result.params.temperature! - 0.75) < 0.001,
      `temperature ${result.params.temperature} should be ~0.75`
    );
    assert.ok(
      Math.abs(result.params.top_k! - 52) < 0.1,
      `top_k ${result.params.top_k} should be ~52`
    );
  });

  it('@analytical produces documented values', () => {
    // From projection.ts comments:
    // @analytical [0, 0, 0, 0, 0.8, 0, 0]:
    //   temperature: 1.0 + 0.5 * (-0.4*0.8) = 1.0 - 0.16 = 0.84
    //   top_k: 40 + 30 * (0.3*0.8) = 40 + 7.2 = 47.2

    const traits = [0, 0, 0, 0, 0.8, 0, 0];
    const result = projectTraits(traits, OPERATIONAL_PROJECTION_MATRIX, strategy);

    assert.ok(
      Math.abs(result.params.temperature! - 0.84) < 0.001,
      `temperature ${result.params.temperature} should be ~0.84`
    );
    assert.ok(
      Math.abs(result.params.top_k! - 47.2) < 0.1,
      `top_k ${result.params.top_k} should be ~47.2`
    );
  });
});
