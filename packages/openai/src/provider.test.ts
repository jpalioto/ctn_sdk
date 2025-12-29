import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from './provider.js';
import { getOpenAIModels, resolveModelId, getModelConfig, DEFAULT_MODEL } from './models.js';
import { OPERATIONAL_PROJECTION_MATRIX, CTN_PROJECTION_MATRIX } from './projection.js';

describe('OpenAIProvider', () => {
  describe('model resolution', () => {
    it('resolves model aliases', () => {
      expect(resolveModelId('gpt')).toBe('gpt-5.2');
      expect(resolveModelId('gpt-mini')).toBe('gpt-5-mini');
      expect(resolveModelId('codex')).toBe('gpt-5.1-codex');
      expect(resolveModelId('5.2')).toBe('gpt-5.2');
      expect(resolveModelId('5.1')).toBe('gpt-5.1');
    });

    it('passes through unknown models', () => {
      expect(resolveModelId('custom-model')).toBe('custom-model');
    });

    it('has correct default model', () => {
      expect(DEFAULT_MODEL).toBe('gpt-5-mini');
    });

    it('lists available models', () => {
      const models = getOpenAIModels();
      expect(models).toContain('gpt-5.2');
      expect(models).toContain('gpt-5.2-pro');
      expect(models).toContain('gpt-5.1');
      expect(models).toContain('gpt-5.1-codex');
      expect(models).toContain('gpt-5-mini');
    });
  });

  describe('getModelConfig', () => {
    it('gets config by canonical ID', () => {
      const config = getModelConfig('gpt-5.2');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gpt-5.2');
      expect(config?.name).toBe('GPT-5.2');
      expect(config?.contextWindow).toBe(400000);
      expect(config?.defaultMaxTokens).toBe(128000);
    });

    it('gets config by alias', () => {
      const config = getModelConfig('gpt');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gpt-5.2');
    });

    it('gets gpt-5.2-pro config with thinking support', () => {
      const config = getModelConfig('gpt-5.2-pro');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gpt-5.2-pro');
      expect(config?.supportsThinking).toBe(true);
    });

    it('gets gpt-5-mini config', () => {
      const config = getModelConfig('gpt-5-mini');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gpt-5-mini');
      expect(config?.contextWindow).toBe(128000);
      expect(config?.defaultMaxTokens).toBe(32768);
    });

    it('returns undefined for unknown model', () => {
      const config = getModelConfig('unknown-model');
      expect(config).toBeUndefined();
    });
  });

  describe('constructor', () => {
    let originalKey: string | undefined;

    beforeEach(() => {
      originalKey = process.env.OPENAI_API_KEY;
    });

    afterEach(() => {
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('throws without API key', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAIProvider()).toThrow('API key required');
    });

    it('accepts API key in options', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAIProvider({ apiKey: 'test-key' })).not.toThrow();
    });

    it('uses environment variable', () => {
      process.env.OPENAI_API_KEY = 'env-test-key';
      expect(() => new OpenAIProvider()).not.toThrow();
    });
  });

  describe('supported strategies', () => {
    it('supports operational and ctn strategies', () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });

      expect(provider.supportedStrategies).toContainEqual(
        expect.objectContaining({ name: 'operational' })
      );
      expect(provider.supportedStrategies).toContainEqual(
        expect.objectContaining({ name: 'ctn' })
      );
    });
  });

  describe('models property', () => {
    it('returns list of model configs', () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const models = provider.models;

      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('contextWindow');
      expect(models[0]).toHaveProperty('defaultMaxTokens');
    });

    it('includes all GPT-5 models', () => {
      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const modelIds = provider.models.map((m) => m.id);

      expect(modelIds).toContain('gpt-5.2');
      expect(modelIds).toContain('gpt-5.2-pro');
      expect(modelIds).toContain('gpt-5.1');
      expect(modelIds).toContain('gpt-5.1-codex');
      expect(modelIds).toContain('gpt-5-mini');
    });
  });
});

describe('Projection Matrices', () => {
  describe('Operational Matrix', () => {
    it('has valid structure', () => {
      expect(OPERATIONAL_PROJECTION_MATRIX.baseline).toBeDefined();
      expect(OPERATIONAL_PROJECTION_MATRIX.weights).toBeDefined();
      expect(OPERATIONAL_PROJECTION_MATRIX.scale).toBeDefined();
      expect(OPERATIONAL_PROJECTION_MATRIX.clamps).toBeDefined();
    });

    it('has correct parameters', () => {
      expect(OPERATIONAL_PROJECTION_MATRIX.baseline.temperature).toBe(1.0);
      expect(OPERATIONAL_PROJECTION_MATRIX.baseline.top_p).toBe(1.0);
    });

    it('has 7-element weight arrays', () => {
      for (const weights of Object.values(OPERATIONAL_PROJECTION_MATRIX.weights)) {
        expect(weights).toHaveLength(7);
      }
    });

    it('has temperature clamp up to 2.0', () => {
      expect(OPERATIONAL_PROJECTION_MATRIX.clamps.temperature).toEqual([0.0, 2.0]);
    });
  });

  describe('CTN Matrix', () => {
    it('has valid structure', () => {
      expect(CTN_PROJECTION_MATRIX.baseline).toBeDefined();
      expect(CTN_PROJECTION_MATRIX.weights).toBeDefined();
      expect(CTN_PROJECTION_MATRIX.scale).toBeDefined();
      expect(CTN_PROJECTION_MATRIX.clamps).toBeDefined();
    });

    it('has 7-element weight arrays', () => {
      for (const weights of Object.values(CTN_PROJECTION_MATRIX.weights)) {
        expect(weights).toHaveLength(7);
      }
    });
  });
});
