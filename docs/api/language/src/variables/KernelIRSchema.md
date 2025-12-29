[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / KernelIRSchema

# Variable: KernelIRSchema

> `const` **KernelIRSchema**: `ZodReadonly`\<`ZodObject`\<\{ `clauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `intensity`: `ZodEnum`\<\{ `high`: `"high"`; `low`: `"low"`; `medium`: `"medium"`; \}\>; `polarity`: `ZodEnum`\<\{ `negative`: `"negative"`; `positive`: `"positive"`; \}\>; `text`: `ZodString`; `traitId`: `ZodString`; `traitIndex`: `ZodNumber`; \}, `$strip`\>\>\>\>; `modifiedClauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `interactionId`: `ZodString`; `replacedTraits`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `text`: `ZodString`; \}, `$strip`\>\>\>\>; `omittedTraits`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `strategyName`: `ZodString`; `strategyVersion`: `ZodString`; `traitVector`: `ZodOptional`\<`ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/kernel.schema.ts:56](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/kernel.schema.ts#L56)

Schema for the provider-agnostic kernel intermediate representation.
