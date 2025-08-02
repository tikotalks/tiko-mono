<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <ul :class="bemm('image-list')">
        <li
          v-for="(item, index) in content.items"
          :key="index"
          :class="bemm('image-item')"
          :style="`--color: ${item.color || 'var(--color-blue)'}; --background-image: url(${getImageUrl(item.image)})`"
        >
          <img
            :src="getImageUrl(item.image)"
            :alt="item.title"
            :class="bemm('image')"
          />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import type { ContentSection } from '@tiko/core';
import { useImages, useImageUrl } from '@tiko/core';

interface ImageBlockSectionProps {
  section: ContentSection;
  content: any;
}

defineProps<ImageBlockSectionProps>();
const bemm = useBemm('image-block-section');

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();

const getImageUrl = (imageId: string) => {
  const imageData = getImage(imageId);
  if (imageData) {
    return getImageVariants(imageData.original_url).large;
  }
  return '';
};
</script>

<style lang="scss">
.image-block-section {
  background-color: var(--color-light);
  color: var(--color-dark);
  display: flex;
  position: relative;
  width: 100%;

  &__container {
    width: 100%;
  }

  &__image-list {
    display: flex;
    gap: var(--spacing);
    width: 100%;
    justify-content: stretch;
  }

  &__image-item {
    width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: var(--border-radius);
    background-color: var(--color);
    transition: transform 0.3s ease;
    height: 33vh;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    background-image: var(--background-image);
    background-size: 1000vw 1000vw;
    background-position: center;
    background-repeat: no-repeat;


    &:first-child {
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
    }
    &:last-child {
      margin-top: var(--spacing);
      border-radius: var(--border-radius) 0 0 var(--border-radius);
    }
    img{
      transition: all 0.3s ease;
    }
    &:hover img {
      transform: scale(1.05);
    }
  }
}
</style>
