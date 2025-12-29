import type { AbstractConstraint, TraitStrategy } from '@ctn/language';
import type { ProjectedConfig } from '@ctn/core';
import type { GroundingResult } from '../grounding.js';

/**
 * Formats and prints trace information.
 */
export function formatTrace(
  constraint: AbstractConstraint,
  config: ProjectedConfig,
  strategy: TraitStrategy,
  groundingResult?: GroundingResult | null,
  providerName?: string
): void {
  console.log('\n--- Composition Trace ---');

  // Show provider info
  if (providerName) {
    console.log(`Provider: ${providerName} (${config.model})`);
  }

  // Show grounding info if present
  if (groundingResult) {
    console.log('\nGrounding:');
    console.log(`  Source: ${groundingResult.source}`);
    const charInfo = groundingResult.truncated
      ? `${groundingResult.charCount} (truncated from larger source)`
      : `${groundingResult.charCount}`;
    console.log(`  Characters: ${charInfo}`);
  }

  // Show strategy info
  console.log(`\nStrategy: ${strategy.name} (v${strategy.version})`);

  // Format trait vector
  console.log('\nTrait Vector:');
  const labeled = strategy.formatVector(constraint.traits);
  for (const [id, value] of Object.entries(labeled)) {
    if (value !== 0) {
      const sign = value > 0 ? '+' : '';
      console.log(`  ${id}: ${sign}${value.toFixed(3)}`);
    }
  }

  // Format features
  if (Object.keys(constraint.features).length > 0) {
    console.log('\nFeatures:');
    for (const [key, value] of Object.entries(constraint.features)) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  }

  // Format projected params
  console.log('\nProjected API Parameters:');
  for (const [key, value] of Object.entries(config.apiParams)) {
    if (typeof value === 'number') {
      console.log(`  ${key}: ${value.toFixed(4)}`);
    } else {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  }

  // Format kernel
  console.log('\nKernel:');
  console.log(config.kernel);

  console.log('\n--- End Trace ---\n');
}

/**
 * Formats and prints dry-run output as JSON.
 */
export function formatDryRun(
  config: ProjectedConfig,
  prompt: string,
  strategy: TraitStrategy
): void {
  const snapshot = {
    timestamp: new Date().toISOString(),
    strategy: {
      name: strategy.name,
      version: strategy.version,
    },
    model: config.model,
    prompt,
    projectedConfig: {
      apiParams: config.apiParams,
      features: config.features,
      contextPolicy: config.contextPolicy,
    },
    kernel: config.kernel,
    kernelIR: config.kernelIR,
    projectionDetails: config.projectionDetails,
  };

  console.log(JSON.stringify(snapshot, null, 2));
}

/**
 * Color helpers for terminal output (simple ANSI codes).
 */
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Prints a labeled value.
 */
export function printLabeled(label: string, value: string): void {
  console.log(`${colors.cyan}${label}:${colors.reset} ${value}`);
}
