<template>
  <section :class="bemm()" :style="`--section-image: url(${imageUrl}); --section-color: ${content.color || 'var(--color-primary)'};`">
    <div :class="bemm('image')"></div>
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')" v-html="processTitle(content.title)" />
      <MarkdownRenderer
        v-if="content?.content"
        :class="bemm('content')"
        :content="content.content"
      />
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

interface ColumnSectionProps {
  section: ContentSection;
  content: any;
}

const props = defineProps<ColumnSectionProps>();
const bemm = useBemm('column-right-section');

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();

const imageUrl = ref('');


const getFirst = (val: string | string[]) => {
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
};

const loadImage = async () => {
  if (props.content.image) {
    const imageId = getFirst(props.content.image);
    const image = getImage(imageId);
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
.column-right-section {
  padding: calc(var(--spacing) * 2) var(--spacing);
  background-color: var(--color-light);
  color: var(--color-dark);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;

  @media (max-width: 720px) {
    padding: var(--spacing);
    flex-direction: column-reverse;
    align-items: center;
  }

  &__image {
    width: 50vw;
    height: 50vw;
    position: absolute;
    right: 0;
    top: 50%;
    background-image: var(--section-image);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    transform: translateY(-50%) translateX(25%);

    @media (max-width: 720px) {
      width: 100vw;
      height: 100vw;
      left: 0;
      top: 0;
      position: relative;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  &__container {
    width: calc(50% + (var(--spacing) * .5));
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-l);

    @media (max-width: 720px) {
      padding: 0;
      width: 100%;
      background-image: linear-gradient(
        to top,
        var(--color-light) 0%,
        transparent 100%
      );
    }
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-blue);
    .title-dot{
      color: var(--color-orange);
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
}
</style>
