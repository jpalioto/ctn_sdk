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
 * Dimensions (7D operational space):
 *   v1: Stochasticity (creative ↔ deterministic)
 *   v2: Concision (brief ↔ detailed)
 *   v3: Agency (proactive ↔ reactive)
 *   v4: Formality (formal ↔ casual)
 *   v5: Reasoning (analytical ↔ intuitive)
 *   v6: Compliance (strict ↔ flexible)
 *   v7: Context Density (heavy ↔ minimal)
 *
 * | Constraint    | Effect                              |
 * |---------------|-------------------------------------|
 * | @precise      | v1:-0.5, v5:+0.5                    |
 * | @creative     | v1:+0.5                             |
 * | @terse        | v2:+0.5                             |
 * | @verbose      | v2:-0.5                             |
 * | @formal       | v4:+0.5                             |
 * | @casual       | v4:-0.5                             |
 * | @analytical   | v5:+0.8                             |
 * | @research     | v1:+0.3, v5:+0.5, v3:+0.3           |
 * | @strict       | v6:+0.5                             |
 * | @flexible     | v6:-0.5                             |
 * | @clarity      | v1:-0.3, v5:+0.3                    |
 * | @smooth       | v1:-0.2                             |
 * | @focused      | v2:+0.3, v6:+0.3                    |
 * | @structural   | v5:+0.4, v6:+0.3                    |
 * | @stable       | v1:-0.5, v6:+0.5                    |
 * | @adversarial  | v1:-0.3, v5:+0.8, v6:+0.5, v3:+0.3  |
 * | @nomemory     | context: none (mechanical)          |
 * | @lastN[n=N]   | context.last: N (mech.)             |
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
  research: { v1: 0.3, v5: 0.5, v3: 0.3 },  // exploratory, analytical, proactive

  // Compliance
  strict: { v6: 0.5 },
  flexible: { v6: -0.5 },

  // Communication style
  clarity: { v1: -0.3, v5: 0.3 },          // deterministic, some reasoning
  smooth: { v1: -0.2 },                     // slightly deterministic flow
  focused: { v2: 0.3, v6: 0.3 },           // concise, compliant

  // Structure
  structural: { v5: 0.4, v6: 0.3 },        // organized reasoning, compliant
  stable: { v1: -0.5, v6: 0.5 },           // deterministic, strict

  // Adversarial - counter mode with high reasoning and compliance
  adversarial: { v1: -0.3, v5: 0.8, v6: 0.5, v3: 0.3 },  // deterministic, analytical, strict, proactive

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
