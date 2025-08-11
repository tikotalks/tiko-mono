<template>
  <section :class="bemm()">
    <div :class="bemm('wrapper')">
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

    <div :class="bemm('apps')">
      <div v-if="content?.items" :class="bemm('apps-list')">
        <AppIcon
          v-for="(app, index) in content.items"
          :key="index"
          :app="app"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TMarkdownRenderer } from '@tiko/ui';
import type { ContentSection } from '@tiko/core';
import { processTitle } from '@/utils/processTitle';
import AppIcon from '../blocks/AppIcon.vue';

interface TextSectionProps {
  section: ContentSection;
  content: any;
}

defineProps<TextSectionProps>();
const bemm = useBemm('apps-section');

</script>

<style lang="scss">
.apps-section {
  padding: var(--spacing);
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
    flex-wrap: wrap;
    gap: var(--space);
    justify-content: center;

    font-size: clamp(1em, 2vw, 3em);
  }

}
</style>
