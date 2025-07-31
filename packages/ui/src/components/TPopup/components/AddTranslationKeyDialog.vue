<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h2>{{ title || (props.mode === 'edit' ? t('admin.i18n.editKey.title') : t('admin.i18n.addKey.title')) }}</h2>
    </div>

    <div :class="bemm('content')">
      <!-- Key Details Section -->
      <div :class="bemm('section')">
        <h3>{{ t('admin.i18n.addKey.keyDetails') }}</h3>

        <TFormGroup>
        <TInputText
          v-model="keyData.key"
          :label="t('admin.i18n.addKey.keyName')"
          :placeholder="t('admin.i18n.addKey.keyNamePlaceholder')"
          :required="true"
          :error="errors.key"
          :loading="checkingKey"
          :disabled="props.mode === 'edit'"
          @input="handleKeyInput"
        />

        <TInputText
          v-model="keyData.category"
          :label="t('admin.i18n.addKey.category')"
          :placeholder="t('admin.i18n.addKey.categoryPlaceholder')"
        />

        <TTextArea
          v-model="keyData.description"
          :label="t('admin.i18n.addKey.description')"
          :placeholder="t('admin.i18n.addKey.descriptionPlaceholder')"
          :rows="2"
        />
        </TFormGroup>
      </div>

      <!-- Translations Section -->
      <div :class="bemm('section')">
        <div :class="bemm('section-header')">
          <h3>{{ t('admin.i18n.addKey.translations') }}</h3>
          <TButton
            size="small"
            type="outline"
            :icon="Icons.STAR_M"
            @click="generateAllTranslations"
            :status="generatingAll ? 'loading' : 'idle'"
            :disabled="!englishTranslation || generatingAll"
          >
            {{ t('admin.i18n.addKey.generateAll') }}
          </TButton>
        </div>

        <div :class="bemm('translations-list')">
          <div
            v-for="lang in activeLanguages"
            :key="lang.code"
            :class="bemm('translation-item', { primary: lang.code === 'en' })"
          >
            <div :class="bemm('translation-header')">
              <div :class="bemm('language-info')">
                <span :class="bemm('language-code')">{{ lang.code }}</span>
                <span :class="bemm('language-name')">{{ lang.name }}</span>
              </div>
              <TButton
                v-if="lang.code !== 'en'"
                type="default"
                size="small"
                :icon="Icons.STAR_SMALL"
                @click="generateTranslation(lang.code)"
                :status="translations[lang.code]?.loading ? 'loading' : 'idle'"
                :disabled="!englishTranslation || translations[lang.code]?.loading"
                :title="t('admin.i18n.addKey.generateTranslation')"
              />
            </div>

            <TInputText
              v-model="translations[lang.code].value"
              :placeholder="t('admin.i18n.addKey.translationPlaceholder')"
              :rows="2"
              :error="translations[lang.code].error"
              @input="translations[lang.code].error = ''"
            />

            <div v-if="translations[lang.code].error" :class="bemm('error-message')">
              {{ translations[lang.code].error }}
            </div>
          </div>
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
import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { TButton, TInputText, TTextArea, useI18n } from '@tiko/ui'
import { useI18nDatabaseService, gptTranslationService } from '@tiko/core'
import type { Language } from '@tiko/core'
import type { AddTranslationKeyDialogProps, LanguageTranslation } from './AddTranslationKeyDialog.model'
import TFormGroup from '../../TForm/TFormGroup.vue'

