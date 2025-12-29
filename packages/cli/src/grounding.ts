import { SimpleWebGroundingProvider } from './providers/simple-web.js';

export interface GroundingResult {
  content: string;
  source: string;
  charCount: number;
  truncated: boolean;
}

export async function fetchGrounding(uri: string): Promise<GroundingResult> {
  const provider = new SimpleWebGroundingProvider(uri);
  return provider.fetch();
}

export function formatGroundingContext(content: string, source: string): string {
  return `<context source="${source}">\n${content}\n</context>`;
}
