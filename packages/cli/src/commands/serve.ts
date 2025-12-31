import Fastify, { type FastifyInstance } from 'fastify';
import PQueue from 'p-queue';
import pRetry, { AbortError, type FailedAttemptError } from 'p-retry';
import { processSend, type SendResult, type DryRunResult } from './send.js';
import { AnthropicProvider } from '@ctn/anthropic';
import { GoogleProvider } from '@ctn/google';
import { OpenAIProvider } from '@ctn/openai';
import { validateInput, type BaseCTNProvider } from '@ctn/core';
import {
  sanitizeError,
  getErrorStatusCode,
  type SafeError,
  type ErrorLogger,
  silentErrorLogger,
  consoleErrorLogger,
  ErrorCode,
} from '../errors.js';
import {
  createLogger,
  parseLogLevel,
  silentLogger as silentAppLogger,
  type Logger,
  type LogLevel,
  type RequestLogEntry as AppRequestLogEntry,
} from '../logger.js';

const DEFAULT_PORT = 14380;
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_RETRIES = 3;
const DEFAULT_MIN_TIMEOUT = 1000; // 1 second
const DEFAULT_MAX_TIMEOUT = 30000; // 30 seconds
const VERSION = '1.0.0';

/**
 * Error with HTTP status code for retry classification.
 */
export interface RetryableError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

/**
 * Determines if an error is retryable (transient) or permanent.
 * Retries: 429 (rate limit), 502/503 (service unavailable), network errors
 * No retry: 400, 401, 403, 404 (client errors - won't help to retry)
 */
export function isRetryable(error: RetryableError): boolean {
  const status = error.status ?? error.statusCode;

  // Rate limiting and service unavailable - retry
  if (status === 429 || status === 502 || status === 503) {
    return true;
  }

  // Network errors - retry
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    return true;
  }

  // Client errors - don't retry
  if (status && status >= 400 && status < 500) {
    return false;
  }

  // Server errors (5xx) other than 502/503 - retry
  if (status && status >= 500) {
    return true;
  }

  // Unknown errors - don't retry by default
  return false;
}

/**
 * Configuration for retry behavior.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts. Default: 3 */
  retries: number;
  /** Minimum delay between retries in ms. Default: 1000 */
  minTimeout: number;
  /** Maximum delay between retries in ms. Default: 30000 */
  maxTimeout: number;
  /** Add randomization to delays (jitter). Default: true */
  randomize: boolean;
  /** Callback for failed attempts (for logging). Optional. */
  onRetry?: (error: FailedAttemptError, provider: string) => void;
}

/**
 * Default retry configuration.
 */
export const defaultRetryConfig: RetryConfig = {
  retries: DEFAULT_RETRIES,
  minTimeout: DEFAULT_MIN_TIMEOUT,
  maxTimeout: DEFAULT_MAX_TIMEOUT,
  randomize: true,
};

/**
 * Request log entry for structured logging.
 */
export interface RequestLogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  provider?: string;
}

/**
 * Server statistics for observability.
 */
export class ServerStats {
  private startTime: number = Date.now();
  private totalRequests: number = 0;
  private successRequests: number = 0;
  private errorRequests: number = 0;
  private requestsByPath: Map<string, number> = new Map();
  private requestsByProvider: Map<string, number> = new Map();

  /**
   * Records a completed request.
   */
  recordRequest(path: string, status: number, provider?: string): void {
    this.totalRequests++;

    if (status >= 200 && status < 400) {
      this.successRequests++;
    } else {
      this.errorRequests++;
    }

    // Track by path
    const pathCount = this.requestsByPath.get(path) ?? 0;
    this.requestsByPath.set(path, pathCount + 1);

    // Track by provider
    if (provider) {
      const providerCount = this.requestsByProvider.get(provider) ?? 0;
      this.requestsByProvider.set(provider, providerCount + 1);
    }
  }

  /**
   * Returns server uptime in milliseconds.
   */
  get uptimeMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Returns request statistics.
   */
  getRequestStats(): { total: number; success: number; error: number } {
    return {
      total: this.totalRequests,
      success: this.successRequests,
      error: this.errorRequests,
    };
  }

