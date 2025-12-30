import type {
  ParsedConstraint,
  ConstraintParams,
  ConstraintParamValue,
} from '../schemas/index.js';
import { MalformedConstraintError } from '../schemas/index.js';

/**
 * Result of parsing an input string for constraints.
 */
export interface ParseResult {
  /** Parsed constraints found in the input */
  readonly constraints: readonly ParsedConstraint[];
  /** Remaining text after constraint extraction */
  readonly prompt: string;
  /** Original input text */
  readonly source: string;
  /** Unknown constraint names that were found at start but not recognized */
  readonly unknownConstraints?: readonly string[];
}

/**
 * Known constraints from the Operational strategy.
 * Includes both primary names and aliases.
 */
const OPERATIONAL_KNOWN = new Set([
  'precise', 'deterministic', 'grounded',
  'creative', 'exploratory',
  'terse', 'brief', 'concise',
  'verbose', 'detailed', 'thorough',
  'formal',
  'casual',
  'analytical', 'step-by-step', 'reasoning',
  'strict', 'compliant',
  'flexible',
  'nomemory', 'isolated',
  'lastn',
]);

/**
 * Known constraints from the CTN strategy.
 * Includes both primary names and aliases.
 */
const CTN_KNOWN = new Set([
  'clarity',
  'smooth',
  'focused',
  'structural',
  'grounded',
  'exploratory',
  'schema',
  'stable',
  'toolselect',
  'research',
  'nomemory', 'isolated',
  'lastn',
]);

/**
 * Combined set of all known constraints (case-insensitive lookup).
 * Used for validating constraints when no explicit allowlist is provided.
 */
export const KNOWN_CONSTRAINTS = new Set([
  ...OPERATIONAL_KNOWN,
  ...CTN_KNOWN,
]);

/**
 * Warning callback for unknown constraints.
 */
export type UnknownConstraintWarning = (name: string) => void;

/**
 * Options for the constraint parser.
 */
export interface ParserOptions {
  /**
   * If true, parse constraints from the input.
   * If false, return input as-is with no constraints.
   * Default: true
   */
  readonly parseConstraints?: boolean;

  /**
   * Optional boundary delimiters for constraint parsing.
   * If provided, only parse constraints within these boundaries.
   * Example: ['[[CTN:', ']]']
   */
  readonly constraintBoundary?: readonly [string, string];

  /**
   * Allowlist of constraint names. If provided, only these
   * constraints will be parsed; others will be left as text.
   */
  readonly allowedConstraints?: readonly string[];

  /**
   * If true (default), only parse constraints at the START of input.
   * Constraints in the middle of text are left as literal text.
   * If false, parse constraints anywhere in the input (legacy behavior).
   * Default: true
   */
  readonly startOnly?: boolean;

  /**
   * If true (default), use built-in KNOWN_CONSTRAINTS allowlist
   * when no explicit allowedConstraints is provided.
   * Unknown constraints at start are left as literal text with a warning.
   * Default: true
   */
  readonly useBuiltinAllowlist?: boolean;

  /**
   * Callback for unknown constraint warnings.
   * Default: console.warn
   */
  readonly onUnknownConstraint?: UnknownConstraintWarning;
}

/**
 * Regex pattern for constraint syntax:
 * @name                    Simple constraint
 * @name[param=value]       With single parameter
 * @name[a=1,b=2]           Multiple parameters
 */
const CONSTRAINT_PATTERN = /@(\w+)(?:\[([^\]]*)\])?/g;

/**
 * Default warning callback that logs to console.
 */
const defaultWarning: UnknownConstraintWarning = (name: string) => {
  console.warn(`Unknown constraint '@${name}', treating as literal text`);
};

/**
 * Parses constraint syntax from input text.
 *
 * Syntax:
 * - @name                    Simple constraint
 * - @name[param=value]       With parameter
 * - @name[a=1,b=2]           Multiple parameters
 * - @a @b @c Text            Multiple constraints + prompt
 *
 * By default, only parses constraints at the START of input.
 * Unknown constraints are left as literal text with a warning.
 *
 * @param input - Input text potentially containing constraints
 * @param options - Parser options
 * @returns ParseResult with constraints and remaining prompt
 */
