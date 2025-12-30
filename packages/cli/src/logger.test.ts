import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createLogger,
  parseLogLevel,
  isValidLogLevel,
  silentLogger,
  defaultLoggerConfig,
  type LogLevel,
  type Logger,
} from './logger.js';

describe('createLogger', () => {
  describe('log level filtering', () => {
    it('logs at error level when level is error', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'error',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      assert.strictEqual(logs.length, 1);
      assert.ok(logs[0]!.includes('Error message'));
    });

    it('logs at warn and error when level is warn', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'warn',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      assert.strictEqual(logs.length, 2);
      assert.ok(logs.some((l) => l.includes('Error message')));
      assert.ok(logs.some((l) => l.includes('Warn message')));
    });

    it('logs at info, warn, and error when level is info', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      assert.strictEqual(logs.length, 3);
      assert.ok(logs.some((l) => l.includes('Error message')));
      assert.ok(logs.some((l) => l.includes('Warn message')));
      assert.ok(logs.some((l) => l.includes('Info message')));
    });

    it('logs all levels when level is debug', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'debug',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      assert.strictEqual(logs.length, 4);
    });
  });

  describe('redact functionality', () => {
    it('redacts text when redactPrompts is true', () => {
      const logger = createLogger({
        level: 'info',
        redactPrompts: true,
      });

      const result = logger.redact('sensitive prompt content');
      assert.strictEqual(result, '[REDACTED]');
    });

    it('does not redact text when redactPrompts is false', () => {
      const logger = createLogger({
        level: 'info',
        redactPrompts: false,
      });

      const result = logger.redact('sensitive prompt content');
      assert.strictEqual(result, 'sensitive prompt content');
    });
  });

  describe('logRequest', () => {
    it('logs request at info level', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.logRequest({
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'POST',
        path: '/send',
        status: 200,
        duration_ms: 123,
        provider: 'anthropic',
      });

      assert.strictEqual(logs.length, 1);
      const entry = JSON.parse(logs[0]!);
      assert.strictEqual(entry.method, 'POST');
      assert.strictEqual(entry.path, '/send');
      assert.strictEqual(entry.status, 200);
      assert.strictEqual(entry.provider, 'anthropic');
    });

    it('does not log request when level is warn', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'warn',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.logRequest({
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'POST',
        path: '/send',
        status: 200,
        duration_ms: 123,
      });

      assert.strictEqual(logs.length, 0);
    });

    it('redacts input in request when redactPrompts is true', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        redactPrompts: true,
        output: (json) => logs.push(json),
      });

      logger.logRequest({
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'POST',
        path: '/send',
        status: 200,
        duration_ms: 123,
        input: '@analytical explain quantum computing',
      });

      assert.strictEqual(logs.length, 1);
      const entry = JSON.parse(logs[0]!);
      assert.strictEqual(entry.input, '[REDACTED]');
    });

    it('does not redact input when redactPrompts is false', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.logRequest({
        timestamp: '2024-01-01T00:00:00.000Z',
        method: 'POST',
        path: '/send',
        status: 200,
        duration_ms: 123,
        input: '@analytical explain quantum computing',
      });

      assert.strictEqual(logs.length, 1);
      const entry = JSON.parse(logs[0]!);
      assert.strictEqual(entry.input, '@analytical explain quantum computing');
    });
  });

  describe('isLevelEnabled', () => {
    it('returns true for enabled levels', () => {
      const logger = createLogger({ level: 'info', redactPrompts: false });

      assert.strictEqual(logger.isLevelEnabled('error'), true);
      assert.strictEqual(logger.isLevelEnabled('warn'), true);
      assert.strictEqual(logger.isLevelEnabled('info'), true);
      assert.strictEqual(logger.isLevelEnabled('debug'), false);
    });

    it('returns true for all levels at debug', () => {
      const logger = createLogger({ level: 'debug', redactPrompts: false });

      assert.strictEqual(logger.isLevelEnabled('error'), true);
      assert.strictEqual(logger.isLevelEnabled('warn'), true);
      assert.strictEqual(logger.isLevelEnabled('info'), true);
      assert.strictEqual(logger.isLevelEnabled('debug'), true);
    });

    it('returns true only for error at error level', () => {
      const logger = createLogger({ level: 'error', redactPrompts: false });

      assert.strictEqual(logger.isLevelEnabled('error'), true);
      assert.strictEqual(logger.isLevelEnabled('warn'), false);
      assert.strictEqual(logger.isLevelEnabled('info'), false);
      assert.strictEqual(logger.isLevelEnabled('debug'), false);
    });
  });

  describe('structured output', () => {
    it('outputs valid JSON', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.info('Test message', { key: 'value', count: 42 });

      assert.strictEqual(logs.length, 1);
      const entry = JSON.parse(logs[0]!);
      assert.strictEqual(entry.level, 'info');
      assert.strictEqual(entry.message, 'Test message');
      assert.strictEqual(entry.key, 'value');
      assert.strictEqual(entry.count, 42);
      assert.ok(entry.timestamp);
    });

    it('includes timestamp in ISO format', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        redactPrompts: false,
        output: (json) => logs.push(json),
      });

      logger.info('Test');

      const entry = JSON.parse(logs[0]!);
      // Should be valid ISO date
      const date = new Date(entry.timestamp);
      assert.ok(!isNaN(date.getTime()));
    });
  });

  describe('config property', () => {
    it('exposes configuration', () => {
      const logger = createLogger({
        level: 'debug',
        redactPrompts: true,
      });

      assert.strictEqual(logger.config.level, 'debug');
      assert.strictEqual(logger.config.redactPrompts, true);
    });

    it('uses defaults when not specified', () => {
      const logger = createLogger({});

      assert.strictEqual(logger.config.level, defaultLoggerConfig.level);
      assert.strictEqual(logger.config.redactPrompts, defaultLoggerConfig.redactPrompts);
    });
  });
});

