<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t(keys.admin.translations.approvalTitle)"
      :description="t(keys.admin.translations.approvalDescription)"
    >
      <template #actions>
        <TButton
          type="ghost"
          :icon="Icons.CHECK_M"
          @click="batchApproveSelected"
          :disabled="selectedIds.size === 0"
        >
          {{ t(keys.admin.translations.approveSelected, { count: selectedIds.size }) }}
        </TButton>
      </template>

      <template #inputs>
        <TInputSelect
          v-model="filterLocale"
          :options="localeOptions"
          :label="t(keys.admin.translations.filterByLocale)"
          :class="bemm('filter')"
        />

        <TInputSelect
          v-model="filterContributor"
          :options="contributorOptions"
          :label="t(keys.admin.translations.filterByContributor)"
          :class="bemm('filter')"
        />
      </template>

      <template #stats>
        <TKeyValue
          :items="[
            { key: t(keys.admin.translations.pendingReview), value: String(pendingCount) }
          ]"
        />
      </template>
    </AdminPageHeader>

    <!-- Pending Translations Table -->
    <div :class="bemm('table-container')">
      <table :class="bemm('table')">
        <thead>
          <tr>
            <th :class="bemm('th', 'checkbox')">
              <TInputCheckbox
                v-model="selectAll"
                @update:modelValue="toggleSelectAll"
              />
            </th>
            <th :class="bemm('th')">{{ t(keys.admin.translations.key) }}</th>
            <th :class="bemm('th')">{{ t(keys.admin.translations.locale) }}</th>
            <th :class="bemm('th')">{{ t(keys.admin.translations.currentValue) }}</th>
            <th :class="bemm('th')">{{ t(keys.admin.translations.proposedValue) }}</th>
            <th :class="bemm('th')">{{ t(keys.admin.translations.contributor) }}</th>
            <th :class="bemm('th')">{{ t(keys.admin.translations.submitted) }}</th>
            <th :class="bemm('th', 'actions')">{{ t(keys.common.actions) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="translation in filteredTranslations"
            :key="translation.id"
            :class="bemm('row', { selected: selectedIds.has(translation.id) })"
          >
            <td :class="bemm('td', 'checkbox')">
              <TInputCheckbox
                :modelValue="selectedIds.has(translation.id)"
                @update:modelValue="toggleSelection(translation.id)"
              />
            </td>
            <td :class="bemm('td')">
              <span :class="bemm('key')">{{ translation.key }}</span>
            </td>
            <td :class="bemm('td')">
              <span :class="bemm('locale')">
                {{ translation.flag_emoji }} {{ translation.locale }}
              </span>
            </td>
            <td :class="bemm('td')">
              <span :class="bemm('value', 'current')">
                {{ translation.previous_value || '—' }}
              </span>
            </td>
            <td :class="bemm('td')">
              <span :class="bemm('value', 'proposed')">
                {{ translation.value }}
              </span>
              <TIcon
                v-if="translation.auto_translated"
                :name="Icons.SPARKLE"
                :class="bemm('auto-icon')"
                :title="t(keys.admin.translations.autoTranslatedTooltip)"
              />
            </td>
            <td :class="bemm('td')">
              <div :class="bemm('contributor')">
                <span :class="bemm('contributor-name')">
                  {{ translation.creator_name || translation.creator_email }}
                </span>
              </div>
            </td>
            <td :class="bemm('td')">
              <span :class="bemm('date')">
                {{ formatDate(translation.created_at) }}
              </span>
            </td>
            <td :class="bemm('td', 'actions')">
              <div :class="bemm('actions')">
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.CHECK"
                  @click="approveTranslation(translation)"
                  :title="t(keys.admin.translations.approve)"
                />
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.CLOSE"
                  @click="rejectTranslation(translation)"
                  :title="t(keys.admin.translations.reject)"
                />
                <TButton
                  type="ghost"
                  size="small"
                  :icon="Icons.HISTORY"
                  @click="viewHistory(translation)"
                  :title="t(keys.admin.translations.viewHistory)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <TEmpty
      v-if="!loading && filteredTranslations.length === 0"
      :icon="Icons.CHECK_CIRCLE"
      :title="t(keys.admin.translations.noPendingTranslations)"
      :description="t(keys.admin.translations.allTranslationsReviewed)"
    />

    <TSpinner v-if="loading" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { translationService } from '@tiko/core';
import type { TranslationVersion } from '@tiko/core';
import type { PopupService, ToastService } from '@tiko/ui';
import AdminPageHeader from '@/components/AdminPageHeader.vue';
import {
  TButton,
  TIcon,
  TEmpty,
  TSpinner,
  useI18n,
  TInputSelect,
  TInputCheckbox,
  TKeyValue,
} from '@tiko/ui';

const bemm = useBemm('translation-approval');
const { keys, t } = useI18n();
const popupService = inject<PopupService>('popupService');
const toastService = inject<ToastService>('toastService');

// State
const loading = ref(false);
const pendingTranslations = ref<TranslationVersion[]>([]);
const selectedIds = ref(new Set<string>());
const selectAll = ref(false);
const filterLocale = ref('all');
const filterContributor = ref('all');

// Computed
const pendingCount = computed(() => pendingTranslations.value.length);

const localeOptions = computed(() => {
  const locales = new Set(pendingTranslations.value.map(t => t.locale));
  return [
    { value: 'all', label: t(keys.common.all) },
    ...Array.from(locales).map(locale => ({
      value: locale,
      label: locale,
    })),
  ];
});

const contributorOptions = computed(() => {
  const contributors = new Map<string, string>();
  pendingTranslations.value.forEach(t => {
    contributors.set(
      t.created_by,
      t.creator_name || t.creator_email || 'Unknown'
    );
  });

  return [
    { value: 'all', label: t(keys.common.all) },
    ...Array.from(contributors.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    })),
  ];
});

