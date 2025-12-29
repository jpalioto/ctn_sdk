[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / calculateTokenBudget

# Function: calculateTokenBudget()

> **calculateTokenBudget**(`systemPrompt`, `messages`, `model`, `reservedOutput?`): [`TokenBudget`](../interfaces/TokenBudget.md)

Defined in: [packages/core/src/provider/context.ts:67](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/context.ts#L67)

Calculates token budget for a request.

## Parameters

### systemPrompt

`string`

The full system prompt (kernel + prefix)

### messages

readonly [`Message`](../interfaces/Message.md)[]

All messages including current

### model

[`ModelConfig`](../interfaces/ModelConfig.md)

Model configuration

### reservedOutput?

`number`

Reserved tokens for output (from features or default)

## Returns

[`TokenBudget`](../interfaces/TokenBudget.md)

Token budget with availability calculation
