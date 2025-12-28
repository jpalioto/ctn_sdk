import { describe, it, mock } from 'node:test';
import * as assert from 'node:assert/strict';

import { OperationalStrategy, Composer } from '@ctn/language';
import { projectTraits } from '@ctn/core';
import {
  AnthropicProvider,
  CLAUDE_MODELS,
  MODEL_ALIASES,
  resolveModelId,
  getModelConfig,
  OPERATIONAL_PROJECTION_MATRIX,
} from './index.js';

describe('Claude Model Configurations', () => {
  it('has all expected models', () => {
    const modelIds = CLAUDE_MODELS.map((m) => m.id);

    // Claude 4
    assert.ok(modelIds.includes('claude-opus-4-20250514'));
    assert.ok(modelIds.includes('claude-sonnet-4-20250514'));

    // Claude 3.5
    assert.ok(modelIds.includes('claude-3-5-sonnet-20241022'));
    assert.ok(modelIds.includes('claude-3-5-haiku-20241022'));

    // Claude 3
    assert.ok(modelIds.includes('claude-3-opus-20240229'));
    assert.ok(modelIds.includes('claude-3-sonnet-20240229'));
    assert.ok(modelIds.includes('claude-3-haiku-20240307'));
  });

  it('all models have required properties', () => {
    for (const model of CLAUDE_MODELS) {
      assert.ok(model.id, 'model should have id');
      assert.ok(model.name, 'model should have name');
      assert.ok(model.contextWindow > 0, 'contextWindow should be positive');
      assert.ok(model.defaultMaxTokens > 0, 'defaultMaxTokens should be positive');
      assert.ok(model.defaultMaxTokens <= model.contextWindow, 'defaultMaxTokens <= contextWindow');
    }
  });

  it('Claude 4 models support thinking', () => {
    const opus4 = CLAUDE_MODELS.find((m) => m.id === 'claude-opus-4-20250514');
    const sonnet4 = CLAUDE_MODELS.find((m) => m.id === 'claude-sonnet-4-20250514');

    assert.ok(opus4?.supportsThinking);
    assert.ok(sonnet4?.supportsThinking);
  });

  it('all models support streaming', () => {
    for (const model of CLAUDE_MODELS) {
      assert.ok(model.supportsStreaming, `${model.id} should support streaming`);
    }
  });
});

describe('Model ID Resolution', () => {
  it('resolves aliases to canonical IDs', () => {
    assert.equal(resolveModelId('opus'), 'claude-opus-4-20250514');
    assert.equal(resolveModelId('sonnet'), 'claude-sonnet-4-20250514');
    assert.equal(resolveModelId('haiku'), 'claude-3-5-haiku-20241022');
    assert.equal(resolveModelId('claude-opus-4'), 'claude-opus-4-20250514');
    assert.equal(resolveModelId('sonnet-3.5'), 'claude-3-5-sonnet-20241022');
  });

  it('returns canonical ID unchanged', () => {
    assert.equal(resolveModelId('claude-opus-4-20250514'), 'claude-opus-4-20250514');
    assert.equal(resolveModelId('claude-3-5-sonnet-20241022'), 'claude-3-5-sonnet-20241022');
  });

  it('returns unknown IDs unchanged', () => {
    assert.equal(resolveModelId('unknown-model'), 'unknown-model');
  });
});

describe('getModelConfig', () => {
  it('gets config by canonical ID', () => {
    const config = getModelConfig('claude-opus-4-20250514');
    assert.ok(config);
    assert.equal(config.name, 'Claude Opus 4');
  });

  it('gets config by alias', () => {
    const config = getModelConfig('opus');
    assert.ok(config);
    assert.equal(config.id, 'claude-opus-4-20250514');
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
    assert.ok(params.includes('top_p'));
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
      assert.equal(result.params.top_p, 0.95);
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

      // top_p should decrease
      assert.ok(
        result.params.top_p! < 0.95,
        `top_p ${result.params.top_p} should be < 0.95`
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
      assert.ok('top_p' in result.params);

      // All within bounds
      assert.ok(result.params.temperature! >= 0 && result.params.temperature! <= 1);
      assert.ok(result.params.top_k! >= 1 && result.params.top_k! <= 100);
      assert.ok(result.params.top_p! >= 0 && result.params.top_p! <= 1);
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

    const config = provider.project(ir, 'claude-sonnet-4');

    assert.equal(config.model, 'claude-sonnet-4');
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
    //   top_p: 0.95 + 0.15 * (0.3*-0.5 + -0.2*0.5) = 0.95 + 0.15*(-0.25) = 0.9125

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
    assert.ok(
      Math.abs(result.params.top_p! - 0.9125) < 0.001,
      `top_p ${result.params.top_p} should be ~0.9125`
    );
  });

  it('@analytical produces documented values', () => {
    // From projection.ts comments:
    // @analytical [0, 0, 0, 0, 0.8, 0, 0]:
    //   temperature: 1.0 + 0.5 * (-0.4*0.8) = 1.0 - 0.16 = 0.84
    //   top_k: 40 + 30 * (0.3*0.8) = 40 + 7.2 = 47.2
    //   top_p: 0.95 + 0.15 * (-0.2*0.8) = 0.95 - 0.024 = 0.926

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
    assert.ok(
      Math.abs(result.params.top_p! - 0.926) < 0.001,
      `top_p ${result.params.top_p} should be ~0.926`
    );
  });
});
