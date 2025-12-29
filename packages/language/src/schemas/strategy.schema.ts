import { z } from 'zod';
import type { PlainCapable } from '../renderer/index.js';
import {
  TraitVectorSchema,
  TraitDimensionSchema,
  LabeledTraitsSchema,
  type TraitVector,
  type TraitDimension,
  type LabeledTraits,
} from './trait.schema.js';
import type { Features } from './features.schema.js';
import type { TraitInteraction } from './interaction.schema.js';

// ============================================================================
// SemVer Validation
// ============================================================================

/**
 * Regex pattern for semantic versioning (SemVer 2.0).
 * Matches: 1.0.0, 1.2.3-alpha, 1.0.0+build.123
 */
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Schema for semantic version strings.
 */
export const SemVerSchema = z.string().regex(SEMVER_REGEX, {
  message: 'Invalid semantic version. Expected format: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]',
});

export type SemVer = z.infer<typeof SemVerSchema>;

/**
 * Validates that a string is a valid SemVer.
 */
export function isValidSemVer(version: string): boolean {
  return SEMVER_REGEX.test(version);
}

/**
 * Parsed SemVer components.
 */
export interface ParsedSemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
  readonly build?: string;
}

/**
 * Parses a SemVer string and returns its components.
 */
export function parseSemVer(version: string): ParsedSemVer {
  const parsed = SemVerSchema.parse(version);
  const match = SEMVER_REGEX.exec(parsed);
  if (!match) throw new Error(`Invalid SemVer: ${version}`);

  const result: ParsedSemVer = {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };

  // Only add optional properties if they exist
  if (match[4] !== undefined) {
    return { ...result, prerelease: match[4] };
  }
  if (match[5] !== undefined) {
    return { ...result, build: match[5] };
  }

  return result;
}

// ============================================================================
// Constraint Parameters
// ============================================================================

/**
 * Schema for individual constraint parameter values.
 * Only allows safe primitive types.
 */
export const ConstraintParamValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export type ConstraintParamValue = z.infer<typeof ConstraintParamValueSchema>;

/**
 * Schema for constraint parameters.
 */
export const ConstraintParamsSchema = z.record(z.string(), ConstraintParamValueSchema).readonly();

export type ConstraintParams = z.infer<typeof ConstraintParamsSchema>;

/**
 * Schema for strategy threshold configuration.
 */
export const StrategyThresholdsSchema = z.object({
  /** Threshold for including a trait in kernel clauses. Default: 0.3 */
  kernel: z.number().min(0).max(1).default(0.3),
  /** Threshold for trait interaction conditions. Default: 0.5 */
  interaction: z.number().min(0).max(1).default(0.5),
}).readonly();

export type StrategyThresholds = z.infer<typeof StrategyThresholdsSchema>;

/** Default threshold values */
export const DEFAULT_THRESHOLDS: StrategyThresholds = Object.freeze({
  kernel: 0.3,
  interaction: 0.5,
});

/**
 * Schema for strategy metadata (serializable portion).
 */
export const StrategyMetadataSchema = z.object({
  name: z.string(),
  version: SemVerSchema,
  dimensionCount: z.number().int().positive(),
  dimensionIds: z.array(z.string()).readonly(),
  thresholds: StrategyThresholdsSchema.optional(),
}).readonly();

export type StrategyMetadata = z.infer<typeof StrategyMetadataSchema>;

/**
 * Schema for validating strategy configuration with full semantic checks.
 *
 * Validates:
 * - SemVer format for version
 * - Dimension index contiguity (indices must be 0, 1, 2, ... with no gaps)
 * - Dimension count matches actual dimensions
 */
export const StrategyConfigSchema = z.object({
  name: z.string().min(1, 'Strategy name cannot be empty'),
  version: SemVerSchema,
  dimensions: z.array(TraitDimensionSchema).readonly(),
  thresholds: StrategyThresholdsSchema.optional(),
}).readonly().superRefine((data, ctx) => {
  // Check dimension index contiguity
  const indices = data.dimensions.map((d) => d.index).sort((a, b) => a - b);

  for (let i = 0; i < indices.length; i++) {
    if (indices[i] !== i) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Dimension indices must be contiguous starting from 0. ` +
          `Expected index ${i} but found ${indices[i]}. ` +
          `Indices: [${indices.join(', ')}]`,
        path: ['dimensions'],
      });
      break;
    }
  }

  // Check for duplicate indices
  const seen = new Set<number>();
  for (const dim of data.dimensions) {
    if (seen.has(dim.index)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate dimension index: ${dim.index} (dimension '${dim.id}')`,
        path: ['dimensions'],
      });
    }
    seen.add(dim.index);
  }

  // Check for duplicate IDs
  const seenIds = new Set<string>();
  for (const dim of data.dimensions) {
    if (seenIds.has(dim.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate dimension ID: '${dim.id}'`,
        path: ['dimensions'],
      });
    }
    seenIds.add(dim.id);
  }
});

export type StrategyConfig = z.infer<typeof StrategyConfigSchema>;

/**
 * Validates a strategy configuration.
 * @throws ZodError if validation fails
 */
export function parseStrategyConfig(data: unknown): StrategyConfig {
  return StrategyConfigSchema.parse(data);
}

/**
 * Safely validates strategy configuration.
 */
export function safeParseStrategyConfig(data: unknown) {
  return StrategyConfigSchema.safeParse(data);
}

/**
 * The TraitStrategy interface defines the semantic meaning of the trait space.
 *
 * All strategies must implement PlainCapable (renderPlain) as the base contract.
 * Strategies may implement additional rendering capabilities (XmlCapable,
 * MarkdownCapable, CtnCapable) which providers can negotiate.
 *
 * Note: This is an interface with methods, so we define it manually
 * rather than deriving from a schema. The schema is used for metadata only.
 */
export interface TraitStrategy extends PlainCapable {
  readonly name: string;
  readonly version: string;
  readonly dimensions: readonly TraitDimension[];
  /** Configurable thresholds for kernel generation and interactions */
  readonly thresholds: StrategyThresholds;
  /** Trait interactions for this strategy */
  readonly interactions: readonly TraitInteraction[];

  identity(): TraitVector;
  add(a: TraitVector, b: TraitVector): TraitVector;
  resolve(name: string, params: ConstraintParams): TraitVector;
  /** Resolves a constraint and returns both traits and features */
  resolveWithFeatures(
    name: string,
    params: ConstraintParams
  ): { traits: TraitVector; features: Features };
  formatVector(traits: TraitVector): LabeledTraits;
  formatVectorCompact(traits: TraitVector): string;
}

/**
 * Extracts metadata from a strategy for serialization.
 */
export function getStrategyMetadata(strategy: TraitStrategy): StrategyMetadata {
  return {
    name: strategy.name,
    version: strategy.version,
    dimensionCount: strategy.dimensions.length,
    dimensionIds: strategy.dimensions.map((d) => d.id),
    thresholds: strategy.thresholds,
  };
}

/**
 * Validates strategy metadata structure.
 */
export function parseStrategyMetadata(data: unknown): StrategyMetadata {
  return StrategyMetadataSchema.parse(data);
}
