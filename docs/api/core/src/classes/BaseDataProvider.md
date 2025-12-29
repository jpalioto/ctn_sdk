[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / BaseDataProvider

# Abstract Class: BaseDataProvider

Defined in: [packages/core/src/grounding/types.ts:11](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/types.ts#L11)

## Extended by

- [`WebsiteProvider`](WebsiteProvider.md)

## Constructors

### Constructor

> **new BaseDataProvider**(): `BaseDataProvider`

#### Returns

`BaseDataProvider`

## Properties

### uri

> `abstract` `readonly` **uri**: `string`

Defined in: [packages/core/src/grounding/types.ts:12](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/types.ts#L12)

## Methods

### getByteStream()

> `abstract` **getByteStream**(): `Promise`\<`ReadableStream`\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Defined in: [packages/core/src/grounding/types.ts:13](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/types.ts#L13)

#### Returns

`Promise`\<`ReadableStream`\<`Uint8Array`\<`ArrayBufferLike`\>\>\>
