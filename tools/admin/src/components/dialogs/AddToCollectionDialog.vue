<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('media-info')">
        <TIcon :name="Icons.IMAGE" size="small" />
        <span>{{ mediaItem.name }}</span>
        <TChip v-if="multipleItems && multipleItems.length > 1" type="info" size="small">
          {{ multipleItems.length }} {{ t('common.items') }}
        </TChip>
      </div>

      <div :class="bemm('collections-list')">
        <div v-if="loading" :class="bemm('loading')">
          <TSpinner />
        </div>

        <div v-else-if="collections.length === 0" :class="bemm('empty')">
          <p>{{ t('admin.collections.noCollectionsYet') }}</p>
          <TButton color="primary" @click="createNewCollection">
            {{ t('admin.collections.createFirst') }}
          </TButton>
        </div>

        <div v-else :class="bemm('collections')">
          <div
            v-for="collection in collections"
            :key="collection.id"
            :class="bemm('collection-item',['', isSelected(collection.id) ? 'selected' : '', isInCollection(collection.id) ? 'already-in' : ''])"
            @click="toggleCollection(collection.id)"
          >
            <div :class="bemm('collection-item-cover')">
              <img
                v-if="collection.cover_image_url"
                :src="collection.cover_image_url"
                :alt="collection.name"
              />
              <TIcon v-else :name="Icons.FOLDER" />
            </div>
            <div :class="bemm('collection-item-info')">
              <h4>{{ collection.name }}</h4>
              <p v-if="collection.description">{{ collection.description }}</p>
              <div :class="bemm('collection-item-stats')">
                <span>
                  <TIcon :name="Icons.IMAGE" size="xs" />
                  {{ collection.item_count || 0 }}
                </span>
                <TChip v-if="collection.is_public" type="info" size="xs">
                  {{ t('common.public') }}
                </TChip>
              </div>
            </div>
            <div :class="bemm('collection-item-check')">
              <div :class="bemm('collection-item-indicators')">
                <TIcon
                  v-if="isInCollection(collection.id) && !isSelected(collection.id)"
                  :name="Icons.CIRCLED_CHECK"
                  color="success"
                  :title="t('admin.collections.alreadyInCollection')"
                />
                <TIcon
                  v-if="isSelected(collection.id)"
                  :name="Icons.CHECK"
                  :color="isInCollection(collection.id) ? 'warning' : 'primary'"
                />
              </div>
            </div>
          </div>
        </div>

        <div :class="bemm('create-new')">
          <TButton
            type="outline"
            :icon="Icons.PLUS"
            @click="createNewCollection"
            full-width
          >
            {{ t('admin.collections.createNewCollection') }}
          </TButton>
        </div>
      </div>
    </div>

    <div :class="bemm('actions')">
      <TButton type="outline" @click="$emit('close')">
        {{ t('common.cancel') }}
      </TButton>
      <TButton
        color="primary"
        @click="saveChanges"
        :disabled="!hasChanges || adding"
      >
        {{ adding ? t('common.saving') : hasChanges ? t('common.saveChanges') : t('common.noChanges') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, computed } from 'vue';
import { Icons } from 'open-icon';
import { useBemm } from 'bemm';
import {
  useCollectionsStore,
  useI18n,
  type MediaCollection
} from '@tiko/core';
import {
  TButton,
  TIcon,
  TSpinner,
  TChip,
  type  PopupService
} from '@tiko/ui';

const bemm = useBemm('add-to-collection-dialog');
const { t } = useI18n();
const collectionsStore = useCollectionsStore();
const popupService = inject<PopupService>('popupService');

interface Props {
  mediaItem: {
    id: string
    type: 'media' | 'user_media'
    name: string
    url: string
  }
  multipleItems?: Array<{
    id: string
    title?: string
    original_filename: string
    original_url: string
  }>
  onAdd?: (collectionId: string) => void
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: []
}>();

// State
const loading = ref(false);
const adding = ref(false);
const selectedCollectionIds = ref<Set<string>>(new Set());
const originalCollectionIds = ref<Set<string>>(new Set());
const collections = ref<MediaCollection[]>([]);
const collectionsContainingItem = ref<Set<string>>(new Set());

// Check if media is already in a collection
const isInCollection = (collectionId: string) => {
  return collectionsContainingItem.value.has(collectionId);
};

// Check if collection is selected for update
const isSelected = (collectionId: string) => {
  return selectedCollectionIds.value.has(collectionId);
};

// Toggle collection selection
const toggleCollection = (collectionId: string) => {
  if (selectedCollectionIds.value.has(collectionId)) {
    selectedCollectionIds.value.delete(collectionId);
  } else {
    selectedCollectionIds.value.add(collectionId);
  }
  // Force reactivity
  selectedCollectionIds.value = new Set(selectedCollectionIds.value);
};

// Save collection changes
const saveChanges = async () => {
  adding.value = true;
  try {
    // Find collections to add to
    const toAdd = Array.from(selectedCollectionIds.value).filter(
      id => !originalCollectionIds.value.has(id)
    );

    // Find collections to remove from
    const toRemove = Array.from(originalCollectionIds.value).filter(
      id => !selectedCollectionIds.value.has(id)
    );

    // Perform all operations
    const promises = [];

    // If we have multiple items, add/remove all of them
    const itemsToProcess = props.multipleItems || [{
      id: props.mediaItem.id,
      type: props.mediaItem.type
    }];

    for (const collectionId of toAdd) {
      if (props.multipleItems) {
        // Add all multiple items to this collection
        for (const item of props.multipleItems) {
          promises.push(
            collectionsStore.addItemToCollection(collectionId, {
              item_id: item.id,
              item_type: 'media' // multipleItems are always from library (media type)
            })
          );
        }
      } else {
        // Single item
        promises.push(
          collectionsStore.addItemToCollection(collectionId, {
            item_id: props.mediaItem.id,
            item_type: props.mediaItem.type
          })
        );
      }
    }

    for (const collectionId of toRemove) {
      if (props.multipleItems) {
        // Remove all multiple items from this collection
        for (const item of props.multipleItems) {
          promises.push(
            collectionsStore.removeItemFromCollection(
              collectionId,
              item.id,
              'media'
            )
          );
        }
      } else {
        // Single item
        promises.push(
          collectionsStore.removeItemFromCollection(
            collectionId,
            props.mediaItem.id,
            props.mediaItem.type
          )
        );
      }
    }

    await Promise.all(promises);

    if (props.onAdd && toAdd.length > 0) {
      props.onAdd(toAdd[0]); // Call with first added collection for compatibility
    }

    emit('close');
  } catch (error) {
    console.error('Failed to update collections:', error);
  } finally {
    adding.value = false;
  }
};

// Check if there are changes
const hasChanges = computed(() => {
  const current = Array.from(selectedCollectionIds.value).sort();
  const original = Array.from(originalCollectionIds.value).sort();

  if (current.length !== original.length) return true;

  return !current.every((id, index) => id === original[index]);
});

// Create new collection
const createNewCollection = async () => {
  if (!popupService) return;

  const { default: CreateCollectionDialog } = await import('./CreateCollectionDialog.vue');

  const popupId = popupService.open({
    component: CreateCollectionDialog,
    title: t('admin.collections.createCollection'),
    props: {
      onSave: async (data: any) => {
        const newCollection = await collectionsStore.createCollection(data);
        popupService.close({ id: popupId });

        // Reload collections and select the new one
        await loadCollections();
        selectedCollectionIds.value.add(newCollection.id);
        selectedCollectionIds.value = new Set(selectedCollectionIds.value);
      }
    }
  });
};

// Load user collections
const loadCollections = async () => {
  loading.value = true;
  try {
    // Load user collections
    await collectionsStore.loadCollections();
    collections.value = collectionsStore.collections;

    // Get collections that already contain this item
    const collectionsWithItem = await collectionsStore.getCollectionsForMediaItem(
      props.mediaItem.id,
      props.mediaItem.type
    );

    // Build set of collection IDs that contain the item
    collectionsContainingItem.value = new Set(collectionsWithItem.map(c => c.id));

    // Initialize selected collections with ones that already contain the item
    for (const collection of collectionsWithItem) {
      selectedCollectionIds.value.add(collection.id);
      originalCollectionIds.value.add(collection.id);
    }

    // Force reactivity
    selectedCollectionIds.value = new Set(selectedCollectionIds.value);
  } catch (error) {
    console.error('Failed to load collections:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCollections();
});
</script>

<style lang="scss">
.add-to-collection-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  min-height: 400px;

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__media-info {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    padding: var(--space-s) var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__collections-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--space-xl);
  }

  &__empty {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);

    p {
      margin-bottom: var(--space);
    }
  }

  &__collections {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    max-height: 300px;
  }

  &__collection-item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space-s);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: color-mix(in srgb, var(--color-primary), transparent 75%);
      border-color: var(--color-primary);
    }

    &--selected {
      background: color-mix(in srgb, var(--color-primary), transparent 90%);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary), transparent 50%);
    }

    &--already-in {
      opacity: 0.8;

      &:not(.add-to-collection-dialog__collection-item--selected) {
        background: color-mix(in srgb, var(--color-success), transparent 95%);
      }
    }

    &-cover {
      width: 48px;
      height: 48px;
      border-radius: var(--border-radius-sm);
      overflow: hidden;
      background: var(--color-background-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .t-icon {
        color: var(--color-text-tertiary);
      }
    }

    &-info {
      flex: 1;
      min-width: 0;

      h4 {
        margin: 0 0 var(--space-xs) 0;
        font-size: var(--font-size);
        font-weight: var(--font-weight-semibold);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      p {
        margin: 0 0 var(--space-xs) 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    &-stats {
      display: flex;
      align-items: center;
      gap: var(--space-s);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);

      span {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
      }
    }

    &-check {
      flex-shrink: 0;
    }

    &-indicators {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }
  }

  &__create-new {
    border-top: 1px solid var(--color-accent);
    padding-top: var(--space);
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: flex-end;
    padding-top: var(--space);
    border-top: 1px solid var(--color-accent);
  }
}
</style>
