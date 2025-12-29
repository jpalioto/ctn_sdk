[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ApiParamValueSchema

# Variable: ApiParamValueSchema

> `const` **ApiParamValueSchema**: `ZodUnion`\<readonly \[`ZodNumber`, `ZodString`, `ZodBoolean`, `ZodReadonly`\<`ZodArray`\<`ZodString`\>\>\]\>

Defined in: [packages/core/src/provider/schemas.ts:18](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L18)

Schema for API parameter values.
Restricts to safe primitive types only.
