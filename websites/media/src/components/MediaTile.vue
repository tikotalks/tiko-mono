<template>
  <TMediaTile
    :media="media"
    :get-image-variants="getImageVariants"
    @click="navigateToDetail"
  >
    <template v-if="isAuthenticated" #actions>
      <TButton
        :class="bemm('action-btn', ['', isFavorite ? 'active' : ''])"
        :icon="Icons.HEART"
        type="ghost"
        @click.stop.prevent="toggleFavorite"
        :title="isFavorite ? t('media.removeFavorite') : t('media.addFavorite')"
      />
      <TButton
        :class="bemm('action-btn', ['', isInCollection ? 'active' : ''])"
        :icon="Icons.FOLDER_ADD"
        type="ghost"
        @click.stop.prevent="showCollectionSelection"
        :title="t('media.addToCollection')"
      >
        <span v-if="collectionCount > 0" :class="bemm('collection-count')">{{ collectionCount }}</span>
      </TButton>
    </template>
  </TMediaTile>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import {
  TMediaTile,
  TButton,
  useI18n,
  type MediaItem,
  type PopupService,
} from '@tiko/ui';
import {
  useAuthStore,
  useFavoritesStore,
  useCollectionsStore,
  useImageUrl,
} from '@tiko/core';
import CollectionSelectionPopup from './CollectionSelectionPopup.vue';
import CreateCollectionPopup from './CreateCollectionPopup.vue';

interface Props {
  media: MediaItem;
  href?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [event: Event, media: MediaItem];
}>();

const bemm = useBemm('media-tile');
const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const collectionsStore = useCollectionsStore();
const { getImageVariants } = useImageUrl();
const popupService = inject<PopupService>('popupService');

// Initialize stores on mount
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await favoritesStore.initializeFavorites();
    await collectionsStore.loadCollections();
  }
});

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isFavorite = computed(() => favoritesStore.isFavorite(props.media.id));
const isInCollection = computed(() => {
  return collectionsStore.collections.some((collection) =>
    collection.media_ids.includes(props.media.id),
  );
});
const collectionCount = computed(() => {
  return collectionsStore.collections.filter((collection) =>
    collection.media_ids.includes(props.media.id),
  ).length;
});
// Methods
const toggleFavorite = async () => {
  await favoritesStore.toggleFavorite(props.media.id);
};

const handleClick = (event: Event) => {
  emit('click', event, props.media);
};

const navigateToDetail = (event: Event) => {
  if (props.href) {
    // If it's an external link, let it navigate
    if (props.href.startsWith('http')) {
      window.location.href = props.href;
    } else {
      // For internal links, use router
      router.push(props.href);
    }
  } else {
    // Default behavior - navigate to media detail
    router.push(`/media/${props.media.id}`);
  }
  emit('click', event, props.media);
};

const showCollectionSelection = () => {
  popupService?.open({
    component: CollectionSelectionPopup,
    title: t('media.selectCollection'),
    props: {
      collections: collectionsStore.collections,
      mediaId: props.media.id,
      onSelectCollection: async (collectionId: string) => {
        await collectionsStore.addToCollection(collectionId, props.media.id);
        popupService?.close();
      },
      onRemoveFromCollection: async (collectionId: string) => {
        await collectionsStore.removeFromCollection(collectionId, props.media.id);
        popupService?.close();
      },
      onCreateNew: () => {
        // Don't close the current popup here, let the new one replace it
        showCreateCollectionDialog();
      },
    },
  });
};

const showCreateCollectionDialog = () => {
  popupService?.open({
    component: CreateCollectionPopup,
    title: t('media.createCollection'),
    props: {
      onCreate: async (name: string) => {
        const newCollection = await collectionsStore.createCollection(name);
        // After creating, add the media to the new collection
        if (newCollection) {
          await collectionsStore.addToCollection(newCollection.id, props.media.id);
        }
        popupService?.close();
      },
      onClose: () => {
        // When canceling, go back to collection selection
        showCollectionSelection();
      },
    },
  });
};
</script>

<style lang="scss">
.media-tile {
  &__action-btn {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    position: relative;

    &:hover {
      background: rgba(255, 255, 255, 0.95);
    }

    &--active {
      --icon-fill: currentColor;
    }
  }

  &__collection-count {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--color-primary);
    color: white;
    font-size: 10px;
    font-weight: bold;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

// Override TMediaTile actions opacity behavior
.t-media-tile {
  &__actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover &__actions {
    opacity: 1;
  }
}
</style>
