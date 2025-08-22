<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <!-- Mode Toggle for Create Mode -->
      <TButtonGroup v-if="mode === 'create'" :class="bemm('mode-toggle')">
        <TButton
          :type="!batchMode  ? 'default' : 'outline'"
          size="small"
          @click="batchMode = false"
        >
          {{ t('admin.i18n.addKey.singleMode') }}
        </TButton>
        <TButton
          :type="batchMode  ? 'default' : 'outline'"
          size="small"
          @click="batchMode = true"
        >
          {{ t('admin.i18n.addKey.batchMode') }}
        </TButton>
      </TButtonGroup>
    </div>

    <div :class="bemm('content')">
      <!-- Single Mode -->
      <template v-if="!batchMode">
        <!-- Key Details Section -->
        <div :class="bemm('section')">
          <h3>{{ t('admin.i18n.addKey.keyDetails') }}</h3>

          <TCard>

          <TFormGroup>
            <TInputText
              v-model="keyData.key"
              :label="t('admin.i18n.addKey.keyName')"
              :placeholder="t('admin.i18n.addKey.keyNamePlaceholder')"
              :required="true"
              :inline="true"
              :error="errors.key ? [errors.key as string] : undefined"
              :loading="checkingKey"
              :disabled="props.mode === 'edit'"
              @input="handleKeyInput"
            />

            <TInputText
              v-model="keyData.category"
              :inline="true"
              :label="t('admin.i18n.addKey.category')"
              :placeholder="t('admin.i18n.addKey.categoryPlaceholder')"
            />

            <TTextArea
              v-model="keyData.description"
              :inline="true"
              :label="t('admin.i18n.addKey.description')"
              :placeholder="t('admin.i18n.addKey.descriptionPlaceholder')"
              :rows="2"
            />
          </TFormGroup>
        </TCard>

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

              <TInputText
                v-model="translations[lang.code].value"
                :placeholder="t('admin.i18n.addKey.translationPlaceholder')"
                :rows="2"
                :label="lang.name"
                :inline="true"
                :error="translations[lang.code].error ? [translations[lang.code].error as string] :  undefined"
                @input="translations[lang.code].error = ''"
                :style="{width: '100%'}"
              />

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

              <div v-if="translations[lang.code].error" :class="bemm('error-message')">
                {{ translations[lang.code].error }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Batch Mode -->
      <template v-else>
        <div :class="bemm('section')">
          <h3>{{ t('admin.i18n.addKey.batchInstructions') }}</h3>
          <p :class="bemm('help-text')">
            {{ t('admin.i18n.addKey.batchHelpText') }}
          </p>

          <!-- Bulk Key Input -->
          <div :class="bemm('bulk-input-section')">
            <h3>{{ t('admin.i18n.addKey.bulkInputTitle') }}</h3>
            <TTextArea
              v-model="bulkKeysInput"
              :label="t('admin.i18n.addKey.bulkKeysLabel')"
              :placeholder="t('admin.i18n.addKey.bulkKeysPlaceholder')"
              :rows="4"
              @input="updateBulkPreview"
            />
            <p :class="bemm('bulk-help')">
              {{ t('admin.i18n.addKey.bulkKeysHelp') }}
            </p>

            <!-- Preview section -->
            <div v-if="bulkPreviewKeys.length > 0" :class="bemm('bulk-preview')">
              <div :class="bemm('bulk-preview-header')">
                <h4>{{ t('admin.i18n.addKey.previewTitle') }} ({{ bulkPreviewKeys.length }})</h4>
                <TButton
                  type="outline"
                  size="small"
                  :icon="Icons.ADD"
                  @click="addBulkKeysToEntries"
                  :disabled="bulkPreviewKeys.length === 0"
                >
                  {{ t('admin.i18n.addKey.addToEntries') }}
                </TButton>
              </div>
              <div :class="bemm('bulk-preview-keys')">
                <TChip
                  v-for="(key, index) in bulkPreviewKeys"
                  :key="index"
                  :class="bemm('preview-key', { duplicate: isDuplicateKey(key) })"
                  :title="isDuplicateKey(key) ? t('admin.i18n.addKey.duplicateKey') : ''"
                >
                  {{ key }}
                </TChip>
              </div>
            </div>
          </div>

          <div :class="bemm('section')">
            <h3>{{ t('admin.i18n.addKey.translationEntries') }}</h3>

            <div :class="bemm('batch-entries')">
            <div v-if="batchEntries.length === 0" :class="bemm('no-entries')">
              {{ t('admin.i18n.addKey.noEntriesYet') }}
            </div>
            <TCard
              v-for="(entry, index) in batchEntries"
              :key="index"
              :removable="true"
              :title="`${index}`"
              @remove="removeBatchEntry(index)"
              :class="bemm('batch-entry', ['',!!entry.error ? 'error' : '', batchProgress.current === index ? 'processing' : '', batchProgress.current < index ? 'done' : '', batchProgress.current > index ? 'todo' : ''])"
              >
            <TFormGroup>

                <TInputText
                  v-model="entry.key"
                  :label="t('admin.i18n.addKey.keyName')"
                  :placeholder="t('admin.i18n.addKey.keyNamePlaceholder')"
                  :required="true"
                  :inline="true"
                  :error="entry.error ? [entry.error as string] : undefined"
                  @input="handleBatchKeyInput(index)"
                />

                <TInputText
                  v-model="entry.englishValue"
                  :inline="true"
                  :label="t('admin.i18n.addKey.englishTranslation')"
                  :placeholder="t('admin.i18n.addKey.englishTranslationPlaceholder')"
                  :required="true"
                />
              </TFormGroup>

            </TCard>

            <TButton
              type="outline"
              :icon="Icons.ADD"
              @click="addBatchEntry"
              :class="bemm('add-batch-button')"
            >
              {{ t('admin.i18n.addKey.addAnother') }}
            </TButton>
          </div>

          <div :class="bemm('batch-progress')" v-if="batchProgress.show">
            <TProgressBar
              :value="batchProgress.current"
              :max="batchProgress.total"
              :label="batchProgress.message"
            />
          </div>
          </div>
        </div>
      </template>
    </div>

    <div :class="bemm('footer')">
      <TButton type="outline" @click="handleClose">
        {{ t('common.cancel') }}
      </TButton>

      <template v-if="!batchMode">
        <TButton
          type="outline"
          color="primary"
          @click="handleGenerateAndSave"
          :status="generatingAndSaving ? 'loading' : 'idle'"
          :disabled="!englishTranslation.trim() || !keyData.key.trim() || errors.key || checkingKey"
          :icon="Icons.STAR_M"
        >
          {{ t('admin.i18n.addKey.generateAndSave') }}
        </TButton>
        <TButton
          color="primary"
          @click="handleSave"
          :status="saving ? 'loading' : 'idle'"
          :disabled="!isValid"
        >
          {{ t('common.save') }}
        </TButton>
      </template>

      <template v-else>
        <TButton
          color="primary"
          @click="handleBatchGenerateAndSave"
          :status="batchSaving ? 'loading' : 'idle'"
          :disabled="!isBatchValid"
          :icon="Icons.STAR_M"
        >
          {{ t('admin.i18n.addKey.batchGenerateAndSave') }}
          <span v-if="validBatchEntriesCount < batchEntries.length">
            ({{ validBatchEntriesCount }}/{{ batchEntries.length }})
          </span>
        </TButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { TButton, TInputText, TTextArea, TProgressBar, TChip, TButtonGroup, TCard, TAlert, TFormGroup, parseTranslationKeys, extractKeys, createKeyValueMap } from '@tiko/ui'
import { useI18nDatabaseService, gptTranslationService, useI18n } from '@tiko/core'
import type { Language } from '@tiko/core'
import type { AddTranslationKeyDialogProps, LanguageTranslation } from './AddTranslationKeyDialog.model'

interface BatchEntry {
  key: string
  englishValue: string
  error: string
}

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

// State
const batchMode = ref(false)
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
const batchSaving = ref(false)
const generatingAll = ref(false)
const generatingAndSaving = ref(false)
const checkingKey = ref(false)
let keyCheckTimeout: NodeJS.Timeout | null = null

// Batch mode state
const batchEntries = ref<BatchEntry[]>([])
const bulkKeysInput = ref('')
const bulkPreviewKeys = ref<string[]>([])
const batchProgress = reactive({
  show: false,
  current: 0,
  total: 0,
  message: ''
})

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

const isBatchValid = computed(() => {
  // At least one valid entry without errors
  return batchEntries.value.some(entry =>
    entry.key.trim() !== '' &&
    entry.englishValue.trim() !== '' &&
    !entry.error
  )
})

const validBatchEntriesCount = computed(() => {
  return batchEntries.value.filter(entry =>
    entry.key.trim() !== '' &&
    entry.englishValue.trim() !== '' &&
    !entry.error
  ).length
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
        errors.key = t('admin.i18n.addKey.keyExists')
      }
    } catch (error) {
      console.error('Error validating key:', error)
      errors.key = t('admin.i18n.addKey.validationError')
    } finally {
      checkingKey.value = false
    }
  }, 500) // 500ms delay
}

