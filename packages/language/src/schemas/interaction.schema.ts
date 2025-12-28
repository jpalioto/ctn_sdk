import { z } from 'zod';

/**
 * Schema for interaction condition types.
 */
export const InteractionConditionSchema = z.enum(['both_high', 'both_low', 'opposing']);

export type InteractionCondition = z.infer<typeof InteractionConditionSchema>;

/**
 * Schema for interaction resolution types.
 * All resolutions must be non-expansive: ‖τ'‖ ≤ ‖τ‖
 */
export const InteractionResolutionSchema = z.enum(['priority', 'suppress_both', 'modify']);

export type InteractionResolution = z.infer<typeof InteractionResolutionSchema>;

/**
 * Schema for trait interaction rules.
 */
export const TraitInteractionSchema = z.object({
  /** Unique identifier for this interaction */
  id: z.string(),
  /** Indices of the two interacting traits [i, j] */
  traitIndices: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
  /** Condition under which this interaction triggers */
  condition: InteractionConditionSchema,
  /** How to resolve the interaction */
  resolution: InteractionResolutionSchema,
  /** For 'priority' resolution: index of the trait that wins */
  priorityIndex: z.number().int().nonnegative().optional(),
  /** For 'modify' resolution: replacement text for the kernel */
  modifiedText: z.string().optional(),
}).readonly();

export type TraitInteraction = z.infer<typeof TraitInteractionSchema>;

/**
 * Threshold for interaction conditions.
 */
export const INTERACTION_THRESHOLD = 0.5;

/**
 * Schema for interaction result.
 */
export const InteractionResultSchema = z.object({
  /** Trait vector after applying interactions */
  traits: z.array(z.number()).readonly(),
  /** IDs of interactions that were applied */
  appliedInteractions: z.array(z.string()).readonly(),
  /** The interaction objects that were applied */
  appliedInteractionDetails: z.array(TraitInteractionSchema).readonly(),
}).readonly();

export type InteractionResult = z.infer<typeof InteractionResultSchema>;

/**
 * Validates that an interaction is properly defined.
 */
export function validateInteraction(interaction: TraitInteraction): string[] {
  const errors: string[] = [];

  if (interaction.traitIndices[0] === interaction.traitIndices[1]) {
    errors.push(`Interaction ${interaction.id}: trait indices must be different`);
  }

  if (interaction.resolution === 'priority') {
    if (interaction.priorityIndex === undefined) {
      errors.push(`Interaction ${interaction.id}: priority resolution requires priorityIndex`);
    } else if (!interaction.traitIndices.includes(interaction.priorityIndex)) {
      errors.push(
        `Interaction ${interaction.id}: priorityIndex must be one of the trait indices`
      );
    }
  }

  if (interaction.resolution === 'modify') {
    if (!interaction.modifiedText) {
      errors.push(`Interaction ${interaction.id}: modify resolution requires modifiedText`);
    }
  }

  return errors;
}

/**
 * Validates a TraitInteraction structure.
 */
export function parseTraitInteraction(data: unknown): TraitInteraction {
  return TraitInteractionSchema.parse(data);
}

/**
 * Safely validates TraitInteraction, returning result object.
 */
export function safeParseTraitInteraction(data: unknown) {
  return TraitInteractionSchema.safeParse(data);
}

/**
 * Validates an InteractionResult structure.
 */
export function parseInteractionResult(data: unknown): InteractionResult {
  return InteractionResultSchema.parse(data);
}
