[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / AbstractConstraint

# Interface: AbstractConstraint\<S\>

Defined in: [packages/language/src/schemas/constraint.schema.ts:60](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L60)

The full AbstractConstraint interface includes the strategy instance.
Note: This cannot be fully represented as a Zod schema because
TraitStrategy has methods, but we provide type safety via TypeScript.

## Type Parameters

### S

`S` *extends* [`TraitStrategy`](TraitStrategy.md) = [`TraitStrategy`](TraitStrategy.md)

## Properties

### features

> `readonly` **features**: [`Features`](../type-aliases/Features.md)

Defined in: [packages/language/src/schemas/constraint.schema.ts:63](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L63)

***

### kernelIR

> `readonly` **kernelIR**: [`KernelIR`](../type-aliases/KernelIR.md)

Defined in: [packages/language/src/schemas/constraint.schema.ts:64](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L64)

***

### strategy

> `readonly` **strategy**: `S`

Defined in: [packages/language/src/schemas/constraint.schema.ts:61](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L61)

***

### traits

> `readonly` **traits**: readonly `number`[]

Defined in: [packages/language/src/schemas/constraint.schema.ts:62](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/constraint.schema.ts#L62)
