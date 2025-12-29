[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / ClauseIntensitySchema

# Variable: ClauseIntensitySchema

> `const` **ClauseIntensitySchema**: `ZodEnum`\<\{ `high`: `"high"`; `low`: `"low"`; `medium`: `"medium"`; \}\>

Defined in: [packages/language/src/schemas/kernel.schema.ts:10](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/kernel.schema.ts#L10)

Schema for clause intensity level.
Determined by absolute value of trait:
- low:    |value| >= 0.3 && |value| < 0.5
- medium: |value| >= 0.5 && |value| < 0.7
- high:   |value| >= 0.7
