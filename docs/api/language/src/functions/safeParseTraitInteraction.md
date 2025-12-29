[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / safeParseTraitInteraction

# Function: safeParseTraitInteraction()

> **safeParseTraitInteraction**(`data`): `ZodSafeParseResult`\<`Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>\>

Defined in: [packages/language/src/schemas/interaction.schema.ts:96](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/interaction.schema.ts#L96)

Safely validates TraitInteraction, returning result object.

## Parameters

### data

`unknown`

## Returns

`ZodSafeParseResult`\<`Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>\>
