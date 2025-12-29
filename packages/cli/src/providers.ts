import { AnthropicProvider } from '@ctn/anthropic';
import { GoogleProvider } from '@ctn/google';
import type { BaseCTNProvider } from '@ctn/core';

export type ProviderName = 'anthropic' | 'google';

export function getProvider(name: string): BaseCTNProvider {
  switch (name.toLowerCase()) {
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
  return ['anthropic', 'google'];
}

export function getDefaultModel(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'google':
    case 'gemini':
      return 'gemini-2.5-flash';
    case 'anthropic':
    case 'claude':
    default:
      return 'sonnet';
  }
}
