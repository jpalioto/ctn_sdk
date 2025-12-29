[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / validateProjectionMatrix

# Function: validateProjectionMatrix()

> **validateProjectionMatrix**(`matrix`, `strategy`): [`ProjectionValidationError`](../interfaces/ProjectionValidationError.md)[]

Defined in: [packages/core/src/projection/validate.ts:21](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/validate.ts#L21)

Validates a projection matrix against a strategy.

Checks:
1. Key alignment: weights keys ⊆ baseline keys
2. All baseline keys have scale and clamps entries
3. Baseline values are within clamp bounds
4. Weight row dimensions match strategy dimensions

## Parameters

### matrix

[`ProjectionMatrix`](../interfaces/ProjectionMatrix.md)

The projection matrix to validate

### strategy

`TraitStrategy`

The trait strategy to validate against

## Returns

[`ProjectionValidationError`](../interfaces/ProjectionValidationError.md)[]

List of validation errors (empty if valid)
