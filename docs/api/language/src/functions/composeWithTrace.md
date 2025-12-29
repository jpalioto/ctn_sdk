[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / composeWithTrace

# Function: composeWithTrace()

> **composeWithTrace**\<`S`\>(`strategy`, `constraints`, `interactions`): `object`

Defined in: [packages/language/src/composer/composer.ts:214](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L214)

Convenience function for composition with trace.

## Type Parameters

### S

`S` *extends* [`TraitStrategy`](../interfaces/TraitStrategy.md)

## Parameters

### strategy

`S`

### constraints

readonly `Readonly`\<\{ `features`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params`: `Readonly`\<`Record`\<`string`, `string` \| `number` \| `boolean`\>\>; `traits`: readonly `number`[]; \}\>[]

### interactions

readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[] = `[]`

## Returns

`object`

### result

> **result**: [`AbstractConstraint`](../interfaces/AbstractConstraint.md)\<`S`\>

### trace

> **trace**: [`CompositionTrace`](../interfaces/CompositionTrace.md)
