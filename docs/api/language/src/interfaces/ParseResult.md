[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / ParseResult

# Interface: ParseResult

Defined in: [packages/language/src/parser/parser.ts:11](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L11)

Result of parsing an input string for constraints.

## Properties

### constraints

> `readonly` **constraints**: readonly `Readonly`\<\{ `name`: `string`; `params`: `Readonly`\<`Record`\<`string`, `string` \| `number` \| `boolean`\>\>; `source`: `string`; \}\>[]

Defined in: [packages/language/src/parser/parser.ts:13](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L13)

Parsed constraints found in the input

***

### prompt

> `readonly` **prompt**: `string`

Defined in: [packages/language/src/parser/parser.ts:15](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L15)

Remaining text after constraint extraction

***

### source

> `readonly` **source**: `string`

Defined in: [packages/language/src/parser/parser.ts:17](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L17)

Original input text
