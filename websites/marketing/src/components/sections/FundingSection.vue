<template>
  <section :class="bemm()" >
    <div :class="bemm('image')" :style="`--background-image: url(${imageUrl})`">

    </div>
    <div :class="bemm('container')" >
      <h2 v-if="content?.title" :class="bemm('title')" v-html="processTitle(content.title)" />
      <h4 v-if="content?.subtitle" :class="bemm('subtitle')" v-html="content.subtitle" />

      <MarkdownRenderer
        v-if="content?.content"
        :class="bemm('content')"
        :content="content.content"
      />

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

</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import type { ContentSection } from '@tiko/core';
import { useImages, useImageUrl } from '@tiko/core';
import {  onMounted, ref } from 'vue';
import { TButton, TButtonGroup } from '@tiko/ui';
import { processTitle } from '@/utils/processTitle';
import MarkdownRenderer from '../MarkdownRenderer.vue';

interface TextSectionProps {
  section: ContentSection | null;
  content: any;
}

const props = defineProps<TextSectionProps>();
const bemm = useBemm('funding-section');

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

const handleAction = (cta: { type?: string; color?: string; size?: string; text: string; action: string }) => {
  if (cta.action.startsWith('http')) {
    window.open(cta.action, '_blank');
  } else {
    // Handle internal actions
    console.log(`Action: ${cta.action}`);
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

  @media screen and (max-width: 720px) {
    flex-direction: column-reverse;
    align-items: center;
  }



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

    @media screen and (max-width: 720px) {
      width: 100vw;
      height: 100vw;
      position: relative;
      margin-top: calc(-35vw);
      transform: translateY(35%) translateX(25%);
    }
  }

  &__container {
    width: 66.66%;
    padding: 0 var(--space);
    display: flex;
    flex-direction: column;
    gap: var(--space-l);

    @media screen and (max-width: 720px) {
      width: 100%;
      padding:0;
    }
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
