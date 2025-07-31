<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <div>
        <h1>{{ t('admin.i18n.import.title') }}</h1>
        <p>{{ t('admin.i18n.import.description') }}</p>
      </div>
      <div :class="bemm('header-actions')">
        <TButton
          @click="router.push({ name: 'I18nDatabase' })"
          :icon="Icons.DATABASE"
          type="outline"
        >
          {{ t('admin.i18n.import.backToDatabase') }}
        </TButton>
      </div>
    </div>

    <!-- Language Selection -->
    <div :class="bemm('section')">
      <h2>{{ t('admin.i18n.import.selectLanguage') }}</h2>
      <p :class="bemm('section-description')">
        {{ t('admin.i18n.import.selectLanguageDescription') }}
      </p>

      <TList
        :columns="[
          { key: 'name', label: t('common.language'), width: '30%', sortable: true },
          { key: 'code', label: t('common.code'), width: '15%', sortable: true },
          { key: 'completionPercentage', label: t('common.progress'), width: '35%', sortable: true },
          { key: 'status', label: t('common.status'), width: '20%' }
        ]"
        :striped="true"
        :bordered="true"
        :hover="true"
        :sortBy="sortBy"
        :sortDirection="sortDirection"
        @sort="handleSort"
      >
        <TListItem
          v-for="language in languagesWithStats"
          :key="language.code"
          :clickable="true"
          :selected="selectedLanguage?.code === language.code"
          @click="selectedLanguage = language"
        >
          <TListCell type="text">
            <div :class="bemm('language-name')">
              <strong>{{ language.name }}</strong>
              <span v-if="language.native_name" :class="bemm('native-name')">
                {{ language.native_name}}
              </span>
            </div>
          </TListCell>
          <TListCell type="text" :content="language.code" />
          <TListCell type="custom">
            <div :class="bemm('progress-cell')">
              <TProgressBar
                :value="language.completionPercentage"
                :max="100"
                :color="getProgressColor(language.completionPercentage)"
                size="small"
              />
              <span :class="bemm('percentage')">{{ language.completionPercentage }}%</span>
            </div>
          </TListCell>
          <TListCell type="custom">
            <span :class="bemm('status', getStatusClass(language.completionPercentage))">
              {{ getStatusText(language.completionPercentage) }}
            </span>
          </TListCell>
        </TListItem>
      </TList>
    </div>

    <!-- Selected Language Info -->
    <div v-if="selectedLanguage" :class="bemm('section', 'info')">
      <div :class="bemm('language-info')">
        <h3>{{ t('admin.i18n.import.selectedLanguage') }}: {{ selectedLanguage.name }}</h3>
        <div :class="bemm('language-stats')">
          <p><strong>{{ t('admin.i18n.import.currentProgress') }}:</strong> {{ selectedLanguage.completionPercentage }}%</p>
          <p><strong>{{ t('admin.i18n.import.missingTranslations') }}:</strong> {{ totalKeysCount - (selectedLanguage.translationCount || 0) }}</p>
        </div>
      </div>
    </div>

    <!-- File Upload -->
    <div v-if="selectedLanguage" :class="bemm('section')">
      <h2>{{ t('admin.i18n.import.uploadFile') }}</h2>
      <div :class="bemm('upload-area')" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
        <input
          type="file"
          ref="fileInput"
          accept=".json"
          @change="handleFileSelect"
          :class="bemm('file-input')"
        />
        <TIcon :name="Icons.ARROW_UPLOAD" size="large" />
        <h3>{{ t('admin.i18n.import.dragDropFile') }}</h3>
        <p>{{ t('admin.i18n.import.orBrowse') }}</p>
        <TButton @click="$refs.fileInput.click()" :icon="Icons.FILE" color="primary">
          {{ t('admin.i18n.import.browseFiles') }}
        </TButton>
      </div>
    </div>

    <!-- File Preview -->
    <div v-if="fileContent" :class="bemm('section')">
      <h2>{{ t('admin.i18n.import.preview') }}</h2>
      <div :class="bemm('preview')">
        <div :class="bemm('preview-header')">
          <h3>{{ fileName }}</h3>
          <TButton @click="clearFile" :icon="Icons.MULTIPLY" type="ghost" size="small">
            {{ t('common.clear') }}
          </TButton>
        </div>
        <div :class="bemm('preview-stats')">
          <TKeyValue :items="[
            { key: t('admin.i18n.import.totalKeys'), value: totalKeys },
            { key: t('admin.i18n.import.newKeys'), value: newKeysCount },
            { key: t('admin.i18n.import.existingKeys'), value: existingKeysCount }
          ]" />
        </div>
        <div :class="bemm('preview-content')">
          <pre>{{ previewContent }}</pre>
        </div>
      </div>
    </div>

    <!-- Import Options -->
    <div v-if="fileContent" :class="bemm('section')">
      <h2>{{ t('admin.i18n.import.options') }}</h2>
      <div :class="bemm('options')">
        <label :class="bemm('checkbox')">
          <input type="checkbox" v-model="publishImmediately" />
          <span>{{ t('admin.i18n.import.publishImmediately') }}</span>
        </label>
        <label :class="bemm('checkbox')">
          <input type="checkbox" v-model="overwriteExisting" />
          <span>{{ t('admin.i18n.import.overwriteExisting') }}</span>
        </label>
      </div>
    </div>

    <!-- Import Progress -->
    <div v-if="isImporting || importComplete" :class="bemm('section')">
      <h2>{{ t('admin.i18n.import.progress') }}</h2>
      <div :class="bemm('progress')">
        <TProgressBar :value="importProgress" :max="100" />
        <p>{{ progressMessage }}</p>

        <!-- Detailed Progress -->
        <div v-if="isImporting" :class="bemm('progress-details')">
          <p>{{ t('admin.i18n.import.processing', { current: processedKeys, total: totalKeys }) }}</p>
          <p v-if="currentKey">{{ t('admin.i18n.import.currentKey', { key: currentKey }) }}</p>
        </div>

        <!-- Results -->
        <div v-if="importComplete" :class="bemm('results')">
          <h3>{{ t('admin.i18n.import.complete') }}</h3>
          <TKeyValue :items="[
            { key: t('admin.i18n.import.keysCreated'), value: importResult.keys_created },
            { key: t('admin.i18n.import.translationsCreated'), value: importResult.translations_created },
            { key: t('admin.i18n.import.translationsUpdated'), value: importResult.translations_updated }
          ]" />

          <!-- Errors -->
          <div v-if="importResult.errors.length > 0" :class="bemm('errors')">
            <h4>{{ t('admin.i18n.import.errors') }}</h4>
            <ul>
              <li v-for="(error, index) in importResult.errors" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="fileContent && !isImporting" :class="bemm('actions')">
      <TButton
        @click="startImport"
        :disabled="!selectedLanguage"
        color="primary"
        size="large"
        :icon="Icons.UPLOAD"
      >
        {{ t('admin.i18n.import.startImport') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { TButton, TIcon, TProgressBar, TKeyValue, TList, TListItem, TListCell, useI18n, ToastService, Colors } from '@tiko/ui'
import { useI18nDatabaseService, useUserPreferences, USER_PREFERENCE_KEYS } from '@tiko/core'
import type { Language } from '@tiko/core'

interface LanguageWithStats extends Language {
  translationCount?: number
  totalKeys?: number
  completionPercentage?: number
}

const bemm = useBemm('i18n-import-view')
const { t } = useI18n()
const router = useRouter()
const translationService = useI18nDatabaseService()
const toastService = inject<ToastService>('toastService')
const { getListPreferences, updateListPreferences, loadPreferences } = useUserPreferences()

// State
const activeLanguages = ref<LanguageWithStats[]>([])
const selectedLanguage = ref<LanguageWithStats | null>(null)
const totalKeysCount = ref(0)
const sortBy = ref('completionPercentage')
const sortDirection = ref<'asc' | 'desc'>('asc')
const fileInput = ref<HTMLInputElement>()
const fileName = ref('')
const fileContent = ref<Record<string, any> | null>(null)
const publishImmediately = ref(true)
const overwriteExisting = ref(false)
const isImporting = ref(false)
const importComplete = ref(false)
const importProgress = ref(0)
const progressMessage = ref('')
const processedKeys = ref(0)
const totalKeys = ref(0)
const currentKey = ref('')
const newKeysCount = ref(0)
const existingKeysCount = ref(0)
const importResult = ref({
  keys_created: 0,
  translations_created: 0,
  translations_updated: 0,
  errors: [] as string[]
})

// Computed
const previewContent = computed(() => {
  if (!fileContent.value) return ''
  const preview = JSON.stringify(fileContent.value, null, 2)
  return preview.length > 1000 ? preview.substring(0, 1000) + '...' : preview
})

const languagesWithStats = computed(() => {
  let result = activeLanguages.value
    .map(lang => ({
      ...lang,
      completionPercentage: lang.completionPercentage || 0
    }))

  // Apply sorting
  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      let aVal = a[sortBy.value] || '';
      let bVal = b[sortBy.value] || '';

      // Handle numeric values
      if (sortBy.value === 'completionPercentage') {
        aVal = a.completionPercentage || 0;
        bVal = b.completionPercentage || 0;
      }

      // Convert to strings for comparison if not numbers
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (sortDirection.value === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  return result;
})

// Methods
function handleSort(column: string, direction: 'asc' | 'desc') {
  sortBy.value = column;
  sortDirection.value = direction;

  // Save preferences
  updateListPreferences(USER_PREFERENCE_KEYS.LISTS.I18N_IMPORT_LANGUAGES, {
    sortBy: column,
    sortDirection: direction
  });
}

async function loadLanguages() {
  try {
    // Get languages and stats in parallel
    const [languages, keys, languageDetails] = await Promise.all([
      translationService.getActiveLanguages(),
      translationService.getTranslationKeys(),
      translationService.getLanguageDetails()
    ])

    totalKeysCount.value = keys.length

    // Filter to base languages and add stats
    const baseLanguages = languages.filter(lang => !lang.code.includes('-'))

    // Create a map of language stats from details
    const statsMap = new Map(languageDetails.map(detail => [
      detail.code,
      {
        translationCount: detail.translation_count,
        completionPercentage: detail.completion_percentage
      }
    ]))

    // Merge languages with their stats
    activeLanguages.value = baseLanguages.map(lang => ({
      ...lang,
      translationCount: statsMap.get(lang.code)?.translationCount || 0,
      totalKeys: totalKeysCount.value,
      completionPercentage: statsMap.get(lang.code)?.completionPercentage || 0
    }))
  } catch (error) {
    console.error('Failed to load languages:', error)
    toastService?.show({
      message: t('admin.i18n.import.loadLanguagesError'),
      type: 'error'
    })
  }
}

// Helper methods for status display
function getProgressColor(percentage: number): Colors {
  if (percentage >= 100) return Colors.SUCCESS
  if (percentage >= 80) return Colors.PRIMARY
  if (percentage >= 50) return Colors.WARNING
  return Colors.ERROR
}

function getStatusClass(percentage: number): string {
  if (percentage >= 100) return 'complete'
  if (percentage >= 80) return 'good'
  if (percentage >= 50) return 'partial'
  return 'incomplete'
}

function getStatusText(percentage: number): string {
  if (percentage >= 100) return t('common.complete')
  if (percentage >= 80) return t('common.good')
  if (percentage >= 50) return t('common.partial')
  return t('common.incomplete')
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFile(target.files[0])
  }
}

async function processFile(file: File) {
  if (!file.name.endsWith('.json')) {
    toastService?.show({
      message: t('admin.i18n.import.invalidFileType'),
      type: 'error'
    })
    return
  }

  fileName.value = file.name

  try {
    const text = await file.text()
    const json = JSON.parse(text)
    fileContent.value = json

    // Analyze the file
    await analyzeFile(json)
  } catch (error) {
    toastService?.show({
      message: t('admin.i18n.import.parseError'),
      type: 'error'
    })
    console.error('Failed to parse JSON:', error)
  }
}

async function analyzeFile(json: Record<string, any>) {
  const flatKeys = flattenObject(json)
  totalKeys.value = Object.keys(flatKeys).length

  // Check which keys already exist
  try {
    const existingKeys = await translationService.getTranslationKeys()
    const existingKeySet = new Set(existingKeys.map(k => k.key))

    newKeysCount.value = 0
    existingKeysCount.value = 0

    for (const key of Object.keys(flatKeys)) {
      if (existingKeySet.has(key)) {
        existingKeysCount.value++
      } else {
        newKeysCount.value++
      }
    }
  } catch (error) {
    console.error('Failed to analyze keys:', error)
  }
}

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey))
    } else if (typeof value === 'string') {
      result[newKey] = value
    }
  }

  return result
}

