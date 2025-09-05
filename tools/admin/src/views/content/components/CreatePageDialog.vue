<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ mode === 'edit' ? t('common.edit') : t('common.create') }}</h2>
    </div>

    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="formData.title"
          :label="t('common.title')"
          :placeholder="t('admin.content.pages.titlePlaceholder')"
          :required="true"
          :error="errors.title"
        />

        <TInputText
          v-model="formData.slug"
          :label="t('common.slug')"
          :placeholder="t('admin.content.pages.slugPlaceholder')"
          :hint="t('admin.content.pages.slugHint')"
          :required="true"
          :error="errors.slug"
          @input="handleSlugInput"
        />

      </TFormGroup>

      <TFormGroup>
        <TInputSelect
          v-model="formData.project_id"
          :label="t('admin.content.pages.project')"
          :options="projectOptions"
          :placeholder="t('admin.content.pages.projectPlaceholder')"
          :required="true"
          :error="errors.project_id"
        />

        <TInputSelect
          v-model="formData.template_id"
          :label="t('admin.content.pages.template')"
          :options="templateOptions"
          :placeholder="t('admin.content.pages.templatePlaceholder')"
        />

        <TInputSelect
          v-model="formData.language_code"
          :label="t('common.language')"
          :options="languageOptions"
          :required="true"
          :error="errors.language_code"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputText
          v-model="formData.meta_title"
          :label="t('admin.content.pages.metaTitle')"
          :placeholder="t('admin.content.pages.metaTitlePlaceholder')"
        />

        <TTextArea
          v-model="formData.meta_description"
          :label="t('admin.content.pages.metaDescription')"
          :placeholder="t('admin.content.pages.metaDescriptionPlaceholder')"
          :rows="2"
        />
      </TFormGroup>

      <TFormGroup>
        <TInputCheckbox
          v-model="formData.is_published"
          :label="t('admin.content.pages.published')"
          :hint="t('admin.content.pages.publishedHint')"
        />

        <TInputCheckbox
          v-model="formData.is_home"
          :label="t('admin.content.pages.isHome')"
          :hint="t('admin.content.pages.isHomeHint')"
        />
      </TFormGroup>

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

    <!-- Add Section Dialog is handled via popup service -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, inject } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TInputText,
  TTextArea,
  TFormGroup,
  TInputCheckbox,
  TInputSelect,
  type PopupService,
  type ToastService
} from '@tiko/ui'
import { Icons } from 'open-icon'
import { contentService,
  useI18n } from '@tiko/core'
import type { ContentPage, ContentProject, PageTemplate } from '@tiko/core'

interface Props {
  page?: ContentPage
  mode?: 'create' | 'edit'
  projects?: ContentProject[]
  onSave?: (data: Partial<ContentPage>) => Promise<void> | void
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  projects: () => []
})

const emit = defineEmits<{
  close: []
  save: [data: Partial<ContentPage>]
}>()

const bemm = useBemm('create-page-dialog')
const { t } = useI18n()
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// State
const templates = ref<PageTemplate[]>([])
const slugManuallyEdited = ref(props.mode === 'edit')
const formData = reactive({
  title: props.page?.title || '',
  slug: props.page?.slug || '',
  project_id: props.page?.project_id || '',
  template_id: props.page?.template_id || '',
  language_code: props.page?.language_code || 'en',
  meta_title: props.page?.seo_title || '',
  meta_description: props.page?.seo_description || '',
  is_published: props.page?.is_published ?? false,
  is_home: props.page?.is_home ?? false
})
const errors = reactive({
  title: '',
  slug: '',
  project_id: '',
  language_code: ''
})
const saving = ref(false)

// Computed
const projectOptions = computed(() => {
  if (!props.projects || !Array.isArray(props.projects)) {
    return []
  }
  return props.projects.map(project => ({
    value: project.id,
    label: project.name
  }))
})

const templateOptions = computed(() => {
  const options = [
    { value: '', label: t('admin.content.pages.noTemplate') }
  ]

  if (templates.value && Array.isArray(templates.value)) {
    templates.value.forEach(template => {
      if (template && template.id && template.name) {
        options.push({
          value: template.id,
          label: template.name
        })
      }
    })
  }

  return options
})

