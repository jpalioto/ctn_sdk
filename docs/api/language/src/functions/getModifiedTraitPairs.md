[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / getModifiedTraitPairs

# Function: getModifiedTraitPairs()

> **getModifiedTraitPairs**(`appliedInteractions`): `Set`\<`string`\>

Defined in: [packages/language/src/composer/interactions.ts:163](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/interactions.ts#L163)

Gets the list of trait pairs that have been modified by interactions.
Useful for kernel generation to know which traits to handle specially.

## Parameters

### appliedInteractions

readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[]

## Returns

`Set`\<`string`\>
