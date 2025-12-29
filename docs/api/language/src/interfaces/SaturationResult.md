[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / SaturationResult

# Interface: SaturationResult

Defined in: [packages/language/src/composer/saturate.ts:43](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/saturate.ts#L43)

Information about saturation applied during composition.

## Properties

### postMagnitude

> `readonly` **postMagnitude**: `number`

Defined in: [packages/language/src/composer/saturate.ts:51](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/saturate.ts#L51)

Magnitude after normalization (always ≤ 1)

***

### preMagnitude

> `readonly` **preMagnitude**: `number`

Defined in: [packages/language/src/composer/saturate.ts:49](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/saturate.ts#L49)

Magnitude before normalization

***

### traits

> `readonly` **traits**: readonly `number`[]

Defined in: [packages/language/src/composer/saturate.ts:45](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/saturate.ts#L45)

The normalized trait vector

***

### wasNormalized

> `readonly` **wasNormalized**: `boolean`

Defined in: [packages/language/src/composer/saturate.ts:47](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/saturate.ts#L47)

Whether normalization was applied
