[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / RendererQuery

# Type Alias: RendererQuery()\<S\>

> **RendererQuery**\<`S`\> = (`strategy`, `ir`) => `string` \| `null`

Defined in: [packages/core/src/renderer/negotiate.ts:21](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/renderer/negotiate.ts#L21)

A renderer query function that attempts to render using a specific capability.

Returns the rendered string if the strategy supports this capability,
or null if the strategy doesn't support it.

## Type Parameters

### S

`S`

The strategy type

## Parameters

### strategy

`S`

### ir

`KernelIR`

## Returns

`string` \| `null`
