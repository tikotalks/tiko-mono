<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="items.length === 0" :class="bemm('empty')">
      <p>{{ t('admin.collections.noItemsInCollection') }}</p>
    </div>

    <TVirtualGrid
      v-else
      :items="items"
      :min-item-width="150"
      :gap="16"
      :aspect-ratio="'1:1'"
    >
      <template #default="{ item }">
        <div 
          :class="bemm('item', selectedUrl === item.url ? 'selected' : '')"
          @click="selectImage(item.url)"
        >
          <img 
            :src="item.url" 
            :alt="item.name"
            :class="bemm('item-image')"
          />
          <div :class="bemm('item-overlay')">
            <TIcon v-if="selectedUrl === item.url" :name="Icons.CHECK" color="primary" />
          </div>
        </div>
      </template>
    </TVirtualGrid>

    <div :class="bemm('actions')">
      <TButton type="button" @click="$emit('close')">
        {{ t('common.cancel') }}
      </TButton>
      <TButton 
        color="primary"
        @click="confirmSelection"
        :disabled="!selectedUrl"
      >
        {{ t('common.select') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icons } from 'open-icon';
import { useBemm } from 'bemm';
import {
  useCollectionsStore,
  collectionsSupabaseService,
  type CollectionItem
} from '@tiko/core';
import {
  useI18n,
  TButton,
  TIcon,
  TSpinner,
  TVirtualGrid
} from '@tiko/ui';

const bemm = useBemm('collection-item-selector');
const { t } = useI18n();
const collectionsStore = useCollectionsStore();

interface Props {
  collectionId: string
  onSelect?: (imageUrl: string) => void
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: []
}>();

// State
const loading = ref(false);
const items = ref<Array<{ url: string; name: string }>>([]);
const selectedUrl = ref<string>('');

// Load collection items
const loadItems = async () => {
  loading.value = true;
  try {
    // Get collection items
    const collectionItems = await collectionsSupabaseService.getCollectionItems(props.collectionId);
    
    // Transform items to simple format with URLs
    items.value = collectionItems
      .filter(item => item.media)
      .map(item => ({
        url: item.media!.original_url || item.media!.url || '',
        name: item.media!.title || item.media!.original_filename || 'Untitled'
      }))
      .filter(item => item.url);
  } catch (error) {
    console.error('Failed to load collection items:', error);
  } finally {
    loading.value = false;
  }
};

// Select an image
const selectImage = (url: string) => {
  selectedUrl.value = url;
};

// Confirm selection
const confirmSelection = () => {
  if (selectedUrl.value && props.onSelect) {
    props.onSelect(selectedUrl.value);
  }
};

onMounted(() => {
  loadItems();
});
</script>

<style lang="scss">
.collection-item-selector {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 70vh;
  
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
    min-height: 300px;
  }

  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
    min-height: 300px;
    text-align: center;
    color: var(--color-text-secondary);
  }

  &__item {
    position: relative;
    cursor: pointer;
    border-radius: var(--border-radius);
    overflow: hidden;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &--selected {
      outline: 3px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__item-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.2s ease;
    
    .collection-item-selector__item--selected & {
      opacity: 1;
    }
    
    .t-icon {
      width: 40px;
      height: 40px;
      background: var(--color-background);
      border-radius: 50%;
      padding: var(--space-xs);
    }
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    padding: var(--space) 0;
    margin-top: auto;
    border-top: 1px solid var(--color-border);
  }

  // Ensure the grid is scrollable
  .t-virtual-grid {
    flex: 1;
    overflow-y: auto;
  }
}
</style>