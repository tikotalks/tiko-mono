export interface TMarkdownRendererProps {
  content: string
  /**
   * Whether to sanitize HTML content before rendering
   * @default true
   */
  sanitize?: boolean
}