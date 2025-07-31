<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3>{{ t('admin.content.pages.addSection') }}</h3>
      <p>{{ sections.length > 0 ? t('admin.content.pages.selectSectionInstance') : t('admin.content.pages.noSectionsAvailable') }}</p>
    </div>
    
    <div :class="bemm('content')">
      <TFormGroup>
        <TInputSelect
          v-model="selectedSectionId"
          :label="t('admin.content.pages.selectSection')"
          :options="sectionOptions"
          :placeholder="t('admin.content.pages.sectionTemplatePlaceholder')"
          :required="true"
        />

        <TInputText
          v-model="overrideName"
          :label="t('admin.content.pages.sectionOverrideName')"
          :placeholder="t('admin.content.pages.sectionOverrideNamePlaceholder')"
        />
      </TFormGroup>

      <div v-if="loading" :class="bemm('loading')">
        <TSpinner />
      </div>
      
      <div v-else-if="sections.length === 0" :class="bemm('empty')">
        <TEmptyState
          :icon="Icons.LAYERS"
          :title="t('admin.content.pages.noSectionsTitle')"
          :description="t('admin.content.pages.noSectionsDescription')"
        />
      </div>

      <div v-else-if="selectedSection" :class="bemm('preview')">
        <h3>{{ t('admin.content.pages.sectionPreview') }}</h3>
        <div :class="bemm('template-info')">
          <p><strong>{{ t('common.type') }}:</strong> {{ selectedSection.component_type }}</p>
          <p v-if="selectedSection.description">{{ selectedSection.description }}</p>
          <p v-if="selectedSection.language_code"><strong>{{ t('common.language') }}:</strong> {{ selectedSection.language_code }}</p>
          <p v-if="selectedSection.is_reusable"><strong>{{ t('admin.content.sections.reusable') }}:</strong> {{ t('common.yes') }}</p>
        </div>
      </div>
    </div>

    <div :class="bemm('footer')">
      <TButton type="ghost" @click="handleClose">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="handleAdd"
        :disabled="!isValid"
      >
        {{ t('common.add') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TFormGroup, TInputSelect, TInputText, TSpinner, TEmptyState, useI18n } from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService } from '@tiko/core'
import type { ContentSection, PageSection } from '@tiko/core'

interface Props {
  pageId?: string
  existingSections?: PageSection[]
  onAdd?: (data: Omit<PageSection, 'page_id'>) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  add: [data: Omit<PageSection, 'page_id'>]
}>()

const bemm = useBemm('add-section-dialog')
const { t } = useI18n()

// State
const sections = ref<ContentSection[]>([])
const selectedSectionId = ref('')
const overrideName = ref('')
const loading = ref(false)

// Computed
const sectionOptions = computed(() => {
  // Filter out sections that are already added to this page
  const existingSectionIds = props.existingSections?.map(s => s.section_template_id) || []
  
  return sections.value
    .filter(section => section.is_reusable || !existingSectionIds.includes(section.section_template_id))
    .map(section => ({
      value: section.id,
      label: `${section.name} (${section.component_type})`,
      description: section.description
    }))
})

const selectedSection = computed(() => {
  return sections.value.find(s => s.id === selectedSectionId.value)
})

const isValid = computed(() => {
  return selectedSectionId.value !== ''
})

// Methods
async function loadSections() {
  loading.value = true
  try {
    sections.value = await contentService.getSections()
  } catch (error) {
    console.error('Failed to load sections:', error)
    // Handle gracefully if table doesn't exist yet
    if (error?.message?.includes('does not exist') || error?.message?.includes('42P01')) {
      console.log('content_sections table does not exist yet - falling back to templates')
      // Fallback to loading templates and converting them to mock sections
      try {
        const templates = await contentService.getSectionTemplates()
        sections.value = templates.map(template => ({
          id: template.id,
          section_template_id: template.id,
          name: template.name,
          slug: template.slug,
          description: template.description,
          language_code: template.language_code,
          component_type: template.component_type,
          is_reusable: template.is_reusable,
          is_active: template.is_active,
          created_at: template.created_at,
          updated_at: template.updated_at
        }))
      } catch (templateError) {
        console.error('Failed to load templates as fallback:', templateError)
        sections.value = []
      }
    } else {
      sections.value = []
    }
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('close')
}

function handleAdd() {
  if (!isValid.value) return

  const section = selectedSection.value!
  const sectionData = {
    section_template_id: section.section_template_id,
    order_index: props.existingSections?.length || 0,
    override_name: overrideName.value.trim() || section.name
  }
  
  // Call the callback if provided (for popup service usage)
  if (props.onAdd) {
    props.onAdd(sectionData)
  } else {
    // Fallback to emit (for direct component usage)
    emit('add', sectionData)
  }
  
  // Close the dialog after adding
  emit('close')
}

// Lifecycle
onMounted(() => {
  loadSections()
})
</script>

<style lang="scss">
.add-section-dialog {
  display: flex;
  flex-direction: column;
  width: 600px;
  max-width: 90vw;
  background: var(--color-background);
  border-radius: var(--radius-lg);

  &__header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);

    h3 {
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
    padding: var(--space-lg);
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__empty {
    padding: var(--space-xl);
  }

  &__preview {
    margin-top: var(--space-lg);
    padding: var(--space);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space) 0;
    }
  }

  &__template-info {
    p {
      margin: var(--space-xs) 0;
      color: var(--color-foreground);
      font-size: var(--font-size-sm);
    }

    strong {
      font-weight: 600;
    }
  }

  &__fields-preview {
    margin-top: var(--space);

    ul {
      margin: var(--space-xs) 0 0 var(--space);
      padding: 0;
      list-style: disc;
    }

    li {
      font-size: var(--font-size-sm);
      color: var(--color-foreground-secondary);
      margin: var(--space-xs) 0;
    }
  }

  &__required {
    color: var(--color-error);
    margin-left: var(--space-xs);
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