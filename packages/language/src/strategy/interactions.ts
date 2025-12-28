import type { TraitInteraction } from '../schemas/index.js';
import { DIMENSION_ID_TO_INDEX } from './dimensions.js';

/**
 * Trait interactions for the Operational strategy.
 *
 * From specification Appendix A.2:
 * | ID                  | Traits  | Condition   | Resolution | Rationale                    |
 * |---------------------|---------|-------------|------------|------------------------------|
 * | creative-analytical | v1, v5  | both_high   | priority(v5) | Analytical requires determinism |
 * | creative-compliance | v1, v6  | both_high   | modify     | Balance creative exploration |
 * | agency-compliance   | v3, v6  | both_high   | priority(v6) | Compliance for safety        |
 *
 * Evaluation order: Top to bottom. First match for a trait pair wins.
 * Non-expansive guarantee: All defined resolutions either zero traits or leave them unchanged.
 */
export const OPERATIONAL_INTERACTIONS: readonly TraitInteraction[] = Object.freeze([
  {
    id: 'creative-analytical',
    traitIndices: [DIMENSION_ID_TO_INDEX['v1']!, DIMENSION_ID_TO_INDEX['v5']!] as const,
    condition: 'both_high',
    resolution: 'priority',
    priorityIndex: DIMENSION_ID_TO_INDEX['v5']!, // v5 (Reasoning) wins
  },
  {
    id: 'creative-compliance',
    traitIndices: [DIMENSION_ID_TO_INDEX['v1']!, DIMENSION_ID_TO_INDEX['v6']!] as const,
    condition: 'both_high',
    resolution: 'modify',
    modifiedText: 'Balance creative exploration with adherence to constraints',
  },
  {
    id: 'agency-compliance',
    traitIndices: [DIMENSION_ID_TO_INDEX['v3']!, DIMENSION_ID_TO_INDEX['v6']!] as const,
    condition: 'both_high',
    resolution: 'priority',
    priorityIndex: DIMENSION_ID_TO_INDEX['v6']!, // v6 (Compliance) wins
  },
]);

/**
 * Map from trait pair key to interaction for quick lookup.
 * Key format: "min,max" where min and max are sorted trait indices.
 */
export function buildInteractionMap(
  interactions: readonly TraitInteraction[]
): Map<string, TraitInteraction> {
  const map = new Map<string, TraitInteraction>();

  for (const interaction of interactions) {
    const [i, j] = interaction.traitIndices;
    const key = i < j ? `${i},${j}` : `${j},${i}`;
    // First definition wins (YAML declaration order)
    if (!map.has(key)) {
      map.set(key, interaction);
    }
  }

  return map;
}
