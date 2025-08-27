<template>
  <section :id="section?.slug" :class="bemm()" :style="`--image: url(${imageUrl}); --section-color: ${content.color || 'var(--color-primary)'};`">
    <div :class="bemm('container')">
      <h1
        v-if="content?.title"
        :class="bemm('title')"
        v-html="processTitle(content.title)"
      />
      <p v-if="content?.subtitle" :class="bemm('subtitle')">
        {{ content.subtitle }}
      </p>
      <div v-if="content?.content" :class="bemm('content')">
        <TMarkdownRenderer :content="content.content" />
      </div>
      <div v-if="content?.ctaText" :class="bemm('cta')">
        <TButton color="primary" size="large" @click="handleCTAClick">
          {{ content.ctaText }}
        </TButton>
      </div>
      <ContentCtas :items="content.cta" v-if="content.cta && content.cta.length" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TButton, TMarkdownRenderer } from '@tiko/ui';
import { useRouter } from 'vue-router';
import { useImages, useImageUrl } from '@tiko/core';
import type { ContentSection } from '@tiko/core';
import { onMounted, ref } from 'vue';
import { processTitle } from '@/utils/processTitle';
import ContentCtas from '../blocks/ContentCtas.vue';

interface SecondaryHeroSectionProps {
  section: ContentSection | null;
  content: {
    [key: string]: any;
  };
}

const props = defineProps<SecondaryHeroSectionProps>();
const bemm = useBemm('secondary-hero-section');
const router = useRouter();

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();

const imageUrl = ref('');

function handleCTAClick() {
  if (props.content?.ctaLink) {
    if (props.content.ctaLink.startsWith('http')) {
      window.open(props.content.ctaLink, '_blank');
    } else {
      router.push(props.content.ctaLink);
    }
  }
}
const getFirst = (val: string | string[]) => {
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
};

const handleCta = (cta: {
  label: string;
  action: string;
}) => {
  if (cta.action.startsWith('http')) {
    window.open(cta.action, '_blank');
  } else {
    // Handle internal actions
    console.log(`Action: ${cta.action}`);
  }
};

const loadImage = async () => {
  if (props.content.image) {
    const imageId = getFirst(props.content.image);
    const image = getImage(imageId);
    console.log('Image:', image);
    if (image) {
      imageUrl.value = getImageVariants(image.original_url).original;
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
.secondary-hero-section {
--dark-section-color: color-mix(in srgb, var(--section-color), black 90%) ;
  background-color: var(--color-dark);
  background-image: radial-gradient(
    circle at left bottom,
    color-mix(in srgb, var(--section-color), transparent 50%) 0%,
    var(--dark-section-color) 100%
  );
  padding: var(--spacing);
  padding-top: calc(var(--space-xl) * 5);

  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  z-index: 10;

  &::after {
    position: absolute;
    right: -25vw;
    top: 0;
    width: 75vw;
    background-image: var(--image);
    height: 120%;
    content: '';
    display: block;
    background-size: contain;
    background-position: 0% 50%;
    background-repeat: no-repeat;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    height: 20vh;
    width: 100%;
    background-image: linear-gradient(
      to bottom,
     var(--dark-section-color) 0%,
      transparent 100%
    );
  }

  @media (max-width: 720px) {
    overflow: hidden;
    clip-path: inset(0 0 0 0);
    padding: 0;
    padding-top: calc(var(--space-l) * 5);
  }

  &__container {
    width: 50%;
    position: relative;
    z-index: 10;

    @media (max-width: 720px) {
      width: 100%;
      padding: var(--spacing);
      background-image: linear-gradient(
        to top,
        var(--color-dark) 0%,
        transparent 100%
      );
    }
  }

  &__title {
    font-size: clamp(4em, 5vw, 8em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-light);
    .title-dot {
      color: var(--section-color);
    }
  }

  &__subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space-xl);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__cta {
    display: flex;
    justify-content: center;
    gap: var(--space);
  }

  &__ctas {
    display: flex;
    justify-content: center;
    gap: var(--space);
  }

  &__content {
    margin-top: var(--space-l);
    color: var(--section-color);
    font-size: var(--font-size-l);
  }

  &__visual {
    width: 50%;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);
    align-items: flex-start;
    justify-content: flex-end;
    position: absolute;
    right: -1em;
    top: -1em;

    @media (max-width: 720px) {
      width: 50%;
    }
  }
}
</style>
