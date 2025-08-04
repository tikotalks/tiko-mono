<template>
  <section :class="bemm()">
    <div :class="bemm('wrapper')">
      <div
        :class="bemm('image')"
        :style="`--background-image: url(${imageUrl})`"
      ></div>
      <div :class="bemm('container')">
        <h2 v-if="content?.title" :class="bemm('title')" v-html="processTitle(content.title)" />
        <MarkdownRenderer
          :class="bemm('content')"
          v-if="content?.body"
          :content="content.body"
        />
      </div>
    </div>

    <div :class="bemm('apps')">
      <ul v-if="content?.apps" :class="bemm('apps-list')">
        <li
          v-for="(app, index) in content.apps"
          :key="index"
          :class="bemm('app-item')"
          :style="`--color: var(--color-${app.color || 'blue'});`"
        >
          <img
            :src="getImageUrl(app.image)"
            :alt="app.title"
            :class="bemm('app-image')"
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
import { onMounted, ref } from 'vue';
import MarkdownRenderer from '../MarkdownRenderer.vue';
import { processTitle } from '@/utils/processTitle';

interface TextSectionProps {
  section: ContentSection;
  content: any;
}

const props = defineProps<TextSectionProps>();
const bemm = useBemm('apps-section');

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();


const getImageUrl = (imageId: string) => {
  const imageData = getImage(imageId);
  if (imageData) {
    return getImageVariants(imageData.original_url).medium;
  }
  return '';
};
const imageUrl = ref('');

const loadImage = async () => {
  if (props.content.image) {
    const image = getImage(props.content.image);
    console.log('Image:', image);
    if (image) {
      imageUrl.value = getImageVariants(image.original_url).large;
    } else {
      imageUrl.value = '';
    }
  }
};

onMounted(async () => {
  await loadImages();
  loadImage();
});
</script>

<style lang="scss">
.apps-section {
  padding: var(--spacing);
  background-color: var(--color-light);
  color: var(--color-dark);

  position: relative;

  &__wrapper {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }
  &__image {
    width: 50vw;
    height: 50vw;
    position: absolute;
    left: 0;
    top: 50%;
    background-image: var(--background-image);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    transform: translateY(-50%) translateX(-25%) rotate(90deg);
  }

  &__container {
    width: calc(50% + (var(--spacing) * 1.5));

    display: flex;
    flex-direction: column;
    gap: var(--space-l);
    background-color: color-mix(in srgb, var(--color-blue), transparent 75%);
    border-radius: var(--border-radius);
    padding: var(--spacing);
    transform: translateX(var(--spacing));
    // margin-right: calc(var(--spacing) * -1);
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-blue);
    position: absolute;
    left: 0;
    transform: translateX(-100%);
    width: calc(50vw - var(--spacing));
    span{
      color: var(--color-green);
    }
  }

  &__content {
    color: var(--color-foreground-secondary);
    line-height: 1.6;
    max-width: 640px;

    p {
      margin-bottom: var(--space);
    }
  }

  &__apps {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);
    justify-content: center;
    left: 0;
    width: 100%;
    bottom: 0;
    position: relative;
    z-index: 10;
    margin-top: calc((var(--spacing) / 2) * -1);
  }
  &__apps-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);
    justify-content: center;
  }
  &__app-item {
    width: 160px;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color, var(--color-background));
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius);
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.05);
    }
  }

  &__app-image {
    width: 80%;
    height: auto;
  }
}
</style>
