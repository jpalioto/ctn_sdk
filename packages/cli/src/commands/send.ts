import {
  parse,
  OperationalStrategy,
  CTNStrategy,
  Composer,
  type TraitStrategy,
  type ResolvedConstraint,
  type AbstractConstraint,
} from '@ctn/language';
import type { Message, ProjectedConfig } from '@ctn/core';
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
 * Gets a strategy instance based on strategy name.
 * This switch is acceptable - it's at the CLI boundary translating user input to types.
 */
function getStrategy(name: string): TraitStrategy {
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


/**
 * The send command implementation.
 */
export async function sendCommand(
  prompt: string,
  options: SendOptions
): Promise<void> {
  const { provider: providerName, model: modelOption, strategy: strategyName, ground, stream, trace, dryRun } = options;

  try {
    // Initialize strategy and provider
    const strategy = getStrategy(strategyName);
    const provider = getProvider(providerName);

    // Resolve model - use option or provider default
    const model = modelOption || getDefaultModel(providerName);

    // Fetch grounding content if requested
    let groundingResult: GroundingResult | null = null;
    if (ground) {
      groundingResult = await fetchGrounding(ground);
    }

    // Parse prompt and extract constraints
    const { constraint, cleanPrompt } = parsePromptWithConstraints(prompt, strategy);

    // Project to provider-specific config
    const config: ProjectedConfig = provider.project(constraint, model);

    // Show trace if requested
    if (trace) {
      formatTrace(constraint, config, strategy, groundingResult, providerName);
    }

    // If dry-run, show config and exit
    if (dryRun) {
      formatDryRun(config, cleanPrompt, strategy);
      return;
    }

    // Build final prompt with grounding context
    const promptWithContext = groundingResult
      ? formatGroundingContext(groundingResult.content, groundingResult.source) + '\n\n' + cleanPrompt
      : cleanPrompt;

    // Build messages
    const messages: Message[] = [{ role: 'user', content: promptWithContext }];

    // Send request
    if (stream) {
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
    } else {
      // Non-streaming response
      const response = await provider.send(config, messages);

      console.log(response.content);

      if (trace) {
        console.log(`\n[Tokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out]`);
      }
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
