import type { TraitInteraction } from '../../schemas/index.js';

/**
 * CTN Strategy Interactions
 *
 * Defines how dimension conflicts are resolved when multiple
 * high-intensity constraints are combined.
 *
 * CTN dimensions use 0-1 range, so "both_high" means both > 0.7
 *
 * Dimension indices:
 * - v1 (Atomic Clarity) = 0
 * - v2 (Specification Accuracy) = 1
 * - v3 (Context Isolation) = 2
 * - v4 (Structure Over Narrative) = 3
 * - v5 (Framing Detachment) = 4
 * - v6 (Exploration) = 5
 * - v7 (Schema Compliance) = 6
 *
 * Key principle: interactions are NON-EXPANSIVE (‖τ'‖ ≤ ‖τ‖)
 */

export const CTN_INTERACTIONS: readonly TraitInteraction[] = Object.freeze([
  {
    id: 'exploration-schema',
    traitIndices: [5, 6] as const, // v6 (Exploration), v7 (Schema Compliance)
    condition: 'both_high',
    resolution: 'priority',
    priorityIndex: 6, // Schema compliance wins - structured output takes precedence
  },
  {
    id: 'structure-exploration',
    traitIndices: [3, 5] as const, // v4 (Structure), v6 (Exploration)
    condition: 'both_high',
    resolution: 'modify',
    modifiedText: 'Maintain structural integrity; exploration constrained to formal variations',
  },
  {
    id: 'isolation-exploration',
    traitIndices: [2, 5] as const, // v3 (Context Isolation), v6 (Exploration)
    condition: 'both_high',
    resolution: 'modify',
    modifiedText: 'Explore within isolated context; external connections suppressed',
  },
]);

/**
 * Threshold for "high" in CTN space (0-1 range).
 * Default: 0.7 (compared to 0.5 for Operational's -1 to +1 range)
 */
export const CTN_INTERACTION_THRESHOLD = 0.7;
