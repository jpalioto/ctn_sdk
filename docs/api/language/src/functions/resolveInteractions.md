[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / resolveInteractions

# Function: resolveInteractions()

> **resolveInteractions**(`traits`, `interactions`, `options?`): [`InteractionResult`](../type-aliases/InteractionResult.md)

Defined in: [packages/language/src/composer/interactions.ts:32](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/composer/interactions.ts#L32)

Resolves trait interactions after composition.

Pipeline position:
  accumulate() → normalize() → resolveInteractions() → generateKernelIR()

CRITICAL INVARIANT: Interactions MUST be non-expansive transforms:
  ‖τ'‖ ≤ ‖τ‖ ≤ 1

No interaction may increase the magnitude of any trait or the overall
vector norm. This preserves the unit-ball constraint.

Evaluation order: Interactions are evaluated in array order.
First matching interaction for a trait pair wins.

## Parameters

### traits

readonly `number`[]

### interactions

readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[]

### options?

[`ResolveInteractionsOptions`](../interfaces/ResolveInteractionsOptions.md)

## Returns

[`InteractionResult`](../type-aliases/InteractionResult.md)
