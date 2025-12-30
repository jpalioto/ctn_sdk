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

  // Remove zero-width characters and bidirectional control characters
  // Zero-width:
  //   \u200B = zero-width space
  //   \u200C = zero-width non-joiner
  //   \u200D = zero-width joiner
  // Bidirectional text controls (security risk - can make text appear different):
  //   \u200E = left-to-right mark
  //   \u200F = right-to-left mark
  //   \u202A = left-to-right embedding
  //   \u202B = right-to-left embedding
  //   \u202C = pop directional formatting
  //   \u202D = left-to-right override
  //   \u202E = right-to-left override (most dangerous - reverses displayed text)
  // Bidi isolates (newer Unicode controls):
  //   \u2066 = left-to-right isolate
  //   \u2067 = right-to-left isolate
  //   \u2068 = first strong isolate
  //   \u2069 = pop directional isolate
  // BOM:
  //   \uFEFF = byte order mark / zero-width no-break space
  sanitized = sanitized.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');

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
