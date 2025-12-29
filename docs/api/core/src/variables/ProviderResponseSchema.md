[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProviderResponseSchema

# Variable: ProviderResponseSchema

> `const` **ProviderResponseSchema**: `ZodReadonly`\<`ZodObject`\<\{ `content`: `ZodString`; `finishReason`: `ZodEnum`\<\{ `content_filter`: `"content_filter"`; `error`: `"error"`; `length`: `"length"`; `stop`: `"stop"`; `tool_calls`: `"tool_calls"`; \}\>; `id`: `ZodString`; `model`: `ZodString`; `usage`: `ZodReadonly`\<`ZodObject`\<\{ `inputTokens`: `ZodNumber`; `outputTokens`: `ZodNumber`; \}, `$strip`\>\>; \}, `$strip`\>\>

Defined in: [packages/core/src/provider/schemas.ts:147](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L147)

Schema for provider response.
