<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
    <h2
      v-if="content?.title"
      :class="bemm('title')"
      v-html="processTitle(content.title)"
    />

      <div :class="bemm('column', ['', 'left'])">
        <TMarkdownRenderer :class="bemm('content')" :content="content.content" />
      </div>
      <div :class="bemm('column', ['', 'right'])"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import type { ContentSection } from '@tiko/core';
import { TMarkdownRenderer } from '@tiko/ui';
import { processTitle } from '@/utils/processTitle';
import { ref, onMounted, onUnmounted } from 'vue';

import { useI18n } from '@tiko/core';

const { t } = useI18n();

interface TextSectionProps {
  section: ContentSection | null;
  content: any;
}


const props = defineProps<TextSectionProps>();
const bemm = useBemm('open-section');

</script>

<style lang="scss">
.open-section {
  padding: var(--spacing);
  background-color: var(--color-light);
  color: var(--color-dark);
  position: relative;


  &__title {

    color: var(--color-orange);

    .title-dot {
      color: var(--color-blue);
    }
  }

  &__content {
    column-count: 2;
    margin-top: var(--space-xl);
  }

  &__container{
    padding: var(--spacing);
    background-color: color-mix(in srgb, var(--color-orange), transparent 75%);
    border-radius: var(--border-radius);
  }
}
</style>
