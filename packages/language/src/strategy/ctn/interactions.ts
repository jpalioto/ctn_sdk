import type { TraitInteraction } from '../../schemas/index.js';
import { CTN_DIMENSION_ID_TO_INDEX } from './dimensions.js';

/**
 * Trait interactions for the CTN strategy.
 *
 * | ID                   | Traits  | Condition   | Resolution | Rationale                           |
 * |----------------------|---------|-------------|------------|-------------------------------------|
 * | exploration-schema   | v6, v7  | both_high   | modify     | Schema constrains exploration       |
 * | structure-exploration| v4, v6  | both_high   | modify     | Structure limits exploration        |
 * | clarity-exploration  | v1, v6  | both_high   | modify     | Clarity bounds exploration          |
 */
export const CTN_INTERACTIONS: readonly TraitInteraction[] = Object.freeze([
  {
    id: 'exploration-schema',
    traitIndices: [CTN_DIMENSION_ID_TO_INDEX['v6']!, CTN_DIMENSION_ID_TO_INDEX['v7']!] as const,
    condition: 'both_high',
    resolution: 'modify',
    modifiedText: 'Schema compliance constrains exploration bounds',
  },
  {
    id: 'structure-exploration',
    traitIndices: [CTN_DIMENSION_ID_TO_INDEX['v4']!, CTN_DIMENSION_ID_TO_INDEX['v6']!] as const,
    condition: 'both_high',
    resolution: 'modify',
    modifiedText: 'High structure limits exploration to coherent paths',
  },
  {
    id: 'clarity-exploration',
    traitIndices: [CTN_DIMENSION_ID_TO_INDEX['v1']!, CTN_DIMENSION_ID_TO_INDEX['v6']!] as const,
    condition: 'both_high',
    resolution: 'modify',
    modifiedText: 'Atomic clarity bounds exploration to distinct concepts',
  },
]);
