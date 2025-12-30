import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeError,
  stripSensitiveInfo,
  getErrorStatusCode,
  ErrorCode,
  ValidationError,
  ProviderError,
  ConstraintError,
  TimeoutError,
  AuthError,
  RateLimitError,
  AppError,
  silentErrorLogger,
  type ErrorLogger,
} from './errors.js';

describe('sanitizeError', () => {
  describe('typed errors', () => {
    it('returns ValidationError message and code', () => {
      const error = new ValidationError('Input cannot be empty');
      const result = sanitizeError(error);

      assert.strictEqual(result.error, 'Input cannot be empty');
      assert.strictEqual(result.code, ErrorCode.VALIDATION_ERROR);
    });

    it('returns ProviderError message and code', () => {
      const error = new ProviderError('Request failed', 'anthropic');
      const result = sanitizeError(error);

      assert.strictEqual(result.error, 'Request failed');
      assert.strictEqual(result.code, ErrorCode.PROVIDER_ERROR);
    });

    it('returns ConstraintError message and code', () => {
      const error = new ConstraintError('Unknown constraint @foo');
      const result = sanitizeError(error);

      assert.strictEqual(result.error, 'Unknown constraint @foo');
      assert.strictEqual(result.code, ErrorCode.CONSTRAINT_ERROR);
    });

    it('returns TimeoutError message and code', () => {
      const error = new TimeoutError('Request timed out after 30s');
      const result = sanitizeError(error);

      assert.strictEqual(result.error, 'Request timed out after 30s');
      assert.strictEqual(result.code, ErrorCode.TIMEOUT_ERROR);
    });

    it('returns AuthError message and code', () => {
      const error = new AuthError('Invalid credentials');
      const result = sanitizeError(error);

      assert.strictEqual(result.error, 'Invalid credentials');
      assert.strictEqual(result.code, ErrorCode.AUTH_ERROR);
    });

    it('returns RateLimitError message and code', () => {
      const error = new RateLimitError('Too many requests');
      const result = sanitizeError(error);

      assert.strictEqual(result.error, 'Too many requests');
      assert.strictEqual(result.code, ErrorCode.RATE_LIMIT_ERROR);
    });
  });

  describe('heuristic error detection', () => {
    it('detects API key errors', () => {
      const error = new Error('Missing API key for provider');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'API key is missing or invalid');
      assert.strictEqual(result.code, ErrorCode.AUTH_ERROR);
    });

    it('detects api_key errors (underscore variant)', () => {
      const error = new Error('Invalid api_key provided');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'API key is missing or invalid');
      assert.strictEqual(result.code, ErrorCode.AUTH_ERROR);
    });

    it('detects unauthorized errors', () => {
      const error = new Error('Unauthorized access');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'API key is missing or invalid');
      assert.strictEqual(result.code, ErrorCode.AUTH_ERROR);
    });

    it('detects rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Rate limit exceeded, please retry later');
      assert.strictEqual(result.code, ErrorCode.RATE_LIMIT_ERROR);
    });

    it('detects "too many requests" errors', () => {
      const error = new Error('Too many requests to the API');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Rate limit exceeded, please retry later');
      assert.strictEqual(result.code, ErrorCode.RATE_LIMIT_ERROR);
    });

    it('detects timeout errors', () => {
      const error = new Error('Request timed out');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Request timed out');
      assert.strictEqual(result.code, ErrorCode.TIMEOUT_ERROR);
    });

    it('detects AbortError by name', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Request timed out');
      assert.strictEqual(result.code, ErrorCode.TIMEOUT_ERROR);
    });

    it('detects network errors (ECONNREFUSED)', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:443');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Provider service unavailable');
      assert.strictEqual(result.code, ErrorCode.PROVIDER_ERROR);
    });

    it('detects validation-like errors with sensitive info stripped', () => {
      const error = new Error('Missing required field at /home/user/code/file.ts:42');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.code, ErrorCode.VALIDATION_ERROR);
      assert.ok(!result.error.includes('/home/user'));
      assert.ok(result.error.includes('[redacted]'));
    });
  });

  describe('unknown errors', () => {
    it('returns generic error for unknown Error types', () => {
      const error = new Error('Some internal failure');
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Internal server error');
      assert.strictEqual(result.code, ErrorCode.INTERNAL_ERROR);
    });

    it('returns generic error for non-Error objects', () => {
      const error = { message: 'Some object' };
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Internal server error');
      assert.strictEqual(result.code, ErrorCode.INTERNAL_ERROR);
    });

    it('returns generic error for string errors', () => {
      const error = 'Just a string';
      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Internal server error');
      assert.strictEqual(result.code, ErrorCode.INTERNAL_ERROR);
    });

    it('returns generic error for null', () => {
      const result = sanitizeError(null, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Internal server error');
      assert.strictEqual(result.code, ErrorCode.INTERNAL_ERROR);
    });

    it('returns generic error for undefined', () => {
      const result = sanitizeError(undefined, { logger: silentErrorLogger });

      assert.strictEqual(result.error, 'Internal server error');
      assert.strictEqual(result.code, ErrorCode.INTERNAL_ERROR);
    });

    it('logs internal errors', () => {
      const logged: unknown[] = [];
      const mockLogger: ErrorLogger = {
        error: (_msg, err) => logged.push(err),
      };

      const error = new Error('Internal failure');
      sanitizeError(error, { logger: mockLogger });

      assert.strictEqual(logged.length, 1);
      assert.strictEqual(logged[0], error);
    });
  });

  describe('never exposes stack traces', () => {
    it('does not include stack trace in error message', () => {
      const error = new Error('Test error');
      error.stack = `Error: Test error
    at processInput (/home/user/code/ctn_sdk/packages/cli/src/process.ts:42:15)
    at async handle (/home/user/code/ctn_sdk/packages/cli/src/server.ts:100:3)`;

      const result = sanitizeError(error, { logger: silentErrorLogger });

      assert.ok(!result.error.includes('at processInput'));
      assert.ok(!result.error.includes('/home/user'));
      assert.ok(!result.error.includes('.ts:'));
    });
  });
});

