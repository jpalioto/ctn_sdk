import validator from 'validator';

/**
 * Maximum allowed input size in bytes.
 */
export const MAX_INPUT_SIZE = 100000;

/**
 * Result of input validation.
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Sanitizes user input by normalizing unicode and removing problematic characters.
 *
 * Operations:
 * - Unicode NFC normalization (composed form)
 * - Strip control characters (keep newlines and tabs)
 * - Remove zero-width characters
 *
 * @param input - Raw user input
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  // Unicode normalize to NFC (composed form)
  let sanitized = input.normalize('NFC');

  // Strip control characters but preserve newlines (\n) and tabs (\t)
  // validator.stripLow with keep_new_lines=true preserves \n but not \t
  // So we manually handle this
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove zero-width characters
  // \u200B = zero-width space
  // \u200C = zero-width non-joiner
  // \u200D = zero-width joiner
  // \uFEFF = byte order mark / zero-width no-break space
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  return sanitized;
}

/**
 * Validates user input for basic constraints.
 *
 * Checks:
 * - Input is not empty (after trimming whitespace)
 * - Input does not exceed maximum size
 *
 * @param input - User input to validate (should be sanitized first)
 * @returns Validation result with reason if invalid
 */
export function validateInput(input: string): ValidationResult {
  // Check for empty input
  if (validator.isEmpty(input, { ignore_whitespace: true })) {
    return { valid: false, reason: 'Input is empty' };
  }

  // Check size limit
  if (!validator.isByteLength(input, { max: MAX_INPUT_SIZE })) {
    return { valid: false, reason: `Input exceeds maximum size of ${MAX_INPUT_SIZE} bytes` };
  }

  return { valid: true };
}

/**
 * Sanitizes and validates input in one step.
 * Throws an error if validation fails.
 *
 * @param input - Raw user input
 * @returns Sanitized input string
 * @throws Error if validation fails
 */
export function sanitizeAndValidate(input: string): string {
  const sanitized = sanitizeInput(input);
  const validation = validateInput(sanitized);

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  return sanitized;
}
