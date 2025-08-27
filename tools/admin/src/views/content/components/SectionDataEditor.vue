<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="fields.length > 0" :class="bemm('fields')">
      <TFormGroup>
        <template v-for="field in fields" :key="field.id">
          <FieldRenderer
            :field="field"
            :modelValue="fieldValues[field.field_key]"
            @update:modelValue="(value) => updateFieldValue(field.field_key, value)"
          />
        </template>
      </TFormGroup>

      <div :class="bemm('actions')">
        <TButton
          type="ghost"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </TButton>
        <TButton
          color="primary"
          :icon="Icons.CHECK"
          @click="handleSave"
          :status="saving ? 'loading' : 'idle'"
        >
          {{ t('common.save') }}
        </TButton>
      </div>
    </div>

    <TEmptyState
      v-else
      :icon="Icons.LAYERS"
      :title="t('admin.content.sections.noFields')"
      :description="t('admin.content.sections.noFieldsDescription')"
      :compact="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TFormGroup,
  TSpinner,
  TEmptyState,
  useI18n
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService } from '@tiko/core'
import type { ContentField, ContentSection } from '@tiko/core'
import FieldRenderer from './FieldRenderer.vue'

interface Props {
  section: ContentSection
  languageCode?: string
  onSave?: (data: Record<string, any>) => Promise<void>
  onCancel?: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [data: Record<string, any>]
  cancel: []
}>()

const bemm = useBemm('section-data-editor')
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const fields = ref<ContentField[]>([])
const fieldValues = ref<Record<string, any>>({})

// Methods
async function loadFields() {
  loading.value = true
  try {
    // Load fields for this section template
    fields.value = await contentService.getFieldsBySectionTemplate(props.section.section_template_id)

    // Load existing data
    const existingData = await contentService.getSectionData(
      props.section.id,
      props.languageCode
    )

    // Initialize field values
    fields.value.forEach(field => {
      if (existingData[field.field_key] !== undefined) {
        fieldValues.value[field.field_key] = existingData[field.field_key]
      } else if (field.default_value !== undefined) {
        fieldValues.value[field.field_key] = field.default_value
      } else {
        // Set appropriate default based on field type
        switch (field.field_type) {
          case 'boolean':
            fieldValues.value[field.field_key] = false
            break
          case 'number':
            fieldValues.value[field.field_key] = 0
            break
          case 'items':
          case 'repeater':
            fieldValues.value[field.field_key] = []
            break
          case 'list':
            fieldValues.value[field.field_key] = ''
            break
          default:
            fieldValues.value[field.field_key] = ''
        }
      }
    })
  } catch (error) {
    console.error('Failed to load section fields:', error)
  } finally {
    loading.value = false
  }
}

function updateFieldValue(fieldKey: string, value: any) {
  fieldValues.value[fieldKey] = value
}

async function handleSave() {
  saving.value = true
  try {
    if (props.onSave) {
      await props.onSave(fieldValues.value)
    } else {
      // Default save behavior
      await contentService.setSectionData(
        props.section.id,
        fieldValues.value,
        props.languageCode
      )
      emit('save', fieldValues.value)
    }
  } catch (error) {
    console.error('Failed to save section data:', error)
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (props.onCancel) {
    props.onCancel()
  } else {
    emit('cancel')
  }
}

// Lifecycle
onMounted(() => {
  loadFields()
})
</script>

<style lang="scss">
.section-data-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--color-accent);
  }
}
</style>
