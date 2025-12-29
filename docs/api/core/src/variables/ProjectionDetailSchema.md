[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectionDetailSchema

# Variable: ProjectionDetailSchema

> `const` **ProjectionDetailSchema**: `ZodReadonly`\<`ZodObject`\<\{ `baseline`: `ZodNumber`; `clipped`: `ZodNumber`; `contributions`: `ZodReadonly`\<`ZodArray`\<`ZodReadonly`\<`ZodObject`\<\{ `contribution`: `ZodNumber`; `traitId`: `ZodString`; `traitIndex`: `ZodNumber`; `traitValue`: `ZodNumber`; `weight`: `ZodNumber`; \}, `$strip`\>\>\>\>; `dotProduct`: `ZodNumber`; `raw`: `ZodNumber`; `scaled`: `ZodNumber`; `unclippedDelta`: `ZodNumber`; `wasClipped`: `ZodBoolean`; \}, `$strip`\>\>

Defined in: [packages/core/src/provider/schemas.ts:91](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/provider/schemas.ts#L91)

Schema for projection detail.
