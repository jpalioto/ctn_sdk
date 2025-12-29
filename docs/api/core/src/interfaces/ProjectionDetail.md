[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / ProjectionDetail

# Interface: ProjectionDetail

Defined in: [packages/core/src/projection/types.ts:168](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L168)

Detailed projection computation for a single parameter.

## Properties

### baseline

> `readonly` **baseline**: `number`

Defined in: [packages/core/src/projection/types.ts:170](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L170)

Baseline value before trait influence

***

### clipped

> `readonly` **clipped**: `number`

Defined in: [packages/core/src/projection/types.ts:180](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L180)

Final value after clipping

***

### contributions

> `readonly` **contributions**: readonly [`TraitContribution`](TraitContribution.md)[]

Defined in: [packages/core/src/projection/types.ts:184](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L184)

Per-trait contributions for tracing

***

### dotProduct

> `readonly` **dotProduct**: `number`

Defined in: [packages/core/src/projection/types.ts:172](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L172)

Dot product of weights and traits

***

### raw

> `readonly` **raw**: `number`

Defined in: [packages/core/src/projection/types.ts:178](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L178)

Raw value before clipping: baseline + scaled

***

### scaled

> `readonly` **scaled**: `number`

Defined in: [packages/core/src/projection/types.ts:174](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L174)

Scaled delta: dotProduct * scale

***

### unclippedDelta

> `readonly` **unclippedDelta**: `number`

Defined in: [packages/core/src/projection/types.ts:176](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L176)

Unclipped delta for tracing

***

### wasClipped

> `readonly` **wasClipped**: `boolean`

Defined in: [packages/core/src/projection/types.ts:182](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/projection/types.ts#L182)

Whether clipping was applied
