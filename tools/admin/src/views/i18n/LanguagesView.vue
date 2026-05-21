<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.i18n.languages.title')"
      :description="t('admin.i18n.languages.description')"
    >
      <template #actions>
        <TButton
          @click="openAddKeyDialog"
          :icon="Icons.EDIT_M"
          color="secondary"
        >
          {{ t('admin.i18n.addKeyLabel') }}
        </TButton>
        <TButton
          @click="openAddLanguageDialog"
          :icon="Icons.ADD_M"
          color="primary"
        >
          {{ t('admin.i18n.languages.addLanguage') }}
        </TButton>
        <TButton
          @click="forceReloadI18n"
          :icon="Icons.ARROW_RELOAD_DOWN_UP"
          :loading="reloadingI18n"
          :type="'icon-only'"
          :tooltip="t('admin.i18n.languages.forceReload')"
        />
      </template>
    </AdminPageHeader>

    <!-- Languages List -->
    <div :class="bemm('languages-section')">
      <div v-if="loading" :class="bemm('loading')">
        <TSpinner />
        <p>Loading languages...</p>
      </div>

      <div v-else-if="error" :class="bemm('error')">
        <p>{{ error }}</p>
        <TButton @click="loadLanguages" size="small">Retry</TButton>
      </div>

      <div v-else-if="languages.length === 0" :class="bemm('empty-state')">
        <p>{{ t('admin.i18n.languages.noLanguages') }}</p>
        <p>
          {{  t('admin.i18n.languages.checkDatabase')}}
        </p>
        <div :class="bemm('sql-instruction')">
          <p>Run this in your Supabase SQL editor:</p>
          <code>check-and-populate-languages.sql</code>
        </div>
      </div>

      <TList
        v-else
        :columns="[
          {
            key: 'code',
            label: t('common.code'),
            width: '50px',
            sortable: true,
          },
          {
            key: 'name',
            label: t('common.name'),
            width: '20%',
            sortable: true,
            desktopOnly: true,
          },
          {
            key: 'native_name',
            label: t('common.nativeName'),
            width: '20%',
            sortable: true,
          },
          {
            key: 'coverage',
            label: t('common.coverage'),
            width: '25%',
            sortable: true,
          },
          {
            key: 'status',
            label: t('common.statusLabel'),
            width: '10%',
            sortable: true,
          },
          {
            key: 'actions',
            label: t('common.actionsLabel'),
            width: '15%',
          },
        ]"
        :striped="true"
        :bordered="true"
        :hover="true"
        :sortBy="sortBy"
        :sortDirection="sortDirection"
        :show-stats="true"
        @sort="handleSort"
      >
        <TListItem
          v-for="language in sortedLanguages"
          :key="language.id"
          :data="language"
        >
          <TListCell key="code" type="id" :content="language.code" />
          <TListCell key="name" type="text" :content="language.name" />
          <TListCell
            key="native_name"
            type="text"
            :desktopOnly="true"
            :content="language.native_name || language.name"
          />
          <TListCell key="coverage" type="custom">
            <div :class="bemm('coverage')">
              <TProgressBar
                :value="language.coveragePercent || 0"
                :class="bemm('coverage-progress')"
                :showPercentage="true"
                :prefix="`${language.translationCount || 0 } / ${totalKeys}`"
                size="small"
                :color="getCoverageColor(language.coveragePercent)"
              />
            </div>
          </TListCell>
          <TListCell key="status" type="custom">
            <TChip
              :color="languageStatus(language).toLowerCase()"
            >{{ languageStatus(language) }}
            </TChip>
          </TListCell>
          <TListCell
            key="actions"
            type="actions"
            :actions="[
              listActions.custom({
                icon: Icons.ARROW_UPLOAD,
                color: 'primary',
                handler: () => uploadForLanguage(language),
                tooltip: t('admin.i18n.languages.uploadTranslations')
              }),
              listActions.view(() => viewLanguageDetails(language), {
                tooltip: t('admin.i18n.languages.viewDetails')
              }),
              listActions.custom({
                icon: language.is_active ? Icons.INVISIBLE_M : Icons.EYE,
                color: 'secondary',
                handler: () => toggleLanguageStatus(language),
                tooltip: language.is_active
                  ? t('admin.i18n.languages.deactivate')
                  : t('admin.i18n.languages.activate')
              })
            ]"
          />
        </TListItem>
      </TList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import {
  TList,
  TListCell,
  TListItem,
  TButton,
  TButtonGroup,
  TInputText,
  TSpinner,
  TProgressBar,
  TChip,
  Colors,
  listActions
} from '@tiko/ui';
import type { PopupService, ToastService, TranslationKeyData } from '@tiko/ui';
import { Icons } from 'open-icon';
import { useI18nDatabaseService,
  useI18n } from '@tiko/core';
