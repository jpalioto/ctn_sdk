[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectionValidationError

# Interface: ProjectionValidationError

Defined in: [packages/core/src/projection/types.ts:211](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L211)

Validation error for projection matrix.

## Properties

### details?

> `readonly` `optional` **details**: `string`

Defined in: [packages/core/src/projection/types.ts:219](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L219)

***

### issue

> `readonly` **issue**: `"weight_without_baseline"` \| `"baseline_without_scale"` \| `"baseline_without_clamp"` \| `"baseline_out_of_bounds"` \| `"dimension_mismatch"`

Defined in: [packages/core/src/projection/types.ts:213](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L213)

***

### parameter

> `readonly` **parameter**: `string`

Defined in: [packages/core/src/projection/types.ts:212](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L212)
