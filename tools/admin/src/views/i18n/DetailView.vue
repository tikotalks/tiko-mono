<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="language?.name || languageCode"
      :description="t('admin.i18n.language.description')"
    >
      <template #actions>
        <TButton
          type="ghost"
          :icon="Icons.ARROW_LEFT"
          @click="router.push({ name: 'I18nLanguages' })"
        >
          {{ t('common.back') }}
        </TButton>
        <TChip
          :color="language?.is_active ? Colors.SUCCESS : Colors.WARNING"
        >{{ language?.is_active ? t('common.active') : t('common.inactive') }}</TChip>
        <TButton
          @click="exportTranslations"
          :icon="Icons.ARROW_DOWNLOAD"
          type="outline"
        >
          {{ t('admin.i18n.language.export') }}
        </TButton>
        <TButton
          @click="showUploadDialog = true"
          :icon="Icons.ARROW_UPLOAD"
          color="primary"
        >
          {{ t('admin.i18n.language.import') }}
        </TButton>
      </template>

      <template #stats>
        <TKeyValue
          :items="[
            { key: t('admin.i18n.language.totalKeys'), value: String(stats.totalKeys) },
            { key: t('admin.i18n.language.translated'), value: String(stats.translatedKeys) },
            { key: t('admin.i18n.language.missing'), value: String(stats.missingKeys) },
            { key: t('admin.i18n.language.coverage'), value: `${stats.coveragePercent}%` }
          ]"
        />
      </template>
    </AdminPageHeader>


    <!-- Filter Controls -->
    <div :class="bemm('controls')">
      <TInputText
        v-model="searchQuery"
        :placeholder="t('admin.i18n.language.searchPlaceholder')"
        :icon="Icons.SEARCH_M"
        :class="bemm('search')"
      />

      <TInputSelect
        v-model="filterMode"
        :options="[
          { value: 'all', label: t('admin.i18n.language.showAll') },
          { value: 'translated', label: t('admin.i18n.language.showTranslated') },
          { value: 'missing', label: t('admin.i18n.language.showMissing') }
        ]"
        :class="bemm('filter')"
      />
    </div>

    <!-- Results Count -->
    <div :class="bemm('results-info')">
      <span v-if="searchQuery || filterMode !== 'all'">
        {{ t('admin.i18n.language.showingResults', {
          shown: sortedTranslations.length,
          total: keys.length
        }) || `Showing ${sortedTranslations.length} of ${keys.length}` }}
      </span>
      <span v-else>
        {{ t('admin.i18n.language.totalResults', { total: keys.length }) || `Total: ${keys.length} translations` }}
      </span>
    </div>

    <!-- Translations List -->
    <div :class="bemm('translations-section')">
      <TList
        :columns="[
          { key: 'select', label: '', width: '5%' },
          { key: 'key', label: t('admin.i18n.language.key'), width: '30%', sortable: true },
          { key: 'value', label: t('admin.i18n.language.translation'), width: '50%', sortable: true },
          { key: 'actions', label: t('admin.i18n.language.actions'), width: '15%' }
        ]"
        :striped="true"
        :bordered="true"
        :hover="true"
        :show-stats="true"
        :sortBy="sortBy"
        :sortDirection="sortDirection"
        @sort="handleSort"
      >
        <TListItem
          v-for="item in sortedTranslations"
          :key="item.key.id"
          :selected="selectedKeys.has(item.key.id)"
          @click="handleRowClick($event, item.key.id)"
          :class="bemm('list-item', { clickable: true })"
        >
          <TListCell key="select" type="custom">
            <TInputCheckbox
              :model-value="selectedKeys.has(item.key.id)"
              @update:model-value="toggleSelection(item.key.id)"
            />
          </TListCell>
          <TListCell key="key" type="custom">
            <div :class="bemm('key-cell')">
              <span :class="[bemm('key-text'),'id']">
                <span>{{ item.key.key }}</span>
              </span>
            </div>
          </TListCell>
          <TListCell key="value" type="custom">
            <TInputText
              v-if="editingKeyId === item.key.id"
              v-model="editingValue"
              :class="bemm('edit-input')"
              @keyup.enter="saveTranslation(item.key)"
              @keyup.escape="cancelEdit"
            />
            <span v-else :class="bemm('translation-value', { missing: !item.translation })">
              {{ item.translation?.value || t('admin.i18n.language.missingTranslation') }}
            </span>
          </TListCell>
          <TListCell key="actions" type="custom">
            <div :class="bemm('actions')">
              <template v-if="editingKeyId === item.key.id">
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.CHECK_M"
                  @click="saveTranslation(item.key)"
                  :title="t('common.save')"
                />
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.MULTIPLY_M"
                  @click="cancelEdit"
                  :title="t('common.cancel')"
                />
              </template>
              <template v-else>
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.EDIT_M"
                  @click="startEdit(item)"
                  :title="t('common.edit')"
                />
                <TButton
                  v-if="!item.translation"
                  type="ghost"
                  size="small"
                  :icon="Icons.SPARKLE"
                  @click="autoTranslate(item.key)"
                  :loading="translatingKeys.has(item.key.id)"
                  :title="t('admin.i18n.language.autoTranslate')"
                />
              </template>
            </div>
          </TListCell>
        </TListItem>
      </TList>

      <div v-if="loading" :class="bemm('loading')">
        <TSpinner />
      </div>

      <div v-if="!loading && filteredTranslations.length === 0" :class="bemm('empty')">
        <p>{{ t('admin.i18n.language.noResults') }}</p>
      </div>
    </div>

    <!-- Selection Status Bar -->
    <TStatusBar :show="selectedKeys.size > 0">
      <div :class="bemm('selection-status')">
        <div :class="bemm('selection-info')">
          <TIcon :name="Icons.CHECK_M" />
          <span>
            {{ t('admin.i18n.common.itemsSelected', { count: selectedCount }) || `${selectedCount} items selected` }}
          </span>
          <span :class="bemm('selection-filter-info')">
            {{ t('admin.i18n.language.showingResults', {
              shown: sortedTranslations.length,
              total: keys.length
            }) || `Showing ${sortedTranslations.length} of ${keys.length}` }}
          </span>
        </div>

        <div :class="bemm('selection-actions')">
          <TButtonGroup>
          <TButton
            size="small"
            :color="Colors.SECONDARY"
            :icon="Icons.STAR_L"
            @click="generateAITranslations"
            :loading="generatingAI"
            :disabled="selectedKeys.size === 0"
          >
            {{ t('admin.i18n.language.generateWithAI') }}
          </TButton>

          <TButton
            size="small"
            type="outline"
            :icon="Icons.CHECK_M"
            @click="selectAll"
            v-if="selectedKeys.size < filteredTranslations.length"
          >
            {{ t('common.selectAll') }}
          </TButton>

          <TButton
            size="small"
            type="outline"
            :icon="Icons.MULTIPLY_M"
            @click="clearSelection"
          >
            {{ t('common.clearSelection') }}
          </TButton></TButtonGroup>
        </div>
      </div>
    </TStatusBar>

    <!-- Upload Dialog -->
    <TPopupWrapper
      v-if="showUploadDialog"
      :title="t('admin.i18n.language.importTitle')"
      @close="showUploadDialog = false"
    >
      <div :class="bemm('upload-modal')">
        <input
          type="file"
          accept=".json"
          @change="handleFileUpload"
          :class="bemm('upload-input')"
          ref="fileInput"
        />
        <TButton
          @click="$refs.fileInput.click()"
          :icon="Icons.UPLOAD"
          color="primary"
          :class="bemm('upload-button')"
        >
          {{ t('admin.i18n.language.selectFile') }}
        </TButton>

        <div v-if="uploadStatus" :class="bemm('upload-status')">
          <p>{{ uploadStatus }}</p>
          <TProgressBar v-if="uploadProgress > 0" :value="uploadProgress" />
        </div>
      </div>
    </TPopupWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { TPopupWrapper, TButton, TList, TListCell, TListItem, TChip, TInputText, TInputSelect, TButtonGroup, TStatusBar, TIcon, TInputCheckbox, TKeyValue, Colors, TProgressBar, TSpinner } from '@tiko/ui'
