<template>
  <!-- Article Content -->
  <article v-if="article && Object.keys(article).length > 0" :class="bemm()">

    <!-- Article Header -->
    <header :class="bemm('header', ['', article.image_url ? 'has-background' : ''])"
      :style="`--background-url: ${article.image_url}`">
      <div :class="bemm('container')">
        <!-- Breadcrumb -->
        <nav :class="bemm('breadcrumb')">
          <router-link to="/" :class="bemm('breadcrumb-link')">
            {{ t('common.home') }}
          </router-link>
          <span :class="bemm('breadcrumb-separator')">/</span>
          <router-link :to="`/${parentPageSlug}`" :class="bemm('breadcrumb-link')">
            {{ parentPageTitle }}
          </router-link>
          <span :class="bemm('breadcrumb-separator')">/</span>
          <span :class="bemm('breadcrumb-link',['','current'])">{{ article.title }}</span>
        </nav>

        <!-- Article Meta -->
        <div :class="bemm('meta')">
          <time v-if="formatDate(article.published_at)" :class="bemm('date')" :datetime="article.published_at">
            {{ formatDate(article.published_at) }}
          </time>
          <span v-if="article.category" :class="bemm('category')">
            {{ article.category }}
          </span>
        </div>

        <!-- Title -->
        <h1 :class="bemm('title')">{{ article.title }}</h1>

        <!-- Short Description -->
        <p v-if="article.short" :class="bemm('excerpt')">
          {{ article.short }}
        </p>

        <!-- Tags -->
        <div v-if="article.tags?.length" :class="bemm('tags')">
          <span v-for="tag in article.tags" :key="tag" :class="bemm('tag')">
            #{{ tag }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div :class="bemm('content')">
      <div :class="bemm('container', ['', 'content'])">
        <TMarkdownRenderer :content="article.content" :class="bemm('body')" />
      </div>
    </div>

    <!-- Footer Actions -->
    <footer :class="bemm('footer')">
      <div :class="bemm('container')">
        <router-link :to="`/${parentPageSlug}`" :class="bemm('back-link')">
          ← {{ t('common.backTo', { page: parentPageTitle }) }}
        </router-link>
      </div>
    </footer>

  </article>

  <!-- No Article Found -->
  <div v-else :class="bemm('no-article')">
    <div :class="bemm('container')">
      <h2>{{ t('errors.articleNotFound') }}</h2>
      <p>{{ t('errors.articleNotFoundDescription') }}</p>
      <router-link :to="`/${parentPageSlug}`" :class="bemm('back-link')">
        ← {{ t('common.backTo', { page: parentPageTitle }) }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useBemm } from 'bemm';
import { useI18n, type ContentSection } from '@tiko/core';
import { TMarkdownRenderer } from '@tiko/ui';

interface ArticleDetailSectionProps {
  section: ContentSection;
  content?: Record<string, any>;
}

const props = defineProps<ArticleDetailSectionProps>();
const bemm = useBemm('article-detail');
const route = useRoute();
const { t, locale } = useI18n();

// Get the article from content
const article = computed(() => props.content?.article || {});

// Extract parent page slug from route
const parentPageSlug = computed(() => {
  const viewParam = route.params.view;
  if (Array.isArray(viewParam) && viewParam.length >= 1) {
    return viewParam[0];
  }
  return 'articles';
});

// Get parent page title based on slug
const parentPageTitle = computed(() => {
  switch (parentPageSlug.value) {
    case 'articles':
      return t('pages.articles');
    case 'updates':
      return t('pages.updates');
    case 'news':
      return t('pages.news');
    case 'blog':
      return t('pages.blog');
    default:
      return (
        parentPageSlug.value.charAt(0).toUpperCase() +
        parentPageSlug.value.slice(1)
      );
  }
});

// Format date based on locale
function formatDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString(locale.value, options);
  } catch (err) {
    return '';
  }
}
</script>

<style lang="scss">
.article-detail {
  &__hero {
    width: 100%;
    height: 400px;
    overflow: hidden;
    background: var(--color-background-subtle);
    margin-bottom: var(--space-2xl);
    border: 1px solid red;
  }

  &__hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__header {
    .article-detail__container {
      padding-top: calc(var(--spacing) + var(--page-header-height, 100px));
      background-color: color-mix(in srgb, var(--color-foreground), transparent 90%);

    }
  }

  &__container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--spacing);

    &--content {
      max-width: 960px;
      margin: auto;
    }
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    font-size: var(--font-size-s);
    margin-bottom: var(--space-m);
    color: var(--color-tertiary);
  }

  &__breadcrumb-link {
    text-decoration: none;
    color: var(--color-foreground);
    opacity: .5;

    &:hover {
      color: var(--color-primary);
      opacity: 1;
    }
    &--current {
    opacity:1;
    font-weight: 500;
  }
  }

  &__breadcrumb-separator {
    color: var(--color-text-subtle);
  }


  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-m);
    margin-bottom: var(--space-l);
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
  }

  &__category {
    display: inline-block;
    padding: var(--space-xs) var(--space-s);
    background: var(--color-primary-100);
    color: var(--color-primary);
    border-radius: var(--border-radius-s);
    font-weight: 600;
    text-transform: uppercase;
    font-size: var(--font-size-xs);
  }

  &__title {
    font-size: clamp(2em, 4vw, 6em);
    font-weight: 700;
    color: var(--color-primary);
    line-height: 1;
  }

  &__excerpt {
    font-size: var(--font-size-l);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-l) 0;
    line-height: 1.6;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s);
  }

  &__tag {
    display: inline-block;
    padding: var(--space-xs) var(--space-s);
    background: var(--color-background-subtle);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-s);
    font-size: var(--font-size-s);
  }

  &__content {
    margin: auto;
  }



  &__body {
    font-size: var(--font-size);
    line-height: 1.75;
    color: var(--color-foreground);
  }

  &__footer {
    padding: var(--space);

    .article-detail__container {
      border-radius: var(--border-radius);
      background-color: color-mix(in srgb, var(--color-foreground), transparent 90%);
      padding: var(--space-xl);
    }
  }

  &__back-link {
    display: inline-flex;
    align-items: center;
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
  }

  &__no-article {
    padding: var(--space-3xl) 0;
    text-align: center;

    h2 {
      font-size: var(--font-size-2xl);
      color: var(--color-danger);
      margin-bottom: var(--space-m);
    }

    p {
      font-size: var(--font-size-l);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xl);
    }
  }
}
</style>
