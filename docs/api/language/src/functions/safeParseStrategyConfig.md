[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / safeParseStrategyConfig

# Function: safeParseStrategyConfig()

> **safeParseStrategyConfig**(`data`): `ZodSafeParseResult`\<`Readonly`\<\{ `dimensions`: readonly `Readonly`\<\{ `description`: `string`; `id`: `string`; `index`: `number`; `label`: `string`; `poles`: `Readonly`\<\{ `negative`: `string`; `positive`: `string`; \}\>; \}\>[]; `name`: `string`; `thresholds?`: `Readonly`\<\{ `interaction`: `number`; `kernel`: `number`; \}\>; `version`: `string`; \}\>\>

Defined in: [packages/language/src/schemas/strategy.schema.ts:200](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L200)

Safely validates strategy configuration.

## Parameters

### data

`unknown`

## Returns

`ZodSafeParseResult`\<`Readonly`\<\{ `dimensions`: readonly `Readonly`\<\{ `description`: `string`; `id`: `string`; `index`: `number`; `label`: `string`; `poles`: `Readonly`\<\{ `negative`: `string`; `positive`: `string`; \}\>; \}\>[]; `name`: `string`; `thresholds?`: `Readonly`\<\{ `interaction`: `number`; `kernel`: `number`; \}\>; `version`: `string`; \}\>\>
