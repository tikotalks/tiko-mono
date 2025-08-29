<template>
  <div :class="bemm()" v-html="renderedMarkdown" />
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { computed } from 'vue'
import type { TMarkdownRendererProps } from './TMarkdownRenderer.model'
import MarkdownIt from 'markdown-it'
// @ts-ignore
import markdownItAnchor from 'markdown-it-anchor'
// @ts-ignore
import markdownItEmoji from 'markdown-it-emoji/dist/markdown-it-emoji.js'
// @ts-ignore
import markdownItMark from 'markdown-it-mark'
// @ts-ignore
import markdownItFootnote from 'markdown-it-footnote'

const props = withDefaults(defineProps<TMarkdownRendererProps>(), {
  sanitize: true,
  breaks: true,
  linkify: true,
  typographer: true
})
const bemm = useBemm('t-markdown-renderer')

// Initialize Markdown-it instance with enhanced features
const md = new MarkdownIt({
  html: props.html ?? !props.sanitize,
  breaks: props.breaks,
  linkify: props.linkify,
  typographer: props.typographer
})

// Add plugins for enhanced functionality
md.use(markdownItAnchor, {
  permalink: markdownItAnchor.permalink.headerLink({
    symbol: '#',
    placement: 'before'
  })
})

// Use plugins
md.use(markdownItEmoji)
md.use(markdownItMark)
md.use(markdownItFootnote)

// Configure link rendering to open in new tabs
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const hrefIndex = token.attrIndex('href')

  if (hrefIndex >= 0) {
    const href = token.attrs![hrefIndex][1]
    // Only add target="_blank" for external links
    if (href.startsWith('http://') || href.startsWith('https://')) {
      token.attrPush(['target', '_blank'])
      token.attrPush(['rel', 'noopener noreferrer'])
    }
  }

  return self.renderToken(tokens, idx, options)
}

// Enhanced HTML sanitization function
function sanitizeHtml(html: string): string {
  if (!props.sanitize) return html

  // Allow basic HTML tags and attributes that are safe for content
  const allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'b', 'i', 'u',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'del', 'ins',
    'div', 'span'
  ]

  const allowedAttributes = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    '*': ['id', 'class']
  }

  // Basic HTML sanitization - remove dangerous elements
  let sanitized = html
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: links
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')

  return sanitized
}

const renderedMarkdown = computed(() => {
  if (!props.content) return ''

  try {
    const html = md.render(props.content)
    return sanitizeHtml(html)
  } catch (error) {
    console.error('Error rendering markdown:', error)
    return `<p>Error rendering markdown content</p>`
  }
})
</script>

<style lang="scss">
.t-markdown-renderer {
  line-height: 1.6;

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--header-font-family);
    margin-top: var(--space-l);
    margin-bottom: var(--space);
    line-height: 1.2;
    position: relative;

    // Anchor link styling
    .header-anchor {
      color: var(--color-primary);
      text-decoration: none;
      transition: opacity 0.2s ease;
      margin-right: var(--space-xs);
      font-weight: normal;

      &:hover {
        opacity: 1;
        text-decoration: none;
      }
    }

    &:hover .header-anchor {
      opacity: 0.7;
    }
  }

  h1 {
    font-size: 2.5em;
  }

  h2 {
    font-size: 2em;
  }

  h3 {
    font-size: 1.5em;
  }

  h4 {
    font-size: 1.3em;
  }

  h5 {
    font-size: 1.1em;
  }

  h6 {
    font-size: 1em;
    font-weight: 600;
  }

  p {
    margin-bottom: var(--space);

    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    color: var(--color-primary);
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-primary-hover);
    }
  }

  strong {
    font-weight: bold;
  }

  em {
    font-style: italic;
  }

  ul, ol {
    margin-bottom: var(--space);
    padding-left: var(--space-l);

    li {
      margin-bottom: calc(var(--space) / 2);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  blockquote {
    border-left: 4px solid var(--color-primary);
    padding-left: var(--space);
    margin: var(--space) 0;
    font-style: italic;
    color: var(--color-foreground-secondary);
  }

  code {
    background-color: var(--color-secondary);
    padding: 0.2em 0.4em;
    border-radius: var(--border-radius-small);
    font-family: monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: var(--color-background);
    color: var(--color-foreground);
    padding: var(--space);
    border-radius: var(--border-radius);
    overflow-x: auto;
    margin-bottom: var(--space);

    code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-accent);
    margin: var(--space-l) 0;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius);
  }

  // Mark (highlighted text)
  mark {
    background-color: var(--color-warning-light, #fff3cd);
    color: var(--color-warning-dark, #856404);
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }

  // Footnotes
  .footnote-ref {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.8em;
    vertical-align: super;

    &:hover {
      text-decoration: underline;
    }
  }

  .footnotes {
    margin-top: var(--space-xl);
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);
    font-size: 0.9em;

    .footnote-backref {
      color: var(--color-primary);
      text-decoration: none;
      margin-left: var(--space-xs);

      &:hover {
        text-decoration: underline;
      }
    }
  }

  // Tables
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--space);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    overflow: hidden;

    th, td {
      padding: var(--space-s) var(--space);
      text-align: left;
      border-bottom: 1px solid var(--color-accent);

      &:not(:last-child) {
        border-right: 1px solid var(--color-accent);
      }
    }

    th {
      font-weight: 600;
      background-color: var(--color-background-secondary);
    }

    tr:last-child td {
      border-bottom: none;
    }

    // Striped rows
    tbody tr:nth-child(even) {
      background-color: var(--color-background-tertiary, rgba(0, 0, 0, 0.02));
    }
  }

  // Emoji sizing
  .emoji {
    height: 1.2em;
    width: 1.2em;
    vertical-align: -0.1em;
  }

  // Task lists (GitHub-style checkboxes)
  .task-list-item {
    list-style: none;
    margin-left: -1.5em;

    .task-list-item-checkbox {
      margin-right: var(--space-xs);
    }
  }

  // Better spacing for nested lists
  ul ul, ol ol, ul ol, ol ul {
    margin-top: var(--space-xs);
    margin-bottom: var(--space-xs);
  }

  // Enhanced blockquotes
  blockquote {
    border-left: 4px solid var(--color-primary);
    padding-left: var(--space);
    margin: var(--space) 0;
    font-style: italic;
    color: var(--color-foreground-secondary);
    background-color: var(--color-background-secondary);
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    padding: var(--space);
  }
}
</style>
