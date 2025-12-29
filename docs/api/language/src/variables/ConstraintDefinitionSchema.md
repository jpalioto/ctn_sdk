[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / ConstraintDefinitionSchema

# Variable: ConstraintDefinitionSchema

> `const` **ConstraintDefinitionSchema**: `ZodReadonly`\<`ZodObject`\<\{ `aliases`: `ZodOptional`\<`ZodReadonly`\<`ZodArray`\<`ZodString`\>\>\>; `features`: `ZodOptional`\<`ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodType`\<[`FeatureValue`](../type-aliases/FeatureValue.md), `unknown`, `$ZodTypeInternals`\<[`FeatureValue`](../type-aliases/FeatureValue.md), `unknown`\>\>\>\>\>; `name`: `ZodString`; `params`: `ZodOptional`\<`ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `default`: `ZodOptional`\<`ZodUnknown`\>; `name`: `ZodString`; `required`: `ZodBoolean`; `type`: `ZodEnum`\<\{ `boolean`: ...; `number`: ...; `string`: ...; \}\>; \}, `$strip`\>\>\>\>\>; `traits`: `ZodReadonly`\<`ZodRecord`\<`ZodString`, `ZodNumber`\>\>; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/constraint.schema.ts:86](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L86)

Schema for constraint definition from configuration.
