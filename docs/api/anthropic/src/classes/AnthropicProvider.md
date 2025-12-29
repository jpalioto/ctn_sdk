[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [anthropic/src](../README.md) / AnthropicProvider

# Class: AnthropicProvider

Defined in: [packages/anthropic/src/provider.ts:75](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L75)

CTN Provider implementation for Anthropic Claude models.

Supports:
- Claude 4 series (Opus 4, Sonnet 4)
- Claude 3.5 series (Sonnet, Haiku)
- Claude 3 series (Opus, Sonnet, Haiku)

Features:
- XML kernel rendering (optimized for Claude)
- Operational strategy projection
- Streaming support
- Extended thinking (Claude 4 models)

## Extends

- `BaseCTNProvider`

## Constructors

### Constructor

> **new AnthropicProvider**(`options`): `AnthropicProvider`

Defined in: [packages/anthropic/src/provider.ts:103](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L103)

#### Parameters

##### options

[`AnthropicProviderOptions`](../interfaces/AnthropicProviderOptions.md) = `{}`

#### Returns

`AnthropicProvider`

#### Overrides

`BaseCTNProvider.constructor`

## Properties

### id

> `readonly` **id**: `"anthropic"` = `'anthropic'`

Defined in: [packages/anthropic/src/provider.ts:76](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L76)

#### Overrides

`BaseCTNProvider.id`

***

### kernelRenderer

> `protected` `readonly` **kernelRenderer**: `object`

Defined in: [packages/anthropic/src/provider.ts:97](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L97)

Dummy kernelRenderer to satisfy abstract requirement.
Not used - project() is overridden to use capability negotiation.

#### render()

> **render**: () => `never`

##### Returns

`never`

***

### name

> `readonly` **name**: `"Anthropic"` = `'Anthropic'`

Defined in: [packages/anthropic/src/provider.ts:77](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L77)

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

Defined in: [packages/anthropic/src/provider.ts:78](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L78)

#### Overrides

`BaseCTNProvider.supportedStrategies`

## Accessors

### models

#### Get Signature

> **get** **models**(): readonly `ModelConfig`[]

Defined in: [packages/anthropic/src/provider.ts:86](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L86)

Models are loaded lazily from config/models.yaml

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

Defined in: [packages/anthropic/src/provider.ts:134](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L134)

Gets a model configuration by ID or alias.
Overrides base to support model aliases.

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

Defined in: [packages/anthropic/src/provider.ts:151](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L151)

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

Defined in: [packages/anthropic/src/provider.ts:197](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L197)

Sends a request to Claude and returns the complete response.

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

Defined in: [packages/anthropic/src/provider.ts:272](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L272)

Sends a streaming request to Claude.

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
