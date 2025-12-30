import type { Features } from '../../schemas/index.js';

/**
 * Internal trait mappings for the CTN strategy.
 *
 * This module defines HOW the CTN strategy responds to constraints.
 * The vocabulary module defines WHAT constraints exist.
 *
 * CTN's 7-dimensional trait space:
 * - v1: Atomic Clarity (sharp concept boundaries)
 * - v2: Specification Accuracy (smooth predictable reasoning)
 * - v3: Context Isolation (task-relevant focus)
 * - v4: Structure Over Narrative (global consistency)
 * - v5: Framing Detachment (rejects false premises)
 * - v6: Exploration (unbound search)
 * - v7: Schema Compliance (structured output)
 *
 * Universal constraint mappings (best-effort approximations):
 * Note: CTN's dimensions weren't designed for these specific constraints.
 * These mappings represent reasonable interpretations within CTN's space.
 *
 * | Universal     | CTN Mapping                | Rationale                      |
 * |---------------|----------------------------|--------------------------------|
 * | @analytical   | v5:+0.8                    | Framing Detachment (reasoning) |
 * | @terse        | v2:+0.5                    | Spec Accuracy (concise)        |
 * | @verbose      | v2:-0.5                    | Opposite of terse              |
 * | @precise      | v1:+0.8, v3:+0.5           | Clarity + Context Isolation    |
 * | @creative     | v6:+0.8                    | Exploration                    |
 * | @formal       | v4:+0.5                    | Structure Over Narrative       |
 * | @casual       | v4:-0.5                    | Opposite of formal             |
 * | @strict       | v7:+0.8                    | Schema Compliance              |
 * | @flexible     | v7:-0.5                    | Opposite of strict             |
 * | @nomemory     | {} + features              | Mechanical (context policy)    |
 * | @lastN        | {} + features              | Mechanical (context policy)    |
 */

/**
 * Trait values by dimension ID.
 */
export type TraitMap = Readonly<Record<string, number>>;

/**
 * Internal mapping from constraint name to trait values.
 * Includes both universal constraints and CTN-specific constraints.
 */
export const CTN_TRAIT_MAPPINGS: Readonly<Record<string, TraitMap>> = Object.freeze({
  // ===========================================================================
  // Universal constraint mappings (best-effort approximations)
  // ===========================================================================

  // Reasoning style: maps to Framing Detachment
  analytical: { v5: 0.8 },

  // Output length: maps to Specification Accuracy
  terse: { v2: 0.5 },
  verbose: { v2: -0.5 },

  // Creativity vs precision: maps to Atomic Clarity + Context Isolation
  precise: { v1: 0.8, v3: 0.5 },
  creative: { v6: 0.8 },

  // Tone/register: maps to Structure Over Narrative
  formal: { v4: 0.5 },
  casual: { v4: -0.5 },

  // Compliance: maps to Schema Compliance
  strict: { v7: 0.8 },
  flexible: { v7: -0.5 },

  // Mechanical constraints (no trait effects - features only)
  nomemory: {},
  lastN: {},

  // ===========================================================================
  // CTN-specific constraints (native to this 7D space)
  // ===========================================================================

  // Single-dimension behavioral constraints
  clarity: { v1: 0.8 },      // Atomic Clarity
  smooth: { v2: 0.8 },       // Specification Accuracy
  focused: { v3: 0.8 },      // Context Isolation
  structural: { v4: 0.8 },   // Structure Over Narrative
  // Note: v5 (Framing Detachment) is covered by 'analytical' above
  // Note: v6 (Exploration) is covered by 'creative' above
  schema: { v7: 0.8 },       // Schema Compliance

  // Composite profiles (multi-dimensional presets)
  stable: { v1: 0.9, v2: 0.9, v3: 0.7, v4: 0.9, v5: 0.9, v6: 0.3 },
  toolselect: { v1: 0.8, v2: 0.9, v3: 0.95, v4: 0.85, v5: 0.7, v6: 0.2 },
  research: { v1: 0.6, v2: 0.5, v3: 0.3, v4: 0.5, v5: 0.7, v6: 0.9 },
});

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
 * Used for quick lookup.
 */
export const CTN_SUPPORTED_CONSTRAINTS: ReadonlySet<string> = Object.freeze(
  new Set(Object.keys(CTN_TRAIT_MAPPINGS))
);

/**
 * Check if CTN strategy supports a constraint.
 */
export function isCtnConstraint(name: string): boolean {
  return CTN_SUPPORTED_CONSTRAINTS.has(name.toLowerCase());
}
