import type {
  TraitVector,
  TraitStrategy,
  ResolvedConstraint,
  AbstractConstraint,
  Features,
  TraitInteraction,
  KernelIR,
  InteractionResult,
} from '../schemas/index.js';
import { joinFeatures } from '../schemas/index.js';
import { saturateWithInfo, type SaturationResult } from './saturate.js';
import { resolveInteractions } from './interactions.js';
import { generateKernelIR } from '../kernel/generator.js';

/**
 * Trace of a single constraint being added to the composition.
 */
export interface CompositionStep {
  readonly constraintName: string;
  readonly inputTraits: TraitVector;
  readonly runningSum: TraitVector;
}

/**
 * Complete trace of the composition process.
 */
export interface CompositionTrace {
  readonly strategy: { name: string; version: string };
  readonly steps: readonly CompositionStep[];
  readonly traitResult: {
    readonly raw: TraitVector;
    readonly rawLabeled: Record<string, number>;
    readonly normalized: TraitVector;
    readonly normalizedLabeled: Record<string, number>;
    readonly wasNormalized: boolean;
    readonly normMagnitude: number;
  };
  readonly interactions: {
    readonly preTraits: TraitVector;
    readonly postTraits: TraitVector;
    readonly applied: readonly string[];
  };
  readonly featureResult: Features;
  readonly kernelIR: KernelIR;
}

/**
 * The Composer implements n-ary constraint composition.
 *
 * CRITICAL: Composition is an N-ARY OPERATION, not iterative binary composition.
 * This guarantees associativity and commutativity.
 *
 * Pipeline:
 *   accumulate() → saturate() → resolveInteractions() → generateKernelIR()
 *
 * Properties (Guaranteed):
 * | Property      | Guarantee                                    |
 * |---------------|----------------------------------------------|
 * | Commutative   | Order of constraints does not affect result  |
 * | Associative   | Grouping of constraints does not affect result |
 * | Bounded       | ‖τ‖ ≤ 1 after composition                    |
 * | Identity      | Empty constraint list → τ = 0                |
 */
export class Composer<S extends TraitStrategy = TraitStrategy> {
  constructor(private readonly strategy: S) {}

  /**
   * Composes multiple constraints into a single AbstractConstraint.
   *
   * Step 1: Accumulate all trait vectors as raw sums (no normalization)
   * Step 2: Apply saturating normalization once
   * Step 3: Resolve trait interactions
   * Step 4: Join features via lattice operations
   * Step 5: Generate kernel IR
   */
  compose(
    constraints: readonly ResolvedConstraint[],
    interactions: readonly TraitInteraction[] = []
  ): AbstractConstraint<S> {
    // Step 1: Raw accumulation (no normalization)
    const rawSum = this.accumulate(constraints);

    // Step 2: Single-point saturation
    const saturationResult = saturateWithInfo(rawSum);

    // Step 3: Resolve trait interactions
    const interactionResult = resolveInteractions(
      saturationResult.traits,
      interactions
    );

    // Step 4: Lattice join for features
    const features = this.joinAllFeatures(constraints);

    // Step 5: Generate kernel IR
    const kernelIR = generateKernelIR(
      interactionResult.traits,
      this.strategy,
      interactionResult.appliedInteractionDetails
    );

    return {
      strategy: this.strategy,
      traits: interactionResult.traits,
      features,
      kernelIR,
    };
  }

  /**
   * Composes constraints and returns a detailed trace.
   */
  composeWithTrace(
    constraints: readonly ResolvedConstraint[],
    interactions: readonly TraitInteraction[] = []
  ): { result: AbstractConstraint<S>; trace: CompositionTrace } {
    // Track each step
    const steps: CompositionStep[] = [];
    let runningSum = this.strategy.identity();

    for (const constraint of constraints) {
      const inputTraits = constraint.traits;
      runningSum = this.strategy.add(runningSum, inputTraits);
      steps.push({
        constraintName: constraint.name,
        inputTraits,
        runningSum: [...runningSum],
      });
    }

    const rawSum = runningSum;
    const saturationResult = saturateWithInfo(rawSum);
    const interactionResult = resolveInteractions(
      saturationResult.traits,
      interactions
    );
    const features = this.joinAllFeatures(constraints);
    const kernelIR = generateKernelIR(
      interactionResult.traits,
      this.strategy,
      interactionResult.appliedInteractionDetails
    );

    const result: AbstractConstraint<S> = {
      strategy: this.strategy,
      traits: interactionResult.traits,
      features,
      kernelIR,
    };

    const trace: CompositionTrace = {
      strategy: {
        name: this.strategy.name,
        version: this.strategy.version,
      },
      steps,
      traitResult: {
        raw: rawSum,
        rawLabeled: this.strategy.formatVector(rawSum),
        normalized: saturationResult.traits,
        normalizedLabeled: this.strategy.formatVector(saturationResult.traits),
        wasNormalized: saturationResult.wasNormalized,
        normMagnitude: saturationResult.postMagnitude,
      },
      interactions: {
        preTraits: saturationResult.traits,
        postTraits: interactionResult.traits,
        applied: interactionResult.appliedInteractions,
      },
      featureResult: features,
      kernelIR,
    };

    return { result, trace };
  }

  /**
   * Accumulates trait vectors via raw addition.
   * No normalization is applied during accumulation.
   */
  private accumulate(constraints: readonly ResolvedConstraint[]): TraitVector {
    return constraints.reduce(
      (acc, c) => this.strategy.add(acc, c.traits),
      this.strategy.identity()
    );
  }

  /**
   * Joins all features using lattice operations.
   */
  private joinAllFeatures(constraints: readonly ResolvedConstraint[]): Features {
    return constraints.map((c) => c.features).reduce(joinFeatures, {});
  }
}

/**
 * Convenience function for one-shot composition.
 */
export function compose<S extends TraitStrategy>(
  strategy: S,
  constraints: readonly ResolvedConstraint[],
  interactions: readonly TraitInteraction[] = []
): AbstractConstraint<S> {
  const composer = new Composer(strategy);
  return composer.compose(constraints, interactions);
}

/**
 * Convenience function for composition with trace.
 */
export function composeWithTrace<S extends TraitStrategy>(
  strategy: S,
  constraints: readonly ResolvedConstraint[],
  interactions: readonly TraitInteraction[] = []
): { result: AbstractConstraint<S>; trace: CompositionTrace } {
  const composer = new Composer(strategy);
  return composer.composeWithTrace(constraints, interactions);
}
