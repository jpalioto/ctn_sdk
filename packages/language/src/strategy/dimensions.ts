import type { TraitDimension } from '../schemas/index.js';

/**
 * Operational Strategy Dimension Definitions
 *
 * These define the 7-dimensional trait space for general-purpose
 * behavioral control of LLM inference.
 */
export const OPERATIONAL_DIMENSIONS: readonly TraitDimension[] = Object.freeze([
  {
    id: 'v1',
    index: 0,
    label: 'Stochasticity',
    description: 'Controls randomness vs determinism in responses',
    poles: {
      positive: 'creative, exploratory responses',
      negative: 'deterministic, grounded responses',
    },
  },
  {
    id: 'v2',
    index: 1,
    label: 'Concision',
    description: 'Controls response length and density',
    poles: {
      positive: 'brief, dense responses',
      negative: 'detailed, thorough responses',
    },
  },
  {
    id: 'v3',
    index: 2,
    label: 'Agency',
    description: 'Controls proactive vs reactive behavior',
    poles: {
      positive: 'proactive, anticipate needs',
      negative: 'reactive, wait for instruction',
    },
  },
  {
    id: 'v4',
    index: 3,
    label: 'Formality',
    description: 'Controls tone and register',
    poles: {
      positive: 'formal, professional tone',
      negative: 'casual, conversational tone',
    },
  },
  {
    id: 'v5',
    index: 4,
    label: 'Reasoning',
    description: 'Controls depth of analytical reasoning',
    poles: {
      positive: 'step-by-step analytical reasoning',
      negative: 'quick, intuitive answers',
    },
  },
  {
    id: 'v6',
    index: 5,
    label: 'Compliance',
    description: 'Controls strictness of instruction following',
    poles: {
      positive: 'strict literal adherence',
      negative: 'flexible interpretation',
    },
  },
  {
    id: 'v7',
    index: 6,
    label: 'Context Density',
    description: 'Controls how much context is referenced',
    poles: {
      positive: 'heavy context utilization',
      negative: 'minimal context reference',
    },
  },
]);

/**
 * Number of dimensions in the Operational strategy.
 */
export const OPERATIONAL_DIMENSION_COUNT = OPERATIONAL_DIMENSIONS.length;

/**
 * Map from dimension ID to index for quick lookup.
 */
export const DIMENSION_ID_TO_INDEX: Readonly<Record<string, number>> = Object.freeze(
  OPERATIONAL_DIMENSIONS.reduce(
    (acc, dim) => ({ ...acc, [dim.id]: dim.index }),
    {} as Record<string, number>
  )
);

/**
 * Map from dimension index to ID for quick lookup.
 */
export const DIMENSION_INDEX_TO_ID: Readonly<Record<number, string>> = Object.freeze(
  OPERATIONAL_DIMENSIONS.reduce(
    (acc, dim) => ({ ...acc, [dim.index]: dim.id }),
    {} as Record<number, string>
  )
);
