import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeInput,
  validateInput,
  sanitizeAndValidate,
  MAX_INPUT_SIZE,
} from './sanitize.js';

describe('sanitizeInput', () => {
  describe('unicode normalization', () => {
    it('normalizes decomposed unicode to composed form', () => {
      // é as e + combining acute accent (NFD) -> é as single character (NFC)
      const decomposed = 'e\u0301'; // NFD form
      const composed = 'é'; // NFC form
      const result = sanitizeInput(decomposed);
      assert.strictEqual(result, composed);
      assert.strictEqual(result.length, 1);
    });

    it('preserves already composed unicode', () => {
      const composed = 'café';
      const result = sanitizeInput(composed);
      assert.strictEqual(result, composed);
    });

    it('normalizes complex unicode sequences', () => {
      // ñ as n + combining tilde
      const decomposed = 'n\u0303';
      const result = sanitizeInput(decomposed);
      assert.strictEqual(result, 'ñ');
    });
  });

  describe('control character stripping', () => {
    it('removes null bytes', () => {
      const input = 'hello\x00world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes bell character', () => {
      const input = 'hello\x07world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes backspace character', () => {
      const input = 'hello\x08world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes escape character', () => {
      const input = 'hello\x1Bworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes DEL character', () => {
      const input = 'hello\x7Fworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('preserves newlines', () => {
      const input = 'hello\nworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'hello\nworld');
    });

    it('preserves tabs', () => {
      const input = 'hello\tworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'hello\tworld');
    });

    it('preserves carriage returns', () => {
      const input = 'hello\rworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'hello\rworld');
    });
  });

  describe('zero-width character stripping', () => {
    it('removes zero-width space', () => {
      const input = 'hello\u200Bworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes zero-width non-joiner', () => {
      const input = 'hello\u200Cworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes zero-width joiner', () => {
      const input = 'hello\u200Dworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes byte order mark', () => {
      const input = '\uFEFFhello world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'hello world');
    });

    it('removes multiple zero-width characters', () => {
      const input = '\u200Bhello\u200C\u200Dworld\uFEFF';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });
  });

  describe('normal text handling', () => {
    it('preserves normal ASCII text unchanged', () => {
      const input = 'Hello, World! 123';
      const result = sanitizeInput(input);
      assert.strictEqual(result, input);
    });

    it('preserves normal unicode text', () => {
      const input = '你好世界';
      const result = sanitizeInput(input);
      assert.strictEqual(result, input);
    });

    it('preserves emojis', () => {
      const input = 'Hello 👋 World 🌍';
      const result = sanitizeInput(input);
      assert.strictEqual(result, input);
    });

    it('preserves punctuation and special characters', () => {
      const input = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      const result = sanitizeInput(input);
      assert.strictEqual(result, input);
    });

    it('preserves multiline text', () => {
      const input = 'line 1\nline 2\nline 3';
      const result = sanitizeInput(input);
      assert.strictEqual(result, input);
    });
  });

  describe('combined scenarios', () => {
    it('handles text with multiple issues', () => {
      // Decomposed é + null byte + zero-width space
      const input = 'cafe\u0301\x00\u200B';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'café');
    });

    it('handles empty string', () => {
      const result = sanitizeInput('');
      assert.strictEqual(result, '');
    });
  });
});

describe('validateInput', () => {
  describe('empty input validation', () => {
    it('rejects empty string', () => {
      const result = validateInput('');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Input is empty');
    });

    it('rejects whitespace-only string', () => {
      const result = validateInput('   ');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Input is empty');
    });

    it('rejects newlines-only string', () => {
      const result = validateInput('\n\n\n');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Input is empty');
    });

    it('rejects tabs-only string', () => {
      const result = validateInput('\t\t\t');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, 'Input is empty');
    });
  });

  describe('size limit validation', () => {
    it('accepts input within size limit', () => {
      const input = 'a'.repeat(1000);
      const result = validateInput(input);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.reason, undefined);
    });

    it('accepts input at exactly size limit', () => {
      const input = 'a'.repeat(MAX_INPUT_SIZE);
      const result = validateInput(input);
      assert.strictEqual(result.valid, true);
    });

    it('rejects input exceeding size limit', () => {
      const input = 'a'.repeat(MAX_INPUT_SIZE + 1);
      const result = validateInput(input);
      assert.strictEqual(result.valid, false);
      assert.ok(result.reason?.includes('exceeds maximum size'));
    });

    it('counts bytes correctly for multibyte characters', () => {
      // Each emoji is 4 bytes
      const emoji = '👋';
      const byteLength = Buffer.byteLength(emoji);
      assert.strictEqual(byteLength, 4);

      // Create input that exceeds byte limit but has fewer characters
      const count = Math.ceil(MAX_INPUT_SIZE / 4) + 1;
      const input = emoji.repeat(count);
      const result = validateInput(input);
      assert.strictEqual(result.valid, false);
    });
  });

  describe('valid input', () => {
    it('accepts normal text', () => {
      const result = validateInput('Hello, World!');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.reason, undefined);
    });

    it('accepts text with leading/trailing whitespace', () => {
      const result = validateInput('  Hello  ');
      assert.strictEqual(result.valid, true);
    });

    it('accepts unicode text', () => {
      const result = validateInput('你好世界 🌍');
      assert.strictEqual(result.valid, true);
    });
  });
});

describe('sanitizeAndValidate', () => {
  it('sanitizes and returns valid input', () => {
    const input = 'hello\x00world'; // Contains null byte
    const result = sanitizeAndValidate(input);
    assert.strictEqual(result, 'helloworld');
  });

  it('throws error for empty input after sanitization', () => {
    // Input that becomes empty after sanitization
    const input = '\x00\u200B';
    assert.throws(
      () => sanitizeAndValidate(input),
      { message: 'Input is empty' }
    );
  });

  it('throws error for oversized input', () => {
    const input = 'a'.repeat(MAX_INPUT_SIZE + 1);
    assert.throws(
      () => sanitizeAndValidate(input),
      { message: new RegExp('exceeds maximum size') }
    );
  });

  it('handles complex input correctly', () => {
    // Decomposed unicode + control chars + zero-width
    const input = 'cafe\u0301\x07\u200B test';
    const result = sanitizeAndValidate(input);
    assert.strictEqual(result, 'café test');
  });
});
