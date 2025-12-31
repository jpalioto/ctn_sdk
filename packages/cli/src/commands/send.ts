import {
  parse,
  OperationalStrategy,
  CTNStrategy,
  Composer,
  type TraitStrategy,
  type ResolvedConstraint,
  type AbstractConstraint,
} from '@ctn/language';
import {
  sanitizeInput,
  DryRunProvider,
  type Message,
  type ProjectedConfig,
  type BaseCTNProvider,
  type CTNProvider,
  type ProviderResponse,
} from '@ctn/core';
import { formatTrace, formatDryRun } from '../output/formatter.js';
import {
  fetchGrounding,
  formatGroundingContext,
  type GroundingResult,
} from '../grounding.js';
import { getProvider, getDefaultModel } from '../providers.js';

export interface SendOptions {
  provider: string;
  model?: string;
  strategy: string;
  ground?: string;
  stream?: boolean;
  trace?: boolean;
  dryRun?: boolean;
}

/**
 * Unified result from processSend.
 * Provider determines response type via dryRun flag.
 */
export interface SendResult {
  response: ProviderResponse;
  trace: TraceInfo;
}

export interface TraceInfo {
  constraint: AbstractConstraint;
  config: ProjectedConfig;
  strategy: TraitStrategy;
  groundingResult: GroundingResult | null;
  providerName: string;
}

/**
 * Gets a strategy instance based on strategy name.
 * This switch is acceptable - it's at the CLI boundary translating user input to types.
 */
export function getStrategy(name: string): TraitStrategy {
  switch (name.toLowerCase()) {
    case 'ctn':
      return new CTNStrategy();
    case 'operational':
    default:
      return new OperationalStrategy();
  }
}

/**
 * Parses a prompt that may contain CTN constraints.
 * Extracts constraints and returns both the abstract constraint and clean prompt.
 */
function parsePromptWithConstraints(
  prompt: string,
  strategy: TraitStrategy
): { constraint: AbstractConstraint; cleanPrompt: string } {
  const parsed = parse(prompt);
  const composer = new Composer(strategy);

  // Resolve each parsed constraint
  const resolved: ResolvedConstraint[] = parsed.constraints.map((pc) => {
    const { traits, features } = strategy.resolveWithFeatures(pc.name, pc.params);
    return {
      name: pc.name,
      params: pc.params,
      traits,
      features,
    };
  });

  // Compose all constraints (or use identity if none)
  const constraint = composer.compose(resolved, strategy.interactions);

  // Extract the clean prompt (prompt without constraints)
  // The parsed.prompt contains the remaining text after constraint extraction
  const cleanPrompt = parsed.prompt.trim() || prompt;

  return { constraint, cleanPrompt };
}

export interface ProcessSendOptions {
  provider?: string;
  model?: string;
  strategy?: string;
  ground?: string;
  dryRun?: boolean;
  /** Pre-created provider instance (for connection pooling) */
  providerInstance?: BaseCTNProvider;
}

/**
 * Built request - contains everything needed to send to a provider.
 * This structure is identical regardless of dry-run, stream, or normal mode.
 */
export interface BuiltRequest {
  config: ProjectedConfig;
  messages: Message[];
  trace: TraceInfo;
}

/**
 * Builds a complete request - always identical, no branches for dry-run/stream.
 *
 * This is the single source of truth for request construction.
 * Whether the request is executed, streamed, or dry-run depends on
 * which provider's send() method is called afterward.
 *
 * @param input - The prompt with optional @constraints
 * @param options - Processing options
 * @returns Built request ready for any provider
 */
