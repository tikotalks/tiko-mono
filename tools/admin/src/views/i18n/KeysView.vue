<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">Translation Keys</h1>
      <div :class="bemm('actions')">
        <TInput
          v-model="searchQuery"
          placeholder="Search keys..."
          :icon="Icons.SEARCH_M"
          :class="bemm('search')"
        />
        <TButton
          type="ghost"
          :icon="Icons.ARROW_ROTATE_TOP_LEFT"
          @click="loadKeys"
          :loading="loading"
        >
          Refresh
        </TButton>
      </div>
    </div>

    <div :class="bemm('stats')">
      <div :class="bemm('stat')">
        <span :class="bemm('stat-label')">Total Keys</span>
        <span :class="bemm('stat-value')">{{ filteredKeys.length }}</span>
      </div>
      <div :class="bemm('stat')">
        <span :class="bemm('stat-label')">Displayed</span>
        <span :class="bemm('stat-value')">{{ filteredKeys.length }}</span>
      </div>
    </div>

    <div :class="bemm('list-container')" v-if="!loading">
      <TList>
        <TListItem
          v-for="key in filteredKeys"
          :key="key"
        >
          <TListCell type="custom">
            <span :class="bemm('key-text')">{{ key }}</span>
          </TListCell>
          <TListCell type="custom">
            <div :class="bemm('actions-cell')">
              <TButton
                type="ghost"
                size="small"
                :icon="Icons.COPY"
                @click="copyKey(key)"
                :title="t('admin.i18n.keys.actions.copyKey', 'Copy key')"
              />
            </div>
          </TListCell>
        </TListItem>
      </TList>
    </div>

    <div v-if="!loading && filteredKeys.length === 0" :class="bemm('empty')">
      <TIcon :name="Icons.HELLO_GOODBYE" :class="bemm('empty-icon')" />
      <h3 :class="bemm('empty-title')">No Keys Found</h3>
      <p :class="bemm('empty-description')">
        {{ searchQuery ? 'No keys match your search query' : 'No translation keys available' }}
      </p>
    </div>

    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import type { ToastService } from '@tiko/ui';
import {
  TButton,
  TInput,
  TIcon,
  TSpinner,
  TList,
  TListItem,
  TListCell,
  useI18n,
} from '@tiko/ui';

const bemm = useBemm('i18n-keys');
const toastService = inject<ToastService>('toastService');
const { keys } = useI18n();

// State
const loading = ref(false);
const searchQuery = ref('');
const allKeys = ref<string[]>([]);

// Get all keys from the keys.ts file
function extractAllTranslationKeys(obj: any, parentKey = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof obj[key] === 'string') {
      // If it's a string, use the dot notation path as the key
      keys.push(fullKey);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // If it's an object, recurse with the current path
      keys.push(...extractAllTranslationKeys(obj[key], fullKey));
    }
  }

  return keys;
}

// Load keys from the i18n service
function loadKeys() {
  loading.value = true;
  try {
    // Extract all keys from the keys object
    const extractedKeys = extractAllTranslationKeys(keys);
    allKeys.value = extractedKeys.sort();

    console.log('Loaded keys from i18n service:', allKeys.value.length);
  } catch (error) {
    console.error('Error loading keys:', error);
    toastService?.show({
      message: 'Failed to load translation keys',
      type: 'error'
    });
  } finally {
    loading.value = false;
  }
}

// Filtered keys based on search
const filteredKeys = computed(() => {
  if (!searchQuery.value) {
    return allKeys.value;
  }

  const query = searchQuery.value.toLowerCase();
  return allKeys.value.filter(key =>
    key.toLowerCase().includes(query)
  );
});

// Copy key to clipboard
async function copyKey(key: string) {
  try {
    await navigator.clipboard.writeText(key);
    toastService?.show({
      message: `Copied "${key}" to clipboard`,
      type: 'success',
      duration: 2000
    });
  } catch (error) {
    console.error('Failed to copy key:', error);
    toastService?.show({
      message: 'Failed to copy key to clipboard',
      type: 'error'
    });
  }
}

onMounted(() => {
  loadKeys();
});
</script>

<style lang="scss">
.i18n-keys {
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

  &__list-container {
    flex: 1;
    overflow: auto;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
  }

  &__key-text {
    font-family: monospace;
    font-size: var(--font-size-s);
    color: var(--color-foreground);
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
}
</style>
