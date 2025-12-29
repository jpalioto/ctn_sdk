[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [google/src](../README.md) / GoogleProvider

# Class: GoogleProvider

Defined in: [packages/google/src/provider.ts:57](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L57)

CTN Provider implementation for Google Gemini models.

Supports:
- Gemini 3 Pro/Flash (preview)
- Gemini 2.5 Pro/Flash/Flash-Lite
- Gemini 2.0 Flash

Features:
- Markdown/CTN kernel rendering
- Operational and CTN strategy projection
- Streaming support

## Extends

- `BaseCTNProvider`

## Constructors

### Constructor

> **new GoogleProvider**(`options`): `GoogleProvider`

Defined in: [packages/google/src/provider.ts:75](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L75)

#### Parameters

##### options

[`GoogleProviderOptions`](../interfaces/GoogleProviderOptions.md) = `{}`

#### Returns

`GoogleProvider`

#### Overrides

`BaseCTNProvider.constructor`

## Properties

### id

> `readonly` **id**: `"google"` = `'google'`

Defined in: [packages/google/src/provider.ts:58](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L58)

#### Overrides

`BaseCTNProvider.id`

***

### name

> `readonly` **name**: `"Google"` = `'Google'`

Defined in: [packages/google/src/provider.ts:59](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L59)

#### Overrides

`BaseCTNProvider.name`

***

### projectionHashes

> `protected` `readonly` **projectionHashes**: `Map`\<`string`, `string`\>

Defined in: packages/core/dist/provider/base.d.ts:28

Cached projection hashes

#### Inherited from

`BaseCTNProvider.projectionHashes`

***

### projections

> `protected` `readonly` **projections**: `Map`\<`string`, `ProjectionMatrix`\>

Defined in: packages/core/dist/provider/base.d.ts:26

Registered projection matrices keyed by "strategyName@version"

#### Inherited from

`BaseCTNProvider.projections`

***

### supportedStrategies

> `readonly` **supportedStrategies**: readonly `StrategySupport`[]

Defined in: [packages/google/src/provider.ts:60](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L60)

#### Overrides

`BaseCTNProvider.supportedStrategies`

## Accessors

### models

#### Get Signature

> **get** **models**(): readonly `ModelConfig`[]

Defined in: [packages/google/src/provider.ts:68](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L68)

Available models.

##### Returns

readonly `ModelConfig`[]

#### Overrides

`BaseCTNProvider.models`

## Methods

### applyFeatureClamps()

> `protected` **applyFeatureClamps**(`projected`, `features`): `object`

Defined in: packages/core/dist/provider/base.d.ts:66

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

> **clampEvents**: `FeatureClampEvent`[]

#### Inherited from

`BaseCTNProvider.applyFeatureClamps`

***

### applyOverrides()

> `protected` **applyOverrides**(`params`, `overrides`): `object`

Defined in: packages/core/dist/provider/base.d.ts:81

Applies overrides to final parameters.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

##### overrides

`Record`\<`string`, `unknown`\>

#### Returns

`object`

##### collisions

> **collisions**: `OverrideCollision`[]

##### finalParams

> **finalParams**: `Record`\<`string`, `unknown`\>

#### Inherited from

`BaseCTNProvider.applyOverrides`

***

### findFeatureSource()

> `protected` **findFeatureSource**(`_key`, `_features`): `string`

Defined in: packages/core/dist/provider/base.d.ts:77

Finds the constraint source for a feature (for tracing).

#### Parameters

##### \_key

`string`

##### \_features

`Features`

#### Returns

`string`

#### Inherited from

`BaseCTNProvider.findFeatureSource`

***

### getFeatureLattice()

> `protected` **getFeatureLattice**(`key`, `features`): `"MIN"` \| `"MAX"` \| `"EXCLUSIVE"` \| `"UNION"`

Defined in: packages/core/dist/provider/base.d.ts:73

Gets the lattice type for a feature.

#### Parameters

##### key

`string`

##### features

`Features`

#### Returns

`"MIN"` \| `"MAX"` \| `"EXCLUSIVE"` \| `"UNION"`

#### Inherited from

`BaseCTNProvider.getFeatureLattice`

***

### getModel()

> `protected` **getModel**(`modelIdOrAlias`): `ModelConfig`

Defined in: [packages/google/src/provider.ts:100](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L100)

Gets a model configuration by ID or alias.

#### Parameters

##### modelIdOrAlias

`string`

#### Returns

`ModelConfig`

#### Overrides

`BaseCTNProvider.getModel`

***

### getProjection()

> `protected` **getProjection**(`strategyName`, `strategyVersion`): `ProjectionMatrix` \| `undefined`

Defined in: packages/core/dist/provider/base.d.ts:41

Gets the projection matrix for a strategy.

#### Parameters

##### strategyName

`string`

##### strategyVersion

`string`

#### Returns

`ProjectionMatrix` \| `undefined`

#### Inherited from

`BaseCTNProvider.getProjection`

***

### getProjectionHash()

> `protected` **getProjectionHash**(`strategyName`, `strategyVersion`): `string` \| `undefined`

Defined in: packages/core/dist/provider/base.d.ts:45

Gets the projection hash for a strategy.

#### Parameters

##### strategyName

`string`

##### strategyVersion

`string`

#### Returns

`string` \| `undefined`

#### Inherited from

`BaseCTNProvider.getProjectionHash`

***

### project()

> **project**(`ir`, `modelId`): `ProjectedConfig`

Defined in: [packages/google/src/provider.ts:119](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L119)

Projects an abstract constraint to provider-specific configuration.
Overrides base to use capability negotiation for kernel rendering.

#### Parameters

##### ir

`AbstractConstraint`

##### modelId

`string`

#### Returns

`ProjectedConfig`

#### Overrides

`BaseCTNProvider.project`

***

### registerProjection()

> `protected` **registerProjection**(`strategy`, `matrix`): `void`

Defined in: packages/core/dist/provider/base.d.ts:37

Registers a projection matrix for a strategy.
Uses Zod-based validation for type-safe matrix verification.

#### Parameters

##### strategy

`TraitStrategy`

The trait strategy

##### matrix

`ProjectionMatrix`

The projection matrix

#### Returns

`void`

#### Throws

InvalidProjectionMatrixError if matrix is invalid

#### Inherited from

`BaseCTNProvider.registerProjection`

***

### send()

> **send**(`config`, `messages`, `options`): `Promise`\<`ProviderResponse`\>

Defined in: [packages/google/src/provider.ts:159](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L159)

Sends a request to Gemini and returns the complete response.

#### Parameters

##### config

`ProjectedConfig`

##### messages

readonly `Message`[]

##### options

`SendOptions` = `{}`

#### Returns

`Promise`\<`ProviderResponse`\>

#### Overrides

`BaseCTNProvider.send`

***

### sendStream()

> **sendStream**(`config`, `messages`, `options`): `AsyncIterableIterator`\<`StreamChunk`\>

Defined in: [packages/google/src/provider.ts:235](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L235)

Sends a streaming request to Gemini.

#### Parameters

##### config

`ProjectedConfig`

##### messages

readonly `Message`[]

##### options

`SendOptions` = `{}`

#### Returns

`AsyncIterableIterator`\<`StreamChunk`\>

#### Overrides

`BaseCTNProvider.sendStream`

***

### supportsStrategy()

> **supportsStrategy**(`name`, `version`): `boolean`

Defined in: packages/core/dist/provider/base.d.ts:49

Checks if this provider supports a strategy version.

#### Parameters

##### name

`string`

##### version

`string`

#### Returns

`boolean`

#### Inherited from

`BaseCTNProvider.supportsStrategy`
