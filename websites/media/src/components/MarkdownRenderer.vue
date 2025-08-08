<template>
  <div :class="bemm()" v-html="renderedMarkdown" />
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { computed } from 'vue'

interface MarkdownRendererProps {
  content: string
}

const props = defineProps<MarkdownRendererProps>()
const bemm = useBemm('markdown-renderer')

// Simple markdown parser without external dependencies
function parseMarkdown(markdown: string): string {
  if (!markdown) return ''

  let html = markdown

  // Escape HTML
  html = html.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Line breaks
  html = html.replace(/  \n/g, '<br>')

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.trim() && !para.trim().startsWith('<h') && !para.trim().startsWith('<ul') && !para.trim().startsWith('<ol')) {
      return `<p>${para.trim()}</p>`
    }
    return para
  }).join('\n')

  // Lists
  html = html.replace(/^\* (.+)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  html = html.replace(/^\d+\. (.+)/gm, '<li>$1</li>')

  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Blockquotes
  html = html.replace(/^> (.+)/gm, '<blockquote>$1</blockquote>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>')

  return html
}

const renderedMarkdown = computed(() => parseMarkdown(props.content))
</script>

<style lang="scss">
.markdown-renderer {
  line-height: 1.6;

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--header-font-family);
    margin-top: var(--space-l);
    margin-bottom: var(--space);
    line-height: 1.2;
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
    background-color: var(--color-background-secondary);
    padding: 0.2em 0.4em;
    border-radius: var(--border-radius-small);
    font-family: monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: var(--color-background-secondary);
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
    border-top: 1px solid var(--color-border);
    margin: var(--space-l) 0;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: var(--border-radius);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--space);

    th, td {
      padding: var(--space-s);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th {
      font-weight: bold;
      background-color: var(--color-background-secondary);
    }
  }
}
</style>
