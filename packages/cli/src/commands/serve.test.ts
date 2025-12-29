import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createServer, startServer, ProviderPool } from './serve.js';
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
});
