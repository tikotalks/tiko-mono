<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>
        {{
          mode === 'edit'
            ? t('admin.content.sections.editInstance')
            : t('admin.content.sections.createInstance')
        }}
      </h2>
      <p>
        {{
          mode === 'edit'
            ? t('admin.content.sections.editInstanceDescription')
            : t('admin.content.sections.createInstanceDescription')
        }}
      </p>
    </div>

    <div :class="bemm('content')">
      <TCard>
        <TFormGroup>
          <TInputSelect
            :inline="true"
            v-model="formData.section_template_id"
            :label="t('admin.content.sections.template')"
            :options="templateOptions"
            :placeholder="t('admin.content.sections.selectTemplate')"
            :required="true"
            :error="
              errors.section_template_id
                ? [errors.section_template_id]
                : undefined
            "
            @update:model-value="onTemplateChange"
          />

          <TInputText
            :inline="true"
            v-model="formData.name"
            :label="t('common.name')"
            :placeholder="t('admin.content.sections.namePlaceholder')"
            :required="true"
            :error="errors.name ? [errors.name] : undefined"
          />

          <TInputText
            :inline="true"
            v-model="formData.slug"
            :label="t('common.slug')"
            :placeholder="t('admin.content.sections.slugPlaceholder')"
            :required="true"
            :error="errors.slug ? [errors.slug] : undefined"
          />

          <TTextArea v-if="selectedTemplate"
            :inline="true"
            v-model="formData.description"
            :label="t('common.description')"
            :placeholder="t('admin.content.sections.descriptionPlaceholder')"
            :rows="3"
          />

          <TInputSelect v-if="selectedTemplate"
            :inline="true"
            v-model="validatedLanguageCode"
            :label="t('admin.content.sections.language')"
            :options="languageOptions"
            :placeholder="t('admin.content.sections.languagePlaceholder')"
          />

          <TInputCheckbox v-if="selectedTemplate"
            v-model="formData.is_active"
            :label="t('common.active')"
          />
        </TFormGroup>
      </TCard>

      <!-- Template Preview -->
      <div v-if="selectedTemplate" :class="bemm('template-preview')">
        <h3>{{ t('admin.content.sections.templatePreview') }}</h3>
        <div :class="bemm('template-info')">
          <div :class="bemm('template-detail')">
            <span :class="bemm('label')">{{ t('common.type') }}:</span>
            <span>{{
              getSectionTypeLabel(selectedTemplate.component_type)
            }}</span>
          </div>
          <div :class="bemm('template-detail')">
            <span :class="bemm('label')">{{ t('common.reusable') }}:</span>
            <span>{{
              selectedTemplate.is_reusable ? t('common.yes') : t('common.no')
            }}</span>
          </div>
          <div
            v-if="selectedTemplate.description"
            :class="bemm('template-detail')"
          >
            <span :class="bemm('label')">{{ t('common.description') }}:</span>
            <span>{{ selectedTemplate.description }}</span>
          </div>
        </div>
      </div>

      <!-- Template Fields -->
      <div v-if="templateFields.length > 0" :class="bemm('template-fields')">
        <h3>{{ t('common.fields') }}</h3>
        <p :class="bemm('help-text')">{{ t('common.fieldsHelp') }}</p>

        <TCard>
        <div :class="bemm('fields-list')">
          <template v-for="field in templateFields" :key="field.id">
            <!-- Text Field -->
            <TInputText
              v-if="field.field_type === 'text'"
              :inline="true"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Textarea Field -->
            <TTextArea
              v-else-if="field.field_type === 'textarea'"
              v-model="fieldValues[field.field_key]"
              :inline="true"
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
              :inline="true"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
              :rows="5"
            />

            <!-- Number Field -->
            <TInputNumber
              v-else-if="field.field_type === 'number'"
              v-model="fieldValues[field.field_key]"
              :inline="true"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Boolean Field -->
            <TInputCheckbox
              v-else-if="field.field_type === 'boolean'"
              v-model="fieldValues[field.field_key]"
              :inline="true"
              :label="field.label"
            />

            <!-- Select Field -->
            <TInputSelect
              v-else-if="field.field_type === 'select'"
              v-model="fieldValues[field.field_key]"
              :inline="true"
              :label="field.label"
              :options="getSelectOptions(field)"
              :placeholder="`Select ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Options Field -->
            <TInputSelect
              v-else-if="field.field_type === 'options'"
              v-model="fieldValues[field.field_key]"
              :inline="true"
              :label="field.label"
              :options="getOptionsFromConfig(field)"
              :placeholder="`Select ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Items Field (Repeater) -->
            <ItemsFieldInstance
              v-else-if="field.field_type === 'items'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :config="field.config"
              :required="field.is_required"
            />

            <!-- Media Field (Single) -->
            <MediaFieldInstance
              v-else-if="field.field_type === 'media'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :required="field.is_required"
              :multiple="false"
            />

            <!-- Media List Field (Multiple) -->
            <MediaFieldInstance
              v-else-if="field.field_type === 'media_list'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :required="field.is_required"
              :multiple="true"
              :max-items="field.config?.max_items || 0"
            />

            <!-- Linked Items Field -->
            <LinkedItemsFieldInstance
              v-else-if="field.field_type === 'linked_items'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :field-id="field.id"
              :section-id="formData.id || 'temp'"
              :item-template-id="field.config?.item_template_id"
              :required="field.is_required"
            />

            <!-- Repeater Field -->
            <RepeaterFieldInstance
              v-else-if="field.field_type === 'repeater'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :field="field"
              :required="field.is_required"
            />

            <!-- Default Text for other field types -->
            <TInputTextArea
              v-else
              v-model="fieldValues[field.field_key]"
              :inline="true"
              :label="`${field.label} (${field.field_type})`"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />
          </template>
        </div>
      </TCard>
      </div>
    </div>

    <div :class="bemm('footer')">
      <TButton type="outline" @click="handleClose">
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useBemm } from 'bemm';
import {
  TButton,
  TInputText,
  TTextArea,
  TFormGroup,
  TInputCheckbox,
  TInputSelect,
  useI18n,
  TCard,
  TInputNumber,
  TInputTextArea,
} from '@tiko/ui';
import { contentService, translationService } from '@tiko/core';
import type {
  SectionTemplate,
  ContentSection,
  Language,
  ContentField,
} from '@tiko/core';
import ItemsFieldInstance from './ItemsFieldInstance.vue';
import MediaFieldInstance from './MediaFieldInstance.vue';
import LinkedItemsFieldInstance from './LinkedItemsFieldInstance.vue';
import RepeaterFieldInstance from './RepeaterFieldInstance.vue';

