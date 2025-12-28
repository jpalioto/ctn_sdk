import type { TraitInteraction } from '../../schemas/index.js';

/**
 * CTN Strategy Interactions
 *
 * Defines how dimension conflicts are resolved when multiple
 * high-intensity constraints are combined.
 *
 * CTN dimensions use 0-1 range, so "both_high" means both > 0.7
 *
 * Key principle: interactions are NON-EXPANSIVE (‖τ'‖ ≤ ‖τ‖)
 */

export const CTN_INTERACTIONS: readonly TraitInteraction[] = Object.freeze([
  {
    id: 'exploration-schema',
    description: 'High exploration conflicts with high schema compliance',
    traits: ['v6', 'v7'],
    condition: 'both_high',
    resolution: 'priority',
    priorityIndex: 1, // Schema compliance wins - structured output takes precedence
  },
  {
    id: 'structure-exploration',
    description: 'High structure priority limits exploration',
    traits: ['v4', 'v6'],
    condition: 'both_high',
    resolution: 'modify',
    // When both high, reduce exploration to maintain structural integrity
    modifyFn: (v4: number, v6: number) => ({
      v4,
      v6: Math.min(v6, 1 - v4 * 0.5), // Exploration capped as structure increases
    }),
  },
  {
    id: 'isolation-exploration',
    description: 'High context isolation reduces meaningful exploration',
    traits: ['v3', 'v6'],
    condition: 'both_high',
    resolution: 'modify',
    // Can't explore much if you're ignoring context
    modifyFn: (v3: number, v6: number) => ({
      v3,
      v6: Math.min(v6, 1 - v3 * 0.3),
    }),
  },
]);

/**
 * Threshold for "high" in CTN space (0-1 range).
 * Default: 0.7 (compared to 0.5 for Operational's -1 to +1 range)
 */
export const CTN_INTERACTION_THRESHOLD = 0.7;
