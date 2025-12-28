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
}

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
}

/**
 * Regex pattern for constraint syntax:
 * @name                    Simple constraint
 * @name[param=value]       With single parameter
 * @name[a=1,b=2]           Multiple parameters
 */
const CONSTRAINT_PATTERN = /@(\w+)(?:\[([^\]]*)\])?/g;

/**
 * Parses constraint syntax from input text.
 *
 * Syntax:
 * - @name                    Simple constraint
 * - @name[param=value]       With parameter
 * - @name[a=1,b=2]           Multiple parameters
 * - @a @b @c Text            Multiple constraints + prompt
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

  // Parse constraints from entire input
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
