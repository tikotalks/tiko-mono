<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <!-- Section Header -->
      <div v-if="content?.title || content?.description" :class="bemm('header')">
        <h2 v-if="content?.title" :class="bemm('title')">
          {{ content.title }}
        </h2>
        <p v-if="content?.description" :class="bemm('description')">
          {{ content.description }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" :class="bemm('loading')">
        <div v-for="i in 6" :key="i" :class="bemm('skeleton-item')">
          <div :class="bemm('skeleton-image')"></div>
          <div :class="bemm('skeleton-content')">
            <div :class="bemm('skeleton-title')"></div>
            <div :class="bemm('skeleton-text')"></div>
            <div :class="bemm('skeleton-text', 'short')"></div>
          </div>
        </div>
      </div>

      <!-- Articles Grid -->
      <div v-else-if="filteredArticles.length > 0" :class="bemm('grid')">
        <article
          v-for="article in filteredArticles"
          :key="article.id"
          :class="bemm('article')"
          @click="navigateToArticle(article)"
        >
          <!-- Article Image -->
          <div v-if="article.image_url" :class="bemm('image-wrapper')">
            <img
              :src="article.image_url"
              :alt="article.title"
              :class="bemm('image')"
              loading="lazy"
            />
          </div>

          <!-- Article Content -->
          <div :class="bemm('content')">
            <!-- Category -->
            <div v-if="article.category" :class="bemm('category')">
              {{ article.category }}
            </div>

            <!-- Title -->
            <h3 :class="bemm('title-article')">
              {{ article.title }}
            </h3>

            <!-- Short Description -->
            <p v-if="article.short" :class="bemm('excerpt')">
              {{ article.short }}
            </p>

            <!-- Meta Info -->
            <div :class="bemm('meta')">
              <time v-if="formatDate(article.published_at)" :class="bemm('date')" :datetime="article.published_at">
                {{ formatDate(article.published_at) }}
              </time>

              <!-- Tags -->
              <div v-if="article.tags?.length" :class="bemm('tags')">
                <span
                  v-for="tag in article.tags.slice(0, 3)"
                  :key="tag"
                  :class="bemm('tag')"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>

            <!-- Read More -->
            <div :class="bemm('action')">
              <span :class="bemm('read-more')">{{ t('common.readMore') }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else :class="bemm('empty')">
        <p>{{ content?.emptyMessage || 'No articles found' }}</p>
      </div>

      <!-- Error State -->
      <div v-if="error" :class="bemm('error')">
        <p>{{ error }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBemm } from 'bemm';
import { useI18n, type ContentSection } from '@tiko/core';

interface ArticlesSectionProps {
  section: ContentSection;
  content?: Record<string, any>;
}

const props = defineProps<ArticlesSectionProps>();

const bemm = useBemm('articles-section');
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

// Define article interface matching content_articles table
interface Article {
  id: string;
  page_id: string;
  language_code: string;
  title: string;
  slug: string;
  short?: string;
  content: string;
  category?: string;
  tags: string[];
  image_url?: string;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  page_title?: string;
  page_slug?: string;
}

// Get articles from content
const articles = computed(() => {
  // Articles are automatically loaded by the content worker for article-overview sections
  return props.content?.articles || [];
});

// Loading and error states are handled by the parent component
const loading = ref(false);
const error = ref<string | null>(null);

// Get page data from parent
const pageData = inject<any>('pageData');

// Get the current page slug from page data
const currentPageSlug = computed(() => {
  // First try to get from page data
  if (pageData?.value?.page?.slug) {
    return pageData.value.page.slug;
  }

  // Fallback to route params if page data not available
  const viewParam = route.params.view;
  if (Array.isArray(viewParam)) {
    return viewParam[0] || '';
  }
  return viewParam || '';
});

// Filter articles based on content settings
const filteredArticles = computed(() => {
  let filtered = [...articles.value];

  // Filter by category if specified
  if (props.content?.category) {
    filtered = filtered.filter(article => article.category === props.content.category);
  }

  // Filter by tags if specified
  if (props.content?.tags && Array.isArray(props.content.tags)) {
    filtered = filtered.filter(article =>
      article.tags && article.tags.some(tag => props.content.tags.includes(tag))
    );
  }

  // Apply limit if specified
  const limit = props.content?.limit || 0;
  if (limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
});

// Format date based on locale
function formatDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Check if date is valid
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

// Navigate to article detail page
function navigateToArticle(article: Article) {
  // Get the page slug from the article or current page
  const pageSlug = article.page_slug || currentPageSlug.value;

  if (!pageSlug || !article.slug) {
    console.error('Cannot navigate: missing page slug or article slug', { pageSlug, articleSlug: article.slug });
    return;
  }

  router.push(`/${pageSlug}/${article.slug}`);
}

</script>

<style lang="scss">
.articles-section {
  padding: var(--spacing);

  &__container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__header {
    margin-bottom: var(--space-xl);
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-primary);
    margin: 0 0 var(--space-s) 0;
  }

  &__description {
    font-size: var(--font-size-m);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__loading {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-xl);
  }

  &__skeleton-item {
    background: var(--color-background-subtle);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  &__skeleton-image {
    width: 100%;
    height: 240px;
    background: linear-gradient(90deg,
      var(--color-background-subtle) 25%,
      var(--color-background) 50%,
      var(--color-background-subtle) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__skeleton-content {
    padding: var(--space-l);
  }

  &__skeleton-title {
    height: 28px;
    background: linear-gradient(90deg,
      var(--color-background-subtle) 25%,
      var(--color-background) 50%,
      var(--color-background-subtle) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: var(--space-m);
    border-radius: var(--border-radius-s);
  }

  &__skeleton-text {
    height: 18px;
    background: linear-gradient(90deg,
      var(--color-background-subtle) 25%,
      var(--color-background) 50%,
      var(--color-background-subtle) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: var(--space-s);
    border-radius: var(--border-radius-s);

    &--short {
      width: 70%;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-l);
  }

  &__article {
    background: var(--color-accent);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
    display: flex;
    flex-direction: column;
    padding: var(--space);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: var(--color-primary);
    }
  }

  &__image-wrapper {
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: var(--color-background-subtle);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__content {
    padding: var(--space-m);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__category {
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-primary);
    text-transform: uppercase;
    margin-bottom: var(--space-xs);
  }

  &__title-article {
    font-size: var(--font-size-l);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-s) 0;
    line-height: 1.4;
  }

  &__excerpt {
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-m) 0;
    flex: 1;
    line-height: 1.5;

    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    margin-bottom: var(--space-s);
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
    flex-wrap: wrap;
  }

  &__date {
    white-space: nowrap;
  }

  &__tags {
    display: flex;
    gap: var(--space-xs);
  }

  &__tag {
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
  }

  &__action {
    margin-top: auto;
    padding-top: var(--space-s);
    border-top: 1px solid var(--color-border);
  }

  &__read-more {
    display: inline-flex;
    align-items: center;
    font-weight: 500;
    color: var(--color-primary);
    font-size: var(--font-size-s);

    &::after {
      content: '→';
      margin-left: var(--space-xs);
    }
  }

  &__empty {
    text-align: center;
    padding: var(--space-2xl);
    color: var(--color-text-secondary);
    font-size: var(--font-size-l);
  }

  &__error {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-danger);
    font-size: var(--font-size-m);
    background: var(--color-danger-100);
    border-radius: var(--border-radius-m);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .articles-section {
    &__grid {
      grid-template-columns: 1fr;
      gap: var(--space-l);
    }

    &__title {
      font-size: var(--font-size-xl);
    }

    &__description {
      font-size: var(--font-size-m);
    }
  }
}
</style>
