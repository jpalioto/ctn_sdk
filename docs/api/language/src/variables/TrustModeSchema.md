[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / TrustModeSchema

# Variable: TrustModeSchema

> `const` **TrustModeSchema**: `ZodEnum`\<\{ `boundary`: `"boundary"`; `trusted`: `"trusted"`; `untrusted`: `"untrusted"`; \}\>

Defined in: [packages/language/src/schemas/security.schema.ts:19](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/schemas/security.schema.ts#L19)

Trust mode for constraint parsing.

From Section 2.2 of the CTN specification:

| Mode      | Behavior                                           |
|-----------|----------------------------------------------------|
| trusted   | Parse all constraints from input                   |
| untrusted | Never parse constraints; return raw text           |
| boundary  | Only parse within [[CTN: ... ]] delimiters         |

Security implications:
- trusted: Use only for developer-controlled inputs
- untrusted: Use for all user-generated content
- boundary: Use when mixing user text with CTN blocks
