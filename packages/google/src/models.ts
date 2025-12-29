import type { ModelConfig } from '@ctn/core';

export interface GeminiModelConfig extends ModelConfig {
  maxOutput: number;
}

/**
 * Current Gemini models (December 2025).
 */
export const GEMINI_MODELS: Record<string, GeminiModelConfig> = {
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    contextWindow: 1048576,
    defaultMaxTokens: 8192,
    maxOutput: 8192,
    supportsStreaming: true,
  },
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    contextWindow: 1048576,
    defaultMaxTokens: 8192,
    maxOutput: 8192,
    supportsStreaming: true,
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    contextWindow: 1048576,
    defaultMaxTokens: 8192,
    maxOutput: 8192,
    supportsStreaming: true,
    supportsThinking: true,
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    defaultMaxTokens: 8192,
    maxOutput: 8192,
    supportsStreaming: true,
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    contextWindow: 1048576,
    defaultMaxTokens: 8192,
    maxOutput: 8192,
    supportsStreaming: true,
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    defaultMaxTokens: 8192,
    maxOutput: 8192,
    supportsStreaming: true,
  },
};

export const MODEL_ALIASES: Record<string, string> = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
  'flash-lite': 'gemini-2.5-flash-lite',
  'gemini-flash': 'gemini-2.5-flash',
  'gemini-pro': 'gemini-2.5-pro',
};

export function resolveModelId(model: string): string {
  return MODEL_ALIASES[model] ?? model;
}

export function getModelConfig(model: string): GeminiModelConfig | undefined {
  const resolved = resolveModelId(model);
  return GEMINI_MODELS[resolved];
}

export function getGeminiModels(): string[] {
  return Object.keys(GEMINI_MODELS);
}