export function parse(input: string, options: ParserOptions = {}): ParseResult {
  const {
    parseConstraints = true,
    constraintBoundary,
    allowedConstraints,
    startOnly = true,
    useBuiltinAllowlist = true,
    onUnknownConstraint = defaultWarning,
  } = options;

  // If parsing disabled, return input as-is
  if (!parseConstraints) {
    return {
      constraints: [],
      prompt: input,
      source: input,
    };
  }

  // If boundary specified, extract and parse only within boundary
  if (constraintBoundary) {
    return parseWithBoundary(input, constraintBoundary, allowedConstraints);
  }

  // New default: start-only parsing with built-in allowlist
  if (startOnly) {
    return parseConstraintsFromStart(input, {
      allowedConstraints,
      useBuiltinAllowlist,
      onUnknownConstraint,
    });
  }

  // Legacy behavior: parse constraints anywhere in text
  return parseConstraintsFromText(input, allowedConstraints);
}

/**
 * Parses constraints only within specified boundary delimiters.
 */
function parseWithBoundary(
  input: string,
  boundary: readonly [string, string],
  allowedConstraints?: readonly string[]
): ParseResult {
  const [startDelim, endDelim] = boundary;
  const startIdx = input.indexOf(startDelim);

  if (startIdx === -1) {
    // No boundary found, return input as-is
    return {
      constraints: [],
      prompt: input,
      source: input,
    };
  }

  const endIdx = input.indexOf(endDelim, startIdx + startDelim.length);
  if (endIdx === -1) {
    // Unclosed boundary
    throw new MalformedConstraintError(
      startIdx,
      `Unclosed constraint boundary: missing '${endDelim}'`,
      input
    );
  }

  // Extract content within boundary
  const boundaryContent = input.slice(startIdx + startDelim.length, endIdx);
  const beforeBoundary = input.slice(0, startIdx);
  const afterBoundary = input.slice(endIdx + endDelim.length);

  // Parse constraints from boundary content
  const boundaryResult = parseConstraintsFromText(boundaryContent, allowedConstraints);

  // Reconstruct prompt without boundary
  const prompt = (beforeBoundary + boundaryResult.prompt + afterBoundary).trim();

  return {
    constraints: boundaryResult.constraints,
    prompt,
    source: input,
  };
}

/**
 * Parses constraints from text, extracting them and returning remaining text.
 */
function parseConstraintsFromText(
  input: string,
  allowedConstraints?: readonly string[]
): ParseResult {
  const constraints: ParsedConstraint[] = [];
  const allowedSet = allowedConstraints ? new Set(allowedConstraints) : null;

  // Reset regex state
  CONSTRAINT_PATTERN.lastIndex = 0;

  let prompt = input;
  let match: RegExpExecArray | null;

  // Find all constraint matches
  const matches: Array<{ match: RegExpExecArray; name: string; paramsStr: string | undefined }> = [];

  while ((match = CONSTRAINT_PATTERN.exec(input)) !== null) {
    const name = match[1]!;
    const paramsStr = match[2];

    // Skip if not in allowlist
    if (allowedSet && !allowedSet.has(`@${name}`)) {
      continue;
    }

    matches.push({ match, name, paramsStr });
  }

  // Process matches in reverse order to maintain correct indices when removing
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match, name, paramsStr } = matches[i]!;
    const fullMatch = match[0];
    const startPos = match.index;

    // Parse parameters
    const params = paramsStr ? parseParams(paramsStr, name, input) : {};

    // Add constraint (will be reversed later)
    constraints.unshift({
      name,
      params,
      source: fullMatch,
    });

    // Remove constraint from prompt
    prompt = prompt.slice(0, startPos) + prompt.slice(startPos + fullMatch.length);
  }

  // Clean up whitespace
  prompt = prompt.replace(/\s+/g, ' ').trim();

  return {
    constraints,
    prompt,
    source: input,
  };
}

/**
 * Regex pattern for constraint at start of string.
 * Matches: @name or @name[params]
 * Must be at start or after whitespace from previous constraint.
 */
const START_CONSTRAINT_PATTERN = /^@(\w+)(?:\[([^\]]*)\])?/;

/**
 * Options for start-only parsing.
 */
interface StartParseOptions {
  allowedConstraints: readonly string[] | undefined;
  useBuiltinAllowlist: boolean;
  onUnknownConstraint: UnknownConstraintWarning;
}

/**
 * Parses constraints only from the START of input.
 * Stops at the first non-constraint text or unknown constraint.
 * Unknown constraints at start are treated as literal text with a warning.
 */