describe('stripSensitiveInfo', () => {
  it('removes Unix file paths', () => {
    const input = 'Error at /home/user/code/project/file.ts:42';
    const result = stripSensitiveInfo(input);

    assert.ok(!result.includes('/home/user'));
    assert.ok(result.includes('[redacted]'));
  });

  it('removes Windows file paths', () => {
    const input = 'Error at C:\\Users\\john\\code\\project\\file.ts:42';
    const result = stripSensitiveInfo(input);

    assert.ok(!result.includes('C:\\Users'));
    assert.ok(result.includes('[redacted]'));
  });

  it('removes stack traces', () => {
    const input = `Error occurred
    at processInput (/home/user/code/file.ts:42:15)
    at handle (/home/user/code/server.ts:100:3)`;
    const result = stripSensitiveInfo(input);

    assert.ok(!result.includes('at processInput'));
    assert.ok(!result.includes('at handle'));
  });

  it('removes node_modules paths', () => {
    const input = 'Error in node_modules/some-package/index.js';
    const result = stripSensitiveInfo(input);

    assert.ok(!result.includes('node_modules'));
  });

  it('removes node internal paths', () => {
    const input = 'Error at node:internal/process/task_queues:95:5';
    const result = stripSensitiveInfo(input);

    assert.ok(!result.includes('node:internal'));
  });

  it('preserves non-sensitive text', () => {
    const input = 'Input cannot be empty';
    const result = stripSensitiveInfo(input);

    assert.strictEqual(result, 'Input cannot be empty');
  });

  it('collapses multiple redactions', () => {
    const input = 'Error at /home/user/a.ts /home/user/b.ts /home/user/c.ts';
    const result = stripSensitiveInfo(input);

    // Should not have multiple consecutive [redacted]
    assert.ok(!result.includes('[redacted] [redacted]'));
  });

  describe('adversarial injection attempts', () => {
    it('strips paths with zero-width space injection', () => {
      // Attacker tries to hide path using zero-width space
      const input = 'Error at /home/\u200Buser/code/secret.ts';
      const result = stripSensitiveInfo(input);

      assert.ok(!result.includes('home'));
      assert.ok(!result.includes('user'));
      assert.ok(!result.includes('secret'));
    });

    it('strips paths with RTL override injection', () => {
      // Attacker tries to use RTL override to confuse path detection
      const input = 'Error at /home/user\u202E/code.ts';
      const result = stripSensitiveInfo(input);

      assert.ok(!result.includes('home'));
      assert.ok(!result.includes('user'));
    });

    it('strips Windows paths with zero-width injection', () => {
      const input = 'Error at C:\\Users\\\u200Bjohn\\code\\file.ts';
      const result = stripSensitiveInfo(input);

      assert.ok(!result.includes('Users'));
      assert.ok(!result.includes('john'));
    });

    it('strips paths with null byte injection', () => {
      // Null bytes in path (though less common in JS strings)
      const input = 'Error at /home/user\x00/code/file.ts';
      const result = stripSensitiveInfo(input);

      assert.ok(!result.includes('/home'));
    });

    it('handles bidirectional embedding around paths', () => {
      // Attacker tries to embed path in RTL context
      const input = 'Error \u202B/home/user/secret.ts\u202C happened';
      const result = stripSensitiveInfo(input);

      assert.ok(!result.includes('home'));
      assert.ok(!result.includes('secret'));
    });
  });
});