const filteredTranslations = computed(() => {
  let filtered = [...pendingTranslations.value];

  if (filterLocale.value !== 'all') {
    filtered = filtered.filter(t => t.locale === filterLocale.value);
  }

  if (filterContributor.value !== 'all') {
    filtered = filtered.filter(t => t.created_by === filterContributor.value);
  }

  return filtered;
});

// Methods
async function loadPendingTranslations() {
  loading.value = true;
  try {
    pendingTranslations.value = await translationService.getPendingTranslations();
  } catch (error) {
    console.error('Error loading pending translations:', error);
    toastService?.show({
      message: t(keys.errors.loadingData),
      type: 'error',
    });
  } finally {
    loading.value = false;
  }
}

function toggleSelection(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }

  // Update select all checkbox
  selectAll.value = selectedIds.value.size === filteredTranslations.value.length;
}

function toggleSelectAll(value: boolean) {
  if (value) {
    filteredTranslations.value.forEach(t => selectedIds.value.add(t.id));
  } else {
    selectedIds.value.clear();
  }
}

async function approveTranslation(translation: TranslationVersion) {
  try {
    await translationService.approveTranslation(translation.id);

    toastService?.show({
      message: t(keys.admin.translations.approveSuccess),
      type: 'success',
    });

    // Reload
    await loadPendingTranslations();
  } catch (error) {
    console.error('Error approving translation:', error);
    toastService?.show({
      message: t(keys.admin.translations.approveError),
      type: 'error',
    });
  }
}

async function rejectTranslation(translation: TranslationVersion) {
  const notes = await popupService?.prompt({
    title: t(keys.admin.translations.rejectTitle),
    message: t(keys.admin.translations.rejectMessage),
    placeholder: t(keys.admin.translations.rejectReason),
    confirmText: t(keys.admin.translations.reject),
    confirmType: 'danger',
  });

  if (!notes) return;

  try {
    await translationService.rejectTranslation(translation.id, notes);

    toastService?.show({
      message: t(keys.admin.translations.rejectSuccess),
      type: 'success',
    });

    // Reload
    await loadPendingTranslations();
  } catch (error) {
    console.error('Error rejecting translation:', error);
    toastService?.show({
      message: t(keys.admin.translations.rejectError),
      type: 'error',
    });
  }
}

async function batchApproveSelected() {
  const count = selectedIds.value.size;

  const confirmed = await popupService?.confirm({
    title: t(keys.admin.translations.batchApproveTitle),
    message: t(keys.admin.translations.batchApproveMessage, { count }),
    confirmText: t(keys.admin.translations.approve),
  });

  if (!confirmed) return;

  try {
    const approved = await translationService.batchApprove(
      Array.from(selectedIds.value)
    );

    toastService?.show({
      message: t(keys.admin.translations.batchApproveSuccess, { count: approved }),
      type: 'success',
    });

    selectedIds.value.clear();
    selectAll.value = false;

    // Reload
    await loadPendingTranslations();
  } catch (error) {
    console.error('Error batch approving:', error);
    toastService?.show({
      message: t(keys.admin.translations.batchApproveError),
      type: 'error',
    });
  }
}

async function viewHistory(translation: TranslationVersion) {
  // TODO: Show history modal
  toastService?.show({
    message: t(keys.admin.translations.historyNotImplemented),
    type: 'info',
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return t(keys.common.minutesAgo, { count: minutes });
  } else if (hours < 24) {
    return t(keys.common.hoursAgo, { count: hours });
  } else {
    const days = Math.floor(hours / 24);
    return t(keys.common.daysAgo, { count: days });
  }
}

onMounted(() => {
  loadPendingTranslations();
});
</script>

<style lang="scss">
@use "../styles/mixins" as m;

.translation-approval {
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

  &__filters {
    display: flex;
    gap: var(--space);
    align-items: center;
  }

  &__filter {
    width: 200px;
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

    &--checkbox {
      width: 40px;
    }

    &--actions {
      width: 120px;
    }
  }

  &__row {
    &:hover {
      background: var(--color-background-secondary);
    }

    &--selected {
      background: var(--color-primary-light);
    }
  }

  &__td {
    padding: var(--space-s) var(--space);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }

  &__key {
    font-family: monospace;
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__locale {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__value {
    display: block;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--current {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-s);
    }

    &--proposed {
      color: var(--color-foreground);
      font-weight: var(--font-weight-medium);
    }
  }

  &__auto-icon {
    color: var(--color-primary);
    font-size: var(--font-size-s);
    margin-left: var(--space-xs);
  }

  &__contributor {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__contributor-name {
    font-size: var(--font-size-s);
  }

  &__date {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }

  &__actions {
    display: flex;
    gap: var(--space-xs);
  }
}</style>
