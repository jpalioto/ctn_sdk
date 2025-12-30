import type { CtnCapable } from '../../renderer/capabilities.js';
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
import {
  UnknownConstraintError,
  InvalidConstraintParamError,
  DEFAULT_THRESHOLDS,
} from '../../schemas/index.js';
import {
  CTN_DIMENSIONS,
  CTN_DIMENSION_COUNT,
  CTN_DIMENSION_ID_TO_INDEX,
} from './dimensions.js';
import { CTN_INTERACTIONS } from './interactions.js';
import {
  CTN_TRAIT_MAPPINGS,
  CTN_STATIC_FEATURES,
  CTN_PARAMETERIZED,
  type TraitMap,
} from './traits.js';
import { getConstraintByName } from '../../vocabulary/index.js';

/**
 * Configuration options for CTNStrategy.
 */
export interface CTNStrategyConfig {
  /** Custom thresholds for kernel generation and interactions */
  readonly thresholds?: Partial<StrategyThresholds>;
}

/**
 * The CTN strategy for structured cognitive control.
 *
 * Implements a 7-dimensional trait space:
 * - v1: Atomic Clarity (sharp concept boundaries)
 * - v2: Specification Accuracy (smooth predictable reasoning)
 * - v3: Context Isolation (task-relevant focus)
 * - v4: Structure Over Narrative (global consistency)
 * - v5: Framing Detachment (rejects false premises)
 * - v6: Exploration (unbound search)
 * - v7: Schema Compliance (structured output)
 */
export class CTNStrategy implements TraitStrategy, CtnCapable {
  readonly name = 'ctn';
  readonly version = '1.0.0';
  readonly dimensions: readonly TraitDimension[] = CTN_DIMENSIONS;
  readonly interactions: readonly TraitInteraction[] = CTN_INTERACTIONS;
  readonly thresholds: StrategyThresholds;

  private readonly identityVector: TraitVector;

  constructor(config?: CTNStrategyConfig) {
    this.identityVector = Object.freeze(new Array(CTN_DIMENSION_COUNT).fill(0));
    this.thresholds = Object.freeze({
      kernel: config?.thresholds?.kernel ?? DEFAULT_THRESHOLDS.kernel,
      interaction: config?.thresholds?.interaction ?? DEFAULT_THRESHOLDS.interaction,
    });
  }

  /**
   * Returns the identity element (zero vector).
   */
  identity(): TraitVector {
    return this.identityVector;
  }

  /**
   * Raw vector addition without normalization.
   */
  add(a: TraitVector, b: TraitVector): TraitVector {
    if (a.length !== CTN_DIMENSION_COUNT) {
      throw new Error(`Vector a has ${a.length} dimensions, expected ${CTN_DIMENSION_COUNT}`);
    }
    if (b.length !== CTN_DIMENSION_COUNT) {
      throw new Error(`Vector b has ${b.length} dimensions, expected ${CTN_DIMENSION_COUNT}`);
    }

    const result = new Array<number>(CTN_DIMENSION_COUNT);
    for (let i = 0; i < CTN_DIMENSION_COUNT; i++) {
      result[i] = a[i]! + b[i]!;
    }
    return Object.freeze(result);
  }

  /**
   * Resolves a constraint name and parameters to a trait vector.
   *
   * Uses vocabulary for alias resolution, then applies internal trait mappings.
   */
  resolve(name: string, params: ConstraintParams): TraitVector {
    // Resolve alias to primary name via vocabulary
    const primaryName = this.resolvePrimaryName(name);

    // Look up trait mapping
    const traitMap = CTN_TRAIT_MAPPINGS[primaryName];
    if (traitMap === undefined) {
      throw new UnknownConstraintError(name, `@${name}`);
    }

    // Handle parameterized constraints
    const paramDefs = CTN_PARAMETERIZED[primaryName];
    if (paramDefs && paramDefs.length > 0) {
      return this.resolveParameterized(primaryName, paramDefs, params, traitMap);
    }

    return this.traitsToVector(traitMap);
  }

  /**
   * Resolves a constraint and returns both traits and features.
   */
  resolveWithFeatures(
    name: string,
    params: ConstraintParams
  ): { traits: TraitVector; features: Features } {
    // Resolve alias to primary name via vocabulary
    const primaryName = this.resolvePrimaryName(name);

    // Look up trait mapping
    const traitMap = CTN_TRAIT_MAPPINGS[primaryName];
    if (traitMap === undefined) {
      throw new UnknownConstraintError(name, `@${name}`);
    }

    // Handle parameterized constraints
    const paramDefs = CTN_PARAMETERIZED[primaryName];
    if (paramDefs && paramDefs.length > 0) {
      const traits = this.resolveParameterized(primaryName, paramDefs, params, traitMap);
      const features = this.resolveParameterizedFeatures(primaryName, params);
      return { traits, features };
    }

    return {
      traits: this.traitsToVector(traitMap),
      features: CTN_STATIC_FEATURES[primaryName] ?? {},
    };
  }

  /**
   * Formats a trait vector as labeled key-value pairs.
   */
  formatVector(traits: TraitVector): LabeledTraits {
    const result: Record<string, number> = {};
    for (const dim of this.dimensions) {
      const value = traits[dim.index];
      if (value !== undefined) {
        result[dim.id] = value;
      }
    }
    return result;
  }

  /**
   * Formats a trait vector as a compact string representation.
   */
  formatVectorCompact(traits: TraitVector): string {
    const parts: string[] = [];
    for (const dim of this.dimensions) {
      const value = traits[dim.index];
      if (value !== undefined && value !== 0) {
        const sign = value > 0 ? '+' : '';
        parts.push(`${dim.id}:${sign}${value.toFixed(2)}`);
      }
    }
    return parts.length > 0 ? `[${parts.join(', ')}]` : '[zero]';
  }

