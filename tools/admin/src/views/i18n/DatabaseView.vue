<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <div>
        <h1>{{ t('admin.i18n.database.title') }}</h1>
        <p>{{ t('admin.i18n.database.description') }}</p>
      </div>
      <div :class="bemm('header-actions')">
        <TButton
          @click="router.push({ name: 'I18nLanguages' })"
          :icon="Icons.SPEECH_BALLOON"
          type="outline"
        >
          {{ t('admin.i18n.database.viewLanguages') }}
        </TButton>
      </div>
    </div>

    <!-- Upload Section -->
    <div :class="bemm('upload-section')">
      <h2>{{ t('admin.i18n.database.upload.title') }}</h2>
      <div :class="bemm('upload-box')">
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
        >
          {{ t('admin.i18n.database.upload.button') }}
        </TButton>
        <p :class="bemm('upload-help')">
          {{ t('admin.i18n.database.upload.help') }}
        </p>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploadStatus" :class="bemm('upload-status')">
        <p>{{ uploadStatus }}</p>
        <TProgressBar v-if="uploadProgress > 0" :value="uploadProgress" />
      </div>
    </div>

    <!-- Stats Section -->
    <TKeyValue :class="bemm('stats')" :items="[
      { key: t('admin.i18n.database.stats.totalKeys'), value: stats.totalKeys },
      { key: t('admin.i18n.database.stats.totalLanguages'), value: stats.totalLanguages },
      { key: t('admin.i18n.database.stats.totalTranslations'), value: stats.totalTranslations }
    ]" />
    <!-- Keys List -->
    <div :class="bemm('keys-section')">


      <!-- Keys List -->
      <TList
        :columns="[
          { key: 'key', label: t('admin.i18n.database.keys.key'), width: '40%' },
          { key: 'category', label: t('admin.i18n.database.keys.category'), width: '20%' },
          { key: 'description', label: t('admin.i18n.database.keys.description'), width: '25%' },
          { key: 'translations', label: t('admin.i18n.database.keys.translations'), width: '15%' }
        ]"
        :striped="true"
        :bordered="true"
        :hover="true"
      >
        <template #header>
          <h4>{{ t('admin.i18n.database.keys.title') }}</h4>

<!-- Search -->
<TInputText
  v-model="searchQuery"
  :placeholder="t('admin.i18n.database.keys.search')"
  :icon="Icons.SEARCH_M"
  :class="bemm('search')"
