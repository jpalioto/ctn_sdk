[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / RequestSnapshotSchema

# Variable: RequestSnapshotSchema

> `const` **RequestSnapshotSchema**: `ZodReadonly`\<`ZodObject`\<\{ `config`: `ZodReadonly`\<`ZodObject`\<\{ `apiParams`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodUnion`\<readonly \[`ZodNumber`, `ZodString`, `ZodBoolean`, `ZodReadonly`\<...\>\]\>\>\>; `contextPolicy`: `ZodDiscriminatedUnion`\<\[`ZodReadonly`\<`ZodObject`\<\{ `type`: ...; \}, `$strip`\>\>, `ZodReadonly`\<`ZodObject`\<\{ `type`: ...; \}, `$strip`\>\>, `ZodReadonly`\<`ZodObject`\<\{ `n`: ...; `type`: ...; \}, `$strip`\>\>\], `"type"`\>; `features`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodType`\<`FeatureValue`, `unknown`, `$ZodTypeInternals`\<`FeatureValue`, `unknown`\>\>\>\>; `kernel`: `ZodString`; `kernelIR`: `ZodReadonly`\<`ZodObject`\<\{ `clauses`: `ZodReadonly`\<`ZodArray`\<...\>\>; `modifiedClauses`: `ZodReadonly`\<`ZodArray`\<...\>\>; `omittedTraits`: `ZodReadonly`\<`ZodArray`\<...\>\>; `strategyName`: `ZodString`; `strategyVersion`: `ZodString`; `traitVector`: `ZodOptional`\<`ZodReadonly`\<...\>\>; \}, `$strip`\>\>; `model`: `ZodString`; `projectionDetails`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodObject`\<\{ `baseline`: `ZodNumber`; `clipped`: `ZodNumber`; `contributions`: `ZodReadonly`\<...\>; `dotProduct`: `ZodNumber`; `raw`: `ZodNumber`; `scaled`: `ZodNumber`; `unclippedDelta`: `ZodNumber`; `wasClipped`: `ZodBoolean`; \}, `$strip`\>\>\>; \}, `$strip`\>\>; `finalParams`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodUnion`\<readonly \[`ZodNumber`, `ZodString`, `ZodBoolean`, `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>\]\>\>\>; `messages`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `content`: `ZodString`; `role`: `ZodEnum`\<\{ `assistant`: `"assistant"`; `system`: `"system"`; `user`: `"user"`; \}\>; \}, `$strip`\>\>\>\>; `model`: `ZodString`; `systemPrompt`: `ZodString`; `timestamp`: `ZodDate`; `tokenBudget`: `ZodReadonly`\<`ZodObject`\<\{ `available`: `ZodNumber`; `currentMessageTokens`: `ZodNumber`; `historyTokens`: `ZodNumber`; `modelLimit`: `ZodNumber`; `overBudget`: `ZodBoolean`; `reservedOutput`: `ZodNumber`; `systemTokens`: `ZodNumber`; \}, `$strip`\>\>; \}, `$strip`\>\>

Defined in: [packages/core/src/provider/schemas.ts:184](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L184)

Schema for request snapshot.
Captures the complete state of a request for debugging and audit.
