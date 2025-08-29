<template>
  <div class="test-rich-editor">
    <AdminPageHeader
      title="Rich Text Editor Demo"
      description="Testing the TRichTextEditor component with TipTap"
    />

    <div class="test-rich-editor__container">
      <TCard class="test-rich-editor__demo">
        <template #header>
          <h3>Rich Text Editor</h3>
        </template>

        <TRichTextEditor
          v-model="content"
          label="Content Editor"
          placeholder="Start typing your content..."
          :height="editorHeight"
          :features="selectedFeatures"
        />

        <div class="test-rich-editor__options">
          <h4>Editor Options</h4>

          <div class="test-rich-editor__height">
            <label>Height: {{ editorHeight }}</label>
            <TInputNumber
              v-model="heightValue"
              :min="200"
              :max="600"
              :step="50"
            />
          </div>

          <div class="test-rich-editor__features">
            <h5>Features</h5>
            <label v-for="feature in allFeatures" :key="feature">
              <TInputCheckbox
                :modelValue="selectedFeatures.includes(feature)"
                @update:modelValue="toggleFeature(feature)"
              />
              {{ feature }}
            </label>
          </div>
        </div>
      </TCard>

      <TCard class="test-rich-editor__output">
        <template #header>
          <h3>Output</h3>
        </template>

        <div class="test-rich-editor__tabs">
          <button
            :class="{ active: activeTab === 'preview' }"
            @click="activeTab = 'preview'"
          >
            Preview
          </button>
          <button
            :class="{ active: activeTab === 'html' }"
            @click="activeTab = 'html'"
          >
            HTML
          </button>
          <button
            :class="{ active: activeTab === 'markdown' }"
            @click="activeTab = 'markdown'"
          >
            Markdown
          </button>
        </div>

        <div class="test-rich-editor__content">
          <!-- Preview -->
          <div v-if="activeTab === 'preview'" class="test-rich-editor__preview">
            <TMarkdownRenderer :content="markdownContent" />
          </div>

          <!-- HTML -->
          <pre v-else-if="activeTab === 'html'" class="test-rich-editor__code">{{ content }}</pre>

          <!-- Markdown -->
          <div v-else-if="activeTab === 'markdown'" class="test-rich-editor__markdown">
            <pre>{{ markdownContent }}</pre>
          </div>
        </div>
      </TCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TRichTextEditor, TCard, TInputCheckbox, TInputNumber, TMarkdownRenderer } from '@tiko/ui'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

// Rich editor content
const content = ref(`<h1>Welcome to the Rich Text Editor</h1>
<p>This is a <strong>powerful</strong> and <em>flexible</em> editor built with TipTap.</p>
<h2>Features</h2>
<ul>
<li>Rich text formatting</li>
<li>Headings support</li>
<li>Lists (ordered and unordered)</li>
<li>Links</li>
<li>Code blocks</li>
</ul>
<blockquote>
<p>This is a blockquote. Great for highlighting important information!</p>
</blockquote>`)

// Editor configuration
const heightValue = ref(400)
const editorHeight = computed(() => `${heightValue.value}px`)

const allFeatures = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'h1',
  'h2',
  'h3',
  'bulletList',
  'orderedList',
  'blockquote',
  'link',
  'undo',
  'redo'
]

const selectedFeatures = ref([...allFeatures])

function toggleFeature(feature: string) {
  const index = selectedFeatures.value.indexOf(feature)
  if (index > -1) {
    selectedFeatures.value.splice(index, 1)
  } else {
    selectedFeatures.value.push(feature)
  }
}

// Output tabs
const activeTab = ref<'preview' | 'html' | 'markdown'>('preview')

// Convert HTML to basic markdown for preview
const markdownContent = computed(() => {
  let md = content.value

  // Headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')

  // Formatting
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
  md = md.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
  md = md.replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
  md = md.replace(/<ul[^>]*>|<\/ul>/g, '')
  md = md.replace(/<ol[^>]*>|<\/ol>/g, '')

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, (match, p1) => {
    return p1.trim().split('\n').map((line: string) => `> ${line}`).join('\n')
  })

  // Paragraphs and breaks
  md = md.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
  md = md.replace(/<br[^>]*>/g, '\n')

  // Clean up
  md = md.replace(/\n{3,}/g, '\n\n')

  return md.trim()
})
</script>

<style lang="scss">
.test-rich-editor {
  &__container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
    margin-top: var(--space-lg);
  }

  &__demo,
  &__output {
    height: fit-content;
  }

  &__options {
    margin-top: var(--space-lg);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--color-accent);

    h4 {
      margin: 0 0 var(--space);
    }

    h5 {
      margin: var(--space) 0 var(--space-s);
    }
  }

  &__height {
    margin-bottom: var(--space);
  }

  &__features {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);

    label {
      display: flex;
      align-items: center;
      gap: var(--space-s);
      cursor: pointer;
    }
  }

  &__tabs {
    display: flex;
    gap: var(--space-xs);
    margin-bottom: var(--space);
    border-bottom: 1px solid var(--color-accent);

    button {
      padding: var(--space-s) var(--space);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--color-foreground-secondary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: var(--color-foreground);
      }

      &.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
    }
  }

  &__preview {
    min-height: 200px;
  }

  &__code,
  &__markdown pre {
    background: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--radius);
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: monospace;
    font-size: 0.9em;
  }
}
</style>
