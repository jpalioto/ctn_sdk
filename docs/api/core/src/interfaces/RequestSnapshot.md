[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / RequestSnapshot

# Interface: RequestSnapshot

Defined in: [packages/core/src/provider/types.ts:132](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L132)

Snapshot of a request for debugging and audit.

Captures the complete state of a request before it's sent to the provider.
Useful for logging, debugging, and compliance.

## Properties

### config

> `readonly` **config**: [`ProjectedConfig`](ProjectedConfig.md)

Defined in: [packages/core/src/provider/types.ts:138](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L138)

Projected configuration

***

### finalParams

> `readonly` **finalParams**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/provider/types.ts:146](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L146)

Final API parameters after all overrides

***

### messages

> `readonly` **messages**: readonly [`Message`](Message.md)[]

Defined in: [packages/core/src/provider/types.ts:142](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L142)

Messages being sent

***

### model

> `readonly` **model**: `string`

Defined in: [packages/core/src/provider/types.ts:136](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L136)

Model being used

***

### systemPrompt

> `readonly` **systemPrompt**: `string`

Defined in: [packages/core/src/provider/types.ts:144](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L144)

Final system prompt (kernel + prefix)

***

### timestamp

> `readonly` **timestamp**: `Date`

Defined in: [packages/core/src/provider/types.ts:134](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L134)

Timestamp of the request

***

### tokenBudget

> `readonly` **tokenBudget**: [`TokenBudget`](TokenBudget.md)

Defined in: [packages/core/src/provider/types.ts:140](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L140)

Token budget calculation
