/**
 * Comprehensive CTN constraint profiles.
 *
 * Each profile defines the full configuration for a constraint including:
 * - Trait vector (7D CTN space)
 * - Temperature (inference randomness)
 * - Solver configuration (mode, behavior, orthogonal injection)
 * - Syntax restrictions (minimalism, disallowed tokens)
 */

/**
 * 7-dimensional trait object for CTN profiles.
 * Different from TraitVector (number[]) - this is a structured object.
 */
export interface ProfileTraits {
  v1: number;  // Atomic Clarity
  v2: number;  // Specification Accuracy
  v3: number;  // Context Isolation
  v4: number;  // Structure Over Narrative
  v5: number;  // Framing Detachment
  v6: number;  // Exploration
  v7: number;  // Schema Compliance
}

/**
 * Solver operating mode.
 * - 'Analysis': Standard analytical processing (η_⊥ = 0)
 * - 'Counter': Exploratory mode with orthogonal injection
 */
export type SolverMode = 'Analysis' | 'Counter';

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
 * Universal constraint profiles mapped to CTN's 7D space.
 *
 * Design rationale:
 * - Traits are full 7D vectors, not sparse mappings
 * - Temperature reflects the constraint's intended variability
 * - Solver mode distinguishes analytical vs exploratory constraints
 * - Syntax config enables output formatting control
 */