const props = withDefaults(defineProps<AddTranslationKeyDialogProps>(), {
  title: '',
  mode: 'create'
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('add-translation-key-dialog')
const { t } = useI18n()
const translationService = useI18nDatabaseService()

// Debug props
console.log('AddTranslationKeyDialog props:', props)
console.log('Mode:', props.mode)
console.log('EditKey:', props.editKey)

// State
const activeLanguages = ref<Language[]>([])
const keyData = reactive({
  key: '',
  category: '',
  description: ''
})
const translations = ref<Record<string, LanguageTranslation>>({})
const errors = reactive({
  key: ''
})
const saving = ref(false)
const generatingAll = ref(false)
const checkingKey = ref(false)
let keyCheckTimeout: NodeJS.Timeout | null = null

// Computed
const englishTranslation = computed(() => {
  return translations.value['en']?.value || ''
})

const isValid = computed(() => {
  return keyData.key.trim() !== '' &&
         englishTranslation.value.trim() !== '' &&
         !errors.key &&
         !checkingKey.value
})

// Methods
async function checkKeyExists(key: string): Promise<boolean> {
  if (!key.trim()) return false

  // Skip validation in edit mode
  if (props.mode === 'edit') return false

  try {
    const exists = await translationService.keyExists(key.trim())
    return exists
  } catch (error) {
    console.error('Error checking if key exists:', error)
    return false
  }
}

function handleKeyInput() {
  errors.key = ''

  // Skip validation in edit mode
  if (props.mode === 'edit') return

  // Clear previous timeout
  if (keyCheckTimeout) {
    clearTimeout(keyCheckTimeout)
  }

  // Auto-populate category from key
  if (keyData.key.includes('.')) {
    const parts = keyData.key.split('.')
    keyData.category = parts[0]
  }

  // Debounced key validation
  const key = keyData.key.trim()
  if (!key) return

  keyCheckTimeout = setTimeout(async () => {
    checkingKey.value = true

    try {
      const exists = await checkKeyExists(key)
      if (exists) {
        errors.key = t('admin.i18n.addKey.keyExists', 'Key already exists')
      }
    } catch (error) {
      console.error('Error validating key:', error)
      errors.key = t('admin.i18n.addKey.validationError', 'Error validating key')
    } finally {
      checkingKey.value = false
    }
  }, 500) // 500ms delay
}

async function loadLanguages() {
  try {
    const allLanguages = await translationService.getActiveLanguages()

    // Filter to only base languages (no region codes)
    const baseLanguages = allLanguages.filter(lang => {
      // Keep only languages without hyphens (base languages like 'en', 'de', 'fr')
      return !lang.code.includes('-')
    })

    activeLanguages.value = baseLanguages.sort((a, b) => {
      // Put English first
      if (a.code === 'en') return -1
      if (b.code === 'en') return 1
      return a.name.localeCompare(b.name)
    })

    // Initialize translations object
    const translationsObj: Record<string, LanguageTranslation> = {}
    for (const lang of baseLanguages) {
      translationsObj[lang.code] = {
        code: lang.code,
        name: lang.name,
        value: '',
        loading: false,
        error: ''
      }
    }
    translations.value = translationsObj
  } catch (error) {
    console.error('Failed to load languages:', error)
  }
}

async function generateTranslation(targetLanguage: string) {
  if (!englishTranslation.value) return

  const translation = translations.value[targetLanguage]
  if (!translation) return

  translation.loading = true
  translation.error = ''

  try {
    const result = await gptTranslationService.translate({
      text: englishTranslation.value,
      sourceLocale: 'en',
      targetLocale: targetLanguage,
      context: keyData.description || keyData.key
    })

    translation.value = result
  } catch (error) {
    console.error(`Failed to generate translation for ${targetLanguage}:`, error)
    translation.error = t('admin.i18n.addKey.generationError')
  } finally {
    translation.loading = false
  }
}

async function generateAllTranslations() {
  if (!englishTranslation.value) return

  generatingAll.value = true

  // Generate translations for all non-English languages in parallel
  const promises = activeLanguages.value
    .filter(lang => lang.code !== 'en')
    .map(lang => generateTranslation(lang.code))

  await Promise.allSettled(promises)
  generatingAll.value = false
}

function handleClose() {
  emit('close')
}

async function handleSave() {
  // Validate
  if (!keyData.key.trim()) {
    errors.key = t('admin.i18n.addKey.keyRequired')
    return
  }

  if (!englishTranslation.value.trim()) {
    const englishLang = translations.value['en']
    if (englishLang) {
      englishLang.error = t('admin.i18n.addKey.englishRequired')
    }
    return
  }

  saving.value = true

  try {
    // Prepare translations data
    const translationsData: Record<string, string> = {}
    for (const [code, translation] of Object.entries(translations.value)) {
      if (translation.value.trim()) {
        translationsData[code] = translation.value.trim()
      }
    }

    await props.onSave?.({
      key: keyData.key.trim(),
      category: keyData.category.trim() || undefined,
      description: keyData.description.trim() || undefined,
      translations: translationsData
    })

    handleClose()
  } catch (error) {
    console.error('Failed to save translation key:', error)
  } finally {
    saving.value = false
  }
}

// Initialize for edit mode
async function initializeEditMode() {
  if (props.mode === 'edit' && props.editKey) {
    console.log('Edit mode - initializing with key:', props.editKey)
    keyData.key = props.editKey.key
    keyData.category = props.editKey.category || ''
    keyData.description = props.editKey.description || ''

    // Load existing translations
    try {
      console.log('Current translations object:', translations.value)
      const existingTranslations = await translationService.getTranslationsForKeyString(props.editKey.key)
      console.log('Loaded translations for key:', props.editKey.key, existingTranslations)

      // Update the translations values
      for (const translation of existingTranslations) {
        // Try both locale_code and language_code
        const langCode = translation.locale_code || translation.language_code
        console.log('Processing translation:', langCode, translation.value)
        console.log('Translation object for lang:', translations.value[langCode])

        if (langCode && translations.value[langCode]) {
          translations.value[langCode].value = translation.value
          console.log('Updated translation for', langCode, 'to:', translation.value)
        } else {
          console.warn('Language code not found in translations object:', langCode)
        }
      }
      console.log('Final translations after update:', translations.value)
    } catch (error) {
      console.error('Failed to load existing translations:', error)
    }
  }
}

// Watch for prop changes
watch(() => props.editKey, async (newVal) => {
  console.log('EditKey prop changed:', newVal)
  if (newVal && props.mode === 'edit') {
    // Ensure languages are loaded first
    if (activeLanguages.value.length === 0) {
      await loadLanguages()
    }
    await initializeEditMode()
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  console.log('Component mounted, props:', props)
  await loadLanguages()
  // Use nextTick to ensure DOM and reactive values are updated
  await nextTick()
  await initializeEditMode()
})
</script>

<style lang="scss">
.add-translation-key-dialog {
  display: flex;
  flex-direction: column;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);

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
    margin-bottom: var(--space-xl);

    &:last-child {
      margin-bottom: 0;
    }

    h3 {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-foreground);
      margin-bottom: var(--space);
    }
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__translations-list {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__translation-item {
    background: var(--color-background-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    padding: var(--space);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);

    &--primary {
      background: var(--color-primary-alpha-10);
      border-color: var(--color-primary-alpha-30);
    }
  }

  &__translation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xs);
  }

  &__language-info {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__language-code {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-s);
    font-weight: 600;
    color: var(--color-foreground);
  }

  &__language-name {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__error-message {
    margin-top: var(--space-xxs);
    font-size: var(--font-size-s);
    color: var(--color-error);
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
