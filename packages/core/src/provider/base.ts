import * as semver from 'semver';
import { ZodError } from 'zod';
import type {
  AbstractConstraint,
  KernelIR,
  TraitStrategy,
  Features,
  FeatureLattice,
  FeatureValue,
  isNumericFeature,
} from '@ctn/language';
import type {
  CTNProvider,
  Message,
  ModelConfig,
  StrategySupport,
  ProjectedConfig,
  SendOptions,
  ProviderResponse,
  StreamChunk,
  KernelRenderer,
  FeatureClampEvent,
  OverrideCollision,
} from './types.js';
import type { ApiParams, ApiParamValue } from './schemas.js';
import {
  projectTraits,
  computeProjectionHash,
  createProjectionMatrixSchemaForStrategy,
  type ProjectionMatrix,
} from '../projection/index.js';
import {
  UnsupportedStrategyError,
  StrategyVersionMismatchError,
  InvalidProjectionMatrixError,
  ProviderModelError,
} from './errors.js';
import { resolveContextPolicy } from './context.js';

/**
 * Abstract base implementation of CTNProvider.
 *
 * Provides common functionality:
 * - Projection matrix registration and validation
 * - Strategy version checking
 * - Kernel rendering delegation
 * - Feature clamping (post-projection)
 *
 * Subclasses must implement:
 * - kernelRenderer: Provider-specific kernel formatting
 * - send: Actual API call
 * - sendStream: Streaming API call
 */
