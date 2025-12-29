import type { ContentCodec } from './types.js';

export class PlainTextCodec implements ContentCodec {
  transform(): TransformStream<Uint8Array, string> {
    const decoder = new TextDecoder();
    return new TransformStream<Uint8Array, string>({
      transform(chunk: Uint8Array, controller) {
        controller.enqueue(decoder.decode(chunk, { stream: true }));
      },
      flush(controller) {
        const final = decoder.decode();
        if (final) controller.enqueue(final);
      },
    });
  }
}
