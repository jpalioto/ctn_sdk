[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / ResolvedConstraintSchema

# Variable: ResolvedConstraintSchema

> `const` **ResolvedConstraintSchema**: `ZodReadonly`\<`ZodObject`\<\{ `features`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodType`\<[`FeatureValue`](../type-aliases/FeatureValue.md), `unknown`, `$ZodTypeInternals`\<[`FeatureValue`](../type-aliases/FeatureValue.md), `unknown`\>\>\>\>; `name`: `ZodString`; `params`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodUnion`\<readonly \[`ZodString`, `ZodNumber`, `ZodBoolean`\]\>\>\>; `traits`: `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/constraint.schema.ts:24](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L24)

Schema for a constraint that has been resolved to a trait vector.
