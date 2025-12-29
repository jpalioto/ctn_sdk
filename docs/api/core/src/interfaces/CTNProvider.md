[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / CTNProvider

# Interface: CTNProvider

Defined in: [packages/core/src/provider/types.ts:157](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L157)

CTN Provider interface.

Providers are responsible for:
- Projection matrices mapping trait vectors to API parameters
- Kernel rendering for the target model
- API communication

## Properties

### id

> `readonly` **id**: `string`

Defined in: [packages/core/src/provider/types.ts:159](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L159)

Unique provider identifier

***

### models

> `readonly` **models**: readonly [`ModelConfig`](ModelConfig.md)[]

Defined in: [packages/core/src/provider/types.ts:163](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L163)

Supported models

***

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/provider/types.ts:161](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L161)

Human-readable provider name

***

### supportedStrategies

> `readonly` **supportedStrategies**: readonly [`StrategySupport`](StrategySupport.md)[]

Defined in: [packages/core/src/provider/types.ts:165](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L165)

Supported strategies and version ranges

## Methods

### project()

> **project**(`ir`, `model`): [`ProjectedConfig`](ProjectedConfig.md)

Defined in: [packages/core/src/provider/types.ts:176](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L176)

Projects an abstract constraint to provider-specific configuration.
Kernel rendering is handled internally via strategy capability negotiation.

#### Parameters

##### ir

`AbstractConstraint`

##### model

`string`

#### Returns

[`ProjectedConfig`](ProjectedConfig.md)

***

### send()

> **send**(`config`, `messages`, `options?`): `Promise`\<[`ProviderResponse`](ProviderResponse.md)\>

Defined in: [packages/core/src/provider/types.ts:181](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L181)

Sends a request to the provider.

#### Parameters

##### config

[`ProjectedConfig`](ProjectedConfig.md)

##### messages

readonly [`Message`](Message.md)[]

##### options?

[`SendOptions`](SendOptions.md)

#### Returns

`Promise`\<[`ProviderResponse`](ProviderResponse.md)\>

***

### sendStream()

> **sendStream**(`config`, `messages`, `options?`): `AsyncIterableIterator`\<[`StreamChunk`](StreamChunk.md)\>

Defined in: [packages/core/src/provider/types.ts:190](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L190)

Sends a streaming request to the provider.

#### Parameters

##### config

[`ProjectedConfig`](ProjectedConfig.md)

##### messages

readonly [`Message`](Message.md)[]

##### options?

[`SendOptions`](SendOptions.md)

#### Returns

`AsyncIterableIterator`\<[`StreamChunk`](StreamChunk.md)\>

***

### supportsStrategy()

> **supportsStrategy**(`name`, `version`): `boolean`

Defined in: [packages/core/src/provider/types.ts:170](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/types.ts#L170)

Checks if this provider supports a strategy version.

#### Parameters

##### name

`string`

##### version

`string`

#### Returns

`boolean`
