<template>
  <div :class="bemm()">
    <div :class="bemm('preview')">
      <div
        v-if="category.previewImages.length === 0"
        :class="bemm('empty-preview')"
      >
        <TIcon :name="Icons.FOLDER" :size="48" />
      </div>
      <div
        v-else-if="category.previewImages.length === 1"
        :class="bemm('single-preview')"
      >
        <img
          v-if="category.previewImages[0]?.original_url"
          :src="getImageVariants(category.previewImages[0].original_url).medium"
          :alt="category.previewImages[0].original_filename || 'Image'"
          :class="bemm('image')"
          loading="lazy"
        />
      </div>
      <div
        v-else
        :class="bemm('grid-preview')"
      >
        <template v-for="(image, index) in category.previewImages.slice(0, 4)" :key="image?.id || index">
          <img
            v-if="image?.original_url"
            :src="getImageVariants(image.original_url).thumbnail"
            :alt="image.original_filename || 'Image'"
            :class="bemm('grid-image')"
            loading="lazy"
          />
        </template>
      </div>
    </div>

    <div :class="bemm('content')">
      <h4 :class="bemm('title')">{{ category.name }}</h4>
      <div :class="bemm('meta')">
        <span :class="bemm('count')">{{ category.count }} {{ t('common.images', { count: category.count }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImageUrl } from '@tiko/core'
import type { MediaItem } from '@tiko/ui'
import { TIcon } from '@tiko/ui'

interface CategoryInfo {
  name: string
  count: number
  previewImages: MediaItem[]
}

interface Props {
  category: CategoryInfo
}

const props = defineProps<Props>()

const bemm = useBemm('category-card')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
</script>

<style lang="scss">
.category-card {
  height: 100%;
  display: block;
  background: var(--color-background);
  border: 1px solid color-mix(in srgb, var(--color-primary), transparent 75%);
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);

    .category-card__grid-image {
      --offset: 10% !important;
    }
  }

  &__preview {
    aspect-ratio: 1;
    background: var(--color-background-secondary);
    overflow: hidden;
  }

  &__empty-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-foreground-tertiary);
  }

  &__single-preview {
    height: 100%;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__grid-preview {
    display: grid;
    height: 100%;

    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;

    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  &__grid-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    --offset: 20%;
    transition: transform 0.2s ease;

    &:nth-child(1){
      transform: translate(var(--offset),var(--offset));
    }
    &:nth-child(2){
      transform: translate(calc(var(--offset) * -1),var(--offset));
    }
    &:nth-child(3){
      transform: translate(var(--offset),calc(var(--offset) * -1),);
    }
    &:nth-child(4){
      transform: translate(calc(var(--offset) * -1),calc(var(--offset) * -1),);
    }
  }

  &__content {
    padding: var(--space-s);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    margin: 0 0 calc(var(--space-xs) / 2) 0;
    color: var(--color-foreground);
    line-height: 1.2;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-primary);
  }

  &__count {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-secondary);
  }
}
</style>
