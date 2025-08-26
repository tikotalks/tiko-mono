<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="
        isEditMode
          ? section?.name || 'Edit Section Instance'
          : 'Create Section Instance'
      "
      :description="
        isEditMode ? section?.description : 'Create a new section instance'
      "
      :back-to="{ path: '/content/sections' }"
    >
      <template #actions>
        <TButton
          color="primary"
          :status="saving ? 'loading' : 'idle'"
          :disabled="!canSave"
          @click="handleSave"
        >
          {{ isEditMode ? 'Save Changes' : 'Create Section' }}
        </TButton>
      </template>
    </AdminPageHeader>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else :class="bemm('content')">
      <!-- Section Fields -->
      <TCard v-if="templateFields.length > 0" :class="bemm('fields')">
        <template #header>
          <h3>Section Content</h3>
        </template>

        <TFormGroup>
          <template v-for="field in templateFields" :key="field.id">
            <!-- Text Field -->
            <TInputText
              v-if="field.field_type === 'text'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Textarea Field -->
            <TInputTextArea
              v-else-if="field.field_type === 'textarea'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
              rows="4"
            />

            <!-- Number Field -->
            <TInputNumber
              v-else-if="field.field_type === 'number'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Boolean Field -->
            <TInputCheckbox
              v-else-if="field.field_type === 'boolean'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :required="field.is_required"
            />

            <!-- Color Field -->
            <div v-else-if="field.field_type === 'color' || isColorField(field)">
              <label :class="bemm('field-label')">{{ field.label }}<span v-if="field.is_required">*</span></label>
              <TColorPickerPopup
                v-model="fieldValues[field.field_key]"
                :placeholder="`Select ${field.label.toLowerCase()}`"
              />
            </div>

            <!-- Select/Options Field -->
            <TInputSelect
              v-else-if="field.field_type === 'select' || field.field_type === 'options'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :options="getSelectOptions(field)"
              :placeholder="`Select ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />

            <!-- Items Field (Repeater) -->
            <ItemsFieldInstance
              v-else-if="field.field_type === 'items'"
              v-model="fieldValues[field.field_key]"
              :label="field.label"
              :field-id="field.id"
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
              :section-id="sectionId"
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
              :label="`${field.label} (${field.field_type})`"
              :placeholder="`Enter ${field.label.toLowerCase()}`"
              :required="field.is_required"
            />
          </template>
        </TFormGroup>
      </TCard>

      <!-- Section Basic Info -->
      <TCard :class="bemm('basic-info')">
        <template #header>
          <h3>
            {{ isEditMode ? 'Section Information' : 'Create Section Instance' }}
          </h3>
        </template>

        <TFormGroup>
          <TInputSelect
            :inline="true"
            v-model="formData.section_template_id"
            label="Template"
            :options="templateOptions"
            placeholder="Select a template"
            required
            @update:model-value="onTemplateChange"
          />

          <TInputText
            :inline="true"
            v-model="formData.name"
            label="Name"
            placeholder="Enter section name"
            required
          />

          <TInputText
            :inline="true"
            v-model="formData.slug"
            label="Slug"
            placeholder="Enter section slug"
            required
          />

          <TInputTextArea
            :inline="true"
            v-model="formData.description"
            label="Description"
            placeholder="Enter section description"
            rows="3"
          />

          <TInputSelect
            :inline="true"
            v-model="formData.language_code"
            label="Language"
            :options="languageOptions"
            placeholder="Select language (optional for global)"
          />

          <TInputCheckbox
            v-model="formData.is_active"
            label="Active"
            help="Whether this section is active"
          />
        </TFormGroup>
      </TCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { inject } from 'vue';
