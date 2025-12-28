import type {
  AbstractConstraint,
  KernelIR,
  Features,
  TraitStrategy,
  ContextPolicy,
} from '@ctn/language';
import type { ProjectionDetail } from '../projection/index.js';

/**
 * Message in the conversation.
 */
export interface Message {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

/**
 * Strategy support declaration for a provider.
 */
export interface StrategySupport {
  readonly name: string;
  /** SemVer range, e.g., "1.x" or "^1.0.0" */
  readonly versionRange: string;
}

/**
 * Model configuration for a provider.
 */
export interface ModelConfig {
  readonly id: string;
  readonly name: string;
  readonly contextWindow: number;
  readonly defaultMaxTokens: number;
  readonly supportsThinking?: boolean;
  readonly supportsStreaming?: boolean;
}

/**
 * Configuration after projection, ready for API call.
 */
export interface ProjectedConfig {
  readonly model: string;
  readonly apiParams: Record<string, unknown>;
  readonly projectionDetails: Record<string, ProjectionDetail>;
  readonly kernel: string;
  readonly kernelIR: KernelIR;
  readonly contextPolicy: ContextPolicy;
  readonly features: Features;
}

/**
 * Options for send/sendStream operations.
 */
export interface SendOptions {
  /** Manual parameter overrides (highest precedence) */
  readonly overrides?: Record<string, unknown>;
  /** System prompt prefix (prepended to kernel) */
  readonly systemPrefix?: string;
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal;
}

/**
 * Response from a provider.
 */
export interface ProviderResponse {
  readonly id: string;
  readonly model: string;
  readonly content: string;
  readonly finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error';
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
}

/**
 * Streaming chunk from a provider.
 */
export interface StreamChunk {
  readonly type: 'text' | 'done' | 'error';
  readonly text?: string;
  readonly error?: Error;
  readonly usage?: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
}

/**
 * Feature clamp event when projection exceeds feature constraint.
 */
export interface FeatureClampEvent {
  readonly parameter: string;
  readonly projected: number;
  readonly featureValue: number;
  readonly final: number;
  readonly constraintSource: string;
  readonly clampType: 'MIN' | 'MAX' | 'EXCLUSIVE';
}

/**
 * Override collision when override replaces a clamped or projected value.
 */
export interface OverrideCollision {
  readonly parameter: string;
  readonly source: 'feature_clamp' | 'projected';
  readonly originalValue: unknown;
  readonly overrideValue: unknown;
}

/**
 * Token budget calculation for preflight validation.
 */
export interface TokenBudget {
  readonly modelLimit: number;
  readonly systemTokens: number;
  readonly historyTokens: number;
  readonly currentMessageTokens: number;
  readonly reservedOutput: number;
  readonly available: number;
  readonly overBudget: boolean;
}

/**
 * Kernel renderer interface for formatting KernelIR.
 */
export interface KernelRenderer {
  render(ir: KernelIR): string;
}

/**
 * CTN Provider interface.
 *
 * Providers are responsible for:
 * - Projection matrices mapping trait vectors to API parameters
 * - Kernel rendering for the target model
 * - API communication
 */
export interface CTNProvider {
  /** Unique provider identifier */
  readonly id: string;
  /** Human-readable provider name */
  readonly name: string;
  /** Supported models */
  readonly models: readonly ModelConfig[];
  /** Supported strategies and version ranges */
  readonly supportedStrategies: readonly StrategySupport[];

  /**
   * Checks if this provider supports a strategy version.
   */
  supportsStrategy(name: string, version: string): boolean;

  /**
   * Projects an abstract constraint to provider-specific configuration.
   */
  project(ir: AbstractConstraint, model: string): ProjectedConfig;

  /**
   * Renders a KernelIR to provider-specific format.
   */
  renderKernel(kernelIR: KernelIR): string;

  /**
   * Sends a request to the provider.
   */
  send(
    config: ProjectedConfig,
    messages: readonly Message[],
    options?: SendOptions
  ): Promise<ProviderResponse>;

  /**
   * Sends a streaming request to the provider.
   */
  sendStream(
    config: ProjectedConfig,
    messages: readonly Message[],
    options?: SendOptions
  ): AsyncIterableIterator<StreamChunk>;
}
