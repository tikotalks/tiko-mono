<template>
  <div :class="bemm()">
    <!-- Header -->
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">Translations</h1>

      <div :class="bemm('actions')">
        <!-- Language Switcher -->
        <TInputSelect
          v-model="targetLocale"
          :options="languageOptions"
          :label="'Target Language'"
          :class="bemm('locale-select')"
        />

        <!-- Search -->
        <TInput
          v-model="searchQuery"
          :placeholder="'Search...'"
          :icon="Icons.SEARCH_M"
          :class="bemm('search')"
        />

        <!-- Filter Toggle -->
        <TButton
          type="ghost"
          :icon="showOnlyMissing ? Icons.EYE_SLASH : Icons.EYE"
          @click="showOnlyMissing = !showOnlyMissing"
          :class="bemm('filter-toggle', { active: showOnlyMissing })"
        >
          {{ showOnlyMissing ? 'Show All' : 'Missing Only' }}
        </TButton>

        <!-- Import Button -->
        <TButton
          type="ghost"
          :icon="Icons.ARROW_UPLOAD || Icons.ADD"
          @click="showImportModal"
        >
          Import
        </TButton>

        <!-- Generate All Button -->
        <TButton
          v-if="missingTranslationsCount > 0"
          type="ghost"
          :icon="Icons.STAR_FAT"
          @click="generateAllMissingTranslations"
          :loading="isGeneratingAll"
        >
          Generate All ({{ missingTranslationsCount }})
        </TButton>

        <!-- Refresh Button -->
        <TButton
          type="ghost"
          :icon="Icons.ARROW_ROTATE_TOP_LEFT"
          @click="loadTranslations"
          :loading="loading"
        >
          Refresh
        </TButton>

        <!-- Add Key Button -->
        <TButton
          :icon="Icons.ADD"
          @click="showAddKeyModal"
        >
          Add Key
        </TButton>

        <!-- Cleanup Button - only show if there are corrupted keys -->
        <TButton
          v-if="hasCorruptedKeys"
          type="ghost"
          color="error"
          :icon="Icons.TRIANGLED_EXCLAMATION_MARK"
          @click="cleanupCorruptedKeys"
          :loading="isCleaningKeys"
        >
          Clean Corrupted Keys ({{ corruptedKeysCount }})
        </TButton>

        <!-- Approve All Pending Button -->
        <TButton
          v-if="pendingCount > 0"
          type="ghost"
          color="success"
          :icon="Icons.CHECK_M"
          @click="approveAllPending"
          :loading="isApprovingAll"
        >
          Approve Pending ({{ pendingCount }})
        </TButton>
      </div>
    </div>

    <!-- Statistics -->
    <div :class="[bemm('stats'),'horizontal-table']">
      <dl :class="bemm('stat')">
        <dt :class="bemm('stat-label')">Total Keys</dt>
        <dd :class="bemm('stat-value')">{{ statistics.totalKeys }}</dd>
      </dl>
      <dl :class="bemm('stat')">
        <dt :class="bemm('stat-label')">Completion</dt>
        <dd :class="bemm('stat-value')">
          {{ statistics.completeness[targetLocale]?.percentage || 0 }}%
        </dd>
      </dl>
      <dl :class="bemm('stat')">
        <dt :class="bemm('stat-label')">Missing</dt>
        <dd :class="bemm('stat-value')">
          {{ statistics.completeness[targetLocale]?.missing || 0 }}
        </dd>
      </dl>
      <dl :class="bemm('stat')">
        <dt :class="bemm('stat-label')">Auto Translated</dt>
        <dd :class="bemm('stat-value')">
          {{ statistics.autoTranslated[targetLocale] || 0 }}
        </dd>
      </dl>
    </div>


    <!-- Translations List -->
    <div v-if="allKeys.length > 0" :class="bemm('list-container', { selecting: isSelecting })">
      <TList :columns="listColumns" :striped="true" :bordered="true" :hover="true">
        <TListItem
          v-for="row in displayedTranslations"
          :key="row.key"
          :clickable="true"
          :selected="selectedKeys.has(row.key)"
          @click="(event) => toggleSelection(row.key, event)"
        >
          <!-- Key Column -->
          <TListCell type="custom">
            <span :class="bemm('key-text')">{{ row.key }}</span>
          </TListCell>

          <!-- Source Value Column -->
          <!-- <TListCell type="text" :content="row.sourceValue || '—'" /> -->

          <!-- Target Value Column -->
          <TListCell type="custom">
            <div :class="bemm('target-cell')">
              <TInput
                v-if="row.key === editingKey"
                v-model="editingValue"
                :class="bemm('edit-input')"
                @keyup.enter="saveEdit"
                @keyup.esc="cancelEdit"
                ref="editInput"
              />
              <div v-else :class="bemm('target-display')">
                <span :class="bemm('target-value', { missing: !row.targetValue })">
                  {{ row.targetValue || '—' }}
                </span>
                <TIcon
                  v-if="row.autoTranslated"
                  :name="Icons.STAR_FAT"
                  :class="bemm('auto-icon')"
                  :title="'This translation was auto-generated'"
                />
              </div>
            </div>
          </TListCell>

          <!-- Actions Column -->
          <TListCell type="custom">
            <div :class="bemm('actions-cell')">
              <template v-if="row.key === editingKey">
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.CHECK_M"
                  @click="saveEdit"
                  :title="'Save'"
                />
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.CLOSE"
                  @click="cancelEdit"
                  :title="'Cancel'"
                />
              </template>
              <template v-else>
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.EDIT_M"
                  @click="startEdit(row)"
                  :title="'Edit'"
                />
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.STAR_M"
                  @click="autoTranslate(row)"
                  :loading="translatingKeys.has(row.key)"
                  :title="row.targetValue ? 'Re-generate translation' : 'Auto-translate'"
                />
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.MULTIPLY_M"
                  @click="deleteKey(row.key)"
                  :title="'Delete'"
                />
              </template>
            </div>
          </TListCell>
        </TListItem>
      </TList>
    </div>

    <!-- Loading/Empty States -->
    <div
      v-if="!loading && displayedTranslations.length === 0"
      :class="bemm('empty')"
    >
      <TIcon :name="Icons.HELLO_GOODBYE" :class="bemm('empty-icon')" />
      <h3 :class="bemm('empty-title')">No Translations Found</h3>
      <p :class="bemm('empty-description')">Start by adding translation keys or importing from JSON files</p>
    </div>

    <!-- Status Bar for Selections -->
    <TStatusBar v-if="hasSelections">
      <div :class="bemm('status-bar-content')">
        <div :class="bemm('status-bar-title')">
          {{ selectedCount }} item{{ selectedCount === 1 ? '' : 's' }} selected
        </div>
        <div :class="bemm('status-bar-actions')">
          <TButton
            type="ghost"
            size="small"
            :icon="Icons.MULTIPLY_M"
            @click="clearSelections"
          >
            Clear Selection
          </TButton>
          <TButton
            type="ghost"
            size="small"
            :icon="Icons.CHECK_M"
            @click="selectAll"
          >
            Select All
          </TButton>
          <TButton
            type="ghost"
            size="small"
            color="error"
            :icon="Icons.MULTIPLY_M"
            @click="deleteSelectedKeys"
          >
            Delete Selected
          </TButton>
          <TButton
            type="primary"
            size="small"
            :icon="Icons.SPARKLE"
            @click="autoTranslateSelected"
          >
            Auto-translate Selected
          </TButton>
        </div>
      </div>
    </TStatusBar>

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

