<template>
  <div :class="bemm()">
    <label v-if="label" :class="bemm('label')">
      {{ label }}
      <span v-if="required" :class="bemm('required')">*</span>
    </label>

    <div :class="bemm('container', { error: !!error, disabled, readonly })">
      <!-- Toolbar -->
      <div v-if="editor && !readonly" :class="bemm('toolbar')">
        <!-- Text Formatting -->
        <div :class="bemm('toolbar-group')">
          <button
            v-if="hasFeature('bold')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('bold') })"
            @click="editor.chain().focus().toggleBold().run()"
            :disabled="!editor.can().chain().focus().toggleBold().run()"
            :title="t('richtext.bold')"
          >
            <TIcon :name="Icons.TEXT_BOLD" size="small" />
          </button>

          <button
            v-if="hasFeature('italic')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('italic') })"
            @click="editor.chain().focus().toggleItalic().run()"
            :disabled="!editor.can().chain().focus().toggleItalic().run()"
            :title="t('richtext.italic')"
          >
            <TIcon :name="Icons.TEXT_ITALIC" size="small" />
          </button>

          <button
            v-if="hasFeature('underline')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('underline') })"
            @click="editor.chain().focus().toggleUnderline().run()"
            :disabled="!editor.can().chain().focus().toggleUnderline().run()"
            :title="t('richtext.underline')"
          >
            <TIcon :name="Icons.TEXT_UNDERLINE" size="small" />
          </button>

          <button
            v-if="hasFeature('strike')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('strike') })"
            @click="editor.chain().focus().toggleStrike().run()"
            :disabled="!editor.can().chain().focus().toggleStrike().run()"
            :title="t('richtext.strike')"
          >
            <TIcon :name="Icons.TEXT_LINE_THROUGH" size="small" />
          </button>

          <button
            v-if="hasFeature('code')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('code') })"
            @click="editor.chain().focus().toggleCode().run()"
            :disabled="!editor.can().chain().focus().toggleCode().run()"
            :title="t('richtext.code')"
          >
            <TIcon :name="Icons.CODE_BRACKETS" size="small" />
          </button>
        </div>

        <!-- Headings -->
        <div v-if="hasFeature('heading')" :class="bemm('toolbar-group')">
          <button
            v-for="level in [1, 2, 3]"
            :key="`h${level}`"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('heading', { level }) })"
            @click="editor.chain().focus().toggleHeading({ level }).run()"
            :title="t('richtext.heading', { level })"
          >
            H{{ level }}
          </button>
        </div>

        <!-- Lists -->
        <div :class="bemm('toolbar-group')">
          <button
            v-if="hasFeature('bulletList')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('bulletList') })"
            @click="editor.chain().focus().toggleBulletList().run()"
            :title="t('richtext.bulletList')"
          >
            <TIcon :name="Icons.LIST_UNORDERED" size="small" />
          </button>

          <button
            v-if="hasFeature('orderedList')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('orderedList') })"
            @click="editor.chain().focus().toggleOrderedList().run()"
            :title="t('richtext.orderedList')"
          >
            <TIcon :name="Icons.CHECK_LIST" size="small" />
          </button>

          <button
            v-if="hasFeature('blockquote')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('blockquote') })"
            @click="editor.chain().focus().toggleBlockquote().run()"
            :title="t('richtext.blockquote')"
          >
            <TIcon :name="Icons.QUOTE" size="small" />
          </button>
        </div>

        <!-- Links -->
        <div v-if="hasFeature('link')" :class="bemm('toolbar-group')">
          <button
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('link') })"
            @click="setLink"
            :title="t('richtext.link')"
          >
            <TIcon :name="Icons.LINK" size="small" />
          </button>
        </div>

        <!-- Undo/Redo -->
        <div :class="bemm('toolbar-group')">
          <button
            v-if="hasFeature('undo')"
            type="button"
            :class="bemm('toolbar-button')"
            @click="editor.chain().focus().undo().run()"
            :disabled="!editor.can().chain().focus().undo().run()"
            :title="t('richtext.undo')"
          >
            <TIcon :name="Icons.ARROW_RETURN_LEFT" size="small" />
          </button>

          <button
            v-if="hasFeature('redo')"
            type="button"
            :class="bemm('toolbar-button')"
            @click="editor.chain().focus().redo().run()"
            :disabled="!editor.can().chain().focus().redo().run()"
            :title="t('richtext.redo')"
          >
            <TIcon :name="Icons.ARROW_RETURN_RIGHT" size="small" />
          </button>
        </div>
      </div>

      <!-- Editor -->
      <div
        :class="bemm('editor')"
        :style="{
          height: height,
          maxHeight: maxHeight
        }"
      >
        <EditorContent :editor="editor" />
      </div>
    </div>

    <span v-if="error" :class="bemm('error')">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useBemm } from 'bemm'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Icons } from 'open-icon'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import { useI18n } from '@tiko/core';
