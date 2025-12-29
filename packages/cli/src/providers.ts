import { AnthropicProvider } from '@ctn/anthropic';
import { GoogleProvider } from '@ctn/google';
import { OpenAIProvider } from '@ctn/openai';
import type { BaseCTNProvider } from '@ctn/core';

export type ProviderName = 'anthropic' | 'google' | 'openai';

export function getProvider(name: string): BaseCTNProvider {
  switch (name.toLowerCase()) {
    case 'openai':
    case 'gpt':
      return new OpenAIProvider();
    case 'google':
    case 'gemini':
      return new GoogleProvider();
    case 'anthropic':
    case 'claude':
    default:
      return new AnthropicProvider();
  }
}

export function listProviders(): ProviderName[] {
  return ['anthropic', 'google', 'openai'];
}

export function getDefaultModel(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'openai':
    case 'gpt':
      return 'gpt-5-mini';
    case 'google':
    case 'gemini':
      return 'gemini-2.5-flash';
    case 'anthropic':
    case 'claude':
    default:
      return 'sonnet';
  }
}
