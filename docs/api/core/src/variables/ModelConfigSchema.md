[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ModelConfigSchema

# Variable: ModelConfigSchema

> `const` **ModelConfigSchema**: `ZodObject`\<\{ `aliases`: `ZodDefault`\<`ZodArray`\<`ZodString`\>\>; `capabilities`: `ZodDefault`\<`ZodObject`\<\{ `streaming`: `ZodDefault`\<`ZodBoolean`\>; `thinking`: `ZodDefault`\<`ZodBoolean`\>; \}, `$strip`\>\>; `contextWindow`: `ZodNumber`; `defaultMaxTokens`: `ZodNumber`; `id`: `ZodString`; \}, `$strip`\>

Defined in: [packages/core/src/config/model-schema.ts:19](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/config/model-schema.ts#L19)

Schema for a single model configuration.
