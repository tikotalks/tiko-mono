<template>
  <div :class="bemm()">
    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <div :class="bemm('skeleton')">
        <div :class="bemm('skeleton-header')"></div>
        <div :class="bemm('skeleton-content')">
          <div :class="bemm('skeleton-line')"></div>
          <div :class="bemm('skeleton-line')"></div>
          <div :class="bemm('skeleton-line', 'short')"></div>
        </div>
      </div>
    </div>

    <!-- Article Content -->
    <article v-else-if="article" :class="bemm('article')">
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

    <!-- Error State -->
    <div v-else-if="error" :class="bemm('error')">
      <div :class="bemm('container')">
        <h2>{{ t('errors.articleNotFound') }}</h2>
        <p>{{ error }}</p>
        <router-link to="/" :class="bemm('home-link')">
          {{ t('common.backToHome') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBemm } from 'bemm';
import { useI18n, useContent } from '@tiko/core';
import { TMarkdownRenderer } from '@tiko/ui';

const bemm = useBemm('article-detail');
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

// Define article interface
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

const article = ref<Article | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Initialize content service
const contentService = useContent({
  projectSlug: 'marketing',
  useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID,
});

// Extract parent page slug and article slug from route
const parentPageSlug = computed(() => {
  const viewParam = route.params.view;
  if (Array.isArray(viewParam) && viewParam.length >= 1) {
    return viewParam[0];
  }
  return 'articles'; // Default fallback
});

const articleSlug = computed(() => {
  const viewParam = route.params.view;
  if (Array.isArray(viewParam) && viewParam.length >= 2) {
    return viewParam[1];
  }
  return '';
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


// Load article by slug
async function loadArticle() {
  try {
    loading.value = true;
    error.value = null;

    if (!articleSlug.value || !parentPageSlug.value) {
      throw new Error('No article slug or parent page provided');
    }

    // First, get the page to get its ID
    const page = await contentService.getPage(parentPageSlug.value, locale.value);
    if (!page) {
      throw new Error(`Parent page not found: ${parentPageSlug.value}`);
    }

    // Get articles for this page
    const pageArticles = await contentService.getArticlesByPage(page.page.id, locale.value?.split('-')[0] || 'en');
    
    // Find the article by slug
    const foundArticle = pageArticles.find((a: Article) => a.slug === articleSlug.value);
    
    if (!foundArticle) {
      throw new Error(`Article not found: ${articleSlug.value}`);
    }

    // Check if article is published
    if (!foundArticle.is_published) {
      throw new Error('This article is not published yet');
    }

    article.value = foundArticle;
  } catch (err: any) {
    console.error('Failed to load article:', err);
    error.value = err.message || t('errors.failedToLoadArticle');
    
    // Redirect to 404 if article not found
    if (err.message?.includes('not found')) {
      router.push('/404');
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadArticle();
});
</script>

<style lang="scss">
.article-detail {
  min-height: 100vh;
  background: var(--color-background);

  &__loading {
    padding: var(--space-2xl);
    max-width: 800px;
    margin: 0 auto;
  }

  &__skeleton {
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__skeleton-header {
    height: 300px;
    background: var(--color-background-subtle);
    margin-bottom: var(--space-xl);
    border-radius: var(--border-radius-m);
  }

  &__skeleton-content {
    padding: var(--space-xl);
  }

  &__skeleton-line {
    height: 20px;
    background: var(--color-background-subtle);
    margin-bottom: var(--space-m);
    border-radius: var(--border-radius-s);

    &--short {
      width: 60%;
    }
  }

  &__article {
    animation: fadeIn 0.3s ease-in;
  }

  &__hero {
    width: 100%;
    height: 400px;
    overflow: hidden;
    background: var(--color-background-subtle);
  }

  &__hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__header {
    padding: var(--space-2xl) 0;
    border-bottom: 1px solid var(--color-border-subtle);
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
    transition: color var(--transition-duration) var(--transition-timing);

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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-m);
    margin-bottom: var(--space-l);
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
  }

  &__date {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
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
    letter-spacing: 0.05em;
  }

  &__title {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-l) 0;
    line-height: 1.2;
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
    transition: all var(--transition-duration) var(--transition-timing);

    &:hover {
      background: var(--color-primary-100);
      color: var(--color-primary);
    }
  }

  &__content {
    padding: var(--space-3xl) 0;
  }

  &__body {
    font-size: var(--font-size-m);
    line-height: 1.8;
    color: var(--color-text-primary);

    // Markdown content styles
    h1, h2, h3, h4, h5, h6 {
      margin: var(--space-xl) 0 var(--space-m) 0;
      font-weight: 600;
      line-height: 1.3;
    }

    h1 { font-size: var(--font-size-2xl); }
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
      transition: color var(--transition-duration) var(--transition-timing);

      &:hover {
        color: var(--color-primary-600);
      }
    }

    hr {
      margin: var(--space-2xl) 0;
      border: none;
      border-top: 1px solid var(--color-border-subtle);
    }

    table {
      width: 100%;
      margin: var(--space-l) 0;
      border-collapse: collapse;

      th, td {
        padding: var(--space-s);
        text-align: left;
        border-bottom: 1px solid var(--color-border-subtle);
      }

      th {
        font-weight: 600;
        background: var(--color-background-subtle);
      }
    }
  }

  &__footer {
    padding: var(--space-2xl) 0;
    border-top: 1px solid var(--color-border-subtle);
  }

  &__back-link {
    display: inline-flex;
    align-items: center;
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;
    transition: color var(--transition-duration) var(--transition-timing);

    &:hover {
      color: var(--color-primary-600);
    }
  }

  &__error {
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

  &__home-link {
    display: inline-block;
    padding: var(--space-s) var(--space-l);
    background: var(--color-primary);
    color: white;
    text-decoration: none;
    border-radius: var(--border-radius-m);
    font-weight: 500;
    transition: all var(--transition-duration) var(--transition-timing);

    &:hover {
      background: var(--color-primary-600);
      transform: translateY(-1px);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .article-detail {
    &__hero {
      height: 250px;
    }

    &__title {
      font-size: var(--font-size-2xl);
    }

    &__excerpt {
      font-size: var(--font-size-m);
    }

    &__breadcrumb {
      font-size: var(--font-size-xs);
      overflow-x: auto;
      white-space: nowrap;
    }
  }
}
</style>