import type { Language } from '@tiko/core';
import AdminPageHeader from '@/components/AdminPageHeader.vue';

const bemm = useBemm('i18n-languages-view');
const { t, refreshTranslations, locale } = useI18n();
const router = useRouter();
const translationService = useI18nDatabaseService();
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');


type ExtendedLanguage = Language & {
  translationCount?: number;
  coveragePercent?: number;
  pendingCount?: number;
};
// Data
const languages = ref<
  Array<ExtendedLanguage>
>([]);
const totalKeys = ref(0);
const uploadLanguage = ref<Language | null>(null);
const uploadStatus = ref('');
const uploadProgress = ref(0);
const showAddKeyDialog = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const reloadingI18n = ref(false);
const newLanguage = ref({
  code: '',
  name: '',
  native_name: '',
});
const sortBy = ref<string>('name');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Computed
const sortedLanguages = computed(() => {
  const sorted = [...languages.value];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy.value) {
      case 'code':
        aValue = a.code;
        bValue = b.code;
        break;
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'native_name':
        aValue = a.native_name || a.name;
        bValue = b.native_name || b.name;
        break;
      case 'coverage':
        aValue = a.coveragePercent || 0;
        bValue = b.coveragePercent || 0;
        break;
      case 'status':
        aValue = a.is_active ? 1 : 0;
        bValue = b.is_active ? 1 : 0;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    // Handle numeric vs string comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection.value === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // String comparison
    const compareResult = String(aValue).localeCompare(String(bValue));
    return sortDirection.value === 'asc' ? compareResult : -compareResult;
  });

  return sorted;
});

// Methods
function handleSort(column: string, direction: 'asc' | 'desc') {
  console.log('LanguagesView handleSort:', column, direction);
  sortBy.value = column;
  sortDirection.value = direction;
}

const languageStatus = (lang: ExtendedLanguage) => {
  const count = lang.translationCount || 0;
  const total = totalKeys.value;

  if (total === 0) return 'empty';

  const percentage = (count / total) * 100;

  if (percentage === 100) return t('common.status.completed');
  if (percentage > 99 || percentage < 75) return t('common.status.ready');
  if (percentage > 75 || percentage < 50) return t('common.status.in-progress');
  if (percentage > 50) return t('common.status.incomplete');
  if (percentage > 0) return t('common.status.empty');

  return 'empty';
};

