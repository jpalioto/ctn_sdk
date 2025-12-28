import type { TraitStrategy, KernelIR } from '@ctn/language';
import { isXmlCapable, isMarkdownCapable, isPlainCapable, type RendererQuery } from '@ctn/core';

/**
 * Anthropic's renderer preferences, best first.
 * - Prefers XML (Claude handles XML well)
 * - Falls back to Markdown
 * - Last resort: Plain text (base contract, always available)
 */
export const anthropicRendererPreferences: readonly RendererQuery<TraitStrategy>[] = [
  (s, ir) => (isXmlCapable(s) ? s.renderXml(ir) : null),
  (s, ir) => (isMarkdownCapable(s) ? s.renderMarkdown(ir) : null),
  (s, ir) => (isPlainCapable(s) ? s.renderPlain(ir) : null),
];
