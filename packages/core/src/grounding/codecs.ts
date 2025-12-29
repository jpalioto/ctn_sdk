import type { ContentCodec } from './types.js';

export class PlainTextCodec implements ContentCodec {
  transform(): TransformStream<Uint8Array, string> {
    return new TextDecoderStream();
  }
}
