import { z } from 'zod';

/**
 * Schema for feature lattice types.
 */
export const FeatureLatticeSchema = z.enum(['MIN', 'MAX', 'EXCLUSIVE', 'UNION']);

export type FeatureLattice = z.infer<typeof FeatureLatticeSchema>;

/**
 * Schema for context policy - determines how conversation history is managed.
 */
export const ContextPolicySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all') }).readonly(),
  z.object({ type: z.literal('none') }).readonly(),
  z.object({
    type: z.literal('last'),
    n: z.number().int().positive(),
  }).readonly(),
]);

export type ContextPolicy = z.infer<typeof ContextPolicySchema>;

/**
 * Schema for feature values - the possible types a feature can hold.
 */
export const FeatureValueSchema: z.ZodType<FeatureValue> = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.array(z.string()).readonly(),
  ContextPolicySchema,
]);

export type FeatureValue =
  | number
  | string
  | boolean
  | readonly string[]
  | ContextPolicy;

/**
 * Schema for Features - discrete API settings that compose by lattice join.
 */
export const FeaturesSchema = z.record(z.string(), FeatureValueSchema).readonly();

export type Features = z.infer<typeof FeaturesSchema>;

/**
 * Mutable features for internal computation.
 */
export type MutableFeatures = Record<string, FeatureValue>;

/**
 * Schema for feature definition - how a specific feature should be composed.
 */
export const FeatureDefinitionSchema = z.object({
  name: z.string(),
  lattice: FeatureLatticeSchema,
  description: z.string().optional(),
}).readonly();

export type FeatureDefinition = z.infer<typeof FeatureDefinitionSchema>;

/**
 * Registry of known features and their lattice types.
 */
export const FEATURE_LATTICES: Readonly<Record<string, FeatureLattice>> = {
  max_tokens: 'MIN',
  timeout: 'MAX',
  thinking_budget: 'MAX',
  response_format: 'EXCLUSIVE',
  stop_sequences: 'UNION',
  stop: 'UNION',
  context: 'EXCLUSIVE',
};

/**
 * Gets the lattice type for a feature, defaulting to EXCLUSIVE.
 */
export function getFeatureLattice(featureName: string): FeatureLattice {
  return FEATURE_LATTICES[featureName] ?? 'EXCLUSIVE';
}

/**
 * Schema for feature join result.
 */
export const FeatureJoinResultSchema = z.object({
  value: FeatureValueSchema,
  source: z.enum(['a', 'b', 'merged']),
}).readonly();

export type FeatureJoinResult = z.infer<typeof FeatureJoinResultSchema>;

/**
 * Error thrown when exclusive features conflict.
 */
export class FeatureConflictError extends Error {
  constructor(
    public readonly featureName: string,
    public readonly valueA: FeatureValue,
    public readonly valueB: FeatureValue
  ) {
    super(
      `Feature conflict for '${featureName}': cannot merge ` +
        `${JSON.stringify(valueA)} and ${JSON.stringify(valueB)}`
    );
    this.name = 'FeatureConflictError';
  }
}

/**
 * Type guard for numeric feature values (local, before export).
 */
function isNumeric(value: FeatureValue): value is number {
  return typeof value === 'number';
}

/**
 * Type guard for array feature values (local, before export).
 */
function isArray(value: FeatureValue): value is readonly string[] {
  return Array.isArray(value);
}

/**
 * Joins two feature values according to their lattice type.
 * Uses type guards for type-safe lattice operations.
 */
