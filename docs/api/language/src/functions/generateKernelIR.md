[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / generateKernelIR

# Function: generateKernelIR()

> **generateKernelIR**(`traits`, `strategy`, `appliedInteractions`): [`KernelIR`](../type-aliases/KernelIR.md)

Defined in: [packages/language/src/kernel/generator.ts:28](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/kernel/generator.ts#L28)

Generates the kernel intermediate representation from traits.

Ownership (from spec 4.6.3):
| Layer    | Responsibility                                        |
|----------|-------------------------------------------------------|
| Strategy | Defines dimension semantics, pole text                |
| Language | Generates KernelIR (clauses, omissions, modifications)|
| Provider | Formats KernelIR into model-specific syntax           |

The provider MUST NOT interpret strategy semantics or generate clause
content. It only formats the KernelIR it receives.

## Parameters

### traits

readonly `number`[]

### strategy

[`TraitStrategy`](../interfaces/TraitStrategy.md)

### appliedInteractions

readonly `Readonly`\<\{ `condition`: `"both_high"` \| `"both_low"` \| `"opposing"`; `id`: `string`; `modifiedText?`: `string`; `priorityIndex?`: `number`; `resolution`: `"priority"` \| `"suppress_both"` \| `"modify"`; `traitIndices`: \[`number`, `number`\]; \}\>[] = `[]`

## Returns

[`KernelIR`](../type-aliases/KernelIR.md)