import {
  TCard,
  TButton,
  TSpinner,
  TFormGroup,
  TInputText,
  TInputTextArea,
  TInputNumber,
  TInputCheckbox,
  TInputSelect,
  TColorPickerPopup,
  type ToastService,
} from '@tiko/ui';
import { contentService, translationService, useI18n } from '@tiko/core';
import type {
  SectionTemplate,
  ContentSection,
  Language,
  ContentField,
} from '@tiko/core';
import AdminPageHeader from '@/components/AdminPageHeader.vue';
import ItemsFieldInstance from './components/ItemsFieldInstance.vue';
import MediaFieldInstance from './components/MediaFieldInstance.vue';
import LinkedItemsFieldInstance from './components/LinkedItemsFieldInstance.vue';
import RepeaterFieldInstance from './components/RepeaterFieldInstance.vue';

const route = useRoute();
const router = useRouter();
const bemm = useBemm('section-instance-detail-view');
const { t } = useI18n();
const toastService = inject<ToastService>('toastService');

// State
const loading = ref(true);
const saving = ref(false);
const section = ref<ContentSection | null>(null);
const templates = ref<SectionTemplate[]>([]);
const languages = ref<Language[]>([]);
const templateFields = ref<ContentField[]>([]);

// Computed
const sectionId = computed(() => route.params.id as string);
const isEditMode = computed(
  () => sectionId.value && sectionId.value !== 'create',
);

const formData = reactive({
  section_template_id: '',
  name: '',
  slug: '',
  description: '',
  language_code: '',
  is_active: true,
});

const fieldValues = ref<Record<string, any>>({});

// Original values for change tracking
const originalFormData = ref<typeof formData>({
  section_template_id: '',
  name: '',
  slug: '',
  description: '',
  language_code: '',
  is_active: true,
});
const originalFieldValues = ref<Record<string, any>>({});

const templateOptions = computed(() =>
  templates.value.map((template) => ({
    value: template.id,
    label: template.name,
  })),
);

