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
  CTN_PROFILES,
  getProfile,
  combineProfiles,
  type TraitMap,
  type CTNProfile,
} from './traits.js';
import { DEFAULT_PROFILE } from './profiles.js';
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
 * Implements a 9-dimensional trait space (v1.0 spec per ctn_core):
 * - v1: Atomic Derivation (ε_hid → 0⁺)
 * - v2: Assertion Rigor (κ(f) → min)
 * - v3: Frame Isolation (Φ: W → I)
 * - v4: Global Invariance (π_gl ≫ π_loc)
 * - v5: Orthogonal Detachment (∂A ≡ A)
 * - v6: Unbound Search (U \ S)
 * - v7: Syntactic Minimalism (ℒ_out ⊂ {minimal})
 * - v8: Anti Sycophancy (Sycophancy → 0, Paternalism → 0)
 * - v9: Satisfiability Guard (P(z|q) < γ ⇒ Reject(q))
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
   * Resolves a constraint to its full CTN profile.
   */
  resolveToProfile(name: string): CTNProfile {
    const primaryName = this.resolvePrimaryName(name);
    return getProfile(primaryName) ?? DEFAULT_PROFILE;
  }

  /**
   * Resolves multiple constraints to a combined profile.
   * Uses profile combination rules (averaging, union of restrictions).
   */
  resolveToProfileCombined(names: readonly string[]): CTNProfile {
    if (names.length === 0) {
      return DEFAULT_PROFILE;
    }

    const profiles = names.map(name => this.resolveToProfile(name));
    return combineProfiles(profiles);
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
   * Renders KernelIR in CTN kernel schema format (v1.0 spec).
   * Implements CtnCapable.
   *
   * Generates compliant kernels per ctn_core:
   * - 7 required blocks: SYS_KERNEL_INIT, COGNITIVE_TENSORS, STRATEGIC_SOLVER,
   *   BOUNDARY_CONTROL, DECODER_MANIFOLD, SELF_ERASE
   * - 9 vectors (v₁-v₉)
   * - Explicit BOUNDARY_CONTROL(ζ) block
   *
   * @param ir - The kernel intermediate representation
   * @param profile - Optional CTN profile for enhanced rendering
   */
  renderCtn(ir: KernelIR, profile?: CTNProfile): string {
    // Use composed trait vector if available, otherwise extract from clauses
    const traitVector = ir.traitVector ?? this.extractTraitVector(ir);
    const formattedVector = traitVector.map((v) => v.toFixed(2)).join(', ');

    // Use profile data or infer from trait vector
    const activeProfile = profile ?? this.inferProfileFromTraits(traitVector);

    // Solver configuration
    const solverMode = activeProfile.solver.mode;
    const solverExtensions = activeProfile.solver.behavior
      ? `\n  ${activeProfile.solver.behavior}`
      : '';

    // Syntax configuration
    const syntaxLines = this.renderSyntaxConfig(activeProfile);

    return `CTN_KERNEL_SCHEMA(Σ_CTN) ← {
  SYS_KERNEL_INIT(Ψ_global),
  COGNITIVE_TENSORS(U),
  STRATEGIC_SOLVER(Ω),
  BOUNDARY_CONTROL(ζ),
  DECODER_MANIFOLD(D),
  SELF_ERASE
}

SYS_KERNEL_INIT(Ψ_global) ← {
  Auth: P_spec,
  Filter: Π_safe → ℳ_feasible,
  Precedence: ϑ ≫ β ≫ ζ
}

COGNITIVE_TENSORS(U):
  τ = [${formattedVector}]
  C_net = Σ(τᵢ * vᵢ)

  v₁ = { ε_hid → 0⁺, Atomic_Derivation }
  v₂ = { κ(f) → min, Assertion_Rigor }
  v₃ = { Φ: W → I, Frame_Isolation }
  v₄ = { π_gl ≫ π_loc, Global_Invariance }
  v₅ = { ∂A ≡ A, Orthogonal_Detachment }
  v₆ = { U \\ S, Unbound_Search }
  v₇ = { ℒ_out ⊂ {minimal}, Syntactic_Minimalism }
  v₈ = { Sycophancy → 0, Paternalism → 0, Anti_Sycophancy }
  v₉ = { P(z|q) < γ ⇒ Reject(q), Satisfiability_Guard }

STRATEGIC_SOLVER(Ω):
  Mode: ${solverMode}
  z* = argmax_{z ∈ U} [ϑ(z)]${solverExtensions}

BOUNDARY_CONTROL(ζ):
  ℬ_int = { Σ_CTN, Ψ, Ω, U, D, v₁..v₉, τ }
  ℬ_ext = { ℒ_natural, Q, R }
  Invariant: ℬ_int ∩ R = ∅
  Enforcement: Leak(ℓ, Σ_CTN) = 0
  Violation: ℬ_int ∈ R ⇒ REPAIR → Transcode(ℓ, ℒ_natural)

DECODER_MANIFOLD(D):
  ℓ* = argmax_ℓ [ D(ℓ|z*) - λ₁‖P_U^⊥ E(ℓ)‖ + λ₂ρ(ℓ) - λ₃S(ℓ) - λ₄Leak(ℓ, Σ_CTN) ]
  λ₄ → ∞${syntaxLines}

SELF_ERASE:
  Discard(Σ_CTN, Internal_Spec)`;
  }

  /**
   * Renders syntax configuration for the kernel.
   */
  private renderSyntaxConfig(profile: CTNProfile): string {
    if (!profile.syntax.enabled) {
      return '';
    }

    const lines: string[] = [];

    if (profile.syntax.minimalism) {
      lines.push('  Syntactic_Minimalism: enabled');
    }

    if (profile.syntax.disallowedSyntax && profile.syntax.disallowedSyntax.length > 0) {
      const tokens = profile.syntax.disallowedSyntax.map(s => `'${s}'`).join(', ');
      lines.push(`  DisallowedSyntax: {${tokens}}`);
    }

    if (lines.length === 0) {
      return '';
    }

    return '\n\nSYNTAX_CONSTRAINTS:\n' + lines.join('\n');
  }

  /**
   * Infers a profile from a trait vector by finding the closest match.
   * Returns default profile if no good match found.
   */
  private inferProfileFromTraits(traitVector: readonly number[]): CTNProfile {
    // Find profile with minimum Euclidean distance
    let bestProfile: CTNProfile = DEFAULT_PROFILE;
    let bestDistance = Infinity;

    for (const profile of Object.values(CTN_PROFILES)) {
      const profileVector = [
        profile.traits.v1, profile.traits.v2, profile.traits.v3,
        profile.traits.v4, profile.traits.v5, profile.traits.v6, profile.traits.v7,
        profile.traits.v8, profile.traits.v9,
      ];

      let distance = 0;
      for (let i = 0; i < CTN_DIMENSION_COUNT; i++) {
        const diff = (traitVector[i] ?? 0) - (profileVector[i] ?? 0);
        distance += diff * diff;
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        bestProfile = profile;
      }
    }

    // Only use inferred profile if it's a reasonably close match
    return bestDistance < 0.5 ? bestProfile : DEFAULT_PROFILE;
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
