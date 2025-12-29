[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProviderResponse

# Interface: ProviderResponse

Defined in: [packages/core/src/provider/types.ts:67](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L67)

Response from a provider.

## Properties

### content

> `readonly` **content**: `string`

Defined in: [packages/core/src/provider/types.ts:70](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L70)

***

### finishReason

> `readonly` **finishReason**: `"error"` \| `"stop"` \| `"length"` \| `"content_filter"` \| `"tool_calls"`

Defined in: [packages/core/src/provider/types.ts:71](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L71)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/core/src/provider/types.ts:68](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L68)

***

### model

> `readonly` **model**: `string`

Defined in: [packages/core/src/provider/types.ts:69](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L69)

***

### usage

> `readonly` **usage**: `object`

Defined in: [packages/core/src/provider/types.ts:72](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L72)

#### inputTokens

> `readonly` **inputTokens**: `number`

#### outputTokens

> `readonly` **outputTokens**: `number`
