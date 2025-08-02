<template>
  <section :class="bemm()" >
    <div :class="bemm('image')" :style="`--background-image: url(${imageUrl})`">

    </div>
    <div :class="bemm('container')" >
      <h2 v-if="content?.title" :class="bemm('title')" v-html="processTitle(content.title)" />
      <div
        v-if="content?.body"
        :class="bemm('content')"
        v-html="content.body"
      ></div>

      <TButtonGroup v-if="content?.ctas">
        <TButton
          v-for="(cta, index) in content.ctas"
          :key="index"
          :type="cta.type || 'primary'"
          :color="cta.color || 'primary'"
          :size="cta.size || 'medium'"
          @click="handleAction(cta)"
        >
          {{ cta.text }}
        </TButton>
      </TButtonGroup>
    </div>

  </section>
  image: {{ imageUrl }}
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import type { ContentSection } from '@tiko/core';
import { useImages, useImageUrl } from '@tiko/core';
import {  onMounted, ref } from 'vue';
import { TButton, TButtonGroup } from '@tiko/ui';
import { processTitle } from '@/utils/processTitle';

interface TextSectionProps {
  section: ContentSection | null;
  content: any;
}

const props = defineProps<TextSectionProps>();
const bemm = useBemm('funding-section');

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();

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

const handleAction = (cta: any) => {
  if (cta.link) {
    if (cta.link.startsWith('http')) {
      window.open(cta.link, '_blank');
    } else {
      // Handle internal navigation if needed
      console.warn('Internal links not implemented in this section');
    }
  }
};

onMounted(async () => {
 await loadImages();
 loadImage();
});

</script>

<style lang="scss">
.funding-section {
  padding: calc(var(--spacing) * 2) var(--spacing);
  background-color: var(--color-light);
  color: var(--color-dark);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;

  &__image{
    width: 50vw;
    height: 100%;
    position: absolute;
    right: 0;
    bottom: 0;
    background-image: var(--background-image);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    transform: translateY(25%) translateX(25%);
  }

  &__container {
    width: 66.66%;
    padding: 0 var(--space);
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-purple);
    .title-dot{
      color: var(--color-blue);
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
