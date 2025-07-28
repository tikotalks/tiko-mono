<template>
  <div :class="bemm()">
    <!-- Header -->
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t(keys.admin.translations.title) }}</h1>

      <div v-if="isAuthenticated" :class="bemm('actions')">
        <!-- Locale Switcher -->
        <TInputSelect
          v-model="targetLocale"
          :options="localeOptions"
          :label="t(keys.admin.translations.targetLocale)"
          :class="bemm('locale-select')"
        />

        <!-- Search -->
        <TInput
          v-model="searchQuery"
          :placeholder="t(keys.common.search)"
          :icon="Icons.SEARCH_M"
          :class="bemm('search')"
        />

        <!-- Import Button -->
        <TButton
          type="ghost"
          :icon="Icons.FILE_UPLOAD || Icons.ADD"
          @click="showImportModal"
        >
          {{ t(keys.admin.translations.import) }}
        </TButton>

        <!-- Add Key Button -->
        <TButton
          :icon="Icons.ADD"
          @click="showAddKeyModal"
        >
          {{ t(keys.admin.translations.addKey) }}
        </TButton>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="isAuthenticated" :class="bemm('stats')">
      <div :class="bemm('stat')">
        <span :class="bemm('stat-label')">{{ t(keys.admin.translations.totalKeys) }}</span>
        <span :class="bemm('stat-value')">{{ statistics.totalKeys }}</span>
      </div>
      <div :class="bemm('stat')">
        <span :class="bemm('stat-label')">{{ t(keys.admin.translations.completion) }}</span>
        <span :class="bemm('stat-value')">
          {{ statistics.completeness[targetLocale]?.percentage || 0 }}%
        </span>
      </div>
      <div :class="bemm('stat')">
        <span :class="bemm('stat-label')">{{ t(keys.admin.translations.missing) }}</span>
        <span :class="bemm('stat-value')">
          {{ statistics.completeness[targetLocale]?.missing || 0 }}
        </span>
      </div>
      <div :class="bemm('stat')">
        <span :class="bemm('stat-label')">{{ t(keys.admin.translations.autoTranslated) }}</span>
        <span :class="bemm('stat-value')">
          {{ statistics.autoTranslated[targetLocale] || 0 }}
        </span>
      </div>
    </div>

    <!-- Translations Table -->
    <div v-if="isAuthenticated && allKeys.length > 0" :class="bemm('table-container')">
      <table :class="bemm('table')">
        <thead>
          <tr>
            <th :class="bemm('th', 'key')">{{ t(keys.admin.translations.key) }}</th>
            <th :class="bemm('th', 'source')">{{ sourceLocale }} ({{ t(keys.admin.translations.source) }})</th>
            <th :class="bemm('th', 'target')">{{ targetLocale }}</th>
            <th :class="bemm('th', 'actions')">{{ t(keys.common.actions) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in displayedTranslations"
            :key="row.key"
            :class="bemm('row', { missing: !row.targetValue, editing: row.key === editingKey })"
          >
            <td :class="bemm('td', 'key')">
              <span :class="bemm('key-text')">{{ row.key }}</span>
            </td>
            <td :class="bemm('td', 'source')">
              {{ row.sourceValue }}
            </td>
            <td :class="bemm('td', 'target')">
              <div :class="bemm('target-cell')">
                <TInput
                  v-if="row.key === editingKey"
                  v-model="editingValue"
                  :class="bemm('edit-input')"
                  @keyup.enter="saveEdit"
                  @keyup.esc="cancelEdit"
                  ref="editInput"
                />
                <span v-else :class="bemm('target-value', { missing: !row.targetValue })">
                  {{ row.targetValue || '—' }}
                </span>
                <TIcon
                  v-if="row.autoTranslated"
                  :name="Icons.SPARKLE"
                  :class="bemm('auto-icon')"
                  :title="t(keys.admin.translations.autoTranslatedTooltip)"
                />
              </div>
            </td>
            <td :class="bemm('td', 'actions')">
              <div :class="bemm('actions-cell')">
                <TButton
                  v-if="row.key === editingKey"
                  type="ghost"
                  size="small"
                  :icon="Icons.CHECK"
                  @click="saveEdit"
                  :title="t(keys.common.save)"
                />
                <TButton
                  v-if="row.key === editingKey"
                  type="ghost"
                  size="small"
                  :icon="Icons.CLOSE"
                  @click="cancelEdit"
                  :title="t(keys.common.cancel)"
                />
                <TButton
                  v-else
                  type="ghost"
                  size="small"
                  :icon="Icons.EDIT"
                  @click="startEdit(row)"
                  :title="t(keys.common.edit)"
                />
                <TButton
                  v-if="!row.targetValue && row.key !== editingKey"
                  type="ghost"
                  size="small"
                  :icon="Icons.SPARKLE"
                  @click="autoTranslate(row)"
                  :loading="translatingKeys.has(row.key)"
                  :title="t(keys.admin.translations.autoTranslate)"
                />
                <TButton
                  v-if="row.key !== editingKey"
                  type="ghost"
                  size="small"
                  :icon="Icons.MULTIPLY_M"
                  @click="deleteKey(row.key)"
                  :title="t(keys.common.delete)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading/Empty States -->
    <div
      v-if="!loading && !isAuthenticated"
      :class="bemm('empty')"
    >
      <TIcon :name="Icons.KEY || Icons.SETTINGS" :class="bemm('empty-icon')" />
      <h3 :class="bemm('empty-title')">{{ t(keys.auth.loginRequired) }}</h3>
      <p :class="bemm('empty-description')">{{ t(keys.auth.loginRequiredDescription) }}</p>
    </div>
    
    <div
      v-else-if="!loading && displayedTranslations.length === 0"
      :class="bemm('empty')"
    >
      <TIcon :name="Icons.HELLO_GOODBYE" :class="bemm('empty-icon')" />
      <h3 :class="bemm('empty-title')">{{ t(keys.admin.translations.noTranslations) }}</h3>
      <p :class="bemm('empty-description')">{{ t(keys.admin.translations.noTranslationsDesc) }}</p>
    </div>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch, nextTick } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { translationService } from '@tiko/core';
import type { Translation } from '@tiko/core';
import type { PopupService, ToastService } from '@tiko/ui';
import {
  TButton,
  TInput,
  TInputSelect,
  TIcon,
    useI18n,
  TSpinner,
} from '@tiko/ui';

interface TranslationRow {
  key: string;
  sourceValue: string;
  targetValue: string;
  autoTranslated: boolean;
}

const bemm = useBemm('translation-admin');
const { keys, t } = useI18n();
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');

// State
const loading = ref(false);
const searchQuery = ref('');
const isAuthenticated = ref(false);
const sourceLocale = ref('en');
const targetLocale = ref('fr');
const allKeys = ref<string[]>([]);
const translations = ref<Translation[]>([]);
const statistics = ref({
  totalKeys: 0,
  locales: [] as string[],
  completeness: {} as Record<string, { translated: number; missing: number; percentage: number }>,
  autoTranslated: {} as Record<string, number>,
});

// Editing state
const editingKey = ref<string | null>(null);
const editingValue = ref('');
const editInput = ref<any>(null);

// Auto-translation state
const translatingKeys = ref(new Set<string>());

// Available locales (from the UI package)
const availableLocales = [
  'en', 'en-GB', 'en-US', 'en-AU', 'en-CA',
  'fr', 'fr-FR', 'fr-CA', 'fr-BE',
  'de', 'de-DE', 'de-AT', 'de-CH',
  'es', 'es-ES', 'es-MX', 'es-AR',
  'it', 'it-IT',
  'pt', 'pt-PT', 'pt-BR',
  'nl', 'nl-NL', 'nl-BE',
  'pl', 'pl-PL',
  'ru', 'ru-RU',
  'sv', 'sv-SE',
  'no', 'no-NO',
  'da', 'da-DK',
  'fi', 'fi-FI',
  'is', 'is-IS',
  'el', 'el-GR',
  'ro', 'ro-RO',
  'bg', 'bg-BG',
  'cs', 'cs-CZ',
  'sk', 'sk-SK',
  'sl', 'sl-SI',
  'hr', 'hr-HR',
  'hu', 'hu-HU',
  'et', 'et-EE',
  'lv', 'lv-LV',
  'lt', 'lt-LT',
  'mt', 'mt-MT',
  'ga', 'ga-IE',
  'cy', 'cy-GB',
  'hy', 'hy-AM'
];

const localeOptions = computed(() =>
  availableLocales.map(locale => ({
    value: locale,
    label: locale
  }))
);

// Computed translations for display
const displayedTranslations = computed(() => {
  const sourceTranslations = translations.value.filter(t => t.locale === sourceLocale.value);
  const targetTranslations = translations.value.filter(t => t.locale === targetLocale.value);

  const targetMap = new Map(targetTranslations.map(t => [t.key, t]));

  const rows: TranslationRow[] = allKeys.value.map(key => {
    const source = sourceTranslations.find(t => t.key === key);
    const target = targetMap.get(key);

    return {
      key,
      sourceValue: source?.value || '',
      targetValue: target?.value || '',
      autoTranslated: target?.auto_translated || false
    };
  });

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    return rows.filter(row =>
      row.key.toLowerCase().includes(query) ||
      row.sourceValue.toLowerCase().includes(query) ||
      row.targetValue.toLowerCase().includes(query)
    );
  }

  return rows;
});

