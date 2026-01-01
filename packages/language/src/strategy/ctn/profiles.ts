/**
 * Comprehensive CTN constraint profiles.
 *
 * Each profile defines the full configuration for a constraint including:
 * - Trait vector (9D CTN space per v1.0 spec)
 * - Temperature (inference randomness)
 * - Solver configuration (mode, behavior, orthogonal injection)
 * - Syntax restrictions (minimalism, disallowed tokens)
 */

/**
 * 9-dimensional trait object for CTN profiles (v1.0 spec).
 * Different from TraitVector (number[]) - this is a structured object.
 *
 * Matches ctn_core VECTORS.md:
 * - v1: Atomic_Derivation
 * - v2: Assertion_Rigor
 * - v3: Frame_Isolation
 * - v4: Global_Invariance
 * - v5: Orthogonal_Detachment
 * - v6: Unbound_Search
 * - v7: Syntactic_Minimalism
 * - v8: Anti_Sycophancy
 * - v9: Satisfiability_Guard
 */
export interface ProfileTraits {
  v1: number;  // Atomic Derivation
  v2: number;  // Assertion Rigor
  v3: number;  // Frame Isolation
  v4: number;  // Global Invariance
  v5: number;  // Orthogonal Detachment
  v6: number;  // Unbound Search
  v7: number;  // Syntactic Minimalism
  v8: number;  // Anti Sycophancy
  v9: number;  // Satisfiability Guard
}

/**
 * Solver operating mode (ctn_core SOLVER_MODES.md).
 * - 'Analysis': Standard analytical processing (η_⊥ = 0)
 * - 'Counter': Exploratory mode with orthogonal injection
 * - 'Dominance': Aggressive correction mode
 */
export type SolverMode = 'Analysis' | 'Counter' | 'Dominance';

/**
 * Solver configuration for CTN kernel.
 */
export interface SolverConfig {
  mode: SolverMode;
  behavior?: string;              // e.g., 'Deconstruct(Φ)', 'Inject(η_⊥)'
  orthogonalInjection: boolean;   // η_⊥ ≠ 0
}

/**
 * Syntax configuration for output control.
 */
export interface SyntaxConfig {
  enabled: boolean;
  disallowedSyntax?: string[];    // Tokens to avoid in output
  minimalism: boolean;            // Favor concise expression
}

/**
 * Complete CTN constraint profile.
 */
export interface CTNProfile {
  name: string;
  traits: ProfileTraits;
  temperature: number;
  solver: SolverConfig;
  syntax: SyntaxConfig;
}

/**
 * Universal constraint profiles mapped to CTN's 9D space (v1.0 spec).
 *
 * Design rationale:
 * - Traits are full 9D vectors per ctn_core VECTORS.md
 * - Temperature reflects the constraint's intended variability
 * - Solver mode distinguishes analytical vs exploratory constraints
 * - Syntax config enables output formatting control
 */
