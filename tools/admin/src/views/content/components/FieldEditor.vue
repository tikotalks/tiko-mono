<template>
  <div :class="bemm()">
      <TFormGroup>
        <TInputText
          v-model="form.label"
          :label="t('common.label')"
          :placeholder="t('common.labelPlaceholder')"
          required
          @update:model-value="generateFieldKey"
        />

        <TInputText
          v-model="form.field_key"
          :label="t('common.key')"
          :placeholder="t('common.keyPlaceholder')"
          :help="t('common.fields.keyHelp')"
          required
        />

        <TInputSelect
          v-model="form.field_type"
          :label="t('common.type')"
          :options="fieldTypeOptions"
          required
        />

        <TInputCheckbox
          v-model="form.is_required"
          :label="t('common.required')"
          :help="t('common.fields.requiredHelp')"
        />

        <TInputCheckbox
          v-model="form.is_translatable"
          :label="t('common.translatable')"
          :help="t('common.fields.translatableHelp')"
        />

        <!-- Type-specific configuration -->
        <component
          v-if="configComponent"
          :is="configComponent"
          v-model="form.config"
          :field-type="form.field_type"
        />

        <TInputText
          v-if="showDefaultValue"
          v-model="form.default_value"
          :label="t('common.defaultValue')"
          :placeholder="t('common.defaultValuePlaceholder')"
        />
      </TFormGroup>

    <div :class="bemm('actions')">
      <TButton type="ghost" @click="handleCancel">
        {{ t('common.cancel') }}
      </TButton>
      <TButton color="primary" @click="save" :disabled="!isValid">
        {{ field ? t('common.save') : t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { useBemm } from 'bemm'
import {
  TFormGroup,
  TInputSelect,
  TInputCheckbox,
  TButton,
  TInputText,
  type ToastService
} from '@tiko/ui'
import { contentService, type ContentField,
  useI18n } from '@tiko/core'
import { kebabCase } from '@sil/case'
import FieldOptionsEditor from './FieldOptionsEditor.vue'
import ItemsFieldConfig from './ItemsFieldConfig.vue'
import RepeaterFieldConfig from './RepeaterFieldConfig.vue'
import MediaFieldConfig from './MediaFieldConfig.vue'

interface Props {
  field?: ContentField | null
  templateId?: string
  templateType: 'section' | 'item'
  onSave?: () => void
  onClose?: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: []
  close: []
}>()

const bemm = useBemm('field-editor')
const { t } = useI18n()
const toastService = inject<ToastService>('toastService')

// Form state
const form = ref({
  label: '',
  field_key: '',
  field_type: 'text' as ContentField['field_type'],
  is_required: false,
  is_translatable: true,
  default_value: '',
  config: {} as any
})

// Set initial config based on field type
if (!props.field && (form.value.field_type === 'media' || form.value.field_type === 'image')) {
  form.value.config = {
    enableSourceSelection: true,
    allowedSources: ['public', 'assets', 'personal'],
    multiple: false,
    maxItems: 0
  }
}

// Field type options
const fieldTypeOptions = computed(() => {
  console.log('🔥 FieldEditor loaded! templateType:', props.templateType)

  const types = [
    { value: 'text', label: t('admin.content.field.types.text') },
    { value: 'textarea', label: t('admin.content.field.types.textarea') },
    { value: 'richtext', label: t('admin.content.field.types.richtext') },
    { value: 'number', label: t('admin.content.field.types.number') },
    { value: 'boolean', label: t('admin.content.field.types.boolean') },
    { value: 'color', label: t('admin.content.field.types.color') },
    { value: 'select', label: t('admin.content.field.types.select') },
    { value: 'media', label: t('admin.content.field.types.media') },
    { value: 'list', label: t('admin.content.field.types.list') },
    { value: 'items', label: t('admin.content.field.types.items') },
    { value: 'repeater', label: t('admin.content.field.types.repeater') }
  ]

  // Add linked_items only for sections
  if (props.templateType === 'section') {
    console.log('🎯 Adding linked_items field type for section template')
    types.push({ value: 'linked_items', label: 'Content Items Reference' })
  } else {
    console.log('❌ Not adding linked_items because templateType is not section:', props.templateType)
  }

  console.log('🚀 Final field type options:', types.map(t => t.value))
  return types
})

// Config component based on field type
const configComponent = computed(() => {
  switch (form.value.field_type) {
    case 'select':
    case 'options':
      return FieldOptionsEditor
    case 'items':
      return ItemsFieldConfig
    case 'repeater':
      return RepeaterFieldConfig
    case 'linked_items':
      return ItemsFieldConfig // Reuse for selecting item template
    case 'media':
    case 'image':
      return MediaFieldConfig
    default:
      return null
  }
})

// Show default value for certain field types
const showDefaultValue = computed(() => {
  return ['text', 'textarea', 'number', 'color'].includes(form.value.field_type)
})

// Form validation
const isValid = computed(() => {
  return form.value.label && form.value.field_key && form.value.field_type
})

// Initialize form with existing field data
if (props.field) {
  form.value = {
    label: props.field.label,
    field_key: props.field.field_key,
    field_type: props.field.field_type,
    is_required: props.field.is_required,
    is_translatable: props.field.is_translatable ?? true,
    default_value: props.field.default_value || '',
    config: props.field.config || {}
  }
}

// Watch for field type changes to set default configurations
watch(() => form.value.field_type, (newType, oldType) => {
  // Only set defaults when changing to media type from another type
  if ((newType === 'media' || newType === 'image') && oldType !== 'media' && oldType !== 'image') {
    // Set default media configuration with enableSourceSelection enabled
    form.value.config = {
      enableSourceSelection: true,
      allowedSources: ['public', 'assets', 'personal'],
      multiple: false,
      maxItems: 0
    }
  } else if (oldType === 'media' || oldType === 'image') {
    // Clear config when changing from media to another type
    form.value.config = {}
  }
})

// Auto-generate field key from label
function generateFieldKey() {
  if (!props.field && form.value.label) { // Only auto-generate for new fields
    form.value.field_key = kebabCase(form.value.label)
  }
}

// Save field
async function save() {
  if (!isValid.value) return

  try {
    const fieldData = {
      ...form.value,
      [props.templateType === 'section' ? 'section_template_id' : 'item_template_id']: props.templateId,
      order_index: 999 // Will be reordered by drag-drop
    }

    if (props.field) {
      // Update existing field
      await contentService.updateField(props.field.id, fieldData)
      toastService?.show({
        message: t('messages.success.fieldUpdated'),
        type: 'success'
      })
    } else {
      // Create new field
      await contentService.createField(fieldData as Omit<ContentField, 'id'>)
      toastService?.show({
        message: t('messages.success.fieldCreated'),
        type: 'success'
      })
    }

    // Call callback props if provided (for popup service)
    props.onSave?.()
    props.onClose?.()

    // Also emit events for backward compatibility
    emit('save')
    emit('close')
  } catch (error) {
    console.error('Failed to save field:', error)
    toastService?.show({
      message: t('messages.error.fieldSave'),
      type: 'error'
    })
  }
}

function handleCancel() {
  // Call callback props if provided (for popup service)
  props.onClose?.()

  // Also emit events for backward compatibility
  emit('close')
}
</script>

<style lang="scss">
.field-editor {
  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space-lg);
  }
}
</style>
