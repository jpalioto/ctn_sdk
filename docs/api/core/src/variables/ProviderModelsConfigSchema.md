[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProviderModelsConfigSchema

# Variable: ProviderModelsConfigSchema

> `const` **ProviderModelsConfigSchema**: `ZodObject`\<\{ `models`: `ZodArray`\<`ZodObject`\<\{ `aliases`: `ZodDefault`\<`ZodArray`\<`ZodString`\>\>; `capabilities`: `ZodDefault`\<`ZodObject`\<\{ `streaming`: `ZodDefault`\<`ZodBoolean`\>; `thinking`: `ZodDefault`\<`ZodBoolean`\>; \}, `$strip`\>\>; `contextWindow`: `ZodNumber`; `defaultMaxTokens`: `ZodNumber`; `id`: `ZodString`; \}, `$strip`\>\>; `provider`: `ZodString`; \}, `$strip`\>

Defined in: [packages/core/src/config/model-schema.ts:32](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/config/model-schema.ts#L32)

Schema for the full provider models configuration file.