import type { ToastService, PopupService } from '@tiko/ui'
import { Icons } from 'open-icon'
import { useI18nDatabaseService, gptTranslationService, useI18n } from '@tiko/core'
import type { Language, TranslationKey, Translation } from '@tiko/core'
import AdminPageHeader from '@/components/AdminPageHeader.vue'

const bemm = useBemm('i18n-language-detail-view')
const { t, refreshTranslations } = useI18n()
const route = useRoute()
const router = useRouter()
const translationService = useI18nDatabaseService()

// Route params
const languageCode = computed(() => route.params.code as string)

// Data
const language = ref<Language | null>(null)
const keys = ref<TranslationKey[]>([])
const translations = ref<Map<number, Translation>>(new Map())
const searchQuery = ref('')
const filterMode = ref<'all' | 'translated' | 'missing'>('all')
const editingKeyId = ref<number | null>(null)
const editingValue = ref('')
const translatingKeys = ref<Set<number>>(new Set())
const loading = ref(false)
const showUploadDialog = ref(false)
const uploadStatus = ref('')
const uploadProgress = ref(0)
const selectedKeys = ref<Set<number>>(new Set())
const generatingAI = ref(false)
const lastSelectedIndex = ref<number | null>(null)
const sortBy = ref<string>('key')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Selection count
const selectedCount = computed(() => selectedKeys.value.size)

