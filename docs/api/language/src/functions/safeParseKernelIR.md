[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / safeParseKernelIR

# Function: safeParseKernelIR()

> **safeParseKernelIR**(`data`): `ZodSafeParseResult`\<`Readonly`\<\{ `clauses`: readonly `Readonly`\<\{ `intensity`: `"low"` \| `"medium"` \| `"high"`; `polarity`: `"positive"` \| `"negative"`; `text`: `string`; `traitId`: `string`; `traitIndex`: `number`; \}\>[]; `modifiedClauses`: readonly `Readonly`\<\{ `interactionId`: `string`; `replacedTraits`: readonly `string`[]; `text`: `string`; \}\>[]; `omittedTraits`: readonly `string`[]; `strategyName`: `string`; `strategyVersion`: `string`; `traitVector?`: readonly `number`[]; \}\>\>

Defined in: [packages/language/src/schemas/kernel.schema.ts:123](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/kernel.schema.ts#L123)

Safely validates KernelIR, returning result object.

## Parameters

### data

`unknown`

## Returns

`ZodSafeParseResult`\<`Readonly`\<\{ `clauses`: readonly `Readonly`\<\{ `intensity`: `"low"` \| `"medium"` \| `"high"`; `polarity`: `"positive"` \| `"negative"`; `text`: `string`; `traitId`: `string`; `traitIndex`: `number`; \}\>[]; `modifiedClauses`: readonly `Readonly`\<\{ `interactionId`: `string`; `replacedTraits`: readonly `string`[]; `text`: `string`; \}\>[]; `omittedTraits`: readonly `string`[]; `strategyName`: `string`; `strategyVersion`: `string`; `traitVector?`: readonly `number`[]; \}\>\>
