import { z } from 'zod';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Schema for model capabilities.
 */
export const ModelCapabilitiesSchema = z.object({
  thinking: z.boolean().default(false),
  streaming: z.boolean().default(true),
});

export type ModelCapabilities = z.infer<typeof ModelCapabilitiesSchema>;

/**
 * Schema for a single model configuration.
 */
export const ModelConfigSchema = z.object({
  id: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  contextWindow: z.number().int().positive(),
  defaultMaxTokens: z.number().int().positive(),
  capabilities: ModelCapabilitiesSchema.default({ thinking: false, streaming: true }),
});

export type ModelConfigYaml = z.infer<typeof ModelConfigSchema>;

/**
 * Schema for the full provider models configuration file.
 */
export const ProviderModelsConfigSchema = z.object({
  provider: z.string().min(1),
  models: z.array(ModelConfigSchema).min(1),
});

export type ProviderModelsConfig = z.infer<typeof ProviderModelsConfigSchema>;

/**
 * Error thrown when model configuration validation fails.
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Error thrown when config file cannot be loaded.
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

/**
 * Loads and validates a models configuration from a YAML file.
 *
 * @param yamlPath - Path to the YAML configuration file
 * @returns Validated provider models configuration
 * @throws ConfigLoadError if file cannot be read
 * @throws ConfigValidationError if validation fails
 */
export function loadModelsConfig(yamlPath: string): ProviderModelsConfig {
  const absolutePath = path.resolve(yamlPath);

  let content: string;
  try {
    content = fs.readFileSync(absolutePath, 'utf-8');
  } catch (error) {
    throw new ConfigLoadError(
      `Failed to read config file: ${absolutePath}`,
      error instanceof Error ? error : undefined
    );
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch (error) {
    throw new ConfigLoadError(
      `Failed to parse YAML: ${absolutePath}`,
      error instanceof Error ? error : undefined
    );
  }

  const result = ProviderModelsConfigSchema.safeParse(parsed);

  if (!result.success) {
    throw new ConfigValidationError(
      `Invalid model configuration in ${absolutePath}: ${result.error.message}`,
      result.error
    );
  }

  return result.data;
}

/**
 * Builds a model alias map from the configuration.
 * Maps each alias to its canonical model ID.
 */
export function buildAliasMap(config: ProviderModelsConfig): Record<string, string> {
  const aliases: Record<string, string> = {};

  for (const model of config.models) {
    for (const alias of model.aliases) {
      aliases[alias] = model.id;
    }
  }

  return aliases;
}

/**
 * Converts YAML model config to the internal ModelConfig format.
 */
export function toModelConfig(yamlModel: ModelConfigYaml): {
  id: string;
  name: string;
  contextWindow: number;
  defaultMaxTokens: number;
  supportsThinking: boolean;
  supportsStreaming: boolean;
} {
  // Generate a friendly name from the model ID
  // e.g., "claude-sonnet-4-5-20250929" -> "Claude Sonnet 4.5"
  const name = generateModelName(yamlModel.id);

  return {
    id: yamlModel.id,
    name,
    contextWindow: yamlModel.contextWindow,
    defaultMaxTokens: yamlModel.defaultMaxTokens,
    supportsThinking: yamlModel.capabilities.thinking,
    supportsStreaming: yamlModel.capabilities.streaming,
  };
}

/**
 * Generates a human-readable model name from the model ID.
 */
function generateModelName(modelId: string): string {
  // Handle Claude model naming patterns
  // claude-sonnet-4-5-20250929 -> Claude Sonnet 4.5
  // claude-opus-4-5-20251101 -> Claude Opus 4.5
  // claude-haiku-4-5-20251001 -> Claude Haiku 4.5

  const match = modelId.match(/^claude-(\w+)-(\d+)-(\d+)-\d+$/);
  if (match && match[1] && match[2] && match[3]) {
    const variant = match[1];
    const major = match[2];
    const minor = match[3];
    const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    return `Claude ${capitalizedVariant} ${major}.${minor}`;
  }

  // Fallback: capitalize words
  return modelId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
