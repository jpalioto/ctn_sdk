[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [openai/src](../README.md) / OpenAIProviderOptions

# Interface: OpenAIProviderOptions

Defined in: [packages/openai/src/provider.ts:30](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/openai/src/provider.ts#L30)

Options for creating an OpenAIProvider.

## Properties

### apiKey?

> `optional` **apiKey**: `string`

Defined in: [packages/openai/src/provider.ts:35](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/openai/src/provider.ts#L35)

OpenAI API key.
Defaults to OPENAI_API_KEY environment variable.

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/openai/src/provider.ts:41](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/openai/src/provider.ts#L41)

Default timeout in milliseconds.
Defaults to 60000 (1 minute).
