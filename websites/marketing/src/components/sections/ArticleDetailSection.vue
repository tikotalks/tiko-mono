<template>
  <article :class="bemm()">
    <!-- Hero Section with Image -->
    <div v-if="article.image_url" :class="bemm('hero')">
      <img
        :src="article.image_url"
        :alt="article.title"
        :class="bemm('hero-image')"
      />
    </div>

    <!-- Article Header -->
    <header :class="bemm('header')">
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
          <span :class="bemm('breadcrumb-current')">{{ article.title }}</span>
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
          <span
            v-for="tag in article.tags"
            :key="tag"
            :class="bemm('tag')"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div :class="bemm('content')">
      <div :class="bemm('container', 'narrow')">
        <TMarkdownRenderer
          :content="article.content"
          :class="bemm('body')"
        />
      </div>
    </div>

    <!-- Footer Actions -->
    <footer :class="bemm('footer')">
      <div :class="bemm('container')">
        <router-link
          :to="`/${parentPageSlug}`"
          :class="bemm('back-link')"
        >
          ← {{ t('common.backTo', { page: parentPageTitle }) }}
        </router-link>
      </div>
    </footer>
  </article>
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
      return parentPageSlug.value.charAt(0).toUpperCase() + parentPageSlug.value.slice(1);
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
      day: 'numeric'
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
  }

  &__hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__header {
    padding: var(--space-xl) 0;
    border-bottom: 1px solid var(--color-border);
  }

  &__container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space-m);

    &--narrow {
      max-width: 800px;
    }
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    font-size: var(--font-size-s);
    margin-bottom: var(--space-m);
  }

  &__breadcrumb-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    
    &:hover {
      color: var(--color-primary);
    }
  }

  &__breadcrumb-separator {
    color: var(--color-text-subtle);
  }

  &__breadcrumb-current {
    color: var(--color-text-primary);
    font-weight: 500;
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
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-l) 0;
    line-height: 1.3;
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
    padding: var(--space-2xl) 0;
  }

  &__body {
    font-size: var(--font-size-m);
    line-height: 1.8;
    color: var(--color-text-primary);

    h1, h2, h3, h4, h5, h6 {
      margin: var(--space-xl) 0 var(--space-m) 0;
      font-weight: 600;
      line-height: 1.3;
    }

    h2 { font-size: var(--font-size-xl); }
    h3 { font-size: var(--font-size-l); }
    h4 { font-size: var(--font-size-m); }

    p {
      margin: 0 0 var(--space-m) 0;
    }

    ul, ol {
      margin: 0 0 var(--space-m) var(--space-l);
      padding: 0;
    }

    li {
      margin-bottom: var(--space-s);
    }

    blockquote {
      margin: var(--space-l) 0;
      padding: var(--space-m) var(--space-l);
      border-left: 4px solid var(--color-primary);
      background: var(--color-background-subtle);
      font-style: italic;
    }

    code {
      padding: 2px 6px;
      background: var(--color-background-subtle);
      border-radius: var(--border-radius-xs);
      font-family: var(--font-family-mono);
      font-size: 0.9em;
    }

    pre {
      margin: var(--space-l) 0;
      padding: var(--space-m);
      background: var(--color-background-subtle);
      border-radius: var(--border-radius-m);
      overflow-x: auto;

      code {
        padding: 0;
        background: transparent;
      }
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: var(--border-radius-m);
      margin: var(--space-l) 0;
    }

    a {
      color: var(--color-primary);
      text-decoration: underline;
    }

    hr {
      margin: var(--space-2xl) 0;
      border: none;
      border-top: 1px solid var(--color-border);
    }
  }

  &__footer {
    padding: var(--space-xl) 0;
    border-top: 1px solid var(--color-border);
  }

  &__back-link {
    display: inline-flex;
    align-items: center;
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
  }
}
</style>