export const CTN_PROFILES: Readonly<Record<string, CTNProfile>> = Object.freeze({
  // ===========================================================================
  // Universal constraint profiles (best-effort CTN mappings)
  // ===========================================================================

  analytical: {
    name: 'analytical',
    traits: { v1: 0.7, v2: 0.8, v3: 0.5, v4: 0.8, v5: 0.6, v6: 0.3, v7: 0.0 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Deconstruct(Φ)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  terse: {
    name: 'terse',
    traits: { v1: 0.7, v2: 0.8, v3: 0.7, v4: 0.6, v5: 0.5, v6: 0.2, v7: 0.3 },
    temperature: 0.4,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: true, disallowedSyntax: ['—', '–', ';', '...'], minimalism: true },
  },

  verbose: {
    name: 'verbose',
    traits: { v1: 0.5, v2: 0.4, v3: 0.3, v4: 0.4, v5: 0.5, v6: 0.7, v7: 0.0 },
    temperature: 0.8,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  precise: {
    name: 'precise',
    traits: { v1: 0.9, v2: 0.8, v3: 0.6, v4: 0.7, v5: 0.9, v6: 0.2, v7: 0.0 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'Proof-bound assertions', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  creative: {
    name: 'creative',
    traits: { v1: 0.4, v2: 0.3, v3: 0.3, v4: 0.3, v5: 0.4, v6: 0.9, v7: 0.0 },
    temperature: 0.9,
    solver: { mode: 'Counter', behavior: 'Inject(η_⊥)', orthogonalInjection: true },
    syntax: { enabled: false, minimalism: false },
  },

  formal: {
    name: 'formal',
    traits: { v1: 0.7, v2: 0.7, v3: 0.5, v4: 0.7, v5: 0.6, v6: 0.4, v7: 0.2 },
    temperature: 0.5,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: true, disallowedSyntax: ['—', '...', '!'], minimalism: false },
  },

  casual: {
    name: 'casual',
    traits: { v1: 0.4, v2: 0.4, v3: 0.4, v4: 0.3, v5: 0.5, v6: 0.6, v7: 0.0 },
    temperature: 0.7,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  strict: {
    name: 'strict',
    traits: { v1: 0.8, v2: 0.9, v3: 0.8, v4: 0.9, v5: 0.8, v6: 0.1, v7: 0.0 },
    temperature: 0.2,
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  flexible: {
    name: 'flexible',
    traits: { v1: 0.4, v2: 0.4, v3: 0.3, v4: 0.4, v5: 0.4, v6: 0.7, v7: 0.0 },
    temperature: 0.8,
    solver: { mode: 'Counter', behavior: 'Inject(η_⊥)', orthogonalInjection: true },
    syntax: { enabled: false, minimalism: false },
  },

  // ===========================================================================
  // CTN-specific constraint profiles (native to this 7D space)
  // ===========================================================================

  clarity: {
    name: 'clarity',
    traits: { v1: 0.9, v2: 0.6, v3: 0.5, v4: 0.6, v5: 0.5, v6: 0.3, v7: 0.0 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Sharp(ε_hid → 0⁺)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  smooth: {
    name: 'smooth',
    traits: { v1: 0.6, v2: 0.9, v3: 0.5, v4: 0.6, v5: 0.5, v6: 0.4, v7: 0.0 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Smooth(κ(f) → min)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  focused: {
    name: 'focused',
    traits: { v1: 0.6, v2: 0.6, v3: 0.9, v4: 0.6, v5: 0.5, v6: 0.2, v7: 0.0 },
    temperature: 0.4,
    solver: { mode: 'Analysis', behavior: 'Filter(Φ:W→I)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  structural: {
    name: 'structural',
    traits: { v1: 0.6, v2: 0.6, v3: 0.5, v4: 0.9, v5: 0.6, v6: 0.3, v7: 0.0 },
    temperature: 0.5,
    solver: { mode: 'Analysis', behavior: 'Global(π_gl ≫ π_loc)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  schema: {
    name: 'schema',
    traits: { v1: 0.7, v2: 0.8, v3: 0.6, v4: 0.8, v5: 0.6, v6: 0.2, v7: 0.9 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'CTN_Form', orthogonalInjection: false },
    syntax: { enabled: true, minimalism: true },
  },

  // Composite profiles (multi-dimensional presets)
  stable: {
    name: 'stable',
    traits: { v1: 0.9, v2: 0.9, v3: 0.7, v4: 0.9, v5: 0.9, v6: 0.3, v7: 0.0 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'Stable(∀τ: high)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  toolselect: {
    name: 'toolselect',
    traits: { v1: 0.8, v2: 0.9, v3: 0.95, v4: 0.85, v5: 0.7, v6: 0.2, v7: 0.0 },
    temperature: 0.3,
    solver: { mode: 'Analysis', behavior: 'Select(optimal_tool)', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  research: {
    name: 'research',
    traits: { v1: 0.6, v2: 0.5, v3: 0.3, v4: 0.5, v5: 0.7, v6: 0.9, v7: 0.0 },
    temperature: 0.8,
    solver: { mode: 'Counter', behavior: 'Explore(U \\ S)', orthogonalInjection: true },
    syntax: { enabled: false, minimalism: false },
  },

  // ===========================================================================
  // Mechanical constraints (traits neutral, handled via features)
  // ===========================================================================

  nomemory: {
    name: 'nomemory',
    traits: { v1: 0.0, v2: 0.0, v3: 0.0, v4: 0.0, v5: 0.0, v6: 0.0, v7: 0.0 },
    temperature: 0.7,  // neutral
    solver: { mode: 'Analysis', orthogonalInjection: false },
    syntax: { enabled: false, minimalism: false },
  },

  lastN: {
    name: 'lastN',
    traits: { v1: 0.0, v2: 0.0, v3: 0.0, v4: 0.0, v5: 0.0, v6: 0.0, v7: 0.0 },
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
  traits: { v1: 0.5, v2: 0.5, v3: 0.5, v4: 0.5, v5: 0.5, v6: 0.5, v7: 0.0 },
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
 * Convert profile traits to array format.
 */
export function traitsToArray(traits: ProfileTraits): readonly number[] {
  return Object.freeze([traits.v1, traits.v2, traits.v3, traits.v4, traits.v5, traits.v6, traits.v7]);
}

/**
 * Combine multiple profiles via averaging.
 *
 * Combination rules:
 * - Traits: arithmetic mean of each dimension
 * - Temperature: arithmetic mean
 * - Solver: Counter mode wins if any profile uses it
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

  // Average traits
  const traits: ProfileTraits = {
    v1: profiles.reduce((s, p) => s + p.traits.v1, 0) / n,
    v2: profiles.reduce((s, p) => s + p.traits.v2, 0) / n,
    v3: profiles.reduce((s, p) => s + p.traits.v3, 0) / n,
    v4: profiles.reduce((s, p) => s + p.traits.v4, 0) / n,
    v5: profiles.reduce((s, p) => s + p.traits.v5, 0) / n,
    v6: profiles.reduce((s, p) => s + p.traits.v6, 0) / n,
    v7: profiles.reduce((s, p) => s + p.traits.v7, 0) / n,
  };

  // Average temperature
  const temperature = profiles.reduce((s, p) => s + p.temperature, 0) / n;

  // Counter mode wins (more exploratory)
  const hasCounter = profiles.some(p => p.solver.mode === 'Counter');
  const hasOrthogonal = profiles.some(p => p.solver.orthogonalInjection);

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
    mode: hasCounter ? 'Counter' : 'Analysis',
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
