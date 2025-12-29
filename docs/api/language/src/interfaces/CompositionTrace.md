[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / CompositionTrace

# Interface: CompositionTrace

Defined in: [packages/language/src/composer/composer.ts:28](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L28)

Complete trace of the composition process.

## Properties

### featureResult

> `readonly` **featureResult**: [`Features`](../type-aliases/Features.md)

Defined in: [packages/language/src/composer/composer.ts:44](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L44)

***

### interactions

> `readonly` **interactions**: `object`

Defined in: [packages/language/src/composer/composer.ts:39](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L39)

#### applied

> `readonly` **applied**: readonly `string`[]

#### postTraits

> `readonly` **postTraits**: readonly `number`[]

#### preTraits

> `readonly` **preTraits**: readonly `number`[]

***

### kernelIR

> `readonly` **kernelIR**: [`KernelIR`](../type-aliases/KernelIR.md)

Defined in: [packages/language/src/composer/composer.ts:45](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L45)

***

### steps

> `readonly` **steps**: readonly [`CompositionStep`](CompositionStep.md)[]

Defined in: [packages/language/src/composer/composer.ts:30](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L30)

***

### strategy

> `readonly` **strategy**: `object`

Defined in: [packages/language/src/composer/composer.ts:29](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L29)

#### name

> **name**: `string`

#### version

> **version**: `string`

***

### traitResult

> `readonly` **traitResult**: `object`

Defined in: [packages/language/src/composer/composer.ts:31](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L31)

#### normalized

> `readonly` **normalized**: readonly `number`[]

#### normalizedLabeled

> `readonly` **normalizedLabeled**: `Record`\<`string`, `number`\>

#### normMagnitude

> `readonly` **normMagnitude**: `number`

#### raw

> `readonly` **raw**: readonly `number`[]

#### rawLabeled

> `readonly` **rawLabeled**: `Record`\<`string`, `number`\>

#### wasNormalized

> `readonly` **wasNormalized**: `boolean`
