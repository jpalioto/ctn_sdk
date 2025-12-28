import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  parse,
  extractConstraintNames,
  hasConstraints,
  validateConstraints,
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
      const result = parse('@custom[a=1,b=hello,c=true]');

      assert.equal(result.constraints.length, 1);
      assert.deepEqual(result.constraints[0]!.params, {
        a: 1,
        b: 'hello',
        c: true,
      });
    });

    it('parses float parameter values', () => {
      const result = parse('@custom[temp=0.7]');

      assert.equal(result.constraints[0]!.params.temp, 0.7);
    });

    it('parses quoted string parameters', () => {
      const result = parse('@custom[msg="hello world"]');

      assert.equal(result.constraints[0]!.params.msg, 'hello world');
    });

    it('parses boolean parameter values', () => {
      const result = parse('@custom[enabled=true,disabled=false]');

      assert.equal(result.constraints[0]!.params.enabled, true);
      assert.equal(result.constraints[0]!.params.disabled, false);
    });

    it('handles constraints in middle of text', () => {
      const result = parse('Hello @precise world');

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
        () => parse('@custom[invalid]'),
        MalformedConstraintError
      );
    });

    it('throws on empty parameter name', () => {
      assert.throws(
        () => parse('@custom[=value]'),
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
});
