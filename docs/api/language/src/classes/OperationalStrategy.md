[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / OperationalStrategy

# Class: OperationalStrategy

Defined in: [packages/language/src/strategy/operational/strategy.ts:47](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L47)

The Operational strategy for general-purpose behavioral control.

Implements a 7-dimensional trait space:
- v1: Stochasticity (creative ↔ deterministic)
- v2: Concision (brief ↔ detailed)
- v3: Agency (proactive ↔ reactive)
- v4: Formality (formal ↔ casual)
- v5: Reasoning (analytical ↔ intuitive)
- v6: Compliance (strict ↔ flexible)
- v7: Context Density (heavy ↔ minimal)

## Implements

- [`TraitStrategy`](../interfaces/TraitStrategy.md)
- [`XmlCapable`](../interfaces/XmlCapable.md)
- [`MarkdownCapable`](../../../core/src/interfaces/MarkdownCapable.md)

## Constructors

### Constructor

> **new OperationalStrategy**(`config?`): `OperationalStrategy`

Defined in: [packages/language/src/strategy/operational/strategy.ts:57](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L57)

#### Parameters

##### config?

[`OperationalStrategyConfig`](../interfaces/OperationalStrategyConfig.md)

#### Returns

`OperationalStrategy`

## Properties

### dimensions

> `readonly` **dimensions**: readonly `Readonly`\<\{ `description`: `string`; `id`: `string`; `index`: `number`; `label`: `string`; `poles`: `Readonly`\<\{ `negative`: `string`; `positive`: `string`; \}\>; \}\>[] = `OPERATIONAL_DIMENSIONS`

Defined in: [packages/language/src/strategy/operational/strategy.ts:50](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L50)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`dimensions`](../interfaces/TraitStrategy.md#dimensions)

***

### interactions

> `readonly` **interactions**: readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[] = `OPERATIONAL_INTERACTIONS`

Defined in: [packages/language/src/strategy/operational/strategy.ts:51](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L51)

Trait interactions for this strategy

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`interactions`](../interfaces/TraitStrategy.md#interactions)

***

### name

> `readonly` **name**: `"operational"` = `'operational'`

Defined in: [packages/language/src/strategy/operational/strategy.ts:48](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L48)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`name`](../interfaces/TraitStrategy.md#name)

***

### thresholds

> `readonly` **thresholds**: [`StrategyThresholds`](../type-aliases/StrategyThresholds.md)

Defined in: [packages/language/src/strategy/operational/strategy.ts:52](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L52)

Configurable thresholds for kernel generation and interactions

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`thresholds`](../interfaces/TraitStrategy.md#thresholds)

***

### version

> `readonly` **version**: `"1.0.0"` = `'1.0.0'`

Defined in: [packages/language/src/strategy/operational/strategy.ts:49](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L49)

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`version`](../interfaces/TraitStrategy.md#version)

## Methods

### add()

> **add**(`a`, `b`): readonly `number`[]

Defined in: [packages/language/src/strategy/operational/strategy.ts:78](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L78)

Raw vector addition without normalization.
The Composer applies normalization once after all additions.

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

Defined in: [packages/language/src/strategy/operational/strategy.ts:144](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L144)

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

Defined in: [packages/language/src/strategy/operational/strategy.ts:158](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L158)

Formats a trait vector as a compact string representation.

#### Parameters

##### traits

readonly `number`[]

#### Returns

`string`

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`formatVectorCompact`](../interfaces/TraitStrategy.md#formatvectorcompact)

***

### getConstraintDefinition()

> **getConstraintDefinition**(`name`): `Readonly`\<\{ `aliases?`: readonly `string`[]; `features?`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params?`: readonly `Readonly`\<\{ `default?`: `unknown`; `name`: `string`; `required`: `boolean`; `type`: `"string"` \| `"number"` \| `"boolean"`; \}\>[]; `traits`: `Readonly`\<`Record`\<`string`, `number`\>\>; \}\> \| `undefined`

Defined in: [packages/language/src/strategy/operational/strategy.ts:173](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L173)

Gets the constraint definition for a name (including aliases).

#### Parameters

##### name

`string`

#### Returns

`Readonly`\<\{ `aliases?`: readonly `string`[]; `features?`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params?`: readonly `Readonly`\<\{ `default?`: `unknown`; `name`: `string`; `required`: `boolean`; `type`: `"string"` \| `"number"` \| `"boolean"`; \}\>[]; `traits`: `Readonly`\<`Record`\<`string`, `number`\>\>; \}\> \| `undefined`

***

### hasConstraint()

> **hasConstraint**(`name`): `boolean`

Defined in: [packages/language/src/strategy/operational/strategy.ts:180](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L180)

Checks if a constraint name is known.

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### identity()

> **identity**(): readonly `number`[]

Defined in: [packages/language/src/strategy/operational/strategy.ts:70](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L70)

Returns the identity element (zero vector).
The identity represents "no behavioral modification".

#### Returns

readonly `number`[]

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`identity`](../interfaces/TraitStrategy.md#identity)

***

### renderMarkdown()

> **renderMarkdown**(`ir`): `string`

Defined in: [packages/language/src/strategy/operational/strategy.ts:233](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L233)

Renders KernelIR as Markdown (preferred by OpenAI models).
Implements MarkdownCapable.

#### Parameters

##### ir

[`KernelIR`](../type-aliases/KernelIR.md)

#### Returns

`string`

#### Implementation of

[`MarkdownCapable`](../../../core/src/interfaces/MarkdownCapable.md).[`renderMarkdown`](../../../core/src/interfaces/MarkdownCapable.md#rendermarkdown)

***

### renderPlain()

> **renderPlain**(`ir`): `string`

Defined in: [packages/language/src/strategy/operational/strategy.ts:192](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L192)

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

### renderXml()

> **renderXml**(`ir`): `string`

Defined in: [packages/language/src/strategy/operational/strategy.ts:211](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L211)

Renders KernelIR as XML (preferred by Anthropic Claude models).
Implements XmlCapable.

#### Parameters

##### ir

[`KernelIR`](../type-aliases/KernelIR.md)

#### Returns

`string`

#### Implementation of

[`XmlCapable`](../interfaces/XmlCapable.md).[`renderXml`](../interfaces/XmlCapable.md#renderxml)

***

### resolve()

> **resolve**(`name`, `params`): readonly `number`[]

Defined in: [packages/language/src/strategy/operational/strategy.ts:99](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L99)

Resolves a constraint name and parameters to a trait vector and features.

#### Parameters

##### name

`string`

##### params

[`ConstraintParams`](../type-aliases/ConstraintParams.md)

#### Returns

readonly `number`[]

#### Throws

UnknownConstraintError if the constraint name is not recognized

#### Throws

InvalidConstraintParamError if parameters are invalid

#### Implementation of

[`TraitStrategy`](../interfaces/TraitStrategy.md).[`resolve`](../interfaces/TraitStrategy.md#resolve)

***

### resolveWithFeatures()

> **resolveWithFeatures**(`name`, `params`): `object`

Defined in: [packages/language/src/strategy/operational/strategy.ts:118](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/strategy.ts#L118)

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
