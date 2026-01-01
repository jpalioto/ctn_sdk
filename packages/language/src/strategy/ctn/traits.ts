import type { Features } from '../../schemas/index.js';
import { CTN_PROFILES, traitsToArray, type CTNProfile } from './profiles.js';

/**
 * Internal trait mappings for the CTN strategy.
 *
 * This module derives trait mappings from CTN profiles.
 * The profiles module is the source of truth for CTN constraint definitions.
 *
 * CTN v1.0 9-dimensional trait space (per ctn_core VECTORS.md):
 * - v1: Atomic Derivation (ε_hid → 0⁺)
 * - v2: Assertion Rigor (κ(f) → min)
 * - v3: Frame Isolation (Φ: W → I)
 * - v4: Global Invariance (π_gl ≫ π_loc)
 * - v5: Orthogonal Detachment (∂A ≡ A)
 * - v6: Unbound Search (U \ S)
 * - v7: Syntactic Minimalism (ℒ_out ⊂ {minimal})
 * - v8: Anti Sycophancy (Sycophancy → 0, Paternalism → 0)
 * - v9: Satisfiability Guard (P(z|q) < γ ⇒ Reject(q))
 */

/**
 * Trait values by dimension ID.
 */
export type TraitMap = Readonly<Record<string, number>>;

/**
 * Convert profile traits object to TraitMap format (9D).
 */
function profileToTraitMap(profile: CTNProfile): TraitMap {
  return {
    v1: profile.traits.v1,
    v2: profile.traits.v2,
    v3: profile.traits.v3,
    v4: profile.traits.v4,
    v5: profile.traits.v5,
    v6: profile.traits.v6,
    v7: profile.traits.v7,
    v8: profile.traits.v8,
    v9: profile.traits.v9,
  };
}

/**
 * Internal mapping from constraint name to trait values.
 * Derived from CTN_PROFILES for consistency.
 */
export const CTN_TRAIT_MAPPINGS: Readonly<Record<string, TraitMap>> = Object.freeze(
  Object.fromEntries(
    Object.entries(CTN_PROFILES).map(([name, profile]) => [name, profileToTraitMap(profile)])
  )
);

/**
 * Static features for non-parameterized mechanical constraints.
 */
export const CTN_STATIC_FEATURES: Readonly<Record<string, Features>> = Object.freeze({
  nomemory: { context: { type: 'none' } },
});

/**
 * Parameter definitions for parameterized constraints.
 */
export interface ConstraintParamDef {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean';
  readonly required: boolean;
}

/**
 * Parameterized constraint definitions.
 */
export const CTN_PARAMETERIZED: Readonly<Record<string, readonly ConstraintParamDef[]>> = Object.freeze({
  lastN: [{ name: 'n', type: 'number', required: true }],
});

/**
 * Set of constraint names that the CTN strategy supports.
 * Derived from profiles.
 */
export const CTN_SUPPORTED_CONSTRAINTS: ReadonlySet<string> = Object.freeze(
  new Set(Object.keys(CTN_PROFILES))
);

/**
 * Check if CTN strategy supports a constraint.
 */
export function isCtnConstraint(name: string): boolean {
  return CTN_SUPPORTED_CONSTRAINTS.has(name.toLowerCase());
}

// Re-export profile utilities for strategy use
export { CTN_PROFILES, traitsToArray, combineProfiles, getProfile, hasProfile } from './profiles.js';
export type { CTNProfile, ProfileTraits, SolverConfig, SyntaxConfig, SolverMode } from './profiles.js';
