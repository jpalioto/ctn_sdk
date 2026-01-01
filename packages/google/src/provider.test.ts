import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GoogleProvider } from './provider.js';
import { getGeminiModels, resolveModelId, getModelConfig } from './models.js';
import { OPERATIONAL_PROJECTION_MATRIX, CTN_PROJECTION_MATRIX } from './projection.js';

describe('GoogleProvider', () => {
  describe('model resolution', () => {
    it('resolves model aliases', () => {
      expect(resolveModelId('flash')).toBe('gemini-2.5-flash');
      expect(resolveModelId('pro')).toBe('gemini-2.5-pro');
      expect(resolveModelId('flash-lite')).toBe('gemini-2.5-flash-lite');
      expect(resolveModelId('gemini-flash')).toBe('gemini-2.5-flash');
      expect(resolveModelId('gemini-pro')).toBe('gemini-2.5-pro');
    });

    it('passes through unknown models', () => {
      expect(resolveModelId('custom-model')).toBe('custom-model');
    });

    it('lists available models', () => {
      const models = getGeminiModels();
      expect(models).toContain('gemini-2.5-flash');
      expect(models).toContain('gemini-2.5-pro');
      expect(models).toContain('gemini-2.5-flash-lite');
      expect(models).toContain('gemini-2.0-flash');
      expect(models).toContain('gemini-3-pro-preview');
      expect(models).toContain('gemini-3-flash-preview');
    });
  });

  describe('getModelConfig', () => {
    it('gets config by canonical ID', () => {
      const config = getModelConfig('gemini-2.5-pro');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gemini-2.5-pro');
      expect(config?.name).toBe('Gemini 2.5 Pro');
      expect(config?.contextWindow).toBe(1048576);
      expect(config?.defaultMaxTokens).toBe(8192);
      expect(config?.supportsThinking).toBe(true);
    });

    it('gets config by alias', () => {
      const config = getModelConfig('pro');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gemini-2.5-pro');
    });

    it('gets flash config', () => {
      const config = getModelConfig('flash');
      expect(config).toBeDefined();
      expect(config?.id).toBe('gemini-2.5-flash');
      expect(config?.name).toBe('Gemini 2.5 Flash');
    });

    it('returns undefined for unknown model', () => {
      const config = getModelConfig('unknown-model');
      expect(config).toBeUndefined();
    });
  });

  describe('constructor', () => {
    let originalGeminiKey: string | undefined;
    let originalGoogleKey: string | undefined;

    beforeEach(() => {
      originalGeminiKey = process.env.GEMINI_API_KEY;
      originalGoogleKey = process.env.GOOGLE_API_KEY;
    });

    afterEach(() => {
      if (originalGeminiKey) {
        process.env.GEMINI_API_KEY = originalGeminiKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
      if (originalGoogleKey) {
        process.env.GOOGLE_API_KEY = originalGoogleKey;
      } else {
        delete process.env.GOOGLE_API_KEY;
      }
    });

    it('throws without API key', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      expect(() => new GoogleProvider()).toThrow('API key required');
    });

    it('accepts API key in options', () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      expect(() => new GoogleProvider({ apiKey: 'test-key' })).not.toThrow();
    });

    it('uses GEMINI_API_KEY environment variable', () => {
      delete process.env.GOOGLE_API_KEY;
      process.env.GEMINI_API_KEY = 'gemini-test-key';
      expect(() => new GoogleProvider()).not.toThrow();
    });

    it('falls back to GOOGLE_API_KEY environment variable', () => {
      delete process.env.GEMINI_API_KEY;
      process.env.GOOGLE_API_KEY = 'google-test-key';
      expect(() => new GoogleProvider()).not.toThrow();
    });
  });

  describe('supported strategies', () => {
    it('supports operational and ctn strategies', () => {
      const provider = new GoogleProvider({ apiKey: 'test-key' });

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
      const provider = new GoogleProvider({ apiKey: 'test-key' });
      const models = provider.models;

      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('contextWindow');
      expect(models[0]).toHaveProperty('defaultMaxTokens');
    });

    it('includes all current Gemini models', () => {
      const provider = new GoogleProvider({ apiKey: 'test-key' });
      const modelIds = provider.models.map((m) => m.id);

      expect(modelIds).toContain('gemini-2.5-flash');
      expect(modelIds).toContain('gemini-2.5-pro');
      expect(modelIds).toContain('gemini-3-pro-preview');
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
      expect(OPERATIONAL_PROJECTION_MATRIX.baseline.top_k).toBe(40);
      expect(OPERATIONAL_PROJECTION_MATRIX.baseline.top_p).toBe(0.95);
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

    it('has 9-element weight arrays (v1.0 spec)', () => {
      for (const weights of Object.values(CTN_PROJECTION_MATRIX.weights)) {
        expect(weights).toHaveLength(9);
      }
    });
  });
});
