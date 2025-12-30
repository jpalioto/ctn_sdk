import {
  parse,
  OperationalStrategy,
  CTNStrategy,
  Composer,
  type TraitStrategy,
  type ResolvedConstraint,
  type AbstractConstraint,
} from '@ctn/language';
import { sanitizeInput, type Message, type ProjectedConfig, type BaseCTNProvider } from '@ctn/core';
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

export interface SendResult {
  output: string;
  provider: string;
  model: string;
  tokens: {
    input: number;
    output: number;
  };
}

export interface DryRunResult {
  dryRun: true;
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  parameters: Record<string, unknown>;
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
 * Core send processing logic - reusable by CLI and HTTP server.
 * Returns results instead of printing to console.
 *
 * @param input - The prompt with optional @constraints
 * @param options - Processing options including optional pre-created provider
 */
export async function processSend(
  input: string,
  options: ProcessSendOptions
): Promise<{ result: SendResult; trace?: TraceInfo } | { dryRun: DryRunResult; trace?: TraceInfo }> {
  // Sanitize input before processing
  const sanitizedInput = sanitizeInput(input);

  const providerName = options.provider ?? 'anthropic';
  const strategyName = options.strategy ?? 'operational';

  // Initialize strategy and provider (use provided instance or create new)
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

  // Build trace info
  const trace: TraceInfo = {
    constraint,
    config,
    strategy,
    groundingResult,
    providerName,
  };

  // If dry-run, return config without API call
  if (options.dryRun) {
    return {
      dryRun: {
        dryRun: true,
        provider: providerName,
        model: config.model,
        systemPrompt: config.kernel,
        userPrompt: cleanPrompt,
        parameters: config.apiParams,
      },
      trace,
    };
  }

  // Build final prompt with grounding context
  const promptWithContext = groundingResult
    ? formatGroundingContext(groundingResult.content, groundingResult.source) + '\n\n' + cleanPrompt
    : cleanPrompt;

  // Build messages
  const messages: Message[] = [{ role: 'user', content: promptWithContext }];

  // Send request (non-streaming for HTTP)
  const response = await provider.send(config, messages);

  return {
    result: {
      output: response.content,
      provider: providerName,
      model: config.model,
      tokens: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    },
    trace,
  };
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
    // Sanitize input for all paths
    const sanitizedPrompt = sanitizeInput(prompt);

    // For streaming, we need special handling
    if (stream && !dryRun) {
      // Initialize strategy and provider
      const strategy = getStrategy(strategyName);
      const provider = getProvider(providerName);
      const model = modelOption || getDefaultModel(providerName);

      // Fetch grounding content if requested
      let groundingResult: GroundingResult | null = null;
      if (ground) {
        groundingResult = await fetchGrounding(ground);
      }

      // Parse prompt and extract constraints (using sanitized input)
      const { constraint, cleanPrompt } = parsePromptWithConstraints(sanitizedPrompt, strategy);

      // Project to provider-specific config
      const config: ProjectedConfig = provider.project(constraint, model);

      // Show trace if requested
      if (trace) {
        formatTrace(constraint, config, strategy, groundingResult, providerName);
      }

      // Build final prompt with grounding context
      const promptWithContext = groundingResult
        ? formatGroundingContext(groundingResult.content, groundingResult.source) + '\n\n' + cleanPrompt
        : cleanPrompt;

      // Build messages
      const messages: Message[] = [{ role: 'user', content: promptWithContext }];

      // Streaming response
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

    // Non-streaming: use shared processSend (input is sanitized within processSend)
    const response = await processSend(sanitizedPrompt, {
      provider: providerName,
      model: modelOption,
      strategy: strategyName,
      ground,
      dryRun,
    });

    // Show trace if requested
    if (trace && response.trace) {
      formatTrace(
        response.trace.constraint,
        response.trace.config,
        response.trace.strategy,
        response.trace.groundingResult,
        response.trace.providerName
      );
    }

    // Handle dry-run output
    if ('dryRun' in response) {
      formatDryRun(response.trace!.config, response.dryRun.userPrompt, response.trace!.strategy);
      return;
    }

    // Normal output
    console.log(response.result.output);

    if (trace) {
      console.log(`\n[Tokens: ${response.result.tokens.input} in, ${response.result.tokens.output} out]`);
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