interface SectionWithData extends ContentSection {
  fieldValues?: Record<string, any>;
}

interface Props {
  templates?: SectionTemplate[];
  section?: SectionWithData;
  mode?: 'create' | 'edit';
  onSave?: (
    data: Omit<ContentSection, 'id' | 'created_at' | 'updated_at'>,
    fieldValues?: Record<string, any>,
  ) => Promise<void>;
}

const props = withDefaults(defineProps<Props>(), {
  templates: () => [],
  mode: 'create',
});

const emit = defineEmits<{
  close: [];
  save: [data: Omit<ContentSection, 'id' | 'created_at' | 'updated_at'>];
}>();

const bemm = useBemm('create-section-instance-dialog');
const { t } = useI18n();

// State
const languages = ref<Language[]>([]);
const templateFields = ref<ContentField[]>([]);
const fieldValues = ref<Record<string, any>>({});
const formData = reactive({
  section_template_id: props.section?.section_template_id || '',
  name: props.section?.name || '',
  slug: props.section?.slug || '',
  description: props.section?.description || '',
  language_code: props.section?.language_code || '',
  is_active: props.section?.is_active ?? true,
});
const errors = reactive({
  section_template_id: '',
  name: '',
  slug: '',
});
const saving = ref(false);
const isInitializing = ref(true);

// Computed
const selectedTemplate = computed(() => {
  return props.templates.find((t) => t.id === formData.section_template_id);
});

const templateOptions = computed(() => {
  return props.templates.map((template) => ({
    value: template.id,
    label: template.name,
    description: template.description,
  }));
});

const languageOptions = computed(() => {
  const options = [{ value: '', label: t('common.global') }];

  languages.value.forEach((lang) => {
    options.push({
      value: lang.code,
      label: `${lang.name} (${lang.code})`,
    });
  });

  return options;
});

