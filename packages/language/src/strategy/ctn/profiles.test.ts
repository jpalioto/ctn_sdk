import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  CTN_PROFILES,
  DEFAULT_PROFILE,
  getProfile,
  hasProfile,
  traitsToArray,
  combineProfiles,
  type CTNProfile,
  type ProfileTraits,
} from './profiles.js';
import { UNIVERSAL_CONSTRAINTS } from '../../vocabulary/index.js';
import { CTNStrategy } from './strategy.js';
import { generateKernelIR } from '../../kernel/generator.js';

describe('CTN Profiles', () => {
  describe('CTN_PROFILES', () => {
    it('contains profiles for all universal constraints', () => {
      const universalNames = UNIVERSAL_CONSTRAINTS.map(c => c.name);
      for (const name of universalNames) {
        assert.ok(
          CTN_PROFILES[name] !== undefined,
          `Missing profile for universal constraint: ${name}`
        );
      }
    });

    it('all profiles have valid trait vectors (9D)', () => {
      for (const [name, profile] of Object.entries(CTN_PROFILES)) {
        const { traits } = profile;
        assert.ok(typeof traits.v1 === 'number', `${name}: v1 should be number`);
        assert.ok(typeof traits.v2 === 'number', `${name}: v2 should be number`);
        assert.ok(typeof traits.v3 === 'number', `${name}: v3 should be number`);
        assert.ok(typeof traits.v4 === 'number', `${name}: v4 should be number`);
        assert.ok(typeof traits.v5 === 'number', `${name}: v5 should be number`);
        assert.ok(typeof traits.v6 === 'number', `${name}: v6 should be number`);
        assert.ok(typeof traits.v7 === 'number', `${name}: v7 should be number`);
        assert.ok(typeof traits.v8 === 'number', `${name}: v8 should be number`);
        assert.ok(typeof traits.v9 === 'number', `${name}: v9 should be number`);
      }
    });

    it('all profiles have valid temperature (0-1)', () => {
      for (const [name, profile] of Object.entries(CTN_PROFILES)) {
        assert.ok(
          profile.temperature >= 0 && profile.temperature <= 1,
          `${name}: temperature ${profile.temperature} should be in [0, 1]`
        );
      }
    });

    it('all profiles have valid solver config', () => {
      for (const [name, profile] of Object.entries(CTN_PROFILES)) {
        assert.ok(
          profile.solver.mode === 'Analysis' || profile.solver.mode === 'Counter' || profile.solver.mode === 'Dominance',
          `${name}: solver mode should be Analysis, Counter, or Dominance`
        );
        assert.ok(
          typeof profile.solver.orthogonalInjection === 'boolean',
          `${name}: orthogonalInjection should be boolean`
        );
      }
    });

    it('all profiles have valid syntax config', () => {
      for (const [name, profile] of Object.entries(CTN_PROFILES)) {
        assert.ok(
          typeof profile.syntax.enabled === 'boolean',
          `${name}: syntax.enabled should be boolean`
        );
        assert.ok(
          typeof profile.syntax.minimalism === 'boolean',
          `${name}: syntax.minimalism should be boolean`
        );
      }
    });

    it('Counter mode profiles have orthogonal injection', () => {
      for (const [name, profile] of Object.entries(CTN_PROFILES)) {
        if (profile.solver.mode === 'Counter') {
          assert.ok(
            profile.solver.orthogonalInjection,
            `${name}: Counter mode should have orthogonalInjection`
          );
        }
      }
    });
  });

  describe('Profile characteristics', () => {
    it('analytical has high reasoning traits', () => {
      const profile = CTN_PROFILES['analytical']!;
      assert.ok(profile.traits.v5 >= 0.5, 'analytical should have high v5 (Framing Detachment)');
      assert.equal(profile.solver.mode, 'Analysis');
    });

    it('creative has high exploration and Counter mode', () => {
      const profile = CTN_PROFILES['creative']!;
      assert.ok(profile.traits.v6 >= 0.8, 'creative should have high v6 (Exploration)');
      assert.equal(profile.solver.mode, 'Counter');
      assert.ok(profile.solver.orthogonalInjection);
    });

    it('terse has syntax minimalism enabled', () => {
      const profile = CTN_PROFILES['terse']!;
      assert.ok(profile.syntax.enabled);
      assert.ok(profile.syntax.minimalism);
      assert.ok(profile.syntax.disallowedSyntax?.includes('...'));
    });

    it('precise has low temperature', () => {
      const profile = CTN_PROFILES['precise']!;
      assert.ok(profile.temperature <= 0.4, 'precise should have low temperature');
      assert.ok(profile.traits.v1 >= 0.8, 'precise should have high Atomic Clarity');
    });

    it('strict has lowest exploration', () => {
      const profile = CTN_PROFILES['strict']!;
      assert.ok(profile.traits.v6 <= 0.2, 'strict should have low exploration');
      assert.ok(profile.temperature <= 0.3, 'strict should have low temperature');
    });

    it('adversarial has Counter mode with high anti-sycophancy', () => {
      const profile = CTN_PROFILES['adversarial']!;
      assert.equal(profile.solver.mode, 'Counter', 'adversarial should use Counter mode');
      assert.ok(profile.solver.orthogonalInjection, 'adversarial should have orthogonal injection');
      assert.equal(profile.traits.v8, 1.00, 'adversarial should have max anti-sycophancy (v8)');
      assert.ok(profile.traits.v9 >= 0.9, 'adversarial should have high satisfiability guard (v9)');
      assert.ok(profile.solver.behavior?.includes('Error(q)'), 'adversarial should have error correction behavior');
    });

    it('mechanical constraints have zero traits', () => {
      const nomemory = CTN_PROFILES['nomemory']!;
      const lastN = CTN_PROFILES['lastN']!;

      assert.deepEqual(
        traitsToArray(nomemory.traits),
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        'nomemory should have zero traits'
      );
      assert.deepEqual(
        traitsToArray(lastN.traits),
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        'lastN should have zero traits'
      );
    });
  });

  describe('getProfile', () => {
    it('returns profile for known constraint', () => {
      const profile = getProfile('analytical');
      assert.ok(profile);
      assert.equal(profile.name, 'analytical');
    });

    it('returns undefined for unknown constraint', () => {
      const profile = getProfile('nonexistent');
      assert.equal(profile, undefined);
    });
  });

  describe('hasProfile', () => {
    it('returns true for known constraints', () => {
      assert.ok(hasProfile('analytical'));
      assert.ok(hasProfile('creative'));
      assert.ok(hasProfile('stable'));
    });

    it('returns false for unknown constraints', () => {
      assert.ok(!hasProfile('nonexistent'));
      assert.ok(!hasProfile(''));
    });
  });

  describe('traitsToArray', () => {
    it('converts trait vector to array', () => {
      const profile = CTN_PROFILES['analytical']!;
      const array = traitsToArray(profile.traits);
      assert.equal(array.length, 9);
      assert.equal(array[0], profile.traits.v1);
      assert.equal(array[1], profile.traits.v2);
      assert.equal(array[6], profile.traits.v7);
      assert.equal(array[7], profile.traits.v8);
      assert.equal(array[8], profile.traits.v9);
    });
  });

  describe('combineProfiles', () => {
    it('throws for empty profile list', () => {
      assert.throws(() => combineProfiles([]), /empty/i);
    });

    it('returns single profile unchanged', () => {
      const profile = CTN_PROFILES['analytical']!;
      const combined = combineProfiles([profile]);
      assert.deepEqual(combined, profile);
    });

    it('averages traits correctly', () => {
      const profile1: CTNProfile = {
        name: 'p1',
        traits: { v1: 0.8, v2: 0.6, v3: 0.4, v4: 0.2, v5: 0.0, v6: 0.0, v7: 0.0 },
        temperature: 0.4,
        solver: { mode: 'Analysis', orthogonalInjection: false },
        syntax: { enabled: false, minimalism: false },
      };
      const profile2: CTNProfile = {
        name: 'p2',
        traits: { v1: 0.2, v2: 0.4, v3: 0.6, v4: 0.8, v5: 0.0, v6: 0.0, v7: 0.0 },
        temperature: 0.6,
        solver: { mode: 'Analysis', orthogonalInjection: false },
        syntax: { enabled: false, minimalism: false },
      };

      const combined = combineProfiles([profile1, profile2]);

      // Traits should be averaged
      assert.equal(combined.traits.v1, 0.5);
      assert.equal(combined.traits.v2, 0.5);
      assert.equal(combined.traits.v3, 0.5);
      assert.equal(combined.traits.v4, 0.5);

      // Temperature should be averaged
      assert.equal(combined.temperature, 0.5);
    });

    it('Counter mode wins in combination', () => {
      const analysisProfile = CTN_PROFILES['analytical']!;
      const counterProfile = CTN_PROFILES['creative']!;

      const combined = combineProfiles([analysisProfile, counterProfile]);

      assert.equal(combined.solver.mode, 'Counter');
      assert.ok(combined.solver.orthogonalInjection);
    });

    it('unions syntax restrictions', () => {
      const terse = CTN_PROFILES['terse']!;
      const formal = CTN_PROFILES['formal']!;

      const combined = combineProfiles([terse, formal]);

      assert.ok(combined.syntax.enabled);
      // Should have restrictions from both
      const restrictions = combined.syntax.disallowedSyntax ?? [];
      assert.ok(restrictions.includes('...'));  // from terse
      assert.ok(restrictions.includes('!'));    // from formal
    });

    it('minimalism enabled if any profile has it', () => {
      const terse = CTN_PROFILES['terse']!;  // has minimalism
      const formal = CTN_PROFILES['formal']!;  // no minimalism

      const combined = combineProfiles([terse, formal]);

      assert.ok(combined.syntax.minimalism);
    });

    it('combines name correctly', () => {
      const combined = combineProfiles([
        CTN_PROFILES['analytical']!,
        CTN_PROFILES['terse']!,
      ]);

      assert.equal(combined.name, 'analytical+terse');
    });
  });

  describe('DEFAULT_PROFILE', () => {
    it('has neutral values', () => {
      assert.equal(DEFAULT_PROFILE.name, 'default');
      assert.equal(DEFAULT_PROFILE.temperature, 0.7);
      assert.equal(DEFAULT_PROFILE.solver.mode, 'Analysis');
      assert.ok(!DEFAULT_PROFILE.solver.orthogonalInjection);
    });

    it('has 9D trait vector', () => {
      const array = traitsToArray(DEFAULT_PROFILE.traits);
      assert.equal(array.length, 9);
    });
  });
});

