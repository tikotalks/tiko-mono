<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="error" :class="bemm('error')">
      <TEmptyState
        :icon="Icons.ALERT_CIRCLE"
        :title="t('errors.pageNotFound')"
        :description="error"
      />
    </div>

    <div v-else-if="pageContent" :class="bemm('content')">
      <TSectionRenderer
        v-for="(sectionData, index) in pageContent.sections"
        :key="`${sectionData.section.id}-${index}`"
        :section="sectionData.section"
        :content="sectionData.content"
        :show-debug="showDebug"
      />
    </div>

    <div v-else :class="bemm('no-content')">
      <TEmptyState
        :icon="Icons.FILE_OFF"
        :title="t('errors.noContent')"
        :description="t('errors.noContentDescription')"
      />
    </div>

    <!-- Debug info -->
    <div v-if="showDebug && pageContent" :class="bemm('debug')">
      <h3>Page Debug Info</h3>
      <pre>{{ JSON.stringify(pageContent.page, null, 2) }}</pre>
      <h4>Sections:</h4>
      <pre>{{ JSON.stringify(pageContent.sections.map(s => ({
        id: s.section.id,
        type: s.section.section_template_id,
        name: s.section.name
      })), null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useI18n } from '@tiko/core';
import { useContent } from '@tiko/core'
import type { PageContent } from '@tiko/core'
import TSectionRenderer from '../TSectionRenderer/TSectionRenderer.vue'
import TSpinner from '../../feedback/TSpinner/TSpinner.vue'
import TEmptyState from '../../feedback/TEmptyState/TEmptyState.vue'

// Props
interface Props {
  pageSlug: string
  showDebug?: boolean
  languageCode?: string
}

// Emits
const emit = defineEmits<{
  'page-not-found': []
  'page-loaded': [page: PageContent]
}>()

const props = withDefaults(defineProps<Props>(), {
  showDebug: false
})

const bemm = useBemm('t-page-content')
const { t, locale } = useI18n()

// Initialize content with options from environment
const content = useContent({
  useWorker: import.meta.env?.VITE_USE_CONTENT_WORKER === 'true',
  workerUrl: import.meta.env?.VITE_CONTENT_API_URL,
  deployedVersionId: import.meta.env?.VITE_DEPLOYED_VERSION_ID
})

// State
const loading = ref(true)
const error = ref<string | null>(null)
const pageContent = ref<PageContent | null>(null)

// Methods
const loadPageContent = async () => {
  loading.value = true
  error.value = null

  try {
    // Use provided language code or extract from locale
    const langCode = props.languageCode || locale.value.split('-')[0]

    const pageData = await content.getPage(props.pageSlug, langCode)

    if (!pageData || !pageData.page) {
      error.value = t('errors.pageNotFound')
      emit('page-not-found')
      return
    }

    pageContent.value = pageData
    emit('page-loaded', pageData)
  } catch (err) {
    console.error('Failed to load page content:', err)
    error.value = err instanceof Error ? err.message : t('errors.loadingFailed')
    emit('page-not-found')
  } finally {
    loading.value = false
  }
}

// Load content on mount and when slug changes
onMounted(() => {
  loadPageContent()
})

watch(() => props.pageSlug, () => {
  loadPageContent()
})

watch(() => locale.value, () => {
  loadPageContent()
})
</script>

<style lang="scss">
.t-page-content {
  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  &__error,
  &__no-content {
    padding: var(--space-2xl);
  }

  &__content {
    // Sections handle their own spacing
  }

  &__debug {
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space);
    margin: var(--space-xl) 0;
    font-family: monospace;
    font-size: var(--font-size-sm);

    h3, h4 {
      margin-top: var(--space);
      margin-bottom: var(--space-s);
    }

    pre {
      overflow-x: auto;
      white-space: pre-wrap;
    }
  }
}
</style>
