[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / AbstractConstraintDataSchema

# Variable: AbstractConstraintDataSchema

> `const` **AbstractConstraintDataSchema**: `ZodReadonly`\<`ZodObject`\<\{ `features`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodType`\<`FeatureValue`, `unknown`, `$ZodTypeInternals`\<`FeatureValue`, `unknown`\>\>\>\>; `kernelIR`: `ZodReadonly`\<`ZodObject`\<\{ `clauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `intensity`: ...; `polarity`: ...; `text`: ...; `traitId`: ...; `traitIndex`: ...; \}, `$strip`\>\>\>\>; `modifiedClauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `interactionId`: ...; `replacedTraits`: ...; `text`: ...; \}, `$strip`\>\>\>\>; `omittedTraits`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `strategyName`: `ZodString`; `strategyVersion`: `ZodString`; `traitVector`: `ZodOptional`\<`ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>; `traits`: `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>; \}, `$strip`\>\>

Defined in: [packages/core/src/provider/schemas.ts:239](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L239)

Schema for validating AbstractConstraint at provider boundaries.
Only validates the serializable data portions.
