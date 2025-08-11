<template>
  <section :class="bemm()">
    <h2
      v-if="content?.title"
      :class="bemm('title')"
      v-html="processTitle(content.title)"
    />

    <div :class="bemm('container')">
      <div :class="bemm('column', ['', 'left'])">
        <TMarkdownRenderer :class="bemm('content')" :content="content.content" />
        <ul :class="bemm('language-list')" v-if="content.list">
          <li
            :class="bemm('language-item')"
            v-for="lang in content?.list
              .filter((lang: any) => {
                const code =
                  typeof lang === 'string'
                    ? lang.split(' : ')[0]
                    : lang.key || lang.code || '';
                return !code.includes('-');
              })
              .map((lang: any) => {
                const code =
                  typeof lang === 'string'
                    ? lang.split(' : ')[0]
                    : lang.key || lang.code || '';
                return getTranslation(code);
              })
              .sort()"
          >
            {{ lang }}
          </li>
        </ul>
      </div>
      <div :class="bemm('column', ['', 'right'])">
        <div :class="bemm('language-card-container')">
          <TransitionGroup
            name="fade"
            tag="ul"
            :class="bemm('language-card-list')"
          >
            <li
              v-for="(language, index) in visibleLocales"
              :key="language.key + language.value"
              :class="bemm('language-card-item')"
            >
              <span :class="bemm('language-flag')">{{ language.value }}</span>
              <span :class="bemm('language-code')">{{ language.key }}</span>
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
import { TMarkdownRenderer } from '@tiko/ui';
import { processTitle } from '@/utils/processTitle';
import { ref, onMounted, onUnmounted, computed } from 'vue';

import { useI18n } from '@tiko/ui';

const { t } = useI18n();

interface TextSectionProps {
  section: ContentSection | null;
  content: any;
}

const getTranslation = (lang: string): string => {
  const langKey = `languageNames.${lang.toLowerCase()}`;
  return t(langKey);
};

const props = defineProps<TextSectionProps>();
const bemm = useBemm('languages-section');

const languages = ref<any[]>([]);

const visibleLocales = computed(() => {
  return languages.value.filter((lang: KeyValue) => lang.key.includes('-'));
});
const visibleLanguages = computed(() => {
  return languages.value
    .filter((lang: KeyValue) => !lang.key.includes('-'))
    .map((lang: KeyValue) => t(`languageNames.${lang.key}`));
});

interface KeyValue {
  key: string;
  value: string;
}

onMounted(() => {
  if (props.content?.list) {
    languages.value = props.content.list.map((lang: string | KeyValue) => {
      if (typeof lang === 'string') {
        const [key, value] = lang.split(' : ');
        return { key, value };
      } else if (typeof lang === 'object' && lang.key && lang.value) {
        return { key: lang.key, value: lang.value };
      }
      return { key: '', value: '' };
    });
  }
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

    @media screen and (max-width: 720px) {
      flex-direction: column;
      gap: var(--spacing);
    }
  }

  &__column {
    width: 50%;

    @media screen and (max-width: 720px) {
      width: 100%;
    }
  }

  &__title {
    font-size: clamp(3em, 4vw, 6em);
    line-height: 1;
    font-family: var(--header-font-family);
    color: var(--color-green);

    max-width: 50%;

    .title-dot {
      color: var(--color-pink);
    }

    @media screen and (max-width: 720px) {
      width: 100%;
      font-size: clamp(2em, 3vw, 4em);
      text-align: center;
      max-width: fit-content;
    }
  }

  &__content {
    color: var(--color-foreground-secondary);
    line-height: 1.6;
    max-width: 640px;

    p {
      margin-bottom: var(--space);
    }

    @media screen and (max-width: 720px) {
      width: 100%;
    }
  }

  &__language-list {
    margin-top: var(--space);
    display: flex;
    flex-wrap: wrap;
  }

  &__language-item {
    width: 50%;
    color: var(--color-primary);
  }

  &__language-card-container {
    background-color: var(--color-primary);
    width: 100%;
    transform: translateX(var(--spacing)) translateY(calc(var(--spacing) * -1));
    border-radius: var(--border-radius) 0 0 var(--border-radius);
    margin-bottom: calc(var(--spacing) * -1);

    @media screen and (max-width: 720px) {
      width: 100%;
      transform: translateX(0) translateY(0);
      border-radius: var(--border-radius);
      margin-bottom: 0;
    }
  }

  &__language-card-list {
    display: flex;
    flex-direction: row;
    gap: var(--space);
    flex-wrap: wrap;
    padding: var(--space);

    @media screen and (max-width: 720px) {
      flex-direction: row;
      align-items: space-between;
      justify-content: center;
    }
  }

  &__language-card-item {
    --item-size: clamp(4em, 8vw, 12em);
    width: var(--item-size);
    height: var(--item-size);
    background-color: var(--color-dark);
    position: relative;
    overflow: hidden;
    border-radius: var(--border-radius);

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
  }

  &__language-code {
    display: none;
    // font-size: calc(clamp(4em, 8vw, 12em) * 2.5);
    // position: absolute;
    // left: 50%;
    // top: 50%;
    // transform: translate(-50%, -50%) rotate(-10deg);
    // filter: blur(5px);
  }

  &__language-flag {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: calc(clamp(4em, 8vw, 12em) * 0.5);
    white-space: nowrap;
    color: var(--color-foreground);
    font-weight: bold;
    // text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
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
