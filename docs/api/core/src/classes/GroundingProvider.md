[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / GroundingProvider

# Class: GroundingProvider

Defined in: [packages/core/src/grounding/grounding-provider.ts:4](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/grounding-provider.ts#L4)

## Constructors

### Constructor

> **new GroundingProvider**(`source`, `codec`, `windowSize`, `overlap`): `GroundingProvider`

Defined in: [packages/core/src/grounding/grounding-provider.ts:5](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/grounding-provider.ts#L5)

#### Parameters

##### source

[`BaseDataProvider`](BaseDataProvider.md)

##### codec

[`ContentCodec`](../interfaces/ContentCodec.md)

##### windowSize

`number` = `8000`

##### overlap

`number` = `200`

#### Returns

`GroundingProvider`

## Methods

### getGroundingStream()

> **getGroundingStream**(): `Promise`\<`ReadableStream`\<[`GroundingPacket`](../interfaces/GroundingPacket.md)\>\>

Defined in: [packages/core/src/grounding/grounding-provider.ts:12](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/grounding/grounding-provider.ts#L12)

#### Returns

`Promise`\<`ReadableStream`\<[`GroundingPacket`](../interfaces/GroundingPacket.md)\>\>
