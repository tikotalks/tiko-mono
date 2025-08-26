<template>
  <section
    :id="section?.slug"
    :class="bemm('', ['', sectionBlock])"
    :style="`--section-image: url(${imageUrl}); --section-color: ${content.color || 'var(--color-primary)'};`"
  >
    <div :class="bemm('container')">
      <div :class="bemm('image', ['',imageUrl ? 'has-image' : 'no-image'])">
        <img v-if="imageUrl" :src="imageUrl" alt="Section Image" />
      </div>

      <div :class="bemm('content')">
        <h2
          v-if="content?.title"
          :class="bemm('title')"
          v-html="processTitle(content.title)"
        />
        <TMarkdownRenderer
          v-if="content?.content"
          :class="bemm('markdown')"
          :content="content.content"
        />
        <ContentCtas
          :items="content.cta"
          v-if="content.cta && content.cta.length"
        />
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
import { computed, onMounted, ref } from 'vue';
import { processTitle } from '@/utils/processTitle';
import ContentItems from '../blocks/ContentItems.vue';
import ContentCtas from '../blocks/ContentCtas.vue';
import { TMarkdownRenderer } from '@tiko/ui';

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

const sectionBlock = computed(() => {
  if (props.content['section-block-type']) {
    return props.content['section-block-type'];
  } else {
    return 'default';
  }
});

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
  background-color: var(--color-light);
  color: var(--color-dark);
  position: relative;
  @media (max-width: 720px) {
    flex-direction: column-reverse;
    align-items: center;
  }

  .column-right-section__container{
      padding: var(--spacing);
    }


  &--blocked {
    padding: var(--spacing);
    .column-right-section__container {

      padding: var(--spacing);
      background-color: color-mix(
        in srgb,
        var(--section-color),
        transparent 75%
      );
    }
  }

  &--background {
    background-color: color-mix(in srgb, var(--section-color), transparent 75%);
  }

  &__image {
    width: 50%;
    position: relative;

    &--has-image{
      aspect-ratio: 1/1;
    }


    img {
      width: calc(50vw + var(--spacing));
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) translateX(0);
    }

    @media (max-width: 720px) {
      width: 100%;
      img {
        width: 110vw;
        position: relative;
        top: 0;
        transform: translateY(0) translateX(0);
      }
    }
  }

  &__container {
    width: 100%;
    display: flex;
    position: relative;
    flex-direction: row-reverse;
    border-radius: var(--border-radius);

    @media (max-width: 720px) {
      width: 100%;
      flex-direction: column;
    }
  }

  &__content {
    width: 50%;

    display: flex;
    flex-direction: column;
    gap: var(--space-l);

    @media (max-width: 720px) {
      width: 100%;
    }
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--section-color);
    .title-dot {
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
