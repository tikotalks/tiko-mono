<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ mode === 'edit' ? t('admin.content.sections.editInstance') : t('admin.content.sections.createInstance') }}</h2>
      <p>{{ mode === 'edit' ? t('admin.content.sections.editInstanceDescription') : t('admin.content.sections.createInstanceDescription') }}</p>
    </div>

    <div :class="bemm('content')">
      <TFormGroup>
        <TInputSelect
          v-model="formData.section_template_id"
          :label="t('admin.content.sections.template')"
          :options="templateOptions"
          :placeholder="t('admin.content.sections.selectTemplate')"
          :required="true"
          :error="errors.section_template_id"
          @update:model-value="onTemplateChange"
        />
      </TFormGroup>

      <TFormGroup v-if="selectedTemplate">
        <TInputText
          v-model="formData.name"
          :label="t('common.name')"
          :placeholder="t('admin.content.sections.namePlaceholder')"
          :required="true"
          :error="errors.name"
        />

        <TInputText
          v-model="formData.slug"
          :label="t('common.slug')"
          :placeholder="t('admin.content.sections.slugPlaceholder')"
          :required="true"
          :error="errors.slug"
        />
      </TFormGroup>

      <TFormGroup v-if="selectedTemplate">
        <TTextArea
          v-model="formData.description"
          :label="t('common.description')"
          :placeholder="t('admin.content.sections.descriptionPlaceholder')"
          :rows="3"
        />
      </TFormGroup>

      <TFormGroup v-if="selectedTemplate">
        <TInputSelect
          v-model="formData.language_code"
          :label="t('admin.content.sections.language')"
          :options="languageOptions"
          :placeholder="t('admin.content.sections.languagePlaceholder')"
        />

        <TInputCheckbox
          v-model="formData.is_active"
          :label="t('common.active')"
        />
      </TFormGroup>

      <!-- Template Preview -->
      <div v-if="selectedTemplate" :class="bemm('template-preview')">
        <h3>{{ t('admin.content.sections.templatePreview') }}</h3>
        <div :class="bemm('template-info')">
          <div :class="bemm('template-detail')">
            <span :class="bemm('label')">{{ t('common.type') }}:</span>
            <span>{{ getSectionTypeLabel(selectedTemplate.component_type) }}</span>
          </div>
          <div :class="bemm('template-detail')">
            <span :class="bemm('label')">{{ t('admin.content.sections.reusable') }}:</span>
            <span>{{ selectedTemplate.is_reusable ? t('common.yes') : t('common.no') }}</span>
          </div>
          <div v-if="selectedTemplate.description" :class="bemm('template-detail')">
            <span :class="bemm('label')">{{ t('common.description') }}:</span>
            <span>{{ selectedTemplate.description }}</span>
          </div>
        </div>
      </div>

      <!-- Template Fields -->
      <div v-if="templateFields.length > 0" :class="bemm('template-fields')">
        <h3>{{ t('admin.content.sections.fields') }}</h3>
        <p :class="bemm('help-text')">{{ t('admin.content.sections.fieldsHelp') }}</p>
        
        <div :class="bemm('fields-list')">
          <TFormGroup v-for="field in templateFields" :key="field.id">
            <!-- Text Field -->
            <TInputText
              v-if="field.field_type === 'text'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />
            
            <!-- Textarea Field -->
            <TTextArea
              v-else-if="field.field_type === 'textarea'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
              :rows="3"
            />
            
            <!-- Rich Text Field -->
            <!-- TODO: Replace with TRichTextEditor once TipTap dependencies are installed -->
            <TTextArea
              v-else-if="field.field_type === 'richtext'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
              :rows="5"
            />
            
            <!-- Number Field -->
            <TInputText
              v-else-if="field.field_type === 'number'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
              type="number"
            />
            
            <!-- Boolean Field -->
            <TInputCheckbox
              v-else-if="field.field_type === 'boolean'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
            />
            
            <!-- Select Field -->
            <TInputSelect
              v-else-if="field.field_type === 'select'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :options="getSelectOptions(field)"
              :placeholder="`Select ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />
            
            <!-- Default Text for other field types -->
            <TInputText
              v-else
              v-model="fieldValues[field.field_key]"
              :label="`${field.label} (${field.field_type})`"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />
          </TFormGroup>
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
        {{ mode === 'edit' ? t('common.save') : t('common.create') }}
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
  useI18n
} from '@tiko/ui'
import { contentService, translationService } from '@tiko/core'
import type { SectionTemplate, ContentSection, Language, ContentField } from '@tiko/core'

interface Props {
  templates?: SectionTemplate[]
  section?: ContentSection
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  templates: () => [],
  mode: 'create'
})

const emit = defineEmits<{
  close: []
  save: [data: Omit<ContentSection, 'id' | 'created_at' | 'updated_at'>]
}>()

const bemm = useBemm('create-section-instance-dialog')
const { t } = useI18n()

