<template>
  <div
    :class="bemm()"
    :style="`--color: var(--color-${getAppData(app, 'color') || 'blue'}); --image: url(${getImageUrl(getAppData(app, 'app_icon'))})`"
  >
    <span
      :class="bemm('link')"
    >
      <img
        v-if="getAppData(app, 'app_icon')"
        :src="getImageUrl(getAppData(app, 'app_icon'))"
        :alt="getAppData(app, 'app_title') || app.item?.name"
        :class="bemm('image')"
      />
      <div v-else :class="bemm('placeholder')">
        {{ getAppData(app, 'app_title') || app.item?.name }}
      </div>
      <span :class="bemm('title')">{{
        getAppData(app, 'app_title') || app.item?.name
      }}</span>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { useImages, useImageUrl } from '@tiko/core';

const { getImageVariants } = useImageUrl();

const getImageUrl = (imageId: string) => {
  const imageData = getImage(imageId);
  if (imageData) {
    return getImageVariants(imageData.original_url).medium;
  }
  return '';
};

defineProps<{
  app: any; // Define the type based on your app structure
}>();

const bemm = useBemm('app-icon'); // Use bemm for styling
const { getImage } = useImages(true); // Use public mode for marketing site

// Helper to get app data from the item structure
const getAppData = (app: any, key: string) => {
  // The app should have a 'data' object with the field values
  if (app && app.data && app.data[key] !== undefined) {
    return app.data[key];
  }
  return null;
};
</script>

<style lang="scss">
.app-icon {
    --app-color: var(--color, var(--color-background));
    --app-color-dark: color-mix(
      in srgb,
      var(--color-dark),
      var(--app-color) 50%
    );
    --app-color-light: color-mix(
      in srgb,
      var(--color-light),
      var(--app-color) 50%
    );

    width: 10em;
    height: 10em;

    background: var(--color, var(--color-background));
    border-radius: .5em;
    transition: transform 0.3s ease;

    background-image: radial-gradient(
      circle at 50% 50%,
      var(--app-color-light) 0%,
      var(--app-color) 100%
    );

    &:hover {
      z-index: 10;
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);

      .app-icon__title {
        transform: scale(1);
        opacity: 1;
      }
    }

    view-timeline-name: --revealing-image;
    view-timeline-axis: block;
    animation: linear reveal-center both;
    animation-timeline: --revealing-image;
    animation-range: entry 0% cover 20%;
    // box-shadow: inset 0 0 0 1px var(--color-secondary);
    @at-root {
      @keyframes reveal-center {
        0% {
          transform: scale(0);
        }
        80% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }
    }


  &__link {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space);
    text-decoration: none;
    color: inherit;
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1;
  }

  &__image {
    width: 100%;
    height: auto;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
    aspect-ratio: 1 / 1;
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--color-foreground);
    padding: var(--space-xs);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
  }

  &__title {
    margin-top: var(--space-xs);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-align: center;
    color: var(--color-light);
    background-color: var(--color-dark);
    border-radius: 1em;
    padding: 0.1em 0.5em;
    transform: scale(0.5);
    opacity: 0;
    transition: 0.3s ease-in-out;
    position: absolute;
    top: 100%;
  }
}
</style>