// Computed property to ensure we always have a valid language code
const validatedLanguageCode = computed({
  get() {
    const code = formData.language_code;
    // If the code looks like a label (too long or has spaces), return empty string
    if (
      code &&
      (code.length > 10 || code.includes(' ') || code === t('common.global'))
    ) {
      return '';
    }
    return code;
  },
  set(value: string) {
    formData.language_code = value;
  },
});

const isValid = computed(() => {
  return (
    formData.section_template_id !== '' &&
    formData.name.trim() !== '' &&
    formData.slug.trim() !== '' &&
    !Object.values(errors).some((error) => error !== '')
  );
});

// Methods
async function loadLanguages() {
  try {
    languages.value = await translationService.getActiveLanguages();
  } catch (error) {
    console.error('Failed to load languages:', error);
  }
}

async function loadTemplateFields(templateId: string, preserveValues = false) {
  try {
    templateFields.value =
      await contentService.getFieldsBySectionTemplate(templateId);

    // Don't reset field values if we should preserve them
    if (!preserveValues) {
      // Initialize field values
      fieldValues.value = {};
    }

    // If editing and we have existing field values, use them
    if (props.mode === 'edit' && props.section?.fieldValues && !preserveValues) {
      console.log('[CreateSectionInstanceDialog] Loading existing field values:', props.section.fieldValues);
      fieldValues.value = { ...props.section.fieldValues };
    }

    // Set defaults for any missing fields
    templateFields.value.forEach((field) => {
      if (fieldValues.value[field.field_key] === undefined) {
        const defaultValue = field.default_value || getDefaultValueForFieldType(field.field_type);
        fieldValues.value[field.field_key] = defaultValue;
        console.log(`[CreateSectionInstanceDialog] Set default for ${field.field_key} (${field.field_type}):`, defaultValue);
      } else {
        console.log(`[CreateSectionInstanceDialog] Existing value for ${field.field_key} (${field.field_type}):`, fieldValues.value[field.field_key]);
      }
    });

    console.log('[CreateSectionInstanceDialog] Field values after initialization:', fieldValues.value);

    // Log specifically for items fields
    templateFields.value.forEach((field) => {
      if (field.field_type === 'items') {
        console.log(`[CreateSectionInstanceDialog] Items field "${field.field_key}" value:`, fieldValues.value[field.field_key]);
        console.log(`[CreateSectionInstanceDialog] Items field "${field.field_key}" config:`, field.config);
      }
    });
  } catch (error) {
    console.error('Failed to load template fields:', error);
    templateFields.value = [];
    if (!preserveValues) {
      fieldValues.value = {};
    }
  }
}

function getDefaultValueForFieldType(fieldType: string): any {
  switch (fieldType) {
    case 'boolean':
      return false;
    case 'number':
      return 0;
    case 'list':
    case 'media_list':
    case 'items':
    case 'linked_items':
    case 'repeater':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
}

function onTemplateChange() {
  // Skip if we're initializing in edit mode
  if (isInitializing.value && props.mode === 'edit') {
    console.log('[CreateSectionInstanceDialog] Skipping onTemplateChange during edit mode initialization');
    return;
  }

  if (selectedTemplate.value) {
    if (props.mode === 'create') {
      // Auto-populate name and slug from template if empty
      if (!formData.name) {
        formData.name = selectedTemplate.value.name;
      }
      if (!formData.slug) {
        formData.slug = selectedTemplate.value.slug + '-instance';
      }
      if (!formData.description) {
        formData.description = selectedTemplate.value.description || '';
      }
    }

    // Load fields for the selected template
    // In edit mode, preserve existing values when changing templates
    loadTemplateFields(formData.section_template_id, props.mode === 'edit');
  }
}

function getSectionTypeLabel(type: string): string {
  const typeKey = `admin.content.sections.types.${type}`;
  const translated = t(typeKey);
  return translated !== typeKey ? translated : type;
}

function getSelectOptions(
  field: ContentField,
): Array<{ value: string; label: string }> {
  if (!field.config?.options) {
    return [];
  }

  // Handle different option formats
  if (Array.isArray(field.config.options)) {
    return field.config.options.map((option: any) => {
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      return {
        value: option.value || option,
        label: option.label || option.value || option,
      };
    });
  } else if (typeof field.config.options === 'string') {
    // Handle options like "option1|Option 1\noption2|Option 2"
    return field.config.options.split('\n').map((line) => {
      const [value, label] = line.split('|');
      return { value: value.trim(), label: (label || value).trim() };
    });
  }

  return [];
}

function getOptionsFromConfig(
  field: ContentField,
): Array<{ value: string; label: string }> {
  if (!field.config?.options) {
    return [];
  }

  // Handle the options array from FieldOptionsEditor
  return field.config.options.map((opt: any) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return { value: opt.key, label: opt.value };
  });
}

