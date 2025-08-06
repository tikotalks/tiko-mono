<template>
  <div :class="bemm()">
    <!-- Transition wrapper for smooth content changes -->
    <Transition name="page-fade" mode="out-in">
      <!-- Loading State with Skeleton -->
      <div v-if="loading" :class="bemm('loading')" key="loading">
        <div :class="bemm('skeleton')">
          <div :class="bemm('skeleton-header')"></div>
          <div :class="bemm('skeleton-content')">
            <div :class="bemm('skeleton-line')"></div>
            <div :class="bemm('skeleton-line', 'short')"></div>
            <div :class="bemm('skeleton-line')"></div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="pageData?.sections?.length" key="content">
        <template v-for="section in pageData.sections" :key="section.section.id">
          <SectionRenderer
            :section="section.section"
            :content="section.content"
            :show-debug="showDebug"
          />
        </template>
      </div>

      <!-- No Sections State -->
      <div v-else-if="pageData && (!pageData.sections || pageData.sections.length === 0)" :class="bemm('no-sections')" key="no-sections">
        <p>No sections found for "{{ pageSlug }}" page.</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="bemm('error')" key="error">
        <p>{{ error }}</p>
      </div>
    </Transition>
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
  noCache: false
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
    min-height: 50vh;
    padding: var(--space-2xl);
  }

  // Skeleton loader
  &__skeleton {
    max-width: 1200px;
    margin: 0 auto;
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__skeleton-header {
    height: 120px;
    background: linear-gradient(90deg, 
      var(--color-background-secondary) 0%, 
      var(--color-background) 50%, 
      var(--color-background-secondary) 100%);
    border-radius: var(--border-radius);
    margin-bottom: var(--space-xl);
  }

  &__skeleton-content {
    padding: var(--space-xl);
  }

  &__skeleton-line {
    height: 20px;
    background: linear-gradient(90deg, 
      var(--color-background-secondary) 0%, 
      var(--color-background) 50%, 
      var(--color-background-secondary) 100%);
    border-radius: var(--border-radius);
    margin-bottom: var(--space);
    
    &--short {
      width: 60%;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
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

// Smooth page transitions
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.page-fade-enter-to,
.page-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
