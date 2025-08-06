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
          :help="t('admin.content.fields.keyHelp', 'Auto-generated from label. Can be customized if needed.')"
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
          :help="t('admin.content.fields.requiredHelp')"
        />

        <TInputCheckbox
          v-model="form.is_translatable"
          :label="t('common.translatable')"
          :help="t('admin.content.fields.translatableHelp')"
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
      <TButton type="ghost" @click="$emit('close')">
        {{ t('common.cancel') }}
      </TButton>
      <TButton color="primary" @click="save" :disabled="!isValid">
        {{ field ? t('common.save') : t('common.create') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useBemm } from 'bemm'
import {
  TFormGroup,
  TInputSelect,
  TInputCheckbox,
  TButton,
  useI18n,
  type ToastService,
  TInputText
} from '@tiko/ui'
import { contentService, type ContentField } from '@tiko/core'
import { kebabCase } from '@sil/case'
import FieldOptionsEditor from './FieldOptionsEditor.vue'
import ItemsFieldConfig from './ItemsFieldConfig.vue'

interface Props {
  field?: ContentField | null
  templateId?: string
  templateType: 'section' | 'item'
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
  field_type: 'text',
  is_required: false,
  is_translatable: true,
  default_value: '',
  config: {} as any
})

// Field type options
const fieldTypeOptions = computed(() => {
  console.log('🔥 FieldEditor loaded! templateType:', props.templateType)

  const types = [
    { value: 'text', label: t('admin.content.fields.types.text') },
    { value: 'textarea', label: t('admin.content.fields.types.textarea') },
    { value: 'richtext', label: t('admin.content.fields.types.richtext') },
    { value: 'number', label: t('admin.content.fields.types.number') },
    { value: 'boolean', label: t('admin.content.fields.types.boolean') },
    { value: 'select', label: t('admin.content.fields.types.select') },
    { value: 'media', label: t('admin.content.fields.types.media') },
    { value: 'list', label: t('admin.content.fields.types.list') },
    { value: 'items', label: t('admin.content.fields.types.items') }
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
    case 'linked_items':
      return ItemsFieldConfig // Reuse for selecting item template
    default:
      return null
  }
})

// Show default value for certain field types
const showDefaultValue = computed(() => {
  return ['text', 'textarea', 'number'].includes(form.value.field_type)
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
        message: t('admin.content.fields.updateSuccess'),
        type: 'success'
      })
    } else {
      // Create new field
      await contentService.createField(fieldData as Omit<ContentField, 'id'>)
      toastService?.show({
        message: t('admin.content.fields.createSuccess'),
        type: 'success'
      })
    }

    emit('save')
    emit('close')
  } catch (error) {
    console.error('Failed to save field:', error)
    toastService?.show({
      message: t('admin.content.fields.saveError'),
      type: 'error'
    })
  }
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