function parseConstraintsFromStart(
  input: string,
  options: StartParseOptions
): ParseResult {
  const { allowedConstraints, useBuiltinAllowlist, onUnknownConstraint } = options;
  const constraints: ParsedConstraint[] = [];
  const unknownConstraints: string[] = [];

  // Build effective allowlist
  const allowedSet = allowedConstraints
    ? new Set(allowedConstraints.map((c) => c.replace(/^@/, '').toLowerCase()))
    : useBuiltinAllowlist
      ? KNOWN_CONSTRAINTS
      : null;

  let remaining = input;
  let foundUnknown = false;

  // Keep parsing while we find constraints at the start
  while (remaining.length > 0 && !foundUnknown) {
    // Skip leading whitespace
    const trimmed = remaining.trimStart();
    if (trimmed.length === 0) {
      remaining = '';
      break;
    }

    // Check if starts with @ for potential constraint
    if (!trimmed.startsWith('@')) {
      // Not a constraint, done parsing
      remaining = trimmed;
      break;
    }

    // Check for malformed @@ pattern
    if (trimmed.startsWith('@@')) {
      // Malformed - treat as literal text
      remaining = trimmed;
      break;
    }

    // Try to match constraint pattern
    const match = START_CONSTRAINT_PATTERN.exec(trimmed);
    if (!match) {
      // No valid constraint syntax (e.g., just '@' alone)
      remaining = trimmed;
      break;
    }

    const name = match[1]!;
    const nameLower = name.toLowerCase();
    const paramsStr = match[2];
    const fullMatch = match[0];

    // Check if constraint is known/allowed
    if (allowedSet && !allowedSet.has(nameLower)) {
      // Unknown constraint - treat as literal text, emit warning
      onUnknownConstraint(name);
      unknownConstraints.push(name);
      foundUnknown = true;
      remaining = trimmed;
      break;
    }

    // Parse parameters (may throw MalformedConstraintError)
    const params = paramsStr ? parseParams(paramsStr, name, input) : {};

    // Valid constraint found
    constraints.push({
      name,
      params,
      source: fullMatch,
    });

    // Move past this constraint
    remaining = trimmed.slice(fullMatch.length);
  }

  // Clean up remaining text
  const prompt = remaining.trim();

  const result: ParseResult = {
    constraints,
    prompt,
    source: input,
  };

  // Only add unknownConstraints if there are any
  if (unknownConstraints.length > 0) {
    return { ...result, unknownConstraints };
  }

  return result;
}

/**
 * Parses parameter string into key-value pairs.
 * Format: key=value,key2=value2
 */
function parseParams(
  paramsStr: string,
  constraintName: string,
  source: string
): ConstraintParams {
  const params: Record<string, ConstraintParamValue> = {};

  if (!paramsStr.trim()) {
    return params;
  }

  const pairs = paramsStr.split(',');

  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      throw new MalformedConstraintError(
        0,
        `Invalid parameter format in @${constraintName}: expected 'key=value', got '${pair}'`,
        source
      );
    }

    const key = pair.slice(0, eqIdx).trim();
    const valueStr = pair.slice(eqIdx + 1).trim();

    if (!key) {
      throw new MalformedConstraintError(
        0,
        `Empty parameter name in @${constraintName}`,
        source
      );
    }

    params[key] = parseValue(valueStr);
  }

  return params;
}

/**
 * Parses a parameter value string into appropriate type.
 * Only returns safe primitive types (string, number, boolean).
 */
function parseValue(valueStr: string): ConstraintParamValue {
  // Try number
  if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
    return parseFloat(valueStr);
  }

  // Try boolean
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;

  // Try quoted string
  if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
      (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
    return valueStr.slice(1, -1);
  }

  // Plain string
  return valueStr;
}

/**
 * Extracts just the constraint names from input (for quick validation).
 */
export function extractConstraintNames(input: string): string[] {
  const names: string[] = [];
  CONSTRAINT_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CONSTRAINT_PATTERN.exec(input)) !== null) {
    names.push(match[1]!);
  }

  return names;
}

/**
 * Checks if input contains any constraint syntax.
 */
export function hasConstraints(input: string): boolean {
  CONSTRAINT_PATTERN.lastIndex = 0;
  return CONSTRAINT_PATTERN.test(input);
}

/**
 * Validates that all constraints in input are in the allowlist.
 * Returns list of invalid constraint names.
 */
export function validateConstraints(
  input: string,
  allowedConstraints: readonly string[]
): string[] {
  const allowedSet = new Set(allowedConstraints.map((c) => c.replace(/^@/, '')));
  const names = extractConstraintNames(input);
  return names.filter((name) => !allowedSet.has(name));
}