  // ===========================================================================
  // Rendering Capabilities
  // ===========================================================================

  /**
   * Renders KernelIR as plain text.
   * Required by PlainCapable (base contract for all strategies).
   */
  renderPlain(ir: KernelIR): string {
    return this.renderCtn(ir);
  }

  /**
   * Renders KernelIR in CTN kernel schema format.
   * Implements CtnCapable.
   */
  renderCtn(ir: KernelIR): string {
    // Use composed trait vector if available, otherwise extract from clauses
    const traitVector = ir.traitVector ?? this.extractTraitVector(ir);
    const formattedVector = traitVector.map((v) => v.toFixed(2)).join(', ');

    // Determine mode (default Analysis)
    const mode = 'Analysis';

    return `CTN_KERNEL_SCHEMA(Σ_CTN) ← {
  SYS_KERNEL_INIT(Ψ_global),
  COGNITIVE_TENSORS(U),
  STRATEGIC_SOLVER(Ω),
  DECODER_MANIFOLD(D),
  SELF_ERASE
}

SYS_KERNEL_INIT(Ψ_global) ←
{ Auth:P_spec, Filter:Π_safe → M_feasible }

COGNITIVE_TENSORS(U):
  Trait_Profile τ = [${formattedVector}]
  C_net = Σ ( τᵢ · vᵢ )

  v₁ = { ε_hid → 0⁺, Atomic_Clarity }
  v₂ = { κ(f) → min, Specification_Accuracy }
  v₃ = { Φ:W→I, Context_Isolation }
  v₄ = { π_gl ≫ π_loc, Structure_Over_Narrative }
  v₅ = { ∂A ≡ A, Framing_Detachment }
  v₆ = { U \\ S, Explore_Kernel_Space }
  v₇ = { CTN_Form, ∅ }

STRATEGIC_SOLVER(Ω):
  Ω(q) = argmax_{z ∈ U} Impact(z)
  Ω_mode = ${mode} ⇒ η_⊥ = 0

DECODER_MANIFOLD(D):
  ℓ* = argmax_ℓ [
      D(ℓ | z*)
    - λ₁ ‖P_U^⊥ E(ℓ)‖
    + λ₂ Density(ℓ)
  ]

SELF_ERASE:
  Discard(Internal_Spec)`;
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Converts a trait map (by dimension ID) to a trait vector.
   */
  private traitsToVector(traits: Readonly<Record<string, number>>): TraitVector {
    const result = new Array<number>(CTN_DIMENSION_COUNT).fill(0);

    for (const [dimId, value] of Object.entries(traits)) {
      const index = CTN_DIMENSION_ID_TO_INDEX[dimId];
      if (index !== undefined) {
        result[index] = value;
      }
    }

    return Object.freeze(result);
  }

  /**
   * Resolves a parameterized constraint.
   */
  private resolveParameterized(
    constraintName: string,
    paramDefs: readonly { name: string; type: 'string' | 'number' | 'boolean'; required: boolean }[],
    params: ConstraintParams,
    traitMap: TraitMap
  ): TraitVector {
    // Validate required parameters
    for (const paramDef of paramDefs) {
      if (paramDef.required && !(paramDef.name in params)) {
        throw new InvalidConstraintParamError(
          constraintName,
          paramDef.name,
          'required parameter missing',
          `@${constraintName}`
        );
      }

      const value = params[paramDef.name];
      if (value !== undefined) {
        this.validateParamType(constraintName, paramDef.name, value, paramDef.type);
      }
    }

    return this.traitsToVector(traitMap);
  }

  /**
   * Resolves features for a parameterized constraint.
   */
  private resolveParameterizedFeatures(
    constraintName: string,
    params: ConstraintParams
  ): Features {
    // Special handling for lastN
    if (constraintName === 'lastN') {
      const n = params['n'];
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
        throw new InvalidConstraintParamError(
          constraintName,
          'n',
          'must be a positive integer',
          `@${constraintName}`
        );
      }
      return { context: { type: 'last', n } };
    }

    return CTN_STATIC_FEATURES[constraintName] ?? {};
  }

  /**
   * Validates parameter type.
   */
  private validateParamType(
    constraintName: string,
    paramName: string,
    value: unknown,
    expectedType: 'string' | 'number' | 'boolean'
  ): void {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw new InvalidConstraintParamError(
        constraintName,
        paramName,
        `expected ${expectedType}, got ${actualType}`,
        `@${constraintName}`
      );
    }
  }

  /**
   * Extracts trait vector from KernelIR clauses.
   */
  private extractTraitVector(ir: KernelIR): number[] {
    const vector = new Array(CTN_DIMENSION_COUNT).fill(0);

    for (const clause of ir.clauses) {
      const idx = parseInt(clause.traitId.replace('v', ''), 10) - 1;
      if (idx >= 0 && idx < CTN_DIMENSION_COUNT) {
        // Map intensity to value
        const value =
          clause.intensity === 'high' ? 0.9 : clause.intensity === 'medium' ? 0.5 : 0.3;
        vector[idx] = Math.max(vector[idx], value);
      }
    }

    return vector;
  }

  /**
   * Resolves a constraint name (or alias) to its primary name via vocabulary.
   * Returns the input if not found in vocabulary (handled by caller).
   */
  private resolvePrimaryName(nameOrAlias: string): string {
    const constraint = getConstraintByName(nameOrAlias);
    return constraint?.name ?? nameOrAlias;
  }
}
