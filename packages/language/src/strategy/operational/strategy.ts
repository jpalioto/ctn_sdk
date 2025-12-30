import type { XmlCapable, MarkdownCapable } from '../../renderer/index.js';
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
  OPERATIONAL_DIMENSIONS,
  OPERATIONAL_DIMENSION_COUNT,
  DIMENSION_ID_TO_INDEX,
} from './dimensions.js';
import { OPERATIONAL_INTERACTIONS } from './interactions.js';
import {
  OPERATIONAL_TRAIT_MAPPINGS,
  OPERATIONAL_STATIC_FEATURES,
  OPERATIONAL_PARAMETERIZED,
  type TraitMap,
} from './traits.js';
import { getConstraintByName } from '../../vocabulary/index.js';

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
export class OperationalStrategy implements TraitStrategy, XmlCapable, MarkdownCapable {
  readonly name = 'operational';
  readonly version = '1.0.0';
  readonly dimensions: readonly TraitDimension[] = OPERATIONAL_DIMENSIONS;
  readonly interactions: readonly TraitInteraction[] = OPERATIONAL_INTERACTIONS;
  readonly thresholds: StrategyThresholds;

  private readonly identityVector: TraitVector;

  constructor(config?: OperationalStrategyConfig) {
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
   * Uses vocabulary for alias resolution, then applies internal trait mappings.
   *
   * @throws UnknownConstraintError if the constraint name is not recognized
   * @throws InvalidConstraintParamError if parameters are invalid
   */
  resolve(name: string, params: ConstraintParams): TraitVector {
    // Resolve alias to primary name via vocabulary
    const primaryName = this.resolvePrimaryName(name);

    // Look up trait mapping
    const traitMap = OPERATIONAL_TRAIT_MAPPINGS[primaryName];
    if (traitMap === undefined) {
      throw new UnknownConstraintError(name, `@${name}`);
    }

    // Handle parameterized constraints
    const paramDefs = OPERATIONAL_PARAMETERIZED[primaryName];
    if (paramDefs && paramDefs.length > 0) {
      return this.resolveParameterized(primaryName, paramDefs, params, traitMap);
    }

    // Convert trait map to vector
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
    const traitMap = OPERATIONAL_TRAIT_MAPPINGS[primaryName];
    if (traitMap === undefined) {
      throw new UnknownConstraintError(name, `@${name}`);
    }

    // Handle parameterized constraints
    const paramDefs = OPERATIONAL_PARAMETERIZED[primaryName];
    if (paramDefs && paramDefs.length > 0) {
      const traits = this.resolveParameterized(primaryName, paramDefs, params, traitMap);
      const features = this.resolveParameterizedFeatures(primaryName, params);
      return { traits, features };
    }

    return {
      traits: this.traitsToVector(traitMap),
      features: OPERATIONAL_STATIC_FEATURES[primaryName] ?? {},
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
   * Checks if a constraint name is known by this strategy.
   * Uses vocabulary for alias resolution.
   */
  hasConstraint(name: string): boolean {
    const primaryName = this.resolvePrimaryName(name);
    return OPERATIONAL_TRAIT_MAPPINGS[primaryName] !== undefined;
  }

  // ===========================================================================
  // Rendering Capabilities
  // ===========================================================================

  /**
   * Renders KernelIR as plain text.
   * Required by PlainCapable (base contract for all strategies).
   */
  renderPlain(ir: KernelIR): string {
    const lines = ['Behavioral Constraints:', ''];

    for (const clause of ir.clauses) {
      const intensity = this.formatIntensity(clause.intensity);
      lines.push(`${clause.traitId}: ${intensity} favor ${clause.text}`);
    }

    for (const mod of ir.modifiedClauses) {
      lines.push(`${mod.interactionId}: ${mod.text}`);
    }

    return lines.join('\n');
  }

  /**
   * Renders KernelIR as XML (preferred by Anthropic Claude models).
   * Implements XmlCapable.
   */
  renderXml(ir: KernelIR): string {
    const lines = ['<behavioral_constraints>'];

    for (const clause of ir.clauses) {
      const intensity = this.formatIntensity(clause.intensity);
      lines.push(
        `  <constraint id="${clause.traitId}">${intensity} favor ${clause.text}</constraint>`
      );
    }

    for (const mod of ir.modifiedClauses) {
      lines.push(`  <constraint id="${mod.interactionId}">${mod.text}</constraint>`);
    }

    lines.push('</behavioral_constraints>');
    return lines.join('\n');
  }

  /**
   * Renders KernelIR as Markdown (preferred by OpenAI models).
   * Implements MarkdownCapable.
   */
  renderMarkdown(ir: KernelIR): string {
    const lines = ['## Behavioral Constraints', ''];

    for (const clause of ir.clauses) {
      const intensity = this.formatIntensity(clause.intensity);
      lines.push(`- **${clause.traitId}**: ${intensity} favor ${clause.text}`);
    }

    for (const mod of ir.modifiedClauses) {
      lines.push(`- **${mod.interactionId}**: ${mod.text}`);
    }

    return lines.join('\n');
  }

  /**
   * Formats clause intensity as a human-readable string.
   */
  private formatIntensity(intensity: 'low' | 'medium' | 'high'): string {
    switch (intensity) {
      case 'high':
        return 'Strongly';
      case 'medium':
        return 'Moderately';
      case 'low':
        return 'Slightly';
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

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

    // Convert trait map to vector
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

    return OPERATIONAL_STATIC_FEATURES[constraintName] ?? {};
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
   * Resolves a constraint name (or alias) to its primary name via vocabulary.
   * Returns the input if not found in vocabulary (handled by caller).
   */
  private resolvePrimaryName(nameOrAlias: string): string {
    const constraint = getConstraintByName(nameOrAlias);
    return constraint?.name ?? nameOrAlias;
  }
}

/**
 * Singleton instance for convenience.
 * Note: Dependency injection is preferred for testability.
 */
export const operationalStrategy = new OperationalStrategy();