async function loadLanguages() {
  loading.value = true;
  error.value = null;

  try {
    // First, get all languages
    const allLangs = await translationService.getLanguages();

    if (!allLangs || allLangs.length === 0) {
      languages.value = [];
      return;
    }

    // Filter to only show base languages (no region codes)
    const langs = allLangs.filter(lang => {
      return !lang.code.includes('-')
    });

    // Try to get language details, but don't fail if the view doesn't exist
    let languageDetails = [];
    try {
      languageDetails = await translationService.getLanguageDetails();
    } catch (detailError) {
      console.warn(
        'Could not load language details (view might not exist):',
        detailError,
      );
      // Continue without details
    }

    // If we have details, use them
    if (languageDetails.length > 0) {
      // Create a map of language details by code
      const detailsMap = new Map(
        languageDetails.map((detail) => [detail.code, detail]),
      );

      // Set total keys from the first language detail
      totalKeys.value = languageDetails[0].total_keys || 0;

      // Merge language data with statistics
      languages.value = langs.map((lang) => {
        const details = detailsMap.get(lang.code);

        return {
          ...lang,
          translationCount: details?.translation_count || 0,
          coveragePercent: details?.completion_percentage || 0,
          pendingCount: details?.pending_count || 0,
        };
      });
    } else {
      // No details available, just show languages without statistics

      // Try to get total keys count
      try {
        const keys = await translationService.getTranslationKeys();
        totalKeys.value = keys.length;
      } catch (e) {
        console.warn('Could not load keys:', e);
        totalKeys.value = 0;
      }

      // Show languages with zero stats
      languages.value = langs.map((lang) => ({
        ...lang,
        translationCount: 0,
        coveragePercent: 0,
        pendingCount: 0,
      }));
    }
  } catch (err) {
    console.error('Failed to load languages:', err);
    error.value =
      'Failed to load languages. Please check the console for details.';
  } finally {
    loading.value = false;
  }
}

function getCoverageColor(percent: number): Colors {
  if (percent >= 90) return Colors.SUCCESS;
  if (percent >= 70) return Colors.WARNING;
  return Colors.ERROR;
}

async function uploadForLanguage(language: Language) {
  uploadLanguage.value = language;
  uploadStatus.value = '';
  uploadProgress.value = 0;

  if (!popupService) {
    console.error('Popup service not available');
    return;
  }

  // Create a component for the upload dialog
  const UploadDialog = {
    template: `
      <div class="i18n-languages-view__upload-modal">
        <input
          type="file"
          accept=".json"
          @change="handleFileUpload"
          class="i18n-languages-view__upload-input"
          ref="fileInput"
          style="display: none;"
        />
        <TButton
          @click="triggerFileInput"
          :icon="Icons.ARROW_UP"
          color="primary"
          class="i18n-languages-view__upload-button"
        >
          {{ t('admin.i18n.languages.selectFile') }}
        </TButton>

        <div v-if="localUploadStatus" class="i18n-languages-view__upload-status">
          <p>{{ localUploadStatus }}</p>
          <TProgressBar v-if="localUploadProgress > 0" :value="localUploadProgress" />
        </div>
      </div>
    `,
    components: { TButton, TProgressBar },
    setup() {
      const fileInput = ref(null);
      const localUploadStatus = ref(uploadStatus.value);
      const localUploadProgress = ref(uploadProgress.value);

      const triggerFileInput = () => {
        if (fileInput.value) {
          fileInput.value.click();
        }
      };

      const handleFileUpload = async (event: Event) => {
        await handleLanguageFileUpload(event);
        // Update local refs
        localUploadStatus.value = uploadStatus.value;
        localUploadProgress.value = uploadProgress.value;
      };

      // Watch for changes in parent component
      watch(uploadStatus, (newVal) => {
        localUploadStatus.value = newVal;
      });
      watch(uploadProgress, (newVal) => {
        localUploadProgress.value = newVal;
      });

      return {
        fileInput,
        triggerFileInput,
        handleFileUpload,
        localUploadStatus,
        localUploadProgress,
        t,
        Icons
      };
    }
  };

  popupService.open({
    component: UploadDialog,
    title: t('admin.i18n.languages.uploadTitle', { language: language.name }),
    onClose: () => {
      uploadLanguage.value = null;
      uploadStatus.value = '';
      uploadProgress.value = 0;
    }
  });
}

