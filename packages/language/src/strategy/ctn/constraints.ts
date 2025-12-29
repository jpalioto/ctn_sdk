import type { ConstraintDefinition } from '../../schemas/index.js';

/**
 * Built-in constraint definitions for the CTN strategy.
 *
 * CTN uses a 7-dimensional trait space:
 * - v1: Atomic Clarity (sharp concept boundaries)
 * - v2: Specification Accuracy (smooth predictable reasoning)
 * - v3: Context Isolation (task-relevant focus)
 * - v4: Structure Over Narrative (global consistency)
 * - v5: Framing Detachment (rejects false premises)
 * - v6: Exploration (unbound search)
 * - v7: Schema Compliance (structured output)
 */
export const CTN_CONSTRAINTS: readonly ConstraintDefinition[] = Object.freeze([
  // Single-dimension behavioral constraints
  {
    name: 'clarity',
    aliases: [],
    traits: { v1: 0.8 },
  },
  {
    name: 'smooth',
    aliases: [],
    traits: { v2: 0.8 },
  },
  {
    name: 'focused',
    aliases: [],
    traits: { v3: 0.8 },
  },
  {
    name: 'structural',
    aliases: [],
    traits: { v4: 0.8 },
  },
  {
    name: 'grounded',
    aliases: [],
    traits: { v5: 0.8 },
  },
  {
    name: 'exploratory',
    aliases: [],
    traits: { v6: 0.8 },
  },
  {
    name: 'schema',
    aliases: [],
    traits: { v7: 0.8 },
  },

  // Composite profiles
  {
    name: 'stable',
    aliases: [],
    traits: { v1: 0.9, v2: 0.9, v3: 0.7, v4: 0.9, v5: 0.9, v6: 0.3 },
  },
  {
    name: 'toolselect',
    aliases: [],
    traits: { v1: 0.8, v2: 0.9, v3: 0.95, v4: 0.85, v5: 0.7, v6: 0.2 },
  },
  {
    name: 'research',
    aliases: [],
    traits: { v1: 0.6, v2: 0.5, v3: 0.3, v4: 0.5, v5: 0.7, v6: 0.9 },
  },

  // Mechanical constraints
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
