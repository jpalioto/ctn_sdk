[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / WebsiteProvider

# Class: WebsiteProvider

Defined in: [packages/core/src/grounding/providers/website.ts:3](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/providers/website.ts#L3)

## Extends

- [`BaseDataProvider`](BaseDataProvider.md)

## Constructors

### Constructor

> **new WebsiteProvider**(`uri`): `WebsiteProvider`

Defined in: [packages/core/src/grounding/providers/website.ts:6](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/providers/website.ts#L6)

#### Parameters

##### uri

`string`

#### Returns

`WebsiteProvider`

#### Overrides

[`BaseDataProvider`](BaseDataProvider.md).[`constructor`](BaseDataProvider.md#constructor)

## Properties

### uri

> `readonly` **uri**: `string`

Defined in: [packages/core/src/grounding/providers/website.ts:4](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/providers/website.ts#L4)

#### Overrides

[`BaseDataProvider`](BaseDataProvider.md).[`uri`](BaseDataProvider.md#uri)

## Methods

### getByteStream()

> **getByteStream**(): `Promise`\<`ReadableStream`\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Defined in: [packages/core/src/grounding/providers/website.ts:11](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/providers/website.ts#L11)

#### Returns

`Promise`\<`ReadableStream`\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

#### Overrides

[`BaseDataProvider`](BaseDataProvider.md).[`getByteStream`](BaseDataProvider.md#getbytestream)