// GPT Translation function
async function translateWithGPT(text: string, sourceLocale: string, targetLocale: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPEN_AI_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please check your environment variables.');
  }

  // Get full language names
  const languageMap: Record<string, string> = {
    'en': 'English',
    'nl': 'Dutch',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'pl': 'Polish',
    'ru': 'Russian',
    'sv': 'Swedish',
    'da': 'Danish',
    'fi': 'Finnish',
    'el': 'Greek',
    'ro': 'Romanian'
  };

  const sourceLang = languageMap[sourceLocale] || sourceLocale;
  const targetLang = languageMap[targetLocale] || targetLocale;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator for a children's educational app. Translate the following text from ${sourceLang} to ${targetLang}.
- Keep any placeholders like {name}, {count}, etc. exactly as they are
- Maintain the same tone and formality level
- Return ONLY the translated text, no explanations or alternatives`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GPT API error:', errorData);
      throw new Error(errorData.error?.message || 'Translation failed');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const translated = data.choices[0].message.content.trim();
    return translated;
  } catch (error) {
    console.error('GPT translation error:', error);
    throw error;
  }
}

import type { Translation } from '@tiko/core';
import type { PopupService, ToastService } from '@tiko/ui';
import {
  TButton,
  TInput,
  TInputSelect,
  TIcon,
  useI18n,
  TSpinner,
  TList,
  TListItem,
  TListCell,
  TProgressBar,
  TStatusBar,
  ConfirmDialog,
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
const showOnlyMissing = ref(false);

// Selection state
const selectedKeys = ref(new Set<string>());
const isSelecting = ref(false);
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

// Pending translations state
const pendingCount = ref(0);
const isApprovingAll = ref(false);

// Import progress state
const importProgress = ref({
  isImporting: false,
  progress: 0,
  total: 0,
  currentItem: '',
  statusText: '',
  successCount: 0,
  errorCount: 0,
  cancelled: false,
  locale: ''
});

// List configuration
const listColumns = computed(() => [
  { key: 'key', label: 'Key', width: '1fr' },
  // { key: 'source', label: `${sourceLocale.value} (Source)`, width: '1fr' },
  { key: 'target', label: targetLocale.value, width: '1fr' },
  { key: 'actions', label: 'Actions', width: '160px' }
]);

// Editing state
const editingKey = ref<string | null>(null);
const editingValue = ref('');
const editInput = ref<any>(null);

// Auto-translation state
const translatingKeys = ref(new Set<string>());
const isGeneratingAll = ref(false);
const cancelBatch = ref(false);
const currentTranslatingKey = ref<string>('');
const batchProgress = ref({
  completed: 0,
  total: 0
});

// Cleanup state
const isCleaningKeys = ref(false);
const corruptedKeysCount = computed(() =>
  allKeys.value.filter(key => key.includes('[object Object]')).length
);
const hasCorruptedKeys = computed(() => corruptedKeysCount.value > 0);

// Computed progress percentage
const progressPercentage = computed(() => {
  if (batchProgress.value.total === 0) return 0;
  return Math.round((batchProgress.value.completed / batchProgress.value.total) * 100);
});

// Available languages from database
const availableLanguages = ref<string[]>([]);
const dbLanguages = ref<Array<{ code: string; name: string; native_name: string }>>([]);

// Load available languages from database
async function loadAvailableLanguages() {
  try {
    // For now, use hardcoded languages since getLanguages is not available
    // dbLanguages.value = await translationService.getLanguages();
    // availableLanguages.value = dbLanguages.value.map(l => l.code);

    // Use hardcoded languages
    availableLanguages.value = ['en', 'nl', 'fr', 'de', 'es', 'it', 'pt', 'pl', 'ru', 'sv', 'da', 'fi', 'no', 'is', 'el', 'ro', 'bg', 'cs', 'sk', 'sl', 'hr', 'hu', 'et', 'lv', 'lt', 'mt', 'ga', 'cy', 'hy'];
    // Create default language options
    dbLanguages.value = availableLanguages.value.map(code => ({
      code,
      name: code,
      native_name: code
    }));
  } catch (error) {
    console.error('Error loading languages:', error);
  }
}

const languageOptions = computed(() =>
  dbLanguages.value.map(language => ({
    value: language.code,
    label: `${language.name} (${language.code})`
  }))
);

// Count missing translations
const missingTranslationsCount = computed(() => {
  if (targetLocale.value === sourceLocale.value) return 0;

  const targetTranslations = translations.value.filter(t => t.locale === targetLocale.value);
  const targetKeys = new Set(targetTranslations.map(t => t.key));

  return allKeys.value.filter(key => !targetKeys.has(key)).length;
});

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

  // Apply filters
  let filteredRows = rows;

  // Filter by missing translations
  if (showOnlyMissing.value) {
    // Check if the key exists in the target locale translations at all
    const targetKeys = new Set(targetTranslations.map(t => t.key));
    filteredRows = filteredRows.filter(row => !targetKeys.has(row.key));
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filteredRows = filteredRows.filter(row =>
      row.key.toLowerCase().includes(query) ||
      row.sourceValue.toLowerCase().includes(query) ||
      row.targetValue.toLowerCase().includes(query)
    );
  }

  return filteredRows;
});

// Selection computed properties
const selectedCount = computed(() => selectedKeys.value.size);
const hasSelections = computed(() => selectedCount.value > 0);

// Selection methods
function toggleSelection(key: string, event: MouseEvent) {
  // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
  if (event.metaKey || event.ctrlKey) {
    event.preventDefault();
    event.stopPropagation();
    isSelecting.value = true;

    if (selectedKeys.value.has(key)) {
      selectedKeys.value.delete(key);
    } else {
      selectedKeys.value.add(key);
    }

    // If no selections, exit selection mode
    if (selectedKeys.value.size === 0) {
      isSelecting.value = false;
    }
  }
}

function clearSelections() {
  selectedKeys.value.clear();
  isSelecting.value = false;
}

function selectAll() {
  displayedTranslations.value.forEach(row => {
    selectedKeys.value.add(row.key);
  });
  isSelecting.value = true;
}

// Extract all keys from the static keys object
function extractAllTranslationKeys(obj: any, parentKey = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // If it's a string, that's the translation key
      keys.push(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // If it's an object, recurse
      keys.push(...extractAllTranslationKeys(obj[key]));
    }
  }

  return keys;
}

// Load data
async function loadTranslations() {
  loading.value = true;
  try {
    // Load all keys from database
    const dbKeys = await translationService.getAllKeys();
    console.log('Raw DB keys count:', dbKeys.length);
    console.log('Sample DB keys:', dbKeys.slice(0, 10));

    // Filter out any keys that contain [object Object]
    const cleanDbKeys = dbKeys.filter(key => !key.includes('[object Object]'));
    console.log('Clean DB keys count:', cleanDbKeys.length);
    console.log('Sample clean keys:', cleanDbKeys.slice(0, 10));

    // For now, just use the database keys
    allKeys.value = cleanDbKeys.sort();

    // Also check what translations we actually have
    const enTranslations = await translationService.getTranslations('en');
    console.log('EN translations count:', enTranslations.length);
    console.log('Sample EN translations:', enTranslations.slice(0, 5));

    // Load translations for source and target locales
    const [sourceTranslations, targetTranslations] = await Promise.all([
      translationService.getTranslations(sourceLocale.value),
      translationService.getTranslations(targetLocale.value)
    ]);

    translations.value = [...sourceTranslations, ...targetTranslations];

    // Load statistics
    const stats = await translationService.getStatistics();

    // Get target locale translations
    const targetTranslationsForLocale = targetTranslations.filter(t => !t.key.includes('[object Object]'));
    const targetKeysSet = new Set(targetTranslationsForLocale.map(t => t.key));

    // Calculate proper statistics
    const translatedCount = targetKeysSet.size;
    const missingCount = allKeys.value.length - translatedCount;
    const percentage = allKeys.value.length > 0
      ? Math.round((translatedCount / allKeys.value.length) * 100 * 100) / 100
      : 0;

    console.log('Statistics calculation:', {
      totalKeys: allKeys.value.length,
      translatedCount,
      missingCount,
      percentage,
      targetLocale: targetLocale.value
    });

    // Update statistics with correct values
    statistics.value = {
      totalKeys: allKeys.value.length,
      locales: stats.locales || [],
      completeness: {
        ...stats.completeness,
        [targetLocale.value]: {
          translated: translatedCount,
          missing: missingCount,
          percentage: percentage
        }
      },
      autoTranslated: stats.autoTranslated || {}
    };

    // Check for pending translations
    try {
      const pendingTranslations = await translationService.getPendingTranslations();
      pendingCount.value = pendingTranslations.length;
      console.log('Pending translations count:', pendingCount.value);
    } catch (error) {
      console.error('Error checking pending translations:', error);
      pendingCount.value = 0;
    }
  } catch (error: any) {
    console.error('Error loading translations:', error);

    // Show error message
    toastService?.show({
      message: error.message || 'Error loading translations',
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
      message: 'No source value to translate',
      type: 'warning'
    });
    return;
  }

  // Confirm if there's already a translation
  if (row.targetValue) {
    popupService?.open({
      component: ConfirmDialog,
      props: {
        title: 'Re-generate Translation',
        message: `Replace existing translation for "${row.key}"?\n\nCurrent: ${row.targetValue}`,
        confirmLabel: 'Re-generate',
        cancelLabel: 'Cancel',
        confirmColor: 'warning',
        icon: Icons.SPARKLE,
        onConfirm: () => performAutoTranslate(row)
      }
    });
    return;
  }

  // No existing translation, proceed directly
  await performAutoTranslate(row);
}

// Separated function to perform the actual translation
async function performAutoTranslate(row: TranslationRow) {
  translatingKeys.value.add(row.key);

  try {
    // Call GPT to translate
    const translatedValue = await translateWithGPT(
      row.sourceValue,
      sourceLocale.value,
      targetLocale.value
    );

    // Only save if we got a real translation (not a placeholder)
    if (translatedValue && !translatedValue.startsWith(`[AUTO-${targetLocale.value}]`)) {
      await translationService.saveTranslation(
        row.key,
        targetLocale.value,
        translatedValue,
        true // mark as auto-translated
      );

      // Reload to show the new translation
      await loadTranslations();

      toastService?.show({
        message: 'Translation generated successfully',
        type: 'success'
      });
    } else {
      throw new Error('Generated translation was invalid or placeholder');
    }
  } catch (error: any) {
    console.error('Error auto-translating:', error);

    // Show specific error message
    let errorMessage = 'Failed to generate translation';
    if (error.message.includes('API key')) {
      errorMessage = 'OpenAI API key not configured';
    } else if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment.';
    } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
      errorMessage = 'OpenAI quota exceeded. Please check your account.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    toastService?.show({
      message: errorMessage,
      type: 'error',
      duration: 5000
    });
  } finally {
    translatingKeys.value.delete(row.key);
  }
}

// Generate all missing translations
async function generateAllMissingTranslations() {
  if (targetLocale.value === sourceLocale.value) {
    toastService?.show({
      message: 'Cannot generate translations for the same locale',
      type: 'warning'
    });
    return;
  }

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: 'Generate All Translations',
      message: `Generate ${missingTranslationsCount.value} missing translations for ${targetLocale.value} using AI?\n\nThis will use GPT-4 to translate all missing items.`,
      confirmLabel: 'Generate All',
      cancelLabel: 'Cancel',
      confirmColor: 'primary',
      icon: Icons.SPARKLE,
      onConfirm: performBatchTranslation
    }
  });
}

// Separated function to perform batch translation
async function performBatchTranslation() {
  isGeneratingAll.value = true;
  batchProgress.value = { completed: 0, total: 0 };

  try {
    // Get all missing translations
    const missingRows = displayedTranslations.value.filter(row => !row.targetValue && row.sourceValue);

    batchProgress.value.total = missingRows.length;

    toastService?.show({
      message: `Generating ${missingRows.length} translations...`,
      type: 'info',
      duration: 10000 // Keep visible longer
    });

    // Use batch translation for efficiency
    const textsToTranslate = missingRows.map(row => ({
      key: row.key,
      text: row.sourceValue
    }));

    let generated = 0;

    try {
      // Translate in smaller batches to avoid rate limits
      const batchSize = 5;
      const results = [];

      for (let i = 0; i < missingRows.length; i += batchSize) {
        if (cancelBatch.value) break;

        const batch = missingRows.slice(i, i + batchSize);

        const batchPromises = batch.map(async row => {
          try {
            currentTranslatingKey.value = row.key;
            const translatedValue = await translateWithGPT(
              row.sourceValue,
              sourceLocale.value,
              targetLocale.value
            );
            batchProgress.value.completed++;
            return { key: row.key, value: translatedValue };
          } catch (error) {
            console.error(`Failed to translate ${row.key}:`, error);
            batchProgress.value.completed++;
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Show progress
        if (i + batchSize < missingRows.length) {
          toastService?.show({
            message: `Translated ${Math.min(i + batchSize, missingRows.length)} of ${missingRows.length}...`,
            type: 'info'
          });
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Results are already collected in the loop above

      // Save all successful translations
      for (const result of results) {
        if (result) {
          try {
            await translationService.saveTranslation(
              result.key,
              targetLocale.value,
              result.value,
              true // mark as auto-translated
            );
            generated++;
          } catch (error) {
            console.error(`Failed to save translation for ${result.key}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Batch translation failed, falling back to individual translations:', error);

      // Fallback to individual translations
      for (const row of missingRows) {
        if (cancelBatch.value) break;

        try {
          currentTranslatingKey.value = row.key;
          const translatedValue = await translateWithGPT(
            row.sourceValue,
            sourceLocale.value,
            targetLocale.value
          );

          await translationService.saveTranslation(
            row.key,
            targetLocale.value,
            translatedValue,
            true // mark as auto-translated
          );

          generated++;
          batchProgress.value.completed++;
        } catch (error) {
          console.error(`Failed to translate ${row.key}:`, error);
          batchProgress.value.completed++;
        }
      }
    }

    // Reload translations
    await loadTranslations();

    toastService?.show({
      message: `Generated ${generated} of ${missingRows.length} translations`,
      type: generated === missingRows.length ? 'success' : 'warning'
    });

  } catch (error) {
    console.error('Error generating translations:', error);
    toastService?.show({
      message: 'Failed to generate translations',
      type: 'error'
    });
  } finally {
    currentTranslatingKey.value = '';
    batchProgress.value = { completed: 0, total: 0 };
    isGeneratingAll.value = false;
    cancelBatch.value = false;
  }
}

