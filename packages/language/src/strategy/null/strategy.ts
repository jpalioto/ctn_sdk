import type {
  TraitVector,
  TraitDimension,
  TraitStrategy,
  ConstraintParams,
  LabeledTraits,
  Features,
  TraitInteraction,
  StrategyThresholds,
  KernelIR,
} from '../../schemas/index.js';

/**
 * Null strategy that produces no system prompt.
 *
 * Used for baseline testing where we want to send requests
 * without any cognitive steering or system prompt.
 *
 * - No dimensions (empty trait space)
 * - No interactions
 * - renderPlain() returns empty string
 */
export class NullStrategy implements TraitStrategy {
  readonly name = 'null';
  readonly version = '1.0.0';
  readonly dimensions: readonly TraitDimension[] = [];
  readonly interactions: readonly TraitInteraction[] = [];
  readonly thresholds: StrategyThresholds = { kernel: 0, interaction: 0 };

  /**
   * Returns empty identity vector.
   */
  identity(): TraitVector {
    return [];
  }

  /**
   * Addition is identity (returns first argument).
   */
  add(a: TraitVector, _b: TraitVector): TraitVector {
    return a;
  }

  /**
   * All constraints resolve to empty vector.
   */
  resolve(_name: string, _params: ConstraintParams): TraitVector {
    return [];
  }

  /**
   * All constraints resolve to empty traits and features.
   */
  resolveWithFeatures(
    _name: string,
    _params: ConstraintParams
  ): { traits: TraitVector; features: Features } {
    return { traits: [], features: {} };
  }

  /**
   * Format vector as empty object.
   */
  formatVector(_traits: TraitVector): LabeledTraits {
    return {};
  }

  /**
   * Format vector as [null] indicator.
   */
  formatVectorCompact(_traits: TraitVector): string {
    return '[null]';
  }

  /**
   * Render kernel as empty string (no system prompt).
   */
  renderPlain(_ir: KernelIR): string {
    return '';
  }
}
