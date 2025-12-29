[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [language/src](../README.md) / parse

# Function: parse()

> **parse**(`input`, `options`): [`ParseResult`](../interfaces/ParseResult.md)

Defined in: [packages/language/src/parser/parser.ts:66](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/language/src/parser/parser.ts#L66)

Parses constraint syntax from input text.

Syntax:
-

## Parameters

### input

`string`

Input text potentially containing constraints

### options

[`ParserOptions`](../interfaces/ParserOptions.md) = `{}`

Parser options

## Returns

[`ParseResult`](../interfaces/ParseResult.md)

ParseResult with constraints and remaining prompt

## Name

Simple constraint
- @name[param=value]       With parameter
- @name[a=1,b=2]           Multiple parameters
-

## A

## B

## C

Text            Multiple constraints + prompt
