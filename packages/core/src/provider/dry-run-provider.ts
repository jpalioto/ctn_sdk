import type {
  CTNProvider,
  Message,
  ModelConfig,
  StrategySupport,
  ProjectedConfig,
  SendOptions,
  ProviderResponse,
  StreamChunk,
} from './types.js';

/**
 * DryRunProvider - returns the request without making an API call.
 *
 * This provider captures what would be sent to a real provider and returns
 * it as the response. Useful for:
 * - Debugging and inspection
 * - Testing constraint composition
 * - Validating request structure before sending
 *
 * The response content is a JSON representation of the request for easy inspection.
 * The `request` field contains the structured data for programmatic access.
 */
export class DryRunProvider implements CTNProvider {
  readonly id = 'dry-run';
  readonly name = 'Dry Run';
  readonly models: readonly ModelConfig[] = [];
  readonly supportedStrategies: readonly StrategySupport[] = [
    { name: 'operational', versionRange: '*' },
    { name: 'ctn', versionRange: '*' },
  ];

  /** The provider name that would have been used for the real call */
  private readonly targetProvider: string;

  constructor(targetProvider: string = 'anthropic') {
    this.targetProvider = targetProvider;
  }

  /**
   * DryRunProvider accepts all strategies since it just captures the request.
   */
  supportsStrategy(_name: string, _version: string): boolean {
    return true;
  }

  /**
   * DryRunProvider doesn't do projection - the caller must provide already-projected config.
   * This is by design: buildRequest() handles projection with the real provider,
   * then DryRunProvider just captures the result.
   */
  project(_ir: unknown, _model: string): ProjectedConfig {
    throw new Error(
      'DryRunProvider.project() should not be called. ' +
        'Use the real provider for projection, then pass the result to DryRunProvider.send().'
    );
  }

  /**
   * Returns the request as the response without making an API call.
   */
  async send(
    config: ProjectedConfig,
    messages: readonly Message[],
    _options?: SendOptions
  ): Promise<ProviderResponse> {
    const request = {
      systemPrompt: config.kernel,
      messages,
      parameters: config.apiParams,
      model: config.model,
      provider: this.targetProvider,
    };

    // Return the request as a structured response
    return {
      id: 'dry-run',
      model: config.model,
      content: JSON.stringify(request, null, 2),
      finishReason: 'stop',
      usage: { inputTokens: 0, outputTokens: 0 },
      dryRun: true,
      request,
    };
  }

  /**
   * Streaming is not supported for dry-run - yields single done chunk.
   */
  async *sendStream(
    config: ProjectedConfig,
    messages: readonly Message[],
    _options?: SendOptions
  ): AsyncIterableIterator<StreamChunk> {
    const request = {
      systemPrompt: config.kernel,
      messages,
      parameters: config.apiParams,
      model: config.model,
      provider: this.targetProvider,
    };

    // Yield the request as text
    yield {
      type: 'text',
      text: JSON.stringify(request, null, 2),
    };

    // Yield done
    yield {
      type: 'done',
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }
}
