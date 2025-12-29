[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / StrategyMetadataSchema

# Variable: StrategyMetadataSchema

> `const` **StrategyMetadataSchema**: `ZodReadonly`\<`ZodObject`\<\{ `dimensionCount`: `ZodNumber`; `dimensionIds`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `name`: `ZodString`; `thresholds`: `ZodOptional`\<`ZodReadonly`\<`ZodObject`\<\{ `interaction`: `ZodDefault`\<`ZodNumber`\>; `kernel`: `ZodDefault`\<`ZodNumber`\>; \}, `$strip`\>\>\>; `version`: `ZodString`; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/strategy.schema.ts:120](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L120)

Schema for strategy metadata (serializable portion).
