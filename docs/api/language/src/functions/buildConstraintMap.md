[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / buildConstraintMap

# Function: buildConstraintMap()

> **buildConstraintMap**(`definitions`): `Map`\<`string`, `Readonly`\<\{ `aliases?`: readonly `string`[]; `features?`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params?`: readonly `Readonly`\<\{ `default?`: `unknown`; `name`: `string`; `required`: `boolean`; `type`: `"string"` \| `"number"` \| `"boolean"`; \}\>[]; `traits`: `Readonly`\<`Record`\<`string`, `number`\>\>; \}\>\>

Defined in: [packages/language/src/strategy/operational/constraints.ts:97](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/strategy/operational/constraints.ts#L97)

Map from constraint name (including aliases) to definition.

## Parameters

### definitions

readonly `Readonly`\<\{ `aliases?`: readonly `string`[]; `features?`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params?`: readonly `Readonly`\<\{ `default?`: `unknown`; `name`: `string`; `required`: `boolean`; `type`: `"string"` \| `"number"` \| `"boolean"`; \}\>[]; `traits`: `Readonly`\<`Record`\<`string`, `number`\>\>; \}\>[]

## Returns

`Map`\<`string`, `Readonly`\<\{ `aliases?`: readonly `string`[]; `features?`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params?`: readonly `Readonly`\<\{ `default?`: `unknown`; `name`: `string`; `required`: `boolean`; `type`: `"string"` \| `"number"` \| `"boolean"`; \}\>[]; `traits`: `Readonly`\<`Record`\<`string`, `number`\>\>; \}\>\>