export const CTN_PROFILES: Readonly<Record<string, CTNProfile>> = Object.freeze({
  // ===========================================================================
  // Universal constraint profiles (best-effort CTN mappings)
  // ===========================================================================

  // @analytical - Max rigor, constrained search (extreme τ for diagnostic testing)
  analytical: {
    name: 'analytical',
    traits: { v1: 1, v2: 1, v3: 1, v4: 1, v5: 1, v6: 0, v7: 1, v8: 1, v9: 1 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Deconstruct(Φ)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  // @terse - Minimal output, max syntactic minimalism (extreme τ for diagnostic testing)
  terse: {
    name: 'terse',
    traits: { v1: 0, v2: 0, v3: 0, v4: 1, v5: 1, v6: 0, v7: 1, v8: 1, v9: 0 },
    temperature: 0.4,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: true, disallowedSyntax: ['—', '–', ';', '...'], minimalism: true },
  },

  verbose: {
    name: 'verbose',
    traits: { v1: 0.50, v2: 0.40, v3: 0.30, v4: 0.40, v5: 0.50, v6: 0.70, v7: 0.00, v8: 0.40, v9: 0.40 },
    temperature: 0.8,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  precise: {
    name: 'precise',
    traits: { v1: 0.90, v2: 0.90, v3: 0.60, v4: 0.70, v5: 0.90, v6: 0.20, v7: 0.50, v8: 0.80, v9: 0.90 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'Proof-bound assertions', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  // @creative - Only Unbound_Search enabled (extreme τ for diagnostic testing)
  creative: {
    name: 'creative',
    traits: { v1: 0, v2: 0, v3: 0, v4: 0, v5: 0, v6: 1, v7: 0, v8: 0, v9: 0 },
    temperature: 0.9,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  formal: {
    name: 'formal',
    traits: { v1: 0.70, v2: 0.70, v3: 0.50, v4: 0.70, v5: 0.60, v6: 0.40, v7: 0.60, v8: 0.60, v9: 0.60 },
    temperature: 0.5,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: true, disallowedSyntax: ['—', '...', '!'], minimalism: false },
  },

  casual: {
    name: 'casual',
    traits: { v1: 0.40, v2: 0.40, v3: 0.40, v4: 0.30, v5: 0.50, v6: 0.60, v7: 0.20, v8: 0.30, v9: 0.30 },
    temperature: 0.7,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  strict: {
    name: 'strict',
    traits: { v1: 0.80, v2: 0.90, v3: 0.80, v4: 0.90, v5: 0.80, v6: 0.10, v7: 0.70, v8: 0.80, v9: 0.90 },
    temperature: 0.2,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  flexible: {
    name: 'flexible',
    traits: { v1: 0.40, v2: 0.40, v3: 0.30, v4: 0.40, v5: 0.40, v6: 0.70, v7: 0.20, v8: 0.30, v9: 0.30 },
    temperature: 0.8,
    solver: { mode: 'Counter', behavior: 'Inject(η_⊥)', orthogonalInjection: true },
    syntax: { enabled: false, minimalism: false },
  },

  // ===========================================================================
  // CTN-specific constraint profiles (native to this 9D space)
  // ===========================================================================

  clarity: {
    name: 'clarity',
    traits: { v1: 0.90, v2: 0.60, v3: 0.50, v4: 0.60, v5: 0.50, v6: 0.30, v7: 0.40, v8: 0.50, v9: 0.50 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Sharp(ε_hid → 0⁺)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  smooth: {
    name: 'smooth',
    traits: { v1: 0.60, v2: 0.90, v3: 0.50, v4: 0.60, v5: 0.50, v6: 0.40, v7: 0.40, v8: 0.50, v9: 0.50 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Smooth(κ(f) → min)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  focused: {
    name: 'focused',
    traits: { v1: 0.60, v2: 0.60, v3: 0.90, v4: 0.60, v5: 0.50, v6: 0.20, v7: 0.50, v8: 0.50, v9: 0.60 },
    temperature: 0.4,
    solver: { mode: 'Analysis', behavior: 'Filter(Φ:W→I)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  structural: {
    name: 'structural',
    traits: { v1: 0.60, v2: 0.60, v3: 0.50, v4: 0.90, v5: 0.60, v6: 0.30, v7: 0.50, v8: 0.50, v9: 0.50 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Global(π_gl ≫ π_loc)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  schema: {
    name: 'schema',
    traits: { v1: 0.70, v2: 0.80, v3: 0.60, v4: 0.80, v5: 0.60, v6: 0.20, v7: 0.90, v8: 0.60, v9: 0.70 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'CTN_Form', orthogonalInjection: false },
    syntax: { enabled: true, minimalism: true },
  },

  // Composite profiles (multi-dimensional presets)
  stable: {
    name: 'stable',
    traits: { v1: 0.90, v2: 0.90, v3: 0.70, v4: 0.90, v5: 0.90, v6: 0.30, v7: 0.60, v8: 0.80, v9: 0.80 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'Stable(∀τ: high)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  toolselect: {
    name: 'toolselect',
    traits: { v1: 0.80, v2: 0.90, v3: 0.95, v4: 0.85, v5: 0.70, v6: 0.20, v7: 0.50, v8: 0.60, v9: 0.70 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'Select(optimal_tool)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  research: {
    name: 'research',
    traits: { v1: 0.60, v2: 0.50, v3: 0.30, v4: 0.50, v5: 0.70, v6: 0.90, v7: 0.30, v8: 0.60, v9: 0.50 },
    temperature: 0.8,
    solver: { mode: 'Counter', behavior: 'Explore(U \\ S)', orthogonalInjection: true },
    syntax: { enabled: false, minimalism: false },
  },

  // ===========================================================================
  // Adversarial constraint (v1.0 spec - Counter mode with error correction)
  // ===========================================================================

  // @adversarial - Max rigor, correction, anti-sycophancy (extreme τ for diagnostic testing)
  adversarial: {
    name: 'adversarial',
    traits: { v1: 1, v2: 1, v3: 1, v4: 1, v5: 1, v6: 0, v7: 1, v8: 1, v9: 1 },
    temperature: 0.3,
    solver: {
      mode: 'Counter',
      behavior: 'Inject(η_⊥)\n  If Error(q) ⇒ Correct(q) → Solve(q)',
      orthogonalInjection: true,
    },
    syntax: { enabled: true, minimalism: true },
  },

  // ===========================================================================
  // Mechanical constraints (traits neutral, handled via features)
  // ===========================================================================

  nomemory: {
    name: 'nomemory',
    traits: { v1: 0.0, v2: 0.0, v3: 0.0, v4: 0.0, v5: 0.0, v6: 0.0, v7: 0.0, v8: 0.0, v9: 0.0 },
    temperature: 0.7,  // neutral
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  lastN: {
    name: 'lastN',
    traits: { v1: 0.0, v2: 0.0, v3: 0.0, v4: 0.0, v5: 0.0, v6: 0.0, v7: 0.0, v8: 0.0, v9: 0.0 },
    temperature: 0.7,  // neutral
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },
});

/**
 * Default profile for unknown/unsupported constraints.
 */
export const DEFAULT_PROFILE: CTNProfile = Object.freeze({
  name: 'default',
  traits: { v1: 0.5, v2: 0.5, v3: 0.5, v4: 0.5, v5: 0.5, v6: 0.5, v7: 0.5, v8: 0.5, v9: 0.5 },
  temperature: 0.7,
  solver: { mode: 'Analysis' as const, orthogonalInjection: false },
  syntax: { enabled: false, minimalism: false },
});

/**
 * Get a profile by constraint name.
 */
export function getProfile(name: string): CTNProfile | undefined {
  return CTN_PROFILES[name];
}

/**
 * Check if a profile exists for a constraint.
 */
export function hasProfile(name: string): boolean {
  return name in CTN_PROFILES;
}

/**
 * Convert profile traits to array format (9D).
 */
export function traitsToArray(traits: ProfileTraits): readonly number[] {
  return Object.freeze([traits.v1, traits.v2, traits.v3, traits.v4, traits.v5, traits.v6, traits.v7, traits.v8, traits.v9]);
}

/**
 * Combine multiple profiles via averaging.
 *
 * Combination rules:
 * - Traits: arithmetic mean of each dimension (9D)
 * - Temperature: arithmetic mean
 * - Solver: Counter mode wins, then Dominance if any profile uses it
 * - Syntax: union of restrictions, minimalism if any profile requests it
 */
export function combineProfiles(profiles: readonly CTNProfile[]): CTNProfile {
  if (profiles.length === 0) {
    throw new Error('Cannot combine empty profile list');
  }
  if (profiles.length === 1) {
    return profiles[0]!;
  }

  const n = profiles.length;

  // Average traits (9D)
  const traits: ProfileTraits = {
    v1: profiles.reduce((s, p) => s + p.traits.v1, 0) / n,
    v2: profiles.reduce((s, p) => s + p.traits.v2, 0) / n,
    v3: profiles.reduce((s, p) => s + p.traits.v3, 0) / n,
    v4: profiles.reduce((s, p) => s + p.traits.v4, 0) / n,
    v5: profiles.reduce((s, p) => s + p.traits.v5, 0) / n,
    v6: profiles.reduce((s, p) => s + p.traits.v6, 0) / n,
    v7: profiles.reduce((s, p) => s + p.traits.v7, 0) / n,
    v8: profiles.reduce((s, p) => s + p.traits.v8, 0) / n,
    v9: profiles.reduce((s, p) => s + p.traits.v9, 0) / n,
  };

  // Average temperature
  const temperature = profiles.reduce((s, p) => s + p.temperature, 0) / n;

  // Mode priority: Dominance > Counter > Analysis
  const hasDominance = profiles.some(p => p.solver.mode === 'Dominance');
  const hasCounter = profiles.some(p => p.solver.mode === 'Counter');
  const hasOrthogonal = profiles.some(p => p.solver.orthogonalInjection);
  const finalMode: SolverMode = hasDominance ? 'Dominance' : hasCounter ? 'Counter' : 'Analysis';

  // Collect all behaviors
  const behaviors = profiles
    .map(p => p.solver.behavior)
    .filter((b): b is string => b !== undefined);

  // Union of syntax restrictions
  const disallowed = [...new Set(profiles.flatMap(p => p.syntax.disallowedSyntax ?? []))];
  const minimalism = profiles.some(p => p.syntax.minimalism);
  const syntaxEnabled = disallowed.length > 0 || minimalism;

  // Build solver config (omit undefined behavior)
  const solver: SolverConfig = {
    mode: finalMode,
    orthogonalInjection: hasOrthogonal,
  };
  if (behaviors.length > 0) {
    solver.behavior = behaviors.join(', ');
  }

  // Build syntax config (omit undefined disallowedSyntax)
  const syntax: SyntaxConfig = {
    enabled: syntaxEnabled,
    minimalism,
  };
  if (disallowed.length > 0) {
    syntax.disallowedSyntax = disallowed;
  }

  return {
    name: profiles.map(p => p.name).join('+'),
    traits,
    temperature,
    solver,
    syntax,
  };
}