async function handleLanguageFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !uploadLanguage.value) return;

  try {
    uploadStatus.value = t('admin.i18n.database.upload.reading');
    uploadProgress.value = 10;

    const text = await file.text();
    const data = JSON.parse(text);

    uploadStatus.value = t('admin.i18n.database.upload.processing');
    uploadProgress.value = 30;

    // Import the translations for the selected language
    const result = await translationService.importTranslations(
      uploadLanguage.value.code,
      data,
      {
        onProgress: (progress) => {
          uploadProgress.value = 30 + progress * 0.7;
        },
      },
    );

    uploadStatus.value = t('admin.i18n.database.upload.success', {
      count: result.importedCount,
      language: uploadLanguage.value.name,
    });
    uploadProgress.value = 100;

    // Reload languages to update coverage
    await loadLanguages();

    // Show success message
    toastService?.show({
      message: uploadStatus.value,
      type: 'success',
      duration: 3000
    });

    // Close modal after success
    setTimeout(() => {
      uploadLanguage.value = null;
      uploadStatus.value = '';
      uploadProgress.value = 0;
    }, 2000);
  } catch (error) {
    console.error('Upload failed:', error);
    uploadStatus.value = t('admin.i18n.database.upload.error', {
      error: error.message,
    });
    uploadProgress.value = 0;
  }

  // Clear file input
  target.value = '';
}

function viewLanguageDetails(language: Language) {
  router.push({
    name: 'I18nLanguageDetail',
    params: { code: language.code },
  });
}

async function toggleLanguageStatus(language: Language) {
  try {
    await translationService.updateLanguage(language.id, {
      is_active: !language.is_active,
    });
    await loadLanguages();
  } catch (error) {
    console.error('Failed to toggle language status:', error);
  }
}

async function openAddLanguageDialog() {
  if (!popupService) {
    console.error('Popup service not available');
    return;
  }

  // Reset form
  newLanguage.value = { code: '', name: '', native_name: '' };

  // Create a component for the add language dialog
  const AddLanguageDialog = {
    template: `
      <div class="i18n-languages-view__add-language-form">
        <TInputText
          v-model="localNewLanguage.code"
          :label="t('admin.i18n.languages.languageCode')"
          :placeholder="t('admin.i18n.languages.languageCodePlaceholder')"
          class="i18n-languages-view__form-field"
        />
        <TInputText
          v-model="localNewLanguage.name"
          :label="t('admin.i18n.languages.languageName')"
          :placeholder="t('admin.i18n.languages.languageNamePlaceholder')"
          class="i18n-languages-view__form-field"
        />
        <TInputText
          v-model="localNewLanguage.native_name"
          :label="t('admin.i18n.languages.nativeName')"
          :placeholder="t('admin.i18n.languages.nativeNamePlaceholder')"
          class="i18n-languages-view__form-field"
        />

        <div class="i18n-languages-view__form-actions">
          <TButton type="ghost" @click="handleCancel">
            {{ t('common.cancel') }}
          </TButton>
          <TButton
            color="primary"
            @click="handleSave"
            :disabled="!localNewLanguage.code || !localNewLanguage.name"
          >
            {{ t('common.add') }}
          </TButton>
        </div>
      </div>
    `,
    components: { TInputText, TButton },
    emits: ['close'],
    setup(props, { emit }) {
      const localNewLanguage = ref({
        code: newLanguage.value.code,
        name: newLanguage.value.name,
        native_name: newLanguage.value.native_name
      });

      const handleCancel = () => {
        emit('close');
      };

      const handleSave = async () => {
        try {
          await translationService.createLanguage({
            code: localNewLanguage.value.code,
            name: localNewLanguage.value.name,
            native_name: localNewLanguage.value.native_name || localNewLanguage.value.name,
            is_active: true,
          });

          // Show success message
          toastService?.show({
            message: t('admin.i18n.languages.addSuccess'),
            type: 'success',
            duration: 3000
          });

          // Reload languages
          await loadLanguages();

          // Close dialog
          emit('close');
        } catch (error) {
          console.error('Failed to add language:', error);
          toastService?.show({
            message: t('admin.i18n.languages.addError', { error: error.message || 'Unknown error' }),
            type: 'error',
            duration: 5000
          });
        }
      };

      return {
        localNewLanguage,
        handleCancel,
        handleSave,
        t
      };
    }
  };

  const dialog = popupService.open({
    component: AddLanguageDialog,
    title: t('admin.i18n.languages.addLanguage')
  });
}

