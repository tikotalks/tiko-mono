<template>
  <div :class="bemm()">
    <label :class="bemm('label')">{{ label }}</label>
    <p v-if="helpText" :class="bemm('help')">{{ helpText }}</p>
    
    <TTextArea
      v-model="modelValue"
      :placeholder="placeholder"
      :rows="8"
      :required="required"
      @update:model-value="emit('update:modelValue', $event)"
    />
    
    <div :class="bemm('preview')" v-if="parsedItems.length > 0">
      <div :class="bemm('preview-header')">
        <span>{{ t('admin.content.field.listPreview', 'Preview') }} ({{ parsedItems.length }} items)</span>
      </div>
      <div :class="bemm('preview-items')">
        <div 
          v-for="(item, index) in previewItems" 
          :key="index"
          :class="bemm('preview-item')"
        >
          <span v-if="typeof item === 'string'" :class="bemm('preview-text')">
            {{ item }}
          </span>
          <div v-else :class="bemm('preview-keyvalue')">
            <span :class="bemm('preview-key')">{{ item.key }}</span>
            <span :class="bemm('preview-separator')">:</span>
            <span :class="bemm('preview-value')">{{ item.value }}</span>
          </div>
        </div>
        <div v-if="parsedItems.length > maxPreviewItems" :class="bemm('preview-more')">
          {{ t('admin.content.field.andMore', '... and {count} more', { count: parsedItems.length - maxPreviewItems }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { TTextArea, useI18n } from '@tiko/ui'
import { processListFieldValue } from '@tiko/core'

interface Props {
  modelValue: string | null
  label: string
  required?: boolean
  helpText?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  helpText: ''
})
const emit = defineEmits<Emits>()

const bemm = useBemm('list-field-instance')
const { t } = useI18n()

const maxPreviewItems = 10

const placeholder = computed(() => {
  return t('admin.content.field.listPlaceholder', `Enter list items, one per line:

Simple strings:
Apple
Banana
Orange

Or key-value pairs:
en : 🇬🇧
fr : 🇫🇷
de : 🇩🇪`)
})

// Parse the text input into structured data for preview using the same utility as frontend
const parsedItems = computed(() => {
  if (!props.modelValue?.trim()) return []
  return processListFieldValue(props.modelValue)
})

// Items to show in preview (limited)
const previewItems = computed(() => {
  return parsedItems.value.slice(0, maxPreviewItems)
})
</script>

<style lang="scss">
.list-field-instance {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__help {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    margin: 0;
    line-height: 1.4;
  }

  &__preview {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__preview-header {
    padding: var(--space-s) var(--space);
    background: var(--color-background-tertiary);
    border-bottom: 1px solid var(--color-border);
    font-weight: 500;
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__preview-items {
    padding: var(--space-s);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    max-height: 200px;
    overflow-y: auto;
  }

  &__preview-item {
    display: flex;
    align-items: center;
    padding: var(--space-xs);
    background: var(--color-background);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
  }

  &__preview-text {
    color: var(--color-foreground);
  }

  &__preview-keyvalue {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
  }

  &__preview-key {
    color: var(--color-primary);
    font-weight: 500;
    min-width: 0;
    flex-shrink: 0;
  }

  &__preview-separator {
    color: var(--color-foreground-secondary);
    flex-shrink: 0;
  }

  &__preview-value {
    color: var(--color-foreground);
    min-width: 0;
    word-break: break-word;
  }

  &__preview-more {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-secondary);
    font-style: italic;
    text-align: center;
    padding: var(--space-xs);
  }

  &__error {
    color: var(--color-error);
    padding: var(--space-s);
    background-color: var(--color-error-background);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);

    p {
      margin: 0;
    }
  }
}
</style>