[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / FeatureDefinitionSchema

# Variable: FeatureDefinitionSchema

> `const` **FeatureDefinitionSchema**: `ZodReadonly`\<`ZodObject`\<\{ `description`: `ZodOptional`\<`ZodString`\>; `lattice`: `ZodEnum`\<\{ `EXCLUSIVE`: `"EXCLUSIVE"`; `MAX`: `"MAX"`; `MIN`: `"MIN"`; `UNION`: `"UNION"`; \}\>; `name`: `ZodString`; \}, `$strip`\>\>

Defined in: [packages/language/src/schemas/features.schema.ts:57](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/features.schema.ts#L57)

Schema for feature definition - how a specific feature should be composed.
