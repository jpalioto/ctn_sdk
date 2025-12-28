import type { ConstraintDefinition } from '../schemas/index.js';

/**
 * Built-in constraint definitions for the Operational strategy.
 *
 * Design principle: Features are only used for MECHANICAL settings that cannot
 * be expressed through behavioral steering (e.g., context policies). All
 * behavioral intent is expressed through traits only - the model should choose
 * brevity/verbosity through steering, not truncation.
 *
 * For hard token limits, use @tokens[n=256] explicitly (not implemented yet).
 *
 * | Constraint    | Aliases                  | Effect                    |
 * |---------------|--------------------------|---------------------------|
 * | @precise      | deterministic, grounded  | v1:-0.5, v5:+0.5          |
 * | @creative     | exploratory              | v1:+0.5                   |
 * | @terse        | brief, concise           | v2:+0.5                   |
 * | @verbose      | detailed, thorough       | v2:-0.5                   |
 * | @formal       | —                        | v4:+0.5                   |
 * | @casual       | —                        | v4:-0.5                   |
 * | @analytical   | step-by-step, reasoning  | v5:+0.8                   |
 * | @strict       | compliant                | v6:+0.5                   |
 * | @flexible     | —                        | v6:-0.5                   |
 * | @nomemory     | isolated                 | context: none (mechanical)|
 * | @lastN[n=N]   | —                        | context.last: N (mech.)   |
 */
export const OPERATIONAL_CONSTRAINTS: readonly ConstraintDefinition[] = Object.freeze([
  {
    name: 'precise',
    aliases: ['deterministic', 'grounded'],
    traits: { v1: -0.5, v5: 0.5 },
  },
  {
    name: 'creative',
    aliases: ['exploratory'],
    traits: { v1: 0.5 },
  },
  {
    name: 'terse',
    aliases: ['brief', 'concise'],
    traits: { v2: 0.5 },
    // No features - brevity is achieved through behavioral steering, not truncation
  },
  {
    name: 'verbose',
    aliases: ['detailed', 'thorough'],
    traits: { v2: -0.5 },
  },
  {
    name: 'formal',
    aliases: [],
    traits: { v4: 0.5 },
  },
  {
    name: 'casual',
    aliases: [],
    traits: { v4: -0.5 },
  },
  {
    name: 'analytical',
    aliases: ['step-by-step', 'reasoning'],
    traits: { v5: 0.8 },
  },
  {
    name: 'strict',
    aliases: ['compliant'],
    traits: { v6: 0.5 },
  },
  {
    name: 'flexible',
    aliases: [],
    traits: { v6: -0.5 },
  },
  {
    name: 'nomemory',
    aliases: ['isolated'],
    traits: {},
    features: { context: { type: 'none' } },
  },
  {
    name: 'lastN',
    aliases: [],
    traits: {},
    params: [
      {
        name: 'n',
        type: 'number',
        required: true,
      },
    ],
  },
]);

/**
 * Map from constraint name (including aliases) to definition.
 */
export function buildConstraintMap(
  definitions: readonly ConstraintDefinition[]
): Map<string, ConstraintDefinition> {
  const map = new Map<string, ConstraintDefinition>();

  for (const def of definitions) {
    map.set(def.name, def);
    if (def.aliases) {
      for (const alias of def.aliases) {
        map.set(alias, def);
      }
    }
  }

  return map;
}
