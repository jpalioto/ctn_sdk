[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / joinFeatureValues

# Function: joinFeatureValues()

> **joinFeatureValues**(`featureName`, `a`, `b`, `lattice?`): [`FeatureJoinResult`](../type-aliases/FeatureJoinResult.md)

Defined in: [packages/language/src/schemas/features.schema.ts:130](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/features.schema.ts#L130)

Joins two feature values according to their lattice type.
Uses type guards for type-safe lattice operations.

## Parameters

### featureName

`string`

### a

[`FeatureValue`](../type-aliases/FeatureValue.md)

### b

[`FeatureValue`](../type-aliases/FeatureValue.md)

### lattice?

`"MIN"` | `"MAX"` | `"EXCLUSIVE"` | `"UNION"`

## Returns

[`FeatureJoinResult`](../type-aliases/FeatureJoinResult.md)
