import type {
  TraitVector,
  TraitStrategy,
  ResolvedConstraint,
  AbstractConstraint,
  Features,
  TraitInteraction,
  KernelIR,
  InteractionResult,
  MutableTraitVector,
} from '../schemas/index.js';
import { joinFeatures, magnitude } from '../schemas/index.js';
import { resolveInteractions } from './interactions.js';
import { generateKernelIR } from '../kernel/generator.js';

/**
 * Trace of a single constraint being added to the composition.
 */
export interface CompositionStep {
  readonly constraintName: string;
  readonly inputTraits: TraitVector;
  /** Running mean after adding this constraint */
  readonly runningMean: TraitVector;
}

/**
 * Complete trace of the composition process.
 */
export interface CompositionTrace {
  readonly strategy: { name: string; version: string };
  readonly steps: readonly CompositionStep[];
  readonly traitResult: {
    /** Element-wise mean of all constraint trait vectors */
    readonly mean: TraitVector;
    readonly meanLabeled: Record<string, number>;
    /** Final magnitude (for reference, no longer used for normalization) */
    readonly magnitude: number;
    /** Number of constraints averaged */
    readonly constraintCount: number;
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
 *   computeMean() → resolveInteractions() → generateKernelIR()
 *
 * Properties (Guaranteed):
 * | Property      | Guarantee                                       |
 * |---------------|-------------------------------------------------|
 * | Commutative   | Order of constraints does not affect result     |
 * | Associative   | Grouping of constraints does not affect result  |
 * | Bounded       | Result stays in [0,1]^n hypercube               |
 * | Idempotent    | @a @a = @a (same constraint twice = unchanged)  |
 * | Identity      | Empty constraint list → τ = 0                   |
 */
export class Composer<S extends TraitStrategy = TraitStrategy> {
  constructor(private readonly strategy: S) {}

  /**
   * Composes multiple constraints into a single AbstractConstraint.
   *
   * Step 1: Compute element-wise mean of all trait vectors
   * Step 2: Resolve trait interactions
   * Step 3: Join features via lattice operations
   * Step 4: Generate kernel IR
   */
  compose(
    constraints: readonly ResolvedConstraint[],
    interactions: readonly TraitInteraction[] = []
  ): AbstractConstraint<S> {
    // Step 1: Element-wise mean (stays in [0,1] hypercube)
    const meanTraits = this.computeMean(constraints);

    // Step 2: Resolve trait interactions
    const interactionResult = resolveInteractions(
      meanTraits,
      interactions,
      { interactionThreshold: this.strategy.thresholds?.interaction }
    );

    // Step 3: Lattice join for features
    const features = this.joinAllFeatures(constraints);

    // Step 4: Generate kernel IR
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
    const n = constraints.length;
    const dims = n > 0 ? constraints[0]!.traits.length : 0;

    // Track each step with running mean
    const steps: CompositionStep[] = [];
    const runningSum: MutableTraitVector = new Array(dims).fill(0);

    for (let i = 0; i < constraints.length; i++) {
      const constraint = constraints[i]!;
      const inputTraits = constraint.traits;

      // Update running sum
      for (let d = 0; d < dims; d++) {
        runningSum[d] = runningSum[d]! + inputTraits[d]!;
      }

      // Compute running mean at this step
      const count = i + 1;
      const runningMean = runningSum.map(v => v / count);

      steps.push({
        constraintName: constraint.name,
        inputTraits,
        runningMean: Object.freeze([...runningMean]),
      });
    }

    // Final mean
    const meanTraits = this.computeMean(constraints);
    const interactionResult = resolveInteractions(
      meanTraits,
      interactions,
      { interactionThreshold: this.strategy.thresholds?.interaction }
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
        mean: meanTraits,
        meanLabeled: this.strategy.formatVector(meanTraits),
        magnitude: magnitude(meanTraits),
        constraintCount: n,
      },
      interactions: {
        preTraits: meanTraits,
        postTraits: interactionResult.traits,
        applied: interactionResult.appliedInteractions,
      },
      featureResult: features,
      kernelIR,
    };

    return { result, trace };
  }

  /**
   * Computes element-wise mean of all trait vectors.
   *
   * Properties:
   * - Stays in [0,1]^n if all inputs are in [0,1]^n
   * - Idempotent: mean([a, a]) = a
   * - Commutative: order doesn't matter
   * - Returns identity (zero vector) for empty input
   */
  private computeMean(constraints: readonly ResolvedConstraint[]): TraitVector {
    const n = constraints.length;
    if (n === 0) {
      return this.strategy.identity();
    }

    const dims = constraints[0]!.traits.length;
    const sum: MutableTraitVector = new Array(dims).fill(0);

    for (const constraint of constraints) {
      for (let i = 0; i < dims; i++) {
        sum[i] = sum[i]! + constraint.traits[i]!;
      }
    }

    // Divide by count to get mean
    const mean: MutableTraitVector = new Array(dims);
    for (let i = 0; i < dims; i++) {
      mean[i] = sum[i]! / n;
    }

    return Object.freeze(mean);
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