// Stats
const stats = computed(() => {
  const totalKeys = keys.value.length
  const translatedKeys = Array.from(translations.value.values()).filter(t => t.value).length
  const missingKeys = totalKeys - translatedKeys
  const coveragePercent = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0

  return {
    totalKeys,
    translatedKeys,
    missingKeys,
    coveragePercent
  }
})

// Filtered translations
const filteredTranslations = computed(() => {
  const items = keys.value.map(key => ({
    key,
    translation: translations.value.get(key.id) || null
  }))

  // Apply filter mode
  let filtered = items
  if (filterMode.value === 'translated') {
    filtered = items.filter(item => item.translation?.value)
  } else if (filterMode.value === 'missing') {
    filtered = items.filter(item => !item.translation?.value)
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.key.key.toLowerCase().includes(query) ||
      item.key.description?.toLowerCase().includes(query) ||
      item.translation?.value?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Selection computed
const hasSelectedMissingTranslations = computed(() => {
  return Array.from(selectedKeys.value).some(keyId => {
    const key = keys.value.find(k => k.id === keyId)
    return key && !translations.value.get(keyId)?.value
  })
})

// Sorted translations
const sortedTranslations = computed(() => {
  const sorted = [...filteredTranslations.value]

  sorted.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy.value) {
      case 'key':
        aValue = a.key.key
        bValue = b.key.key
        break
      case 'value':
        aValue = a.translation?.value || ''
        bValue = b.translation?.value || ''
        break
      default:
        aValue = a.key.key
        bValue = b.key.key
    }

    // String comparison
    const compareResult = String(aValue).localeCompare(String(bValue))
    return sortDirection.value === 'asc' ? compareResult : -compareResult
  })

  return sorted
})

// Methods
function handleSort(column: string, direction: 'asc' | 'desc') {
  sortBy.value = column
  sortDirection.value = direction
}

