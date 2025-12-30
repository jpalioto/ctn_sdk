import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  UNIVERSAL_CONSTRAINTS,
  KNOWN_CONSTRAINT_NAMES,
  getConstraintByName,
  isKnownConstraint,
  getSteeringConstraints,
  getMechanicalConstraints,
  type UniversalConstraint,
} from './constraints.js';

describe('Universal Constraint Vocabulary', () => {
  describe('UNIVERSAL_CONSTRAINTS', () => {
    it('exports a non-empty array of constraints', () => {
      assert.ok(Array.isArray(UNIVERSAL_CONSTRAINTS));
      assert.ok(UNIVERSAL_CONSTRAINTS.length > 0);
    });

    it('all constraints have required properties', () => {
      for (const constraint of UNIVERSAL_CONSTRAINTS) {
        assert.ok(typeof constraint.name === 'string', `name should be string`);
        assert.ok(constraint.name.length > 0, `name should not be empty`);
        assert.ok(Array.isArray(constraint.aliases), `aliases should be array`);
        assert.ok(
          constraint.type === 'steering' || constraint.type === 'mechanical',
          `type should be steering or mechanical`
        );
      }
    });

    it('contains expected steering constraints', () => {
      const names = UNIVERSAL_CONSTRAINTS.map((c) => c.name);
      assert.ok(names.includes('analytical'));
      assert.ok(names.includes('terse'));
      assert.ok(names.includes('verbose'));
      assert.ok(names.includes('precise'));
      assert.ok(names.includes('creative'));
      assert.ok(names.includes('formal'));
      assert.ok(names.includes('casual'));
      assert.ok(names.includes('strict'));
      assert.ok(names.includes('flexible'));
    });

    it('contains expected mechanical constraints', () => {
      const names = UNIVERSAL_CONSTRAINTS.map((c) => c.name);
      assert.ok(names.includes('nomemory'));
      assert.ok(names.includes('lastN'));
    });

    it('contains expected CTN-specific constraints', () => {
      const names = UNIVERSAL_CONSTRAINTS.map((c) => c.name);
      assert.ok(names.includes('clarity'));
      assert.ok(names.includes('smooth'));
      assert.ok(names.includes('focused'));
      assert.ok(names.includes('structural'));
      assert.ok(names.includes('stable'));
      assert.ok(names.includes('research'));
    });

    it('mechanical constraints have descriptions', () => {
      const mechanical = UNIVERSAL_CONSTRAINTS.filter((c) => c.type === 'mechanical');
      for (const constraint of mechanical) {
        assert.ok(
          constraint.description,
          `Mechanical constraint ${constraint.name} should have description`
        );
      }
    });

    it('has no duplicate primary names', () => {
      const names = UNIVERSAL_CONSTRAINTS.map((c) => c.name);
      const uniqueNames = new Set(names);
      assert.equal(uniqueNames.size, names.length, 'Primary names should be unique');
    });
  });

  describe('KNOWN_CONSTRAINT_NAMES', () => {
    it('is a Set', () => {
      assert.ok(KNOWN_CONSTRAINT_NAMES instanceof Set);
    });

    it('includes all primary names (lowercase)', () => {
      for (const constraint of UNIVERSAL_CONSTRAINTS) {
        assert.ok(
          KNOWN_CONSTRAINT_NAMES.has(constraint.name.toLowerCase()),
          `Should include primary name: ${constraint.name}`
        );
      }
    });

    it('includes all aliases (lowercase)', () => {
      for (const constraint of UNIVERSAL_CONSTRAINTS) {
        for (const alias of constraint.aliases) {
          assert.ok(
            KNOWN_CONSTRAINT_NAMES.has(alias.toLowerCase()),
            `Should include alias: ${alias} for ${constraint.name}`
          );
        }
      }
    });

    it('includes known aliases', () => {
      // Verify specific aliases are included
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('step-by-step')); // alias for analytical
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('reasoning')); // alias for analytical
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('brief')); // alias for terse
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('concise')); // alias for terse
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('detailed')); // alias for verbose
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('thorough')); // alias for verbose
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('deterministic')); // alias for precise
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('grounded')); // alias for precise
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('exploratory')); // alias for creative
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('compliant')); // alias for strict
      assert.ok(KNOWN_CONSTRAINT_NAMES.has('isolated')); // alias for nomemory
    });

    it('count matches sum of names and aliases', () => {
      const expectedCount = UNIVERSAL_CONSTRAINTS.reduce(
        (sum, c) => sum + 1 + c.aliases.length,
        0
      );
      assert.equal(KNOWN_CONSTRAINT_NAMES.size, expectedCount);
    });
  });

  describe('getConstraintByName', () => {
    it('finds constraint by primary name', () => {
      const constraint = getConstraintByName('analytical');
      assert.ok(constraint);
      assert.equal(constraint.name, 'analytical');
    });

    it('finds constraint by alias', () => {
      const constraint = getConstraintByName('step-by-step');
      assert.ok(constraint);
      assert.equal(constraint.name, 'analytical');
    });

    it('is case-insensitive', () => {
      const constraint1 = getConstraintByName('ANALYTICAL');
      const constraint2 = getConstraintByName('Analytical');
      const constraint3 = getConstraintByName('analytical');
      assert.ok(constraint1);
      assert.ok(constraint2);
      assert.ok(constraint3);
      assert.equal(constraint1.name, 'analytical');
      assert.equal(constraint2.name, 'analytical');
      assert.equal(constraint3.name, 'analytical');
    });

    it('returns undefined for unknown constraint', () => {
      const constraint = getConstraintByName('unknown');
      assert.equal(constraint, undefined);
    });
  });

  describe('isKnownConstraint', () => {
    it('returns true for primary names', () => {
      assert.ok(isKnownConstraint('analytical'));
      assert.ok(isKnownConstraint('terse'));
      assert.ok(isKnownConstraint('nomemory'));
    });

    it('returns true for aliases', () => {
      assert.ok(isKnownConstraint('step-by-step'));
      assert.ok(isKnownConstraint('brief'));
      assert.ok(isKnownConstraint('isolated'));
    });

    it('returns false for unknown names', () => {
      assert.ok(!isKnownConstraint('unknown'));
      assert.ok(!isKnownConstraint('foo'));
      assert.ok(!isKnownConstraint(''));
    });

    it('is case-insensitive', () => {
      assert.ok(isKnownConstraint('ANALYTICAL'));
      assert.ok(isKnownConstraint('Terse'));
      assert.ok(isKnownConstraint('STEP-BY-STEP'));
    });
  });

  describe('getSteeringConstraints', () => {
    it('returns only steering constraints', () => {
      const steering = getSteeringConstraints();
      assert.ok(steering.length > 0);
      for (const constraint of steering) {
        assert.equal(constraint.type, 'steering');
      }
    });

    it('includes analytical and terse', () => {
      const steering = getSteeringConstraints();
      const names = steering.map((c) => c.name);
      assert.ok(names.includes('analytical'));
      assert.ok(names.includes('terse'));
    });

    it('does not include mechanical constraints', () => {
      const steering = getSteeringConstraints();
      const names = steering.map((c) => c.name);
      assert.ok(!names.includes('nomemory'));
      assert.ok(!names.includes('lastN'));
    });
  });

  describe('getMechanicalConstraints', () => {
    it('returns only mechanical constraints', () => {
      const mechanical = getMechanicalConstraints();
      assert.ok(mechanical.length > 0);
      for (const constraint of mechanical) {
        assert.equal(constraint.type, 'mechanical');
      }
    });

    it('includes nomemory and lastN', () => {
      const mechanical = getMechanicalConstraints();
      const names = mechanical.map((c) => c.name);
      assert.ok(names.includes('nomemory'));
      assert.ok(names.includes('lastN'));
    });

    it('does not include steering constraints', () => {
      const mechanical = getMechanicalConstraints();
      const names = mechanical.map((c) => c.name);
      assert.ok(!names.includes('analytical'));
      assert.ok(!names.includes('terse'));
    });
  });

  describe('backward compatibility with parser', () => {
    it('KNOWN_CONSTRAINT_NAMES works with parser allowlist usage', () => {
      // The parser uses: allowedSet.has(nameLower)
      // Verify this pattern works
      const testNames = ['analytical', 'terse', 'nomemory', 'step-by-step'];
      for (const name of testNames) {
        assert.ok(
          KNOWN_CONSTRAINT_NAMES.has(name),
          `Parser allowlist should recognize: ${name}`
        );
      }
    });
  });
});
