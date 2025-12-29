import { BaseDataProvider } from '../types.js';

export class WebsiteProvider extends BaseDataProvider {
  readonly uri: string;

  constructor(uri: string) {
    super();
    this.uri = uri;
  }

  async getByteStream(): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(this.uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.uri}: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error(`No response body from ${this.uri}`);
    }
    return response.body;
  }
}
