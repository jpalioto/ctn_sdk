import type { Features } from '../../schemas/index.js';

/**
 * Internal trait mappings for the Operational strategy.
 *
 * This module defines HOW the Operational strategy responds to constraints.
 * The vocabulary module defines WHAT constraints exist.
 *
 * Design principle: Features are only used for MECHANICAL settings that cannot
 * be expressed through behavioral steering (e.g., context policies). All
 * behavioral intent is expressed through traits only - the model should choose
 * brevity/verbosity through steering, not truncation.
 *
 * | Constraint    | Effect                    |
 * |---------------|---------------------------|
 * | @precise      | v1:-0.5, v5:+0.5          |
 * | @creative     | v1:+0.5                   |
 * | @terse        | v2:+0.5                   |
 * | @verbose      | v2:-0.5                   |
 * | @formal       | v4:+0.5                   |
 * | @casual       | v4:-0.5                   |
 * | @analytical   | v5:+0.8                   |
 * | @strict       | v6:+0.5                   |
 * | @flexible     | v6:-0.5                   |
 * | @nomemory     | context: none (mechanical)|
 * | @lastN[n=N]   | context.last: N (mech.)   |
 */

/**
 * Trait values by dimension ID.
 * Used to convert to trait vectors.
 */
export type TraitMap = Readonly<Record<string, number>>;

/**
 * Internal mapping from constraint name to trait values.
 * These are the Operational strategy's interpretation of universal constraints.
 */
export const OPERATIONAL_TRAIT_MAPPINGS: Readonly<Record<string, TraitMap>> = Object.freeze({
  // Creativity vs precision
  precise: { v1: -0.5, v5: 0.5 },
  creative: { v1: 0.5 },

  // Output length
  terse: { v2: 0.5 },
  verbose: { v2: -0.5 },

  // Tone/register
  formal: { v4: 0.5 },
  casual: { v4: -0.5 },

  // Reasoning style
  analytical: { v5: 0.8 },

  // Compliance
  strict: { v6: 0.5 },
  flexible: { v6: -0.5 },

  // Mechanical constraints (no trait effects)
  nomemory: {},
  lastN: {},
});

/**
 * Static features for non-parameterized mechanical constraints.
 */
export const OPERATIONAL_STATIC_FEATURES: Readonly<Record<string, Features>> = Object.freeze({
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
export const OPERATIONAL_PARAMETERIZED: Readonly<Record<string, readonly ConstraintParamDef[]>> = Object.freeze({
  lastN: [{ name: 'n', type: 'number', required: true }],
});

/**
 * Set of constraint names that the Operational strategy supports.
 * Used for quick lookup.
 */
export const OPERATIONAL_SUPPORTED_CONSTRAINTS: ReadonlySet<string> = Object.freeze(
  new Set(Object.keys(OPERATIONAL_TRAIT_MAPPINGS))
);

/**
 * Check if Operational strategy supports a constraint.
 */
export function isOperationalConstraint(name: string): boolean {
  return OPERATIONAL_SUPPORTED_CONSTRAINTS.has(name.toLowerCase());
}
