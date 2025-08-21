<template>
  <component
    :is="fieldComponent"
    :modelValue="modelValue"
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

} from '@tiko/ui'
import  { type ContentField, useI18n } from '@tiko/core'
import ItemsFieldEditor from './ItemsFieldEditor.vue'
import ListFieldInstance from './ListFieldInstance.vue'
import LinkedItemsFieldInstance from './LinkedItemsFieldInstance.vue'
import MediaFieldInstance from './MediaFieldInstance.vue'
import RepeaterFieldInstance from './RepeaterFieldInstance.vue'

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
  // Debug: Log all fields to see their types
  console.log(`Rendering field "${props.field.label}" with type: "${props.field.field_type}"`)

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
    case 'items':
      return ItemsFieldEditor
    case 'list':
      return ListFieldInstance
    case 'linked_items':
      return LinkedItemsFieldInstance
    case 'repeater':
      return RepeaterFieldInstance
    case 'media':
    case 'image':
      return MediaFieldInstance
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

    case 'items':
      // Pass the config directly for items field
      baseProps.config = props.field.config || { fields: [] }
      break

    case 'linked_items':
      // Pass section and field IDs for linked items
      baseProps.sectionId = props.field.section_id || ''
      baseProps.fieldId = props.field.id
      baseProps.itemTemplateId = props.field.config?.item_template_id
      break

    case 'repeater':
      // Pass the field itself for repeater to access schema from config
      baseProps.field = props.field
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
