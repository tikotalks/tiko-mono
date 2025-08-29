<template>
  <section :class="bemm()">
    <div :class="bemm('wrapper')">
      <div
        :class="bemm('image')"
        :style="`--background-image: url(${imageUrl})`"
      ></div>
      <div :class="bemm('container')">
        <h2
          v-if="content?.title"
          :class="bemm('title')"
          v-html="processTitle(content.title)"
        />
        <h4
          v-if="content?.subtitle"
          :class="bemm('subtitle')"
          v-html="content.subtitle"
        />
        <TMarkdownRenderer
          :class="bemm('content')"
          v-if="content?.content"
          :content="content.content"
        />
      </div>
    </div>

    <!-- <pre>{{ content }}
    </pre> -->
    <div :class="bemm('apps')">
      <div v-if="content?.items" :class="bemm('apps-list')">
        <div
          v-for="(app, index) in content.items"
          :id="`app-${kebabCase(app.data?.app_title)}`"
          :key="index"
          :class="bemm('app-item')"
          :style="`--app-color: ${app.data?.color ? `var(--color-${app.data.color})` : '#000'}; --app-color-text: ${app.data?.color ? `var(--color-${app.data.color}-text)` : '#fff'};`"
        >
          <h3 :class="bemm('app-title')">{{ app.data.app_title }}</h3>
          <div :class="bemm('app-content')">
            <TAppIcon :class="bemm('app-icon')"  :size="'auto'" :color="app.data.color" :imageId="app.data['app-icon'].id" />
            <div :class="bemm('app-description')">
              <TMarkdownRenderer
                v-if="app.data.app_description"
                :content="app.data.app_description"
                :class="bemm('app-description-content')"
              />

              <TButton :color="app.data.color" :link="app.data.app_link"
                >Go to</TButton
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TButton, TMarkdownRenderer,TAppIcon } from '@tiko/ui';
import type { ContentSection } from '@tiko/core';
import { useImages, useImageUrl } from '@tiko/core';
import { onMounted, ref } from 'vue';
import { kebabCase } from '@sil/case';
import { processTitle } from '@/utils/processTitle';

interface TextSectionProps {
  section: ContentSection;
  content: any;
}

const props = defineProps<TextSectionProps>();
const bemm = useBemm('apps-list-section');

const { getImage, loadImages } = useImages(true); // Use public mode for marketing site
const { getImageVariants } = useImageUrl();

const getImageUrl = (imageId: string) => {
  const imageData = getImage(imageId);
  if (imageData) {
    return getImageVariants(imageData.original_url).medium;
  }
  return '';
};

// Helper to get app data from the item structure
const getAppData = (app: any, key: string) => {
  // The app should have a 'data' object with the field values
  if (app && app.data && app.data[key] !== undefined) {
    return app.data[key];
  }
  return null;
};
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

onMounted(async () => {
  await loadImages();
  loadImage();

  // Debug app items
  console.log('Apps Section - Items:', props.content?.items);
  props.content?.items?.forEach((item: any, index: number) => {
    console.log(`App ${index}:`, {
      name: item.item?.name,
      data: item.data,
      app_title: getAppData(item, 'app_title'),
      color: getAppData(item, 'color'),
      app_icon: getAppData(item, 'app_icon'),
    });
  });
});
</script>

<style lang="scss">
.apps-list-section {
  background-color: var(--color-light);
  color: var(--color-dark);

  position: relative;

  @media screen and (max-width: 720px) {
    padding-top: calc(var(--spacing) * 3);
  }

  &__wrapper {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }
  &__image {
    width: 50vw;
    height: 50vw;
    position: absolute;
    left: 0;
    top: 50%;
    background-image: var(--background-image);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    transform: translateY(-50%) translateX(-25%) rotate(90deg);
  }

  &__container {
    width: calc(50% + (var(--spacing) * 1.5));

    display: flex;
    flex-direction: column;
    gap: var(--space-l);
    background-color: color-mix(in srgb, var(--color-blue), transparent 75%);
    border-radius: var(--border-radius);
    padding: var(--spacing);
    transform: translateX(var(--spacing));

    @media screen and (max-width: 720px) {
      width: 100%;
      padding: var(--spacing);
      transform: translateX(0);
    }
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-blue);
    position: absolute;
    left: 0;
    transform: translateX(-100%);
    width: calc(50vw - var(--spacing));
    span {
      color: var(--color-green);
    }

    @media screen and (max-width: 720px) {
      position: relative;
      width: 100%;
      // background-color: transparent;
      transform: translateY(calc(var(--spacing) * -1));
      margin-bottom: calc(var(--spacing) * -1);
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

  &__apps {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space);
    justify-content: center;
    left: 0;
    width: 100%;
    bottom: 0;
    position: relative;
    z-index: 10;
    margin-top: calc((var(--spacing) / 2) * -1);
  }
  &__apps-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: center;
    font-size: clamp(1em, 2vw, 3em);
    width: 100%;
    gap: var(--spacing);
    padding: var(--spacing);
  }
  &__app-item {
    background-color: color-mix(
      in srgb,
      var(--app-color),
      var(--color-background) 50%
    );
    color: var(--color-foreground);
    padding: var(--spacing);
    border-radius: calc(var(--border-radius) * 2);
    display: flex;
    flex-direction: column;
    gap: var(--space);
    width: 100%;

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
        100% {
          transform: scale(1);
        }
      }
    }
  }

  &__app-link {
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

  &__app-image {
    width: 100%;
    height: auto;
  }

  &__app-placeholder {
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

  &__app-title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    color: var(--app-color-text);
    // color: color-mix(in srgb, var(--app-color), var(--app-color-text) 50%);
    font-family: var(--header-font-family);

  }
  &__app-content {
    display: flex;
    flex-direction: row;
    gap: var(--space);
    align-items: flex-start;
    justify-content: flex-start;
    @media screen and (max-width: 720px) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__app-icon{
    width: 20vw;
    height: 20vw;
    flex-shrink: 0;
  }
}
</style>
