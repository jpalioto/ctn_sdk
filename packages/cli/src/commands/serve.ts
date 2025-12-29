import Fastify, { type FastifyInstance } from 'fastify';
import PQueue from 'p-queue';
import { processSend, type SendResult, type DryRunResult } from './send.js';
import { AnthropicProvider } from '@ctn/anthropic';
import { GoogleProvider } from '@ctn/google';
import { OpenAIProvider } from '@ctn/openai';
import type { BaseCTNProvider } from '@ctn/core';

const DEFAULT_PORT = 14380;
const DEFAULT_CONCURRENCY = 5;
const VERSION = '1.0.0';

/**
 * Provider pool with lazy initialization.
 * Creates provider instances on first access, then reuses them.
 */
export class ProviderPool {
  private providers: Map<string, BaseCTNProvider> = new Map();

  /**
   * Gets a provider instance, creating it if needed.
   * Provider instances are reused across requests.
   */
  get(name: string): BaseCTNProvider {
    const normalized = this.normalize(name);

    let provider = this.providers.get(normalized);
    if (!provider) {
      provider = this.create(normalized);
      this.providers.set(normalized, provider);
    }
    return provider;
  }

  /**
   * Normalizes provider name aliases to canonical names.
   */
  private normalize(name: string): string {
    switch (name.toLowerCase()) {
      case 'openai':
      case 'gpt':
        return 'openai';
      case 'google':
      case 'gemini':
        return 'google';
      case 'anthropic':
      case 'claude':
      default:
        return 'anthropic';
    }
  }

  /**
   * Creates a new provider instance.
   */
  private create(name: string): BaseCTNProvider {
    switch (name) {
      case 'openai':
        return new OpenAIProvider();
      case 'google':
        return new GoogleProvider();
      case 'anthropic':
      default:
        return new AnthropicProvider();
    }
  }

  /**
   * Returns the number of initialized providers.
   * Useful for testing lazy initialization.
   */
  get size(): number {
    return this.providers.size;
  }

  /**
   * Checks if a provider has been initialized.
   */
  has(name: string): boolean {
    return this.providers.has(this.normalize(name));
  }
}

/**
 * Per-provider request queues for concurrency control.
 * Each provider has its own queue to prevent flooding API rate limits.
 */
export class RequestQueue {
  private queues: Map<string, PQueue> = new Map();
  private readonly concurrency: number;

  constructor(concurrency: number = DEFAULT_CONCURRENCY) {
    this.concurrency = concurrency;
  }

  /**
   * Gets the queue for a provider, creating it if needed.
   */
  private getQueue(provider: string): PQueue {
    const normalized = this.normalizeProvider(provider);

    let queue = this.queues.get(normalized);
    if (!queue) {
      queue = new PQueue({ concurrency: this.concurrency });
      this.queues.set(normalized, queue);
    }
    return queue;
  }

  /**
   * Normalizes provider name to canonical form.
   */
  private normalizeProvider(name: string): string {
    switch (name.toLowerCase()) {
      case 'openai':
      case 'gpt':
        return 'openai';
      case 'google':
      case 'gemini':
        return 'google';
      case 'anthropic':
      case 'claude':
      default:
        return 'anthropic';
    }
  }

  /**
   * Adds a task to the provider's queue.
   * Returns a promise that resolves when the task completes.
   */
  async add<T>(provider: string, task: () => Promise<T>): Promise<T> {
    const queue = this.getQueue(provider);
    return queue.add(task) as Promise<T>;
  }

  /**
   * Returns the number of waiting tasks for a provider.
   * (Tasks in queue, not yet started)
   */
  waiting(provider: string): number {
    const normalized = this.normalizeProvider(provider);
    const queue = this.queues.get(normalized);
    return queue?.size ?? 0;
  }

  /**
   * Returns the number of currently running tasks for a provider.
   */
  running(provider: string): number {
    const normalized = this.normalizeProvider(provider);
    const queue = this.queues.get(normalized);
    return queue?.pending ?? 0;
  }

  /**
   * Returns the total count (waiting + running) for a provider.
   */
  total(provider: string): number {
    const normalized = this.normalizeProvider(provider);
    const queue = this.queues.get(normalized);
    if (!queue) return 0;
    return queue.size + queue.pending;
  }

