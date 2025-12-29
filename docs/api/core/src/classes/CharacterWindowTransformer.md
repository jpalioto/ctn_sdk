[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / CharacterWindowTransformer

# Class: CharacterWindowTransformer

Defined in: [packages/core/src/grounding/transformers.ts:1](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/transformers.ts#L1)

## Extends

- `TransformStream`\<`string`, `string`\>

## Constructors

### Constructor

> **new CharacterWindowTransformer**(`maxSize`, `overlap`): `CharacterWindowTransformer`

Defined in: [packages/core/src/grounding/transformers.ts:2](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/transformers.ts#L2)

#### Parameters

##### maxSize

`number`

##### overlap

`number`

#### Returns

`CharacterWindowTransformer`

#### Overrides

`TransformStream<string, string>.constructor`

## Properties

### readable

> `readonly` **readable**: `ReadableStream`\<`string`\>

Defined in: node\_modules/.pnpm/@types+node@25.0.3/node\_modules/@types/node/stream/web.d.ts:241

#### Inherited from

`TransformStream.readable`

***

### writable

> `readonly` **writable**: `WritableStream`\<`string`\>

Defined in: node\_modules/.pnpm/@types+node@25.0.3/node\_modules/@types/node/stream/web.d.ts:242

#### Inherited from

`TransformStream.writable`