describe('parseLogLevel', () => {
  it('parses valid log levels', () => {
    assert.strictEqual(parseLogLevel('error'), 'error');
    assert.strictEqual(parseLogLevel('warn'), 'warn');
    assert.strictEqual(parseLogLevel('info'), 'info');
    assert.strictEqual(parseLogLevel('debug'), 'debug');
  });

  it('is case insensitive', () => {
    assert.strictEqual(parseLogLevel('ERROR'), 'error');
    assert.strictEqual(parseLogLevel('WARN'), 'warn');
    assert.strictEqual(parseLogLevel('INFO'), 'info');
    assert.strictEqual(parseLogLevel('DEBUG'), 'debug');
  });

  it('returns default for invalid level', () => {
    assert.strictEqual(parseLogLevel('invalid'), 'info');
    assert.strictEqual(parseLogLevel('invalid', 'error'), 'error');
  });
});

describe('isValidLogLevel', () => {
  it('returns true for valid levels', () => {
    assert.strictEqual(isValidLogLevel('error'), true);
    assert.strictEqual(isValidLogLevel('warn'), true);
    assert.strictEqual(isValidLogLevel('info'), true);
    assert.strictEqual(isValidLogLevel('debug'), true);
  });

  it('returns false for invalid levels', () => {
    assert.strictEqual(isValidLogLevel('invalid'), false);
    assert.strictEqual(isValidLogLevel('ERROR'), false); // case sensitive
    assert.strictEqual(isValidLogLevel(''), false);
  });
});

describe('silentLogger', () => {
  it('does not output anything', () => {
    // silentLogger should not throw
    silentLogger.error('test');
    silentLogger.warn('test');
    silentLogger.info('test');
    silentLogger.debug('test');
    silentLogger.logRequest({
      timestamp: '2024-01-01T00:00:00.000Z',
      method: 'GET',
      path: '/',
      status: 200,
      duration_ms: 0,
    });
  });

  it('does not redact text', () => {
    assert.strictEqual(silentLogger.redact('test'), 'test');
  });

  it('reports all levels as disabled', () => {
    assert.strictEqual(silentLogger.isLevelEnabled('error'), false);
    assert.strictEqual(silentLogger.isLevelEnabled('info'), false);
  });
});

describe('debug logging with input and response data', () => {
  it('includes input in debug logs when enabled', () => {
    const logs: string[] = [];
    const logger = createLogger({
      level: 'debug',
      redactPrompts: false,
      output: (json) => logs.push(json),
    });

    logger.logRequest({
      timestamp: '2024-01-01T00:00:00.000Z',
      method: 'POST',
      path: '/send',
      status: 200,
      duration_ms: 123,
      input: '@analytical explain something',
      output_length: 500,
      tokens_in: 50,
      tokens_out: 100,
    });

    const entry = JSON.parse(logs[0]!);
    assert.strictEqual(entry.input, '@analytical explain something');
    assert.strictEqual(entry.output_length, 500);
    assert.strictEqual(entry.tokens_in, 50);
    assert.strictEqual(entry.tokens_out, 100);
  });

  it('redacts input in debug logs when redactPrompts is true', () => {
    const logs: string[] = [];
    const logger = createLogger({
      level: 'debug',
      redactPrompts: true,
      output: (json) => logs.push(json),
    });

    logger.logRequest({
      timestamp: '2024-01-01T00:00:00.000Z',
      method: 'POST',
      path: '/send',
      status: 200,
      duration_ms: 123,
      input: 'sensitive data',
      output_length: 500,
    });

    const entry = JSON.parse(logs[0]!);
    assert.strictEqual(entry.input, '[REDACTED]');
    // output_length and tokens are NOT redacted - only input content
    assert.strictEqual(entry.output_length, 500);
  });
});
