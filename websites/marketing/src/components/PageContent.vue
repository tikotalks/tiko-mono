<template>
  <div :class="bemm()">
    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <div :class="bemm('loading-spinner')"></div>
    </div>

    <template v-if="!loading && pageData?.sections?.length" v-for="section in pageData.sections" :key="section.section.id">
      <SectionRenderer
        :section="section.section"
        :content="section.content"
        :show-debug="showDebug"
      />
    </template>

    <!-- No Sections State -->
    <div v-else-if="!loading && pageData && (!pageData.sections || pageData.sections.length === 0)" :class="bemm('no-sections')">
      <p>No sections found for "{{ pageSlug }}" page.</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!loading && error" :class="bemm('error')">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { useContent, type PageContent } from '@tiko/core';
import { useI18n } from '@tiko/ui';
import { ref, onMounted, watch, toRefs } from 'vue';
import SectionRenderer from './SectionRenderer.vue';

interface PageContentProps {
  pageSlug: string;
  showDebug?: boolean;
}

const props = withDefaults(defineProps<PageContentProps>(), {
  showDebug: false
});

const { pageSlug } = toRefs(props);

const bemm = useBemm('page-content');
const { locale } = useI18n();

const content = useContent({
  projectSlug: 'marketing',
  useWorker: import.meta.env.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env.VITE_DEPLOYED_VERSION_ID,
  noCache: true
});

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

    const page = await content.getPage(pageSlug.value, languageCode, false);

    if (page) {
      pageData.value = page;
      console.log(`[PageContent] Loaded "${pageSlug.value}" page:`, pageData.value);
    } else {
      error.value = `No content found for "${pageSlug.value}" page in ${languageCode}.`;
    }
  } catch (err) {
    console.error(`[PageContent] Failed to load ${pageSlug.value} page:`, err);
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

// Reload content when page slug changes
watch(pageSlug, () => {
  loadContent();
});
</script>

<style lang="scss">
.page-content {
  // Loading state
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
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

  &__error,
  &__no-sections {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    padding: var(--space-2xl);
    text-align: center;
  }

  &__error {
    color: var(--color-error);
  }

  &__no-sections {
    color: var(--color-foreground-secondary);
  }
}
</style>
