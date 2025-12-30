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

  describe('bidirectional text control stripping', () => {
    it('removes left-to-right mark', () => {
      const input = 'hello\u200Eworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes right-to-left mark', () => {
      const input = 'hello\u200Fworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes left-to-right embedding', () => {
      const input = 'hello\u202Aworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes right-to-left embedding', () => {
      const input = 'hello\u202Bworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes pop directional formatting', () => {
      const input = 'hello\u202Cworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes left-to-right override', () => {
      const input = 'hello\u202Dworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes right-to-left override (most dangerous)', () => {
      // RTL override can make "hello" display as "olleh"
      const input = 'hello\u202Eworld';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes multiple bidirectional controls', () => {
      const input = '\u202Ehello\u200E\u200Fworld\u202D';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('handles RTL attack attempting to hide text', () => {
      // Attacker tries: "good\u202Elive" which displays as "goodevil"
      const input = 'good\u202Elive';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'goodlive');
      assert.ok(!result.includes('\u202E'));
    });
  });

  describe('bidi isolate controls stripping', () => {
    it('removes left-to-right isolate', () => {
      const input = 'hello\u2066world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes right-to-left isolate', () => {
      const input = 'hello\u2067world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes first strong isolate', () => {
      const input = 'hello\u2068world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes pop directional isolate', () => {
      const input = 'hello\u2069world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'helloworld');
    });

    it('removes all bidi isolate controls in combination', () => {
      const input = '\u2066start\u2067middle\u2068end\u2069';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'startmiddleend');
    });
  });

  describe('external review test cases', () => {
    it('normalizes NFD to NFC before other processing', () => {
      // NFD é (e + combining acute) at start → normalized to NFC é
      const nfdE = '\u0065\u0301'; // e + combining acute accent
      const input = nfdE + '@terse text';
      const result = sanitizeInput(input);
      // Should normalize to composed é, preserving the rest
      assert.strictEqual(result, 'é@terse text');
    });

    it('strips control chars but preserves tab and newline', () => {
      // \x07 = bell, \x00 = null, \x7F = DEL - all stripped
      // \t and \n preserved
      const input = 'T\x00ab\t\n\x07\x7FEnd';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'Tab\t\nEnd');
    });

    it('preserves NBSP as valid whitespace', () => {
      // NBSP (U+00A0) should NOT be stripped - it's valid whitespace
      const input = 'hello\u00A0world';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'hello\u00A0world');
      assert.ok(result.includes('\u00A0'));
    });

    it('handles combined BOM + NUL + bidi attack', () => {
      // Combined attack: BOM at start, NUL in middle, bidi at end
      const input = '\uFEFFana\x00lytical \u202Epmorp\u202C';
      const result = sanitizeInput(input);
      // BOM stripped, NUL stripped, bidi stripped
      assert.strictEqual(result, 'analytical pmorp');
      assert.ok(!result.includes('\uFEFF'));
      assert.ok(!result.includes('\x00'));
      assert.ok(!result.includes('\u202E'));
      assert.ok(!result.includes('\u202C'));
    });

    it('handles ZWSP at start and BOM in middle', () => {
      // ZWSP at start, BOM in middle → both stripped
      const input = '\u200Bcrea\uFEFFtive action';
      const result = sanitizeInput(input);
      assert.strictEqual(result, 'creative action');
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

    it('external review: exactly 100KB is valid', () => {
      // MAX_INPUT_SIZE is 100000 bytes
      // '@casual ' is 8 bytes, so we need 100000 - 8 = 99992 more bytes
      const prefix = '@casual ';
      const paddingLength = MAX_INPUT_SIZE - Buffer.byteLength(prefix);
      const input = prefix + 'A'.repeat(paddingLength);
      assert.strictEqual(Buffer.byteLength(input), MAX_INPUT_SIZE);
      const result = validateInput(input);
      assert.strictEqual(result.valid, true);
    });

    it('external review: 100KB + 1 is invalid', () => {
      // One byte over the limit
      const input = 'A'.repeat(MAX_INPUT_SIZE + 1);
      assert.strictEqual(Buffer.byteLength(input), MAX_INPUT_SIZE + 1);
      const result = validateInput(input);
      assert.strictEqual(result.valid, false);
      assert.ok(result.reason?.includes('exceeds maximum size'));
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
