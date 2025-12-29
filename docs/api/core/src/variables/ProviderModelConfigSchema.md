[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProviderModelConfigSchema

# Variable: ProviderModelConfigSchema

> `const` **ProviderModelConfigSchema**: `ZodReadonly`\<`ZodObject`\<\{ `contextWindow`: `ZodNumber`; `defaultMaxTokens`: `ZodNumber`; `id`: `ZodString`; `name`: `ZodString`; `supportsStreaming`: `ZodOptional`\<`ZodBoolean`\>; `supportsThinking`: `ZodOptional`\<`ZodBoolean`\>; \}, `$strip`\>\>

Defined in: [packages/core/src/provider/schemas.ts:62](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L62)

Schema for model configuration used in provider responses.
Note: This is for runtime validation, not YAML loading.
For YAML-based config loading, use ModelConfigSchema from config/index.js
