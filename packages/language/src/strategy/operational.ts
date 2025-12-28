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
} from '../schemas/index.js';
import {
  UnknownConstraintError,
  InvalidConstraintParamError,
  DEFAULT_THRESHOLDS,
} from '../schemas/index.js';
import {
  OPERATIONAL_DIMENSIONS,
  OPERATIONAL_DIMENSION_COUNT,
  DIMENSION_ID_TO_INDEX,
} from './dimensions.js';
import { OPERATIONAL_CONSTRAINTS, buildConstraintMap } from './constraints.js';
import { OPERATIONAL_INTERACTIONS } from './interactions.js';

/**
 * Configuration options for OperationalStrategy.
 */
export interface OperationalStrategyConfig {
  /** Custom thresholds for kernel generation and interactions */
  readonly thresholds?: Partial<StrategyThresholds>;
}

/**
 * The Operational strategy for general-purpose behavioral control.
 *
 * Implements a 7-dimensional trait space:
 * - v1: Stochasticity (creative ↔ deterministic)
 * - v2: Concision (brief ↔ detailed)
 * - v3: Agency (proactive ↔ reactive)
 * - v4: Formality (formal ↔ casual)
 * - v5: Reasoning (analytical ↔ intuitive)
 * - v6: Compliance (strict ↔ flexible)
 * - v7: Context Density (heavy ↔ minimal)
 */
export class OperationalStrategy implements TraitStrategy {
  readonly name = 'operational';
  readonly version = '1.0.0';
  readonly dimensions: readonly TraitDimension[] = OPERATIONAL_DIMENSIONS;
  readonly interactions: readonly TraitInteraction[] = OPERATIONAL_INTERACTIONS;
  readonly thresholds: StrategyThresholds;

  private readonly constraintMap: Map<string, ConstraintDefinition>;
  private readonly identityVector: TraitVector;

  constructor(config?: OperationalStrategyConfig) {
    this.constraintMap = buildConstraintMap(OPERATIONAL_CONSTRAINTS);
    this.identityVector = Object.freeze(new Array(OPERATIONAL_DIMENSION_COUNT).fill(0));
    this.thresholds = Object.freeze({
      kernel: config?.thresholds?.kernel ?? DEFAULT_THRESHOLDS.kernel,
      interaction: config?.thresholds?.interaction ?? DEFAULT_THRESHOLDS.interaction,
    });
  }

  /**
   * Returns the identity element (zero vector).
   * The identity represents "no behavioral modification".
   */
  identity(): TraitVector {
    return this.identityVector;
  }

  /**
   * Raw vector addition without normalization.
   * The Composer applies normalization once after all additions.
   */
  add(a: TraitVector, b: TraitVector): TraitVector {
    if (a.length !== OPERATIONAL_DIMENSION_COUNT) {
      throw new Error(`Vector a has ${a.length} dimensions, expected ${OPERATIONAL_DIMENSION_COUNT}`);
    }
    if (b.length !== OPERATIONAL_DIMENSION_COUNT) {
      throw new Error(`Vector b has ${b.length} dimensions, expected ${OPERATIONAL_DIMENSION_COUNT}`);
    }

    const result = new Array<number>(OPERATIONAL_DIMENSION_COUNT);
    for (let i = 0; i < OPERATIONAL_DIMENSION_COUNT; i++) {
      result[i] = a[i]! + b[i]!;
    }
    return Object.freeze(result);
  }

  /**
   * Resolves a constraint name and parameters to a trait vector and features.
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
    const result = new Array<number>(OPERATIONAL_DIMENSION_COUNT).fill(0);

    for (const [dimId, value] of Object.entries(traits)) {
      const index = DIMENSION_ID_TO_INDEX[dimId];
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

    // For lastN, traits are empty (it only affects features)
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
export const operationalStrategy = new OperationalStrategy();