// Delete key
async function deleteKey(key: string) {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: 'Delete Translation Key',
      message: `Delete translation key "${key}"?\n\nThis will remove the key from all locales.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'error',
      icon: Icons.MULTIPLY_M,
      onConfirm: async () => {
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
    }
  });
}

// Add key modal
async function showAddKeyModal() {
  // For now, use simple prompts
  const key = window.prompt('Enter translation key (e.g., common.newFeature):');
  if (!key) return;

  // Validate key
  if (!/^[a-zA-Z0-9._]+$/.test(key)) {
    toastService?.show({
      message: 'Key can only contain letters, numbers, dots, and underscores',
      type: 'error'
    });
    return;
  }

  if (allKeys.value.includes(key)) {
    toastService?.show({
      message: 'This key already exists',
      type: 'error'
    });
    return;
  }

  const englishValue = window.prompt('Enter the English translation:');
  if (!englishValue) return;

  const generateAll = window.confirm('Auto-generate translations for all languages?');

  const result = { key, englishValue, generateAll };

  try {
    // First, create the English translation
    await translationService.saveTranslation(
      result.key,
      'en',
      result.englishValue,
      false
    );

    // If auto-generate is checked, generate for all other locales
    if (result.generateAll) {
      toastService?.show({
        message: 'Key added. Generating translations for all languages...',
        type: 'info'
      });

      // Get all unique locales except English
      const allLanguages = availableLanguages.value.filter(lang => lang !== 'en');
      let generated = 0;

      // Process in batches by target language
      for (const language of allLanguages) {
        try {
          const translatedValue = await translateWithGPT(
            result.englishValue,
            'en',
            language
          );

          await translationService.saveTranslation(
            result.key,
            language,
            translatedValue,
            true // mark as auto-translated
          );

          generated++;
        } catch (error) {
          console.error(`Failed to generate translation for ${language}:`, error);
        }
      }

      toastService?.show({
        message: `Key added with ${generated} auto-generated translations`,
        type: 'success'
      });
    } else {
      toastService?.show({
        message: 'Translation key added successfully',
        type: 'success'
      });
    }

    // Reload translations
    await loadTranslations();

  } catch (error) {
    console.error('Error adding translation key:', error);
    toastService?.show({
      message: 'Failed to add translation key',
      type: 'error'
    });
  }
}

// Import translations modal
async function showImportModal() {
  console.log('Opening import modal...');

  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';

  // Add to body temporarily to ensure it works
  document.body.appendChild(fileInput);

  fileInput.onchange = async (event: Event) => {
    console.log('File selected!');
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    // Remove from body
    document.body.removeChild(fileInput);

    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Processing file:', file.name);

    try {
      // Read file content
      const content = await file.text();
      console.log('File content length:', content.length);

      const translations = JSON.parse(content);
      console.log('Parsed translations, keys:', Object.keys(translations).length);

      // Validate it's an object
      if (typeof translations !== 'object' || Array.isArray(translations)) {
        throw new Error('Invalid JSON format. Expected object with key-value pairs.');
      }

      // Get language from filename
      const filename = file.name.replace('.json', '');

      // Simple prompt for language
      const language = window.prompt(
        'Enter the language code for these translations (e.g., en, fr, de):',
        filename
      );

      if (!language) {
        console.log('Import cancelled - no language provided');
        return;
      }

      console.log('Importing translations for language:', language);

      // Import translations
      await importTranslations(translations, language);

    } catch (error: any) {
      console.error('Error importing file:', error);
      toastService?.show({
        message: `Import error: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Trigger file selection
  fileInput.click();
}

