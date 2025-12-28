import type {
  TraitVector,
  TraitDimension,
  TraitStrategy,
  ConstraintParams,
  LabeledTraits,
  ConstraintDefinition,
  Features,
  TraitInteraction,
  StrategyThresholds,
  KernelIR,
} from '../../schemas/index.js';
import {
  UnknownConstraintError,
  InvalidConstraintParamError,
} from '../../schemas/index.js';
import type { CtnCapable } from '../../renderer/index.js';
import {
  CTN_DIMENSIONS,
  CTN_DIMENSION_COUNT,
  CTN_DIMENSION_ID_TO_INDEX,
  CTN_DIMENSION_NOTATION,
} from './dimensions.js';
import { CTN_CONSTRAINTS, buildConstraintMap } from './constraints.js';
import { CTN_INTERACTIONS, CTN_INTERACTION_THRESHOLD } from './interactions.js';

/**
 * Configuration options for CTNStrategy.
 */
export interface CTNStrategyConfig {
  /** Custom thresholds for kernel generation and interactions */
  readonly thresholds?: Partial<StrategyThresholds>;
}

/**
 * Default thresholds for CTN strategy.
 *
 * CTN uses 0-1 range, so thresholds are higher than Operational's -1 to +1 range.
 */
const CTN_DEFAULT_THRESHOLDS: StrategyThresholds = Object.freeze({
  kernel: 0.3,       // Include in kernel if value >= 0.3
  interaction: 0.7,  // Trigger interaction if both values >= 0.7
});

/**
 * The CTN strategy for geometric constraint specification.
 *
 * Implements a 7-dimensional constraint space based on the
 * Cognitive Tensor Network specification:
 *
 * - v1: Atomic Clarity (ε_hid → 0⁺)
 * - v2: Specification Accuracy (κ(f) → min)
 * - v3: Context Isolation (Φ:W→I)
 * - v4: Structure Over Narrative (π_gl ≫ π_loc)
 * - v5: Framing Detachment (∂A ≡ A)
 * - v6: Exploration (U \ S)
 * - v7: Schema Compliance (CTN_Form)
 *
 * Unlike Operational strategy (-1 to +1 poles), CTN uses 0-1 range
 * where 0 = no constraint and 1 = maximum constraint.
 *
 * The composition algebra remains the same (unit ball normalization)
 * to preserve associativity and commutativity.
 */
export class CTNStrategy implements TraitStrategy, CtnCapable {
  readonly name = 'ctn';
  readonly version = '1.0.0';
  readonly dimensions: readonly TraitDimension[] = CTN_DIMENSIONS;
  readonly interactions: readonly TraitInteraction[] = CTN_INTERACTIONS;
  readonly thresholds: StrategyThresholds;

  private readonly constraintMap: Map<string, ConstraintDefinition>;
  private readonly identityVector: TraitVector;

  constructor(config?: CTNStrategyConfig) {
    this.constraintMap = buildConstraintMap(CTN_CONSTRAINTS);
    this.identityVector = Object.freeze(new Array(CTN_DIMENSION_COUNT).fill(0));
    this.thresholds = Object.freeze({
      kernel: config?.thresholds?.kernel ?? CTN_DEFAULT_THRESHOLDS.kernel,
      interaction: config?.thresholds?.interaction ?? CTN_DEFAULT_THRESHOLDS.interaction,
    });
  }

  /**
   * Returns the identity element (zero vector).
   * The identity represents "no constraints applied".
   */
  identity(): TraitVector {
    return this.identityVector;
  }

  /**
   * Raw vector addition without normalization.
   * The Composer applies normalization once after all additions.
   *
   * Note: CTN uses 0-1 range but same algebraic composition as Operational.
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
   * @throws UnknownConstraintError if the constraint name is not recognized
   * @throws InvalidConstraintParamError if parameters are invalid
   */
  resolve(name: string, params: ConstraintParams): TraitVector {
    const definition = this.constraintMap.get(name);

    if (!definition) {
      throw new UnknownConstraintError(name, `@${name}`);
    }

    // Handle parameterized constraints
    if (definition.params && definition.params.length > 0) {
      return this.resolveParameterized(definition, params);
    }

    // Convert trait map to vector
    return this.traitsToVector(definition.traits);
  }

