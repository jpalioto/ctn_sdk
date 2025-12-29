import type { TraitStrategy } from '@ctn/language';
import { isPlainCapable, isMarkdownCapable, isCtnCapable, type RendererQuery } from '@ctn/core';

/**
 * Google Gemini renderer preferences, best first.
 * - Prefers CTN notation for CTN strategy
 * - Prefers Markdown for others (Gemini handles markdown well)
 * - Falls back to plain text
 */
export const geminiRendererPreferences: readonly RendererQuery<TraitStrategy>[] = [
  (s, ir) => (isCtnCapable(s) ? s.renderCtn(ir) : null),
  (s, ir) => (isMarkdownCapable(s) ? s.renderMarkdown(ir) : null),
  (s, ir) => (isPlainCapable(s) ? s.renderPlain(ir) : null),
];
