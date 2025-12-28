import {
  parse,
  OperationalStrategy,
  Composer,
  type ResolvedConstraint,
  type AbstractConstraint,
} from '@ctn/language';
import { AnthropicProvider } from '@ctn/anthropic';
import type { Message, ProjectedConfig } from '@ctn/core';
import { formatTrace, formatDryRun } from '../output/formatter.js';

export interface SendOptions {
  provider: string;
  model: string;
  stream?: boolean;
  trace?: boolean;
  dryRun?: boolean;
}

/**
 * Parses a prompt that may contain CTN constraints.
 * Extracts constraints and returns both the abstract constraint and clean prompt.
 */
function parsePromptWithConstraints(
  prompt: string,
  strategy: OperationalStrategy
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
 * Gets the provider instance based on provider name.
 */
function getProvider(providerName: string): AnthropicProvider {
  switch (providerName.toLowerCase()) {
    case 'anthropic':
      // Check for API key
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
        process.exit(1);
      }
      return new AnthropicProvider();
    default:
      console.error(`Error: Unknown provider '${providerName}'. Currently only 'anthropic' is supported.`);
      process.exit(1);
  }
}

/**
 * The send command implementation.
 */
export async function sendCommand(
  prompt: string,
  options: SendOptions
): Promise<void> {
  const { provider: providerName, model, stream, trace, dryRun } = options;

  try {
    // Initialize strategy and provider
    const strategy = new OperationalStrategy();
    const provider = getProvider(providerName);

    // Parse prompt and extract constraints
    const { constraint, cleanPrompt } = parsePromptWithConstraints(prompt, strategy);

    // Project to provider-specific config
    const config: ProjectedConfig = provider.project(constraint, model);

    // Show trace if requested
    if (trace) {
      formatTrace(constraint, config, strategy);
    }

    // If dry-run, show config and exit
    if (dryRun) {
      formatDryRun(config, cleanPrompt);
      return;
    }

    // Build messages
    const messages: Message[] = [{ role: 'user', content: cleanPrompt }];

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
