[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / KernelClauseSchema

# Variable: KernelClauseSchema

> `const` **KernelClauseSchema**: `ZodReadonly`\<`ZodObject`\<\{ `intensity`: `ZodEnum`\<\{ `high`: `"high"`; `low`: `"low"`; `medium`: `"medium"`; \}\>; `polarity`: `ZodEnum`\<\{ `negative`: `"negative"`; `positive`: `"positive"`; \}\>; `text`: `ZodString`; `traitId`: `ZodString`; `traitIndex`: `ZodNumber`; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/kernel.schema.ts:24](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/kernel.schema.ts#L24)

Schema for a single kernel clause representing one active trait.