async function handleBatchKeyInput(index: number) {
  const entry = batchEntries.value[index]
  entry.error = ''

  if (!entry.key.trim()) return

  // Check for duplicates within batch
  const duplicateIndex = batchEntries.value.findIndex((e, i) =>
    i !== index && e.key.trim() === entry.key.trim()
  )

  if (duplicateIndex !== -1) {
    entry.error = t('admin.i18n.addKey.duplicateInBatch', 'Duplicate key in batch')
    return
  }

  // Check if key exists in database
  try {
    const exists = await checkKeyExists(entry.key)
    if (exists) {
      entry.error = t('admin.i18n.addKey.keyExists', 'Key already exists')
    }
  } catch (error) {
    console.error('Error validating batch key:', error)
  }
}

function addBatchEntry() {
  batchEntries.value.push({ key: '', englishValue: '', error: '' })
}

function removeBatchEntry(index: number) {
  batchEntries.value.splice(index, 1)
}

function updateBulkPreview() {
  if (!bulkKeysInput.value.trim()) {
    bulkPreviewKeys.value = []
    return
  }

  const parsed = parseTranslationKeys(bulkKeysInput.value)
  bulkPreviewKeys.value = extractKeys(parsed)
}

function isDuplicateKey(key: string): boolean {
  // Check if key already exists in batch entries
  return batchEntries.value.some(entry => entry.key === key)
}

