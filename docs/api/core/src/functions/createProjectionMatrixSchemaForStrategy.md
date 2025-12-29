[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / createProjectionMatrixSchemaForStrategy

# Function: createProjectionMatrixSchemaForStrategy()

> **createProjectionMatrixSchemaForStrategy**(`dimensionCount`): `ZodReadonly`\<`ZodObject`\<\{ `baseline`: `ZodRecord`\<`ZodString`, `ZodNumber`\>; `clamps`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodTuple`\<\[`ZodNumber`, `ZodNumber`\], `null`\>\>\>; `scale`: `ZodRecord`\<`ZodString`, `ZodNumber`\>; `weights`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>

Defined in: [packages/core/src/projection/types.ts:87](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L87)

Creates a validated projection matrix schema for a specific strategy.
Validates weight dimension match against strategy dimensions.

## Parameters

### dimensionCount

`number`

## Returns

`ZodReadonly`\<`ZodObject`\<\{ `baseline`: `ZodRecord`\<`ZodString`, `ZodNumber`\>; `clamps`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodTuple`\<\[`ZodNumber`, `ZodNumber`\], `null`\>\>\>; `scale`: `ZodRecord`\<`ZodString`, `ZodNumber`\>; `weights`: `ZodRecord`\<`ZodString`, `ZodReadonly`\<`ZodArray`\<`ZodNumber`\>\>\>; \}, `$strip`\>\>
