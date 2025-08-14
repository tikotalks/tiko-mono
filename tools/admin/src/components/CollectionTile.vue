<template>
  <div :class="bemm()" @click="$emit('click')">
    <!-- Cover Image -->
    <div :class="bemm('cover')">
      <img 
        v-if="collection.cover_image_url" 
        :src="collection.cover_image_url" 
        :alt="collection.name"
      />
      <div v-else :class="bemm('cover-placeholder')">
        <TIcon :name="Icons.FOLDER" size="large" />
      </div>
      
      <!-- Badges -->
      <div :class="bemm('badges')">
        <TChip v-if="collection.is_public" type="info" size="small">
          <TIcon :name="Icons.GLOBE" size="small" />
        </TChip>
        <TChip v-if="collection.is_curated" type="success" size="small">
          <TIcon :name="Icons.STAR_FULL" size="small" />
        </TChip>
      </div>
      
      <!-- Actions Menu -->
      <div :class="bemm('menu')">
        <TContextMenu
          :config="{ 
            position: 'bottom-right', 
            menu: getMenuItems() 
          }"
        >
          <TButton type="ghost" size="small" :icon="Icons.THREE_DOTS_VERTICAL" />
        </TContextMenu>
      </div>
    </div>
    
    <!-- Content -->
    <div :class="bemm('content')">
      <h3 :class="bemm('title')">{{ collection.name }}</h3>
      <p v-if="collection.description" :class="bemm('description')">
        {{ collection.description }}
      </p>
      
      <!-- Stats -->
      <div :class="bemm('stats')">
        <span :class="bemm('stat')">
          <TIcon :name="Icons.IMAGE" size="small" />
          {{ collection.items?.length || 0 }}
        </span>
        <span :class="bemm('stat')">
          <TIcon :name="Icons.EYE" size="small" />
          {{ collection.view_count }}
        </span>
        <span :class="bemm('stat')">
          <TIcon :name="Icons.HEART" size="small" />
          {{ collection.like_count }}
        </span>
      </div>
      
      <!-- Owner -->
      <div v-if="collection.owner" :class="bemm('owner')">
        <TAvatar 
          :src="collection.owner.avatar_url" 
          :name="collection.owner.username"
          size="xs"
        />
        <span>{{ collection.owner.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { 
  TIcon, 
  TChip, 
  TButton, 
  TContextMenu,
  TAvatar,
  useI18n 
} from '@tiko/ui';
import type { MediaCollection } from '@tiko/core';

const bemm = useBemm('collection-tile');
const { t } = useI18n();

const props = defineProps<{
  collection: MediaCollection
}>();

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
  'toggle-public': []
  'toggle-curated': []
}>();

const getMenuItems = () => {
  return [
    {
      id: 'edit',
      label: t('common.edit'),
      icon: Icons.PENCIL,
      action: () => emit('edit')
    },
    {
      id: 'toggle-public',
      label: props.collection.is_public 
        ? t('admin.collections.makePrivate') 
        : t('admin.collections.makePublic'),
      icon: props.collection.is_public ? Icons.EYE_OFF : Icons.EYE,
      action: () => emit('toggle-public')
    },
    {
      id: 'toggle-curated',
      label: props.collection.is_curated 
        ? t('admin.collections.removeCurated') 
        : t('admin.collections.makeCurated'),
      icon: props.collection.is_curated ? Icons.STAR : Icons.STAR_FULL,
      action: () => emit('toggle-curated')
    },
    {
      id: 'separator',
      type: 'separator' as const
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: Icons.TRASH,
      action: () => emit('delete')
    }
  ];
};
</script>

<style lang="scss">
.collection-tile {
  position: relative;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);
  }

  &__cover {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--color-background-secondary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-tertiary);
  }

  &__badges {
    position: absolute;
    top: var(--space-s);
    left: var(--space-s);
    display: flex;
    gap: var(--space-xs);
  }

  &__menu {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    opacity: 0;
    transition: opacity 0.2s;
    
    .t-button {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      &:hover {
        background: rgba(255, 255, 255, 1);
      }
    }
  }

  &:hover &__menu {
    opacity: 1;
  }

  &__content {
    padding: var(--space);
  }

  &__title {
    margin: 0 0 var(--space-xs) 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__description {
    margin: 0 0 var(--space-s) 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__stats {
    display: flex;
    gap: var(--space);
    margin-bottom: var(--space-s);
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);

    .t-icon {
      opacity: 0.7;
    }
  }

  &__owner {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}
</style>