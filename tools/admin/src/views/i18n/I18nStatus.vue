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
      <h2 :class="bemm('section-title')">
        {{ t('admin.i18n.status.currentStatus') || 'Current Status' }}
      </h2>

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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBemm } from 'bemm';
import { useI18n } from '@tiko/ui';
import { TCard, TKeyValue, TChip } from '@tiko/ui';

const bemm = useBemm('i18n-status');
const { t, currentLocale, availableLocales, isReady, keys, setLocale } =
  useI18n();

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
</script>

<style lang="scss" scoped>
.i18-n-status {
  padding: var(--space);
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

  &__section-title {
    font-size: var(--font-size-lg);
    margin-bottom: var(--space);
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
}
</style>
