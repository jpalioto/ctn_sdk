[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / StrategyConfigSchema

# Variable: StrategyConfigSchema

> `const` **StrategyConfigSchema**: `ZodReadonly`\<`ZodObject`\<\{ `dimensions`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `description`: `ZodString`; `id`: `ZodString`; `index`: `ZodNumber`; `label`: `ZodString`; `poles`: `ZodReadonly`\<`ZodObject`\<\{ `negative`: ...; `positive`: ...; \}, `$strip`\>\>; \}, `$strip`\>\>\>\>; `name`: `ZodString`; `thresholds`: `ZodOptional`\<`ZodReadonly`\<`ZodObject`\<\{ `interaction`: `ZodDefault`\<`ZodNumber`\>; `kernel`: `ZodDefault`\<`ZodNumber`\>; \}, `$strip`\>\>\>; `version`: `ZodString`; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/strategy.schema.ts:138](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/strategy.schema.ts#L138)

Schema for validating strategy configuration with full semantic checks.

Validates:
- SemVer format for version
- Dimension index contiguity (indices must be 0, 1, 2, ... with no gaps)
- Dimension count matches actual dimensions
