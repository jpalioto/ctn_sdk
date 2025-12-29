import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  createServer,
  startServer,
  ProviderPool,
  RequestQueue,
  isRetryable,
  withRetry,
  defaultRetryConfig,
  type RetryableError,
} from './serve.js';
import type { FastifyInstance } from 'fastify';

describe('serve command', () => {
  describe('createServer', () => {
    let server: FastifyInstance;

    beforeEach(() => {
      server = createServer();
    });

    afterEach(async () => {
      await server.close();
    });

    it('creates a Fastify server instance', () => {
      assert.ok(server);
      assert.strictEqual(typeof server.listen, 'function');
      assert.strictEqual(typeof server.close, 'function');
    });

    it('/health returns 200 with correct JSON', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.version, '1.0.0');
    });
  });

  describe('startServer', () => {
    let server: FastifyInstance | null = null;

    afterEach(async () => {
      if (server) {
        await server.close();
        server = null;
      }
    });

    it('starts server on specified port', async () => {
      const port = 14381;
      server = await startServer({ port });

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      assert.strictEqual(response.statusCode, 200);
    });

    it('starts server on default port when not specified', async () => {
      server = await startServer();

      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      assert.strictEqual(response.statusCode, 200);
    });

    it('server shuts down gracefully', async () => {
      server = await startServer({ port: 14382 });

      // Verify server is running
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });
      assert.strictEqual(response.statusCode, 200);

      // Close server
      await server.close();

      // Verify server is closed by checking addresses is null
      const addresses = server.addresses();
      assert.strictEqual(addresses.length, 0);

      // Mark as null so afterEach doesn't try to close again
      server = null;
    });
  });

  describe('POST /send', () => {
    let server: FastifyInstance;

    beforeEach(() => {
      server = createServer();
    });

    afterEach(async () => {
      await server.close();
    });

    it('returns 400 if input is missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: {},
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 400);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Missing required field: input');
    });

    it('returns 400 if input is empty string', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: '' },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 400);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Missing required field: input');
    });

    it('returns 400 if input is whitespace only', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: '   ' },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 400);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Missing required field: input');
    });

    it('returns 400 if body is not valid JSON object', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: 'not json',
        headers: { 'content-type': 'application/json' },
      });

      // Fastify returns 400 for invalid JSON
      assert.ok(response.statusCode >= 400);
    });

    it('with dryRun returns projected parameters without API call', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: {
          input: '@precise @terse Explain recursion',
          dryRun: true,
        },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);

      // Verify dry-run response structure
      assert.strictEqual(body.dryRun, true);
      assert.strictEqual(body.provider, 'anthropic');
      assert.ok(body.model);
      assert.ok(body.systemPrompt);
      assert.strictEqual(body.userPrompt, 'Explain recursion');
      assert.ok(body.parameters);
      assert.ok(typeof body.parameters.temperature === 'number');
    });

    it('with dryRun respects provider option', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: {
          input: '@terse Hello',
          provider: 'google',
          dryRun: true,
        },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);

      assert.strictEqual(body.dryRun, true);
      assert.strictEqual(body.provider, 'google');
    });

    it('with dryRun respects model option', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: {
          input: 'Hello',
          model: 'opus',
          dryRun: true,
        },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);

      assert.strictEqual(body.dryRun, true);
      assert.ok(body.model.includes('opus'));
    });

    it('with dryRun respects strategy option', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: {
          input: '@clarity Hello',
          strategy: 'ctn',
          dryRun: true,
        },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);

      assert.strictEqual(body.dryRun, true);
      // CTN strategy processes @clarity constraint
      assert.ok(body.systemPrompt);
    });

    it('error handling returns proper JSON error for missing API key', async () => {
      // Save and clear the API key
      const savedKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      try {
        const response = await server.inject({
          method: 'POST',
          url: '/send',
          payload: {
            input: 'Hello',
            // Not dry-run, so it will try to make an API call
          },
          headers: { 'content-type': 'application/json' },
        });

        // Should return error status
        assert.ok(response.statusCode >= 400);
        const body = JSON.parse(response.body);
        assert.ok(body.error);
        // Error message contains either "api key" or "API key" (case varies by provider)
        assert.ok(
          body.error.toLowerCase().includes('api key') ||
          body.error.toLowerCase().includes('apikey') ||
          body.error.toLowerCase().includes('api_key'),
          `Expected error about API key, got: ${body.error}`
        );
      } finally {
        // Restore the API key
        if (savedKey) {
          process.env.ANTHROPIC_API_KEY = savedKey;
        }
      }
    });
  });

  describe('ProviderPool', () => {
    it('starts with no providers initialized', () => {
      const pool = new ProviderPool();
      assert.strictEqual(pool.size, 0);
    });

    it('creates provider on first access (lazy initialization)', () => {
      const pool = new ProviderPool();
      assert.strictEqual(pool.size, 0);

      const provider = pool.get('anthropic');
      assert.ok(provider);
      assert.strictEqual(pool.size, 1);
      assert.strictEqual(pool.has('anthropic'), true);
    });

    it('returns same provider instance on subsequent calls', () => {
      const pool = new ProviderPool();

      const first = pool.get('anthropic');
      const second = pool.get('anthropic');

      assert.strictEqual(first, second);
      assert.strictEqual(pool.size, 1);
    });

    it('normalizes provider name aliases', () => {
      const pool = new ProviderPool();

      // 'claude' should normalize to 'anthropic'
      const viaAlias = pool.get('claude');
      const viaNormal = pool.get('anthropic');

      assert.strictEqual(viaAlias, viaNormal);
      assert.strictEqual(pool.size, 1);
    });

    it('creates separate instances for different providers', () => {
      const pool = new ProviderPool();

      const anthropic = pool.get('anthropic');
      const google = pool.get('google');

      assert.notStrictEqual(anthropic, google);
      assert.strictEqual(pool.size, 2);

      // OpenAI requires API key at construction, so test separately if available
      if (process.env.OPENAI_API_KEY) {
        const openai = pool.get('openai');
        assert.notStrictEqual(google, openai);
        assert.strictEqual(pool.size, 3);
      }
    });

    it('handles case-insensitive provider names', () => {
      const pool = new ProviderPool();

      const lower = pool.get('anthropic');
      const upper = pool.get('ANTHROPIC');
      const mixed = pool.get('Anthropic');

      assert.strictEqual(lower, upper);
      assert.strictEqual(upper, mixed);
      assert.strictEqual(pool.size, 1);
    });
  });

  describe('RequestQueue', () => {
    it('starts with empty stats', () => {
      const queue = new RequestQueue();
      const stats = queue.stats();
      assert.deepStrictEqual(stats, {});
    });

    it('uses default concurrency of 5', () => {
      const queue = new RequestQueue();
      assert.strictEqual(queue.concurrencyLimit, 5);
    });

    it('accepts custom concurrency limit', () => {
      const queue = new RequestQueue(10);
      assert.strictEqual(queue.concurrencyLimit, 10);
    });

    it('executes tasks through the queue', async () => {
      const queue = new RequestQueue();
      let executed = false;

      await queue.add('anthropic', async () => {
        executed = true;
        return 'result';
      });

      assert.strictEqual(executed, true);
    });

    it('returns task result', async () => {
      const queue = new RequestQueue();

      const result = await queue.add('anthropic', async () => {
        return { value: 42 };
      });

      assert.deepStrictEqual(result, { value: 42 });
    });

    it('creates separate queues for different providers', async () => {
      const queue = new RequestQueue(1); // Concurrency 1 to force sequential

      const order: string[] = [];

      // Start both tasks in parallel
      const task1 = queue.add('anthropic', async () => {
        order.push('anthropic-start');
        await new Promise((r) => setTimeout(r, 10));
        order.push('anthropic-end');
      });

      const task2 = queue.add('google', async () => {
        order.push('google-start');
        await new Promise((r) => setTimeout(r, 10));
        order.push('google-end');
      });

      await Promise.all([task1, task2]);

      // Both should start immediately (different queues)
      assert.strictEqual(order[0], 'anthropic-start');
      assert.strictEqual(order[1], 'google-start');
    });

    it('queues tasks when concurrency limit reached', async () => {
      const queue = new RequestQueue(1); // Concurrency 1

      const order: number[] = [];

      // Start 3 tasks for same provider
      const task1 = queue.add('anthropic', async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 20));
      });

      const task2 = queue.add('anthropic', async () => {
        order.push(2);
        await new Promise((r) => setTimeout(r, 10));
      });

      const task3 = queue.add('anthropic', async () => {
        order.push(3);
      });

      await Promise.all([task1, task2, task3]);

      // Should execute in order (queued)
      assert.deepStrictEqual(order, [1, 2, 3]);
    });

    it('reports waiting and running correctly', async () => {
      const queue = new RequestQueue(1);
      let taskStarted = false;

      // Start a slow task that signals when it starts
      const slowTask = queue.add('anthropic', async () => {
        taskStarted = true;
        await new Promise((r) => setTimeout(r, 100));
      });

      // Wait for first task to start
      while (!taskStarted) {
        await new Promise((r) => setTimeout(r, 1));
      }

      // Add more tasks while first is running
      const task2 = queue.add('anthropic', async () => {});
      const task3 = queue.add('anthropic', async () => {});

      // Check: 1 running, 2 waiting
      assert.strictEqual(queue.running('anthropic'), 1);
      assert.strictEqual(queue.waiting('anthropic'), 2);
      assert.strictEqual(queue.total('anthropic'), 3);

      await Promise.all([slowTask, task2, task3]);

      // After completion, total should be 0
      assert.strictEqual(queue.total('anthropic'), 0);
    });

    it('normalizes provider names in queue', async () => {
      const queue = new RequestQueue(1);
      const order: string[] = [];

      // 'claude' and 'anthropic' should share the same queue
      const task1 = queue.add('claude', async () => {
        order.push('first');
        await new Promise((r) => setTimeout(r, 10));
      });

      const task2 = queue.add('anthropic', async () => {
        order.push('second');
      });

      await Promise.all([task1, task2]);

      // Should be sequential (same normalized provider)
      assert.deepStrictEqual(order, ['first', 'second']);
    });

    it('stats returns info for active queues', async () => {
      const queue = new RequestQueue(1);

      // Add tasks to create queues
      const task1 = queue.add('anthropic', async () => {
        await new Promise((r) => setTimeout(r, 30));
      });
      queue.add('google', async () => {});

      // Check stats while running
      const stats = queue.stats();
      assert.ok('anthropic' in stats);
      assert.ok('google' in stats);
      assert.ok(typeof stats.anthropic.waiting === 'number');
      assert.ok(typeof stats.anthropic.running === 'number');

      await task1;
    });
  });

  describe('server with shared pool', () => {
    let server: FastifyInstance;
    let pool: ProviderPool;

    beforeEach(() => {
      pool = new ProviderPool();
      server = createServer({ pool });
    });

    afterEach(async () => {
      await server.close();
    });

    it('uses provided pool for requests', async () => {
      // Pool should start empty
      assert.strictEqual(pool.size, 0);

      // Make a dry-run request to trigger provider access
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: {
          input: 'Hello',
          dryRun: true,
        },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
      // Pool should now have the anthropic provider
      assert.strictEqual(pool.size, 1);
      assert.strictEqual(pool.has('anthropic'), true);
    });

    it('reuses provider across multiple requests', async () => {
      // First request
      await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: 'First', dryRun: true },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(pool.size, 1);

      // Second request with same provider
      await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: 'Second', dryRun: true },
        headers: { 'content-type': 'application/json' },
      });

      // Should still be only 1 provider (reused)
      assert.strictEqual(pool.size, 1);
    });

    it('creates new provider only when different provider requested', async () => {
      // Request with anthropic
      await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: 'Hello', provider: 'anthropic', dryRun: true },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(pool.size, 1);

      // Request with google
      await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: 'Hello', provider: 'google', dryRun: true },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(pool.size, 2);
      assert.strictEqual(pool.has('anthropic'), true);
      assert.strictEqual(pool.has('google'), true);
    });
  });

  describe('server with queue', () => {
    let server: FastifyInstance;
    let queue: RequestQueue;

    beforeEach(() => {
      queue = new RequestQueue(2); // Low concurrency for testing
      server = createServer({ queue });
    });

    afterEach(async () => {
      await server.close();
    });

    it('routes requests through the queue', async () => {
      // Queue should start with no stats
      assert.deepStrictEqual(queue.stats(), {});

      // Make a request
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: 'Hello', dryRun: true },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
      // Queue should have processed through anthropic queue
      assert.ok('anthropic' in queue.stats());
    });

    it('respects concurrency limit configured on server', async () => {
      // Create server with concurrency 1
      await server.close();
      queue = new RequestQueue(1);
      server = createServer({ queue, concurrency: 1 });

      assert.strictEqual(queue.concurrencyLimit, 1);
    });
  });

  describe('isRetryable', () => {
    it('returns true for 429 rate limit error', () => {
      const error: RetryableError = new Error('Rate limited');
      error.status = 429;
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns true for 502 bad gateway error', () => {
      const error: RetryableError = new Error('Bad Gateway');
      error.status = 502;
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns true for 503 service unavailable error', () => {
      const error: RetryableError = new Error('Service Unavailable');
      error.status = 503;
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns true for ECONNRESET network error', () => {
      const error: RetryableError = new Error('Connection reset');
      error.code = 'ECONNRESET';
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns true for ETIMEDOUT network error', () => {
      const error: RetryableError = new Error('Connection timed out');
      error.code = 'ETIMEDOUT';
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns true for ECONNREFUSED network error', () => {
      const error: RetryableError = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns true for 500 server error', () => {
      const error: RetryableError = new Error('Internal Server Error');
      error.status = 500;
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns false for 400 bad request error', () => {
      const error: RetryableError = new Error('Bad Request');
      error.status = 400;
      assert.strictEqual(isRetryable(error), false);
    });

    it('returns false for 401 unauthorized error', () => {
      const error: RetryableError = new Error('Unauthorized');
      error.status = 401;
      assert.strictEqual(isRetryable(error), false);
    });

    it('returns false for 403 forbidden error', () => {
      const error: RetryableError = new Error('Forbidden');
      error.status = 403;
      assert.strictEqual(isRetryable(error), false);
    });

    it('returns false for 404 not found error', () => {
      const error: RetryableError = new Error('Not Found');
      error.status = 404;
      assert.strictEqual(isRetryable(error), false);
    });

    it('uses statusCode property if status not present', () => {
      const error: RetryableError = new Error('Rate limited');
      error.statusCode = 429;
      assert.strictEqual(isRetryable(error), true);
    });

    it('returns false for unknown errors', () => {
      const error: RetryableError = new Error('Unknown error');
      assert.strictEqual(isRetryable(error), false);
    });
  });

  describe('withRetry', () => {
    it('returns result on success without retry', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          return 'success';
        },
        'anthropic',
        { ...defaultRetryConfig, retries: 3 }
      );

      assert.strictEqual(result, 'success');
      assert.strictEqual(attempts, 1);
    });

    it('retries on retryable error and succeeds', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            const error: RetryableError = new Error('Rate limited');
            error.status = 429;
            throw error;
          }
          return 'success after retry';
        },
        'anthropic',
        { ...defaultRetryConfig, retries: 3, minTimeout: 10, maxTimeout: 50 }
      );

      assert.strictEqual(result, 'success after retry');
      assert.strictEqual(attempts, 3);
    });

    it('does not retry on non-retryable error', async () => {
      let attempts = 0;

      await assert.rejects(
        async () => {
          await withRetry(
            async () => {
              attempts++;
              const error: RetryableError = new Error('Bad Request');
              error.status = 400;
              throw error;
            },
            'anthropic',
            { ...defaultRetryConfig, retries: 3, minTimeout: 10 }
          );
        },
        (error: Error) => {
          assert.ok(error.message.includes('Bad Request'));
          return true;
        }
      );

      assert.strictEqual(attempts, 1);
    });

    it('respects max retries limit', async () => {
      let attempts = 0;

      await assert.rejects(
        async () => {
          await withRetry(
            async () => {
              attempts++;
              const error: RetryableError = new Error('Service Unavailable');
              error.status = 503;
              throw error;
            },
            'anthropic',
            { ...defaultRetryConfig, retries: 2, minTimeout: 10, maxTimeout: 50 }
          );
        },
        (error: Error) => {
          assert.ok(error.message.includes('Service Unavailable'));
          return true;
        }
      );

      // Initial attempt + 2 retries = 3 total
      assert.strictEqual(attempts, 3);
    });

    it('calls onRetry callback on failed attempts', async () => {
      const retryAttempts: number[] = [];

      await assert.rejects(
        async () => {
          await withRetry(
            async () => {
              const error: RetryableError = new Error('Rate limited');
              error.status = 429;
              throw error;
            },
            'anthropic',
            {
              ...defaultRetryConfig,
              retries: 2,
              minTimeout: 10,
              maxTimeout: 50,
              onRetry: (error) => {
                retryAttempts.push(error.attemptNumber);
              },
            }
          );
        }
      );

      // p-retry calls onFailedAttempt after each failed attempt
      // With retries=2: initial (1) + retry (2) + retry (3) = 3 total attempts
      assert.deepStrictEqual(retryAttempts, [1, 2, 3]);
    });
  });

  describe('server with retry config', () => {
    let server: FastifyInstance;

    afterEach(async () => {
      await server.close();
    });

    it('accepts custom retry configuration', async () => {
      server = createServer({
        retry: {
          retries: 5,
          minTimeout: 500,
          maxTimeout: 10000,
        },
      });

      // Server should be created successfully with custom config
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      assert.strictEqual(response.statusCode, 200);
    });

    it('uses default retry config when not specified', async () => {
      server = createServer();

      // Server should work with defaults
      const response = await server.inject({
        method: 'POST',
        url: '/send',
        payload: { input: 'Hello', dryRun: true },
        headers: { 'content-type': 'application/json' },
      });

      assert.strictEqual(response.statusCode, 200);
    });
  });
});
