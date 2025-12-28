import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  // Trait schemas
  TraitVectorSchema,
  TraitDimensionSchema,
  UnitBallTraitVectorSchema,
  parseTraitVector,
  safeParseTraitVector,
  parseUnitBallTraitVector,
  magnitude,

  // Feature schemas
  FeaturesSchema,
  ContextPolicySchema,
  FeatureLatticeSchema,
  parseFeatures,
  parseContextPolicy,

  // Kernel schemas
  KernelIRSchema,
  KernelClauseSchema,
  parseKernelIR,

  // Constraint schemas
  ResolvedConstraintSchema,
  ConstraintDefinitionSchema,
  parseResolvedConstraint,
  parseConstraintDefinition,
  isParsedConstraint,
  isResolvedConstraint,

  // Interaction schemas
  TraitInteractionSchema,
  parseTraitInteraction,
} from './index.js';

describe('Zod Schema Validation', () => {
  describe('TraitVector', () => {
    it('validates valid trait vectors', () => {
      const valid = [0.5, -0.3, 0, 0, 0.2, 0, 0];
      const result = parseTraitVector(valid);
      assert.deepEqual(result, valid);
    });

    it('rejects non-array input', () => {
      assert.throws(() => parseTraitVector('not an array'), {
        name: 'ZodError',
      });
    });

    it('rejects arrays with non-numbers', () => {
      assert.throws(() => parseTraitVector([0.5, 'bad', 0]), {
        name: 'ZodError',
      });
    });

    it('safeParse returns success for valid input', () => {
      const result = safeParseTraitVector([0.1, 0.2, 0.3]);
      assert.ok(result.success);
      if (result.success) {
        assert.deepEqual(result.data, [0.1, 0.2, 0.3]);
      }
    });

    it('safeParse returns error for invalid input', () => {
      const result = safeParseTraitVector({ not: 'array' });
      assert.ok(!result.success);
    });
  });

  describe('UnitBallTraitVector', () => {
    it('accepts vectors within unit ball', () => {
      const valid = [0.5, 0.5, 0.5]; // magnitude ≈ 0.866
      const result = parseUnitBallTraitVector(valid);
      assert.ok(magnitude(result) <= 1);
    });

    it('rejects vectors outside unit ball', () => {
      const invalid = [1, 1, 1]; // magnitude ≈ 1.732
      assert.throws(() => parseUnitBallTraitVector(invalid), {
        message: /unit ball/i,
      });
    });
  });

  describe('TraitDimension', () => {
    it('validates complete dimension definition', () => {
      const dim = {
        id: 'v1',
        index: 0,
        label: 'Stochasticity',
        description: 'Controls randomness',
        poles: {
          positive: 'creative',
          negative: 'deterministic',
        },
      };
      const result = TraitDimensionSchema.parse(dim);
      assert.equal(result.id, 'v1');
      assert.equal(result.poles.positive, 'creative');
    });

    it('rejects negative index', () => {
      const invalid = {
        id: 'v1',
        index: -1,
        label: 'Test',
        description: 'Test',
        poles: { positive: 'p', negative: 'n' },
      };
      assert.throws(() => TraitDimensionSchema.parse(invalid));
    });
  });

  describe('Features', () => {
    it('validates feature objects', () => {
      const features = {
        max_tokens: 256,
        temperature: 0.7,
        stop_sequences: ['END', 'STOP'],
      };
      const result = parseFeatures(features);
      assert.equal(result.max_tokens, 256);
    });

    it('validates context policy', () => {
      const contextAll = parseContextPolicy({ type: 'all' });
      assert.equal(contextAll.type, 'all');

      const contextNone = parseContextPolicy({ type: 'none' });
      assert.equal(contextNone.type, 'none');

      const contextLast = parseContextPolicy({ type: 'last', n: 5 });
      assert.equal(contextLast.type, 'last');
      if (contextLast.type === 'last') {
        assert.equal(contextLast.n, 5);
      }
    });

    it('rejects invalid context policy', () => {
      assert.throws(() => parseContextPolicy({ type: 'invalid' }));
      assert.throws(() => parseContextPolicy({ type: 'last', n: -1 }));
    });
  });

  describe('FeatureLattice', () => {
    it('validates lattice types', () => {
      assert.equal(FeatureLatticeSchema.parse('MIN'), 'MIN');
      assert.equal(FeatureLatticeSchema.parse('MAX'), 'MAX');
      assert.equal(FeatureLatticeSchema.parse('EXCLUSIVE'), 'EXCLUSIVE');
      assert.equal(FeatureLatticeSchema.parse('UNION'), 'UNION');
    });

    it('rejects invalid lattice types', () => {
      assert.throws(() => FeatureLatticeSchema.parse('INVALID'));
    });
  });

  describe('KernelIR', () => {
    it('validates complete kernel IR', () => {
      const kernelIR = {
        strategyName: 'operational',
        strategyVersion: '1.0.0',
        clauses: [
          {
            traitId: 'v1',
            traitIndex: 0,
            intensity: 'high' as const,
            polarity: 'positive' as const,
            text: 'creative responses',
          },
        ],
        omittedTraits: ['v2', 'v3'],
        modifiedClauses: [],
      };

      const result = parseKernelIR(kernelIR);
      assert.equal(result.strategyName, 'operational');
      assert.equal(result.clauses.length, 1);
      assert.equal(result.clauses[0]!.intensity, 'high');
    });

    it('rejects invalid intensity', () => {
      const invalid = {
        strategyName: 'test',
        strategyVersion: '1.0.0',
        clauses: [
          {
            traitId: 'v1',
            traitIndex: 0,
            intensity: 'extreme', // Invalid
            polarity: 'positive',
            text: 'test',
          },
        ],
        omittedTraits: [],
        modifiedClauses: [],
      };
      assert.throws(() => parseKernelIR(invalid));
    });
  });

  describe('ResolvedConstraint', () => {
    it('validates resolved constraint', () => {
      const constraint = {
        name: 'precise',
        params: {},
        traits: [-0.5, 0, 0, 0, 0.5, 0, 0],
        features: { max_tokens: 1024 },
      };

      const result = parseResolvedConstraint(constraint);
      assert.equal(result.name, 'precise');
      assert.deepEqual(result.traits, [-0.5, 0, 0, 0, 0.5, 0, 0]);
    });

    it('type guard works correctly', () => {
      const valid = {
        name: 'test',
        params: {},
        traits: [0, 0, 0],
        features: {},
      };
      assert.ok(isResolvedConstraint(valid));
      assert.ok(!isResolvedConstraint({ name: 'test' }));
      assert.ok(!isResolvedConstraint(null));
    });
  });

  describe('ConstraintDefinition', () => {
    it('validates constraint definition', () => {
      const def = {
        name: 'precise',
        aliases: ['deterministic', 'grounded'],
        traits: { v1: -0.5, v5: 0.5 },
        features: { max_tokens: 1024 },
      };

      const result = parseConstraintDefinition(def);
      assert.equal(result.name, 'precise');
      assert.deepEqual(result.aliases, ['deterministic', 'grounded']);
    });

    it('validates parameterized constraint', () => {
      const def = {
        name: 'lastN',
        traits: {},
        params: [
          {
            name: 'n',
            type: 'number' as const,
            required: true,
          },
        ],
      };

      const result = parseConstraintDefinition(def);
      assert.equal(result.params![0]!.name, 'n');
      assert.equal(result.params![0]!.required, true);
    });
  });

  describe('TraitInteraction', () => {
    it('validates trait interaction', () => {
      const interaction = {
        id: 'creative-analytical',
        traitIndices: [0, 4] as [number, number],
        condition: 'both_high' as const,
        resolution: 'priority' as const,
        priorityIndex: 4,
      };

      const result = parseTraitInteraction(interaction);
      assert.equal(result.id, 'creative-analytical');
      assert.deepEqual(result.traitIndices, [0, 4]);
      assert.equal(result.resolution, 'priority');
    });

    it('validates modify interaction', () => {
      const interaction = {
        id: 'creative-compliance',
        traitIndices: [0, 5] as [number, number],
        condition: 'both_high' as const,
        resolution: 'modify' as const,
        modifiedText: 'Balance creativity with compliance',
      };

      const result = parseTraitInteraction(interaction);
      assert.equal(result.resolution, 'modify');
      assert.equal(result.modifiedText, 'Balance creativity with compliance');
    });

    it('rejects invalid condition', () => {
      const invalid = {
        id: 'test',
        traitIndices: [0, 1],
        condition: 'invalid_condition',
        resolution: 'priority',
      };
      assert.throws(() => parseTraitInteraction(invalid));
    });
  });
});

describe('Type Guards', () => {
  it('isParsedConstraint identifies valid parsed constraints', () => {
    const valid = {
      name: 'precise',
      params: { key: 'value' },
      source: '@precise',
    };
    assert.ok(isParsedConstraint(valid));
  });

  it('isParsedConstraint rejects invalid objects', () => {
    assert.ok(!isParsedConstraint(null));
    assert.ok(!isParsedConstraint(undefined));
    assert.ok(!isParsedConstraint({ name: 'test' })); // Missing params and source
    assert.ok(!isParsedConstraint({ name: 123, params: {}, source: 'x' })); // Wrong type
  });

  it('isResolvedConstraint identifies valid resolved constraints', () => {
    const valid = {
      name: 'precise',
      params: {},
      traits: [0, 0, 0],
      features: {},
    };
    assert.ok(isResolvedConstraint(valid));
  });

  it('isResolvedConstraint rejects invalid objects', () => {
    assert.ok(!isResolvedConstraint(null));
    assert.ok(!isResolvedConstraint({ name: 'test', params: {} })); // Missing traits/features
  });
});