import type { TRichTextEditorProps } from './TRichTextEditor.model'
import { DEFAULT_FEATURES } from './TRichTextEditor.model'
import { markdownToHtml, htmlToMarkdown, isMarkdown } from './markdown-utils'

const props = withDefaults(defineProps<TRichTextEditorProps>(), {
  modelValue: '',
  height: '300px',
  maxHeight: '500px',
  features: () => DEFAULT_FEATURES
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': []
  'blur': []
}>()

const bemm = useBemm('tiko-rich-text-editor')
const { t } = useI18n()

// Convert initial markdown content to HTML for the editor
const initialContent = computed(() => {
  if (!props.modelValue) return ''

  // Always treat content as markdown and convert to HTML for the editor
  // This ensures proper rendering of markdown content in the rich text editor
  return markdownToHtml(props.modelValue)
})

// Editor setup
const editor = useEditor({
  content: initialContent.value,
  editable: !props.disabled && !props.readonly,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Underline,
    Placeholder.configure({
      placeholder: props.placeholder || t('richtext.placeholder')
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  ],
  onUpdate: ({ editor }) => {
    // Convert HTML content to markdown when emitting
    const html = editor.getHTML()
    const markdown = htmlToMarkdown(html)
    emit('update:modelValue', markdown)
  },
  onFocus: () => {
    emit('focus')
  },
  onBlur: () => {
    emit('blur')
  }
})

// Methods
function hasFeature(feature: string): boolean {
  return props.features.includes(feature as any)
}

function setLink() {
  if (!editor.value) return

  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    editor.value
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run()
    return
  }

  // update link
  editor.value
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url })
    .run()
}

// Watchers
watch(() => props.modelValue, (value) => {
  if (editor.value) {
    // Convert current editor content to markdown to compare
    const currentHtml = editor.value.getHTML()
    const currentMarkdown = htmlToMarkdown(currentHtml)

    // Only update if the markdown content is actually different
    if (currentMarkdown.trim() !== value?.trim()) {
      // Always convert incoming content as markdown to HTML
      const htmlContent = markdownToHtml(value || '')
      editor.value.commands.setContent(htmlContent)
    }
  }
})

watch(() => props.disabled, (disabled) => {
  if (editor.value) {
    editor.value.setEditable(!disabled && !props.readonly)
  }
})

watch(() => props.readonly, (readonly) => {
  if (editor.value) {
    editor.value.setEditable(!readonly && !props.disabled)
  }
})

