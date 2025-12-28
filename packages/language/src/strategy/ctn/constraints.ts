import type { ConstraintDefinition } from '../../schemas/index.js';

/**
 * CTN Strategy Constraints
 *
 * Named presets for common geometric configurations.
 * Each constraint maps to specific trait values in the CTN dimension space.
 *
 * CTN dimensions use 0-1 range (0 = no constraint, 1 = maximum constraint)
 * unlike Operational which uses -1 to +1 (negative/positive poles).
 *
 * Reference profiles from TERM_EXPLANATION.md:
 * - Stable reasoning: τ = [0.9, 0.9, 0.7, 0.9, 0.9, 0.3, 0.0]
 * - Tool selection:   τ = [0.85, 0.90, 0.40, 0.80, 0.50, 0.45, 1.00]
 */

export const CTN_CONSTRAINTS: readonly ConstraintDefinition[] = Object.freeze([
  // === Atomic Clarity (v1) ===
  {
    name: 'clarity',
    aliases: ['clear', 'distinct'],
    description: 'Maximize atomic clarity - sharp boundaries between concepts',
    traits: { v1: 0.9 },
    features: {},
  },
  {
    name: 'fuzzy',
    aliases: ['blur', 'soft'],
    description: 'Reduce atomic clarity - allow concepts to blend',
    traits: { v1: 0.2 },
    features: {},
  },

  // === Specification Accuracy (v2) ===
  {
    name: 'smooth',
    aliases: ['steady', 'predictable'],
    description: 'Maximize specification accuracy - smooth reasoning path',
    traits: { v2: 0.9 },
    features: {},
  },
  {
    name: 'dynamic',
    aliases: ['agile'],
    description: 'Reduce path constraints - allow sharp reasoning turns',
    traits: { v2: 0.3 },
    features: {},
  },

  // === Context Isolation (v3) ===
  {
    name: 'focused',
    aliases: ['isolated', 'compartment'],
    description: 'Maximize context isolation - ignore irrelevant context',
    traits: { v3: 0.9 },
    features: {},
  },
  {
    name: 'holistic',
    aliases: ['connected', 'integrated'],
    description: 'Reduce isolation - allow cross-context influence',
    traits: { v3: 0.2 },
    features: {},
  },

  // === Structure Over Narrative (v4) ===
  {
    name: 'structural',
    aliases: ['structured', 'invariant'],
    description: 'Maximize structure priority - global consistency over local flow',
    traits: { v4: 0.9 },
    features: {},
  },
  {
    name: 'narrative',
    aliases: ['flowing', 'fluent'],
    description: 'Reduce structure priority - local coherence over global',
    traits: { v4: 0.2 },
    features: {},
  },

  // === Framing Detachment (v5) ===
  {
    name: 'grounded',
    aliases: ['anchored', 'reality'],
    description: 'Maximize framing detachment - reject false premises',
    traits: { v5: 0.9 },
    features: {},
  },
  {
    name: 'hypothetical',
    aliases: ['assumptive'],
    description: 'Reduce framing detachment - accept premises as given',
    traits: { v5: 0.2 },
    features: {},
  },

  // === Exploration (v6) ===
  {
    name: 'exploratory',
    aliases: ['explore', 'wander'],
    description: 'Maximize exploration - consider alternatives and question assumptions',
    traits: { v6: 0.8 },
    features: {},
  },
  {
    name: 'decisive',
    aliases: ['direct', 'narrow'],
    description: 'Minimize exploration - pick from obvious options',
    traits: { v6: 0.2 },
    features: {},
  },

  // === Schema Compliance (v7) ===
  {
    name: 'schema',
    aliases: ['formal', 'structured-output'],
    description: 'Maximize schema compliance - machine-parseable output',
    traits: { v7: 1.0 },
    features: {},
  },
  {
    name: 'natural',
    aliases: ['prose', 'conversational'],
    description: 'Minimize schema compliance - natural language output',
    traits: { v7: 0.0 },
    features: {},
  },

  // === Composite Profiles ===
  {
    name: 'stable',
    aliases: ['stable-reasoning'],
    description: 'Reference profile for stable reasoning (from TERM_EXPLANATION)',
    traits: {
      v1: 0.9,  // Atomic Clarity
      v2: 0.9,  // Specification Accuracy
      v3: 0.7,  // Context Isolation
      v4: 0.9,  // Structure Over Narrative
      v5: 0.9,  // Framing Detachment
      v6: 0.3,  // Exploration (low - decisive)
      v7: 0.0,  // Schema Compliance (natural output)
    },
    features: {},
  },
  {
    name: 'toolselect',
    aliases: ['tool-selection', 'discriminator'],
    description: 'Reference profile for tool selection tasks',
    traits: {
      v1: 0.85, // Atomic Clarity (high margin)
      v2: 0.90, // Specification Accuracy (steady toward decision)
      v3: 0.40, // Context Isolation (moderate - some context needed)
      v4: 0.80, // Structure Over Narrative (follow rules)
      v5: 0.50, // Framing Detachment (balanced)
      v6: 0.45, // Exploration (low - pick, don't invent)
      v7: 1.00, // Schema Compliance (structured output)
    },
    features: {},
  },
  {
    name: 'research',
    aliases: ['explore-deep', 'brainstorm'],
    description: 'Profile for exploratory research and brainstorming',
    traits: {
      v1: 0.6,  // Atomic Clarity (moderate)
      v2: 0.5,  // Specification Accuracy (allow some wandering)
      v3: 0.3,  // Context Isolation (low - draw connections)
      v4: 0.5,  // Structure Over Narrative (balanced)
      v5: 0.7,  // Framing Detachment (stay grounded)
      v6: 0.9,  // Exploration (high)
      v7: 0.0,  // Schema Compliance (natural prose)
    },
    features: {},
  },

  // === Mechanical constraints (same as Operational) ===
  {
    name: 'nomemory',
    aliases: ['no-memory', 'fresh'],
    description: 'Disable conversation memory',
    traits: {},
    features: { context: { type: 'none' } },
  },
  {
    name: 'lastN',
    aliases: ['last-n', 'recent'],
    description: 'Limit context to last N messages',
    traits: {},
    features: {},
    params: [
      {
        name: 'n',
        type: 'number',
        required: true,
        description: 'Number of recent messages to include',
      },
    ],
  },
]);

/**
 * Builds a map from constraint names and aliases to definitions.
 */
export function buildConstraintMap(
  constraints: readonly ConstraintDefinition[]
): Map<string, ConstraintDefinition> {
  const map = new Map<string, ConstraintDefinition>();

  for (const constraint of constraints) {
    map.set(constraint.name, constraint);
    for (const alias of constraint.aliases ?? []) {
      map.set(alias, constraint);
    }
  }

  return map;
}
