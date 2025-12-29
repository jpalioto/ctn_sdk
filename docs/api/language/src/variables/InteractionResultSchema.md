[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / InteractionResultSchema

# Variable: InteractionResultSchema

> `const` **InteractionResultSchema**: `ZodReadonly`\<`ZodObject`\<\{ `appliedInteractionDetails`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `condition`: `ZodEnum`\<\{ `both_high`: `"both_high"`; `both_low`: `"both_low"`; `opposing`: `"opposing"`; \}\>; `id`: `ZodString`; `modifiedText`: `ZodOptional`\<`ZodString`\>; `priorityIndex`: `ZodOptional`\<`ZodNumber`\>; `resolution`: `ZodEnum`\<\{ `modify`: `"modify"`; `priority`: `"priority"`; `suppress_both`: `"suppress_both"`; \}\>; `traitIndices`: `ZodTuple`\<\[`ZodNumber`, `ZodNumber`\], `null`\>; \}, `$strip`\>\>\>\>; `appliedInteractions`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `traits`: `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/interaction.schema.ts:46](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/interaction.schema.ts#L46)

Schema for interaction result.
