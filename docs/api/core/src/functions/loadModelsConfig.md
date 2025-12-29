[**ctn_sdk**](../../../README.md)

***

[ctn_sdk](../../../README.md) / [core/src](../README.md) / loadModelsConfig

# Function: loadModelsConfig()

> **loadModelsConfig**(`yamlPath`): `object`

Defined in: [packages/core/src/config/model-schema.ts:73](https://github.com/jpalioto/ctn_sdk/blob/d3f159deae70f85be4c20905bcb5597283d93053/packages/core/src/config/model-schema.ts#L73)

Loads and validates a models configuration from a YAML file.

## Parameters

### yamlPath

`string`

Path to the YAML configuration file

## Returns

`object`

Validated provider models configuration

### models

> **models**: `object`[]

### provider

> **provider**: `string`

## Throws

ConfigLoadError if file cannot be read

## Throws

ConfigValidationError if validation fails