  /**
   * Returns request counts by path.
   */
  getRequestsByPath(): Record<string, number> {
    return Object.fromEntries(this.requestsByPath);
  }

  /**
   * Returns request counts by provider.
   */
  getRequestsByProvider(): Record<string, number> {
    return Object.fromEntries(this.requestsByProvider);
  }

  /**
   * Resets all statistics.
   */
  reset(): void {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.successRequests = 0;
    this.errorRequests = 0;
    this.requestsByPath.clear();
    this.requestsByProvider.clear();
  }
}

/**
 * Logger interface for request logging.
 */
export interface RequestLogger {
  log(entry: RequestLogEntry): void;
}

/**
 * Default JSON logger that outputs to console.
 */
export const jsonLogger: RequestLogger = {
  log(entry: RequestLogEntry): void {
    console.log(JSON.stringify(entry));
  },
};

/**
 * Silent logger for testing.
 */
export const silentLogger: RequestLogger = {
  log(): void {
    // No-op
  },
};

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

/**
 * Wraps a task with retry logic for transient failures.
 * Uses exponential backoff with jitter to prevent thundering herd.
 */
export async function withRetry<T>(
  task: () => Promise<T>,
  provider: string,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  return pRetry(
    async () => {
      try {
        return await task();
      } catch (error) {
        // Check if error is retryable
        if (!isRetryable(error as RetryableError)) {
          // Wrap in AbortError to stop retrying
          throw new AbortError((error as Error).message);
        }
        throw error;
      }
    },
    {
      retries: config.retries,
      minTimeout: config.minTimeout,
      maxTimeout: config.maxTimeout,
      randomize: config.randomize,
      onFailedAttempt: (error) => {
        if (config.onRetry) {
          config.onRetry(error, provider);
        }
      },
    }
  );
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
  kernel: string;
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
  code: string;
}

export interface StatsResponse {
  uptime_ms: number;
  requests: {
    total: number;
    success: number;
    error: number;
  };
  requests_by_path: Record<string, number>;
  requests_by_provider: Record<string, number>;
  queues: Record<string, { waiting: number; running: number }>;
}

export interface CreateServerOptions {
  /** Provider pool for client reuse. Created if not provided. */
  pool?: ProviderPool;
  /** Request queue for concurrency control. Created if not provided. */
  queue?: RequestQueue;
  /** Concurrency limit per provider. Only used if queue not provided. */
  concurrency?: number;
  /** Retry configuration for transient failures. Uses defaults if not provided. */
  retry?: Partial<RetryConfig>;
  /** Server statistics tracker. Created if not provided. */
  stats?: ServerStats;
  /** Request logger. Uses silent logger if not provided. @deprecated Use appLogger instead */
  logger?: RequestLogger;
  /** Error logger for internal errors. Uses silent logger if not provided. */
  errorLogger?: ErrorLogger;
  /** Application logger with level filtering and redaction. */
  appLogger?: Logger;
}

// Extend Fastify request to include timing and debug info
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
    provider?: string;
    /** Input text for debug logging */
    requestInput?: string;
    /** Response data for debug logging */
    responseData?: {
      outputLength?: number;
      tokensIn?: number;
      tokensOut?: number;
    };
  }
}

/**
 * Creates and configures the Fastify server.
 */
