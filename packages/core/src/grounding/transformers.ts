export class CharacterWindowTransformer extends TransformStream<string, string> {
  constructor(maxSize: number, overlap: number) {
    let buffer = '';
    super({
      transform(chunk, controller) {
        buffer += chunk;
        while (buffer.length >= maxSize) {
          controller.enqueue(buffer.slice(0, maxSize));
          buffer = buffer.slice(maxSize - overlap);
        }
      },
      flush(controller) {
        if (buffer.length > 0) controller.enqueue(buffer);
      },
    });
  }
}