async function loadData() {
  loading.value = true
  try {
    // Load language
    const languages = await translationService.getLanguages()
    language.value = languages.find(l => l.code === languageCode.value) || null

    if (!language.value) {
      console.error('Language not found:', languageCode.value)
      return
    }

    // Load all keys
    keys.value = await translationService.getTranslationKeys()

    // Load translations for this language
    const translationsMap = await translationService.getTranslationsForLanguage(languageCode.value)

    // Convert to map by key name
    const keyMap = new Map(keys.value.map(k => [k.key, k]))
    translations.value = new Map()

    for (const [keyName, value] of Object.entries(translationsMap)) {
      const key = keyMap.get(keyName)
      if (key) {
        translations.value.set(key.id, {
          id: 0, // We don't have the actual ID from the flat response
          key_id: key.id,
          language_code: languageCode.value,
          value,
          version: 1,
          is_published: true,
          created_at: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function startEdit(item: { key: TranslationKey; translation: Translation | null }) {
  editingKeyId.value = item.key.id
  editingValue.value = item.translation?.value || ''
}

function cancelEdit() {
  editingKeyId.value = null
  editingValue.value = ''
}

async function saveTranslation(key: TranslationKey) {
  if (!editingValue.value.trim()) {
    cancelEdit()
    return
  }

  try {
    await translationService.createTranslation({
      key_id: key.id,
      language_code: languageCode.value,
      value: editingValue.value,
      is_published: true
    })

    // Update local state
    translations.value.set(key.id, {
      id: 0,
      key_id: key.id,
      language_code: languageCode.value,
      value: editingValue.value,
      version: 1,
      is_published: true,
      created_at: new Date().toISOString()
    })

    cancelEdit()

    // Refresh the global i18n cache so new translation is available immediately
    await refreshTranslations()
  } catch (error) {
    console.error('Failed to save translation:', error)
  }
}

async function autoTranslate(key: TranslationKey) {
  translatingKeys.value.add(key.id)
  try {
    // First find a source translation
    let sourceTranslation = null
    let sourceLanguage = null

    // Try different English variants
    const englishVariants = ['en', 'en-GB', 'en-US']
    for (const lang of englishVariants) {
      const translation = await translationService.getLatestTranslation(key.id, lang)
      if (translation?.value) {
        sourceTranslation = translation
        sourceLanguage = lang
        break
      }
    }

    if (!sourceTranslation) {
      throw new Error('No English source translation found')
    }

    // Generate AI translation directly using GPT service
    const aiTranslation = await gptTranslationService.translate({
      text: sourceTranslation.value,
      sourceLocale: sourceLanguage,
      targetLocale: languageCode.value,
      context: key.description
    })

    // Create the translation
    const newTranslation = await translationService.createTranslation({
      key_id: key.id,
      language_code: languageCode.value,
      value: aiTranslation,
      is_published: true, // Changed to true so it shows immediately
      notes: `AI-generated translation from ${sourceLanguage}`
    })

    // Update local state
    translations.value.set(key.id, {
      id: newTranslation.id || 0,
      key_id: key.id,
      language_code: languageCode.value,
      value: aiTranslation,
      version: newTranslation.version || 1,
      is_published: true, // Changed to match the created translation
      created_at: newTranslation.created_at || new Date().toISOString()
    })

    // Refresh the global i18n cache so new translation is available immediately
    await refreshTranslations()
  } catch (error) {
    console.error('Failed to auto-translate:', error)
    const toastService = inject<ToastService>('toastService')
    toastService?.show({
      message: error.message || 'Failed to generate translation',
      type: 'error',
      duration: 3000
    })
  } finally {
    translatingKeys.value.delete(key.id)
  }
}

async function exportTranslations() {
  try {
    const data = await translationService.exportToJSON(languageCode.value)

    // Create and download file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${languageCode.value}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export translations:', error)
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    uploadStatus.value = t('admin.i18n.database.upload.reading')
    uploadProgress.value = 10

    const text = await file.text()
    const data = JSON.parse(text)

    uploadStatus.value = t('admin.i18n.database.upload.processing')
    uploadProgress.value = 30

    const result = await translationService.importTranslations(
      languageCode.value,
      data,
      {
        onProgress: (progress) => {
          uploadProgress.value = 30 + (progress * 0.7)
        }
      }
    )

    uploadStatus.value = t('admin.i18n.database.upload.success', {
      count: result.importedCount,
      language: language.value?.name || languageCode.value
    })
    uploadProgress.value = 100

    // Reload data
    await loadData()

    // Close dialog after success
    setTimeout(() => {
      showUploadDialog.value = false
      uploadStatus.value = ''
      uploadProgress.value = 0
    }, 2000)

  } catch (error) {
    console.error('Upload failed:', error)
    uploadStatus.value = t('admin.i18n.database.upload.error', {
      error: error.message
    })
    uploadProgress.value = 0
  }

  // Clear file input
  target.value = ''
}

// Selection methods
function toggleSelection(keyId: number) {
  if (selectedKeys.value.has(keyId)) {
    selectedKeys.value.delete(keyId)
  } else {
    selectedKeys.value.add(keyId)
  }
}

function handleRowClick(event: MouseEvent, keyId: number) {
  const currentIndex = sortedTranslations.value.findIndex(item => item.key.id === keyId)

  // Cmd/Ctrl + Click: Toggle individual selection
  if (event.metaKey || event.ctrlKey) {
    event.preventDefault()
    toggleSelection(keyId)
    lastSelectedIndex.value = currentIndex
  }
  // Shift + Click: Range selection
  else if (event.shiftKey && lastSelectedIndex.value !== null) {
    event.preventDefault()
    const start = Math.min(lastSelectedIndex.value, currentIndex)
    const end = Math.max(lastSelectedIndex.value, currentIndex)

    // Select all items in the range
    for (let i = start; i <= end; i++) {
      const item = sortedTranslations.value[i]
      if (item) {
        selectedKeys.value.add(item.key.id)
      }
    }
  }
  // Regular click: Single selection (optional - you might want to disable this)
  else if (!event.target?.closest('.t-input-checkbox')) {
    // Only handle if not clicking on the checkbox itself
    event.preventDefault()
    selectedKeys.value.clear()
    selectedKeys.value.add(keyId)
    lastSelectedIndex.value = currentIndex
  }
}

function selectAll() {
  sortedTranslations.value.forEach(item => {
    selectedKeys.value.add(item.key.id)
  })
}

function clearSelection() {
  selectedKeys.value.clear()
}

async function generateAITranslations() {
  if (selectedKeys.value.size === 0) return

  generatingAI.value = true

  // Show progress dialog
  const popupService = inject<PopupService>('popupService')
  let progressDialogId: string | null = null

  try {
    const selectedKeyIds = Array.from(selectedKeys.value)

    if (selectedKeyIds.length === 0) return

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    let currentIndex = 0

    // Create a reactive progress state
    const progressState = reactive({
      title: t('admin.i18n.language.generatingTranslations'),
      progress: 0,
      total: selectedKeyIds.length,
      statusText: t('admin.i18n.language.loadingSourceTranslations'),
      showStats: true,
      successCount: 0,
      errorCount: 0,
      successLabel: t('admin.i18n.language.translated'),
      errorLabel: t('admin.i18n.language.failed'),
      currentItem: '',
      details: [] as Array<{ label: string; value: number; type: string }>
    })
    
    // Show progress dialog
    progressDialogId = popupService?.open({
      component: 'ProgressDialog',
      props: progressState,
      config: {
        canClose: false,
        background: true,
        position: 'center'
      }
    }) || null

    // Get all English translations in one batch to reduce API calls
    const englishVariants = ['en', 'en-GB', 'en-US']
    const englishTranslations = new Map<number, { value: string; language: string }>()

    // Batch load all English translations
    for (const lang of englishVariants) {
      const translationsForLang = await translationService.getTranslationsForLanguage(lang)
      for (const keyId of selectedKeyIds) {
        const key = keys.value.find(k => k.id === keyId)
        if (key && translationsForLang[key.key] && !englishTranslations.has(keyId)) {
          englishTranslations.set(keyId, {
            value: translationsForLang[key.key],
            language: lang
          })
        }
      }
    }

    // Process each key
    for (const keyId of selectedKeyIds) {
      currentIndex++

      // Update progress
      progressState.progress = currentIndex
      progressState.statusText = t('admin.i18n.language.translatingKey', {
        current: currentIndex,
        total: selectedKeyIds.length
      })
      progressState.currentItem = keys.value.find(k => k.id === keyId)?.key
      try {
        // Get the key details first
        const key = keys.value.find(k => k.id === keyId)
        if (!key) {
          console.error(`Key not found: ${keyId}`)
          errorCount++
          continue
        }

        // Get English translation from our batch-loaded map
        const englishTranslation = englishTranslations.get(keyId)

        if (!englishTranslation) {
          console.warn(`No English translation found in database for key "${key.key}" (ID: ${keyId})`)

          // If no source found at all
          console.error(`No source translation found for key "${key.key}"`)
          skippedCount++

          // Update progress dialog stats
          progressState.progress = currentIndex
          progressState.successCount = successCount
          progressState.errorCount = errorCount
          progressState.details = [{
            label: t('admin.i18n.language.skipped'),
            value: skippedCount,
            type: 'warning'
          }]

          continue
        }

        console.log(`Found ${englishTranslation.language} translation for key "${key.key}": "${englishTranslation.value}"`)

        // Generate AI translation directly using GPT service to avoid extra DB lookup
        const aiTranslation = await gptTranslationService.translate({
          text: englishTranslation.value,
          sourceLocale: englishTranslation.language,
          targetLocale: languageCode.value,
          context: key.description
        })

        // Update progress with current key name
        progressState.statusText = t('admin.i18n.language.savingTranslation', {
          key: key.key,
          current: currentIndex,
          total: selectedKeyIds.length
        })

        // Create the translation
        const newTranslation = await translationService.createTranslation({
          key_id: keyId,
          language_code: languageCode.value,
          value: aiTranslation,
          is_published: true, // Changed to true so it shows immediately
          notes: `AI-generated translation from ${englishTranslation.language}`
        })

        // Update local state immediately to show in UI (optimistic update)
        translations.value.set(keyId, {
          id: newTranslation.id || 0,
          key_id: keyId,
          language_code: languageCode.value,
          value: aiTranslation,
          version: newTranslation.version || 1,
          is_published: true,
          created_at: newTranslation.created_at || new Date().toISOString()
        })

        successCount++

        // Update progress dialog stats
        progressState.progress = currentIndex
        progressState.successCount = successCount
        progressState.errorCount = errorCount
      } catch (error) {
        console.error(`Failed to translate key ${keyId}:`, error)
        errorCount++

        // Update progress dialog stats
        progressState.progress = currentIndex
        progressState.successCount = successCount
        progressState.errorCount = errorCount
      }
    }

    console.log(`AI Translation complete: ${successCount} succeeded, ${errorCount} failed, ${skippedCount} skipped (no source)`)

    // Close progress dialog
    if (progressDialogId) {
      popupService?.close({ id: progressDialogId })
    }

    // Show results to user
    const toastService = inject<ToastService>('toastService')
    if (successCount > 0) {
      toastService?.show({
        message: t('admin.i18n.language.aiTranslationSuccess', {
          count: successCount,
          total: selectedKeyIds.length
        }),
        type: 'success',
        duration: 5000
      })
    }

    if (skippedCount > 0) {
      toastService?.show({
        message: t('admin.i18n.language.aiTranslationSkipped', {
          count: skippedCount,
          reason: 'No English source translation found in database'
        }),
        type: 'warning',
        duration: 7000
      })
    }

    if (errorCount > 0) {
      toastService?.show({
        message: t('admin.i18n.language.aiTranslationError', {
          count: errorCount
        }),
        type: 'error',
        duration: 5000
      })
    }

    // Clear selection after successful generation
    clearSelection()

    // Only refresh from database if we had successful translations
    if (successCount > 0) {
      const progressDialog = popupService?.open({
        component: 'ProgressDialog',
        props: {
          title: t('admin.i18n.language.updatingList'),
          progress: 100,
          statusText: t('admin.i18n.language.refreshingData'),
          indeterminate: true
        },
        config: {
          canClose: false,
          background: true,
          position: 'center'
        }
      })

      // Reload data from database to get real IDs and ensure consistency
      await loadData()

      // Refresh the global i18n cache so new translations are available immediately
      await refreshTranslations()

      if (progressDialog) {
        popupService?.close({ id: progressDialog })
      }
    }
  } catch (error) {
    console.error('Failed to generate AI translations:', error)
    if (progressDialogId) {
      popupService?.close({ id: progressDialogId })
    }

    const toastService = inject<ToastService>('toastService')
    toastService?.show({
      message: t('admin.i18n.language.aiTranslationFailed', {
        error: error.message
      }),
      type: 'error',
      duration: 5000
    })
  } finally {
    generatingAI.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Only load if we're on this page
  if (router.currentRoute.value.name === 'I18nLanguageDetail') {
    loadData().catch(error => {
      console.error('Failed to load language data on mount:', error)
      // Don't block the UI, just log the error
    })
  }
})
</script>

<style lang="scss">
.i18-n-language-detail-view {

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xl);
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: var(--space);

    h1 {
      font-size: var(--font-size-xxl);
      color: var(--color-foreground);
    }
  }

  &__header-actions {
    display: flex;
    gap: var(--space);
  }

  &__back-button {
    margin-right: var(--space);
  }


  &__controls {
    display: flex;
    gap: var(--space);
    margin-bottom: var(--space);
  }

  &__search {
    flex: 1;
    max-width: 400px;
  }

  &__filter {
    width: 200px;
  }

  &__results-info {
    margin-bottom: var(--space);
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    font-weight: 500;
  }

  &__translations-section {
    background: var(--color-background-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
  }

  &__key-cell {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxs);
  }

  &__key-text {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-s);
    color: var(--color-foreground);
  }

  &__key-category {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-secondary);
  }

  &__translation-value {
    color: var(--color-foreground);

    &--missing {
      color: var(--color-foreground-secondary);
      font-style: italic;
    }
  }

  &__edit-input {
    width: 100%;
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
  }

  &__empty {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-foreground-secondary);
  }

  &__upload-modal {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    padding: var(--space);
  }

  &__upload-input {
    display: none;
  }

  &__upload-button {
    align-self: center;
  }

  &__upload-status {
    text-align: center;

    p {
      margin-bottom: var(--space-xs);
      color: var(--color-foreground);
    }
  }

  &__selection-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
  }

  &__selection-info {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-foreground);
    font-weight: 500;
  }

  &__selection-filter-info {
    padding-left: var(--space);
    border-left: 1px solid var(--color-border);
    margin-left: var(--space-xs);
    font-weight: normal;
    color: var(--color-foreground-secondary);
  }

  &__selection-actions {
    display: flex;
    gap: var(--space-xs);
  }

  &__list-item {
    &--clickable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: var(--color-background-hover);
      }
    }
  }
}
</style>
