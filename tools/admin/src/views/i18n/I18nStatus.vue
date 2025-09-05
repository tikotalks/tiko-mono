<template>
  <div :class="bemm()">
    <h1 :class="bemm('title')">
      {{ t('admin.i18n.status.title') || 'i18n Status' }}
    </h1>
    <p :class="bemm('description')">
      {{
        t('admin.i18n.status.description') ||
        'Current i18n system status and diagnostics'
      }}
    </p>

    <!-- Current Status -->
    <TCard :class="bemm('section')">
      <div :class="bemm('section-header')">
        <h2 :class="bemm('section-title')">
          {{ t('admin.i18n.status.currentStatus') || 'Current Status' }}
        </h2>
        <TButton
          :icon="Icons.REFRESH"
          @click="handleReloadTranslations"
          :status="isReloading ? 'loading' : 'idle'"
          size="small"
        >
          {{ t('admin.i18n.status.reloadTranslations') || 'Reload Translations' }}
        </TButton>
      </div>

      <TKeyValue
        :items="[
          {
            key: t('admin.i18n.status.currentLocale') || 'Current Locale',
            value: currentLocale,
          },
          {
            key: t('admin.i18n.status.availableLocales') || 'Available Locales',
            value: availableLocales.length,
          },
          {
            key: t('admin.i18n.status.isReady') || 'System Ready',
            value: isReady ? 'Yes' : 'No',
          },
          {
            key:
              t('admin.i18n.status.translationsLoaded') ||
              'Translations Loaded',
            value: translationsLoaded ? 'Yes' : 'No',
          },
        ]"
      />
    </TCard>

    <!-- Available Locales -->
    <TCard :class="bemm('section')">
      <h2 :class="bemm('section-title')">
        {{
          t('admin.i18n.status.availableLocalesTitle') || 'Available Locales'
        }}
      </h2>
      <div :class="bemm('locale-grid')">
        <TChip
          v-for="locale in availableLocales"
          :key="locale"
          :active="locale === currentLocale"
          @click="setLocale(locale)"
        >
          {{ locale }}
        </TChip>
      </div>
    </TCard>

    <!-- Translation Keys -->
    <TCard :class="bemm('section')">
      <h2 :class="bemm('section-title')">
        {{ t('admin.i18n.status.translationKeys') || 'Translation Keys' }}
      </h2>

      <TKeyValue
        :items="[
          {
            key: t('admin.i18n.status.totalKeys') || 'Total Keys',
            value: totalKeys,
          }
        ]"
      />

      <!-- Sample Keys -->
      <div :class="bemm('subsection')">
        <h3 :class="bemm('subsection-title')">
          {{ t('admin.i18n.status.sampleKeys') || 'Sample Keys' }}
        </h3>
        <div :class="bemm('sample-keys')">
          <div v-for="key in sampleKeys" :key="key" :class="bemm('sample-key')">
            <code :class="bemm('key-name')">{{ key }}</code>
            <span :class="bemm('key-value')">{{
              getSampleTranslation(key)
            }}</span>
          </div>
        </div>
      </div>
    </TCard>

    <!-- Debug Information -->
    <TCard :class="bemm('section')">
      <h2 :class="bemm('section-title')">
        {{ t('admin.i18n.status.debugInfo') || 'Debug Information' }}
      </h2>

      <div :class="bemm('debug-info')">
        <TKeyValue
          :items="[
            {
              key: t('admin.i18n.status.keysObject') || 'Keys Object Available',
              value: keysAvailable ? 'Yes' : 'No',
            },
            {
              key: t('admin.i18n.status.functionType') || 't() Function Type',
              value: typeof t,
            },
          ]"
        />

        <div :class="bemm('subsection')">
          <h3 :class="bemm('subsection-title')">
            {{ t('admin.i18n.status.translationTest') || 'Translation Test' }}
          </h3>
          <div :class="bemm('test-results')">
            <div :class="bemm('test-item')">
              <code>t('common.save')</code> → "{{ t('common.save') }}"
            </div>
            <div :class="bemm('test-item')">
              <code>t('admin.navigation.dashboard')</code> → "{{
                t('admin.navigation.dashboard')
              }}"
            </div>
            <div :class="bemm('test-item')">
              <code>t('admin.navigation.users')</code> → "{{
                t('admin.navigation.users')
              }}"
            </div>
          </div>
        </div>
      </div>
    </TCard>

    <!-- Raw Keys Preview -->
    <TCard :class="bemm('section')">
      <h2 :class="bemm('section-title')">
        {{ t('admin.i18n.status.rawKeysPreview') || 'Raw Keys Preview' }}
      </h2>
      <pre :class="bemm('code-block')" :style="{
        maxHeight: '400px',
        overflowY: 'auto',
      }">{{ keysPreview }}</pre>
    </TCard>

    <!-- Search Keys -->
    <TCard :class="bemm('section')">
      <h2 :class="bemm('section-title')">
        {{ t('admin.i18n.status.searchKeys') || 'Search Keys' }}
      </h2>
      <TInput
        v-model="keySearch"
        :placeholder="t('admin.i18n.status.searchPlaceholder') || 'Search for a key (e.g. admin.navigation)'"
        :icon="Icons.SEARCH_M"
        :class="bemm('search-input')"
      />

      <div v-if="keySearch" :class="bemm('search-results')">
        <h3 :class="bemm('subsection-title')">
          {{ t('admin.i18n.status.searchResults') || 'Search Results' }}
        </h3>
        <div v-if="searchResults.length === 0" :class="bemm('no-results')">
          {{ t('admin.i18n.status.noResults') || 'No keys found matching' }} "{{ keySearch }}"
        </div>
        <div v-else :class="bemm('results-list')">
          <div :class="bemm('results-count')">
            {{ t('admin.i18n.status.foundKeys') || 'Found' }} {{ searchResults.length }} {{ t('admin.i18n.status.keys') || 'keys' }}
          </div>
          <div v-for="result in searchResults" :key="result.key" :class="bemm('result-item')">
            <code :class="bemm('result-key')">{{ result.key }}</code>
            <span :class="bemm('result-value')">{{ result.value }}</span>
          </div>
        </div>
      </div>
    </TCard>

    <!-- All Keys List -->
    <TCard :class="bemm('section')">
      <h2 :class="bemm('section-title')">
        {{ t('admin.i18n.status.allKeys') || 'All Translation Keys' }}
      </h2>
      <div :class="bemm('key-stats')">
        <TKeyValue
          :items="[
            {
              key: t('admin.i18n.status.totalKeys') || 'Total Keys',
              value: allKeysList.length,
            },
            {
              key: t('admin.i18n.status.adminKeys') || 'Admin Keys',
              value: allKeysList.filter(k => k.startsWith('admin.')).length,
            },
            {
              key: t('admin.i18n.status.commonKeys') || 'Common Keys',
              value: allKeysList.filter(k => k.startsWith('common.')).length,
            }
          ]"
        />
      </div>

      <details :class="bemm('expandable')">
        <summary :class="bemm('expandable-header')">
          {{ t('admin.i18n.status.showAllKeys') || 'Show All Keys' }} ({{ allKeysList.length }})
        </summary>
        <div :class="bemm('all-keys-list')">
          <div v-for="key in allKeysList" :key="key" :class="bemm('key-item')">
            <code>{{ key }}</code>
          </div>
        </div>
      </details>
    </TCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue';