  /**
   * Returns stats for all active queues.
   */
  stats(): Record<string, { waiting: number; running: number }> {
    const result: Record<string, { waiting: number; running: number }> = {};
    for (const [provider, queue] of this.queues) {
      result[provider] = {
        waiting: queue.size,
        running: queue.pending,
      };
    }
    return result;
  }

  /**
   * Returns the configured concurrency limit.
   */
  get concurrencyLimit(): number {
    return this.concurrency;
  }
}

export interface ServeOptions {
  port?: number;
}

export interface HealthResponse {
  status: 'ok';
  version: string;
}

export interface SendRequest {
  input: string;
  provider?: string;
  model?: string;
  strategy?: string;
  trace?: boolean;
  dryRun?: boolean;
}

export interface SendResponse {
  output: string;
  provider: string;
  model: string;
  tokens: {
    input: number;
    output: number;
  };
}

export interface SendDryRunResponse {
  dryRun: true;
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  parameters: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
}

export interface CreateServerOptions {
  /** Provider pool for client reuse. Created if not provided. */
  pool?: ProviderPool;
  /** Request queue for concurrency control. Created if not provided. */
  queue?: RequestQueue;
  /** Concurrency limit per provider. Only used if queue not provided. */
  concurrency?: number;
}

/**
 * Creates and configures the Fastify server.
 */
export function createServer(options: CreateServerOptions = {}): FastifyInstance {
  const pool = options.pool ?? new ProviderPool();
  const queue = options.queue ?? new RequestQueue(options.concurrency);

  const server = Fastify({
    logger: false,
  });

  // Health endpoint
  server.get<{ Reply: HealthResponse }>('/health', async () => {
    return {
      status: 'ok',
      version: VERSION,
    };
  });

  // Send endpoint
  server.post<{
    Body: SendRequest;
    Reply: SendResponse | SendDryRunResponse | ErrorResponse;
  }>('/send', async (request, reply) => {
    const body = request.body;

    // Validate input
    if (!body || typeof body.input !== 'string' || body.input.trim() === '') {
      reply.status(400);
      return { error: 'Missing required field: input' };
    }

    try {
      // Get provider from pool (reuses existing instance)
      const providerName = body.provider ?? 'anthropic';
      const providerInstance = pool.get(providerName);

      // Route request through the provider's queue for concurrency control
      const response = await queue.add(providerName, () =>
        processSend(body.input, {
          provider: providerName,
          model: body.model,
          strategy: body.strategy,
          dryRun: body.dryRun,
          providerInstance,
        })
      );

      // Return dry-run response
      if ('dryRun' in response) {
        return response.dryRun;
      }

      // Return normal response
      return response.result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';

      // Determine status code based on error type
      const statusCode = message.includes('API key') ? 400 : 500;

      reply.status(statusCode);
      return { error: message };
    }
  });

  return server;
}

export interface StartServerOptions extends ServeOptions {
  /** Provider pool for client reuse. Created if not provided. */
  pool?: ProviderPool;
  /** Request queue for concurrency control. Created if not provided. */
  queue?: RequestQueue;
  /** Concurrency limit per provider. Only used if queue not provided. */
  concurrency?: number;
}

/**
 * Starts the CTN HTTP server.
 */
export async function startServer(options: StartServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? DEFAULT_PORT;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const pool = options.pool ?? new ProviderPool();
  const queue = options.queue ?? new RequestQueue(concurrency);
  const server = createServer({ pool, queue });

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await server.listen({ port, host: '0.0.0.0' });
  console.log(`CTN server listening on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Concurrency limit: ${concurrency} per provider`);

  return server;
}

/**
 * Serve command action for Commander.
 */
export async function serveAction(options: { port?: string; concurrency?: string }): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : undefined;
  const concurrency = options.concurrency ? parseInt(options.concurrency, 10) : undefined;

  if (port !== undefined && (isNaN(port) || port < 1 || port > 65535)) {
    console.error('Error: Port must be a number between 1 and 65535');
    process.exit(1);
  }

  if (concurrency !== undefined && (isNaN(concurrency) || concurrency < 1)) {
    console.error('Error: Concurrency must be a positive number');
    process.exit(1);
  }

  await startServer({ port, concurrency });
}
