import type { KernelIR } from '@ctn/language';
import type { KernelRenderer } from './types.js';

/**
 * Renders KernelIR as XML (for Anthropic Claude models).
 */
export class XMLKernelRenderer implements KernelRenderer {
  render(ir: KernelIR): string {
    const lines = ['<behavioral_constraints>'];

    for (const clause of ir.clauses) {
      const intensity =
        clause.intensity === 'high'
          ? 'Strongly'
          : clause.intensity === 'medium'
            ? 'Moderately'
            : 'Slightly';

      lines.push(
        `  <constraint id="${clause.traitId}">${intensity} favor ${clause.text}</constraint>`
      );
    }

    for (const mod of ir.modifiedClauses) {
      lines.push(`  <constraint id="${mod.interactionId}">${mod.text}</constraint>`);
    }

    lines.push('</behavioral_constraints>');
    return lines.join('\n');
  }
}

/**
 * Renders KernelIR as Markdown (for OpenAI models).
 */
export class MarkdownKernelRenderer implements KernelRenderer {
  render(ir: KernelIR): string {
    const lines = ['## Behavioral Constraints', ''];

    for (const clause of ir.clauses) {
      const intensity =
        clause.intensity === 'high'
          ? 'Strongly'
          : clause.intensity === 'medium'
            ? 'Moderately'
            : 'Slightly';

      lines.push(`- **${clause.traitId}**: ${intensity} favor ${clause.text}`);
    }

    for (const mod of ir.modifiedClauses) {
      lines.push(`- **${mod.interactionId}**: ${mod.text}`);
    }

    return lines.join('\n');
  }
}

/**
 * Renders KernelIR as plain text (for models that don't support formatting).
 */
export class PlainTextKernelRenderer implements KernelRenderer {
  render(ir: KernelIR): string {
    const lines = ['Behavioral Constraints:', ''];

    for (const clause of ir.clauses) {
      const intensity =
        clause.intensity === 'high'
          ? 'Strongly'
          : clause.intensity === 'medium'
            ? 'Moderately'
            : 'Slightly';

      lines.push(`${clause.traitId}: ${intensity} favor ${clause.text}`);
    }

    for (const mod of ir.modifiedClauses) {
      lines.push(`${mod.interactionId}: ${mod.text}`);
    }

    return lines.join('\n');
  }
}