function validateSlug() {
  const slug = formData.slug.trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = t('admin.content.sections.slugError');
  } else {
    errors.slug = '';
  }
}

function handleClose() {
  emit('close');
}

async function handleSave() {
  // Validate
  if (!formData.section_template_id) {
    errors.section_template_id = t('validation.required');
    return;
  }

  if (!formData.name.trim()) {
    errors.name = t('validation.required');
    return;
  }

  if (!formData.slug.trim()) {
    errors.slug = t('validation.required');
    return;
  }

  validateSlug();
  if (!isValid.value) return;

  saving.value = true;

  try {
    const template = selectedTemplate.value!;

    // Use the validated language code to ensure we never pass a label
    const languageCode = validatedLanguageCode.value;

    const sectionData: Omit<
      ContentSection,
      'id' | 'created_at' | 'updated_at'
    > = {
      section_template_id: formData.section_template_id,
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      language_code: languageCode || undefined,
      component_type: template.component_type,
      is_reusable: template.is_reusable,
      is_active: formData.is_active,
      project_id: props.section?.project_id,
    };

    console.log('[CreateSectionInstanceDialog] Saving section with field values:', fieldValues.value);
    // Log specifically items and linked_items fields before save
    Object.entries(fieldValues.value).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        console.log(`[CreateSectionInstanceDialog] Field "${key}" value before save:`, JSON.stringify(value));
      }
    });
    
    // Log linked_items fields specifically
    templateFields.value.forEach((field) => {
      if (field.field_type === 'linked_items') {
        console.log(`[CreateSectionInstanceDialog] LINKED_ITEMS field "${field.field_key}" final value:`, fieldValues.value[field.field_key]);
      }
    });

    // If onSave prop is provided, use it and wait for completion
    if (props.onSave) {
      // Pass both section data and field values
      await props.onSave(sectionData, fieldValues.value);

      // Close the dialog after successful save
      emit('close');
    } else {
      // Fallback to emit for backward compatibility
      emit('save', sectionData);
    }
  } catch (error) {
    console.error('Failed to create section instance:', error);
    // Don't close on error, let user fix issues
  } finally {
    saving.value = false;
  }
}

// Watch for language_code changes
watch(
  () => formData.language_code,
  (newVal) => {
    // Additional validation to catch label values early
    if (newVal && (newVal.length > 10 || newVal.includes(' '))) {
      console.warn(
        'Warning: Language code appears to be a label, not a code:',
        newVal,
      );
    }
  },
);

// Lifecycle
onMounted(async () => {
  loadLanguages();

  // If editing an existing section, load its template fields
  if (props.mode === 'edit' && props.section?.section_template_id) {
    await loadTemplateFields(props.section.section_template_id);
  }

  // Mark initialization as complete after a short delay
  setTimeout(() => {
    isInitializing.value = false;
    console.log('[CreateSectionInstanceDialog] Initialization complete');
  }, 100);
});
</script>

<style lang="scss">
.create-section-instance-dialog {
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  border-radius: var(--radius-lg);
padding-bottom: var(--spacing);
  width: 640px;
  max-width: 100%;

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
    width: 100%;
    z-index: 20;
    position: sticky;
    bottom: var(--space-l);
    gap: var(--space);
    padding: var(--space);
    background-color: red;
    border-radius: var(--border-radius);
    background-color: color-mix(in srgb, var(--color-background), transparent 50%);
    backdrop-filter: blur(4px);
    border: 1px solid var(--color-primary);
  }
}
</style>
