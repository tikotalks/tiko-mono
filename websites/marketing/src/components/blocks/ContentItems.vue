<template>
  <div :class="bemm('')">
    <div
      :class="bemm('item')"
      :style="`--item-color: var(--color-${item.data.color}); --item-text-color: var(--color-${item.data.color}-text)`"
      v-for="item in items"
    >
      <div :class="bemm('image')">
        <img
          v-if="item.data.image"
          :src="getImageUrl(item.data.image)"
          :alt="item.data.title || item.data.name"
        />
        <div v-else :class="bemm('placeholder')">
          {{ item.data.title || item.data.name }}
        </div>
      </div>
      <h4>{{ item.data.title }}</h4>
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
import { TMarkdownRenderer } from '@tiko/ui';
import { onMounted, ref } from 'vue';
import { useImages, useImageUrl } from '@tiko/core';
import TButton from '../../../../../packages/ui/src/components/TButton/TButton.vue';

defineProps<{
  items: any[]; // Define the type based on your items structure
}>();

const bemm = useBemm('content-items'); // Use bemm for styling

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();

const getImageUrl = (imageId: string) => {
  const imageData = getImage(imageId);
  if (imageData) {
    return getImageVariants(imageData.original_url).medium;
  }
  return '';
};

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
  }
}
</style>
