[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectionMatrixSchema

# Variable: ProjectionMatrixSchema

> `const` **ProjectionMatrixSchema**: `ZodReadonly`\<`ZodObject`\<\{ `baseline`: `ZodRecord`\<`ZodString`, `ZodNumber`\>; `clamps`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodTuple`\<\[`ZodNumber`, `ZodNumber`\], `null`\>\>\>; `scale`: `ZodRecord`\<`ZodString`, `ZodNumber`\>; `weights`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>

Defined in: [packages/core/src/projection/types.ts:27](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L27)

Schema for projection matrix with full validation.

Validates:
- Key alignment: baseline keys = scale keys = clamps keys
- Weight keys ⊆ baseline keys
- Baseline invariant: lo ≤ b ≤ hi for all parameters
