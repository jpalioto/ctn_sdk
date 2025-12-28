import { z } from 'zod';
import { TraitVectorSchema, type TraitVector } from './trait.schema.js';
import { FeaturesSchema, type Features } from './features.schema.js';
import { KernelIRSchema, type KernelIR } from './kernel.schema.js';
import { ConstraintParamsSchema, type ConstraintParams, type TraitStrategy } from './strategy.schema.js';

/**
 * Schema for a parsed but unresolved constraint.
 */
export const ParsedConstraintSchema = z.object({
  /** Constraint name (e.g., "precise", "terse") */
  name: z.string(),
  /** Parameters passed to the constraint */
  params: ConstraintParamsSchema,
  /** Original source text (for error messages) */
  source: z.string(),
}).readonly();

export type ParsedConstraint = z.infer<typeof ParsedConstraintSchema>;

/**
 * Schema for a constraint that has been resolved to a trait vector.
 */
export const ResolvedConstraintSchema = z.object({
  /** Original constraint name */
  name: z.string(),
  /** Parameters that were used */
  params: ConstraintParamsSchema,
  /** Resolved trait vector */
  traits: TraitVectorSchema,
  /** Features associated with this constraint */
  features: FeaturesSchema,
}).readonly();

export type ResolvedConstraint = z.infer<typeof ResolvedConstraintSchema>;

/**
 * Schema for the AbstractConstraint IR (without strategy, which has methods).
 * This is the serializable portion of AbstractConstraint.
 */
export const AbstractConstraintDataSchema = z.object({
  /** Strategy metadata */
  strategyName: z.string(),
  strategyVersion: z.string(),
  /** Composed trait vector (within unit ball) */
  traits: TraitVectorSchema,
  /** Composed features (lattice-joined) */
  features: FeaturesSchema,
  /** Kernel intermediate representation */
  kernelIR: KernelIRSchema,
}).readonly();

export type AbstractConstraintData = z.infer<typeof AbstractConstraintDataSchema>;

/**
 * The full AbstractConstraint interface includes the strategy instance.
 * Note: This cannot be fully represented as a Zod schema because
 * TraitStrategy has methods, but we provide type safety via TypeScript.
 */
export interface AbstractConstraint<S extends TraitStrategy = TraitStrategy> {
  readonly strategy: S;
  readonly traits: TraitVector;
  readonly features: Features;
  readonly kernelIR: KernelIR;
}

/**
 * Schema for constraint parameter definition.
 */
export const ConstraintParamDefinitionSchema = z.object({
  /** Parameter name */
  name: z.string(),
  /** Expected type */
  type: z.enum(['string', 'number', 'boolean']),
  /** Whether this parameter is required */
  required: z.boolean(),
  /** Default value if not provided */
  default: z.unknown().optional(),
}).readonly();

export type ConstraintParamDefinition = z.infer<typeof ConstraintParamDefinitionSchema>;

/**
 * Schema for constraint definition from configuration.
 */
export const ConstraintDefinitionSchema = z.object({
  /** Constraint name */
  name: z.string(),
  /** Alternative names for this constraint */
  aliases: z.array(z.string()).readonly().optional(),
  /** Trait values to apply (by dimension ID) */
  traits: z.record(z.string(), z.number()).readonly(),
  /** Features to apply */
  features: FeaturesSchema.optional(),
  /** Parameter definitions for parameterized constraints */
  params: z.array(ConstraintParamDefinitionSchema).readonly().optional(),
}).readonly();

export type ConstraintDefinition = z.infer<typeof ConstraintDefinitionSchema>;

/**
 * Creates a resolved constraint.
 */
export function createResolvedConstraint(
  name: string,
  params: ConstraintParams,
  traits: TraitVector,
  features: Features = {}
): ResolvedConstraint {
  return {
    name,
    params,
    traits,
    features,
  };
}

/**
 * Converts AbstractConstraint to serializable data format.
 */
export function toAbstractConstraintData(
  constraint: AbstractConstraint
): AbstractConstraintData {
  return {
    strategyName: constraint.strategy.name,
    strategyVersion: constraint.strategy.version,
    traits: constraint.traits,
    features: constraint.features,
    kernelIR: constraint.kernelIR,
  };
}

/**
 * Validates a ParsedConstraint structure.
 */
export function parseParsedConstraint(data: unknown): ParsedConstraint {
  return ParsedConstraintSchema.parse(data);
}

/**
 * Validates a ResolvedConstraint structure.
 */
export function parseResolvedConstraint(data: unknown): ResolvedConstraint {
  return ResolvedConstraintSchema.parse(data);
}

/**
 * Validates a ConstraintDefinition structure.
 */
export function parseConstraintDefinition(data: unknown): ConstraintDefinition {
  return ConstraintDefinitionSchema.parse(data);
}

/**
 * Validates AbstractConstraintData structure.
 */
export function parseAbstractConstraintData(data: unknown): AbstractConstraintData {
  return AbstractConstraintDataSchema.parse(data);
}

/**
 * Type guard for ParsedConstraint.
 */
export function isParsedConstraint(value: unknown): value is ParsedConstraint {
  return ParsedConstraintSchema.safeParse(value).success;
}

/**
 * Type guard for ResolvedConstraint.
 */
export function isResolvedConstraint(value: unknown): value is ResolvedConstraint {
  return ResolvedConstraintSchema.safeParse(value).success;
}
