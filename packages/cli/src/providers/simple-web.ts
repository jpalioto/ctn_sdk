import { WebsiteProvider, PlainTextCodec, GroundingProvider } from '@ctn/core';

const MAX_GROUNDING_CHARS = 50000;

export class SimpleWebGroundingProvider {
  private readonly uri: string;

  constructor(uri: string) {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      throw new Error(`Unsupported URI scheme. Only http/https supported: ${uri}`);
    }
    this.uri = uri;
  }

  async fetch(): Promise<{ content: string; source: string; charCount: number; truncated: boolean }> {
    const source = new WebsiteProvider(this.uri);
    const codec = new PlainTextCodec();
    const provider = new GroundingProvider(source, codec);

    const stream = await provider.getGroundingStream();
    const reader = stream.getReader();
    let content = '';
    let truncated = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      content += value.content;

      // Enforce limit
      if (content.length >= MAX_GROUNDING_CHARS) {
        content = content.slice(0, MAX_GROUNDING_CHARS);
        truncated = true;
        await reader.cancel(); // Stop reading
        break;
      }
    }

    return {
      content,
      source: this.uri,
      charCount: content.length,
      truncated,
    };
  }
}
