[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / applyContextPolicy

# Function: applyContextPolicy()

> **applyContextPolicy**(`messages`, `policy`): readonly [`Message`](../interfaces/Message.md)[]

Defined in: [packages/core/src/provider/context.ts:21](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/context.ts#L21)

Applies context policy to message history.

## Parameters

### messages

readonly [`Message`](../interfaces/Message.md)[]

All messages except the current one

### policy

The context policy to apply

`Readonly`\<\{ `type`: `"all"`; \}\> | `Readonly`\<\{ `type`: `"none"`; \}\> | `Readonly`\<\{ `n`: `number`; `type`: `"last"`; \}\>

## Returns

readonly [`Message`](../interfaces/Message.md)[]

Filtered messages according to policy
