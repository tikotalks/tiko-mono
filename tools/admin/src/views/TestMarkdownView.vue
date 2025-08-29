<template>
  <div class="markdown-test-view">
    <AdminPageHeader
      title="Markdown Renderer Test"
      description="Testing the enhanced TMarkdownRenderer component with Markdown-it"
    />

    <div class="markdown-test-view__container">
      <div class="markdown-test-view__controls">
        <h3>Options</h3>
        <label>
          <TInputCheckbox v-model="options.sanitize" />
          Sanitize HTML
        </label>
        <label>
          <TInputCheckbox v-model="options.html" />
          Allow HTML
        </label>
        <label>
          <TInputCheckbox v-model="options.breaks" />
          Convert line breaks
        </label>
        <label>
          <TInputCheckbox v-model="options.linkify" />
          Auto-link URLs
        </label>
        <label>
          <TInputCheckbox v-model="options.typographer" />
          Smart typography
        </label>
      </div>

      <div class="markdown-test-view__content">
        <div class="markdown-test-view__editor">
          <h3>Markdown Input</h3>
          <TInputTextArea
            v-model="markdownContent"
            :rows="20"
            placeholder="Enter markdown content..."
          />
        </div>

        <div class="markdown-test-view__preview">
          <h3>Rendered Output</h3>
          <TCard>
            <TMarkdownRenderer
              :content="markdownContent"
              :sanitize="options.sanitize"
              :html="options.html"
              :breaks="options.breaks"
              :linkify="options.linkify"
              :typographer="options.typographer"
            />
          </TCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TMarkdownRenderer, TCard, TInputTextArea, TInputCheckbox } from '@tiko/ui'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const markdownContent = ref(`# Enhanced Markdown Renderer Test

This is a test of the new **Markdown-it** powered TMarkdownRenderer component.

## Features

### Basic Formatting
- **Bold text**
- *Italic text*
- ***Bold and italic***
- ~~Strikethrough~~
- ==Highlighted text==

### Emojis :rocket:
The component now supports emojis! :smile: :heart: :thumbsup:

### Links
- [Internal Link](/about)
- [External Link](https://example.com)
- Auto-linked: https://google.com

### Code
Inline code: \`const message = "Hello World"\`

\`\`\`javascript
// Code block
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Headers | ✅ | Auto-anchors |
| Tables | ✅ | Striped rows |
| Emojis | ✅ | Full support |
| Footnotes | ✅ | See below[^1] |

### Blockquotes

> This is a blockquote with enhanced styling.

### Footnotes

This text has a footnote[^1].

[^1]: This is the footnote content.

---

That's all folks!`)

const options = ref({
  sanitize: true,
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
})
</script>

<style lang="scss">
.markdown-test-view {
  &__container {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--space-lg);
    margin-top: var(--space-lg);
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: var(--space);

    label {
      display: flex;
      align-items: center;
      gap: var(--space-s);
      cursor: pointer;
    }
  }

  &__content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
  }

  &__editor,
  &__preview {
    display: flex;
    flex-direction: column;
    gap: var(--space);

    h3 {
      margin: 0;
    }
  }
}
</style>
