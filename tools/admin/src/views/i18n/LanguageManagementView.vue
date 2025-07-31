<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t(keys.admin.languages.title)"
      :description="t(keys.admin.languages.description)"
    >
      <template #actions>
        <TButton :icon="Icons.ADD" @click="showAddLanguage">
          {{ t(keys.admin.languages.addLanguage) }}
        </TButton>
      </template>
    </AdminPageHeader>

    <!-- Language Tabs -->
    <div :class="bemm('tabs')">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="bemm('tab', { active: activeTab === tab.value })"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Languages Tab -->
    <div v-if="activeTab === 'languages'" :class="bemm('content')">
      <TList :columns="languageColumns" :show-stats="true">
        <TListItem
          v-for="language in languages"
          :key="language.code"
          :clickable="true"
          @click="editLanguage(language)"
        >
          <TListCell type="text" :content="language.code" />
          <TListCell type="text" :content="language.name" />
          <TListCell type="text" :content="language.native_name" />
          <TListCell type="custom">
            <TInputCheckbox
              v-model="language.enabled"
              @update:modelValue="toggleLanguage(language)"
              :disabled="language.code === 'en'"
            />
          </TListCell>
          <TListCell type="custom">
            <TIcon v-if="language.rtl" :name="Icons.ARROW_LEFT" />
          </TListCell>
        </TListItem>
      </TList>
    </div>

    <!-- Locales Tab -->
    <div v-else-if="activeTab === 'locales'" :class="bemm('content')">
      <div :class="bemm('filters')">
        <TInputSelect
          v-model="filterLanguage"
          :options="languageFilterOptions"
          :label="t(keys.admin.languages.filterByLanguage)"
        />
      </div>

      <TList :columns="localeColumns" :show-stats="true">
        <TListItem
          v-for="locale in filteredLocales"
          :key="locale.code"
          :clickable="true"
          @click="editLocale(locale)"
        >
          <TListCell type="text" :content="locale.code" />
          <TListCell type="text">
            <span>{{ locale.flag_emoji }} {{ locale.name }}</span>
          </TListCell>
          <TListCell type="text" :content="locale.native_name" />
          <TListCell type="text" :content="locale.currency_code || '—'" />
          <TListCell type="custom">
            <TInputCheckbox
              v-model="locale.enabled"
              @update:modelValue="toggleLocale(locale)"
            />
          </TListCell>
          <TListCell type="custom">
            <div :class="bemm('progress')">
              <div
                :class="bemm('progress-bar')"
                :style="{ width: `${getCompletionPercentage(locale.code)}%` }"
              />
              <span :class="bemm('progress-text')">
                {{ getCompletionPercentage(locale.code) }}%
              </span>
            </div>
          </TListCell>
        </TListItem>
      </TList>
    </div>

    <TSpinner v-if="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { translationService } from '@tiko/core';
import type { PopupService, ToastService } from '@tiko/ui';
import {
  TButton,
  TList,
  TListItem,
  TListCell,
  TInputCheckbox,
  TIcon,
  TSpinner,
  useI18n,
  TInputSelect,
} from '@tiko/ui';
import AdminPageHeader from '@/components/AdminPageHeader.vue';

interface Language {
  code: string;
  name: string;
  native_name: string;
  rtl: boolean;
  enabled: boolean;
}

interface Locale {
  code: string;
  language_code: string;
  country_code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  enabled: boolean;
  is_default: boolean;
  currency_code: string;
  fallback_locale: string;
}

const bemm = useBemm('language-management');
const { keys, t } = useI18n();
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');

// State
const loading = ref(false);
const activeTab = ref<'languages' | 'locales'>('languages');
const languages = ref<Language[]>([]);
const locales = ref<Locale[]>([]);
const filterLanguage = ref<string>('all');
const statistics = ref<any>({});

// Tabs
const tabs = [
  { value: 'languages', label: t(keys.admin.languages.languagesTab) },
  { value: 'locales', label: t(keys.admin.languages.localesTab) },
];

// Columns
const languageColumns = [
  { key: 'code', label: t(keys.admin.languages.code), width: '100px' },
  { key: 'name', label: t(keys.admin.languages.name), width: '1fr' },
  { key: 'native', label: t(keys.admin.languages.nativeName), width: '1fr' },
  { key: 'enabled', label: t(keys.admin.languages.enabled), width: '100px' },
  { key: 'rtl', label: 'RTL', width: '60px' },
];

const localeColumns = [
  { key: 'code', label: t(keys.admin.languages.code), width: '120px' },
  { key: 'name', label: t(keys.admin.languages.name), width: '1fr' },
  { key: 'native', label: t(keys.admin.languages.nativeName), width: '1fr' },
  { key: 'currency', label: t(keys.admin.languages.currency), width: '80px' },
  { key: 'enabled', label: t(keys.admin.languages.enabled), width: '100px' },
  { key: 'completion', label: t(keys.admin.languages.completion), width: '150px' },
];

