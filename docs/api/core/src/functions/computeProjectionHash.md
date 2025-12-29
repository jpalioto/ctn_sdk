[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / computeProjectionHash

# Function: computeProjectionHash()

> **computeProjectionHash**(`matrix`, `strategy`): `string`

Defined in: [packages/core/src/projection/hash.ts:17](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/hash.ts#L17)

Computes a deterministic hash of a projection matrix for drift detection.

The hash includes:
- Strategy name and version
- Dimension IDs
- All matrix components (baseline, weights, scale, clamps)

## Parameters

### matrix

[`ProjectionMatrix`](../interfaces/ProjectionMatrix.md)

The projection matrix

### strategy

`TraitStrategy`

The trait strategy

## Returns

`string`

128-bit hex hash (32 characters)
