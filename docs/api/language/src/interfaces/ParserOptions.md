[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / ParserOptions

# Interface: ParserOptions

Defined in: [packages/language/src/parser/parser.ts:23](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L23)

Options for the constraint parser.

## Properties

### allowedConstraints?

> `readonly` `optional` **allowedConstraints**: readonly `string`[]

Defined in: [packages/language/src/parser/parser.ts:42](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L42)

Allowlist of constraint names. If provided, only these
constraints will be parsed; others will be left as text.

***

### constraintBoundary?

> `readonly` `optional` **constraintBoundary**: readonly \[`string`, `string`\]

Defined in: [packages/language/src/parser/parser.ts:36](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L36)

Optional boundary delimiters for constraint parsing.
If provided, only parse constraints within these boundaries.
Example: ['[[CTN:', ']]']

***

### parseConstraints?

> `readonly` `optional` **parseConstraints**: `boolean`

Defined in: [packages/language/src/parser/parser.ts:29](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L29)

If true, parse constraints from the input.
If false, return input as-is with no constraints.
Default: true
