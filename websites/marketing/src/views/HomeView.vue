<template>
  <div :class="bemm()">


    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <div :class="bemm('loading-spinner')"></div>
    </div>

    <template v-if="!loading && pageData?.sections?.length">
      <SectionRenderer
        v-for="section in pageData.sections"
        :key="section.section.id"
        :section="section.section"
        :content="section.content"
        :show-debug="false"
      />
    </template>

    <!-- No Sections State -->
    <div v-else-if="!loading && pageData && (!pageData.sections || pageData.sections.length === 0)" :class="bemm('no-sections')">
      <p>No sections found for this page. Check console for debug info.</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!loading && error" :class="bemm('error')">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { useContent, type PageContent, type ContentSection } from '@tiko/core';
import { useI18n } from '@tiko/ui';
import { ref, onMounted, watch } from 'vue';
import SectionRenderer from '../components/SectionRenderer.vue';

const bemm = useBemm('home-view');
const { locale } = useI18n();
const content = useContent({ projectSlug: 'marketing' });

// Page content
const pageData = ref<PageContent | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Function to load content for current language
async function loadContent() {
  try {
    loading.value = true;
    error.value = null;

    // Get language code from locale (e.g., 'en-GB' -> 'en')
    const languageCode = locale.value.split('-')[0];

    const page = await content.getPage('home', languageCode, true);
    console.log('Page response:', page);

    if (page) {
      pageData.value = page;
      console.log('Page data loaded:', pageData.value);
    } else {
      // Try to list all pages to see what's available
      const allPages = await content.getPages();
      console.log('Available pages:', allPages);
      error.value = `No content found for "home" page in ${languageCode}. Available pages logged to console.`;
    }
  } catch (err) {
    console.error('Failed to load page content:', err);
    error.value = `Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`;
  } finally {
    loading.value = false;
  }
}

// Load content on mount
onMounted(() => {
  loadContent();
});

// Reload content when language changes
watch(locale, () => {
  loadContent();
});
</script>

<style lang="scss">
.home-view {
  // Loading state
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--space-2xl);
  }

  &__loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--color-primary-20);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  pre{
    color: white;
  }

  &__error {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: var(--space-2xl);
    color: var(--color-error);
  }
}
</style>