const languageOptions = computed(() => [
  { value: '', label: 'Global (No Language)' },
  ...languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.name} (${lang.code})`,
  })),
]);

const selectedTemplate = computed(() =>
  templates.value.find((t) => t.id === formData.section_template_id),
);

const isValid = computed(() => {
  return (
    formData.section_template_id && formData.name.trim() && formData.slug.trim()
  );
});

const hasFormChanges = computed(() => {
  if (!isEditMode.value) return true; // Always allow save in create mode

  return JSON.stringify(formData) !== JSON.stringify(originalFormData.value);
});

const hasFieldChanges = computed(() => {
  if (!isEditMode.value) return true; // Always allow save in create mode

  // Deep comparison that handles Vue reactivity properly
  const deepCompare = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    if (obj1 === null || obj2 === null) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepCompare(obj1[key], obj2[key])) return false;
    }

    return true;
  };

  return !deepCompare(fieldValues.value, originalFieldValues.value);
});

const canSave = computed(() => {
  return isValid.value && (hasFormChanges.value || hasFieldChanges.value);
});

// Removed debug watcher to prevent performance issues

// Methods
async function loadData() {
  loading.value = true;
  try {
    // Load templates and languages in parallel
    const [templatesData, languagesData] = await Promise.all([
      contentService.getSectionTemplates(),
      translationService.getActiveLanguages(),
    ]);

    templates.value = templatesData;
    languages.value = languagesData;

    // If editing, load the section
    if (isEditMode.value) {
      await loadSection();
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    toastService?.show({
      message: 'Failed to load data',
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
}

async function loadSection() {
  try {
    section.value = await contentService.getSection(sectionId.value);

    if (!section.value) {
      toastService?.show({
        message: 'Section not found',
        type: 'error',
      });
      router.push('/content/sections');
      return;
    }

    // Populate form data
    const formDataValues = {
      section_template_id: section.value.section_template_id,
      name: section.value.name,
      slug: section.value.slug,
      description: section.value.description || '',
      language_code: section.value.language_code || '',
      is_active: section.value.is_active,
    };
    Object.assign(formData, formDataValues);

    // Store original form data for change tracking
    originalFormData.value = { ...formDataValues };

    // Load template fields and section data
    await loadTemplateFields(section.value.section_template_id);
    await loadSectionData();
  } catch (error) {
    console.error('Failed to load section:', error);
    toastService?.show({
      message: 'Failed to load section',
      type: 'error',
    });
  }
}

async function loadTemplateFields(templateId: string) {
  try {
    templateFields.value =
      await contentService.getFieldsBySectionTemplate(templateId);

    // Initialize field values with defaults
    templateFields.value.forEach((field) => {
      if (fieldValues.value[field.field_key] === undefined) {
        fieldValues.value[field.field_key] = getDefaultValueForFieldType(
          field.field_type,
        );
      }
    });
  } catch (error) {
    console.error('Failed to load template fields:', error);
    templateFields.value = [];
  }
}

async function loadSectionData() {
  if (!section.value) return;

  try {
    const data = await contentService.getSectionData(
      section.value.id,
      section.value.language_code,
    );
    fieldValues.value = { ...fieldValues.value, ...data };

    // Store original field values for change tracking (deep clone)
    originalFieldValues.value = JSON.parse(JSON.stringify(fieldValues.value));
  } catch (error) {
    console.error('Failed to load section data:', error);
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
    case 'color':
      return 'primary'; // Default to primary color
    default:
      return '';
  }
}

function isColorField(field: ContentField): boolean {
  // Check if field is a color field by field_key, label, or specific config
  return field.field_key?.toLowerCase().includes('color') || 
         field.label?.toLowerCase().includes('color') ||
         field.config?.isColorField === true;
}

function getSelectOptions(
  field: ContentField,
): Array<{ value: string; label: string }> {
  if (!field.config?.options) return [];

  if (Array.isArray(field.config.options)) {
    return field.config.options.map((option: any) => {
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      // Handle both formats: {value, label} and {key, value}
      if (option.key && option.value) {
        return { value: option.key, label: option.value };
      }
      return { value: option.value || option.key, label: option.label || option.value };
    });
  }

  return [];
}

async function onTemplateChange() {
  if (selectedTemplate.value) {
    if (!isEditMode.value) {
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

    await loadTemplateFields(formData.section_template_id);
  }
}

async function handleSave() {
  if (!isValid.value) return;

  saving.value = true;
  try {
    const template = selectedTemplate.value!;

    const sectionData: Omit<
      ContentSection,
      'id' | 'created_at' | 'updated_at'
    > = {
      section_template_id: formData.section_template_id,
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      language_code: formData.language_code || undefined,
      component_type: template.component_type,
      is_reusable: template.is_reusable,
      is_active: formData.is_active,
      project_id: section.value?.project_id,
    };

    let savedSection: ContentSection;

    if (isEditMode.value) {
      // Update existing section
      await contentService.updateSection(sectionId.value, sectionData);
      savedSection = { ...section.value!, ...sectionData, id: sectionId.value };

      // Update field values
      if (Object.keys(fieldValues.value).length > 0) {
        await contentService.setSectionData(
          sectionId.value,
          fieldValues.value,
          formData.language_code || null,
        );
      }

      toastService?.show({
        message: 'Section updated successfully',
        type: 'success',
      });
    } else {
      // Create new section
      savedSection = await contentService.createSection(sectionData);

      // Save field values
      if (Object.keys(fieldValues.value).length > 0) {
        await contentService.setSectionData(
          savedSection.id,
          fieldValues.value,
          formData.language_code || null,
        );
      }

      toastService?.show({
        message: 'Section created successfully',
        type: 'success',
      });

      // Redirect to edit mode
      router.push(`/content/sections/${savedSection.id}`);
      return;
    }

    // Reload section data and reset original values for change tracking
    section.value = savedSection;
    originalFormData.value = { ...formData };
    originalFieldValues.value = { ...fieldValues.value };
  } catch (error) {
    console.error('Failed to save section:', error);
    toastService?.show({
      message: isEditMode.value
        ? 'Failed to update section'
        : 'Failed to create section',
      type: 'error',
    });
  } finally {
    saving.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style lang="scss">
.section-instance-detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space);

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__field-label {
    display: block;
    margin-bottom: var(--space-xs);
    font-weight: 500;
    color: var(--color-foreground);
    font-size: var(--font-size-sm);

    span {
      color: var(--color-error);
      margin-left: var(--space-xs);
    }
  }
}
</style>
