<template>
  <section :class="bemm()">
     <h2
      v-if="content?.title"
      :class="bemm('title')"
      v-html="processTitle(content.title)"
    />

 <div :class="bemm('container')">
      <div :class="bemm('column', ['', 'left'])">
        <MarkdownRenderer :class="bemm('content')" :content="content.content" />
        <ul :class="bemm('language-list')" v-if="content.list">
          <li :class="bemm('language-item')" v-for="lang in content?.list.filter((lang)=>lang.key.includes('-')).sort()" >
            {{ getTranslation(lang.key) }}
          </li>
        </ul>
      </div>
      <div :class="bemm('column', ['', 'right'])">
        <div :class="bemm('language-card-container')">
          <TransitionGroup name="fade" tag="ul" :class="bemm('language-card-list')">
            <li
              v-for="(language, index) in visibleLanguages"
              :key="language.key + language.value + index"
              :class="bemm('language-card-item')"
            >
              <span :class="bemm('language-flag')">{{ language.key }}</span>
              <span :class="bemm('language-code')">{{ language.value }}</span>
            </li>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import type { ContentSection } from '@tiko/core';
import { processTitle } from '@/utils/processTitle';
import { ref, onMounted, onUnmounted } from 'vue';

import { useI18n } from '@tiko/ui';
import MarkdownRenderer from '../MarkdownRenderer.vue';

const {t} = useI18n();

interface TextSectionProps {
  section: ContentSection | null;
  content: any;
}


const getTranslation = (lang: string): string=>{

  const langKey = `languageNames.${lang.toLowerCase()}`;
  return t(langKey);
}

const props = defineProps<TextSectionProps>();
const bemm = useBemm('languages-section');

const visibleLanguages = ref<any[]>([]);
const rotationInterval = 3000;
const totalImages = 12;
let intervalId: ReturnType<typeof setInterval> | null = null;

function startLanguageRotation() {
  const allLanguages = props.content?.list || [];

  if (!allLanguages.length) return;

  // Initialize the visible list
  const initial = new Set<number>();
  visibleLanguages.value = [];

  while (visibleLanguages.value.length < totalImages && initial.size < allLanguages.length) {
    const idx = Math.floor(Math.random() * allLanguages.length);
    if (!initial.has(idx)) {
      initial.add(idx);
      visibleLanguages.value.push(allLanguages[idx]);
    }
  }

  intervalId = setInterval(() => {
    if (allLanguages.length <= totalImages) return;

    // Pick one to remove
    const removeIndex = Math.floor(Math.random() * visibleLanguages.value.length);
    visibleLanguages.value.splice(removeIndex, 1);

    // Get the names of those already shown
    const currentNames = new Set(visibleLanguages.value.map(l => l.name));

    // Filter available not-shown languages
    const available = allLanguages.filter((l:any) => !currentNames.has(l.name));

    // Add one random available language
    if (available.length) {
      const newLang = available[Math.floor(Math.random() * available.length)];
      visibleLanguages.value.push(newLang);
    }
  }, rotationInterval);
}

onMounted(() => {
  console.log('🌍 [LanguagesSection] Content received:', props.content);
  console.log('🌍 [LanguagesSection] List field type:', typeof props.content?.list);
  console.log('🌍 [LanguagesSection] List field value:', props.content?.list);

  // startLanguageRotation();
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style lang="scss">
.languages-section {
  padding: var(--spacing);
  background-color: var(--color-light);
  color: var(--color-dark);
  position: relative;

  &__image {
    width: 50vw;
    height: 100%;
    position: absolute;
    right: 0;
    bottom: 0;
    background-image: var(--background-image);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    transform: translateY(25%) translateX(25%);
  }

  &__container {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: var(--space-l);
    margin-top: var(--spacing);
  }

  &__column {
    width: 50%;
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-green);

    .title-dot {
      color: var(--color-pink);
    }

    max-width: 50%;
  }

  &__content {
    color: var(--color-foreground-secondary);
    line-height: 1.6;
    max-width: 640px;

    p {
      margin-bottom: var(--space);
    }
  }

  &__language-list{
    margin-top: var(--space);
    display: flex;
    flex-wrap: wrap;
  }
  &__language-item{
    width: 50%;
    color: var(--color-primary);
  }

  &__language-card-container {
    background-color: var(--color-pink);
    width: 100%;
    transform: translateX(var(--spacing)) translateY(calc(var(--spacing) * -1));
    border-radius: var(--border-radius) 0 0 var(--border-radius);
    margin-bottom: calc(var(--spacing) * -1);
  }

  &__language-card-list {
    display: flex;
    flex-direction: row;
    gap: var(--space);
    flex-wrap: wrap;
    padding: var(--space);
    transform: rotate(-10deg);
  }

  &__language-card-item {
    --item-size: clamp(4em, 8vw, 12em);
    width: var(--item-size);
    height: var(--item-size);
    position: relative;
    overflow: hidden;
    border-radius: var(--border-radius);
    box-shadow: inset 0 0 0 1px var(--color-secondary);

    &:nth-child(1) {
      margin-left: calc(var(--item-size) * 0.5);
    }
  }

  &__language-flag {
    font-size: calc(clamp(4em, 8vw, 12em) * 2.5);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) rotate(-10deg);
    filter: blur(5px);
  }

  &__language-code {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: calc(clamp(4em, 8vw, 12em) * 0.25);
    white-space: nowrap;
    color: var(--color-foreground);
    font-weight: bold;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }
}

/* Simple fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
