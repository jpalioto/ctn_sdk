[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / toModelConfig

# Function: toModelConfig()

> **toModelConfig**(`yamlModel`): `object`

Defined in: [packages/core/src/config/model-schema.ts:127](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/config/model-schema.ts#L127)

Converts YAML model config to the internal ModelConfig format.

## Parameters

### yamlModel

#### aliases

`string`[] = `...`

#### capabilities

\{ `streaming`: `boolean`; `thinking`: `boolean`; \} = `...`

#### capabilities.streaming

`boolean` = `...`

#### capabilities.thinking

`boolean` = `...`

#### contextWindow

`number` = `...`

#### defaultMaxTokens

`number` = `...`

#### id

`string` = `...`

## Returns

`object`

### contextWindow

> **contextWindow**: `number`

### defaultMaxTokens

> **defaultMaxTokens**: `number`

### id

> **id**: `string`

### name

> **name**: `string`

### supportsStreaming

> **supportsStreaming**: `boolean`

### supportsThinking

> **supportsThinking**: `boolean`
