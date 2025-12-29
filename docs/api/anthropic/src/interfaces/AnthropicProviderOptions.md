[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [anthropic/src](../README.md) / AnthropicProviderOptions

# Interface: AnthropicProviderOptions

Defined in: [packages/anthropic/src/provider.ts:35](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L35)

Options for creating an AnthropicProvider.

## Properties

### apiKey?

> `optional` **apiKey**: `string`

Defined in: [packages/anthropic/src/provider.ts:40](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L40)

Anthropic API key.
Defaults to ANTHROPIC_API_KEY environment variable.

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: [packages/anthropic/src/provider.ts:46](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L46)

Base URL for the Anthropic API.
Defaults to https://api.anthropic.com

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: [packages/anthropic/src/provider.ts:58](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L58)

Maximum retries for transient errors.
Defaults to 2.

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/anthropic/src/provider.ts:52](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/anthropic/src/provider.ts#L52)

Default timeout in milliseconds.
Defaults to 60000 (1 minute).
