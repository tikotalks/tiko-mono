<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ mode === 'edit' ? t('admin.content.projects.edit') : t('admin.content.projects.create') }}</h2>
    </div>

    <div :class="bemm('content')">
      <TFormGroup>
        <TInputText
          v-model="formData.name"
          :label="t('common.name')"
          :placeholder="t('admin.content.projects.namePlaceholder')"
          :required="true"
          :error="errors.name"
        />

        <TInputText
          v-model="formData.slug"
          :label="t('common.slug')"
          :placeholder="t('admin.content.projects.slugPlaceholder')"
          :required="true"
          :error="errors.slug"
          @input="handleSlugInput"
        />

        <TTextArea
          v-model="formData.description"
          :label="t('common.description')"
          :placeholder="t('admin.content.projects.descriptionPlaceholder')"
          :rows="3"
        />
      </TFormGroup>

      <div :class="bemm('section')">
        <h3>{{ t('admin.content.projects.languages') }}</h3>
        <p :class="bemm('help-text')">{{ t('admin.content.projects.languagesHelp') }}</p>

        <div :class="bemm('language-grid')">
          <label
            v-for="lang in availableLanguages"
            :key="lang.code"
            :class="bemm('language-option')"
          >
            <input
              type="checkbox"
              :value="lang.code"
              v-model="formData.languages"
              @change="validateLanguages"
            />
            <span>{{ lang.name }} ({{ lang.code }})</span>
          </label>
        </div>
        <div v-if="errors.languages" :class="bemm('error')">
          {{ errors.languages }}
        </div>
      </div>

      <TFormGroup v-if="formData.languages.length > 0">
        <TInputSelect
          v-model="formData.default_language"
          :label="t('admin.content.projects.defaultLanguage')"
          :options="selectedLanguageOptions"
          :required="true"
          :error="errors.default_language"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TInputText,
  TTextArea,
  TFormGroup,
  TInputSelect
} from '@tiko/ui'
import { translationService,
  useI18n } from '@tiko/core'
import type { ContentProject, Language } from '@tiko/core'

interface Props {
  project?: ContentProject
  mode?: 'create' | 'edit'
  onSave?: (data: Partial<ContentProject>) => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('create-project-dialog')
const { t } = useI18n()

// State
const availableLanguages = ref<Language[]>([])
const slugManuallyEdited = ref(props.mode === 'edit')
const formData = reactive({
  name: props.project?.name || '',
  slug: props.project?.slug || '',
  description: props.project?.description || '',
  languages: props.project?.languages || [],
  default_language: props.project?.default_language || '',
  is_active: props.project?.is_active ?? true
})
const errors = reactive({
  name: '',
  slug: '',
  languages: '',
  default_language: ''
})
const saving = ref(false)

// Computed
const selectedLanguageOptions = computed(() => {
  return formData.languages.map(code => {
    const lang = availableLanguages.value.find(l => l.code === code)
    return {
      value: code,
      label: lang ? `${lang.name} (${code})` : code
    }
  })
})

const isValid = computed(() => {
  return formData.name.trim() !== '' &&
         formData.slug.trim() !== '' &&
         formData.languages.length > 0 &&
         formData.default_language !== '' &&
         !Object.values(errors).some(error => error !== '')
})

// Watch for name changes to auto-generate slug
watch(() => formData.name, (newName) => {
  // Only auto-generate if user hasn't manually edited the slug
  if (!slugManuallyEdited.value && props.mode === 'create') {
    formData.slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
})

// Methods
async function loadLanguages() {
  try {
    availableLanguages.value = await translationService.getActiveLanguages()
  } catch (error) {
    console.error('Failed to load languages:', error)
  }
}

function handleSlugInput() {
  // Mark that user has manually edited the slug
  slugManuallyEdited.value = true

  // Validate slug format
  if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
    errors.slug = t('admin.content.projects.slugError')
  } else {
    errors.slug = ''
  }
}

function validateLanguages() {
  if (formData.languages.length === 0) {
    errors.languages = t('admin.content.projects.languagesRequired')
  } else {
    errors.languages = ''
  }

  // Reset default language if not in selected languages
  if (!formData.languages.includes(formData.default_language)) {
    formData.default_language = formData.languages[0] || ''
  }
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

  validateLanguages()

  if (!isValid.value) return

  saving.value = true

  try {
    await props.onSave?.({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      languages: formData.languages,
      default_language: formData.default_language,
      is_active: formData.is_active
    })

    handleClose()
  } catch (error) {
    console.error('Failed to save project:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadLanguages()
})
</script>

<style lang="scss">
.create-project-dialog {
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

  &__section {
    margin: var(--space-lg) 0;

    h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }
  }

  &__help-text {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space);
  }

  &__language-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-xs);
  }

  &__language-option {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs);
    cursor: pointer;

    input {
      cursor: pointer;
    }

    span {
      font-size: var(--font-size-sm);
    }

    &:hover {
      background: var(--color-background-secondary);
      border-radius: var(--border-radius);
    }
  }

  &__error {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin-top: var(--space-xs);
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
