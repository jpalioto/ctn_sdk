import type {
  TraitVector,
  MutableTraitVector,
  TraitInteraction,
  InteractionResult,
} from '../schemas/index.js';
import { INTERACTION_THRESHOLD, magnitude } from '../schemas/index.js';

/**
 * Resolves trait interactions after composition.
 *
 * Pipeline position:
 *   accumulate() → normalize() → resolveInteractions() → generateKernelIR()
 *
 * CRITICAL INVARIANT: Interactions MUST be non-expansive transforms:
 *   ‖τ'‖ ≤ ‖τ‖ ≤ 1
 *
 * No interaction may increase the magnitude of any trait or the overall
 * vector norm. This preserves the unit-ball constraint.
 *
 * Evaluation order: Interactions are evaluated in array order.
 * First matching interaction for a trait pair wins.
 */
export function resolveInteractions(
  traits: TraitVector,
  interactions: readonly TraitInteraction[]
): InteractionResult {
  const result: MutableTraitVector = [...traits];
  const applied: string[] = [];
  const appliedDetails: TraitInteraction[] = [];
  const processedPairs = new Set<string>();

  for (const interaction of interactions) {
    const [i, j] = interaction.traitIndices;
    const pairKey = i < j ? `${i},${j}` : `${j},${i}`;

    // Skip if this pair was already processed
    if (processedPairs.has(pairKey)) {
      continue;
    }

    // Check if condition is met
    if (conditionMet(result, interaction)) {
      applyResolution(result, interaction);
      applied.push(interaction.id);
      appliedDetails.push(interaction);
      processedPairs.add(pairKey);
    }
  }

  // Verify non-expansive invariant
  const originalMag = magnitude(traits);
  const resultMag = magnitude(result);
  if (resultMag > originalMag + 1e-10) {
    throw new Error(
      `Interaction resolution violated non-expansive invariant: ` +
        `‖τ'‖ = ${resultMag} > ‖τ‖ = ${originalMag}`
    );
  }

  return {
    traits: Object.freeze(result),
    appliedInteractions: applied,
    appliedInteractionDetails: appliedDetails,
  };
}

/**
 * Checks if an interaction's condition is met.
 *
 * Condition thresholds (from spec 4.5.3):
 * | Condition   | Definition                              |
 * |-------------|-----------------------------------------|
 * | both_high   | Both traits have value > 0.5            |
 * | both_low    | Both traits have value < -0.5           |
 * | opposing    | One trait > 0.5 and other < -0.5        |
 */
function conditionMet(
  traits: readonly number[],
  interaction: TraitInteraction
): boolean {
  const [i, j] = interaction.traitIndices;
  const vi = traits[i];
  const vj = traits[j];

  if (vi === undefined || vj === undefined) {
    return false;
  }

  switch (interaction.condition) {
    case 'both_high':
      return vi > INTERACTION_THRESHOLD && vj > INTERACTION_THRESHOLD;

    case 'both_low':
      return vi < -INTERACTION_THRESHOLD && vj < -INTERACTION_THRESHOLD;

    case 'opposing':
      return (
        (vi > INTERACTION_THRESHOLD && vj < -INTERACTION_THRESHOLD) ||
        (vi < -INTERACTION_THRESHOLD && vj > INTERACTION_THRESHOLD)
      );

    default:
      return false;
  }
}

/**
 * Applies an interaction's resolution to the trait vector.
 *
 * Resolution actions (from spec 4.5.3):
 * | Resolution    | Effect                                |
 * |---------------|---------------------------------------|
 * | priority      | Set non-priority trait to 0           |
 * | suppress_both | Set both traits to 0                  |
 * | modify        | Traits unchanged; kernel text changed |
 *
 * All resolutions are non-expansive by design.
 */
function applyResolution(
  traits: MutableTraitVector,
  interaction: TraitInteraction
): void {
  const [i, j] = interaction.traitIndices;

  switch (interaction.resolution) {
    case 'priority':
      // Set the non-priority trait to 0
      if (interaction.priorityIndex === i) {
        traits[j] = 0;
      } else if (interaction.priorityIndex === j) {
        traits[i] = 0;
      }
      break;

    case 'suppress_both':
      // Set both traits to 0
      traits[i] = 0;
      traits[j] = 0;
      break;

    case 'modify':
      // Traits unchanged; kernel generator handles modifiedText
      break;
  }
}

/**
 * Gets the list of trait pairs that have been modified by interactions.
 * Useful for kernel generation to know which traits to handle specially.
 */
export function getModifiedTraitPairs(
  appliedInteractions: readonly TraitInteraction[]
): Set<string> {
  const pairs = new Set<string>();

  for (const interaction of appliedInteractions) {
    if (interaction.resolution === 'modify') {
      const [i, j] = interaction.traitIndices;
      pairs.add(`${i}`);
      pairs.add(`${j}`);
    }
  }

  return pairs;
}