const languageOptions = computed(() => [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'ru', label: 'Русский' },
  { value: 'pl', label: 'Polski' },
  { value: 'sv', label: 'Svenska' },
  { value: 'ro', label: 'Română' },
  { value: 'el', label: 'Ελληνικά' }
])

const isValid = computed(() => {
  return formData.title.trim() !== '' &&
         formData.slug.trim() !== '' &&
         formData.project_id !== '' &&
         !Object.values(errors).some(error => error !== '')
})

// Watch for title changes to auto-generate slug
watch(() => formData.title, (newTitle) => {
  // Only auto-generate if user hasn't manually edited the slug
  if (!slugManuallyEdited.value && props.mode === 'create') {
    formData.slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
})

// Methods
async function loadTemplates() {
  try {
    // Only load templates if we have a project selected
    if (formData.project_id) {
      templates.value = await contentService.getPageTemplates(formData.project_id)
    } else {
      templates.value = []
    }
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
}

async function handleSlugInput() {
  // Mark that user has manually edited the slug
  slugManuallyEdited.value = true

  // Validate slug format (alphanumeric and hyphens only)
  if (formData.slug && !/^[a-z0-9-]*$/.test(formData.slug)) {
    errors.slug = t('admin.content.pages.slugError')
  } else {
    errors.slug = ''

    // Check for duplicate slug in the same language
    if (formData.project_id && formData.slug && formData.language_code) {
      try {
        const existingPages = await contentService.getPages(formData.project_id, formData.language_code)
        const duplicate = existingPages.find(page =>
          page.slug === formData.slug &&
          page.language_code === formData.language_code &&
          (props.mode === 'create' || page.id !== props.page?.id)
        )

        if (duplicate) {
          errors.slug = t('admin.content.pages.slugDuplicateError')
        }
      } catch (error) {
        console.error('Failed to check for duplicate slug:', error)
      }
    }
  }
}


function handleClose() {
  if (props.onClose) {
    props.onClose()
  }
  emit('close')
}

async function handleSave() {
  console.log('CreatePageDialog: handleSave called')

  // Validate
  if (!formData.title.trim()) {
    errors.title = t('validation.required')
    return
  }

  if (!formData.slug.trim()) {
    errors.slug = t('validation.required')
    return
  }

  if (!formData.project_id) {
    errors.project_id = t('validation.required')
    return
  }

  if (!isValid.value) {
    console.log('CreatePageDialog: Form is not valid', errors)
    return
  }

  saving.value = true

  try {
    const pageData: Partial<ContentPage> = {
      ...(props.mode === 'edit' && props.page?.id ? { id: props.page.id } : {}),
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      project_id: formData.project_id,
      template_id: formData.template_id && formData.template_id.trim() !== '' ? formData.template_id : undefined,
      seo_title: formData.meta_title.trim() || formData.title.trim(),
      seo_description: formData.meta_description.trim(),
      is_published: formData.is_published,
      is_home: formData.is_home,
      language_code: formData.language_code
    }

    console.log('CreatePageDialog: Calling save handler with data:', pageData)

    // Call the prop callback if provided
    if (props.onSave) {
      await props.onSave(pageData)
      console.log('CreatePageDialog: onSave prop callback completed')
    } else {
      // Fallback to emit for backwards compatibility
      emit('save', pageData)
      console.log('CreatePageDialog: Save event emitted (no onSave prop)')
    }
  } catch (error) {
    console.error('CreatePageDialog: Failed to prepare page data:', error)
    toastService?.show({
      message: 'Failed to save page. Please check the console for details.',
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Watchers
watch(() => formData.project_id, () => {
  loadTemplates()
})

// Auto-generate slug from title in create mode
watch(() => formData.title, (newTitle) => {
  if (props.mode === 'create' && !formData.slug && newTitle) {
    formData.slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
})

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style lang="scss">
.create-page-dialog {
  display: flex;
  flex-direction: column;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
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
      margin: 0;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
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
