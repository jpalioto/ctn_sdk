[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / SendOptions

# Interface: SendOptions

Defined in: [packages/core/src/provider/types.ts:55](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L55)

Options for send/sendStream operations.

## Properties

### overrides?

> `readonly` `optional` **overrides**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider/types.ts:57](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L57)

Manual parameter overrides (highest precedence)

***

### signal?

> `readonly` `optional` **signal**: `AbortSignal`

Defined in: [packages/core/src/provider/types.ts:61](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L61)

Abort signal for cancellation

***

### systemPrefix?

> `readonly` `optional` **systemPrefix**: `string`

Defined in: [packages/core/src/provider/types.ts:59](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L59)

System prompt prefix (prepended to kernel)