export abstract class BaseCTNProvider implements CTNProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly models: readonly ModelConfig[];
  abstract readonly supportedStrategies: readonly StrategySupport[];

  /** Kernel renderer for this provider */
  protected abstract readonly kernelRenderer: KernelRenderer;

  /** Registered projection matrices keyed by "strategyName@version" */
  protected readonly projections = new Map<string, ProjectionMatrix>();

  /** Cached projection hashes */
  protected readonly projectionHashes = new Map<string, string>();

  /**
   * Registers a projection matrix for a strategy.
   * Uses Zod-based validation for type-safe matrix verification.
   *
   * @param strategy - The trait strategy
   * @param matrix - The projection matrix
   * @throws InvalidProjectionMatrixError if matrix is invalid
   */
  protected registerProjection(strategy: TraitStrategy, matrix: ProjectionMatrix): void {
    // Use Zod-based validation with strategy-specific dimension checks
    const schema = createProjectionMatrixSchemaForStrategy(strategy.dimensions.length);

    try {
      schema.parse(matrix);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert ZodError to our error format
        const errors = error.issues.map((issue) => ({
          parameter: issue.path.join('.'),
          issue: 'baseline_out_of_bounds' as const,
          details: issue.message,
        }));
        throw new InvalidProjectionMatrixError(this.id, strategy.name, errors);
      }
      throw error;
    }

    const key = `${strategy.name}@${strategy.version}`;
    this.projections.set(key, matrix);
    this.projectionHashes.set(key, computeProjectionHash(matrix, strategy));
  }

  /**
   * Gets the projection matrix for a strategy.
   */
  protected getProjection(strategyName: string, strategyVersion: string): ProjectionMatrix | undefined {
    return this.projections.get(`${strategyName}@${strategyVersion}`);
  }

  /**
   * Gets the projection hash for a strategy.
   */
  protected getProjectionHash(strategyName: string, strategyVersion: string): string | undefined {
    return this.projectionHashes.get(`${strategyName}@${strategyVersion}`);
  }

  /**
   * Checks if this provider supports a strategy version.
   */
  supportsStrategy(name: string, version: string): boolean {
    const support = this.supportedStrategies.find((s) => s.name === name);
    if (!support) return false;
    return semver.satisfies(version, support.versionRange);
  }

  /**
   * Gets a model configuration by ID.
   */
  protected getModel(modelId: string): ModelConfig {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) {
      throw new ProviderModelError(
        this.id,
        modelId,
        this.models.map((m) => m.id)
      );
    }
    return model;
  }

  /**
   * Projects an abstract constraint to provider-specific configuration.
   */
  project(ir: AbstractConstraint, modelId: string): ProjectedConfig {
    const strategy = ir.strategy;

    // Check strategy is supported
    if (!this.supportsStrategy(strategy.name, strategy.version)) {
      const support = this.supportedStrategies.find((s) => s.name === strategy.name);
      if (support) {
        throw new StrategyVersionMismatchError(
          this.id,
          strategy.name,
          strategy.version,
          support.versionRange
        );
      }
      throw new UnsupportedStrategyError(this.id, strategy.name, strategy.version);
    }

    // Get projection matrix
    const matrix = this.getProjection(strategy.name, strategy.version);
    if (!matrix) {
      throw new UnsupportedStrategyError(this.id, strategy.name, strategy.version);
    }

    // Validate model
    this.getModel(modelId);

    // Project traits
    const { params, details } = projectTraits(ir.traits, matrix, strategy);

    // Apply feature clamps (post-projection)
    const { clampedParams, clampEvents } = this.applyFeatureClamps(params, ir.features);

    // Render kernel
    const kernel = this.kernelRenderer.render(ir.kernelIR);

    return {
      model: modelId,
      apiParams: clampedParams,
      projectionDetails: details,
      kernel,
      kernelIR: ir.kernelIR,
      contextPolicy: resolveContextPolicy(ir.features),
      features: ir.features,
    };
  }

  /**
   * Applies feature clamps as post-projection constraints.
   *
   * Features constrain projection output:
   * - MIN: final = min(projected, feature)
   * - MAX: final = max(projected, feature)
   * - EXCLUSIVE: final = feature (projection discarded)
   */
  protected applyFeatureClamps(
    projected: Record<string, unknown>,
    features: Features
  ): {
    clampedParams: Record<string, unknown>;
    clampEvents: FeatureClampEvent[];
  } {
    const clampedParams = { ...projected };
    const clampEvents: FeatureClampEvent[] = [];

    for (const [key, value] of Object.entries(features)) {
      if (key === 'context' || key === '_lattice') continue;

      const projectedValue = projected[key];
      const lattice = this.getFeatureLattice(key, features);

      // Skip if no projected value or feature value
      if (value === undefined) continue;

      if (typeof value === 'number' && typeof projectedValue === 'number') {
        let finalValue: number;
        let clampType: 'MIN' | 'MAX' | 'EXCLUSIVE';

        switch (lattice) {
          case 'MIN':
            finalValue = Math.min(projectedValue, value);
            clampType = 'MIN';
            break;
          case 'MAX':
            finalValue = Math.max(projectedValue, value);
            clampType = 'MAX';
            break;
          case 'EXCLUSIVE':
          default:
            finalValue = value;
            clampType = 'EXCLUSIVE';
        }

        if (finalValue !== projectedValue) {
          clampEvents.push({
            parameter: key,
            projected: projectedValue,
            featureValue: value,
            final: finalValue,
            constraintSource: this.findFeatureSource(key, features),
            clampType,
          });
        }

        clampedParams[key] = finalValue;
      } else {
        // Non-numeric features: exclusive replacement
        clampedParams[key] = value;
      }
    }

    return { clampedParams, clampEvents };
  }

  /**
   * Gets the lattice type for a feature.
   */
  protected getFeatureLattice(key: string, features: Features): FeatureLattice {
    const latticeMap = features._lattice as Record<string, FeatureLattice> | undefined;
    return latticeMap?.[key] ?? 'EXCLUSIVE';
  }

  /**
   * Finds the constraint source for a feature (for tracing).
   */
  protected findFeatureSource(_key: string, _features: Features): string {
    // In a full implementation, this would track which constraint set each feature
    return 'constraint';
  }

  /**
   * Applies overrides to final parameters.
   */
  protected applyOverrides(
    params: Record<string, unknown>,
    overrides: Record<string, unknown>
  ): {
    finalParams: Record<string, unknown>;
    collisions: OverrideCollision[];
  } {
    const finalParams = { ...params };
    const collisions: OverrideCollision[] = [];

    for (const [key, value] of Object.entries(overrides)) {
      if (key in params && params[key] !== value) {
        collisions.push({
          parameter: key,
          source: 'projected',
          originalValue: params[key],
          overrideValue: value,
        });
      }
      finalParams[key] = value;
    }

    return { finalParams, collisions };
  }

  /**
   * Renders a KernelIR to provider-specific format.
   */
  renderKernel(kernelIR: KernelIR): string {
    return this.kernelRenderer.render(kernelIR);
  }

  /**
   * Sends a request to the provider.
   * Must be implemented by subclasses.
   */
  abstract send(
    config: ProjectedConfig,
    messages: readonly Message[],
    options?: SendOptions
  ): Promise<ProviderResponse>;

  /**
   * Sends a streaming request to the provider.
   * Must be implemented by subclasses.
   */
  abstract sendStream(
    config: ProjectedConfig,
    messages: readonly Message[],
    options?: SendOptions
  ): AsyncIterableIterator<StreamChunk>;
}
