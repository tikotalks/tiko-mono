<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="formData.name"
          :inline="true"
          :label="t('common.name')"
          :placeholder="t('admin.content.sections.namePlaceholder')"
          :required="true"
          :error="errors.name"
        />

        <TInputText
          v-model="formData.slug"
          :inline="true"
          :label="t('common.slug')"
          :placeholder="t('admin.content.sections.slugPlaceholder')"
          :required="true"
          :error="errors.slug"
          @input="handleSlugInput"
        />

        <TTextArea
          v-model="formData.description"
          :inline="true"
          :label="t('common.description')"
          :placeholder="t('admin.content.sections.descriptionPlaceholder')"
          :rows="3"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputSelect
          :inline="true"
          v-model="formData.component_type"
          :label="t('admin.content.sections.componentType')"
          :options="componentTypeOptions"
          :required="true"
          :error="errors.component_type"
        />

        <TInputSelect
          :inline="true"
          v-model="formData.language_code"
          :label="t('admin.content.sections.language')"
          :options="languageOptions"
          :placeholder="t('admin.content.sections.languagePlaceholder')"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputCheckbox
          v-model="formData.is_reusable"
          :label="t('admin.content.sections.isReusable')"
          :hint="t('common.reusableHint')"
        />

        <TInputCheckbox
          v-model="formData.is_active"
          :label="t('common.active')"
        />
      </TFormGroup>

      <div :class="bemm('fields-section')" v-if="formData.slug">
        <h3>{{ t('common.fields') }}</h3>
        <p :class="bemm('help-text')">{{ t('common.fieldsHelp') }}</p>

        <div :class="bemm('fields-list')">
          <TCard
            v-for="(field, index) in formData.fields"
            :key="field.id"
            :class="bemm('field-item')"
            :title="field.label || field.field_key || t('admin.content.sections.newField')"
            @remove="removeField(index)"
            :removable="true"
          >
            <TFormGroup>
              <TInputText
          :inline="true"
                v-model="field.label"
                :label="t('admin.content.sections.fieldLabel')"
                :placeholder="t('admin.content.sections.fieldLabelPlaceholder')"
                :required="true"
                @update:model-value="() => onFieldLabelChange(field, index)"
              />

              <TInputText
          :inline="true"
                v-model="field.field_key"
                :label="t('admin.content.sections.fieldKey')"
                :placeholder="t('admin.content.sections.fieldKeyPlaceholder')"
                :help="t('admin.content.sections.fieldKeyHelp', 'Auto-generated from label. Can be customized if needed.')"
                :required="true"
                @input="() => validateFieldKey(field, index)"
              />
              <TInputSelect
          :inline="true"
                v-model="field.field_type"
                :label="t('admin.content.sections.fieldType')"
                :options="fieldTypeOptions"
                :required="true"
                @update:modelValue="() => handleFieldTypeChange(field)"
              />

              <div :class="bemm('field-options')">
                <TInputCheckbox
                  v-model="field.is_required"
                  :label="t('common.required')"
                />

                <TInputCheckbox
                  v-model="field.is_translatable"
                  :label="t('admin.content.sections.translatable')"
                />
              </div>
            </TFormGroup>

            <div v-if="field.field_type === 'select'" :class="bemm('field-config')">
              <TTextArea
                v-model="field.select_options"
                :label="t('admin.content.sections.selectOptions')"
                :placeholder="t('admin.content.sections.selectOptionsPlaceholder')"
                :rows="3"
              />
            </div>

            <div v-if="field.field_type === 'options'" :class="bemm('field-config')">
              <FieldOptionsEditor
                v-model="field.config"
                @update:modelValue="(value) => handleFieldConfigUpdate(index, value)"
              />
            </div>

            <div v-if="field.field_type === 'items'" :class="bemm('field-config')">
              <ItemsFieldEditor
                v-model="field.config"
              />
            </div>
          </TCard>

          <TButton
            type="outline"
            :icon="Icons.ADD"
            @click="addField"
            :class="bemm('add-field-button')"
          >
            {{ t('admin.content.sections.addField') }}
          </TButton>
        </div>
      </div>
    </div>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="handleClose">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleSave"
        :status="saving ? 'loading' : 'idle'"
        :disabled="!isValid"
      >
        {{ t('common.save') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TInputText,
  TTextArea,
  TFormGroup,
  TInputCheckbox,
  TInputSelect,
  TCard
} from '@tiko/ui'
import {
  useI18n } from "@tiko/core";
import { Icons } from 'open-icon'
import { kebabCase } from '@sil/case'
import { contentService, translationService } from '@tiko/core'
import type { SectionTemplate, ContentField, Language } from '@tiko/core'
import FieldOptionsEditor from './FieldOptionsEditor.vue'
import ItemsFieldEditor from './ItemsFieldEditor.vue'

interface Props {
  section?: SectionTemplate
  mode?: 'create' | 'edit'
  onSave?: (data: Partial<SectionTemplate> & { fields?: ContentField[] }) => Promise<void>
}

interface FieldForm extends Partial<ContentField> {
  id: string
  select_options?: string
  config?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('create-section-dialog')
const { t } = useI18n()

// State
const languages = ref<Language[]>([])
const formData = reactive({
  name: props.section?.name || '',
  slug: props.section?.slug || '',
  description: props.section?.description || '',
  component_type: props.section?.component_type || 'text',
  language_code: props.section?.language_code || 'global',
  is_reusable: props.section?.is_reusable ?? true,
  is_active: props.section?.is_active ?? true,
  fields: [] as FieldForm[]
})
const errors = reactive({
  name: '',
  slug: '',
  component_type: ''
})
const saving = ref(false)

// Component type options
const componentTypeOptions = [
  { value: 'hero', label: t('admin.content.sections.types.hero') },
  { value: 'text', label: t('admin.content.sections.types.text') },
  { value: 'media', label: t('admin.content.sections.types.media') },
  { value: 'gallery', label: t('admin.content.sections.types.gallery') },
  { value: 'cards', label: t('admin.content.sections.types.cards') },
  { value: 'testimonials', label: t('admin.content.sections.types.testimonials') },
  { value: 'features', label: t('admin.content.sections.types.features') },
  { value: 'cta', label: t('admin.content.sections.types.cta') },
  { value: 'faq', label: t('admin.content.sections.types.faq') },
  { value: 'custom', label: t('admin.content.sections.types.custom') }
]

// Field type options
const fieldTypeOptions = [
  { value: 'text', label: t('admin.content.sections.fieldTypes.text') },
  { value: 'textarea', label: t('admin.content.sections.fieldTypes.textarea') },
  { value: 'richtext', label: t('admin.content.sections.fieldTypes.richtext') },
  { value: 'number', label: t('admin.content.sections.fieldTypes.number') },
  { value: 'boolean', label: t('admin.content.sections.fieldTypes.boolean') },
  { value: 'select', label: t('admin.content.sections.fieldTypes.select') },
  { value: 'options', label: t('admin.content.sections.fieldTypes.options', 'Options') },
  { value: 'items', label: t('admin.content.sections.fieldTypes.items', 'Items (Repeater)') },
  { value: 'media', label: t('admin.content.sections.fieldTypes.media') },
  { value: 'media_list', label: t('admin.content.sections.fieldTypes.mediaList') },
  { value: 'list', label: t('admin.content.sections.fieldTypes.list') },
  { value: 'object', label: t('admin.content.sections.fieldTypes.object') }
]

// Computed
const languageOptions = computed(() => {
  const options = [
    { value: 'global', label: t('common.global') }
  ]

  languages.value.forEach(lang => {
    options.push({
      value: lang.code,
      label: `${lang.name} (${lang.code})`
    })
  })

  return options
})

const isValid = computed(() => {
  return formData.name.trim() !== '' &&
         formData.slug.trim() !== '' &&
         formData.component_type !== '' &&
         !Object.values(errors).some(error => error !== '') &&
         formData.fields.every(field => field.field_key && field.label && field.field_type)
})

// Methods
async function loadLanguages() {
  try {
    languages.value = await translationService.getActiveLanguages()
  } catch (error) {
    console.error('Failed to load languages:', error)
  }
}

function handleSlugInput() {
  // Auto-generate slug from name if in create mode
  if (props.mode === 'create' && !formData.slug) {
    formData.slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(formData.slug)) {
    errors.slug = t('admin.content.sections.slugError')
  } else {
    errors.slug = ''
  }
}

function addField() {
  formData.fields.push({
    id: `field_${Date.now()}`,
    field_key: '',
    label: '',
    field_type: 'text',
    is_required: false,
    is_translatable: true,
    order_index: formData.fields.length,
    config: {}
  })
}

function removeField(index: number) {
  formData.fields.splice(index, 1)
  // Update order indices
  formData.fields.forEach((field, i) => {
    field.order_index = i
  })
}

function onFieldLabelChange(field: FieldForm, index: number) {
  // Auto-generate field key if it's empty or was previously auto-generated
  if (!field.field_key || field.field_key === kebabCase(field.label || '').replace(/-/g, '_')) {
    field.field_key = kebabCase(field.label || '').replace(/-/g, '_')
  }
}

function validateFieldKey(field: FieldForm, index: number) {
  // Ensure field key is valid identifier
  if (field.field_key) {
    // Allow lowercase letters, numbers, and underscores
    field.field_key = field.field_key
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') // Keep only lowercase letters, numbers, and underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
  }
}

function handleFieldConfigUpdate(index: number, value: any) {
  console.log('[CreateSectionDialog] Field config updated for index', index, ':', value)
  console.log('[CreateSectionDialog] Value type:', typeof value)
  console.log('[CreateSectionDialog] Value keys:', Object.keys(value || {}))
  console.log('[CreateSectionDialog] Value.options:', value?.options)
  console.log('[CreateSectionDialog] Before assignment - current config:', formData.fields[index].config)

  formData.fields[index].config = value

  console.log('[CreateSectionDialog] After assignment - new config:', formData.fields[index].config)
  console.log('[CreateSectionDialog] Config type:', typeof formData.fields[index].config)
  console.log('[CreateSectionDialog] Config keys:', Object.keys(formData.fields[index].config || {}))
}

function handleFieldTypeChange(field: FieldForm) {
  // Initialize config when field type changes to options or items
  if ((field.field_type === 'options' || field.field_type === 'items') && !field.config) {
    field.config = {}
  }
  console.log('[CreateSectionDialog] Field type changed to:', field.field_type, 'config:', field.config)
}

function handleClose() {
  emit('close')
}

async function handleSave() {
  // Validate
  if (!formData.name.trim()) {
    errors.name = t('validation.required')
    return
  }

  if (!formData.slug.trim()) {
    errors.slug = t('validation.required')
    return
  }

  if (!formData.component_type) {
    errors.component_type = t('validation.required')
    return
  }

  if (!isValid.value) return

  saving.value = true

  try {
    // Process fields
    const processedFields = formData.fields.map(field => {
      const processed: any = {
        field_key: field.field_key,
        label: field.label,
        field_type: field.field_type,
        is_required: field.is_required,
        is_translatable: field.is_translatable,
        order_index: field.order_index
      }

      // Handle select options
      if (field.field_type === 'select' && field.select_options) {
        const options = field.select_options
          .split('\n')
          .map(line => line.trim())
          .filter(line => line)
          .map(line => {
            const [value, label] = line.split('|').map(s => s.trim())
            return { value: value || line, label: label || value || line }
          })

        processed.config = { options }
      }
      // Handle options field type (already has config from FieldOptionsEditor)
      else if (field.field_type === 'options') {
        // Always set config, even if empty
        processed.config = field.config || {}
        console.log('[CreateSectionDialog] Processing options field:', field.field_key, 'with config:', processed.config)
        console.log('[CreateSectionDialog] Config type:', typeof processed.config)
        console.log('[CreateSectionDialog] Config keys:', Object.keys(processed.config || {}))
        console.log('[CreateSectionDialog] Config.options:', processed.config?.options)
        console.log('[CreateSectionDialog] Original field config:', field.config)
      }

      // Handle items field type (already has config from ItemsFieldEditor)
      else if (field.field_type === 'items') {
        processed.config = field.config || {}
      }

      return processed
    })

    const saveData = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      component_type: formData.component_type,
      language_code: formData.language_code === 'global' ? null : formData.language_code,
      is_reusable: formData.is_reusable,
      is_active: formData.is_active,
      fields: processedFields
    }

    console.log('[CreateSectionDialog] Saving section template with data:', saveData)
    console.log('[CreateSectionDialog] Fields with config:', processedFields.filter(f => f.config))

    await props.onSave?.(saveData)

    handleClose()
  } catch (error) {
    console.error('Failed to save section:', error)
  } finally {
    saving.value = false
  }
}

// Load existing fields if editing
async function loadExistingFields() {
  if (props.mode === 'edit' && props.section?.id) {
    try {
      const existingFields = await contentService.getFieldsBySectionTemplate(props.section.id)

      // Convert ContentField to FieldForm
      formData.fields = existingFields.map(field => {
        const fieldForm: any = {
          id: field.id,
          field_key: field.field_key,
          label: field.label,
          field_type: field.field_type,
          is_required: field.is_required,
          is_translatable: field.is_translatable,
          order_index: field.order_index,
          select_options: field.config?.options ?
            (Array.isArray(field.config.options) ?
              field.config.options.map((opt: any) => typeof opt === 'string' ? opt : `${opt.value}|${opt.label}`).join('\n') :
              field.config.options) :
            ''
        }

        // Also preserve config for options and items field types
        if ((field.field_type === 'options' || field.field_type === 'items') && field.config) {
          fieldForm.config = field.config
          console.log('[CreateSectionDialog] Loading existing field config for', field.field_key, ':', field.config)
        }

        return fieldForm
      })
    } catch (error) {
      console.error('Failed to load fields:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadLanguages()
  loadExistingFields()
})
</script>

<style lang="scss">
.create-section-dialog {
  display: flex;
  flex-direction: column;

  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-accent);

    h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-foreground);
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
  }

  &__help-text {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space);
  }

  &__fields-section {
    margin-top: var(--space-xl);
    padding-top: var(--space-xl);
    border-top: 1px solid var(--color-accent);

    h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }
  }

  &__fields-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__field-item {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-md);
    padding: var(--space);
  }

  &__field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);

    span {
      font-weight: 500;
      color: var(--color-foreground);
    }
  }

  &__field-options {
    display: flex;
    gap: var(--space-lg);
  }

  &__field-config {
    margin-top: var(--space);
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);
  }

  &__add-field-button {
    align-self: flex-start;
    margin-top: var(--space);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-accent);
  }
}
</style>