export async function buildRequest(
  input: string,
  options: ProcessSendOptions
): Promise<BuiltRequest> {
  // Sanitize input before processing
  const sanitizedInput = sanitizeInput(input);

  const providerName = options.provider ?? 'anthropic';
  const strategyName = options.strategy ?? 'operational';

  // Initialize strategy and provider for projection
  const strategy = getStrategy(strategyName);
  const provider = options.providerInstance ?? getProvider(providerName);

  // Resolve model - use option or provider default
  const model = options.model ?? getDefaultModel(providerName);

  // Fetch grounding content if requested
  let groundingResult: GroundingResult | null = null;
  if (options.ground) {
    groundingResult = await fetchGrounding(options.ground);
  }

  // Parse prompt and extract constraints (using sanitized input)
  const { constraint, cleanPrompt } = parsePromptWithConstraints(sanitizedInput, strategy);

  // Project to provider-specific config
  const config: ProjectedConfig = provider.project(constraint, model);

  // Build final prompt with grounding context
  const promptWithContext = groundingResult
    ? formatGroundingContext(groundingResult.content, groundingResult.source) + '\n\n' + cleanPrompt
    : cleanPrompt;

  // Build messages
  const messages: Message[] = [{ role: 'user', content: promptWithContext }];

  // Build trace info
  const trace: TraceInfo = {
    constraint,
    config,
    strategy,
    groundingResult,
    providerName,
  };

  return { config, messages, trace };
}

/**
 * Core send processing logic - reusable by CLI and HTTP server.
 * Uses single code path: buildRequest() → provider.send()
 *
 * The provider determines behavior:
 * - Real provider: makes API call
 * - DryRunProvider: returns request without API call
 *
 * @param input - The prompt with optional @constraints
 * @param options - Processing options including optional pre-created provider
 */
export async function processSend(
  input: string,
  options: ProcessSendOptions
): Promise<SendResult> {
  const providerName = options.provider ?? 'anthropic';

  // Build request - ALWAYS the same, complete
  const { config, messages, trace } = await buildRequest(input, options);

  // Get provider - DryRunProvider if dry-run, else real provider
  const provider: CTNProvider = options.dryRun
    ? new DryRunProvider(providerName)
    : (options.providerInstance ?? getProvider(providerName));

  // Single call - provider determines behavior
  const response = await provider.send(config, messages);

  return { response, trace };
}

/**
 * The send command implementation (CLI wrapper).
 */
export async function sendCommand(
  prompt: string,
  options: SendOptions
): Promise<void> {
  const { provider: providerName, model: modelOption, strategy: strategyName, ground, stream, trace, dryRun } = options;

  try {
    // Build request once - identical for all modes
    const { config, messages, trace: traceInfo } = await buildRequest(prompt, {
      provider: providerName,
      model: modelOption,
      strategy: strategyName,
      ground,
    });

    // Show trace if requested (before response for streaming visibility)
    if (trace) {
      formatTrace(
        traceInfo.constraint,
        traceInfo.config,
        traceInfo.strategy,
        traceInfo.groundingResult,
        traceInfo.providerName
      );
    }

    // Get provider - DryRunProvider if dry-run, else real provider
    const provider: CTNProvider = dryRun
      ? new DryRunProvider(providerName)
      : getProvider(providerName);

    // Streaming mode
    if (stream && !dryRun) {
      const streamIterator = provider.sendStream(config, messages);

      for await (const chunk of streamIterator) {
        if (chunk.type === 'text' && chunk.text) {
          process.stdout.write(chunk.text);
        } else if (chunk.type === 'done') {
          console.log(); // Final newline
          if (trace && chunk.usage) {
            console.log(`\n[Tokens: ${chunk.usage.inputTokens} in, ${chunk.usage.outputTokens} out]`);
          }
        } else if (chunk.type === 'error') {
          console.error(`\nError: ${chunk.error?.message}`);
          process.exit(1);
        }
      }
      return;
    }

    // Non-streaming: single send call
    const response = await provider.send(config, messages);

    // Handle dry-run output
    if (response.dryRun && response.request) {
      formatDryRun(config, response.request.messages[0]?.content ?? '', traceInfo.strategy);
      return;
    }

    // Normal output
    console.log(response.content);

    if (trace) {
      console.log(`\n[Tokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out]`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

// Re-export for backward compatibility with existing consumers
export interface DryRunResult {
  dryRun: true;
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  parameters: Record<string, unknown>;
}