function addBulkKeysToEntries() {
  if (bulkPreviewKeys.value.length === 0) return

  // Parse the input to get key:value pairs
  const parsed = parseTranslationKeys(bulkKeysInput.value)
  const keyValueMap = createKeyValueMap(parsed)

  // Create batch entries for new keys
  const newEntries: BatchEntry[] = []

  for (const item of parsed) {
    // Skip if key already exists in batch
    if (!isDuplicateKey(item.key)) {
      newEntries.push({
        key: item.key,
        englishValue: item.value,
        error: ''
      })
    }
  }

  // Add new entries to batch
  if (newEntries.length > 0) {
    batchEntries.value.push(...newEntries)

    // Validate all new entries
    newEntries.forEach((entry) => {
      const actualIndex = batchEntries.value.findIndex(e => e.key === entry.key)
      if (actualIndex !== -1) {
        handleBatchKeyInput(actualIndex)
      }
    })
  }

  // Clear the bulk input and preview
  bulkKeysInput.value = ''
  bulkPreviewKeys.value = []

  // Show success message
  const addedCount = newEntries.length
  const skippedCount = parsed.length - addedCount
  if (addedCount > 0) {
    // You could show a toast here if needed
    console.log(`Added ${addedCount} keys, skipped ${skippedCount} duplicates`)
  }
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

async function handleGenerateAndSave() {
  // Validate key and English translation
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

  generatingAndSaving.value = true

  try {
    // First generate all translations
    await generateAllTranslations()

    // Then save everything
    await handleSave()
  } catch (error) {
    console.error('Failed to generate and save:', error)
  } finally {
    generatingAndSaving.value = false
  }
}

async function handleBatchGenerateAndSave() {
  // Filter out entries with errors
  const validEntries = batchEntries.value.filter(entry =>
    entry.key.trim() !== '' &&
    entry.englishValue.trim() !== '' &&
    !entry.error
  )

  if (validEntries.length === 0) {
    // Show error if no valid entries
    return
  }

  batchSaving.value = true
  batchProgress.show = true
  batchProgress.current = 0
  batchProgress.total = 100 // Using percentage now
  batchProgress.message = t('admin.i18n.addKey.preparingBatch', 'Preparing batch...')

  try {
    // Show info about skipped entries
    const skippedCount = batchEntries.value.length - validEntries.length
    if (skippedCount > 0) {
      console.log(`Skipping ${skippedCount} entries with errors`)
    }

    // First, check which keys exist and which need to be created
    batchProgress.message = t('admin.i18n.addKey.checkingKeys', 'Checking translation keys...')

    const keyNames = validEntries.map(entry => entry.key.trim())
    const existingKeys = await translationService.getTranslationKeysByNames(keyNames)

    // Create maps for existing keys
    const existingKeyMap = new Map<string, any>()
    for (const key of existingKeys) {
      existingKeyMap.set(key.key, key)
    }

    // Separate keys that need to be created vs updated
    const keysToCreate: any[] = []
    const keysToUpdate: any[] = []

    for (const entry of validEntries) {
      const keyName = entry.key.trim()
      const existingKey = existingKeyMap.get(keyName)

      if (existingKey) {
        keysToUpdate.push({
          ...existingKey,
          englishValue: entry.englishValue.trim()
        })
      } else {
        keysToCreate.push({
          key: keyName,
          category: keyName.includes('.') ? keyName.split('.')[0] : undefined,
          description: '',
          englishValue: entry.englishValue.trim()
        })
      }
    }

    let createdKeys: any[] = []
    let updatedKeys: any[] = []
    let createdTranslations: any[] = []
    let errors: string[] = []

    try {
      // Create new keys if any
      if (keysToCreate.length > 0) {
        batchProgress.message = t('admin.i18n.addKey.creatingKeys', `Creating ${keysToCreate.length} new keys...`)
        // Ensure all objects have the same keys (PostgREST requirement)
        const newKeys = await translationService.createTranslationKeysBatch(
          keysToCreate.map(k => ({
            key: k.key,
            category: k.category || '', // Ensure category is always present
            description: k.description || '' // Ensure description is always present
          }))
        )
        createdKeys = newKeys

        // Add created keys to the map
        for (let i = 0; i < newKeys.length; i++) {
          keysToCreate[i].id = newKeys[i].id
        }
      }

      // Combine all keys (existing + newly created) for translation
      const allKeysToProcess = [...keysToUpdate, ...keysToCreate]

      // Map key strings to IDs
      const keyIdMap = new Map<string, number>()
      for (const key of allKeysToProcess) {
        keyIdMap.set(key.key || key.key, key.id)
      }

      // Process each key and translate to all languages at once
      const allLanguages = activeLanguages.value
      const nonEnglishLanguages = allLanguages.filter(lang => lang.code !== 'en')
      const totalKeys = allKeysToProcess.length

      // Process keys one by one to handle failures gracefully
      for (let keyIndex = 0; keyIndex < allKeysToProcess.length; keyIndex++) {
        const keyData = allKeysToProcess[keyIndex]
        const keyId = keyData.id

        if (!keyId) continue

        batchProgress.message = t('admin.i18n.addKey.processingKey', `Processing key ${keyIndex + 1} of ${totalKeys}: ${keyData.key}`)

        const translationsForKey: any[] = []

        // First, add the English translation
        translationsForKey.push({
          key_id: keyId,
          language_code: 'en',
          value: keyData.englishValue,
          is_published: true
        })

        // Then, translate to all other languages at once if we have non-English languages
        if (nonEnglishLanguages.length > 0) {
          try {
            const targetLocales = nonEnglishLanguages.map(lang => lang.code)
            const translations = await gptTranslationService.translateToMultipleLanguages({
              text: keyData.englishValue,
              sourceLocale: 'en',
              targetLocales: targetLocales,
              context: keyData.key,
              key: keyData.key
            })

            // Add all translations for this key
            for (const [locale, translatedText] of Object.entries(translations)) {
              if (translatedText && !translatedText.startsWith('[AUTO-')) {
                translationsForKey.push({
                  key_id: keyId,
                  language_code: locale,
                  value: translatedText,
                  is_published: true
                })
              }
            }
          } catch (error) {
            console.error(`Failed to translate ${keyData.key} to multiple languages:`, error)
            // Add English fallback for all failed languages
            for (const lang of nonEnglishLanguages) {
              translationsForKey.push({
                key_id: keyId,
                language_code: lang.code,
                value: keyData.englishValue,
                is_published: true
              })
            }
          }
        }

        // Save all translations for this key at once
        if (translationsForKey.length > 0) {
          try {
            // Split into smaller batches if needed to avoid API limits
            const batchSize = 50
            for (let i = 0; i < translationsForKey.length; i += batchSize) {
              const batch = translationsForKey.slice(i, i + batchSize)
              const savedTranslations = await translationService.createTranslationsBatch(batch)
              createdTranslations.push(...savedTranslations)
            }
          } catch (error) {
            console.error(`Failed to save translations for key ${keyData.key}:`, error)
            errors.push(`Failed to save translations for key: ${keyData.key}`)
          }
        }

        // Update progress
        batchProgress.current = Math.round(((keyIndex + 1) / totalKeys) * 100)
      }
    } catch (error) {
      console.error('Failed to create keys:', error)
      errors.push('Failed to create translation keys')
    }

    // Prepare result
    const result = {
      createdKeys,
      updatedKeys: keysToUpdate,
      createdTranslations,
      errors
    }

    // Prepare detailed result
    const detailedResult = {
      ...result,
      skippedCount,
      totalAttempted: batchEntries.value.length,
      successCount: result.createdKeys.length + result.updatedKeys.length
    }

    // Always call onBatchSave with results, even if there were some errors
    props.onBatchSave?.(detailedResult)

    // Show success message if we processed keys
    if (result.createdKeys.length > 0 || result.updatedKeys.length > 0) {
      const message = []
      if (result.createdKeys.length > 0) {
        message.push(t('admin.i18n.addKey.createdCount', { count: result.createdKeys.length }))
      }
      if (result.updatedKeys.length > 0) {
        message.push(t('admin.i18n.addKey.updatedCount', { count: result.updatedKeys.length }))
      }
    }

    // Only close if all valid entries were saved successfully
    if (result.errors.length === 0 && (result.createdKeys.length > 0 || result.updatedKeys.length > 0)) {
      handleClose()
    } else if (result.errors.length > 0) {
      // Keep dialog open but clear successfully processed entries
      const processedKeys = new Set([
        ...result.createdKeys.map(k => k.key),
        ...result.updatedKeys.map(k => k.key)
      ])
      batchEntries.value = batchEntries.value.filter(entry =>
        !processedKeys.has(entry.key.trim())
      )
      // Reset progress
      batchProgress.show = false
    }
  } catch (error) {
    console.error('Failed to batch generate and save:', error)
  } finally {
    batchSaving.value = false
    batchProgress.show = false
  }
}

// Initialize for edit mode
async function initializeEditMode() {
  if (props.mode === 'edit' && props.editKey) {
    keyData.key = props.editKey.key
    keyData.category = props.editKey.category || ''
    keyData.description = props.editKey.description || ''

    // Load existing translations
    try {
      const existingTranslations = await translationService.getTranslationsForKeyString(props.editKey.key)

      // Update the translations values
      for (const translation of existingTranslations) {
        // Try both locale_code and language_code
        const langCode = translation.locale_code || translation.language_code
        if (langCode && translations.value[langCode]) {
          translations.value[langCode].value = translation.value
        } else {
          console.warn('Language code not found in translations object:', langCode)
        }
      }
    } catch (error) {
      console.error('Failed to load existing translations:', error)
    }
  }
}

// Watch for prop changes
watch(() => props.editKey, async (newVal) => {
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
  gap: var(--space);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);

    h2 {
      font-size: var(--font-size-l);
      font-weight: 600;
      color: var(--color-foreground);
    }
  }

  &__mode-toggle {
    display: flex;
    gap: var(--space-xs);

    .t-button {
      &.active {
        background-color: var(--color-primary);
        color: var(--color-primary-text);
      }
    }
  }

  &__content {

  }

  &__section {
    margin-bottom: var(--space-xl);

    &:last-child {
      margin-bottom: 0;
    }

    h3 {
      font-size: var(--font-size-m);
      font-weight: 600;
      color: var(--color-foreground);
      margin-bottom: var(--space);
    }
  }

  &__help-text {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space);
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
    border: 1px solid var(--color-primary);
    padding: var(--space);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-radius: var(--border-radius);

    gap: var(--space);

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

  // Batch mode styles
  &__bulk-input-section {
    margin-bottom: var(--space-xl);

    h3 {
      font-size: var(--font-size-m);
      font-weight: 600;
      color: var(--color-foreground);
      margin-bottom: var(--space);
    }
  }

  &__bulk-help {
    margin-top: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__bulk-preview {
    margin-top: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  &__bulk-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);

    h4 {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
    }
  }

  &__bulk-preview-keys {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  &__preview-key {
    display: inline-block;
    padding: var(--space-xs) var(--space-s);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-mono);

    &--duplicate {
      background: var(--color-error-alpha-10);
      border-color: var(--color-error-alpha-30);
      color: var(--color-error);
      text-decoration: line-through;
    }
  }

  &__batch-entries {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__no-entries {
    text-align: center;
    padding: var(--space-lg);
    color: var(--color-foreground-secondary);
    font-style: italic;
  }


  &__add-batch-button {
    align-self: flex-start;
    margin-top: var(--space);
  }

  &__batch-progress {
    margin-top: var(--space-lg);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius-md);
  }

  &__batch-entry{
    &--error{
      border-color: var(--color-error);
    }
    &--done{
      opacity: .5;
    }
    &--processing {
      border-color: var(--color-foreground);
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    padding: var(--space-lg);
    border: 1px solid var(--color-primary);
    background-color: var(--color-background);
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
    padding: var(--space);
    position: sticky;
    bottom: var(--space-l);
    border-radius: var(--border-radius);
    z-index: 10;
  }
}
</style>
