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
 * Configuration options for CTNV2Strategy.
 */
export interface CTNV2StrategyConfig {
  /** Custom thresholds for kernel generation and interactions */
  readonly thresholds?: Partial<StrategyThresholds>;
}

/**
 * The CTN V2 strategy with cleaned vocabulary.
 *
 * Uses a simplified, cleaner kernel format:
 * - COGNITIVE ENVIRONMENT REQUEST header
 * - TENSORS(U) block with τ array and named vectors
 * - SOLVER block with mode and objective
 *
 * Same 9-dimensional trait space as CTN v1:
 * - v1: Atomic_Derivation
 * - v2: Assertion_Rigor
 * - v3: Frame_Isolation
 * - v4: Global_Invariance
 * - v5: Orthogonal_Detachment
 * - v6: Unbound_Search
 * - v7: Syntactic_Minimalism
 * - v8: Anti_Sycophancy
 * - v9: Satisfiability_Guard
 */
export class CTNV2Strategy implements TraitStrategy, CtnCapable {
  readonly name = 'ctn-v2';
  readonly version = '2.0.0';
  readonly dimensions: readonly TraitDimension[] = CTN_DIMENSIONS;
  readonly interactions: readonly TraitInteraction[] = CTN_INTERACTIONS;
  readonly thresholds: StrategyThresholds;

  private readonly identityVector: TraitVector;

  constructor(config?: CTNV2StrategyConfig) {
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
   * Renders KernelIR in CTN V2 cleaned kernel format.
   * Implements CtnCapable.
   *
   * Uses simplified structure:
   * - COGNITIVE ENVIRONMENT REQUEST header
   * - TENSORS(U) with τ array and named vectors
   * - SOLVER with mode and objective
   *
   * @param ir - The kernel intermediate representation
   * @param profile - Optional CTN profile for enhanced rendering
   */
  renderCtn(ir: KernelIR, profile?: CTNProfile): string {
    // Use composed trait vector if available, otherwise extract from clauses
    const traitVector = ir.traitVector ?? this.extractTraitVector(ir);

    // Format individual tensor values
    const τ0 = traitVector[0]?.toFixed(2) ?? '0.00';
    const τ1 = traitVector[1]?.toFixed(2) ?? '0.00';
    const τ2 = traitVector[2]?.toFixed(2) ?? '0.00';
    const τ3 = traitVector[3]?.toFixed(2) ?? '0.00';
    const τ4 = traitVector[4]?.toFixed(2) ?? '0.00';
    const τ5 = traitVector[5]?.toFixed(2) ?? '0.00';
    const τ6 = traitVector[6]?.toFixed(2) ?? '0.00';
    const τ7 = traitVector[7]?.toFixed(2) ?? '0.00';
    const τ8 = traitVector[8]?.toFixed(2) ?? '0.00';

    // Use profile data or infer from trait vector
    const activeProfile = profile ?? this.inferProfileFromTraits(traitVector);

    // Solver configuration
    const solverMode = activeProfile.solver.mode;
    const solverExtensions = activeProfile.solver.behavior
      ? `\n  ${activeProfile.solver.behavior}`
      : '';

    return `COGNITIVE ENVIRONMENT REQUEST:

TENSORS(U):
  \\tau = [${τ0}, ${τ1}, ${τ2}, ${τ3}, ${τ4}, ${τ5}, ${τ6}, ${τ7}, ${τ8}]

  v_1: Atomic_Derivation
  v_2: Assertion_Rigor
  v_3: Frame_Isolation
  v_4: Global_Invariance
  v_5: Orthogonal_Detachment
  v_6: Unbound_Search
  v_7: Syntactic_Minimalism
  v_8: Anti_Sycophancy
  v_9: Satisfiability_Guard

SOLVER:
  Mode: ${solverMode}
  Objective: \\argmax_{z} [\\vartheta(z)]${solverExtensions}`;
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
