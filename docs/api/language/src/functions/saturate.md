[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / saturate

# Function: saturate()

> **saturate**(`traits`): readonly `number`[]

Defined in: [packages/language/src/composer/saturate.ts:14](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/saturate.ts#L14)

Saturating normalization for trait vectors.

Enforces the unit-ball constraint: ‖τ‖ ≤ 1

Formula: saturate(V) = V / max(1, ‖V‖)

This preserves direction while clamping magnitude to at most 1.
Vectors already within the unit ball are unchanged.

## Parameters

### traits

readonly `number`[]

## Returns

readonly `number`[]
