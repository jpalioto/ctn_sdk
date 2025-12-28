import type { TraitStrategy, KernelIR } from '@ctn/language';
import {
  isCtnCapable,
  isXmlCapable,
  isMarkdownCapable,
  isPlainCapable,
  type RendererQuery,
} from '@ctn/core';

/**
 * Anthropic's renderer preferences, best first.
 * - CTN native format (for CTN strategy)
 * - XML (Operational strategy prefers this)
 * - Markdown (fallback)
 * - Plain text (base contract, always available)
 */
export const anthropicRendererPreferences: readonly RendererQuery<TraitStrategy>[] = [
  (s, ir) => (isCtnCapable(s) ? s.renderCtn(ir) : null),
  (s, ir) => (isXmlCapable(s) ? s.renderXml(ir) : null),
  (s, ir) => (isMarkdownCapable(s) ? s.renderMarkdown(ir) : null),
  (s, ir) => (isPlainCapable(s) ? s.renderPlain(ir) : null),
];
