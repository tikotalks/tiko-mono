<template>
  <section :class="bemm()">
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
    </div>

    <div :class="bemm('visual')">
      <ImageGrid :tiles="randomImages" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TButton, TMarkdownRenderer } from '@tiko/ui';
import { useRouter } from 'vue-router';
import { useImages, useImageUrl } from '@tiko/core';
import type { ContentSection } from '@tiko/core';
import { computed, onMounted, ref, onUnmounted, watch } from 'vue';
import ImageGrid from '../ImageGrid.vue';
import { getCachedAverageColor } from '../../utils/getAverageColor';
import { processTitle } from '@/utils/processTitle';

interface HeroSectionProps {
  section: ContentSection | null;
  content: {
    [key: string]: any;
  };
}

const props = defineProps<HeroSectionProps>();
const bemm = useBemm('hero-section');
const router = useRouter();

function handleCTAClick() {
  if (props.content?.ctaLink) {
    if (props.content.ctaLink.startsWith('http')) {
      window.open(props.content.ctaLink, '_blank');
    } else {
      router.push(props.content.ctaLink);
    }
  }
}

const { getImageVariants } = useImageUrl();

const { imageList, loadImages, loading } = useImages(true); // Use public mode for marketing site
const displayedImages = ref<any[]>([]);
const intervalId = ref<number | null>(null);

onMounted(async () => {
  await loadImages();

  // Initialize with 10 random images
  if (imageList.value.length > 0) {
    const initialImages = shuffleArray(imageList.value).slice(0, 10);

    // Preload all initial images
    const preloadPromises = initialImages.map(async (image) => {
      const url = getImageVariants(image.original_url).medium;
      try {
        await preloadImage(url);
        // Also get color for each image
        const color = await getCachedAverageColor(url);
        imageColors.value.set(image.id, color);
      } catch (error) {
        console.error('Failed to preload initial image:', error);
      }
    });

    // Wait for all initial images to load
    await Promise.allSettled(preloadPromises);

    // Now display them
    displayedImages.value = initialImages;

    // Start rotating images every 3 seconds
    intervalId.value = window.setInterval(() => {
      rotateImage();
    }, 3000);
  }
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});

async function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

async function rotateImage() {
  if (imageList.value.length <= 10) return; // Not enough images to rotate

  // Find images not currently displayed
  const availableImages = imageList.value.filter(
    (img) =>
      !displayedImages.value.some((displayed) => displayed.id === img.id),
  );

  if (availableImages.length === 0) return;

  // Pick a random image to remove
  const removeIndex = Math.floor(Math.random() * displayedImages.value.length);

  // Pick a random new image to add
  const newImage =
    availableImages[Math.floor(Math.random() * availableImages.length)];

  // Preload the new image before swapping
  try {
    const imageUrl = getImageVariants(newImage.original_url).medium;
    await preloadImage(imageUrl);

    // Extract color for the new image
    const color = await getCachedAverageColor(imageUrl);
    imageColors.value.set(newImage.id, color);

    // Only swap after image is loaded
    const newDisplayed = [...displayedImages.value];
    newDisplayed[removeIndex] = newImage;
    displayedImages.value = newDisplayed;
  } catch (error) {
    console.error('Failed to preload image, skipping rotation:', error);
    // Don't swap if image failed to load
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const spacing = 1; // in em
const containerEm = 40;

// Store colors for images
const imageColors = ref<Map<string, string>>(new Map());

const randomImages = computed(() => {
  if (!displayedImages.value.length) return [];

  return displayedImages.value.map((image) => {
    const url = getImageVariants(image.original_url).medium;
    return {
      id: image.id,
      name: image.name,
      title: image.title,
      url: url,
      color: imageColors.value.get(image.id) || '#333333',
    };
  });
});

// Extract colors for new images
async function extractImageColors() {
  for (const image of displayedImages.value) {
    if (!imageColors.value.has(image.id)) {
      const url = getImageVariants(image.original_url).medium;
      try {
        const color = await getCachedAverageColor(url);
        imageColors.value.set(image.id, color);
      } catch (error) {
        console.error('Failed to extract color for', image.id);
        imageColors.value.set(image.id, '#333333');
      }
    }
  }
}

// Watch for changes in displayed images
watch(
  displayedImages,
  async () => {
    await extractImageColors();
  },
  { immediate: true },
);
</script>

<style lang="scss">
.hero-section {
  background-color: var(--color-dark);
  background-image: radial-gradient(
    circle at left bottom,
    color-mix(in srgb, var(--color-primary), transparent 50%) 0%,
    var(--color-dark) 100%
  );
  padding: var(--spacing);
  padding-top: calc(var(--space-xl) * 5);

  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  justify-content: flex-start;

  animation: headerSize linear both;
  animation-timeline: scroll();
  animation-range: 0 100vh;

  @at-root {
    @keyframes headerSize {
      to {
      transform: translateY(50%)
      }
    }
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
      var(--color-dark) 0%,
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
      color: var(--color-blue);
    }
  }

  &__cta {
    display: flex;
    justify-content: center;
    gap: var(--space);
  }

  &__content {
    margin-top: var(--space-l);
    color: var(--color-blue);
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
