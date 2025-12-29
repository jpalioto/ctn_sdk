import type { ModelConfig } from '@ctn/core';

export interface OpenAIModelConfig extends ModelConfig {
  maxOutput: number;
}

/**
 * Current OpenAI models (December 2025).
 * GPT-5 family using Responses API.
 */
export const OPENAI_MODELS: Record<string, OpenAIModelConfig> = {
  'gpt-5.2': {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    contextWindow: 400000,
    defaultMaxTokens: 128000,
    maxOutput: 128000,
    supportsStreaming: true,
  },
  'gpt-5.2-pro': {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    contextWindow: 400000,
    defaultMaxTokens: 128000,
    maxOutput: 128000,
    supportsStreaming: true,
    supportsThinking: true,
  },
  'gpt-5.1': {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    contextWindow: 256000,
    defaultMaxTokens: 65536,
    maxOutput: 65536,
    supportsStreaming: true,
  },
  'gpt-5.1-codex': {
    id: 'gpt-5.1-codex',
    name: 'GPT-5.1 Codex',
    contextWindow: 256000,
    defaultMaxTokens: 65536,
    maxOutput: 65536,
    supportsStreaming: true,
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    contextWindow: 128000,
    defaultMaxTokens: 32768,
    maxOutput: 32768,
    supportsStreaming: true,
  },
};

export const MODEL_ALIASES: Record<string, string> = {
  gpt: 'gpt-5.2',
  'gpt-mini': 'gpt-5-mini',
  codex: 'gpt-5.1-codex',
  '5.2': 'gpt-5.2',
  '5.1': 'gpt-5.1',
};

export const DEFAULT_MODEL = 'gpt-5-mini';

export function resolveModelId(model: string): string {
  return MODEL_ALIASES[model] ?? model;
}

export function getModelConfig(model: string): OpenAIModelConfig | undefined {
  const resolved = resolveModelId(model);
  return OPENAI_MODELS[resolved];
}

export function getOpenAIModels(): string[] {
  return Object.keys(OPENAI_MODELS);
}
