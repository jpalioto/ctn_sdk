[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / AbstractConstraintDataSchema

# Variable: AbstractConstraintDataSchema

> `const` **AbstractConstraintDataSchema**: `ZodReadonly`\<`ZodObject`\<\{ `features`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodType`\<[`FeatureValue`](../type-aliases/FeatureValue.md), `unknown`, `$ZodTypeInternals`\<[`FeatureValue`](../type-aliases/FeatureValue.md), `unknown`\>\>\>\>; `kernelIR`: `ZodReadonly`\<`ZodObject`\<\{ `clauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `intensity`: ...; `polarity`: ...; `text`: ...; `traitId`: ...; `traitIndex`: ...; \}, `$strip`\>\>\>\>; `modifiedClauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `interactionId`: ...; `replacedTraits`: ...; `text`: ...; \}, `$strip`\>\>\>\>; `omittedTraits`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `strategyName`: `ZodString`; `strategyVersion`: `ZodString`; `traitVector`: `ZodOptional`\<`ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>; `strategyName`: `ZodString`; `strategyVersion`: `ZodString`; `traits`: `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/constraint.schema.ts:41](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L41)

Schema for the AbstractConstraint IR (without strategy, which has methods).
This is the serializable portion of AbstractConstraint.
