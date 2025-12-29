[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectionMatrix

# Interface: ProjectionMatrix

Defined in: [packages/core/src/projection/types.ts:135](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L135)

Projection matrix defining the mapping from trait space to API parameters.

Mathematical formalism:
P = clip(b + s ⊙ (W · τ), lo, hi)

Where:
- W: Weight matrix (weights)
- b: Baseline vector (baseline)
- s: Scale vector (scale)
- lo, hi: Clamp bounds (clamps)
- τ: Trait vector
- ⊙: Element-wise product

## Properties

### baseline

> `readonly` **baseline**: `Record`\<`string`, `number`\>

Defined in: [packages/core/src/projection/types.ts:142](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L142)

Baseline values for each parameter.
These are the values when τ = 0 (zero vector).

Invariant: lo[param] ≤ baseline[param] ≤ hi[param]

***

### clamps

> `readonly` **clamps**: `Record`\<`string`, readonly \[`number`, `number`\]\>

Defined in: [packages/core/src/projection/types.ts:162](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L162)

Clamp bounds [lo, hi] for each parameter.
Final value is clipped to this range.

***

### scale

> `readonly` **scale**: `Record`\<`string`, `number`\>

Defined in: [packages/core/src/projection/types.ts:156](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L156)

Scale factors for each parameter.
Applied after dot product: scaled = dotProduct * scale[param]

***

### weights

> `readonly` **weights**: `Record`\<`string`, readonly `number`[]\>

Defined in: [packages/core/src/projection/types.ts:150](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L150)

Weight matrix mapping traits to parameters.
weights[param][traitIndex] = weight for that trait's contribution.

Parameters without weight rows are treated as baseline-only (implicit zeros).
