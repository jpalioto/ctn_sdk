[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / BaseCTNProvider

# Abstract Class: BaseCTNProvider

Defined in: [packages/core/src/provider/base.ts:55](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L55)

Abstract base implementation of CTNProvider.

Provides common functionality:
- Projection matrix registration and validation
- Strategy version checking
- Kernel rendering via strategy capabilities
- Feature clamping (post-projection)

Subclasses must implement:
- send: Actual API call
- sendStream: Streaming API call

Subclasses may override:
- project: To use custom renderer negotiation (recommended)

## Implements

- [`CTNProvider`](../interfaces/CTNProvider.md)

## Constructors

### Constructor

> **new BaseCTNProvider**(): `BaseCTNProvider`

#### Returns

`BaseCTNProvider`

## Properties

### id

> `abstract` `readonly` **id**: `string`

Defined in: [packages/core/src/provider/base.ts:56](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L56)

Unique provider identifier

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`id`](../interfaces/CTNProvider.md#id)

***

### models

> `abstract` `readonly` **models**: readonly [`ModelConfig`](../interfaces/ModelConfig.md)[]

Defined in: [packages/core/src/provider/base.ts:58](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L58)

Supported models

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`models`](../interfaces/CTNProvider.md#models)

***

### name

> `abstract` `readonly` **name**: `string`

Defined in: [packages/core/src/provider/base.ts:57](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L57)

Human-readable provider name

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`name`](../interfaces/CTNProvider.md#name)

***

### projectionHashes

> `protected` `readonly` **projectionHashes**: `Map`\<`string`, `string`\>

Defined in: [packages/core/src/provider/base.ts:65](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L65)

Cached projection hashes

***

### projections

> `protected` `readonly` **projections**: `Map`\<`string`, [`ProjectionMatrix`](../interfaces/ProjectionMatrix.md)\>

Defined in: [packages/core/src/provider/base.ts:62](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L62)

Registered projection matrices keyed by "strategyName@version"

***

### supportedStrategies

> `abstract` `readonly` **supportedStrategies**: readonly [`StrategySupport`](../interfaces/StrategySupport.md)[]

Defined in: [packages/core/src/provider/base.ts:59](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L59)

Supported strategies and version ranges

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`supportedStrategies`](../interfaces/CTNProvider.md#supportedstrategies)

## Methods

### applyFeatureClamps()

> `protected` **applyFeatureClamps**(`projected`, `features`): `object`

Defined in: [packages/core/src/provider/base.ts:195](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L195)

Applies feature clamps as post-projection constraints.

Features constrain projection output:
- MIN: final = min(projected, feature)
- MAX: final = max(projected, feature)
- EXCLUSIVE: final = feature (projection discarded)

#### Parameters

##### projected

`Record`\<`string`, `unknown`\>

##### features

`Features`

#### Returns

`object`

##### clampedParams

> **clampedParams**: `Record`\<`string`, `unknown`\>

##### clampEvents

> **clampEvents**: [`FeatureClampEvent`](../interfaces/FeatureClampEvent.md)[]

***

### applyOverrides()

> `protected` **applyOverrides**(`params`, `overrides`): `object`

Defined in: [packages/core/src/provider/base.ts:273](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L273)

Applies overrides to final parameters.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

##### overrides

`Record`\<`string`, `unknown`\>

#### Returns

`object`

##### collisions

> **collisions**: [`OverrideCollision`](../interfaces/OverrideCollision.md)[]

##### finalParams

> **finalParams**: `Record`\<`string`, `unknown`\>

***

### findFeatureSource()

> `protected` **findFeatureSource**(`_key`, `_features`): `string`

Defined in: [packages/core/src/provider/base.ts:265](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L265)

Finds the constraint source for a feature (for tracing).

#### Parameters

##### \_key

`string`

##### \_features

`Features`

#### Returns

`string`

***

### getFeatureLattice()

> `protected` **getFeatureLattice**(`key`, `features`): `"MIN"` \| `"MAX"` \| `"EXCLUSIVE"` \| `"UNION"`

Defined in: [packages/core/src/provider/base.ts:257](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L257)

Gets the lattice type for a feature.

#### Parameters

##### key

`string`

##### features

`Features`

#### Returns

`"MIN"` \| `"MAX"` \| `"EXCLUSIVE"` \| `"UNION"`

***

### getModel()

> `protected` **getModel**(`modelId`): [`ModelConfig`](../interfaces/ModelConfig.md)

Defined in: [packages/core/src/provider/base.ts:125](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L125)

Gets a model configuration by ID.

#### Parameters

##### modelId

`string`

#### Returns

[`ModelConfig`](../interfaces/ModelConfig.md)

***

### getProjection()

> `protected` **getProjection**(`strategyName`, `strategyVersion`): [`ProjectionMatrix`](../interfaces/ProjectionMatrix.md) \| `undefined`

Defined in: [packages/core/src/provider/base.ts:102](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L102)

Gets the projection matrix for a strategy.

#### Parameters

##### strategyName

`string`

##### strategyVersion

`string`

#### Returns

[`ProjectionMatrix`](../interfaces/ProjectionMatrix.md) \| `undefined`

***

### getProjectionHash()

> `protected` **getProjectionHash**(`strategyName`, `strategyVersion`): `string` \| `undefined`

Defined in: [packages/core/src/provider/base.ts:109](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L109)

Gets the projection hash for a strategy.

#### Parameters

##### strategyName

`string`

##### strategyVersion

`string`

#### Returns

`string` \| `undefined`

***

### project()

> **project**(`ir`, `modelId`): [`ProjectedConfig`](../interfaces/ProjectedConfig.md)

Defined in: [packages/core/src/provider/base.ts:140](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L140)

Projects an abstract constraint to provider-specific configuration.

#### Parameters

##### ir

`AbstractConstraint`

##### modelId

`string`

#### Returns

[`ProjectedConfig`](../interfaces/ProjectedConfig.md)

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`project`](../interfaces/CTNProvider.md#project)

***

### registerProjection()

> `protected` **registerProjection**(`strategy`, `matrix`): `void`

Defined in: [packages/core/src/provider/base.ts:75](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L75)

Registers a projection matrix for a strategy.
Uses Zod-based validation for type-safe matrix verification.

#### Parameters

##### strategy

`TraitStrategy`

The trait strategy

##### matrix

[`ProjectionMatrix`](../interfaces/ProjectionMatrix.md)

The projection matrix

#### Returns

`void`

#### Throws

InvalidProjectionMatrixError if matrix is invalid

***

### send()

> `abstract` **send**(`config`, `messages`, `options?`): `Promise`\<[`ProviderResponse`](../interfaces/ProviderResponse.md)\>

Defined in: [packages/core/src/provider/base.ts:302](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L302)

Sends a request to the provider.
Must be implemented by subclasses.

#### Parameters

##### config

[`ProjectedConfig`](../interfaces/ProjectedConfig.md)

##### messages

readonly [`Message`](../interfaces/Message.md)[]

##### options?

[`SendOptions`](../interfaces/SendOptions.md)

#### Returns

`Promise`\<[`ProviderResponse`](../interfaces/ProviderResponse.md)\>

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`send`](../interfaces/CTNProvider.md#send)

***

### sendStream()

> `abstract` **sendStream**(`config`, `messages`, `options?`): `AsyncIterableIterator`\<[`StreamChunk`](../interfaces/StreamChunk.md)\>

Defined in: [packages/core/src/provider/base.ts:312](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L312)

Sends a streaming request to the provider.
Must be implemented by subclasses.

#### Parameters

##### config

[`ProjectedConfig`](../interfaces/ProjectedConfig.md)

##### messages

readonly [`Message`](../interfaces/Message.md)[]

##### options?

[`SendOptions`](../interfaces/SendOptions.md)

#### Returns

`AsyncIterableIterator`\<[`StreamChunk`](../interfaces/StreamChunk.md)\>

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`sendStream`](../interfaces/CTNProvider.md#sendstream)

***

### supportsStrategy()

> **supportsStrategy**(`name`, `version`): `boolean`

Defined in: [packages/core/src/provider/base.ts:116](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/base.ts#L116)

Checks if this provider supports a strategy version.

#### Parameters

##### name

`string`

##### version

`string`

#### Returns

`boolean`

#### Implementation of

[`CTNProvider`](../interfaces/CTNProvider.md).[`supportsStrategy`](../interfaces/CTNProvider.md#supportsstrategy)
