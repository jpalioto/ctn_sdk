[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / TraitStrategy

# Interface: TraitStrategy

Defined in: [packages/language/src/schemas/strategy.schema.ts:214](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L214)

The TraitStrategy interface defines the semantic meaning of the trait space.

All strategies must implement PlainCapable (renderPlain) as the base contract.
Strategies may implement additional rendering capabilities (XmlCapable,
MarkdownCapable, CtnCapable) which providers can negotiate.

Note: This is an interface with methods, so we define it manually
rather than deriving from a schema. The schema is used for metadata only.

## Extends

- [`PlainCapable`](PlainCapable.md)

## Properties

### dimensions

> `readonly` **dimensions**: readonly `Readonly`\<\{ `description`: `string`; `id`: `string`; `index`: `number`; `label`: `string`; `poles`: `Readonly`\<\{ `negative`: `string`; `positive`: `string`; \}\>; \}\>[]

Defined in: [packages/language/src/schemas/strategy.schema.ts:217](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L217)

***

### interactions

> `readonly` **interactions**: readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[]

Defined in: [packages/language/src/schemas/strategy.schema.ts:221](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L221)

Trait interactions for this strategy

***

### name

> `readonly` **name**: `string`

Defined in: [packages/language/src/schemas/strategy.schema.ts:215](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L215)

***

### thresholds

> `readonly` **thresholds**: [`StrategyThresholds`](../type-aliases/StrategyThresholds.md)

Defined in: [packages/language/src/schemas/strategy.schema.ts:219](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L219)

Configurable thresholds for kernel generation and interactions

***

### version

> `readonly` **version**: `string`

Defined in: [packages/language/src/schemas/strategy.schema.ts:216](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L216)

## Methods

### add()

> **add**(`a`, `b`): readonly `number`[]

Defined in: [packages/language/src/schemas/strategy.schema.ts:224](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L224)

#### Parameters

##### a

readonly `number`[]

##### b

readonly `number`[]

#### Returns

readonly `number`[]

***

### formatVector()

> **formatVector**(`traits`): [`LabeledTraits`](../type-aliases/LabeledTraits.md)

Defined in: [packages/language/src/schemas/strategy.schema.ts:231](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L231)

#### Parameters

##### traits

readonly `number`[]

#### Returns

[`LabeledTraits`](../type-aliases/LabeledTraits.md)

***

### formatVectorCompact()

> **formatVectorCompact**(`traits`): `string`

Defined in: [packages/language/src/schemas/strategy.schema.ts:232](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L232)

#### Parameters

##### traits

readonly `number`[]

#### Returns

`string`

***

### identity()

> **identity**(): readonly `number`[]

Defined in: [packages/language/src/schemas/strategy.schema.ts:223](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L223)

#### Returns

readonly `number`[]

***

### renderPlain()

> **renderPlain**(`ir`): `string`

Defined in: [packages/language/src/renderer/capabilities.ts:21](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/renderer/capabilities.ts#L21)

#### Parameters

##### ir

[`KernelIR`](../type-aliases/KernelIR.md)

#### Returns

`string`

#### Inherited from

[`PlainCapable`](PlainCapable.md).[`renderPlain`](PlainCapable.md#renderplain)

***

### resolve()

> **resolve**(`name`, `params`): readonly `number`[]

Defined in: [packages/language/src/schemas/strategy.schema.ts:225](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L225)

#### Parameters

##### name

`string`

##### params

[`ConstraintParams`](../type-aliases/ConstraintParams.md)

#### Returns

readonly `number`[]

***

### resolveWithFeatures()

> **resolveWithFeatures**(`name`, `params`): `object`

Defined in: [packages/language/src/schemas/strategy.schema.ts:227](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L227)

Resolves a constraint and returns both traits and features

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
