export interface GroundingPacket {
  readonly content: string;
  readonly source: string;
  readonly timestamp: number;
}

export interface ContentCodec {
  transform(): TransformStream<Uint8Array, string>;
}

export abstract class BaseDataProvider {
  abstract readonly uri: string;
  abstract getByteStream(): Promise<ReadableStream<Uint8Array>>;
}
