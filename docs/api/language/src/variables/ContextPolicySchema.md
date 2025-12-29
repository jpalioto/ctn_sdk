[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / ContextPolicySchema

# Variable: ContextPolicySchema

> `const` **ContextPolicySchema**: `ZodDiscriminatedUnion`\<\[`ZodReadonly`\<`ZodObject`\<\{ `type`: `ZodLiteral`\<`"all"`\>; \}, `$strip`\>\>, `ZodReadonly`\<`ZodObject`\<\{ `type`: `ZodLiteral`\<`"none"`\>; \}, `$strip`\>\>, `ZodReadonly`\<`ZodObject`\<\{ `n`: `ZodNumber`; `type`: `ZodLiteral`\<`"last"`\>; \}, `$strip`\>\>\], `"type"`\>

Defined in: [packages/language/src/schemas/features.schema.ts:13](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/features.schema.ts#L13)

Schema for context policy - determines how conversation history is managed.
