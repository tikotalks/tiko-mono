<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <label :class="bemm('label')">{{ t('admin.content.field.options', 'Options') }}</label>
      <TButton
        type="ghost"
        size="small"
        :icon="Icons.CIRCLED_INFO"
        @click="showHelp = !showHelp"
      >
        {{ t('common.help') }}
      </TButton>
    </div>

    <div v-if="showHelp" :class="bemm('help')">
      <p>{{ t('admin.content.field.optionsHelp', 'Enter options, one per line.') }}</p>
      <p>{{ t('admin.content.field.optionsHelpFormat', 'For key-value pairs, use format: key:Label') }}</p>
      <p>{{ t('admin.content.field.optionsHelpExample', 'Example:') }}</p>
      <pre :class="bemm('example')">{{ exampleText }}</pre>
    </div>

    <TTextArea
      v-model="optionsText"
      :rows="8"
      :placeholder="'Enter options...\nOne per line\nOr use key:value format'"
      @input="parseOptions"
      @blur="parseOptions"
    />

    <div v-if="parsedOptions.length > 0" :class="bemm('preview')">
      <h4 :class="bemm('preview-title')">{{ t('admin.content.field.preview', 'Preview') }}</h4>
      <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
        Parsed {{ parsedOptions.length }} options: {{ JSON.stringify(parsedOptions) }}
      </div>
      <TInputSelect
        :options="selectOptions"
        :placeholder="t('admin.content.field.selectPreview', 'Preview of select field')"
        disabled
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from "@tiko/core";
import { TButton, TTextArea, TInputSelect } from '@tiko/ui'
import { Icons } from 'open-icon'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const bemm = useBemm('field-options-editor')
const { t } = useI18n()

const showHelp = ref(false)
const optionsText = ref('')
const parsedOptions = ref<Array<string | { key: string; value: string }>>([])

const exampleText = `Option 1
Option 2
Option 3

or

small:Small Size
medium:Medium Size
large:Large Size`

// Convert parsed options to select field format
const selectOptions = computed(() => {
  return parsedOptions.value.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return { value: opt.key, label: opt.value }
  })
})

// Parse the text input into options
function parseOptions() {
  const lines = optionsText.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  parsedOptions.value = lines.map(line => {
    // Check if it's a key:value format
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim() // Handle colons in the value part
      if (key && value) {
        return { key: key.trim(), value }
      }
    }
    // Otherwise, it's a simple option
    return line
  })

  const configToEmit = { options: parsedOptions.value }
  console.log('[FieldOptionsEditor] Parsing options and emitting:', configToEmit)
  console.log('[FieldOptionsEditor] Parsed options array:', parsedOptions.value)

  // Emit the parsed options
  emit('update:modelValue', configToEmit)
}

// Initialize from modelValue
onMounted(() => {
  if (props.modelValue?.options) {
    const options = props.modelValue.options

    // Convert options back to text format
    const lines = options.map((opt: any) => {
      if (typeof opt === 'string') {
        return opt
      }
      return `${opt.key}:${opt.value}`
    })

    optionsText.value = lines.join('\n')
    parsedOptions.value = options
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue?.options && JSON.stringify(newValue.options) !== JSON.stringify(parsedOptions.value)) {
    const options = newValue.options
    const lines = options.map((opt: any) => {
      if (typeof opt === 'string') {
        return opt
      }
      return `${opt.key}:${opt.value}`
    })
    optionsText.value = lines.join('\n')
    parsedOptions.value = options
  }
})
</script>

<style lang="scss" scoped>
.field-options-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__help {
    background-color: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);

    p {
      margin: 0;
      margin-bottom: var(--space-xs);
      font-size: 0.9em;
      color: var(--color-foreground-secondary);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  &__example {
    background-color: var(--color-background);
    padding: var(--space-s);
    border-radius: var(--border-radius);
    font-size: 0.85em;
    color: var(--color-foreground-secondary);
    margin: var(--space-s) 0 0 0;
  }

  &__preview {
    background-color: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);
  }

  &__preview-title {
    margin: 0 0 var(--space-s) 0;
    font-size: 0.9em;
    font-weight: 500;
    color: var(--color-foreground-secondary);
  }
}
</style>
