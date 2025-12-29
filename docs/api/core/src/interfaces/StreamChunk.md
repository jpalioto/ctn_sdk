[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / StreamChunk

# Interface: StreamChunk

Defined in: [packages/core/src/provider/types.ts:81](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L81)

Streaming chunk from a provider.

## Properties

### error?

> `readonly` `optional` **error**: `Error`

Defined in: [packages/core/src/provider/types.ts:84](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L84)

***

### text?

> `readonly` `optional` **text**: `string`

Defined in: [packages/core/src/provider/types.ts:83](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L83)

***

### type

> `readonly` **type**: `"error"` \| `"text"` \| `"done"`

Defined in: [packages/core/src/provider/types.ts:82](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L82)

***

### usage?

> `readonly` `optional` **usage**: `object`

Defined in: [packages/core/src/provider/types.ts:85](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L85)

#### inputTokens

> `readonly` **inputTokens**: `number`

#### outputTokens

> `readonly` **outputTokens**: `number`