// Computed
const languageFilterOptions = computed(() => [
  { value: 'all', label: t(keys.common.all) },
  ...languages.value.map(lang => ({
    value: lang.code,
    label: lang.name,
  })),
]);

const filteredLocales = computed(() => {
  if (filterLanguage.value === 'all') {
    return locales.value;
  }
  return locales.value.filter(locale =>
    locale.language_code === filterLanguage.value
  );
});

function getCompletionPercentage(locale: string): number {
  return statistics.value.completeness?.[locale]?.percentage || 0;
}

// Load data
async function loadData() {
  loading.value = true;
  try {
    // TODO: Load languages and locales from database
    // For now, using mock data
    languages.value = [
      { code: 'en', name: 'English', native_name: 'English', rtl: false, enabled: true },
      { code: 'fr', name: 'French', native_name: 'Français', rtl: false, enabled: true },
      { code: 'de', name: 'German', native_name: 'Deutsch', rtl: false, enabled: true },
      { code: 'es', name: 'Spanish', native_name: 'Español', rtl: false, enabled: true },
      { code: 'ar', name: 'Arabic', native_name: 'العربية', rtl: true, enabled: false },
    ];

    locales.value = [
      { code: 'en', language_code: 'en', country_code: 'US', name: 'English', native_name: 'English', flag_emoji: '🌐', enabled: true, is_default: true, currency_code: 'USD', fallback_locale: '' },
      { code: 'en-US', language_code: 'en', country_code: 'US', name: 'English (United States)', native_name: 'English (United States)', flag_emoji: '🇺🇸', enabled: true, is_default: false, currency_code: 'USD', fallback_locale: 'en' },
      { code: 'en-GB', language_code: 'en', country_code: 'GB', name: 'English (United Kingdom)', native_name: 'English (United Kingdom)', flag_emoji: '🇬🇧', enabled: true, is_default: false, currency_code: 'GBP', fallback_locale: 'en' },
      { code: 'fr', language_code: 'fr', country_code: 'FR', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷', enabled: true, is_default: true, currency_code: 'EUR', fallback_locale: '' },
      { code: 'fr-CA', language_code: 'fr', country_code: 'CA', name: 'French (Canada)', native_name: 'Français (Canada)', flag_emoji: '🇨🇦', enabled: true, is_default: false, currency_code: 'CAD', fallback_locale: 'fr' },
    ];

    // Load translation statistics
    statistics.value = await translationService.getStatistics();
  } catch (error) {
    console.error('Error loading data:', error);
    toastService?.show({
      message: t(keys.errors.loadingData),
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
}

// Actions
async function toggleLanguage(language: Language) {
  // TODO: Update in database
  toastService?.show({
    message: t(keys.admin.languages.languageUpdated, { name: language.name }),
    type: 'success',
  });
}

async function toggleLocale(locale: Locale) {
  // TODO: Update in database
  toastService?.show({
    message: t(keys.admin.languages.localeUpdated, { name: locale.name }),
    type: 'success',
  });
}

function editLanguage(language: Language) {
  // TODO: Open edit modal
  toastService?.show({
    message: t(keys.admin.languages.editNotImplemented),
    type: 'info',
  });
}

function editLocale(locale: Locale) {
  // TODO: Open edit modal
  toastService?.show({
    message: t(keys.admin.languages.editNotImplemented),
    type: 'info',
  });
}

function showAddLanguage() {
  // TODO: Open add modal
  toastService?.show({
    message: t(keys.admin.languages.addNotImplemented),
    type: 'info',
  });
}

onMounted(() => {
  loadData();
});
</script>

<style lang="scss">
@use "../styles/mixins" as m;

.language-management {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  padding: var(--space);
  height: 100%;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
    margin: 0;
  }

  &__tabs {
    display: flex;
    gap: var(--space-xs);
    border-bottom: 1px solid var(--color-border);
  }

  &__tab {
    padding: var(--space-s) var(--space);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-foreground-secondary);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--color-foreground);
    }

    &--active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }
  }

  &__content {
    flex: 1;
    overflow: auto;
  }

  &__filters {
    display: flex;
    gap: var(--space);
    padding: var(--space) 0;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
  }

  &__progress-bar {
    flex: 1;
    height: 4px;
    background: var(--color-primary);
    border-radius: 2px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--color-border);
      z-index: -1;
    }
  }

  &__progress-text {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
    min-width: 40px;
    text-align: right;
  }
}</style>
