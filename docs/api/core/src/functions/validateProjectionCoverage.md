[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / validateProjectionCoverage

# Function: validateProjectionCoverage()

> **validateProjectionCoverage**(`strategy`, `matrix`): [`LossyProjectionWarning`](../interfaces/LossyProjectionWarning.md)[]

Defined in: [packages/core/src/projection/validate.ts:93](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/validate.ts#L93)

Detects lossy projections where traits have no influence on any parameter.

A trait is considered "lossy" if no parameter has a non-zero weight for it,
meaning the trait's intent is only expressed via the kernel, not API params.

## Parameters

### strategy

`TraitStrategy`

The trait strategy

### matrix

[`ProjectionMatrix`](../interfaces/ProjectionMatrix.md)

The projection matrix

## Returns

[`LossyProjectionWarning`](../interfaces/LossyProjectionWarning.md)[]

Warnings for each lossy trait
