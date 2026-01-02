import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  MessageStreamEvent,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/messages';
import { OperationalStrategy, CTNStrategy, CTNV2Strategy, NullStrategy, type AbstractConstraint } from '@ctn/language';
import {
  BaseCTNProvider,
  ProviderConnectionError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderModelError,
  ContextWindowOverflowError,
  applyContextPolicy,
  calculateTokenBudget,
  renderKernel,
  resolveContextPolicy,
  projectTraits,
  type ModelConfig,
  type StrategySupport,
  type ProjectedConfig,
  type SendOptions,
  type ProviderResponse,
  type StreamChunk,
  type Message,
} from '@ctn/core';
import { getClaudeModels, resolveModelId, getModelConfig } from './models.js';
import { OPERATIONAL_PROJECTION_MATRIX, CTN_PROJECTION_MATRIX, NULL_PROJECTION_MATRIX } from './projection.js';
import { anthropicRendererPreferences } from './renderer-preferences.js';

/**
 * Options for creating an AnthropicProvider.
 */
export interface AnthropicProviderOptions {
  /**
   * Anthropic API key.
   * Defaults to ANTHROPIC_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Base URL for the Anthropic API.
   * Defaults to https://api.anthropic.com
   */
  baseURL?: string;

  /**
   * Default timeout in milliseconds.
   * Defaults to 60000 (1 minute).
   */
  timeout?: number;

  /**
   * Maximum retries for transient errors.
   * Defaults to 2.
   */
  maxRetries?: number;
}

/**
 * CTN Provider implementation for Anthropic Claude models.
 *
 * Supports:
 * - Claude 4 series (Opus 4, Sonnet 4)
 * - Claude 3.5 series (Sonnet, Haiku)
 * - Claude 3 series (Opus, Sonnet, Haiku)
 *
 * Features:
 * - XML kernel rendering (optimized for Claude)
 * - Operational strategy projection
 * - Streaming support
 * - Extended thinking (Claude 4 models)
 */