  /**
   * Resolves a constraint and returns both traits and features.
   */
  resolveWithFeatures(
    name: string,
    params: ConstraintParams
  ): { traits: TraitVector; features: Features } {
    const definition = this.constraintMap.get(name);

    if (!definition) {
      throw new UnknownConstraintError(name, `@${name}`);
    }

    // Handle parameterized constraints
    if (definition.params && definition.params.length > 0) {
      const traits = this.resolveParameterized(definition, params);
      const features = this.resolveParameterizedFeatures(definition, params);
      return { traits, features };
    }

    return {
      traits: this.traitsToVector(definition.traits),
      features: definition.features ?? {},
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
   * Uses CTN notation style.
   */
  formatVectorCompact(traits: TraitVector): string {
    const parts: string[] = [];
    for (const dim of this.dimensions) {
      const value = traits[dim.index];
      if (value !== undefined && value > 0) {
        parts.push(`${dim.id}:${value.toFixed(2)}`);
      }
    }
    return parts.length > 0 ? `τ=[${parts.join(', ')}]` : 'τ=[0]';
  }

  /**
   * Formats a trait vector as a CTN profile string.
   * Example: τ = [0.9, 0.9, 0.7, 0.9, 0.9, 0.3, 0.0]
   */
  formatProfile(traits: TraitVector): string {
    const values = traits.map(v => v.toFixed(2)).join(', ');
    return `τ = [${values}]`;
  }

  // ===========================================================================
  // Renderer Capabilities
  // ===========================================================================

  /**
   * Renders KernelIR as plain text.
   * For CTN strategy, this outputs the CTN notation format.
   * Implements PlainCapable (via TraitStrategy).
   */
  renderPlain(ir: KernelIR): string {
    return this.renderCtn(ir);
  }

  /**
   * Renders KernelIR in CTN notation format.
   * Implements CtnCapable.
   *
   * CTN format uses geometric notation:
   * - Header with strategy info
   * - Dimension constraints with notation symbols
   * - Modified clauses from interactions
   */
  renderCtn(ir: KernelIR): string {
    const lines: string[] = [];

    // Header
    lines.push('# CTN Kernel');
    lines.push(`# Strategy: ${ir.strategyName} v${ir.strategyVersion}`);
    lines.push('');

    // Dimension constraints
    if (ir.clauses.length > 0) {
      lines.push('## Geometric Constraints');
      lines.push('');

      for (const clause of ir.clauses) {
        const notation = this.getNotation(clause.traitId);
        const intensity = this.formatCtnIntensity(clause.intensity);
        const polarity = clause.polarity === 'positive' ? '↑' : '↓';

        lines.push(`${clause.traitId}: ${notation} ${polarity} [${intensity}]`);
        lines.push(`   ${clause.text}`);
        lines.push('');
      }
    }

    // Modified clauses from interactions
    if (ir.modifiedClauses.length > 0) {
      lines.push('## Interaction Resolutions');
      lines.push('');

      for (const mod of ir.modifiedClauses) {
        lines.push(`${mod.interactionId}:`);
        lines.push(`   ${mod.text}`);
        if (mod.replacedTraits.length > 0) {
          lines.push(`   Replaces: ${mod.replacedTraits.join(', ')}`);
        }
        lines.push('');
      }
    }

    // Omitted traits (for debugging/transparency)
    if (ir.omittedTraits.length > 0) {
      lines.push(`# Omitted (below threshold): ${ir.omittedTraits.join(', ')}`);
    }

    return lines.join('\n').trim();
  }

  /**
   * Formats intensity for CTN notation.
   */
  private formatCtnIntensity(intensity: 'low' | 'medium' | 'high'): string {
    switch (intensity) {
      case 'high':
        return '0.7-1.0';
      case 'medium':
        return '0.4-0.7';
      case 'low':
        return '0.1-0.4';
    }
  }

  /**
   * Gets the CTN notation symbol for a dimension.
   */
  getNotation(dimId: string): string {
    return CTN_DIMENSION_NOTATION[dimId] ?? dimId;
  }

  /**
   * Gets the constraint definition for a name (including aliases).
   */
  getConstraintDefinition(name: string): ConstraintDefinition | undefined {
    return this.constraintMap.get(name);
  }

  /**
   * Checks if a constraint name is known.
   */
  hasConstraint(name: string): boolean {
    return this.constraintMap.has(name);
  }

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
    definition: ConstraintDefinition,
    params: ConstraintParams
  ): TraitVector {
    // Validate required parameters
    for (const paramDef of definition.params ?? []) {
      if (paramDef.required && !(paramDef.name in params)) {
        throw new InvalidConstraintParamError(
          definition.name,
          paramDef.name,
          'required parameter missing',
          `@${definition.name}`
        );
      }

      const value = params[paramDef.name];
      if (value !== undefined) {
        this.validateParamType(definition.name, paramDef.name, value, paramDef.type);
      }
    }

    return this.traitsToVector(definition.traits);
  }

  /**
   * Resolves features for a parameterized constraint.
   */
  private resolveParameterizedFeatures(
    definition: ConstraintDefinition,
    params: ConstraintParams
  ): Features {
    // Special handling for lastN
    if (definition.name === 'lastN') {
      const n = params['n'];
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
        throw new InvalidConstraintParamError(
          definition.name,
          'n',
          'must be a positive integer',
          `@${definition.name}`
        );
      }
      return { context: { type: 'last', n } };
    }

    return definition.features ?? {};
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
}

/**
 * Singleton instance for convenience.
 * Note: Dependency injection is preferred for testability.
 */
export const ctnStrategy = new CTNStrategy();
