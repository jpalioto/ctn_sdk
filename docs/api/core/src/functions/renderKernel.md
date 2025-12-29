[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / renderKernel

# Function: renderKernel()

> **renderKernel**\<`S`\>(`strategy`, `ir`, `preferences`): `string`

Defined in: [packages/core/src/renderer/negotiate.ts:50](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/renderer/negotiate.ts#L50)

Renders a kernel IR using the first compatible renderer from the preference list.

Iterates through the provider's renderer preferences in order.
Returns the result from the first preference that returns non-null.
Throws if no preference returns a result.

## Type Parameters

### S

`S` *extends* `object`

The strategy type

## Parameters

### strategy

`S`

The strategy that may implement rendering capabilities

### ir

`KernelIR`

The kernel IR to render

### preferences

readonly [`RendererQuery`](../type-aliases/RendererQuery.md)\<`S`\>[]

Ordered list of renderer queries to try

## Returns

`string`

The rendered kernel string

## Throws

NoCompatibleRendererError if all preferences return null