export function createServer(options: CreateServerOptions = {}): FastifyInstance {
  const pool = options.pool ?? new ProviderPool();
  const queue = options.queue ?? new RequestQueue(options.concurrency);
  const retryConfig: RetryConfig = { ...defaultRetryConfig, ...options.retry };
  const stats = options.stats ?? new ServerStats();
  const logger = options.logger ?? silentLogger;
  const errorLogger = options.errorLogger ?? silentErrorLogger;
  const appLogger = options.appLogger ?? silentAppLogger;

  const server = Fastify({
    logger: false,
  });

  // Ensure UTF-8 charset in JSON responses (for Greek symbols Σ, Ψ, Ω, τ)
  server.addHook('onSend', async (_request, reply, payload) => {
    const contentType = reply.getHeader('content-type');
    if (typeof contentType === 'string' && contentType.includes('application/json')) {
      reply.header('content-type', 'application/json; charset=utf-8');
    }
    return payload;
  });

  // Request timing hook - start timer
  server.addHook('onRequest', async (request) => {
    request.startTime = Date.now();
  });

  // Response logging hook - log completed requests
  server.addHook('onResponse', async (request, reply) => {
    const duration = request.startTime ? Date.now() - request.startTime : 0;
    const path = request.url.split('?')[0]; // Remove query string

    // Record stats
    stats.recordRequest(path, reply.statusCode, request.provider);

    // Log request (skip /stats to avoid noise)
    if (path !== '/stats') {
      // Build log entry
      const logEntry: AppRequestLogEntry = {
        timestamp: new Date().toISOString(),
        method: request.method,
        path,
        status: reply.statusCode,
        duration_ms: duration,
        provider: request.provider,
      };

      // Add debug fields if enabled
      if (appLogger.isLevelEnabled('debug')) {
        if (request.requestInput) {
          logEntry.input = appLogger.redact(request.requestInput);
        }
        if (request.responseData) {
          logEntry.output_length = request.responseData.outputLength;
          logEntry.tokens_in = request.responseData.tokensIn;
          logEntry.tokens_out = request.responseData.tokensOut;
        }
      }

      // Use new appLogger if available, fall back to legacy logger
      if (options.appLogger) {
        appLogger.logRequest(logEntry);
      } else {
        logger.log({
          timestamp: logEntry.timestamp,
          method: logEntry.method,
          path: logEntry.path,
          status: logEntry.status,
          duration_ms: logEntry.duration_ms,
          provider: logEntry.provider,
        });
      }
    }
  });

  // Health endpoint
  server.get<{ Reply: HealthResponse }>('/health', async () => {
    return {
      status: 'ok',
      version: VERSION,
    };
  });

  // Stats endpoint
  server.get<{ Reply: StatsResponse }>('/stats', async () => {
    return {
      uptime_ms: stats.uptimeMs,
      requests: stats.getRequestStats(),
      requests_by_path: stats.getRequestsByPath(),
      requests_by_provider: stats.getRequestsByProvider(),
      queues: queue.stats(),
    };
  });

  // Send endpoint
  server.post<{
    Body: SendRequest;
    Reply: SendResponse | SendDryRunResponse | ErrorResponse;
  }>('/send', async (request, reply) => {
    const body = request.body;

    // Check request structure
    if (!body || typeof body.input !== 'string') {
      reply.status(400);
      return { error: 'Missing required field: input', code: ErrorCode.VALIDATION_ERROR };
    }

    // Validate input content (empty check, size limit)
    const validation = validateInput(body.input);
    if (!validation.valid) {
      reply.status(400);
      return { error: validation.reason ?? 'Invalid input', code: ErrorCode.VALIDATION_ERROR };
    }

    try {
      // Get provider from pool (reuses existing instance)
      const providerName = body.provider ?? 'anthropic';
      const providerInstance = pool.get(providerName);

      // Store provider and input for logging
      request.provider = providerName;
      request.requestInput = body.input;

      // Route request through queue with retry for transient failures
      const { response, trace } = await queue.add(providerName, () =>
        withRetry(
          () =>
            processSend(body.input, {
              provider: providerName,
              model: body.model,
              strategy: body.strategy,
              dryRun: body.dryRun,
              providerInstance,
            }),
          providerName,
          retryConfig
        )
      );

      // Handle dry-run response
      if (response.dryRun && response.request) {
        // Store response data for debug logging
        request.responseData = {
          outputLength: response.request.systemPrompt.length + (response.request.messages[0]?.content.length ?? 0),
        };
        return {
          dryRun: true as const,
          provider: response.request.provider,
          model: response.model,
          systemPrompt: response.request.systemPrompt,
          userPrompt: response.request.messages[0]?.content ?? '',
          parameters: response.request.parameters,
        };
      }

      // Store response data for debug logging
      request.responseData = {
        outputLength: response.content.length,
        tokensIn: response.usage.inputTokens,
        tokensOut: response.usage.outputTokens,
      };

      // Return normal response with kernel
      return {
        output: response.content,
        kernel: trace.config.kernel,
        provider: providerName,
        model: response.model,
        tokens: {
          input: response.usage.inputTokens,
          output: response.usage.outputTokens,
        },
      };
    } catch (error) {
      // Sanitize error - never expose stack traces or internal paths
      const safeError = sanitizeError(error, { logger: errorLogger });
      const statusCode = getErrorStatusCode(error);

      reply.status(statusCode);
      return safeError;
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
  /** Retry configuration for transient failures. */
  retry?: Partial<RetryConfig>;
  /** Server statistics tracker. Created if not provided. */
  stats?: ServerStats;
  /** Request logger. Uses JSON logger if not provided. @deprecated Use logLevel/redactPrompts instead */
  logger?: RequestLogger;
  /** Error logger for internal errors. Uses console logger if not provided. */
  errorLogger?: ErrorLogger;
  /** Log level (error, warn, info, debug). Default: 'info' */
  logLevel?: LogLevel;
  /** If true, redact prompt content in logs. Default: false */
  redactPrompts?: boolean;
}

/**
 * Starts the CTN HTTP server.
 */
export async function startServer(options: StartServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? DEFAULT_PORT;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const retries = options.retry?.retries ?? DEFAULT_RETRIES;
  const logLevel = options.logLevel ?? 'info';
  const redactPrompts = options.redactPrompts ?? false;
  const pool = options.pool ?? new ProviderPool();
  const queue = options.queue ?? new RequestQueue(concurrency);
  const stats = options.stats ?? new ServerStats();
  const logger = options.logger ?? jsonLogger; // Use JSON logger in production (legacy)
  const errorLog = options.errorLogger ?? consoleErrorLogger; // Use console logger in production

  // Create app logger with configured level and redaction
  const appLogger = createLogger({
    level: logLevel,
    redactPrompts,
  });

  const retryConfig: Partial<RetryConfig> = {
    ...options.retry,
    // Add default logging for retries using app logger
    onRetry: options.retry?.onRetry ?? ((error, provider) => {
      appLogger.warn(`Retry attempt ${error.attemptNumber}/${retries}`, {
        provider,
        error: error.message,
      });
    }),
  };
  const server = createServer({ pool, queue, retry: retryConfig, stats, logger, errorLogger: errorLog, appLogger });

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
  console.log(`Stats: http://localhost:${port}/stats`);
  console.log(`Concurrency limit: ${concurrency} per provider`);
  console.log(`Retry attempts: ${retries} (exponential backoff with jitter)`);
  console.log(`Log level: ${logLevel}${redactPrompts ? ' (prompts redacted)' : ''}`);

  return server;
}

/**
 * Serve command action for Commander.
 */
export async function serveAction(options: {
  port?: string;
  concurrency?: string;
  retries?: string;
  logLevel?: string;
  redactPrompts?: boolean;
}): Promise<void> {
  const port = options.port ? parseInt(options.port, 10) : undefined;
  const concurrency = options.concurrency ? parseInt(options.concurrency, 10) : undefined;
  const retries = options.retries ? parseInt(options.retries, 10) : undefined;
  const logLevel = options.logLevel ? parseLogLevel(options.logLevel) : undefined;
  const redactPrompts = options.redactPrompts ?? false;

  if (port !== undefined && (isNaN(port) || port < 1 || port > 65535)) {
    console.error('Error: Port must be a number between 1 and 65535');
    process.exit(1);
  }

  if (concurrency !== undefined && (isNaN(concurrency) || concurrency < 1)) {
    console.error('Error: Concurrency must be a positive number');
    process.exit(1);
  }

  if (retries !== undefined && (isNaN(retries) || retries < 0)) {
    console.error('Error: Retries must be a non-negative number');
    process.exit(1);
  }

  if (options.logLevel && !['error', 'warn', 'info', 'debug'].includes(options.logLevel.toLowerCase())) {
    console.error('Error: Log level must be one of: error, warn, info, debug');
    process.exit(1);
  }

  await startServer({
    port,
    concurrency,
    retry: retries !== undefined ? { retries } : undefined,
    logLevel,
    redactPrompts,
  });
}
