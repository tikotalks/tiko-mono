<template>
  <component
    :is="fieldComponent"
    v-model="modelValue"
    :label="field.label"
    :placeholder="getPlaceholder"
    :required="field.is_required"
    :error="error"
    v-bind="fieldProps"
    @update:modelValue="handleUpdate"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  TInputText, 
  TTextArea, 
  TInputNumber, 
  TInputCheckbox, 
  TInputSelect,
  useI18n 
} from '@tiko/ui'
import type { ContentField } from '@tiko/core'

interface Props {
  field: ContentField
  modelValue: any
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// Determine which component to use based on field type
const fieldComponent = computed(() => {
  switch (props.field.field_type) {
    case 'text':
      return TInputText
    case 'textarea':
      return TTextArea
    case 'richtext':
      return TTextArea // TODO: Replace with rich text editor
    case 'number':
      return TInputNumber
    case 'boolean':
      return TInputCheckbox
    case 'select':
    case 'options':
      return TInputSelect
    default:
      return TInputText
  }
})

// Get field-specific props
const fieldProps = computed(() => {
  const baseProps: any = {}
  
  switch (props.field.field_type) {
    case 'textarea':
    case 'richtext':
      baseProps.rows = 4
      break
      
    case 'select':
    case 'options':
      // Convert options from config
      if (props.field.config?.options) {
        baseProps.options = props.field.config.options.map((opt: any) => {
          if (typeof opt === 'string') {
            return { value: opt, label: opt }
          }
          return { value: opt.key, label: opt.value }
        })
      }
      break
  }
  
  return baseProps
})

const getPlaceholder = computed(() => {
  if (props.field.field_type === 'options' || props.field.field_type === 'select') {
    return t('common.selectOption', 'Select an option')
  }
  return t('common.enterValue', { field: props.field.label })
})

function handleUpdate(value: any) {
  emit('update:modelValue', value)
}
</script>