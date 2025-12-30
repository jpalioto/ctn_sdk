import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  parse,
  extractConstraintNames,
  hasConstraints,
  validateConstraints,
  KNOWN_CONSTRAINTS,
} from './parser.js';
import { MalformedConstraintError } from '../schemas/index.js';

describe('Parser', () => {
  describe('parse', () => {
    it('parses simple constraint', () => {
      const result = parse('@precise');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.deepEqual(result.constraints[0]!.params, {});
      assert.equal(result.prompt, '');
    });

    it('parses constraint with text', () => {
      const result = parse('@precise Explain quantum computing');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.equal(result.prompt, 'Explain quantum computing');
    });

    it('parses multiple constraints', () => {
      const result = parse('@precise @terse Explain X');

      assert.equal(result.constraints.length, 2);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.equal(result.constraints[1]!.name, 'terse');
      assert.equal(result.prompt, 'Explain X');
    });

    it('parses constraint with single parameter', () => {
      const result = parse('@lastN[n=5]');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'lastN');
      assert.deepEqual(result.constraints[0]!.params, { n: 5 });
    });

    it('parses constraint with multiple parameters', () => {
      // Use useBuiltinAllowlist: false to test parameter parsing with custom constraints
      const result = parse('@custom[a=1,b=hello,c=true]', { useBuiltinAllowlist: false });

      assert.equal(result.constraints.length, 1);
      assert.deepEqual(result.constraints[0]!.params, {
        a: 1,
        b: 'hello',
        c: true,
      });
    });

    it('parses float parameter values', () => {
      const result = parse('@custom[temp=0.7]', { useBuiltinAllowlist: false });

      assert.equal(result.constraints[0]!.params.temp, 0.7);
    });

    it('parses quoted string parameters', () => {
      const result = parse('@custom[msg="hello world"]', { useBuiltinAllowlist: false });

      assert.equal(result.constraints[0]!.params.msg, 'hello world');
    });

    it('parses boolean parameter values', () => {
      const result = parse('@custom[enabled=true,disabled=false]', { useBuiltinAllowlist: false });

      assert.equal(result.constraints[0]!.params.enabled, true);
      assert.equal(result.constraints[0]!.params.disabled, false);
    });

    it('ignores constraints in middle of text (default startOnly=true)', () => {
      const result = parse('Hello @precise world');

      // With default startOnly=true, constraints in middle are ignored
      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, 'Hello @precise world');
    });

    it('handles constraints in middle of text (legacy startOnly=false)', () => {
      const result = parse('Hello @precise world', { startOnly: false });

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.equal(result.prompt, 'Hello world');
    });

    it('preserves source in result', () => {
      const input = '@precise @terse Explain X';
      const result = parse(input);

      assert.equal(result.source, input);
    });

    it('returns empty constraints for no-constraint input', () => {
      const result = parse('Just regular text');

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, 'Just regular text');
    });

    it('handles empty input', () => {
      const result = parse('');

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '');
    });
  });

  describe('parse with parseConstraints=false', () => {
    it('skips parsing when disabled', () => {
      const result = parse('@precise Explain X', { parseConstraints: false });

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '@precise Explain X');
    });
  });

  describe('parse with boundary', () => {
    it('parses constraints within boundary', () => {
      const result = parse('[[CTN: @precise @terse]] What is X?', {
        constraintBoundary: ['[[CTN:', ']]'],
      });

      assert.equal(result.constraints.length, 2);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.equal(result.constraints[1]!.name, 'terse');
      assert.equal(result.prompt, 'What is X?');
    });

    it('ignores constraints outside boundary', () => {
      const result = parse('@ignored [[CTN: @precise]] What is X?', {
        constraintBoundary: ['[[CTN:', ']]'],
      });

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.ok(result.prompt.includes('@ignored'));
    });

    it('returns input as-is when no boundary found', () => {
      const result = parse('@precise What is X?', {
        constraintBoundary: ['[[CTN:', ']]'],
      });

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '@precise What is X?');
    });

    it('throws on unclosed boundary', () => {
      assert.throws(
        () => parse('[[CTN: @precise What is X?', {
          constraintBoundary: ['[[CTN:', ']]'],
        }),
        MalformedConstraintError
      );
    });
  });

  describe('parse with allowlist', () => {
    it('only parses allowed constraints', () => {
      const result = parse('@precise @terse @custom Explain', {
        allowedConstraints: ['@precise', '@terse'],
      });

      assert.equal(result.constraints.length, 2);
      assert.ok(result.prompt.includes('@custom'));
    });

    it('allows constraints without @ prefix in allowlist', () => {
      const result = parse('@precise Explain', {
        allowedConstraints: ['@precise'],
      });

      assert.equal(result.constraints.length, 1);
    });
  });

  describe('error handling', () => {
    it('throws on invalid parameter format', () => {
      assert.throws(
        // Use useBuiltinAllowlist: false to test error handling with custom constraints
        () => parse('@custom[invalid]', { useBuiltinAllowlist: false }),
        MalformedConstraintError
      );
    });

    it('throws on empty parameter name', () => {
      assert.throws(
        () => parse('@custom[=value]', { useBuiltinAllowlist: false }),
        MalformedConstraintError
      );
    });

    it('throws on invalid parameter format for known constraint', () => {
      assert.throws(
        () => parse('@lastN[invalid]'),
        MalformedConstraintError
      );
    });
  });

  describe('extractConstraintNames', () => {
    it('extracts all constraint names', () => {
      const names = extractConstraintNames('@precise @terse @custom[n=5]');

      assert.deepEqual(names, ['precise', 'terse', 'custom']);
    });

    it('returns empty array for no constraints', () => {
      const names = extractConstraintNames('Just text');

      assert.deepEqual(names, []);
    });
  });

  describe('hasConstraints', () => {
    it('returns true when constraints present', () => {
      assert.ok(hasConstraints('@precise'));
      assert.ok(hasConstraints('text @precise more'));
      assert.ok(hasConstraints('@a @b'));
    });

    it('returns false when no constraints', () => {
      assert.ok(!hasConstraints('no constraints here'));
      assert.ok(!hasConstraints(''));
    });

    it('matches @ followed by word characters (email addresses will match)', () => {
      // Note: email@example.com matches because @example is valid constraint syntax
      // This is by design - use allowlists or boundaries for untrusted input
      assert.ok(hasConstraints('email@example.com'));
    });
  });

  describe('validateConstraints', () => {
    it('returns empty array when all constraints valid', () => {
      const invalid = validateConstraints('@precise @terse', ['precise', 'terse']);

      assert.deepEqual(invalid, []);
    });

    it('returns invalid constraint names', () => {
      const invalid = validateConstraints('@precise @unknown @bad', ['precise']);

      assert.deepEqual(invalid, ['unknown', 'bad']);
    });

    it('handles @ prefix in allowlist', () => {
      const invalid = validateConstraints('@precise', ['@precise']);

      assert.deepEqual(invalid, []);
    });
  });

  describe('KNOWN_CONSTRAINTS', () => {
    it('contains operational strategy constraints', () => {
      assert.ok(KNOWN_CONSTRAINTS.has('precise'));
      assert.ok(KNOWN_CONSTRAINTS.has('creative'));
      assert.ok(KNOWN_CONSTRAINTS.has('terse'));
      assert.ok(KNOWN_CONSTRAINTS.has('analytical'));
    });

    it('contains CTN strategy constraints', () => {
      assert.ok(KNOWN_CONSTRAINTS.has('clarity'));
      assert.ok(KNOWN_CONSTRAINTS.has('stable'));
      assert.ok(KNOWN_CONSTRAINTS.has('research'));
    });

    it('contains aliases', () => {
      assert.ok(KNOWN_CONSTRAINTS.has('deterministic')); // alias for precise
      assert.ok(KNOWN_CONSTRAINTS.has('brief')); // alias for terse
      assert.ok(KNOWN_CONSTRAINTS.has('concise')); // alias for terse
    });
  });

  describe('adversarial security inputs', () => {
    it('homoglyph Cyrillic а does not match analytical', () => {
      // @аnalytical (Cyrillic U+0430 at start) should NOT match @analytical
      // Cyrillic 'а' looks identical to ASCII 'a' but is a different codepoint
      // Since Cyrillic doesn't match \w (ASCII-only), the regex doesn't recognize it as a constraint
      const warnings: string[] = [];
      const result = parse('@\u0430nalytical hello', {
        onUnknownConstraint: (name) => warnings.push(name),
      });

      // Not even recognized as a constraint pattern (Cyrillic doesn't match \w)
      assert.equal(result.constraints.length, 0);
      // Passes through as literal text unchanged
      assert.equal(result.prompt, '@\u0430nalytical hello');
      // No warning - not recognized as a constraint at all
      assert.deepEqual(warnings, []);
    });

    it('homoglyph Cyrillic а in middle of name does not match', () => {
      // @analуtical (Cyrillic у U+0443 in middle) should not match @analytical
      // The regex matches @anal then stops at non-ASCII
      const warnings: string[] = [];
      const result = parse('@anal\u0443tical hello', {
        onUnknownConstraint: (name) => warnings.push(name),
      });

      // 'anal' is matched but not a known constraint
      assert.equal(result.constraints.length, 0);
      // Warning should fire for the partial match 'anal'
      assert.deepEqual(warnings, ['anal']);
    });

    it('zero-width chars in constraint name are stripped before matching', () => {
      // @ana\u200Blytical → should become @analytical after sanitization
      const result = parse('@ana\u200Blytical hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, 'hello');
    });

    it('zero-width space between @ and name is stripped', () => {
      // @\u200Banalytical → @ + ZWSP + analytical → should match @analytical
      const result = parse('@\u200Banalytical hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
    });

    it('RTL override character is stripped', () => {
      const result = parse('@analytical\u202E evil');

      // RTL override should be stripped, leaving clean text
      assert.equal(result.constraints.length, 1);
      assert.ok(!result.prompt.includes('\u202E'));
      assert.equal(result.prompt, 'evil');
    });

    it('null byte in constraint name is stripped', () => {
      // @analy\x00tical → after stripping null, becomes @analytical
      const result = parse('@analy\x00tical hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
    });

    it('control characters in prompt are stripped', () => {
      const result = parse('@analytical hello\x07world\x08test');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.prompt, 'helloworldtest');
    });

    it('multiple invisible characters do not break parsing', () => {
      // Mix of zero-width, RTL, and control chars
      const result = parse('@\u200Bana\u200Clyt\u200Dical\u202E \x00hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, 'hello');
    });

    it('bidirectional embedding does not hide constraint injection', () => {
      // Attempt to hide malicious text using RTL embedding
      const result = parse('@analytical \u202Bhidden\u202C visible');

      assert.equal(result.constraints.length, 1);
      // RTL embedding stripped, text remains
      assert.ok(!result.prompt.includes('\u202B'));
      assert.ok(!result.prompt.includes('\u202C'));
      assert.ok(result.prompt.includes('hidden'));
      assert.ok(result.prompt.includes('visible'));
    });

    it('preserves original source with invisible chars for debugging', () => {
      const original = '@ana\u200Blytical hello';
      const result = parse(original);

      // source should preserve original for debugging
      assert.equal(result.source, original);
      // But prompt should be sanitized
      assert.ok(!result.prompt.includes('\u200B'));
    });

    it('zero-width in parameter value is stripped', () => {
      const result = parse('@lastN[n=5\u200B] hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.params.n, 5);
    });

    it('handles LTR/RTL marks in various positions', () => {
      // LTR mark at start, RTL mark in middle
      const result = parse('\u200E@analytical \u200Fhello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, 'hello');
    });

    it('strips bidi isolate controls (U+2066-2069)', () => {
      // Bidi isolate characters should be stripped
      const result = parse('@analy\u2066\u2067\u2068\u2069tical hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, 'hello');
    });
  });

  describe('external review test cases', () => {
    it('test 1: NFD é at start does not interfere with constraint', () => {
      // NFD é (e + combining acute) at start → not a constraint
      // Parser doesn't do NFC normalization, but sanitization before parsing should
      const nfdE = '\u0065\u0301'; // e + combining acute accent
      const input = nfdE + '@terse text';
      const result = parse(input);

      // The NFD characters are not stripped by parser sanitization
      // The result depends on whether NFC normalization happens
      // Since parser only strips control/zero-width, NFD is preserved
      assert.equal(result.constraints.length, 0);
      assert.ok(result.prompt.includes('@terse'));
    });

    it('test 3: ZWSP at start and BOM in middle are stripped, @creative parsed', () => {
      // ZWSP at start, BOM in middle of constraint name
      const input = '\u200B@crea\uFEFFtive action';
      const result = parse(input);

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'creative');
      assert.equal(result.prompt, 'action');
    });

    it('test 4: control chars stripped, tab and newline preserved', () => {
      // \x07 = bell, \x00 = null, \x7F = DEL - all stripped
      // \t and \n preserved in prompt
      const input = '@precise\x07 T\x00ab\t\n\x7FEnd';
      const result = parse(input);

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'precise');
      assert.equal(result.prompt, 'Tab\t\nEnd');
    });

    it('test 5: NBSP (U+00A0) acts as delimiter', () => {
      // NBSP should act as whitespace delimiter between constraint and prompt
      // Note: NBSP at start of prompt is trimmed by parser's whitespace cleanup
      const input = '@terse\u00A0nospace';
      const result = parse(input);

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'terse');
      // NBSP acts as delimiter, gets trimmed from prompt start
      assert.equal(result.prompt, 'nospace');
    });

    it('test 5b: NBSP in middle of prompt is preserved', () => {
      // NBSP in the middle of prompt should be preserved
      const input = '@terse hello\u00A0world';
      const result = parse(input);

      assert.equal(result.constraints.length, 1);
      assert.equal(result.prompt, 'hello\u00A0world');
      assert.ok(result.prompt.includes('\u00A0'));
    });

    it('test 8: combined BOM + NUL in constraint + bidi attack', () => {
      // BOM at start, NUL in constraint name, bidi at end
      const input = '\uFEFF@ana\x00lytical \u202Epmorp\u202C';
      const result = parse(input);

      // BOM stripped, NUL stripped → @analytical matched
      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      // Bidi stripped from prompt
      assert.ok(!result.prompt.includes('\u202E'));
      assert.ok(!result.prompt.includes('\u202C'));
      assert.equal(result.prompt, 'pmorp');
    });

    it('combined attack with multiple invisible chars throughout', () => {
      // Multiple layers of attack vectors
      const input = '\uFEFF\u200B@pre\x00\u200Ccise\u200D\u202E test\u2066\u2069';
      const result = parse(input);

      // All invisible chars stripped → @precise should match
      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'precise');
      // Prompt should be clean
      assert.equal(result.prompt, 'test');
    });
  });

  describe('start-only parsing (default behavior)', () => {
    it('parses constraint at start', () => {
      const result = parse('@analytical hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, 'hello');
    });

    it('leaves constraint in middle as literal text', () => {
      const result = parse('hello @analytical');

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, 'hello @analytical');
    });

    it('handles unknown constraint at start - passthrough with warning', () => {
      const warnings: string[] = [];
      const result = parse('@profile def foo', {
        onUnknownConstraint: (name) => warnings.push(name),
      });

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '@profile def foo');
      assert.deepEqual(warnings, ['profile']);
      assert.deepEqual(result.unknownConstraints, ['profile']);
    });

    it('is case insensitive for known constraints', () => {
      const result = parse('@ANALYTICAL hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'ANALYTICAL');
      assert.equal(result.prompt, 'hello');
    });

    it('handles stacking multiple constraints at start', () => {
      const result = parse('@analytical @terse hello');

      assert.equal(result.constraints.length, 2);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.constraints[1]!.name, 'terse');
      assert.equal(result.prompt, 'hello');
    });

    it('treats malformed @@ as literal text', () => {
      const result = parse('@@analytical hello');

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '@@analytical hello');
    });

    it('stops parsing at first unknown constraint', () => {
      const warnings: string[] = [];
      const result = parse('@analytical @unknown @terse text', {
        onUnknownConstraint: (name) => warnings.push(name),
      });

      // Should parse @analytical, then stop at @unknown
      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, '@unknown @terse text');
      assert.deepEqual(warnings, ['unknown']);
    });

    it('handles constraint with parameters at start', () => {
      const result = parse('@lastN[n=5] hello');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'lastN');
      assert.deepEqual(result.constraints[0]!.params, { n: 5 });
      assert.equal(result.prompt, 'hello');
    });

    it('preserves @mentions in prompt text', () => {
      const result = parse('@analytical Check @user profile');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'analytical');
      assert.equal(result.prompt, 'Check @user profile');
    });

    it('handles empty input', () => {
      const result = parse('');

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '');
    });

    it('handles whitespace-only input', () => {
      const result = parse('   ');

      assert.equal(result.constraints.length, 0);
      assert.equal(result.prompt, '');
    });

    it('handles constraint-only input', () => {
      const result = parse('@precise');

      assert.equal(result.constraints.length, 1);
      assert.equal(result.prompt, '');
    });

    it('can disable builtin allowlist for custom validation', () => {
      const result = parse('@myCustom hello', {
        useBuiltinAllowlist: false,
        onUnknownConstraint: () => {}, // suppress warning
      });

      // Without allowlist, all constraints are parsed
      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'myCustom');
    });

    it('explicit allowlist overrides builtin', () => {
      const result = parse('@myCustom @precise hello', {
        allowedConstraints: ['@myCustom'],
        onUnknownConstraint: () => {},
      });

      // Only @myCustom is allowed, @precise is unknown
      assert.equal(result.constraints.length, 1);
      assert.equal(result.constraints[0]!.name, 'myCustom');
      assert.ok(result.prompt.includes('@precise'));
    });
  });
});
