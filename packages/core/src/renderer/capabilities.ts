// Re-export capability interfaces from @ctn/language
// This maintains the original API surface of @ctn/core
export {
  type PlainCapable,
  type XmlCapable,
  type MarkdownCapable,
  type CtnCapable,
  isPlainCapable,
  isXmlCapable,
  isMarkdownCapable,
  isCtnCapable,
} from '@ctn/language';
