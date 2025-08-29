<template>
  <section :id="section?.slug" :class="bemm('', ['', alignment, sectionBlock])"
    :style="`--section-image: url(${imageUrl}); --section-color: ${content.color ? `var(--color-${content.color})` : 'var(--color-primary)'};`">
    <div :class="bemm('wrapper')" v-if="alignment === 'left'">
      <div :class="bemm('container')">
        <div :class="bemm('image', ['', imageUrl ? 'has-image' : 'no-image'])">
          <img v-if="imageUrl" :src="imageUrl" alt="Section Image" />
        </div>

        <div :class="bemm('content')">
          <h2 v-if="content?.title" :class="bemm('title')" v-html="processTitle(content.title)" />
          <TMarkdownRenderer v-if="content?.content" :class="bemm('markdown')" :content="content.content" />
          <ContentCtas :items="content.cta" v-if="content.cta && content.cta.length" />
        </div>
      </div>
    </div>

    <div :class="bemm('container')" v-else>
      <div :class="bemm('image', ['', imageUrl ? 'has-image' : 'no-image'])">
        <img v-if="imageUrl" :src="imageUrl" alt="Section Image" />
      </div>

      <div :class="bemm('content')">
        <h2 v-if="content?.title" :class="bemm('title')" v-html="processTitle(content.title)" />
        <TMarkdownRenderer v-if="content?.content" :class="bemm('markdown')" :content="content.content" />
        <ContentCtas :items="content.cta" v-if="content.cta && content.cta.length" />
      </div>
    </div>

    <div :class="bemm('items')" v-if="content.items && content.items.length">
      <ContentItems :items="content?.items" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import type { ContentSection } from '@tiko/core';
import { useImages, useImageUrl } from '@tiko/core';
import { TMarkdownRenderer } from '@tiko/ui';
import { computed, onMounted, ref } from 'vue';
import { processTitle } from '@/utils/processTitle';
import ContentItems from '../blocks/ContentItems.vue';
import ContentCtas from '../blocks/ContentCtas.vue';

interface ColumnSectionProps {
  section: ContentSection;
  content: any;
  alignment: 'left' | 'right' | 'center';
}

const props = withDefaults(defineProps<ColumnSectionProps>(), {
  alignment: 'left'
});


const bemm = useBemm('column-section');

const sectionBlock = computed(() => {
  if (props.content['section-block-type']) {
    return props.content['section-block-type'];
  } else {
    return 'default';
  }
});

const { getImage, loadImages } = useImages({ publicMode: true }); // Use public mode for marketing site
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
    if (image && 'original_url' in image) {
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
// Base column section styles with CSS custom properties
.column-section {
  $b: &;
  // CSS Custom Properties for customization with defaults
  --column-flex-direction: row;
  --column-content-width: 50%;
  --column-image-width: 50%;
  --column-image-position: absolute;
  --column-image-position-x: 0;
  --column-image-position-y: 50%;
  --column-image-transform: translateY(-50%) translateX(0);
  --column-image-aspect: 1/1;
  --column-content-align: flex-start;
  --column-content-text-align: left;
  --column-content-max-width: 640px;
  --column-image-max-width: none;
  --column-image-margin: 0;
  --column-mobile-flex-direction: column;

  background-color: var(--color-background);
  color: var(--color-foreground);
  position: relative;

  @media (max-width: 720px) {
    flex-direction: column-reverse;
    align-items: center;
  }

  &--left {
    --column-flex-direction: row-reverse;

  }

  &--right {
    --column-flex-direction: row;

    #{$b}__image img {
      left: unset;
    }
  }

  &__wrapper {
    padding: var(--spacing);
  }

  &__container {
    width: 100%;
    display: flex;
    position: relative;
    flex-direction: var(--column-flex-direction);
    padding: var(--spacing);

    @media (max-width: 720px) {
      width: 100%;
      flex-direction: var(--column-mobile-flex-direction);
    }
  }

  &--background {

    #{$b}__wrapper,
    #{$b}__container {
      padding: var(--spacing);
    }

    #{$b}__container {
      background-color: color-mix(in srgb, var(--section-color), transparent 25%);
    }
  }

  &--blocked {
    #{$b}__container {
      border-radius: var(--border-radius);
      background-color: color-mix(in srgb, var(--section-color), transparent 25%);
    }
  }

  &__image {
    width: var(--column-image-width);
    max-width: var(--column-image-max-width);
    position: relative;
    margin-bottom: var(--column-image-margin);
    pointer-events: none;

    &--has-image {
      aspect-ratio: var(--column-image-aspect);
    }

    img {
      width: calc(50vw + var(--spacing));
      position: var(--column-image-position);
      left: var(--column-image-position-x);
      right: var(--column-image-position-x);
      top: var(--column-image-position-y);
      transform: var(--column-image-transform);
      border-radius: var(--border-radius);
    }

    @media (max-width: 720px) {
      width: 100%;
      max-width: none;

      img {
        width: 110vw;
        position: relative;
        left: auto;
        right: auto;
        top: 0;
        transform: translateY(0) translateX(0);
      }
    }
  }

  &__content {
    width: var(--column-content-width);
    display: flex;
    flex-direction: column;
    align-items: var(--column-content-align);
    gap: var(--space-l);

    @media (max-width: 720px) {
      width: 100%;
      align-items: flex-start;
    }
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--section-color);
    text-align: var(--column-content-text-align);
    width: 100%;

    .title-dot {
      color: var(--color-orange);
    }
  }

  &__markdown {
    color: var(--color-foreground-secondary);
    line-height: 1.6;
    max-width: var(--column-content-max-width);
    text-align: var(--column-content-text-align);
    width: 100%;

    p {
      margin-bottom: var(--space);
    }
  }

  &__items {
    width: 100%;
  }
}
</style>
