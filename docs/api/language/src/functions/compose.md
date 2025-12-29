[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / compose

# Function: compose()

> **compose**\<`S`\>(`strategy`, `constraints`, `interactions`): [`AbstractConstraint`](../interfaces/AbstractConstraint.md)\<`S`\>

Defined in: [packages/language/src/composer/composer.ts:202](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L202)

Convenience function for one-shot composition.

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

[`AbstractConstraint`](../interfaces/AbstractConstraint.md)\<`S`\>