export function joinFeatureValues(
  featureName: string,
  a: FeatureValue,
  b: FeatureValue,
  lattice?: FeatureLattice
): FeatureJoinResult {
  const effectiveLattice = lattice ?? getFeatureLattice(featureName);

  switch (effectiveLattice) {
    case 'MIN':
      if (isNumeric(a) && isNumeric(b)) {
        const value = Math.min(a, b);
        return { value, source: value === a ? 'a' : value === b ? 'b' : 'merged' };
      }
      throw new TypeError(`MIN lattice requires numeric values for '${featureName}'`);

    case 'MAX':
      if (isNumeric(a) && isNumeric(b)) {
        const value = Math.max(a, b);
        return { value, source: value === a ? 'a' : value === b ? 'b' : 'merged' };
      }
      throw new TypeError(`MAX lattice requires numeric values for '${featureName}'`);

    case 'EXCLUSIVE':
      if (deepEqual(a, b)) {
        return { value: a, source: 'a' };
      }
      throw new FeatureConflictError(featureName, a, b);

    case 'UNION':
      if (isArray(a) && isArray(b)) {
        const merged = [...new Set([...a, ...b])];
        return { value: merged, source: 'merged' };
      }
      throw new TypeError(`UNION lattice requires array values for '${featureName}'`);

    default:
      throw new Error(`Unknown lattice type: ${effectiveLattice}`);
  }
}

/**
 * Joins two feature sets using lattice-specific merge rules.
 */
export function joinFeatures(a: Features, b: Features): Features {
  const result: MutableFeatures = { ...a };

  for (const [key, valueB] of Object.entries(b)) {
    if (key in result) {
      const valueA = result[key];
      if (valueA !== undefined) {
        const { value } = joinFeatureValues(key, valueA, valueB);
        result[key] = value;
      }
    } else {
      result[key] = valueB;
    }
  }

  return result;
}

/**
 * Deep equality check for feature values.
 * Uses type guards for type-safe comparison of ContextPolicy objects.
 */
function deepEqual(a: FeatureValue, b: FeatureValue): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  // Handle array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  // Handle ContextPolicy comparison (the only object FeatureValue type)
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    // Both must be ContextPolicy objects (not arrays)
    if (Array.isArray(a) || Array.isArray(b)) return false;

    // Type-safe ContextPolicy comparison
    const aPolicy = a as ContextPolicy;
    const bPolicy = b as ContextPolicy;

    if (aPolicy.type !== bPolicy.type) return false;

    // For 'last' type, also compare 'n'
    if (aPolicy.type === 'last' && bPolicy.type === 'last') {
      return aPolicy.n === bPolicy.n;
    }

    // 'all' and 'none' are equal if types match
    return true;
  }

  return false;
}

/**
 * Validates a Features structure.
 */
export function parseFeatures(data: unknown): Features {
  return FeaturesSchema.parse(data);
}

/**
 * Safely validates Features, returning result object.
 */
export function safeParseFeatures(data: unknown) {
  return FeaturesSchema.safeParse(data);
}

/**
 * Validates a ContextPolicy structure.
 */
export function parseContextPolicy(data: unknown): ContextPolicy {
  return ContextPolicySchema.parse(data);
}

// ============================================================================
// Feature Type Guards
// ============================================================================

/**
 * Type guard for numeric feature values.
 * Used for MIN and MAX lattice operations.
 */
export function isNumericFeature(value: FeatureValue): value is number {
  return typeof value === 'number';
}

/**
 * Type guard for set/array feature values.
 * Used for UNION lattice operations.
 */
export function isSetFeature(value: FeatureValue): value is readonly string[] {
  return Array.isArray(value);
}

/**
 * Type guard for context policy feature values.
 */
export function isContextPolicy(value: FeatureValue): value is ContextPolicy {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const result = ContextPolicySchema.safeParse(value);
  return result.success;
}

/**
 * Type guard for string feature values.
 */
export function isStringFeature(value: FeatureValue): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for boolean feature values.
 */
export function isBooleanFeature(value: FeatureValue): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Gets the feature type for a value.
 */
export function getFeatureType(value: FeatureValue): 'number' | 'string' | 'boolean' | 'array' | 'context_policy' {
  if (isNumericFeature(value)) return 'number';
  if (isStringFeature(value)) return 'string';
  if (isBooleanFeature(value)) return 'boolean';
  if (isSetFeature(value)) return 'array';
  if (isContextPolicy(value)) return 'context_policy';
  // This should never happen if FeatureValue is correctly typed
  throw new TypeError(`Unknown feature value type: ${typeof value}`);
}