// Open Add Key Dialog
async function openAddKeyDialog() {
  showAddKeyDialog.value = true;

  // Import AddTranslationKeyDialog dynamically
  const { default: AddTranslationKeyDialog } = await import('../../components/dialogs/AddTranslationKeyDialog.vue');

  const dialog = popupService?.open({
    component: AddTranslationKeyDialog,
    props: {
      onSave: handleSaveKey
    }
  });

  // Reset flag when dialog closes
  if (dialog && typeof dialog === 'object' && 'onClose' in dialog) {
    dialog.onClose(() => {
      showAddKeyDialog.value = false;
    });
  }
}

// Handle saving new translation key
async function handleSaveKey(data: TranslationKeyData) {
  try {
    // Create the key first
    const newKey = await translationService.createTranslationKey({
      key: data.key,
      category: data.category,
      description: data.description
    });

    if (!newKey || !newKey.id) {
      throw new Error('Failed to create translation key');
    }

    // Create translations for each language
    const translationPromises = Object.entries(data.translations).map(async ([languageCode, value]) => {
      if (!value) return;

      try {
        await translationService.createTranslation({
          key_id: newKey.id,
          language_code: languageCode,
          value: value,
          is_published: true
        });
      } catch (error) {
        console.error(`Failed to create translation for ${languageCode}:`, error);
      }
    });

    await Promise.all(translationPromises);

    // Show success message
    toastService?.show({
      message: t('admin.i18n.addKey.success'),
      type: 'success',
      duration: 3000
    });

    // Reload languages to update coverage
    await loadLanguages();

    // Refresh global translations cache
    await refreshTranslations();
  } catch (error: any) {
    console.error('Failed to save translation key:', error);
    toastService?.show({
      message: t('admin.i18n.addKey.error', { error: error?.message || 'Unknown error' }),
      type: 'error',
      duration: 5000
    });
    throw error; // Re-throw to keep dialog open
  }
}

// Force reload i18n translations
async function forceReloadI18n() {
  reloadingI18n.value = true;

  try {
    console.log('Forcing i18n reload...');

    // Clear and reload translations cache
    await refreshTranslations();

    // Small delay to ensure the store has updated
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reload languages to show updated coverage
    await loadLanguages();

    // Force Vue to re-render by updating a reactive value
    // This ensures the UI picks up the new translations
    const currentLocale = locale.value;
    console.log('Current locale after refresh:', currentLocale);

    // Show success message
    toastService?.show({
      message: t('admin.i18n.languages.reloadSuccess') || 'i18n translations reloaded successfully',
      type: 'success',
      duration: 3000
    });

    console.log('i18n reload completed successfully');
  } catch (error: any) {
    console.error('Failed to reload i18n:', error);
    toastService?.show({
      message: t('admin.i18n.languages.reloadError', { error: error?.message || 'Unknown error' }) || `Failed to reload i18n: ${error?.message || 'Unknown error'}`,
      type: 'error',
      duration: 5000
    });
  } finally {
    reloadingI18n.value = false;
  }
}

// Lifecycle
onMounted(() => {
  // Only load if we're authenticated
  if (router.currentRoute.value.name === 'I18nLanguages') {
    loadLanguages().catch((error) => {
      console.error('Failed to load languages on mount:', error);
      // Don't block the UI, just log the error
    });
  }
});
</script>

<style lang="scss">
.i18n-languages-view {
  padding: var(--space-lg);


  &__languages-section {
    background: var(--color-background-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
  }

  &__coverage {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxs);
  }

  &__coverage-text {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__coverage-progress {
    width: 100%;
    height: 4px;
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

  &__add-language-form {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__form-field {
    width: 100%;
  }

  &__form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space);
    margin-top: var(--space);
  }

  &__empty-state {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-foreground-secondary);

    p {
      margin-bottom: var(--space);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

}
</style>
