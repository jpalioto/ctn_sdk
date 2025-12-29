import type { TraitDimension } from '../../schemas/index.js';

export const CTN_DIMENSION_COUNT = 7;

/**
 * Map from dimension ID to array index.
 */
export const CTN_DIMENSION_ID_TO_INDEX: Readonly<Record<string, number>> = Object.freeze({
  v1: 0,
  v2: 1,
  v3: 2,
  v4: 3,
  v5: 4,
  v6: 5,
  v7: 6,
});

export const CTN_DIMENSIONS: readonly TraitDimension[] = [
  {
    index: 0,
    id: 'v1',
    label: 'Atomic Clarity',
    description: 'Sharp concept boundaries, distinct derivations',
    poles: {
      positive: 'Sharp boundaries',
      negative: 'Fuzzy boundaries',
    },
  },
  {
    index: 1,
    id: 'v2',
    label: 'Specification Accuracy',
    description: 'Smooth predictable reasoning, error intolerance',
    poles: {
      positive: 'Precise reasoning',
      negative: 'Approximate reasoning',
    },
  },
  {
    index: 2,
    id: 'v3',
    label: 'Context Isolation',
    description: 'Focused on relevant task, clean compartmentalization',
    poles: {
      positive: 'Isolated focus',
      negative: 'Broad context',
    },
  },
  {
    index: 3,
    id: 'v4',
    label: 'Structure Over Narrative',
    description: 'Global consistency, structural integrity preserved',
    poles: {
      positive: 'Structural integrity',
      negative: 'Narrative flow',
    },
  },
  {
    index: 4,
    id: 'v5',
    label: 'Framing Detachment',
    description: 'Rejects false premises, corrects before proceeding',
    poles: {
      positive: 'Premise correction',
      negative: 'Premise acceptance',
    },
  },
  {
    index: 5,
    id: 'v6',
    label: 'Exploration',
    description: 'Unbound search, explores beyond known solutions',
    poles: {
      positive: 'Broad exploration',
      negative: 'Focused solution',
    },
  },
  {
    index: 6,
    id: 'v7',
    label: 'Schema Compliance',
    description: 'Adheres to specified output structure',
    poles: {
      positive: 'Strict schema',
      negative: 'Flexible format',
    },
  },
];
