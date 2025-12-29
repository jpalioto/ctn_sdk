[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [google/src](../README.md) / GoogleProviderOptions

# Interface: GoogleProviderOptions

Defined in: [packages/google/src/provider.ts:30](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L30)

Options for creating a GoogleProvider.

## Properties

### apiKey?

> `optional` **apiKey**: `string`

Defined in: [packages/google/src/provider.ts:35](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L35)

Google API key.
Defaults to GEMINI_API_KEY or GOOGLE_API_KEY environment variable.

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/google/src/provider.ts:41](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/google/src/provider.ts#L41)

Default timeout in milliseconds.
Defaults to 60000 (1 minute).