/>
        </template>
        <TListItem
          v-for="key in filteredKeys"
          :key="key.id"
          :clickable="true"
          @click="viewKeyDetails(key)"
        >
          <TListCell type="text" :content="key.key" />
          <TListCell type="custom">
            <span :class="bemm('category-badge')">
              {{ key.category || '-' }}
            </span>
          </TListCell>
          <TListCell type="text" :content="key.description || '-'" />
          <TListCell type="custom">
            <div :class="bemm('translation-count')">
              <span :class="bemm('translation-count-text')">
                {{ key.translationCount }} / {{ stats.totalLanguages }}
              </span>
              <TProgressBar
                :value="(key.translationCount / stats.totalLanguages) * 100"
                :class="bemm('translation-progress')"
                size="small"
              />
            </div>
          </TListCell>
        </TListItem>
      </TList>

      <div v-if="filteredKeys.length === 0" :class="bemm('empty')">
        <p v-if="keys.length === 0">
          {{ t('admin.i18n.database.keys.empty') }}
        </p>
        <p v-else>
          {{ t('admin.i18n.database.keys.noResults') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'

import { TButton, TInputText, TList, TListItem,TListCell, TProgressBar, useI18n, TKeyValue, AddTranslationKeyDialog, ToastService } from '@tiko/ui'
import { useI18nDatabaseService } from '@tiko/core'

import type { I18nKey } from '../../types/i18n.types'
import type { PopupService } from '@tiko/ui'

const bemm = useBemm('i18n-database-view')
const { t } = useI18n()
const router = useRouter()
const translationService = useI18nDatabaseService()
const popupService = inject<PopupService>('popupService')
const toastService = inject<ToastService>('toastService')

// Data
const keys = ref<I18nKey[]>([])
const searchQuery = ref('')
const uploadStatus = ref('')
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement>()
const loading = ref(false)

// Stats
const stats = ref({
  totalKeys: 0,
  totalLanguages: 0,
  totalTranslations: 0
})

// Computed
const filteredKeys = computed(() => {
  if (!searchQuery.value) return keys.value

  const query = searchQuery.value.toLowerCase()
  return keys.value.filter(key =>
    key.key.toLowerCase().includes(query) ||
    key.category?.toLowerCase().includes(query) ||
    key.description?.toLowerCase().includes(query)
  )
})

// Methods
async function loadKeys() {
  loading.value = true
  try {
    // Get keys with translation counts in a single optimized query
    const data = await translationService.getKeysWithTranslationCounts()
    keys.value = data.map(key => ({
      ...key,
      translationCount: key.translation_count || 0
    }))

    // Load other stats
    await loadStats()
  } catch (error) {
    console.error('Failed to load keys:', error)
    // Check if it's an auth error
    if (error.message.includes('401')) {
      uploadStatus.value = t('admin.i18n.database.authError', 'Please make sure you are logged in and have the necessary permissions.')
    } else if (error.message.includes('404')) {
      uploadStatus.value = t('admin.i18n.database.tablesNotFound', 'Translation tables not found. Please run the database migration.')
    } else {
      uploadStatus.value = t('admin.i18n.database.loadError', 'Failed to load translation keys: {error}', { error: error.message })
    }
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    // Only load languages, we already have the translation counts
    const languages = await translationService.getLanguages()

    // Calculate total translations from the keys we already loaded
    const totalTranslations = keys.value.reduce((sum, key) => sum + (key.translationCount || 0), 0)

    stats.value = {
      totalKeys: keys.value.length,
      totalLanguages: languages.filter(l => l.is_active).length,
      totalTranslations
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
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

    // Detect language code from filename (e.g., en.json, en-GB.json)
    const languageCode = file.name.replace('.json', '')

    // Check if language exists, create if not
    const languages = await translationService.getLanguages()
    const languageExists = languages.some(l => l.code === languageCode)

    if (!languageExists) {
      uploadStatus.value = t('admin.i18n.database.upload.creatingLanguage', 'Creating language: {code}', { code: languageCode })
      await translationService.createLanguage({
        code: languageCode,
        name: languageCode === 'en' ? 'English' : languageCode === 'fr' ? 'French' : languageCode,
        is_active: true
      })
      uploadProgress.value = 40
    }

    // Import the translations
    const result = await translationService.importTranslations(languageCode, data, {
      onProgress: (progress) => {
        uploadProgress.value = 40 + (progress * 0.6)
      }
    })

    uploadStatus.value = t('admin.i18n.database.upload.success', {
      count: result.importedCount,
      language: languageCode
    })
    uploadProgress.value = 100

    // Reload data
    await loadKeys()

    // Clear status after 5 seconds
    setTimeout(() => {
      uploadStatus.value = ''
      uploadProgress.value = 0
    }, 5000)

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

// View key details
function viewKeyDetails(key: I18nKey) {
  if (!popupService) {
    console.error('PopupService not available')
    return
  }

  popupService.open({
    component: AddTranslationKeyDialog,
    props: {
      mode: 'edit',
      editKey: {
        id: key.id,
        key: key.key,
        category: key.category,
        description: key.description
      },
      title: t('admin.i18n.editKey.title'),
      onSave: async (data) => {
        try {
          // Update the key details if changed
          if (data.category !== key.category || data.description !== key.description) {
            await translationService.updateTranslationKey(key.id, {
              category: data.category,
              description: data.description
            })
          }

          // Update translations
          for (const [localeCode, value] of Object.entries(data.translations)) {
            if (value) {
              await translationService.saveTranslation(data.key, localeCode, value)
            }
          }

          toastService?.show({
            message: t('admin.i18n.editKey.success'),
            type: 'success'
          })

          // Reload keys to show updated data
          await loadKeys()
        } catch (error) {
          console.error('Failed to update translation key:', error)
          toastService?.show({
            message: t('admin.i18n.editKey.error'),
            type: 'error'
          })
        }
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  // Only load if we're on this page
  if (router.currentRoute.value.name === 'I18nDatabase') {
    loadKeys().catch(error => {
      console.error('Failed to load keys on mount:', error)
      // Don't block the UI, just log the error
    })
  }
})
</script>

<style lang="scss">
.i18-n-database-view {
  display: flex;
  flex-direction: column;
  gap: var(--space);


  &__header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: var(--space-xl);

    h1 {
      font-size: var(--font-size-xxl);
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }

    p {
      color: var(--color-foreground-secondary);
    }
  }

  &__header-actions {
    display: flex;
    gap: var(--space);
  }

  &__upload-section {
    background: var(--color-background-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    margin-bottom: var(--space-xl);

    h2 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--space);
    }
  }

  &__upload-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space);
    padding: var(--space-lg);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius);
    background: var(--color-background);
  }

  &__upload-input {
    display: none;
  }

  &__upload-help {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    text-align: center;
  }

  &__upload-status {
    margin-top: var(--space);

    p {
      margin-bottom: var(--space-xs);
      color: var(--color-foreground);
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space);
    margin-bottom: var(--space-xl);
  }

  &__stat-card {
    background: var(--color-background-secondary);
    border-radius: var(--radius);
    padding: var(--space);
    text-align: center;

    h3 {
      font-size: var(--font-size-sm);
      color: var(--color-foreground-secondary);
      margin-bottom: var(--space-xs);
    }

    p {
      font-size: var(--font-size-xxl);
      font-weight: bold;
      color: var(--color-primary);
    }
  }

  &__keys-section {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    h2 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--space);
    }
  }

  &__search {
    margin-bottom: var(--space);
    max-width: 400px;
  }

  &__translation-count {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxs);
  }

  &__translation-count-text {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__translation-progress {
    width: 100%;
    height: 4px;
  }

  &__category-badge {
    display: inline-block;
    padding: var(--space-xxs) var(--space-xs);
    background: var(--color-primary-10);
    color: var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
  }

  &__translation-count {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
  }

  &__empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-foreground-secondary);
  }
}
</style>
