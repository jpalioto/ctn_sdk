import type { BaseDataProvider, ContentCodec, GroundingPacket } from './types.js';
import { CharacterWindowTransformer } from './transformers.js';

export class GroundingProvider {
  constructor(
    private readonly source: BaseDataProvider,
    private readonly codec: ContentCodec,
    private readonly windowSize: number = 8000,
    private readonly overlap: number = 200
  ) {}

  async getGroundingStream(): Promise<ReadableStream<GroundingPacket>> {
    const rawBytes = await this.source.getByteStream();
    const sourceUri = this.source.uri;

    return rawBytes
      .pipeThrough(this.codec.transform())
      .pipeThrough(new CharacterWindowTransformer(this.windowSize, this.overlap))
      .pipeThrough(
        new TransformStream<string, GroundingPacket>({
          transform(content, controller) {
            controller.enqueue({
              content,
              source: sourceUri,
              timestamp: Date.now(),
            });
          },
        })
      );
  }
}
