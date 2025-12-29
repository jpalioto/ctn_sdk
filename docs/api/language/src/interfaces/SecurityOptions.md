[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / SecurityOptions

# Interface: SecurityOptions

Defined in: [packages/language/src/schemas/security.schema.ts:30](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/security.schema.ts#L30)

Security options for constraint processing.

## Properties

### allowedConstraints?

> `readonly` `optional` **allowedConstraints**: readonly `string`[]

Defined in: [packages/language/src/schemas/security.schema.ts:47](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/security.schema.ts#L47)

Allowlist of constraint names.
If provided, only these constraints will be parsed.

***

### boundaryDelimiters?

> `readonly` `optional` **boundaryDelimiters**: readonly \[`string`, `string`\]

Defined in: [packages/language/src/schemas/security.schema.ts:41](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/security.schema.ts#L41)

Custom boundary delimiters for 'boundary' mode.
Default: ['[[CTN:', ']]']

***

### trustMode?

> `readonly` `optional` **trustMode**: `"trusted"` \| `"untrusted"` \| `"boundary"`

Defined in: [packages/language/src/schemas/security.schema.ts:35](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/security.schema.ts#L35)

Trust mode for constraint parsing.
Default: 'trusted'