import { useBemm } from 'bemm';
import { useI18n } from '@tiko/core';
import { TCard, TKeyValue, TChip, TInput, TButton, type ToastService } from '@tiko/ui';
import { Icons } from 'open-icon';
import { reloadI18nTranslations } from '@/utils/reload-i18n';

const bemm = useBemm('i18n-status');
const { t, currentLocale, availableLocales, isReady, keys, setLocale } =
  useI18n();
const toastService = inject<ToastService>('toastService');

// Reload state
const isReloading = ref(false);

// Check if translations are loaded
const translationsLoaded = computed(() => {
  return keys.value !== null && Object.keys(keys.value || {}).length > 0;
});

// Check if keys are available
const keysAvailable = computed(() => {
  return keys.value !== null;
});

// Get total number of keys
const totalKeys = computed(() => {
  if (!keys.value) return 0;

  const countKeys = (obj: any): number => {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        count++;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += countKeys(obj[key]);
      }
    }
    return count;
  };

  return countKeys(keys.value);
});

// Sample keys to test
const sampleKeys = [
  'common.save',
  'common.cancel',
  'common.loading',
  'admin.navigation.dashboard',
  'admin.navigation.media',
  'admin.navigation.users',
  'admin.i18n.database.title',
  'admin.dashboard.title',
];

// Get sample translation
const getSampleTranslation = (key: string) => {
  const translation = t(key);
  return translation === key ? `❌ ${translation}` : `✅ ${translation}`;
};

// Keys preview - show first level of keys
const keysPreview = computed(() => {
  if (!keys.value) return 'No keys loaded';

  const preview: any = {};
  for (const key in keys.value) {
    if (typeof keys.value[key] === 'object') {
      preview[key] = Object.keys(keys.value[key]);
    } else {
      preview[key] = keys.value[key];
    }
  }

  return JSON.stringify(preview, null, 2);
});

