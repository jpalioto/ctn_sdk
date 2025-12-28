import type { ProjectionValidationError } from '../projection/types.js';
import type { TokenBudget } from './types.js';

/**
 * Base error class for all provider errors.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Thrown when a provider doesn't support a strategy.
 */
export class UnsupportedStrategyError extends ProviderError {
  constructor(
    providerId: string,
    public readonly strategyName: string,
    public readonly strategyVersion: string
  ) {
    super(
      `Provider '${providerId}' does not support strategy '${strategyName}@${strategyVersion}'`,
      providerId
    );
    this.name = 'UnsupportedStrategyError';
  }
}

/**
 * Thrown when strategy version is incompatible with provider's supported range.
 */
export class StrategyVersionMismatchError extends ProviderError {
  constructor(
    providerId: string,
    public readonly strategyName: string,
    public readonly irVersion: string,
    public readonly providerRange: string
  ) {
    super(
      `Strategy version mismatch: IR uses '${strategyName}@${irVersion}', ` +
        `provider supports '${providerRange}'`,
      providerId
    );
    this.name = 'StrategyVersionMismatchError';
  }
}

/**
 * Thrown when a projection matrix is invalid.
 */
export class InvalidProjectionMatrixError extends ProviderError {
  constructor(
    providerId: string,
    public readonly strategyName: string,
    public readonly errors: readonly ProjectionValidationError[]
  ) {
    const errorSummary = errors.map((e) => `${e.parameter}: ${e.issue}`).join(', ');
    super(
      `Invalid projection matrix for strategy '${strategyName}': ${errorSummary}`,
      providerId
    );
    this.name = 'InvalidProjectionMatrixError';
  }
}

/**
 * Thrown when context window would be exceeded.
 */
export class ContextWindowOverflowError extends ProviderError {
  constructor(
    providerId: string,
    public readonly budget: TokenBudget
  ) {
    super(
      `Context window exceeded by ${Math.abs(budget.available)} tokens. ` +
        `System: ${budget.systemTokens}, History: ${budget.historyTokens}, ` +
        `Current: ${budget.currentMessageTokens}, Reserved: ${budget.reservedOutput}`,
      providerId
    );
    this.name = 'ContextWindowOverflowError';
  }
}

/**
 * Thrown when a provider connection fails.
 */
export class ProviderConnectionError extends ProviderError {
  constructor(
    providerId: string,
    public readonly cause: Error
  ) {
    super(`Failed to connect to provider '${providerId}': ${cause.message}`, providerId);
    this.name = 'ProviderConnectionError';
  }
}

/**
 * Thrown when a provider rate limits the request.
 */
export class ProviderRateLimitError extends ProviderError {
  constructor(
    providerId: string,
    public readonly retryAfter?: number
  ) {
    super(
      `Rate limited by provider '${providerId}'` +
        (retryAfter ? `. Retry after ${retryAfter}s` : ''),
      providerId
    );
    this.name = 'ProviderRateLimitError';
  }
}

/**
 * Thrown when a model is not supported.
 */
export class ProviderModelError extends ProviderError {
  constructor(
    providerId: string,
    public readonly modelId: string,
    public readonly supportedModels: readonly string[]
  ) {
    super(
      `Model '${modelId}' is not supported by provider '${providerId}'. ` +
        `Supported: ${supportedModels.join(', ')}`,
      providerId
    );
    this.name = 'ProviderModelError';
  }
}

/**
 * Thrown when a provider returns an error response.
 */
export class ProviderResponseError extends ProviderError {
  constructor(
    providerId: string,
    public readonly statusCode: number,
    public readonly body: unknown
  ) {
    super(`Provider '${providerId}' returned error ${statusCode}`, providerId);
    this.name = 'ProviderResponseError';
  }
}
