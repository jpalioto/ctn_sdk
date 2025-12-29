import type {
  TraitVector,
  TraitStrategy,
  TraitInteraction,
  KernelIR,
  KernelClause,
  ModifiedClause,
} from '../schemas/index.js';
import {
  getClauseIntensity,
  getClausePolarity,
  DEFAULT_THRESHOLDS,
} from '../schemas/index.js';

/**
 * Generates the kernel intermediate representation from traits.
 *
 * Ownership (from spec 4.6.3):
 * | Layer    | Responsibility                                        |
 * |----------|-------------------------------------------------------|
 * | Strategy | Defines dimension semantics, pole text                |
 * | Language | Generates KernelIR (clauses, omissions, modifications)|
 * | Provider | Formats KernelIR into model-specific syntax           |
 *
 * The provider MUST NOT interpret strategy semantics or generate clause
 * content. It only formats the KernelIR it receives.
 */
export function generateKernelIR(
  traits: TraitVector,
  strategy: TraitStrategy,
  appliedInteractions: readonly TraitInteraction[] = []
): KernelIR {
  const clauses: KernelClause[] = [];
  const omittedTraits: string[] = [];
  const modifiedClauses: ModifiedClause[] = [];

  // Track traits handled by 'modify' interactions
  const modifiedTraitIndices = new Set<number>();

  for (const interaction of appliedInteractions) {
    if (interaction.resolution === 'modify' && interaction.modifiedText) {
      const [i, j] = interaction.traitIndices;
      modifiedTraitIndices.add(i);
      modifiedTraitIndices.add(j);

      modifiedClauses.push({
        interactionId: interaction.id,
        replacedTraits: [
          strategy.dimensions[i]!.id,
          strategy.dimensions[j]!.id,
        ],
        text: interaction.modifiedText,
      });
    }
  }

  // Generate clauses for non-modified traits
  for (const dim of strategy.dimensions) {
    // Skip traits handled by modify interactions
    if (modifiedTraitIndices.has(dim.index)) {
      continue;
    }

    const value = traits[dim.index];
    if (value === undefined) {
      continue;
    }

    const absValue = Math.abs(value);

    // Use strategy's kernel threshold or default
    const kernelThreshold = strategy.thresholds?.kernel ?? DEFAULT_THRESHOLDS.kernel;

    // Skip traits below threshold
    if (absValue < kernelThreshold) {
      omittedTraits.push(dim.id);
      continue;
    }

    // Generate clause for this trait
    const polarity = getClausePolarity(value);
    const text = polarity === 'positive' ? dim.poles.positive : dim.poles.negative;

    clauses.push({
      traitId: dim.id,
      traitIndex: dim.index,
      intensity: getClauseIntensity(absValue),
      polarity,
      text,
    });
  }

  return {
    strategyName: strategy.name,
    strategyVersion: strategy.version,
    clauses,
    omittedTraits,
    modifiedClauses,
    traitVector: [...traits],
  };
}

/**
 * Checks if a kernel IR is empty (no clauses or modifications).
 */
export function isEmptyKernel(kernelIR: KernelIR): boolean {
  return kernelIR.clauses.length === 0 && kernelIR.modifiedClauses.length === 0;
}

/**
 * Gets a summary of the kernel for debugging.
 */
export function summarizeKernel(kernelIR: KernelIR): string {
  const parts: string[] = [];

  parts.push(`Strategy: ${kernelIR.strategyName}@${kernelIR.strategyVersion}`);

  if (kernelIR.clauses.length > 0) {
    const clauseSummaries = kernelIR.clauses.map(
      (c) => `${c.traitId}:${c.polarity}:${c.intensity}`
    );
    parts.push(`Clauses: [${clauseSummaries.join(', ')}]`);
  }

  if (kernelIR.modifiedClauses.length > 0) {
    const modSummaries = kernelIR.modifiedClauses.map((m) => m.interactionId);
    parts.push(`Modified: [${modSummaries.join(', ')}]`);
  }

  if (kernelIR.omittedTraits.length > 0) {
    parts.push(`Omitted: [${kernelIR.omittedTraits.join(', ')}]`);
  }

  return parts.join(' | ');
}