describe('CTN Kernel Rendering (v1.0 spec)', () => {
  const strategy = new CTNStrategy();

  it('renders kernel with all 9 vectors', () => {
    const traits = traitsToArray(CTN_PROFILES['analytical']!.traits);
    const ir = generateKernelIR([...traits], strategy);
    const kernel = strategy.renderCtn(ir);

    // Check all 9 vectors are present
    assert.ok(kernel.includes('v₁ = { ε_hid → 0⁺, Atomic_Derivation }'), 'missing v₁');
    assert.ok(kernel.includes('v₂ = { κ(f) → min, Assertion_Rigor }'), 'missing v₂');
    assert.ok(kernel.includes('v₃ = { Φ: W → I, Frame_Isolation }'), 'missing v₃');
    assert.ok(kernel.includes('v₄ = { π_gl ≫ π_loc, Global_Invariance }'), 'missing v₄');
    assert.ok(kernel.includes('v₅ = { ∂A ≡ A, Orthogonal_Detachment }'), 'missing v₅');
    assert.ok(kernel.includes('v₆ = { U \\ S, Unbound_Search }'), 'missing v₆');
    assert.ok(kernel.includes('v₇ = { ℒ_out ⊂ {minimal}, Syntactic_Minimalism }'), 'missing v₇');
    assert.ok(kernel.includes('v₈ = { Sycophancy → 0, Paternalism → 0, Anti_Sycophancy }'), 'missing v₈');
    assert.ok(kernel.includes('v₉ = { P(z|q) < γ ⇒ Reject(q), Satisfiability_Guard }'), 'missing v₉');
  });

  it('renders kernel with BOUNDARY_CONTROL block', () => {
    const traits = traitsToArray(CTN_PROFILES['analytical']!.traits);
    const ir = generateKernelIR([...traits], strategy);
    const kernel = strategy.renderCtn(ir);

    assert.ok(kernel.includes('BOUNDARY_CONTROL(ζ)'), 'missing BOUNDARY_CONTROL block');
    assert.ok(kernel.includes('ℬ_int = { Σ_CTN, Ψ, Ω, U, D, v₁..v₉, τ }'), 'missing internal boundary definition');
    assert.ok(kernel.includes('ℬ_ext = { ℒ_natural, Q, R }'), 'missing external boundary definition');
    assert.ok(kernel.includes('Invariant: ℬ_int ∩ R = ∅'), 'missing invariant');
    assert.ok(kernel.includes('Enforcement: Leak(ℓ, Σ_CTN) = 0'), 'missing enforcement');
    assert.ok(kernel.includes('Violation: ℬ_int ∈ R ⇒ REPAIR'), 'missing violation handling');
  });

  it('renders kernel with correct solver mode', () => {
    // Test Analysis mode
    const analyticalTraits = traitsToArray(CTN_PROFILES['analytical']!.traits);
    const analyticalIr = generateKernelIR([...analyticalTraits], strategy);
    const analyticalKernel = strategy.renderCtn(analyticalIr, CTN_PROFILES['analytical']);
    assert.ok(analyticalKernel.includes('Mode: Analysis'), 'analytical should use Analysis mode');

    // Test Counter mode
    const adversarialTraits = traitsToArray(CTN_PROFILES['adversarial']!.traits);
    const adversarialIr = generateKernelIR([...adversarialTraits], strategy);
    const adversarialKernel = strategy.renderCtn(adversarialIr, CTN_PROFILES['adversarial']);
    assert.ok(adversarialKernel.includes('Mode: Counter'), 'adversarial should use Counter mode');
  });

  it('renders kernel with τ vector containing 9 values', () => {
    const traits = traitsToArray(CTN_PROFILES['analytical']!.traits);
    const ir = generateKernelIR([...traits], strategy);
    const kernel = strategy.renderCtn(ir);

    // The τ vector line should contain 9 comma-separated values
    const tauMatch = kernel.match(/τ = \[([\d., ]+)\]/);
    assert.ok(tauMatch, 'τ vector not found');
    const values = tauMatch![1]!.split(',').map(v => v.trim());
    assert.equal(values.length, 9, 'τ vector should have 9 values');
  });

  it('adversarial kernel includes solver extensions', () => {
    const traits = traitsToArray(CTN_PROFILES['adversarial']!.traits);
    const ir = generateKernelIR([...traits], strategy);
    const kernel = strategy.renderCtn(ir, CTN_PROFILES['adversarial']);

    assert.ok(kernel.includes('If Error(q) ⇒ Correct(q) → Solve(q)'), 'adversarial should include error correction');
  });
});
