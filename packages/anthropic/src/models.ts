import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  loadModelsConfig,
  buildAliasMap,
  toModelConfig,
  type ModelConfig,
  type ProviderModelsConfig,
} from '@ctn/core';

// Get the directory of this module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolves the path to the config file.
 * Works from both src (during tests) and dist (production).
 */
function resolveConfigPath(): string {
  // Try relative to current location (could be src or dist)
  const candidates = [
    path.resolve(__dirname, '../config/models.yaml'), // From src
    path.resolve(__dirname, '../../config/models.yaml'), // From dist/src
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback - return first candidate and let loadModelsConfig handle the error
  return candidates[0]!;
}

const CONFIG_PATH = resolveConfigPath();

// Load and cache the configuration
let cachedConfig: ProviderModelsConfig | null = null;
let cachedModels: readonly ModelConfig[] | null = null;
let cachedAliases: Record<string, string> | null = null;

/**
 * Loads the models configuration from YAML.
 */
function getConfig(): ProviderModelsConfig {
  if (!cachedConfig) {
    cachedConfig = loadModelsConfig(CONFIG_PATH);
  }
  return cachedConfig;
}

/**
 * Claude model configurations loaded from config/models.yaml.
 */
export function getClaudeModels(): readonly ModelConfig[] {
  if (!cachedModels) {
    const config = getConfig();
    cachedModels = config.models.map(toModelConfig);
  }
  return cachedModels;
}

/**
 * Model ID aliases loaded from config/models.yaml.
 */
export function getModelAliases(): Record<string, string> {
  if (!cachedAliases) {
    const config = getConfig();
    cachedAliases = buildAliasMap(config);
  }
  return cachedAliases;
}

/**
 * Resolves a model ID or alias to the canonical model ID.
 */
export function resolveModelId(modelIdOrAlias: string): string {
  const aliases = getModelAliases();
  return aliases[modelIdOrAlias] ?? modelIdOrAlias;
}

/**
 * Gets model configuration by ID or alias.
 */
export function getModelConfig(modelIdOrAlias: string): ModelConfig | undefined {
  const resolvedId = resolveModelId(modelIdOrAlias);
  const models = getClaudeModels();
  return models.find((m) => m.id === resolvedId);
}

// For backwards compatibility, also export as constants
// These are lazy-loaded on first access
export const CLAUDE_MODELS = {
  get models(): readonly ModelConfig[] {
    return getClaudeModels();
  },
};

export const MODEL_ALIASES = {
  get aliases(): Record<string, string> {
    return getModelAliases();
  },
};
