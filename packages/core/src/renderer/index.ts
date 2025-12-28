// Capability interfaces and type guards
export {
  type PlainCapable,
  type XmlCapable,
  type MarkdownCapable,
  type CtnCapable,
  isPlainCapable,
  isXmlCapable,
  isMarkdownCapable,
  isCtnCapable,
} from './capabilities.js';

// Negotiation logic
export {
  type RendererQuery,
  NoCompatibleRendererError,
  renderKernel,
} from './negotiate.js';
