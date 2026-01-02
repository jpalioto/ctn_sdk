import { GoogleGenAI } from '@google/genai';
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
import { GEMINI_MODELS, resolveModelId, getModelConfig } from './models.js';
import { OPERATIONAL_PROJECTION_MATRIX, CTN_PROJECTION_MATRIX, NULL_PROJECTION_MATRIX } from './projection.js';
import { geminiRendererPreferences } from './renderer-preferences.js';

/**
 * Options for creating a GoogleProvider.
 */
export interface GoogleProviderOptions {
  /**
   * Google API key.
   * Defaults to GEMINI_API_KEY or GOOGLE_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Default timeout in milliseconds.
   * Defaults to 60000 (1 minute).
   */
  timeout?: number;
}

/**
 * CTN Provider implementation for Google Gemini models.
 *
 * Supports:
 * - Gemini 3 Pro/Flash (preview)
 * - Gemini 2.5 Pro/Flash/Flash-Lite
 * - Gemini 2.0 Flash
 *
 * Features:
 * - Markdown/CTN kernel rendering
 * - Operational and CTN strategy projection
 * - Streaming support
 */
export class GoogleProvider extends BaseCTNProvider {
  readonly id = 'google';
  readonly name = 'Google';
  readonly supportedStrategies: readonly StrategySupport[] = [
    { name: 'operational', versionRange: '1.x' },
    { name: 'ctn', versionRange: '1.x' },
    { name: 'ctn-v2', versionRange: '2.x' },
    { name: 'null', versionRange: '1.x' },
  ];

  /**
   * Available models.
   */
  get models(): readonly ModelConfig[] {
    return Object.values(GEMINI_MODELS);
  }

  private readonly client: GoogleGenAI;
  private readonly defaultTimeout: number;

  constructor(options: GoogleProviderOptions = {}) {
    super();

    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Google API key required. Set GEMINI_API_KEY or pass apiKey option.'
      );
    }

    this.client = new GoogleGenAI({ apiKey });
    this.defaultTimeout = options.timeout ?? 60000;

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
   */
  protected override getModel(modelIdOrAlias: string): ModelConfig {
    const resolvedId = resolveModelId(modelIdOrAlias);
    const geminiConfig = getModelConfig(resolvedId);

    if (!geminiConfig) {
      throw new ProviderModelError(
        this.id,
        modelIdOrAlias,
        this.models.map((m) => m.id)
      );
    }

    return geminiConfig;
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
    const kernel = renderKernel(strategy, ir.kernelIR, geminiRendererPreferences);

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
   * Sends a request to Gemini and returns the complete response.
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

    // Build contents string from messages
    const contents = this.buildContents(allMessages);

    // Apply overrides
    const { finalParams } = this.applyOverrides(config.apiParams as Record<string, unknown>, overrides);

    try {
      // Build generation config without undefined values (exactOptionalPropertyTypes)
      const genConfig: Record<string, unknown> = {
        maxOutputTokens: maxTokens,
      };
      // Only include system instruction if non-empty (null strategy returns empty string)
      if (systemPrompt) {
        genConfig.systemInstruction = systemPrompt;
      }
      if (typeof finalParams.temperature === 'number') {
        genConfig.temperature = finalParams.temperature;
      }
      if (typeof finalParams.top_k === 'number') {
        genConfig.topK = Math.round(finalParams.top_k);
      }
      if (typeof finalParams.top_p === 'number') {
        genConfig.topP = finalParams.top_p;
      }

      const response = await this.client.models.generateContent({
        model: modelId,
        contents,
        config: genConfig,
      });

      const text = response.text ?? '';

      return {
        id: `gemini-${Date.now()}`,
        model: modelId,
        content: text,
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  /**
   * Sends a streaming request to Gemini.
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

    const contents = this.buildContents(allMessages);

    // Apply overrides
    const { finalParams } = this.applyOverrides(config.apiParams as Record<string, unknown>, overrides);

    try {
      // Build generation config without undefined values (exactOptionalPropertyTypes)
      const genConfig: Record<string, unknown> = {
        maxOutputTokens: maxTokens,
      };
      // Only include system instruction if non-empty (null strategy returns empty string)
      if (systemPrompt) {
        genConfig.systemInstruction = systemPrompt;
      }
      if (typeof finalParams.temperature === 'number') {
        genConfig.temperature = finalParams.temperature;
      }
      if (typeof finalParams.top_k === 'number') {
        genConfig.topK = Math.round(finalParams.top_k);
      }
      if (typeof finalParams.top_p === 'number') {
        genConfig.topP = finalParams.top_p;
      }

      const stream = await this.client.models.generateContentStream({
        model: modelId,
        contents,
        config: genConfig,
      });

      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          yield { type: 'text', text };
        }

        // Track usage from chunks
        if (chunk.usageMetadata) {
          totalInputTokens = chunk.usageMetadata.promptTokenCount ?? totalInputTokens;
          totalOutputTokens = chunk.usageMetadata.candidatesTokenCount ?? totalOutputTokens;
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
   * Builds contents string from messages.
   * The new SDK accepts a string or array of content parts.
   */
  private buildContents(messages: readonly Message[]): string {
    // Filter out system messages and build conversation
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    if (nonSystemMessages.length === 0) {
      return '';
    }

    // For simple single-turn, just return the last user message
    if (nonSystemMessages.length === 1) {
      return nonSystemMessages[0]!.content;
    }

    // For multi-turn, format as conversation
    return nonSystemMessages
      .map((m) => {
        const role = m.role === 'assistant' ? 'Assistant' : 'User';
        return `${role}: ${m.content}`;
      })
      .join('\n\n');
  }

  /**
   * Maps Gemini finish reason to CTN finish reason.
   */
  private mapFinishReason(
    reason: string | undefined
  ): 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'content_filter';
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

      if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
        return new ProviderConnectionError(this.id, error);
      }
      if (message.includes('rate limit') || message.includes('quota') || message.includes('429')) {
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