// Search functionality
const keySearch = ref('');

// Get all keys as a flat list
const allKeysList = computed(() => {
  if (!keys.value) return [];

  const collectKeys = (obj: any, prefix = ''): string[] => {
    let result: string[] = [];

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'string') {
        result.push(fullKey);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result = result.concat(collectKeys(obj[key], fullKey));
      }
    }

    return result;
  };

  return collectKeys(keys.value).sort();
});

// Search results
const searchResults = computed(() => {
  if (!keySearch.value || !keys.value) return [];

  const searchLower = keySearch.value.toLowerCase();
  const results: Array<{ key: string; value: string }> = [];

  const searchInObject = (obj: any, prefix = '') => {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (fullKey.toLowerCase().includes(searchLower)) {
        if (typeof obj[key] === 'string') {
          results.push({ key: fullKey, value: obj[key] });
        } else {
          // If it's an object, just indicate it has sub-keys
          results.push({ key: fullKey, value: '[object with sub-keys]' });
        }
      }

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        searchInObject(obj[key], fullKey);
      }
    }
  };

  searchInObject(keys.value);
  return results;
});

// Reload translations handler
async function handleReloadTranslations() {
  isReloading.value = true;
  try {
    await reloadI18nTranslations();
    toastService?.show({
      message: t('admin.i18n.status.reloadSuccess') || 'Translations reloaded successfully',
      type: 'success',
    });
  } catch (error) {
    console.error('Failed to reload translations:', error);
    toastService?.show({
      message: t('admin.i18n.status.reloadError') || 'Failed to reload translations',
      type: 'error',
    });
  } finally {
    isReloading.value = false;
  }
}
</script>

<style lang="scss">
.i18-n-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);

  &__title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space-xs);
  }

  &__description {
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space-lg);
  }

  &__section {
    margin-bottom: var(--space-lg);
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__section-title {
    font-size: var(--font-size-lg);
    margin: 0;
  }

  &__subsection {
    margin-top: var(--space);
  }

  &__subsection-title {
    font-size: var(--font-size);
    margin-bottom: var(--space-s);
    color: var(--color-foreground-secondary);
  }

  &__locale-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
  }

  &__sample-keys {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__sample-key {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space-xs) var(--space-s);
    background-color: var(--color-background-secondary);
    border-radius: var(--radius-s);
  }

  &__key-name {
    font-family: var(--font-mono);
    font-size: var(--font-size-s);
    color: var(--color-primary);
    flex: 1;
  }

  &__key-value {
    font-size: var(--font-size-s);
  }

  &__debug-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__test-results {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__test-item {
    font-family: var(--font-mono);
    font-size: var(--font-size-s);
    padding: var(--space-xs) var(--space-s);
    background-color: var(--color-background-secondary);
    border-radius: var(--radius-s);
  }

  &__code-block {
    background-color: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--radius-s);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-s);
    max-height: 400px;
    overflow-y: auto;
  }

  &__search-input {
    margin-bottom: var(--space);
  }

  &__search-results {
    margin-top: var(--space);
  }

  &__no-results {
    color: var(--color-foreground-secondary);
    font-style: italic;
    padding: var(--space);
    text-align: center;
  }

  &__results-count {
    margin-bottom: var(--space-s);
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-s);
  }

  &__result-item {
    display: flex;
    align-items: baseline;
    gap: var(--space);
    padding: var(--space-xs) var(--space-s);
    background-color: var(--color-background-secondary);
    border-radius: var(--radius-s);
    margin-bottom: var(--space-xs);
  }

  &__result-key {
    font-family: var(--font-mono);
    font-size: var(--font-size-s);
    color: var(--color-primary);
    flex-shrink: 0;
  }

  &__result-value {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__key-stats {
    margin-bottom: var(--space);
  }

  &__expandable {
    margin-top: var(--space);
  }

  &__expandable-header {
    cursor: pointer;
    padding: var(--space-s) var(--space);
    background-color: var(--color-background-secondary);
    border-radius: var(--radius-s);
    font-weight: var(--font-weight-medium);
    user-select: none;

    &:hover {
      background-color: var(--color-background-tertiary);
    }
  }

  &__all-keys-list {
    margin-top: var(--space);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space);
    background-color: var(--color-background-secondary);
    border-radius: var(--radius-s);
  }

  &__key-item {
    font-family: var(--font-mono);
    font-size: var(--font-size-s);
    padding: var(--space-xxs) 0;
    color: var(--color-foreground-secondary);
  }
}
</style>
