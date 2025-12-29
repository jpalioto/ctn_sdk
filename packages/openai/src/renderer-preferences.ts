import type { TraitStrategy, KernelIR } from '@ctn/language';
import {
  isPlainCapable,
  isMarkdownCapable,
  isCtnCapable,
  type RendererQuery,
} from '@ctn/core';

/**
 * OpenAI renderer preferences, best first.
 * OpenAI models work well with Markdown formatting.
 */
export const openaiRendererPreferences: readonly RendererQuery<TraitStrategy>[] = [
  (s, ir) => (isCtnCapable(s) ? s.renderCtn(ir) : null),
  (s, ir) => (isMarkdownCapable(s) ? s.renderMarkdown(ir) : null),
  (s, ir) => (isPlainCapable(s) ? s.renderPlain(ir) : null),
];
