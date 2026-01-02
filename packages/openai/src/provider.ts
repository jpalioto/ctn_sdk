import OpenAI from 'openai';
import { OperationalStrategy, CTNStrategy, CTNV2Strategy, type AbstractConstraint } from '@ctn/language';
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
import { OPENAI_MODELS, resolveModelId, getModelConfig } from './models.js';
import { OPERATIONAL_PROJECTION_MATRIX, CTN_PROJECTION_MATRIX } from './projection.js';
import { openaiRendererPreferences } from './renderer-preferences.js';

/**
 * Options for creating an OpenAIProvider.
 */
export interface OpenAIProviderOptions {
  /**
   * OpenAI API key.
   * Defaults to OPENAI_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Default timeout in milliseconds.
   * Defaults to 60000 (1 minute).
   */
  timeout?: number;
}

/**
 * CTN Provider implementation for OpenAI GPT-5 models.
 *
 * Uses the Responses API for GPT-5 family:
 * - GPT-5.2 / GPT-5.2 Pro
 * - GPT-5.1 / GPT-5.1 Codex
 * - GPT-5 Mini
 *
 * Features:
 * - Markdown/CTN kernel rendering
 * - Operational and CTN strategy projection
 * - Streaming support
 */
export class OpenAIProvider extends BaseCTNProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly supportedStrategies: readonly StrategySupport[] = [
    { name: 'operational', versionRange: '1.x' },
    { name: 'ctn', versionRange: '1.x' },
    { name: 'ctn-v2', versionRange: '2.x' },
  ];

  /**
   * Available models.
   */
  get models(): readonly ModelConfig[] {
    return Object.values(OPENAI_MODELS);
  }

  private readonly client: OpenAI;
  private readonly defaultTimeout: number;

  constructor(options: OpenAIProviderOptions = {}) {
    super();

    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY or pass apiKey option.');
    }

    this.client = new OpenAI({ apiKey });
    this.defaultTimeout = options.timeout ?? 60000;

    // Register strategy projections
    const operationalStrategy = new OperationalStrategy();
    this.registerProjection(operationalStrategy, OPERATIONAL_PROJECTION_MATRIX);

    const ctnStrategy = new CTNStrategy();
    this.registerProjection(ctnStrategy, CTN_PROJECTION_MATRIX);

    // CTN V2 uses same projection matrix as CTN V1 (same dimensions)
    const ctnV2Strategy = new CTNV2Strategy();
    this.registerProjection(ctnV2Strategy, CTN_PROJECTION_MATRIX);
  }

  /**
   * Gets a model configuration by ID or alias.
   */
  protected override getModel(modelIdOrAlias: string): ModelConfig {
    const resolvedId = resolveModelId(modelIdOrAlias);
    const openaiConfig = getModelConfig(resolvedId);

    if (!openaiConfig) {
      throw new ProviderModelError(
        this.id,
        modelIdOrAlias,
        this.models.map((m) => m.id)
      );
    }

    return openaiConfig;
  }

  /**
   * Projects an abstract constraint to provider-specific configuration.
   * Overrides base to use capability negotiation for kernel rendering.
   */
  override project(ir: AbstractConstraint, modelId: string): ProjectedConfig {
    const strategy = ir.strategy;

    // Check strategy is supported
    if (!this.supportsStrategy(strategy.name, strategy.version)) {
      return super.project(ir, modelId);
    }

    // Get projection matrix
    const matrix = this.getProjection(strategy.name, strategy.version);
    if (!matrix) {
      return super.project(ir, modelId);
    }

    // Validate model
    this.getModel(modelId);

    // Project traits
    const { params, details } = projectTraits(ir.traits, matrix, strategy);

    // Apply feature clamps
    const { clampedParams } = this.applyFeatureClamps(params, ir.features);

    // Render kernel using capability negotiation
    const kernel = renderKernel(strategy, ir.kernelIR, openaiRendererPreferences);

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
   * Sends a request to OpenAI using the Responses API.
   */
  async send(
    config: ProjectedConfig,
    messages: readonly Message[],
    options: SendOptions = {}
  ): Promise<ProviderResponse> {
    const { overrides = {} } = options;

    // Resolve model ID
    const modelId = resolveModelId(config.model);
    const modelConfig = this.getModel(modelId);

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
    const allMessages = currentMessage ? [...filteredHistory, currentMessage] : [...filteredHistory];

    // Build Responses API input
    const input = this.buildResponsesInput(allMessages, systemPrompt);

    // Apply overrides
    const { finalParams } = this.applyOverrides(config.apiParams as Record<string, unknown>, overrides);

    try {
      // Build request params without undefined values (exactOptionalPropertyTypes)
      const requestParams: Record<string, unknown> = {
        model: modelId,
        input,
        max_output_tokens: maxTokens,
        reasoning: { effort: 'medium' },
      };
      if (typeof finalParams.temperature === 'number') {
        requestParams.temperature = finalParams.temperature;
      }
      if (typeof finalParams.top_p === 'number') {
        requestParams.top_p = finalParams.top_p;
      }

      const response = await (this.client as unknown as { responses: { create: (params: unknown) => Promise<ResponsesAPIResponse> } }).responses.create(requestParams);

      const text = response.output_text ?? '';

      return {
        id: response.id ?? `openai-${Date.now()}`,
        model: modelId,
        content: text,
        finishReason: this.mapFinishReason(response.status),
        usage: {
          inputTokens: response.usage?.input_tokens ?? 0,
          outputTokens: response.usage?.output_tokens ?? 0,
        },
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  /**
   * Sends a streaming request to OpenAI using the Responses API.
   */
  async *sendStream(
    config: ProjectedConfig,
    messages: readonly Message[],
    options: SendOptions = {}
  ): AsyncIterableIterator<StreamChunk> {
    const { overrides = {} } = options;

    // Resolve model ID
    const modelId = resolveModelId(config.model);
    const modelConfig = this.getModel(modelId);

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
    const allMessages = currentMessage ? [...filteredHistory, currentMessage] : [...filteredHistory];

    const input = this.buildResponsesInput(allMessages, systemPrompt);

    // Apply overrides
    const { finalParams } = this.applyOverrides(config.apiParams as Record<string, unknown>, overrides);

    try {
      // Build request params without undefined values (exactOptionalPropertyTypes)
      const requestParams: Record<string, unknown> = {
        model: modelId,
        input,
        max_output_tokens: maxTokens,
        reasoning: { effort: 'medium' },
        stream: true,
      };
      if (typeof finalParams.temperature === 'number') {
        requestParams.temperature = finalParams.temperature;
      }
      if (typeof finalParams.top_p === 'number') {
        requestParams.top_p = finalParams.top_p;
      }

      const stream = await (this.client as unknown as { responses: { create: (params: unknown) => Promise<AsyncIterable<ResponsesStreamEvent>> } }).responses.create(requestParams);

      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          yield { type: 'text', text: event.delta ?? '' };
        }
        if (event.type === 'response.completed' && event.response?.usage) {
          totalInputTokens = event.response.usage.input_tokens ?? 0;
          totalOutputTokens = event.response.usage.output_tokens ?? 0;
        }
      }

      yield {
        type: 'done',
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    } catch (error) {
      yield { type: 'error', error: this.wrapError(error) };
    }
  }

  /**
   * Builds Responses API input format from CTN messages.
   */
  private buildResponsesInput(
    messages: readonly Message[],
    systemPrompt: string
  ): ResponsesInputItem[] {
    const result: ResponsesInputItem[] = [];

    // Add system message
    if (systemPrompt) {
      result.push({
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }],
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role === 'system') continue; // Skip system messages, we handle them separately
      result.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: [{ type: 'input_text', text: msg.content }],
      });
    }

    return result;
  }

  /**
   * Maps OpenAI response status to CTN finish reason.
   */
  private mapFinishReason(
    status: string | undefined
  ): 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' {
    switch (status) {
      case 'completed':
        return 'stop';
      case 'incomplete':
        return 'length';
      case 'failed':
        return 'error';
      default:
        return 'stop';
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
    if (typeof overrides.max_tokens === 'number') {
      return overrides.max_tokens;
    }
    if (typeof config.features.max_tokens === 'number') {
      return config.features.max_tokens;
    }
    return modelConfig.defaultMaxTokens;
  }

  /**
   * Wraps API errors into CTN error types.
   */
  private wrapError(error: unknown): Error {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes('api key') ||
        message.includes('unauthorized') ||
        message.includes('401') ||
        message.includes('invalid_api_key')
      ) {
        return new ProviderConnectionError(this.id, error);
      }
      if (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('rate_limit_exceeded')
      ) {
        return new ProviderRateLimitError(this.id);
      }
      if (message.includes('500') || message.includes('503')) {
        return new ProviderConnectionError(this.id, error);
      }

      return new ProviderResponseError(this.id, 500, error.message);
    }

    return new ProviderConnectionError(this.id, new Error(String(error)));
  }
}

// Type definitions for Responses API (not yet in OpenAI SDK types)
interface ResponsesInputItem {
  role: 'system' | 'user' | 'assistant';
  content: Array<{ type: 'input_text'; text: string }>;
}

interface ResponsesAPIResponse {
  id?: string;
  output_text?: string;
  status?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

interface ResponsesStreamEvent {
  type: string;
  delta?: string;
  response?: {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
}