function clearFile() {
  fileName.value = ''
  fileContent.value = null
  totalKeys.value = 0
  newKeysCount.value = 0
  existingKeysCount.value = 0
  importComplete.value = false
  importResult.value = {
    keys_created: 0,
    translations_created: 0,
    translations_updated: 0,
    errors: []
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function startImport() {
  if (!selectedLanguage.value || !fileContent.value) return

  isImporting.value = true
  importComplete.value = false
  importProgress.value = 0
  processedKeys.value = 0
  progressMessage.value = t('admin.i18n.import.starting')

  try {
    const result = await translationService.importTranslations(
      selectedLanguage.value.code,
      fileContent.value,
      {
        publishImmediately: publishImmediately.value,
        onProgress: (progress) => {
          importProgress.value = Math.round(progress * 100)
          processedKeys.value = Math.floor(progress * totalKeys.value)

          if (progress < 1) {
            progressMessage.value = t('admin.i18n.import.importing')
          } else {
            progressMessage.value = t('admin.i18n.import.finalizing')
          }
        }
      }
    )

    importResult.value = {
      keys_created: result.importedCount,
      translations_created: result.importedCount,
      translations_updated: 0,
      errors: result.errors
    }

    importComplete.value = true
    progressMessage.value = t('admin.i18n.import.success')

    toastService?.show({
      message: t('admin.i18n.import.successMessage', { count: result.importedCount }),
      type: 'success'
    })
  } catch (error) {
    console.error('Import failed:', error)
    progressMessage.value = t('admin.i18n.import.failed')
    toastService?.show({
      message: t('admin.i18n.import.errorMessage'),
      type: 'error'
    })
  } finally {
    isImporting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Load user preferences first
  await loadPreferences();

  // Apply saved preferences
  const savedPrefs = getListPreferences(USER_PREFERENCE_KEYS.LISTS.I18N_IMPORT_LANGUAGES);
  if (savedPrefs.sortBy) {
    sortBy.value = savedPrefs.sortBy;
  }
  if (savedPrefs.sortDirection) {
    sortDirection.value = savedPrefs.sortDirection;
  }

  // Then load languages
  loadLanguages()
})
</script>

<style lang="scss">
.i18-n-import-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-xl);


  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      font-size: var(--font-size-2xl);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0;
    }

    p {
      color: var(--color-foreground-secondary);
      margin-top: var(--space-xs);
    }
  }

  &__header-actions {
    display: flex;
    gap: var(--space);
  }

  &__section {
    background: var(--color-background-secondary);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);

    h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      margin-bottom: var(--space);
    }
  }

  &__section-description {
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space);
  }

  &__language-name {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);

    strong {
      color: var(--color-foreground);
    }
  }

  &__native-name {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    font-style: italic;
  }

  &__progress-cell {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    width: 100%;
  }

  &__percentage {
    font-size: var(--font-size-s);
    font-weight: 600;
    min-width: 45px;
    text-align: right;
  }

  &__status {
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-s);
    font-weight: 500;

    &--complete {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    &--good {
      background: var(--color-primary-bg);
      color: var(--color-primary);
    }

    &--partial {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    &--incomplete {
      background: var(--color-error-bg);
      color: var(--color-error);
    }
  }

  &__section--info {
    background: var(--color-primary-bg);
    border: 1px solid var(--color-primary);
  }

  &__language-info {
    h3 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--space);
      color: var(--color-primary);
    }
  }

  &__language-stats {
    display: flex;
    gap: var(--space-xl);

    p {
      margin: 0;
      color: var(--color-foreground);

      strong {
        color: var(--color-primary);
      }
    }
  }

  &__upload-area {
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-2xl);
    text-align: center;
    background: var(--color-background);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-bg);
    }

    h3 {
      margin: var(--space) 0 var(--space-xs);
      font-size: var(--font-size-lg);
    }

    p {
      color: var(--color-foreground-secondary);
      margin-bottom: var(--space);
    }
  }

  &__file-input {
    display: none;
  }

  &__preview {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-background-tertiary);

    h3 {
      margin: 0;
      font-size: var(--font-size-md);
    }
  }

  &__preview-stats {
    padding: var(--space);
    border-bottom: 1px solid var(--color-border);
  }

  &__preview-content {
    padding: var(--space);
    max-height: 300px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-size: var(--font-size-s);
      font-family: var(--font-family-mono);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    cursor: pointer;

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    span {
      font-size: var(--font-size-md);
    }
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__progress-details {
    p {
      margin: var(--space-xs) 0;
      color: var(--color-foreground-secondary);
    }
  }

  &__results {
    margin-top: var(--space-lg);
    padding: var(--space);
    background: var(--color-success-bg);
    border: 1px solid var(--color-success);
    border-radius: var(--radius-md);

    h3 {
      margin: 0 0 var(--space);
      color: var(--color-success);
    }
  }

  &__errors {
    margin-top: var(--space);
    padding: var(--space);
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);

    h4 {
      margin: 0 0 var(--space-xs);
      color: var(--color-error);
    }

    ul {
      margin: 0;
      padding-left: var(--space);
      color: var(--color-error);
      font-size: var(--font-size-s);
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    padding: var(--space-xl) 0;
  }
}
</style>
