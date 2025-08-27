import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'

// Configure markdown-it for parsing markdown to HTML
const md = new MarkdownIt({
  html: false, // Don't allow HTML tags in markdown
  breaks: true, // Convert line breaks to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: true // Use smart quotes
})

// Configure turndown for converting HTML back to markdown  
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  bulletListMarker: '-', // Use - for bullet lists
  codeBlockStyle: 'fenced', // Use ``` for code blocks
  fence: '```' // Use ``` for code blocks
})

// Add custom rules for better markdown conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`
})

turndownService.addRule('underline', {
  filter: 'u',
  replacement: (content) => `<u>${content}</u>` // Keep underline as HTML since markdown doesn't support it
})

/**
 * Convert markdown content to HTML for the rich text editor
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  return md.render(markdown)
}

/**
 * Convert HTML content from the rich text editor back to markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  return turndownService.turndown(html)
}

/**
 * Check if content is likely markdown (contains markdown syntax)
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false
  
  // If it contains HTML tags, it's probably not markdown
  if (/<[^>]*>/.test(content)) return false
  
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers
    /^[\*\-\+]\s/m, // Bullet lists  
    /^\d+\.\s/m, // Numbered lists
    /__.*__/, // Bold with underscores
    /\*\*.*\*\*/, // Bold with asterisks
    /\*[^*]+\*/, // Italic (but not bold)
    /\[.*?\]\(.*?\)/, // Links
    /```/, // Code blocks
    /`[^`]+`/, // Inline code
    /^>/m, // Blockquotes
  ]
  
  // Content should have at least one markdown pattern to be considered markdown
  return markdownPatterns.some(pattern => pattern.test(content))
}