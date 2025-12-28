import type { ModelConfig } from '@ctn/core';

/**
 * Claude model configurations.
 *
 * These configurations reflect the current Anthropic model offerings
 * as of the SDK version.
 */
export const CLAUDE_MODELS: readonly ModelConfig[] = [
  // Claude 4 Series (Latest)
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    contextWindow: 200000,
    defaultMaxTokens: 16000,
    supportsThinking: true,
    supportsStreaming: true,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    defaultMaxTokens: 16000,
    supportsThinking: true,
    supportsStreaming: true,
  },

  // Claude 3.5 Series
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    defaultMaxTokens: 8192,
    supportsThinking: false,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    defaultMaxTokens: 8192,
    supportsThinking: false,
    supportsStreaming: true,
  },

  // Claude 3 Series
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextWindow: 200000,
    defaultMaxTokens: 4096,
    supportsThinking: false,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    contextWindow: 200000,
    defaultMaxTokens: 4096,
    supportsThinking: false,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextWindow: 200000,
    defaultMaxTokens: 4096,
    supportsThinking: false,
    supportsStreaming: true,
  },
] as const;

/**
 * Model ID aliases for convenience.
 */
export const MODEL_ALIASES: Record<string, string> = {
  // Latest aliases
  'claude-opus-4': 'claude-opus-4-20250514',
  'claude-sonnet-4': 'claude-sonnet-4-20250514',
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-sonnet': 'claude-3-sonnet-20240229',
  'claude-3-haiku': 'claude-3-haiku-20240307',

  // Short aliases
  'opus-4': 'claude-opus-4-20250514',
  'sonnet-4': 'claude-sonnet-4-20250514',
  'sonnet-3.5': 'claude-3-5-sonnet-20241022',
  'haiku-3.5': 'claude-3-5-haiku-20241022',
  opus: 'claude-opus-4-20250514',
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-3-5-haiku-20241022',
};

/**
 * Resolves a model ID or alias to the canonical model ID.
 */
export function resolveModelId(modelIdOrAlias: string): string {
  return MODEL_ALIASES[modelIdOrAlias] ?? modelIdOrAlias;
}

/**
 * Gets model configuration by ID or alias.
 */
export function getModelConfig(modelIdOrAlias: string): ModelConfig | undefined {
  const resolvedId = resolveModelId(modelIdOrAlias);
  return CLAUDE_MODELS.find((m) => m.id === resolvedId);
}
