import type { ContextPolicy, Features } from '@ctn/language';
import type { Message, ModelConfig, TokenBudget } from './types.js';

/**
 * Resolves context policy from features.
 */
export function resolveContextPolicy(features: Features): ContextPolicy {
  if ('context' in features && features.context) {
    return features.context as ContextPolicy;
  }
  return { type: 'all' };
}

/**
 * Applies context policy to message history.
 *
 * @param messages - All messages except the current one
 * @param policy - The context policy to apply
 * @returns Filtered messages according to policy
 */
export function applyContextPolicy(
  messages: readonly Message[],
  policy: ContextPolicy
): readonly Message[] {
  switch (policy.type) {
    case 'none':
      return [];
    case 'last':
      return messages.slice(-policy.n);
    case 'all':
    default:
      return messages;
  }
}

/**
 * Estimates token count for text.
 *
 * Note: This is a rough estimate. Production implementations should
 * use the actual tokenizer for the target model.
 *
 * @param text - Text or message to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string | Message | readonly Message[]): number {
  if (typeof text === 'string') {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  if (Array.isArray(text)) {
    return text.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }

  return estimateTokens(text.content);
}

/**
 * Calculates token budget for a request.
 *
 * @param systemPrompt - The full system prompt (kernel + prefix)
 * @param messages - All messages including current
 * @param model - Model configuration
 * @param reservedOutput - Reserved tokens for output (from features or default)
 * @returns Token budget with availability calculation
 */
export function calculateTokenBudget(
  systemPrompt: string,
  messages: readonly Message[],
  model: ModelConfig,
  reservedOutput?: number
): TokenBudget {
  const systemTokens = estimateTokens(systemPrompt);
  const history = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const historyTokens = estimateTokens(history);
  const currentMessageTokens = currentMessage ? estimateTokens(currentMessage) : 0;
  const reserved = reservedOutput ?? model.defaultMaxTokens;

  const used = systemTokens + historyTokens + currentMessageTokens + reserved;
  const available = model.contextWindow - used;

  return {
    modelLimit: model.contextWindow,
    systemTokens,
    historyTokens,
    currentMessageTokens,
    reservedOutput: reserved,
    available,
    overBudget: available < 0,
  };
}