// Load data
async function loadTranslations() {
  loading.value = true;
  try {
    // Load all keys
    allKeys.value = await translationService.getAllKeys();

    // Load translations for source and target locales
    const [sourceTranslations, targetTranslations] = await Promise.all([
      translationService.getTranslations(sourceLocale.value),
      translationService.getTranslations(targetLocale.value)
    ]);

    translations.value = [...sourceTranslations, ...targetTranslations];

    // Load statistics
    statistics.value = await translationService.getStatistics();
  } catch (error: any) {
    console.error('Error loading translations:', error);
    
    // Handle authentication error specifically
    if (error.message?.includes('No authentication token')) {
      // Don't show error toast for auth issues, the UI will handle it
      return;
    }
    
    toastService?.show({
      message: t(keys.errors.loadingData),
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
}

// Watch locale changes
watch(targetLocale, async () => {
  await loadTranslations();
});

// Edit functions
function startEdit(row: TranslationRow) {
  editingKey.value = row.key;
  editingValue.value = row.targetValue;
  nextTick(() => {
    editInput.value?.$el?.querySelector('input')?.focus();
  });
}

async function saveEdit() {
  if (!editingKey.value) return;

  try {
    await translationService.saveTranslation(
      editingKey.value,
      targetLocale.value,
      editingValue.value,
      false
    );

    await loadTranslations();

    toastService?.show({
      message: t(keys.common.saved),
      type: 'success'
    });

    cancelEdit();
  } catch (error) {
    console.error('Error saving translation:', error);
    toastService?.show({
      message: t(keys.errors.savingData),
      type: 'error'
    });
  }
}

function cancelEdit() {
  editingKey.value = null;
  editingValue.value = '';
}

// Auto-translate function
async function autoTranslate(row: TranslationRow) {
  if (!row.sourceValue) {
    toastService?.show({
      message: t(keys.admin.translations.noSourceValue),
      type: 'warning'
    });
    return;
  }

  translatingKeys.value.add(row.key);

  try {
    // TODO: Implement GPT translation
    // For now, just show a message
    toastService?.show({
      message: t(keys.admin.translations.autoTranslateNotImplemented),
      type: 'info'
    });
  } catch (error) {
    console.error('Error auto-translating:', error);
    toastService?.show({
      message: t(keys.errors.autoTranslate),
      type: 'error'
    });
  } finally {
    translatingKeys.value.delete(row.key);
  }
}

// Delete key
async function deleteKey(key: string) {
  const confirmed = await popupService?.confirm({
    title: t(keys.admin.translations.deleteKeyTitle),
    message: t(keys.admin.translations.deleteKeyMessage, { key }),
    confirmText: t(keys.common.delete),
    confirmType: 'danger'
  });

  if (!confirmed) return;

  try {
    await translationService.deleteTranslationKey(key);
    await loadTranslations();

    toastService?.show({
      message: t(keys.common.deleted),
      type: 'success'
    });
  } catch (error) {
    console.error('Error deleting key:', error);
    toastService?.show({
      message: t(keys.errors.deletingData),
      type: 'error'
    });
  }
}

// Add key modal
async function showAddKeyModal() {
  // TODO: Implement add key modal
  toastService?.show({
    message: t(keys.admin.translations.addKeyNotImplemented),
    type: 'info'
  });
}

// Import translations modal
async function showImportModal() {
  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  
  fileInput.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    try {
      // Read file content
      const content = await file.text();
      const translations = JSON.parse(content);
      
      // Validate it's an object
      if (typeof translations !== 'object' || Array.isArray(translations)) {
        throw new Error('Invalid JSON format. Expected object with key-value pairs.');
      }
      
      // Get locale from filename or prompt user
      const filename = file.name.replace('.json', '');
      const locale = await popupService?.prompt({
        title: t(keys.admin.translations.importTitle),
        message: t(keys.admin.translations.importLocalePrompt),
        placeholder: t(keys.admin.translations.localePlaceholder),
        defaultValue: filename,
        confirmText: t(keys.admin.translations.import),
      });
      
      if (!locale) return;
      
      // Import translations
      await importTranslations(translations, locale);
      
    } catch (error) {
      console.error('Error importing file:', error);
      toastService?.show({
        message: t(keys.admin.translations.importError, { error: error.message }),
        type: 'error'
      });
    }
  };
  
  // Trigger file selection
  fileInput.click();
}

// Import translations to database
async function importTranslations(translations: Record<string, any>, locale: string) {
  loading.value = true;
  
  try {
    // Flatten nested translations
    const flatTranslations = flattenObject(translations);
    const totalKeys = Object.keys(flatTranslations).length;
    
    toastService?.show({
      message: t(keys.admin.translations.importStarted, { count: totalKeys }),
      type: 'info'
    });
    
    let imported = 0;
    let failed = 0;
    
    // Import each translation
    for (const [key, value] of Object.entries(flatTranslations)) {
      try {
        await translationService.saveTranslation(
          key,
          locale,
          String(value),
          false // not auto-translated
        );
        imported++;
      } catch (error) {
        console.error(`Failed to import ${key}:`, error);
        failed++;
      }
    }
    
    // Reload translations
    await loadTranslations();
    
    toastService?.show({
      message: t(keys.admin.translations.importSuccess, { imported, failed, total: totalKeys }),
      type: failed > 0 ? 'warning' : 'success'
    });
    
  } catch (error) {
    console.error('Error importing translations:', error);
    toastService?.show({
      message: t(keys.admin.translations.importError, { error: error.message }),
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
}

// Helper function to flatten nested objects
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = String(obj[key] || '');
      }
    }
  }
  
  return flattened;
}


onMounted(async () => {
  // Check if user is authenticated
  try {
    const authData = localStorage.getItem('sb-kejvhvszhevfwgsztedf-auth-token');
    isAuthenticated.value = !!authData;
  } catch {
    isAuthenticated.value = false;
  }
  
  // Only load if authenticated
  if (isAuthenticated.value) {
    await loadTranslations();
  }
});
</script>

<style lang="scss">
.translation-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);
  height: 100%;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space);
    flex-wrap: wrap;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: var(--space-s);
    align-items: center;
    flex-wrap: wrap;
  }

  &__locale-select {
    width: 120px;
  }

  &__search {
    width: 250px;
  }

  &__stats {
    display: flex;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__stat-label {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
  }

  &__table-container {
    flex: 1;
    overflow: auto;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__th {
    position: sticky;
    top: 0;
    background: var(--color-background-secondary);
    padding: var(--space-s) var(--space);
    text-align: left;
    font-weight: var(--font-weight-bold);
    border-bottom: 1px solid var(--color-border);
    z-index: 1;

    &--key {
      width: 30%;
    }

    &--source {
      width: 30%;
    }

    &--target {
      width: 30%;
    }

    &--actions {
      width: 10%;
    }
  }

  &__row {
    &:hover {
      background: var(--color-background-secondary);
    }

    &--missing {
      .translation-admin__target-value {
        color: var(--color-error);
      }
    }
  }

  &__td {
    padding: var(--space-s) var(--space);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  &__key-text {
    font-family: monospace;
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__target-cell {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__target-value {
    flex: 1;

    &--missing {
      color: var(--color-foreground-secondary);
      font-style: italic;
    }
  }

  &__auto-icon {
    color: var(--color-primary);
    font-size: var(--font-size-s);
  }

  &__edit-input {
    flex: 1;
  }

  &__actions-cell {
    display: flex;
    gap: var(--space-xs);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
    text-align: center;
    gap: var(--space);
  }

  &__empty-icon {
    font-size: 3em;
    color: var(--color-foreground-secondary);
    opacity: 0.5;
  }

  &__empty-title {
    font-size: var(--font-size-lg);
    color: var(--color-foreground);
    margin: 0;
  }

  &__empty-description {
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xl);
  }
}</style>
