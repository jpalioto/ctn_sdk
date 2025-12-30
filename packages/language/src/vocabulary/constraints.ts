/**
 * Universal constraint vocabulary - single source of truth.
 *
 * All constraint names and aliases are defined here. Parser and strategies
 * import from this module to ensure consistency.
 *
 * Constraint types:
 * - 'steering': Behavioral modification via trait vectors. Semantics are
 *   defined by the natural meaning of the word (e.g., "analytical" means
 *   favor step-by-step reasoning).
 * - 'mechanical': Configuration settings that don't affect behavioral traits
 *   (e.g., context policies, output format requirements).
 */

/**
 * Type of constraint effect.
 */
export type ConstraintType = 'steering' | 'mechanical';

/**
 * Universal constraint definition.
 * Strategy-agnostic - defines what constraints exist, not how they map to traits.
 */
export interface UniversalConstraint {
  /** Primary constraint name */
  readonly name: string;
  /** Alternative names for this constraint */
  readonly aliases: readonly string[];
  /** Whether this affects behavior (steering) or configuration (mechanical) */
  readonly type: ConstraintType;
  /** Human-readable description (especially useful for mechanical constraints) */
  readonly description?: string;
}

/**
 * All known constraints across all strategies.
 *
 * Steering constraints: Semantics defined by the word itself.
 * Strategies interpret these into trait vectors.
 *
 * Mechanical constraints: Configuration settings with explicit descriptions.
 * These typically map to features rather than traits.
 */
export const UNIVERSAL_CONSTRAINTS: readonly UniversalConstraint[] = Object.freeze([
  // ============================================================================
  // Steering constraints - behavioral modification
  // ============================================================================

  // Reasoning style
  {
    name: 'analytical',
    aliases: ['step-by-step', 'reasoning'],
    type: 'steering',
  },

  // Output length
  {
    name: 'terse',
    aliases: ['brief', 'concise'],
    type: 'steering',
  },
  {
    name: 'verbose',
    aliases: ['detailed', 'thorough'],
    type: 'steering',
  },

  // Creativity vs precision
  {
    name: 'precise',
    aliases: ['deterministic', 'grounded'],
    type: 'steering',
  },
  {
    name: 'creative',
    aliases: ['exploratory'],
    type: 'steering',
  },

  // Tone/register
  {
    name: 'formal',
    aliases: [],
    type: 'steering',
  },
  {
    name: 'casual',
    aliases: [],
    type: 'steering',
  },

  // Compliance
  {
    name: 'strict',
    aliases: ['compliant'],
    type: 'steering',
  },
  {
    name: 'flexible',
    aliases: [],
    type: 'steering',
  },

  // ============================================================================
  // CTN-specific steering constraints
  // ============================================================================

  {
    name: 'clarity',
    aliases: [],
    type: 'steering',
  },
  {
    name: 'smooth',
    aliases: [],
    type: 'steering',
  },
  {
    name: 'focused',
    aliases: [],
    type: 'steering',
  },
  {
    name: 'structural',
    aliases: [],
    type: 'steering',
  },
  {
    name: 'stable',
    aliases: [],
    type: 'steering',
  },
  {
    name: 'research',
    aliases: [],
    type: 'steering',
  },

  // ============================================================================
  // Mechanical constraints - configuration settings
  // ============================================================================

  {
    name: 'nomemory',
    aliases: ['isolated'],
    type: 'mechanical',
    description: 'Exclude conversation history from context',
  },
  {
    name: 'lastN',
    aliases: [],
    type: 'mechanical',
    description: 'Include only the last N messages in context',
  },
  {
    name: 'schema',
    aliases: [],
    type: 'mechanical',
    description: 'Require structured output format',
  },
  {
    name: 'toolselect',
    aliases: [],
    type: 'mechanical',
    description: 'Enable tool/function calling',
  },
]);

/**
 * Set of all known constraint names (primary names and aliases).
 * Used by parser for allowlist validation.
 * All names are stored lowercase for case-insensitive matching.
 */
export const KNOWN_CONSTRAINT_NAMES: ReadonlySet<string> = Object.freeze(
  new Set(
    UNIVERSAL_CONSTRAINTS.flatMap((c) => [c.name.toLowerCase(), ...c.aliases.map(a => a.toLowerCase())])
  )
);

/**
 * Type representing valid primary constraint names.
 */
export type ConstraintName = (typeof UNIVERSAL_CONSTRAINTS)[number]['name'];

/**
 * Lookup a constraint by name or alias.
 *
 * @param nameOrAlias - Constraint name or alias to look up
 * @returns The universal constraint definition, or undefined if not found
 */
export function getConstraintByName(nameOrAlias: string): UniversalConstraint | undefined {
  const normalized = nameOrAlias.toLowerCase();
  return UNIVERSAL_CONSTRAINTS.find(
    (c) => c.name.toLowerCase() === normalized ||
           c.aliases.some((a) => a.toLowerCase() === normalized)
  );
}

/**
 * Check if a name is a known constraint (primary name or alias).
 *
 * @param name - Name to check
 * @returns True if this is a known constraint name
 */
export function isKnownConstraint(name: string): boolean {
  return KNOWN_CONSTRAINT_NAMES.has(name.toLowerCase());
}

/**
 * Get all steering constraints.
 */
export function getSteeringConstraints(): readonly UniversalConstraint[] {
  return UNIVERSAL_CONSTRAINTS.filter((c) => c.type === 'steering');
}

/**
 * Get all mechanical constraints.
 */
export function getMechanicalConstraints(): readonly UniversalConstraint[] {
  return UNIVERSAL_CONSTRAINTS.filter((c) => c.type === 'mechanical');
}