// Import translations to database
async function importTranslations(translations: Record<string, any>, languageCode: string) {
  console.log('Starting import for language:', languageCode);
  console.log('Translation keys to import:', Object.keys(translations));

  // First, check if language exists in the database BEFORE any import attempts
  // Since checkLanguageExists is not available, we'll check by trying to load translations
  let languageExists = false;
  try {
    const testTranslations = await translationService.getTranslations(languageCode);
    languageExists = true; // If no error, language exists
  } catch (error: any) {
    // If error includes foreign key constraint, language doesn't exist
    if (error.message?.includes('foreign key constraint') || error.message?.includes('i18n_locales')) {
      languageExists = false;
    } else {
      // Different error, might still exist
      languageExists = true;
    }
  }
  console.log('Language exists?', languageExists);

  // If language doesn't exist, offer to create it
  if (!languageExists) {
    const shouldCreateLanguage = window.confirm(
      `The language "${languageCode}" doesn't exist in the system.\n\nWould you like to create it first before importing?`
    );

    if (!shouldCreateLanguage) {
      toastService?.show({
        message: 'Import cancelled. Language must exist before importing translations.',
        type: 'warning'
      });
      return;
    }

    // Get language name from user
    const languageName = window.prompt(
      `Enter the display name for language "${languageCode}" (e.g., "Welsh", "French", etc.):`,
      ''
    );

    if (!languageName) {
      toastService?.show({
        message: 'Import cancelled. Language name is required.',
        type: 'warning'
      });
      return;
    }

    const nativeName = window.prompt(
      `Enter the native name for language "${languageCode}" (e.g., "Cymraeg" for Welsh):`,
      languageName
    );

    if (!nativeName) {
      toastService?.show({
        message: 'Import cancelled. Native name is required.',
        type: 'warning'
      });
      return;
    }

    try {
      // Create the language - since createLanguage is not available, just create locale
      // await translationService.createLanguage(languageCode, languageName, nativeName);

      // Create a default locale for this language
      await translationService.createLocale(languageCode, languageName, nativeName);

      toastService?.show({
        message: `Language "${languageCode}" created successfully. Starting import...`,
        type: 'success'
      });
    } catch (createError) {
      console.error('Error creating language:', createError);
      toastService?.show({
        message: `Failed to create language "${languageCode}". Import cancelled.`,
        type: 'error'
      });
      return;
    }
  }

  // Flatten nested translations
  const flatTranslations = flattenObject(translations);
  const totalKeys = Object.keys(flatTranslations).length;
  const translationEntries = Object.entries(flatTranslations);

  console.log('Flattened translations:', flatTranslations);
  console.log('Total keys after flattening:', totalKeys);
  console.log('Sample keys:', Object.keys(flatTranslations).slice(0, 10));

  let imported = 0;
  let failed = 0;
  let currentIndex = 0;
  let cancelled = false;

  // Show toast for import start
  toastService?.show({
    message: `Starting import of ${totalKeys} translations...`,
    type: 'info',
    duration: 3000
  });

  console.log('Starting to import', totalKeys, 'translations');

  try {
    // Import each translation
    for (const [key, value] of translationEntries) {
      if (cancelled) break;

      currentIndex++;

      if (currentIndex % 10 === 0) {
        console.log(`Progress: ${currentIndex}/${totalKeys}`);
      }

      try {
        const result = await translationService.saveTranslation(
          key,
          languageCode,
          String(value),
          false // not auto-translated
        );
        console.log(`Imported ${key} with result:`, result);
        imported++;
      } catch (error: any) {
        console.error(`Failed to import ${key}:`, error);
        // If it's a permissions issue, log it specifically
        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('Permission issue detected:', error.message);
        }
        failed++;
      }

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Import completed
    console.log(`Import completed: ${imported} successful, ${failed} failed`);

    // Check if we need to approve pending translations
    try {
      const pendingTranslations = await translationService.getPendingTranslations(languageCode);
      console.log(`Found ${pendingTranslations.length} pending translations for ${languageCode}`);

      if (pendingTranslations.length > 0) {
        const shouldApprove = window.confirm(
          `There are ${pendingTranslations.length} pending translations that need approval.\n\nWould you like to approve them all now?`
        );

        if (shouldApprove) {
          toastService?.show({
            message: `Approving ${pendingTranslations.length} translations...`,
            type: 'info'
          });

          const versionIds = pendingTranslations.map(t => t.id);
          const approvedCount = await translationService.batchApprove(versionIds, 'Bulk approval after import');

          toastService?.show({
            message: `Approved ${approvedCount} translations`,
            type: 'success'
          });
        }
      }
    } catch (approvalError) {
      console.error('Error checking/approving pending translations:', approvalError);
    }

    // Reload translations
    await loadTranslations();

    // Show completion message
    if (cancelled) {
      toastService?.show({
        message: `Import cancelled. ${imported} of ${totalKeys} translations were imported.`,
        type: 'warning'
      });
    } else {
      toastService?.show({
        message: `Import completed. ${imported} imported, ${failed} failed out of ${totalKeys} total.`,
        type: failed > 0 ? 'warning' : 'success'
      });
    }

  } catch (error: any) {
    console.error('Error importing translations:', error);

    // Error occurred

    toastService?.show({
      message: `Import error: ${error.message}`,
      type: 'error'
    });
  }
}