// Lifecycle
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style lang="scss">
.tiko-rich-text-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  user-select: all;

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__required {
    color: var(--color-error);
    margin-left: var(--space-xs);
  }

  &__container {
    display: flex;
    flex-direction: column;
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    overflow: hidden;
    transition: all 0.2s ease;

    &:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-10);
    }

    &--error {
      border-color: var(--color-error);

      &:focus-within {
        box-shadow: 0 0 0 3px var(--color-error-10);
      }
    }

    &--disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--color-background-secondary);
    }

    &--readonly {
      background: var(--color-background-secondary);
    }
  }

  &__toolbar {
    display: flex;
    gap: var(--space-xs);
    padding: var(--space-xs);
    background: color-mix(in srgb, var(--color-primary), transparent 75%);
    border-bottom: 1px solid var(--color-accent);
    flex-wrap: wrap;
  }

  &__toolbar-group {
    display: flex;
    gap: var(--space-xs);
    padding: 0 var(--space-xs);
    border-right: 1px solid var(--color-accent);

    &:last-child {
      border-right: none;
    }
  }

  &__toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: calc(var(--border-radius) / 3);
    color: var(--color-foreground);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--color-primary);
      color: var(--color-primary-text);
      border-color: var(--color-accent);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--active {
      background: var(--color-primary);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
  }

  &__editor {
    overflow-y: auto;
    padding: var(--space);
    background-color: color-mix(in srgb, var(--color-foreground), transparent 95%);

    .ProseMirror {
      min-height: 100px;
      outline: none;
      line-height: 1.6;
      font-size: 14px;

      > * + * {
        margin-top: 0.75em;
      }

      // Paragraphs
      p {
        margin: 0;
        line-height: 1.6;

        &:not(:last-child) {
          margin-bottom: 1em;
        }
      }

      // Headings
      h1, h2, h3, h4, h5, h6 {
        line-height: 1.2;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        color: var(--color-foreground);

        &:first-child {
          margin-top: 0;
        }
      }

      h1 {
        font-size: 2em;
        border-bottom: 2px solid var(--color-accent);
        padding-bottom: 0.3em;
      }
      h2 {
        font-size: 1.6em;
        border-bottom: 1px solid var(--color-accent);
        padding-bottom: 0.2em;
      }
      h3 {
        font-size: 1.3em;
      }
      h4 {
        font-size: 1.1em;
      }
      h5, h6 {
        font-size: 1em;
        color: var(--color-foreground-secondary);
      }

      // Lists
      ul, ol {
        padding-left: 1.5em;
        margin: 1em 0;

        li {
          margin: 0.25em 0;
          line-height: 1.5;

          p {
            margin: 0;
          }

          // Nested lists
          ul, ol {
            margin: 0.25em 0;
          }
        }
      }

      ul {
        list-style-type: disc;

        ul {
          list-style-type: circle;

          ul {
            list-style-type: square;
          }
        }
      }

      ol {
        list-style-type: decimal;

        ol {
          list-style-type: lower-alpha;

          ol {
            list-style-type: lower-roman;
          }
        }
      }

      // Blockquotes
      blockquote {
        padding: 0.5em var(--space);
        margin: 1.5em 0;
        border-left: 4px solid var(--color-primary-20);
        background: var(--color-background-secondary);
        color: var(--color-foreground-secondary);
        font-style: italic;
        border-radius: 0 var(--border-radius) var(--border-radius) 0;

        p:last-child {
          margin-bottom: 0;
        }
      }

      // Code
      code {
        background: var(--color-background-secondary);
        border: 1px solid var(--color-accent);
        border-radius: var(--border-radius);
        padding: 0.2em 0.4em;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.85em;
        color: var(--color-primary);
      }

      // Code blocks
      pre {
        background: var(--color-background-secondary);
        border: 1px solid var(--color-accent);
        border-radius: var(--radius-md);
        padding: var(--space);
        overflow-x: auto;
        margin: 1.5em 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.85em;
        line-height: 1.4;

        code {
          background: none;
          border: none;
          padding: 0;
          color: inherit;
        }
      }

      // Links
      a {
        color: var(--color-primary);
        text-decoration: underline;
        cursor: pointer;

        &:hover {
          color: var(--color-primary-dark);
          text-decoration-style: dotted;
        }
      }

      // Text formatting
      strong, b {
        font-weight: 600;
      }

      em, i {
        font-style: italic;
      }

      u {
        text-decoration: underline;
      }

      s, del {
        text-decoration: line-through;
        opacity: 0.8;
      }

      // Horizontal rule
      hr {
        border: none;
        border-top: 2px solid var(--color-accent);
        margin: 2em 0;
        background: none;
      }

      // Hard breaks
      br {
        line-height: 1;
      }

      // Placeholder
      .is-empty::before {
        content: attr(data-placeholder);
        float: left;
        color: var(--color-foreground-tertiary);
        pointer-events: none;
        height: 0;
        font-style: italic;
      }

      // Selection
      ::selection {
        background: var(--color-primary-20);
      }

      // Focus styles for better editing experience
      &:focus {
        outline: none;
      }
    }
  }

  &__error {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
}
</style>
