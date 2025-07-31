<template>
  <div :class="bemm()">
    <!-- Loading State -->
    <div v-if="loading" :class="bemm('loading')">
      <div :class="bemm('loading-spinner')"></div>
    </div>

    {{ pageData }}
    <!-- Dynamic Sections -->
    <template v-if="!loading && pageData?.sections?.length">
      <SectionRenderer
        v-for="section in pageData.sections"
        :key="section.section.id"
        :section="section.section"
      />
    </template>

    <!-- Error State -->
    <div v-else-if="!loading && error" :class="bemm('error')">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useContent, type PageContent } from '@tiko/core'
import { ref, onMounted } from 'vue'
import SectionRenderer from '../components/SectionRenderer.vue'

const bemm = useBemm('home-view')
const content = useContent({ projectSlug: 'marketing' })

// Page content
const pageData = ref<PageContent | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Load content on mount
onMounted(async () => {
  try {
    loading.value = true
    console.log('Loading page content for marketing project...')

    // Try to get the home page
    const page = await content.getPage('home')
    console.log('Page response:', page)

    if (page) {
      pageData.value = page
      console.log('Page data loaded:', pageData.value)
    } else {
      // Try to list all pages to see what's available
      const allPages = await content.getPages()
      console.log('Available pages:', allPages)
      error.value = 'No content found for "home" page. Available pages logged to console.'
    }
  } catch (err) {
    console.error('Failed to load page content:', err)
    error.value = `Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}`
  } finally {
    loading.value = false
  }
})
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
