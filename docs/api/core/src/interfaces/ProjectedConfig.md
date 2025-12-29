[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectedConfig

# Interface: ProjectedConfig

Defined in: [packages/core/src/provider/types.ts:42](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L42)

Configuration after projection, ready for API call.

## Properties

### apiParams

> `readonly` **apiParams**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider/types.ts:44](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L44)

***

### contextPolicy

> `readonly` **contextPolicy**: `Readonly`\<\{ `type`: `"all"`; \}\> \| `Readonly`\<\{ `type`: `"none"`; \}\> \| `Readonly`\<\{ `n`: `number`; `type`: `"last"`; \}\>

Defined in: [packages/core/src/provider/types.ts:48](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L48)

***

### features

> `readonly` **features**: `Features`

Defined in: [packages/core/src/provider/types.ts:49](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L49)

***

### kernel

> `readonly` **kernel**: `string`

Defined in: [packages/core/src/provider/types.ts:46](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L46)

***

### kernelIR

> `readonly` **kernelIR**: `KernelIR`

Defined in: [packages/core/src/provider/types.ts:47](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L47)

***

### model

> `readonly` **model**: `string`

Defined in: [packages/core/src/provider/types.ts:43](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L43)

***

### projectionDetails

> `readonly` **projectionDetails**: `Record`\<`string`, [`ProjectionDetail`](ProjectionDetail.md)\>

Defined in: [packages/core/src/provider/types.ts:45](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L45)
