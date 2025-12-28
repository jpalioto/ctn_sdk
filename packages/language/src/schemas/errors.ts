/**
 * Base error class for all CTN errors.
 */
export class CTNError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'CTNError';
  }
}

// ============================================================================
// Parse Errors
// ============================================================================

export class ParseError extends CTNError {
  constructor(
    message: string,
    code: string,
    public readonly source: string
  ) {
    super(message, code);
    this.name = 'ParseError';
  }
}

export class UnknownConstraintError extends ParseError {
  constructor(
    public readonly constraintName: string,
    source: string
  ) {
    super(
      `Unknown constraint: '${constraintName}'`,
      'UNKNOWN_CONSTRAINT',
      source
    );
    this.name = 'UnknownConstraintError';
  }
}

export class InvalidConstraintParamError extends ParseError {
  constructor(
    public readonly constraintName: string,
    public readonly paramName: string,
    public readonly reason: string,
    source: string
  ) {
    super(
      `Invalid parameter '${paramName}' for constraint '${constraintName}': ${reason}`,
      'INVALID_CONSTRAINT_PARAM',
      source
    );
    this.name = 'InvalidConstraintParamError';
  }
}

export class MalformedConstraintError extends ParseError {
  constructor(
    public readonly position: number,
    reason: string,
    source: string
  ) {
    super(
      `Malformed constraint at position ${position}: ${reason}`,
      'MALFORMED_CONSTRAINT',
      source
    );
    this.name = 'MalformedConstraintError';
  }
}

// ============================================================================
// Composition Errors
// ============================================================================

export class CompositionError extends CTNError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'CompositionError';
  }
}

export class StrategyMismatchError extends CompositionError {
  constructor(
    public readonly expected: string,
    public readonly actual: string
  ) {
    super(
      `Strategy mismatch: expected '${expected}', got '${actual}'`,
      'STRATEGY_MISMATCH'
    );
    this.name = 'StrategyMismatchError';
  }
}

export class DimensionMismatchError extends CompositionError {
  constructor(
    public readonly expected: number,
    public readonly actual: number
  ) {
    super(
      `Dimension mismatch: expected ${expected} dimensions, got ${actual}`,
      'DIMENSION_MISMATCH'
    );
    this.name = 'DimensionMismatchError';
  }
}

// ============================================================================
// Configuration Errors
// ============================================================================

export class ConfigError extends CTNError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'ConfigError';
  }
}

export class ConfigNotFoundError extends ConfigError {
  constructor(public readonly path: string) {
    super(`Configuration file not found: ${path}`, 'CONFIG_NOT_FOUND');
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigValidationError extends ConfigError {
  constructor(public readonly errors: readonly string[]) {
    super(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
      'CONFIG_VALIDATION'
    );
    this.name = 'ConfigValidationError';
  }
}

export class ConfigSemanticError extends ConfigError {
  constructor(
    public readonly issue: string,
    public readonly details?: string
  ) {
    super(
      `Configuration semantic error: ${issue}${details ? ` (${details})` : ''}`,
      'CONFIG_SEMANTIC'
    );
    this.name = 'ConfigSemanticError';
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends CTNError {
  constructor(
    message: string,
    public readonly errors: readonly string[]
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