// State
const languages = ref<Language[]>([])
const templateFields = ref<ContentField[]>([])
const fieldValues = ref<Record<string, any>>({})
const formData = reactive({
  section_template_id: props.section?.section_template_id || '',
  name: props.section?.name || '',
  slug: props.section?.slug || '',
  description: props.section?.description || '',
  language_code: props.section?.language_code || '',
  is_active: props.section?.is_active ?? true
})
const errors = reactive({
  section_template_id: '',
  name: '',
  slug: ''
})
const saving = ref(false)

// Computed
const selectedTemplate = computed(() => {
  return props.templates.find(t => t.id === formData.section_template_id)
})

const templateOptions = computed(() => {
  return props.templates.map(template => ({
    value: template.id,
    label: template.name,
    description: template.description
  }))
})

const languageOptions = computed(() => {
  const options = [
    { value: '', label: t('admin.content.sections.global') }
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
  return formData.section_template_id !== '' &&
         formData.name.trim() !== '' &&
         formData.slug.trim() !== '' &&
         !Object.values(errors).some(error => error !== '')
})

// Methods
async function loadLanguages() {
  try {
    languages.value = await translationService.getActiveLanguages()
  } catch (error) {
    console.error('Failed to load languages:', error)
  }
}

async function loadTemplateFields(templateId: string) {
  try {
    templateFields.value = await contentService.getFieldsBySectionTemplate(templateId)
    // Initialize field values
    fieldValues.value = {}
    templateFields.value.forEach(field => {
      fieldValues.value[field.field_key] = field.default_value || getDefaultValueForFieldType(field.field_type)
    })
  } catch (error) {
    console.error('Failed to load template fields:', error)
    templateFields.value = []
    fieldValues.value = {}
  }
}

function getDefaultValueForFieldType(fieldType: string): any {
  switch (fieldType) {
    case 'boolean':
      return false
    case 'number':
      return 0
    case 'list':
    case 'media_list':
      return []
    case 'object':
      return {}
    default:
      return ''
  }
}

function onTemplateChange() {
  if (selectedTemplate.value) {
    if (props.mode === 'create') {
      // Auto-populate name and slug from template if empty
      if (!formData.name) {
        formData.name = selectedTemplate.value.name
      }
      if (!formData.slug) {
        formData.slug = selectedTemplate.value.slug + '-instance'
      }
      if (!formData.description) {
        formData.description = selectedTemplate.value.description || ''
      }
    }
    
    // Load fields for the selected template
    loadTemplateFields(formData.section_template_id)
  }
}

function getSectionTypeLabel(type: string): string {
  const typeKey = `admin.content.sections.types.${type}`
  const translated = t(typeKey)
  return translated !== typeKey ? translated : type
}

function getSelectOptions(field: ContentField): Array<{ value: string; label: string }> {
  if (!field.config?.options) {
    return []
  }
  
  // Handle different option formats
  if (Array.isArray(field.config.options)) {
    return field.config.options.map((option: any) => {
      if (typeof option === 'string') {
        return { value: option, label: option }
      }
      return { value: option.value || option, label: option.label || option.value || option }
    })
  } else if (typeof field.config.options === 'string') {
    // Handle options like "option1|Option 1\noption2|Option 2"
    return field.config.options.split('\n').map(line => {
      const [value, label] = line.split('|')
      return { value: value.trim(), label: (label || value).trim() }
    })
  }
  
  return []
}

function validateSlug() {
  const slug = formData.slug.trim()
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = t('admin.content.sections.slugError')
  } else {
    errors.slug = ''
  }
}

function handleClose() {
  emit('close')
}

async function handleSave() {
  // Validate
  if (!formData.section_template_id) {
    errors.section_template_id = t('validation.required')
    return
  }

  if (!formData.name.trim()) {
    errors.name = t('validation.required')
    return
  }

  if (!formData.slug.trim()) {
    errors.slug = t('validation.required')
    return
  }

  validateSlug()
  if (!isValid.value) return

  saving.value = true

  try {
    const template = selectedTemplate.value!
    const sectionData: Omit<ContentSection, 'id' | 'created_at' | 'updated_at'> = {
      section_template_id: formData.section_template_id,
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      language_code: formData.language_code || undefined,
      component_type: template.component_type,
      is_reusable: template.is_reusable,
      is_active: formData.is_active,
      project_id: props.section?.project_id
    }
    
    emit('save', sectionData)
  } catch (error) {
    console.error('Failed to create section instance:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadLanguages()
  
  // If editing an existing section, load its template fields
  if (props.mode === 'edit' && props.section?.section_template_id) {
    loadTemplateFields(props.section.section_template_id)
  }
})
</script>

<style lang="scss">
.create-section-instance-dialog {
  display: flex;
  flex-direction: column;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);

    h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space-xs) 0;
    }

    p {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
  }

  &__template-preview {
    margin-top: var(--space-lg);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);

    h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space) 0;
    }
  }

  &__template-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__template-detail {
    display: flex;
    gap: var(--space-xs);
    align-items: flex-start;
  }

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
    min-width: 100px;
  }

  &__template-fields {
    margin-top: var(--space-lg);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);

    h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space-xs) 0;
    }
  }

  &__help-text {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-sm);
    margin: 0 0 var(--space) 0;
  }

  &__fields-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space-lg);
    border-top: 1px solid var(--color-border);
  }
}
</style>