// Batch actions for selected items
async function deleteSelectedKeys() {
  if (selectedKeys.value.size === 0) return;

  const keysToDelete = Array.from(selectedKeys.value);
  const confirmMessage = `Delete ${keysToDelete.length} selected translation key${keysToDelete.length === 1 ? '' : 's'}?\n\nThis will remove ${keysToDelete.length === 1 ? 'this key' : 'these keys'} from all locales.`;

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: 'Delete Selected Keys',
      message: confirmMessage,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'error',
      icon: Icons.MULTIPLY_M,
      onConfirm: async () => {
        try {
          let deleted = 0;
          for (const key of keysToDelete) {
            try {
              await translationService.deleteTranslationKey(key);
              deleted++;
            } catch (error) {
              console.error(`Failed to delete key ${key}:`, error);
            }
          }

          await loadTranslations();
          clearSelections();

          toastService?.show({
            message: `Deleted ${deleted} of ${keysToDelete.length} selected keys`,
            type: deleted === keysToDelete.length ? 'success' : 'warning'
          });
        } catch (error) {
          console.error('Error deleting selected keys:', error);
          toastService?.show({
            message: 'Failed to delete selected keys',
            type: 'error'
          });
        }
      }
    }
  });
}

async function autoTranslateSelected() {
  if (selectedKeys.value.size === 0) return;

  const selectedRows = displayedTranslations.value.filter(row =>
    selectedKeys.value.has(row.key) && row.sourceValue && !row.targetValue
  );

  if (selectedRows.length === 0) {
    toastService?.show({
      message: 'No selected items need translation (they either have no source text or are already translated)',
      type: 'warning'
    });
    return;
  }

  // Use existing batch translation logic but only for selected items
  isGeneratingAll.value = true;
  batchProgress.value = { completed: 0, total: selectedRows.length };

  try {
    let generated = 0;

    toastService?.show({
      message: `Auto-translating ${selectedRows.length} selected items...`,
      type: 'info',
      duration: 5000
    });

    // Process selected items
    for (const row of selectedRows) {
      if (cancelBatch.value) break;

      try {
        currentTranslatingKey.value = row.key;
        const translatedValue = await translateWithGPT(
          row.sourceValue,
          sourceLocale.value,
          targetLocale.value
        );

        await translationService.saveTranslation(
          row.key,
          targetLocale.value,
          translatedValue,
          true // mark as auto-translated
        );

        generated++;
        batchProgress.value.completed++;
      } catch (error) {
        console.error(`Failed to translate ${row.key}:`, error);
        batchProgress.value.completed++;
      }
    }

    // Reload translations
    await loadTranslations();
    clearSelections();

    toastService?.show({
      message: `Generated ${generated} of ${selectedRows.length} selected translations`,
      type: generated === selectedRows.length ? 'success' : 'warning'
    });

  } catch (error) {
    console.error('Error auto-translating selected items:', error);
    toastService?.show({
      message: 'Failed to auto-translate selected items',
      type: 'error'
    });
  } finally {
    currentTranslatingKey.value = '';
    batchProgress.value = { completed: 0, total: 0 };
    isGeneratingAll.value = false;
    cancelBatch.value = false;
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

// Cancel batch translation
function cancelBatchTranslation() {
  cancelBatch.value = true;
}

// Cleanup corrupted keys
async function cleanupCorruptedKeys() {
  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: 'Clean Corrupted Keys',
      message: `Found ${corruptedKeysCount.value} keys containing "[object Object]".\n\nDo you want to delete all these corrupted keys?\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete All',
      cancelLabel: 'Cancel',
      confirmColor: 'error',
      icon: Icons.WARNING,
      onConfirm: async () => {
        isCleaningKeys.value = true;

        try {
          // Since deleteCorruptedKeys is not available, do it manually
          const allKeys = await translationService.getAllKeys();
          const corruptedKeys = allKeys.filter(key => key.includes('[object Object]'));

          let deleted = 0;
          for (const key of corruptedKeys) {
            try {
              await translationService.deleteTranslationKey(key);
              deleted++;
            } catch (error) {
              console.error(`Failed to delete key ${key}:`, error);
            }
          }

          // Reload translations
          await loadTranslations();

          toastService?.show({
            message: `Successfully deleted ${deleted} corrupted keys`,
            type: 'success'
          });
        } catch (error) {
          console.error('Error cleaning corrupted keys:', error);
          toastService?.show({
            message: 'Failed to clean corrupted keys',
            type: 'error'
          });
        } finally {
          isCleaningKeys.value = false;
        }
      }
    }
  });
}

// Approve all pending translations
async function approveAllPending() {
  if (pendingCount.value === 0) return;

  popupService?.open({
    component: ConfirmDialog,
    props: {
      title: 'Approve All Pending Translations',
      message: `Approve all ${pendingCount.value} pending translations?\n\nThis will mark all pending translations as approved.`,
      confirmLabel: 'Approve All',
      cancelLabel: 'Cancel',
      confirmColor: 'success',
      icon: Icons.CHECK_M,
      onConfirm: async () => {
        isApprovingAll.value = true;

        try {
          // Get all pending translations
          const pendingTranslations = await translationService.getPendingTranslations();
          const versionIds = pendingTranslations.map(t => t.id);

          toastService?.show({
            message: `Approving ${versionIds.length} translations...`,
            type: 'info'
          });

          const approvedCount = await translationService.batchApprove(versionIds, 'Bulk approval from admin panel');

          // Reload translations
          await loadTranslations();

          toastService?.show({
            message: `Successfully approved ${approvedCount} translations`,
            type: 'success'
          });
        } catch (error) {
          console.error('Error approving all pending:', error);
          toastService?.show({
            message: 'Failed to approve pending translations',
            type: 'error'
          });
        } finally {
          isApprovingAll.value = false;
        }
      }
    }
  });
}

onMounted(async () => {
  // Load available languages first
  await loadAvailableLanguages();
  // Load translations
  await loadTranslations();
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

  &__filter-toggle {
    &--active {
      background-color: var(--color-primary);
      color: var(--color-primary-text);
    }
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

  &__list-container {
    flex: 1;
    overflow: auto;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);

    &--selecting {
      user-select: none;
      cursor: pointer;
    }
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
    width: 100%;
  }

  &__target-display {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex: 1;
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

  &__progress-section {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space);
    margin-bottom: var(--space);
  }

  &__progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-s);

    h3 {
      margin: 0;
      color: var(--color-foreground);
      font-size: var(--font-size-lg);
    }
  }

  &__progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-s);
    gap: var(--space);
  }

  &__progress-current {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-family: monospace;
    font-size: var(--font-size-s);
    color: var(--color-primary);
    margin: 0;
    flex: 1;
  }

  &__progress-stats {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-background);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--space-xs);
    border: 1px solid var(--color-border);
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
    transition: width 0.3s ease;
    border-radius: 3px;
  }

  &__progress-percentage {
    text-align: center;
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
    margin: 0;
    font-size: var(--font-size-s);
  }

  &__status-bar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space);
  }

  &__status-bar-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
  }

  &__status-bar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }
}
</style>
