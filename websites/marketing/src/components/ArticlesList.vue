<template>
  <div :class="bemm()">
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
    <div v-else-if="articles.length > 0" :class="bemm('grid')">
      <article
        v-for="article in articles"
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
          <h3 :class="bemm('title')">
            {{ article.title }}
          </h3>

          <!-- Short Description -->
          <p v-if="article.short" :class="bemm('excerpt')">
            {{ article.short }}
          </p>

          <!-- Meta Info -->
          <div :class="bemm('meta')">
            <time :class="bemm('date')" :datetime="article.published_at">
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
      <p>{{ emptyMessage || t('common.noArticlesFound') }}</p>
    </div>

    <!-- Error State -->
    <div v-if="error" :class="bemm('error')">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { useI18n, contentService, type ContentArticle } from '@tiko/core';

interface ArticlesListProps {
  pageSlug: string;
  emptyMessage?: string;
  limit?: number;
}

const props = withDefaults(defineProps<ArticlesListProps>(), {
  limit: 0
});

const bemm = useBemm('articles-list');
const router = useRouter();
const { t, locale } = useI18n();

const articles = ref<ContentArticle[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Format date based on locale
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString(locale, options);
  } catch (err) {
    return dateString;
  }
}

// Navigate to article detail page
function navigateToArticle(article: ContentArticle) {
  // Navigate to /articles/[slug] or /updates/[slug] based on the page
  router.push(`/${props.pageSlug}/${article.slug}`);
}

// Load articles for the current page
async function loadArticles() {
  try {
    loading.value = true;
    error.value = null;

    // Get all articles
    const allArticles = await contentService.getArticles();
    
    // Filter articles based on the page slug
    const filteredArticles = allArticles.filter(article => {
      // Get the page data to check the slug
      // For now, we'll need to match based on page_title or implement a better solution
      return article.is_published;
    });

    // Sort by published date (newest first)
    filteredArticles.sort((a, b) => {
      const dateA = new Date(a.published_at || 0);
      const dateB = new Date(b.published_at || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Apply limit if specified
    if (props.limit > 0) {
      articles.value = filteredArticles.slice(0, props.limit);
    } else {
      articles.value = filteredArticles;
    }
  } catch (err: any) {
    console.error('Failed to load articles:', err);
    error.value = t('errors.failedToLoadArticles');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadArticles();
});
</script>

<style lang="scss">
.articles-list {
  padding: var(--space-xl) 0;

  &__loading {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-l);
  }

  &__skeleton-item {
    background: var(--color-background-subtle);
    border-radius: var(--border-radius-m);
    overflow: hidden;
  }

  &__skeleton-image {
    width: 100%;
    height: 200px;
    background: linear-gradient(90deg, 
      var(--color-background-subtle) 25%, 
      var(--color-background) 50%, 
      var(--color-background-subtle) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__skeleton-content {
    padding: var(--space-m);
  }

  &__skeleton-title {
    height: 24px;
    background: linear-gradient(90deg, 
      var(--color-background-subtle) 25%, 
      var(--color-background) 50%, 
      var(--color-background-subtle) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: var(--space-s);
    border-radius: var(--border-radius-s);
  }

  &__skeleton-text {
    height: 16px;
    background: linear-gradient(90deg, 
      var(--color-background-subtle) 25%, 
      var(--color-background) 50%, 
      var(--color-background-subtle) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: var(--space-xs);
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
    background: var(--color-background);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    transition: transform var(--transition-duration) var(--transition-timing);

    .articles-list__article:hover & {
      transform: scale(1.05);
    }
  }

  &__content {
    padding: var(--space-m);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__category {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-xs);
  }

  &__title {
    font-size: var(--font-size-l);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-s) 0;
    line-height: 1.3;
    
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__excerpt {
    font-size: var(--font-size-m);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-m) 0;
    flex: 1;
    
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-m);
    margin-bottom: var(--space-m);
    font-size: var(--font-size-s);
    color: var(--color-text-subtle);
  }

  &__date {
    white-space: nowrap;
  }

  &__tags {
    display: flex;
    gap: var(--space-xs);
    overflow: hidden;
  }

  &__tag {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__action {
    margin-top: auto;
  }

  &__read-more {
    display: inline-flex;
    align-items: center;
    font-weight: 600;
    color: var(--color-primary);
    font-size: var(--font-size-m);
    transition: color var(--transition-duration) var(--transition-timing);

    &::after {
      content: '→';
      margin-left: var(--space-xs);
      transition: transform var(--transition-duration) var(--transition-timing);
    }

    .articles-list__article:hover & {
      color: var(--color-primary-600);

      &::after {
        transform: translateX(4px);
      }
    }
  }

  &__empty {
    text-align: center;
    padding: var(--space-xl);
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
  .articles-list {
    &__grid {
      grid-template-columns: 1fr;
      gap: var(--space-m);
    }
  }
}
</style>