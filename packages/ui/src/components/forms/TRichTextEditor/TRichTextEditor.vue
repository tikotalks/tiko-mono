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
            <TIcon :name="Icons.BOLD" size="small" />
          </button>

          <button
            v-if="hasFeature('italic')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('italic') })"
            @click="editor.chain().focus().toggleItalic().run()"
            :disabled="!editor.can().chain().focus().toggleItalic().run()"
            :title="t('richtext.italic')"
          >
            <TIcon :name="Icons.ITALIC" size="small" />
          </button>

          <button
            v-if="hasFeature('underline')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('underline') })"
            @click="editor.chain().focus().toggleUnderline().run()"
            :disabled="!editor.can().chain().focus().toggleUnderline().run()"
            :title="t('richtext.underline')"
          >
            <TIcon :name="Icons.UNDERLINE" size="small" />
          </button>

          <button
            v-if="hasFeature('strike')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('strike') })"
            @click="editor.chain().focus().toggleStrike().run()"
            :disabled="!editor.can().chain().focus().toggleStrike().run()"
            :title="t('richtext.strike')"
          >
            <TIcon :name="Icons.STRIKETHROUGH" size="small" />
          </button>

          <button
            v-if="hasFeature('code')"
            type="button"
            :class="bemm('toolbar-button', { active: editor.isActive('code') })"
            @click="editor.chain().focus().toggleCode().run()"
            :disabled="!editor.can().chain().focus().toggleCode().run()"
            :title="t('richtext.code')"
          >
            <TIcon :name="Icons.CODE" size="small" />
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
            <TIcon :name="Icons.LIST_ORDERED" size="small" />
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
            <TIcon :name="Icons.UNDO" size="small" />
          </button>

          <button
            v-if="hasFeature('redo')"
            type="button"
            :class="bemm('toolbar-button')"
            @click="editor.chain().focus().redo().run()"
            :disabled="!editor.can().chain().focus().redo().run()"
            :title="t('richtext.redo')"
          >
            <TIcon :name="Icons.REDO" size="small" />
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
import { useI18n } from '../../../composables/useI18n'
import type { TRichTextEditorProps } from './TRichTextEditor.model'
import { DEFAULT_FEATURES } from './TRichTextEditor.model'

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

// Editor setup
const editor = useEditor({
  content: props.modelValue,
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
    emit('update:modelValue', editor.getHTML())
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
  if (editor.value && editor.value.getHTML() !== value) {
    editor.value.commands.setContent(value)
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

  &__label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__required {
    color: var(--color-error);
    margin-left: var(--space-2xs);
  }

  &__container {
    display: flex;
    flex-direction: column;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
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
    background: var(--color-background-secondary);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }

  &__toolbar-group {
    display: flex;
    gap: var(--space-2xs);
    padding: 0 var(--space-xs);
    border-right: 1px solid var(--color-border);

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
    border-radius: var(--radius-sm);
    color: var(--color-foreground);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--color-background);
      border-color: var(--color-border);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--active {
      background: var(--color-primary-10);
      color: var(--color-primary);
      border-color: var(--color-primary-20);
    }
  }

  &__editor {
    overflow-y: auto;
    padding: var(--space);

    .ProseMirror {
      min-height: 100px;
      outline: none;

      > * + * {
        margin-top: 0.75em;
      }

      p {
        margin: 0;
      }

      h1, h2, h3 {
        line-height: 1.1;
        margin-top: 1em;
        margin-bottom: 0.5em;
      }

      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }

      ul, ol {
        padding-left: var(--space-lg);
      }

      blockquote {
        padding-left: var(--space);
        border-left: 3px solid var(--color-border);
        color: var(--color-foreground-secondary);
        font-style: italic;
      }

      code {
        background: var(--color-background-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 0.1em 0.3em;
        font-family: var(--font-mono);
        font-size: 0.9em;
      }

      pre {
        background: var(--color-background-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space);
        overflow-x: auto;

        code {
          background: none;
          border: none;
          padding: 0;
        }
      }

      a {
        color: var(--color-primary);
        text-decoration: underline;
        cursor: pointer;

        &:hover {
          color: var(--color-primary-dark);
        }
      }

      hr {
        border: none;
        border-top: 1px solid var(--color-border);
        margin: var(--space-lg) 0;
      }

      .is-empty::before {
        content: attr(data-placeholder);
        float: left;
        color: var(--color-foreground-tertiary);
        pointer-events: none;
        height: 0;
      }
    }
  }

  &__error {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
}
</style>