[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / estimateTokens

# Function: estimateTokens()

> **estimateTokens**(`text`): `number`

Defined in: [packages/core/src/provider/context.ts:45](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/context.ts#L45)

Estimates token count for text.

Note: This is a rough estimate. Production implementations should
use the actual tokenizer for the target model.

## Parameters

### text

Text or message to estimate

`string` | [`Message`](../interfaces/Message.md) | readonly [`Message`](../interfaces/Message.md)[]

## Returns

`number`

Estimated token count
