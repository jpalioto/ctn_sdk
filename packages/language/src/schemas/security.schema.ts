import { z } from 'zod';

/**
 * Trust mode for constraint parsing.
 *
 * From Section 2.2 of the CTN specification:
 *
 * | Mode      | Behavior                                           |
 * |-----------|----------------------------------------------------|
 * | trusted   | Parse all constraints from input                   |
 * | untrusted | Never parse constraints; return raw text           |
 * | boundary  | Only parse within [[CTN: ... ]] delimiters         |
 *
 * Security implications:
 * - trusted: Use only for developer-controlled inputs
 * - untrusted: Use for all user-generated content
 * - boundary: Use when mixing user text with CTN blocks
 */
export const TrustModeSchema = z.enum(['trusted', 'untrusted', 'boundary']);
export type TrustMode = z.infer<typeof TrustModeSchema>;

/**
 * Default boundary delimiters for constraint parsing.
 */
export const DEFAULT_CONSTRAINT_BOUNDARY: readonly [string, string] = ['[[CTN:', ']]'];

/**
 * Security options for constraint processing.
 */
export interface SecurityOptions {
  /**
   * Trust mode for constraint parsing.
   * Default: 'trusted'
   */
  readonly trustMode?: TrustMode;

  /**
   * Custom boundary delimiters for 'boundary' mode.
   * Default: ['[[CTN:', ']]']
   */
  readonly boundaryDelimiters?: readonly [string, string];

  /**
   * Allowlist of constraint names.
   * If provided, only these constraints will be parsed.
   */
  readonly allowedConstraints?: readonly string[];
}

/**
 * Converts SecurityOptions to ParserOptions.
 */
export function toParserOptions(security: SecurityOptions): {
  parseConstraints: boolean;
  constraintBoundary?: readonly [string, string];
  allowedConstraints?: readonly string[];
} {
  const { trustMode = 'trusted', boundaryDelimiters, allowedConstraints } = security;

  // Build base result for each trust mode
  switch (trustMode) {
    case 'untrusted': {
      const result: {
        parseConstraints: boolean;
        allowedConstraints?: readonly string[];
      } = { parseConstraints: false };
      if (allowedConstraints !== undefined) {
        result.allowedConstraints = allowedConstraints;
      }
      return result;
    }

    case 'boundary': {
      const result: {
        parseConstraints: boolean;
        constraintBoundary: readonly [string, string];
        allowedConstraints?: readonly string[];
      } = {
        parseConstraints: true,
        constraintBoundary: boundaryDelimiters ?? DEFAULT_CONSTRAINT_BOUNDARY,
      };
      if (allowedConstraints !== undefined) {
        result.allowedConstraints = allowedConstraints;
      }
      return result;
    }

    case 'trusted':
    default: {
      const result: {
        parseConstraints: boolean;
        allowedConstraints?: readonly string[];
      } = { parseConstraints: true };
      if (allowedConstraints !== undefined) {
        result.allowedConstraints = allowedConstraints;
      }
      return result;
    }
  }
}