describe('getErrorStatusCode', () => {
  it('returns 400 for ValidationError', () => {
    const error = new ValidationError('Bad input');
    assert.strictEqual(getErrorStatusCode(error), 400);
  });

  it('returns 400 for ConstraintError', () => {
    const error = new ConstraintError('Invalid constraint');
    assert.strictEqual(getErrorStatusCode(error), 400);
  });

  it('returns 401 for AuthError', () => {
    const error = new AuthError('Unauthorized');
    assert.strictEqual(getErrorStatusCode(error), 401);
  });

  it('returns 429 for RateLimitError', () => {
    const error = new RateLimitError('Too many requests');
    assert.strictEqual(getErrorStatusCode(error), 429);
  });

  it('returns 502 for ProviderError', () => {
    const error = new ProviderError('Provider failed');
    assert.strictEqual(getErrorStatusCode(error), 502);
  });

  it('returns 504 for TimeoutError', () => {
    const error = new TimeoutError();
    assert.strictEqual(getErrorStatusCode(error), 504);
  });

  it('returns 500 for unknown errors', () => {
    const error = new Error('Unknown');
    assert.strictEqual(getErrorStatusCode(error), 500);
  });

  it('returns correct status code for custom AppError', () => {
    const error = new AppError('Custom error', ErrorCode.INTERNAL_ERROR, 503);
    assert.strictEqual(getErrorStatusCode(error), 503);
  });
});

describe('AppError subclasses', () => {
  it('ValidationError has correct properties', () => {
    const error = new ValidationError('Test');
    assert.strictEqual(error.name, 'ValidationError');
    assert.strictEqual(error.code, ErrorCode.VALIDATION_ERROR);
    assert.strictEqual(error.statusCode, 400);
  });

  it('ProviderError stores provider name', () => {
    const error = new ProviderError('Failed', 'anthropic');
    assert.strictEqual(error.provider, 'anthropic');
  });

  it('ProviderError stores original error', () => {
    const original = new Error('Network error');
    const error = new ProviderError('Failed', 'anthropic', original);
    assert.strictEqual(error.originalError, original);
  });

  it('TimeoutError has default message', () => {
    const error = new TimeoutError();
    assert.strictEqual(error.message, 'Request timed out');
  });

  it('AuthError has default message', () => {
    const error = new AuthError();
    assert.strictEqual(error.message, 'Authentication required');
  });

  it('RateLimitError has default message', () => {
    const error = new RateLimitError();
    assert.strictEqual(error.message, 'Rate limit exceeded');
  });
});
