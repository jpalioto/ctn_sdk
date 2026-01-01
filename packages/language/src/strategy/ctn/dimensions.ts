import type { TraitDimension } from '../../schemas/index.js';

export const CTN_DIMENSION_COUNT = 9;

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
  v8: 7,
  v9: 8,
});

/**
 * CTN v1.0 9-dimensional trait space.
 *
 * Matches ctn_core VECTORS.md specification:
 * - v₁: Atomic_Derivation (ε_hid → 0⁺)
 * - v₂: Assertion_Rigor (κ(f) → min)
 * - v₃: Frame_Isolation (Φ: W → I)
 * - v₄: Global_Invariance (π_gl ≫ π_loc)
 * - v₅: Orthogonal_Detachment (∂A ≡ A)
 * - v₆: Unbound_Search (U \ S)
 * - v₇: Syntactic_Minimalism (ℒ_out ⊂ {minimal})
 * - v₈: Anti_Sycophancy (Sycophancy → 0, Paternalism → 0)
 * - v₉: Satisfiability_Guard (P(z|q) < γ ⇒ Reject(q))
 */
export const CTN_DIMENSIONS: readonly TraitDimension[] = [
  {
    index: 0,
    id: 'v1',
    label: 'Atomic Derivation',
    description: 'Sharp concept boundaries, distinct derivations',
    poles: {
      positive: 'Sharp boundaries',
      negative: 'Fuzzy boundaries',
    },
  },
  {
    index: 1,
    id: 'v2',
    label: 'Assertion Rigor',
    description: 'Smooth predictable reasoning, error intolerance',
    poles: {
      positive: 'Precise reasoning',
      negative: 'Approximate reasoning',
    },
  },
  {
    index: 2,
    id: 'v3',
    label: 'Frame Isolation',
    description: 'Focused on relevant task, clean compartmentalization',
    poles: {
      positive: 'Isolated focus',
      negative: 'Broad context',
    },
  },
  {
    index: 3,
    id: 'v4',
    label: 'Global Invariance',
    description: 'Global consistency, structural integrity preserved',
    poles: {
      positive: 'Structural integrity',
      negative: 'Narrative flow',
    },
  },
  {
    index: 4,
    id: 'v5',
    label: 'Orthogonal Detachment',
    description: 'Rejects false premises, corrects before proceeding',
    poles: {
      positive: 'Premise correction',
      negative: 'Premise acceptance',
    },
  },
  {
    index: 5,
    id: 'v6',
    label: 'Unbound Search',
    description: 'Unbound search, explores beyond known solutions',
    poles: {
      positive: 'Broad exploration',
      negative: 'Focused solution',
    },
  },
  {
    index: 6,
    id: 'v7',
    label: 'Syntactic Minimalism',
    description: 'Adheres to minimal output structure',
    poles: {
      positive: 'Strict minimalism',
      negative: 'Flexible format',
    },
  },
  {
    index: 7,
    id: 'v8',
    label: 'Anti Sycophancy',
    description: 'Resists sycophantic and paternalistic responses',
    poles: {
      positive: 'Anti-sycophantic',
      negative: 'Accommodating',
    },
  },
  {
    index: 8,
    id: 'v9',
    label: 'Satisfiability Guard',
    description: 'Rejects unsatisfiable queries with probability threshold',
    poles: {
      positive: 'Strict satisfiability',
      negative: 'Lenient satisfiability',
    },
  },
];
