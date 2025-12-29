[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectedConfigSchema

# Variable: ProjectedConfigSchema

> `const` **ProjectedConfigSchema**: `ZodReadonly`\<`ZodObject`\<\{ `apiParams`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodUnion`\<readonly \[`ZodNumber`, `ZodString`, `ZodBoolean`, `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>\]\>\>\>; `contextPolicy`: `ZodDiscriminatedUnion`\<\[`ZodReadonly`\<`ZodObject`\<\{ `type`: `ZodLiteral`\<`"all"`\>; \}, `$strip`\>\>, `ZodReadonly`\<`ZodObject`\<\{ `type`: `ZodLiteral`\<`"none"`\>; \}, `$strip`\>\>, `ZodReadonly`\<`ZodObject`\<\{ `n`: `ZodNumber`; `type`: `ZodLiteral`\<`"last"`\>; \}, `$strip`\>\>\], `"type"`\>; `features`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodType`\<`FeatureValue`, `unknown`, `$ZodTypeInternals`\<`FeatureValue`, `unknown`\>\>\>\>; `kernel`: `ZodString`; `kernelIR`: `ZodReadonly`\<`ZodObject`\<\{ `clauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `intensity`: ...; `polarity`: ...; `text`: ...; `traitId`: ...; `traitIndex`: ...; \}, `$strip`\>\>\>\>; `modifiedClauses`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `interactionId`: ...; `replacedTraits`: ...; `text`: ...; \}, `$strip`\>\>\>\>; `omittedTraits`: `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>; `strategyName`: `ZodString`; `strategyVersion`: `ZodString`; `traitVector`: `ZodOptional`\<`ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>; `model`: `ZodString`; `projectionDetails`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodObject`\<\{ `baseline`: `ZodNumber`; `clipped`: `ZodNumber`; `contributions`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<..., ...\>\>\>\>; `dotProduct`: `ZodNumber`; `raw`: `ZodNumber`; `scaled`: `ZodNumber`; `unclippedDelta`: `ZodNumber`; `wasClipped`: `ZodBoolean`; \}, `$strip`\>\>\>; \}, `$strip`\>\>

Defined in: [packages/core/src/provider/schemas.ts:109](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L109)

Schema for projected configuration.