export class AnthropicProvider extends BaseCTNProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic';
  readonly supportedStrategies: readonly StrategySupport[] = [
    { name: 'operational', versionRange: '1.x' },
    { name: 'ctn', versionRange: '1.x' },
    { name: 'ctn-v2', versionRange: '2.x' },
    { name: 'null', versionRange: '1.x' },
  ];

  /**
   * Models are loaded lazily from config/models.yaml
   */
  get models(): readonly ModelConfig[] {
    return getClaudeModels();
  }

  private readonly client: Anthropic;
  private readonly defaultTimeout: number;

  /**
   * Dummy kernelRenderer to satisfy abstract requirement.
   * Not used - project() is overridden to use capability negotiation.
   */
  protected readonly kernelRenderer = {
    render: () => {
      throw new Error('kernelRenderer.render() should not be called - use project() override');
    },
  };

  constructor(options: AnthropicProviderOptions = {}) {
    super();

    const {
      apiKey = process.env.ANTHROPIC_API_KEY,
      baseURL,
      timeout = 60000,
      maxRetries = 2,
    } = options;

    this.client = new Anthropic({
      apiKey,
      baseURL,
      timeout,
      maxRetries,
    });

    this.defaultTimeout = timeout;

    // Register strategy projections
    const operationalStrategy = new OperationalStrategy();
    this.registerProjection(operationalStrategy, OPERATIONAL_PROJECTION_MATRIX);

    const ctnStrategy = new CTNStrategy();
    this.registerProjection(ctnStrategy, CTN_PROJECTION_MATRIX);

    // CTN V2 uses same projection matrix as CTN V1 (same dimensions)
    const ctnV2Strategy = new CTNV2Strategy();
    this.registerProjection(ctnV2Strategy, CTN_PROJECTION_MATRIX);

    // Null strategy - no system prompt, default API parameters
    const nullStrategy = new NullStrategy();
    this.registerProjection(nullStrategy, NULL_PROJECTION_MATRIX);
  }

  /**
   * Gets a model configuration by ID or alias.
   * Overrides base to support model aliases.
   */
  protected override getModel(modelIdOrAlias: string): ModelConfig {
    const resolvedId = resolveModelId(modelIdOrAlias);
    const model = this.models.find((m) => m.id === resolvedId);
    if (!model) {
      throw new ProviderModelError(
        this.id,
        modelIdOrAlias,
        this.models.map((m) => m.id)
      );
    }
    return model;
  }

  /**
   * Projects an abstract constraint to provider-specific configuration.
   * Overrides base to use capability negotiation for kernel rendering.
   */
  override project(ir: AbstractConstraint, modelId: string): ProjectedConfig {
    const strategy = ir.strategy;

    // Delegate most work to base class projection logic
    // But we need to call it and then fix the kernel rendering
    // Actually, we need to replicate the logic since base uses kernelRenderer

    // Check strategy is supported
    if (!this.supportsStrategy(strategy.name, strategy.version)) {
      // Let base class handle the error
      return super.project(ir, modelId);
    }

    // Get projection matrix
    const matrix = this.getProjection(strategy.name, strategy.version);
    if (!matrix) {
      // Let base class handle the error
      return super.project(ir, modelId);
    }

    // Validate model
    this.getModel(modelId);

    // Project traits
    const { params, details } = projectTraits(ir.traits, matrix, strategy);

    // Apply feature clamps
    const { clampedParams } = this.applyFeatureClamps(params, ir.features);

    // Render kernel using capability negotiation
    const kernel = renderKernel(strategy, ir.kernelIR, anthropicRendererPreferences);

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
   * Sends a request to Claude and returns the complete response.
   */
  async send(
    config: ProjectedConfig,
    messages: readonly Message[],
    options: SendOptions = {}
  ): Promise<ProviderResponse> {
    const { overrides = {}, signal } = options;

    // Resolve model ID (handle aliases)
    const modelId = resolveModelId(config.model);
    const modelConfig = getModelConfig(modelId);

    if (!modelConfig) {
      throw new Error(`Unknown model: ${config.model}`);
    }

    // The kernel IS the system prompt - no prefixes allowed
    const systemPrompt = config.kernel;

    // Calculate token budget
    const maxTokens = this.resolveMaxTokens(config, overrides, modelConfig);
    const budget = calculateTokenBudget(systemPrompt, messages, modelConfig, maxTokens);

    if (budget.overBudget) {
      throw new ContextWindowOverflowError(this.id, budget);
    }

    // Apply context policy to history
    const history = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];
    const filteredHistory = applyContextPolicy(history, config.contextPolicy);
    const allMessages = currentMessage
      ? [...filteredHistory, currentMessage]
      : [...filteredHistory];

    // Convert to Anthropic message format
    const anthropicMessages = this.convertMessages(allMessages);

    // Apply feature clamps and overrides
    const { finalParams } = this.applyOverrides(
      config.apiParams as Record<string, unknown>,
      overrides
    );

    // Build request params (only include defined values)
    const requestParams = this.buildRequestParams(
      modelId,
      maxTokens,
      systemPrompt,
      anthropicMessages,
      finalParams
    );

    try {
      const response = await this.client.messages.create(requestParams, { signal });

      return {
        id: response.id,
        model: response.model,
        content: this.extractContent(response),
        finishReason: this.mapStopReason(response.stop_reason),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  /**
   * Sends a streaming request to Claude.
   */
  async *sendStream(
    config: ProjectedConfig,
    messages: readonly Message[],
    options: SendOptions = {}
  ): AsyncIterableIterator<StreamChunk> {
    const { overrides = {}, signal } = options;

    // Resolve model ID
    const modelId = resolveModelId(config.model);
    const modelConfig = getModelConfig(modelId);

    if (!modelConfig) {
      throw new Error(`Unknown model: ${config.model}`);
    }

    // The kernel IS the system prompt - no prefixes allowed
    const systemPrompt = config.kernel;

    // Calculate token budget
    const maxTokens = this.resolveMaxTokens(config, overrides, modelConfig);
    const budget = calculateTokenBudget(systemPrompt, messages, modelConfig, maxTokens);

    if (budget.overBudget) {
      throw new ContextWindowOverflowError(this.id, budget);
    }

    // Apply context policy
    const history = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];
    const filteredHistory = applyContextPolicy(history, config.contextPolicy);
    const allMessages = currentMessage
      ? [...filteredHistory, currentMessage]
      : [...filteredHistory];

    const anthropicMessages = this.convertMessages(allMessages);

    // Apply overrides
    const { finalParams } = this.applyOverrides(
      config.apiParams as Record<string, unknown>,
      overrides
    );

    // Build request params for streaming
    const requestParams = this.buildStreamingRequestParams(
      modelId,
      maxTokens,
      systemPrompt,
      anthropicMessages,
      finalParams
    );

    try {
      const stream = this.client.messages.stream(requestParams, { signal });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'message_start' && event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
        }

        if (event.type === 'message_delta' && event.usage) {
          outputTokens = event.usage.output_tokens;
        }

        const chunk = this.processStreamEvent(event, inputTokens, outputTokens);
        if (chunk) {
          yield chunk;
        }
      }
    } catch (error) {
      yield { type: 'error', error: this.wrapError(error) };
    }
  }

  /**
   * Builds request params for non-streaming calls.
   * Note: Claude 4.5 models don't support both temperature and top_p together,
   * so we only use temperature for sampling control.
   */
  private buildRequestParams(
    model: string,
    maxTokens: number,
    system: string,
    messages: MessageParam[],
    params: Record<string, unknown>
  ): MessageCreateParamsNonStreaming {
    const requestParams: MessageCreateParamsNonStreaming = {
      model,
      max_tokens: maxTokens,
      messages,
    };

    // Only include system if non-empty (null strategy returns empty string)
    if (system) {
      requestParams.system = system;
    }

    // Only add optional params if they are defined numbers
    // Note: Claude 4.5 doesn't support temperature + top_p together, so we only use temperature
    if (typeof params.temperature === 'number') {
      requestParams.temperature = params.temperature;
    }
    if (typeof params.top_k === 'number') {
      // top_k must be an integer
      requestParams.top_k = Math.round(params.top_k);
    }
    // Skip top_p - Claude 4.5 models don't allow temperature + top_p together

    return requestParams;
  }

  /**
   * Builds request params for streaming calls.
   * Note: Claude 4.5 models don't support both temperature and top_p together,
   * so we only use temperature for sampling control.
   */
  private buildStreamingRequestParams(
    model: string,
    maxTokens: number,
    system: string,
    messages: MessageParam[],
    params: Record<string, unknown>
  ): Anthropic.MessageCreateParamsStreaming {
    const requestParams: Anthropic.MessageCreateParamsStreaming = {
      model,
      max_tokens: maxTokens,
      messages,
      stream: true,
    };

    // Only include system if non-empty (null strategy returns empty string)
    if (system) {
      requestParams.system = system;
    }

    // Only add optional params if they are defined numbers
    // Note: Claude 4.5 doesn't support temperature + top_p together, so we only use temperature
    if (typeof params.temperature === 'number') {
      requestParams.temperature = params.temperature;
    }
    if (typeof params.top_k === 'number') {
      // top_k must be an integer
      requestParams.top_k = Math.round(params.top_k);
    }
    // Skip top_p - Claude 4.5 models don't allow temperature + top_p together

    return requestParams;
  }

  /**
   * Converts CTN messages to Anthropic message format.
   */
  private convertMessages(messages: readonly Message[]): MessageParam[] {
    return messages
      .filter((m) => m.role !== 'system') // System is handled separately
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  /**
   * Extracts text content from Anthropic response.
   */
  private extractContent(response: Anthropic.Message): string {
    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  /**
   * Maps Anthropic stop reason to CTN finish reason.
   */
  private mapStopReason(
    reason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }

  /**
   * Processes a stream event into a StreamChunk.
   */
  private processStreamEvent(
    event: MessageStreamEvent,
    inputTokens: number,
    outputTokens: number
  ): StreamChunk | null {
    switch (event.type) {
      case 'content_block_delta':
        if (event.delta.type === 'text_delta') {
          return { type: 'text', text: event.delta.text };
        }
        return null;

      case 'message_stop':
        return {
          type: 'done',
          usage: { inputTokens, outputTokens },
        };

      default:
        return null;
    }
  }

  /**
   * Resolves max_tokens from config, overrides, and model defaults.
   */
  private resolveMaxTokens(
    config: ProjectedConfig,
    overrides: Record<string, unknown>,
    modelConfig: ModelConfig
  ): number {
    // Override takes precedence
    if (typeof overrides.max_tokens === 'number') {
      return overrides.max_tokens;
    }

    // Then feature from constraints
    if (typeof config.features.max_tokens === 'number') {
      return config.features.max_tokens;
    }

    // Then model default
    return modelConfig.defaultMaxTokens;
  }

  /**
   * Wraps API errors into CTN error types.
   */
  private wrapError(error: unknown): Error {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        return new ProviderRateLimitError(
          this.id,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      if (error.status >= 500) {
        return new ProviderConnectionError(this.id, error);
      }

      return new ProviderResponseError(this.id, error.status, error.message);
    }

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        return new ProviderConnectionError(this.id, error);
      }
      return error;
    }

    return new Error(String(error));
  }
}
