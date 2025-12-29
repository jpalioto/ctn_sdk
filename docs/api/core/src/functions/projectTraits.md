[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / projectTraits

# Function: projectTraits()

> **projectTraits**(`traits`, `matrix`, `strategy`): [`ProjectionResult`](../interfaces/ProjectionResult.md)

Defined in: [packages/core/src/projection/project.ts:21](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/project.ts#L21)

Projects a trait vector through a projection matrix to produce API parameters.

Mathematical formalism:
For each parameter j:
  p_j = clip(b_j + s_j * Σ(W_ji * τ_i), lo_j, hi_j)

## Parameters

### traits

readonly `number`[]

The trait vector to project

### matrix

[`ProjectionMatrix`](../interfaces/ProjectionMatrix.md)

The projection matrix

### strategy

`TraitStrategy`

The trait strategy (for dimension labels)

## Returns

[`ProjectionResult`](../interfaces/ProjectionResult.md)

Projected parameters with computation details
