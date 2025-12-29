[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / Composer

# Class: Composer\<S\>

Defined in: [packages/language/src/composer/composer.ts:65](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L65)

The Composer implements n-ary constraint composition.

CRITICAL: Composition is an N-ARY OPERATION, not iterative binary composition.
This guarantees associativity and commutativity.

Pipeline:
  accumulate() → saturate() → resolveInteractions() → generateKernelIR()

Properties (Guaranteed):
| Property      | Guarantee                                    |
|---------------|----------------------------------------------|
| Commutative   | Order of constraints does not affect result  |
| Associative   | Grouping of constraints does not affect result |
| Bounded       | ‖τ‖ ≤ 1 after composition                    |
| Identity      | Empty constraint list → τ = 0                |

## Type Parameters

### S

`S` *extends* [`TraitStrategy`](../interfaces/TraitStrategy.md) = [`TraitStrategy`](../interfaces/TraitStrategy.md)

## Constructors

### Constructor

> **new Composer**\<`S`\>(`strategy`): `Composer`\<`S`\>

Defined in: [packages/language/src/composer/composer.ts:66](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L66)

#### Parameters

##### strategy

`S`

#### Returns

`Composer`\<`S`\>

## Methods

### compose()

> **compose**(`constraints`, `interactions`): [`AbstractConstraint`](../interfaces/AbstractConstraint.md)\<`S`\>

Defined in: [packages/language/src/composer/composer.ts:77](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L77)

Composes multiple constraints into a single AbstractConstraint.

Step 1: Accumulate all trait vectors as raw sums (no normalization)
Step 2: Apply saturating normalization once
Step 3: Resolve trait interactions
Step 4: Join features via lattice operations
Step 5: Generate kernel IR

#### Parameters

##### constraints

readonly `Readonly`\<\{ `features`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params`: `Readonly`\<`Record`\<`string`, `string` \| `number` \| `boolean`\>\>; `traits`: readonly `number`[]; \}\>[]

##### interactions

readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[] = `[]`

#### Returns

[`AbstractConstraint`](../interfaces/AbstractConstraint.md)\<`S`\>

***

### composeWithTrace()

> **composeWithTrace**(`constraints`, `interactions`): `object`

Defined in: [packages/language/src/composer/composer.ts:115](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/composer.ts#L115)

Composes constraints and returns a detailed trace.

#### Parameters

##### constraints

readonly `Readonly`\<\{ `features`: `Readonly`\<`Record`\<`string`, [`FeatureValue`](../type-aliases/FeatureValue.md)\>\>; `name`: `string`; `params`: `Readonly`\<`Record`\<`string`, `string` \| `number` \| `boolean`\>\>; `traits`: readonly `number`[]; \}\>[]

##### interactions

readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[] = `[]`

#### Returns

`object`

##### result

> **result**: [`AbstractConstraint`](../interfaces/AbstractConstraint.md)\<`S`\>

##### trace

> **trace**: [`CompositionTrace`](../interfaces/CompositionTrace.md)
