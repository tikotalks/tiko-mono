<template>
  <div :class="bemm('')">
    <div
      :class="bemm('item')"
      :style="`--item-color: var(--color-${item.data.color}); --item-text-color: var(--color-${item.data.color}-text)`"
      v-for="item in items"
      :key="item.id || item.data.title"
    >
      <div :class="bemm('image')">
        <img
          v-if="item.data.image && resolvedImageUrls[getImageKey(item.data.image)]"
          :src="resolvedImageUrls[getImageKey(item.data.image)]"
          :alt="item.data.title || item.data.name"
          :class="bemm('image-element')"
        />
        <div v-else-if="item.data.image && loadingImages[getImageKey(item.data.image)]" :class="bemm('loading')">
          <div :class="bemm('spinner')"></div>
        </div>
        <div v-else :class="bemm('placeholder')">
          {{ item.data.title || item.data.name }}
        </div>
      </div>
      <h4>{{ item.data.title || item.data.name }}</h4>
      <TMarkdownRenderer
        v-if="item.data.description"
        :class="bemm('content')"
        :content="item.data.description"
      />
      <TButton
        v-if="item.data.link"
        :class="bemm('cta')"
        :color="item.data.color"
        size="large"
        @click="handleClick(item)"
      >
        {{ item.data['link-label'] || 'Learn More' }}
      </TButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { TMarkdownRenderer, TButton } from '@tiko/ui';
import { onMounted, ref, watch, computed } from 'vue';
import { MediaType, useImageResolver, useImages, useImageUrl } from '@tiko/core';

const props = defineProps<{
  items: any[]; // Define the type based on your items structure
}>();

const bemm = useBemm('content-items'); // Use bemm for styling

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();
const { resolveAssetUrl } = useImageResolver();

// Reactive state for resolved image URLs
const resolvedImageUrls = ref<Record<string, string>>({})
const loadingImages = ref<Record<string, boolean>>({})

// Helper to create unique keys for images
const getImageKey = (image: any) => {
  if (!image || typeof image !== 'object') return 'no-image'
  return `${image.source || 'public'}-${image.id}`
}

// Function to resolve a single image
const resolveImage = async (image: any) => {
  if (!image || typeof image !== 'object') return

  const { id, source = 'public' } = image
  const key = getImageKey(image)

  // Skip if already resolved or loading
  if (resolvedImageUrls.value[key] || loadingImages.value[key]) return

  console.log('Resolving image:', { id, source })
  loadingImages.value[key] = true

  try {
    const imageUrl = await resolveAssetUrl(id, { media: source as MediaType })
    console.log('Resolved URL:', imageUrl)
    resolvedImageUrls.value[key] = imageUrl
  } catch (error) {
    console.error('Failed to resolve image:', error)
    resolvedImageUrls.value[key] = '/assets/placeholder.png'
  } finally {
    loadingImages.value[key] = false
  }
}

// Get all unique images from items
const uniqueImages = computed(() => {
  if (!props.items) return []

  const imageMap = new Map()
  props.items.forEach(item => {
    if (item.data?.image) {
      const key = getImageKey(item.data.image)
      imageMap.set(key, item.data.image)
    }
  })

  return Array.from(imageMap.values())
})

// Watch for changes in items and resolve images
watch(uniqueImages, async (newImages) => {
  if (newImages.length === 0) return

  // Resolve all images in parallel
  await Promise.all(newImages.map(image => resolveImage(image)))
}, { immediate: true })

const handleClick = (cta: { data: { link: string } }) => {
  console.log(cta.data.link);
const { link } = cta.data;
  if(link.startsWith('http')) {
    window.open(link, '_blank');
  } else {
    // Handle internal links if necessary
    console.warn('Internal links are not supported in this context.');
  }
};

onMounted(async () => {
  await loadImages();
});
</script>

<style lang="scss">
.content-items {
  // border: 1px solid red;

  display: flex;
  gap: var(--space);

  padding: var(--spacing);

  overflow: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-left: var(--spacing);
  justify-content: flex-start;
  align-items: flex-start;

  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &__item {
    width: clamp(300px, 50%, 480px);
    min-width: 240px;
    scroll-snap-align: start;
    padding: var(--space);
    border-radius: var(--border-radius);
    background-color: color-mix(
      in srgb,
      var(--item-color, var(--color-light)),
      transparent 75%
    );
    box-shadow: var(--shadow);

    display: flex;
    flex-direction: column;
    gap: var(--space);
    // color: var(--item-text-color);
  }

  &__image {
    margin-top: calc(var(--space-xl) * 1.5 * -1);
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__image-element {
    width: 100%;
    height: auto;
    border-radius: var(--border-radius);
    object-fit: cover;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    color: var(--color-text-secondary);
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-accent);
    border-top: 2px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    background: var(--color-background-secondary);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius);
    border: 2px dashed var(--color-accent);
    font-size: var(--font-size-sm);
    text-align: center;
    padding: var(--space);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
