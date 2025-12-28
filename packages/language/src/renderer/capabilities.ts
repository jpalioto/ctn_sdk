import type { KernelIR } from '../schemas/index.js';

/**
 * Capability interfaces for kernel rendering.
 *
 * Strategies implement these interfaces to declare rendering capabilities.
 * Providers declare preferences as ordered lists of RendererQuery functions.
 * Negotiation is iteration: try each preference until one succeeds.
 *
 * Design principles:
 * - All strategies are equal peers
 * - No switch statements on strategy names
 * - Capabilities are interfaces, not concrete types
 * - Type guards query capabilities
 */

/**
 * Capability for rendering kernel IR as plain text.
 */
export interface PlainCapable {
  renderPlain(ir: KernelIR): string;
}

/**
 * Capability for rendering kernel IR as XML.
 */
export interface XmlCapable {
  renderXml(ir: KernelIR): string;
}

/**
 * Capability for rendering kernel IR as Markdown.
 */
export interface MarkdownCapable {
  renderMarkdown(ir: KernelIR): string;
}

/**
 * Capability for rendering kernel IR in CTN format.
 */
export interface CtnCapable {
  renderCtn(ir: KernelIR): string;
}

/**
 * Type guard for PlainCapable.
 */
export function isPlainCapable(obj: unknown): obj is PlainCapable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'renderPlain' in obj &&
    typeof (obj as PlainCapable).renderPlain === 'function'
  );
}

/**
 * Type guard for XmlCapable.
 */
export function isXmlCapable(obj: unknown): obj is XmlCapable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'renderXml' in obj &&
    typeof (obj as XmlCapable).renderXml === 'function'
  );
}

/**
 * Type guard for MarkdownCapable.
 */
export function isMarkdownCapable(obj: unknown): obj is MarkdownCapable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'renderMarkdown' in obj &&
    typeof (obj as MarkdownCapable).renderMarkdown === 'function'
  );
}

/**
 * Type guard for CtnCapable.
 */
export function isCtnCapable(obj: unknown): obj is CtnCapable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'renderCtn' in obj &&
    typeof (obj as CtnCapable).renderCtn === 'function'
  );
}
