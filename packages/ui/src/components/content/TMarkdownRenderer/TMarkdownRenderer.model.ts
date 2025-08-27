export interface TMarkdownRendererProps {
  content: string
  /**
   * Whether to sanitize HTML content before rendering
   * @default true
   */
  sanitize?: boolean
  /**
   * Whether to enable HTML tags in markdown
   * @default false (when sanitize is true)
   */
  html?: boolean
  /**
   * Whether to convert newlines to <br> tags
   * @default true
   */
  breaks?: boolean
  /**
   * Whether to autoconvert URL-like text to links
   * @default true
   */
  linkify?: boolean
  /**
   * Whether to enable typographic replacements
   * @default true
   */
  typographer?: boolean
}