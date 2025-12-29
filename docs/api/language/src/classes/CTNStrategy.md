[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / CTNStrategy

# Class: CTNStrategy

Defined in: [packages/language/src/strategy/ctn/strategy.ts:47](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L47)

The CTN strategy for structured cognitive control.

Implements a 7-dimensional trait space:
- v1: Atomic Clarity (sharp concept boundaries)
- v2: Specification Accuracy (smooth predictable reasoning)
- v3: Context Isolation (task-relevant focus)
- v4: Structure Over Narrative (global consistency)
- v5: Framing Detachment (rejects false premises)
- v6: Exploration (unbound search)
- v7: Schema Compliance (structured output)

## Implements

- [`TraitStrategy`](../interfaces/TraitStrategy.md)
- [`CtnCapable`](../interfaces/CtnCapable.md)

## Constructors

### Constructor

> **new CTNStrategy**(`config?`): `CTNStrategy`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:57](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L57)

#### Parameters

##### config?

[`CTNStrategyConfig`](../interfaces/CTNStrategyConfig.md)

#### Returns

`CTNStrategy`

## Properties

### dimensions

> `readonly` **dimensions**: readonly `Readonly`\<\{ `description`: `string`; `id`: `string`; `index`: `number`; `label`: `string`; `poles`: `Readonly`\<\{ `negative`: `string`; `positive`: `string`; \}\>; \}\>[] = `CTN_DIMENSIONS`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:50](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L50)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`dimensions`](../interfaces/TraitStrategy.md#dimensions)

***

### interactions

> `readonly` **interactions**: readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[] = `CTN_INTERACTIONS`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:51](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L51)

Trait interactions for this strategy

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`interactions`](../interfaces/TraitStrategy.md#interactions)

***

### name

> `readonly` **name**: `"ctn"` = `'ctn'`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:48](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L48)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`name`](../interfaces/TraitStrategy.md#name)

***

### thresholds

> `readonly` **thresholds**: [`StrategyThresholds`](../type-aliases/StrategyThresholds.md)

Defined in: [packages/language/src/strategy/ctn/strategy.ts:52](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L52)

Configurable thresholds for kernel generation and interactions

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`thresholds`](../interfaces/TraitStrategy.md#thresholds)

***

### version

> `readonly` **version**: `"1.0.0"` = `'1.0.0'`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:49](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L49)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`version`](../interfaces/TraitStrategy.md#version)

## Methods

### add()

> **add**(`a`, `b`): readonly `number`[]

Defined in: [packages/language/src/strategy/ctn/strategy.ts:76](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L76)

Raw vector addition without normalization.

#### Parameters

##### a

readonly `number`[]

##### b

readonly `number`[]

#### Returns

readonly `number`[]

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`add`](../interfaces/TraitStrategy.md#add)

***

### formatVector()

> **formatVector**(`traits`): [`LabeledTraits`](../type-aliases/LabeledTraits.md)

Defined in: [packages/language/src/strategy/ctn/strategy.ts:138](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L138)

Formats a trait vector as labeled key-value pairs.

#### Parameters

##### traits

readonly `number`[]

#### Returns

[`LabeledTraits`](../type-aliases/LabeledTraits.md)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`formatVector`](../interfaces/TraitStrategy.md#formatvector)

***

### formatVectorCompact()

> **formatVectorCompact**(`traits`): `string`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:152](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L152)

Formats a trait vector as a compact string representation.

#### Parameters

##### traits

readonly `number`[]

#### Returns

`string`

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`formatVectorCompact`](../interfaces/TraitStrategy.md#formatvectorcompact)

***

### identity()

> **identity**(): readonly `number`[]

Defined in: [packages/language/src/strategy/ctn/strategy.ts:69](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L69)

Returns the identity element (zero vector).

#### Returns

readonly `number`[]

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`identity`](../interfaces/TraitStrategy.md#identity)

***

### renderCtn()

> **renderCtn**(`ir`): `string`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:180](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L180)

Renders KernelIR in CTN kernel schema format.
Implements CtnCapable.

#### Parameters

##### ir

[`KernelIR`](../type-aliases/KernelIR.md)

#### Returns

`string`

#### Implementation of

[`CtnCapable`](../interfaces/CtnCapable.md).[`renderCtn`](../interfaces/CtnCapable.md#renderctn)

***

### renderPlain()

> **renderPlain**(`ir`): `string`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:172](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L172)

Renders KernelIR as plain text.
Required by PlainCapable (base contract for all strategies).

#### Parameters

##### ir

[`KernelIR`](../type-aliases/KernelIR.md)

#### Returns

`string`

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`renderPlain`](../interfaces/TraitStrategy.md#renderplain)

***

### resolve()

> **resolve**(`name`, `params`): readonly `number`[]

Defined in: [packages/language/src/strategy/ctn/strategy.ts:94](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L94)

Resolves a constraint name and parameters to a trait vector.

#### Parameters

##### name

`string`

##### params

[`ConstraintParams`](../type-aliases/ConstraintParams.md)

#### Returns

readonly `number`[]

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`resolve`](../interfaces/TraitStrategy.md#resolve)

***

### resolveWithFeatures()

> **resolveWithFeatures**(`name`, `params`): `object`

Defined in: [packages/language/src/strategy/ctn/strategy.ts:112](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/ctn/strategy.ts#L112)

Resolves a constraint and returns both traits and features.

#### Parameters

##### name

`string`

##### params

[`ConstraintParams`](../type-aliases/ConstraintParams.md)

#### Returns

`object`

##### features

> **features**: [`Features`](../type-aliases/Features.md)

##### traits

> **traits**: readonly `number`[]

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`resolveWithFeatures`](../interfaces/TraitStrategy.md#resolvewithfeatures)
