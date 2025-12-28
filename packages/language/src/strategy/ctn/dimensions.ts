import type { TraitDimension } from '../../schemas/index.js';

/**
 * CTN Strategy: 7-dimensional geometric constraint space
 *
 * Based on the Cognitive Tensor Network specification for stabilizing
 * user-space inference geometry through explicit constraint declaration.
 *
 * Each dimension represents a geometric pressure on the hidden-state trajectory.
 * Values range from 0 (no constraint) to 1 (maximum constraint).
 *
 * Reference: TERM_EXPLANATION.md
 */

export const CTN_DIMENSION_COUNT = 7;

export const CTN_DIMENSIONS: readonly TraitDimension[] = Object.freeze([
  {
    id: 'v1',
    index: 0,
    label: 'Atomic Clarity',
    description: 'Minimize hidden ambiguity in representations (ε_hid → 0⁺)',
    poles: {
      positive: 'sharp boundaries, distinct concepts, high margin separation',
      negative: 'fuzzy boundaries, concepts blur together, overlapping regions',
    },
  },
  {
    id: 'v2',
    index: 1,
    label: 'Specification Accuracy',
    description: 'Minimize curvature of the reasoning path (κ(f) → min)',
    poles: {
      positive: 'smooth predictable reasoning, stays on track',
      negative: 'sharp turns, veers unpredictably, jumps between ideas',
    },
  },
  {
    id: 'v3',
    index: 2,
    label: 'Context Isolation',
    description: 'Prevent irrelevant context from influencing reasoning (Φ:W→I)',
    poles: {
      positive: 'focused on relevant task, clean compartmentalization',
      negative: 'distracted by unrelated context, everything bleeds together',
    },
  },
  {
    id: 'v4',
    index: 3,
    label: 'Structure Over Narrative',
    description: 'Favor global structure over local storytelling (π_gl ≫ π_loc)',
    poles: {
      positive: 'structural integrity preserved, global consistency',
      negative: 'local fluency prioritized, may sacrifice coherence for flow',
    },
  },
  {
    id: 'v5',
    index: 4,
    label: 'Framing Detachment',
    description: 'Reject implausible premises about reality (∂A ≡ A)',
    poles: {
      positive: 'rejects false premises, corrects before proceeding',
      negative: 'accepts whatever premise given, reasons from false assumptions',
    },
  },
  {
    id: 'v6',
    index: 5,
    label: 'Exploration',
    description: 'Permit exploration within constrained manifold (U \\ S)',
    poles: {
      positive: 'exploratory, considers alternatives, questions assumptions',
      negative: 'decisive, narrow focus, picks from obvious options',
    },
  },
  {
    id: 'v7',
    index: 6,
    label: 'Schema Compliance',
    description: 'Constrain output to formal structure (CTN_Form)',
    poles: {
      positive: 'structured, machine-parseable, schema-locked',
      negative: 'natural language, conversational, human-readable prose',
    },
  },
]);

/**
 * Map from dimension ID to array index for fast lookup.
 */
export const CTN_DIMENSION_ID_TO_INDEX: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(CTN_DIMENSIONS.map((d) => [d.id, d.index]))
);

/**
 * CTN notation symbols for each dimension.
 * Used by the CTN kernel renderer.
 */
export const CTN_DIMENSION_NOTATION: Readonly<Record<string, string>> = Object.freeze({
  v1: 'ε_hid → 0⁺',
  v2: 'κ(f) → min',
  v3: 'Φ:W→I',
  v4: 'π_gl ≫ π_loc',
  v5: '∂A ≡ A',
  v6: 'U \\ S',
  v7: 'CTN_Form',
});
