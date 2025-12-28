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
 * Joins two feature values according to their lattice type.
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
      if (typeof a === 'number' && typeof b === 'number') {
        const value = Math.min(a, b);
        return { value, source: value === a ? 'a' : value === b ? 'b' : 'merged' };
      }
      throw new TypeError(`MIN lattice requires numeric values for '${featureName}'`);

    case 'MAX':
      if (typeof a === 'number' && typeof b === 'number') {
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
      if (Array.isArray(a) && Array.isArray(b)) {
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
 */
function deepEqual(a: FeatureValue, b: FeatureValue): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key] as FeatureValue, bObj[key] as FeatureValue));
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
