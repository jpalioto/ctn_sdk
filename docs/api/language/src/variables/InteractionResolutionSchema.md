[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / InteractionResolutionSchema

# Variable: InteractionResolutionSchema

> `const` **InteractionResolutionSchema**: `ZodEnum`\<\{ `modify`: `"modify"`; `priority`: `"priority"`; `suppress_both`: `"suppress_both"`; \}\>

Defined in: [packages/language/src/schemas/interaction.schema.ts:14](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/interaction.schema.ts#L14)

Schema for interaction resolution types.
All resolutions must be non-expansive: ‖τ'‖ ≤ ‖τ‖
