<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>

    <div v-else-if="!media" :class="bemm('not-found')">
      <TEmptyState
        :icon="Icons.IMAGE"
        :title="t('media.detail.notFound', 'Media not found')"
        :description="t('media.detail.notFoundDescription', 'We couldn\'t find this media item, maybe go back and try again?')"
      >
        <TButton @click="router.push('/library')">
          {{ t('media.detail.backToLibrary', 'Back to Library') }}
        </TButton>
      </TEmptyState>
    </div>

    <div v-else :class="bemm('content')">
      <!-- Breadcrumb -->
      <nav :class="bemm('breadcrumb')">
        <router-link to="/library">{{ t('media.library.title', 'Library') }}</router-link>
        <span>/</span>
        <span>{{ media.title || media.original_filename }}</span>
      </nav>

      <!-- Main Content -->
      <div :class="bemm('main')">
        <!-- Image Preview -->
        <MediaPreview
          :image-url="getImageVariants(media.original_url).large"
          :alt="media.original_filename"
        />

        <!-- Info Panel -->
        <MediaInfo
          :media="media"
          @filter-by-tag="(tag) => navigateToLibraryWithFilter('tag', tag)"
          @filter-by-category="(category) => navigateToLibraryWithFilter('category', category)"
          @download="downloadImage"
          @download-original="downloadOriginal"
          @copy-link="copyLink"
          @copy-embed="copyEmbed"
        />
      </div>

      <!-- Related Items -->
      <MediaRelated
        :current-media="media"
        :all-media="imageList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImageUrl, useImages, mediaService, useI18n } from '@tiko/core'
import type { MediaItem, ToastService } from '@tiko/ui'
import {
  TButton,
  TSpinner,
  TEmptyState
} from '@tiko/ui'
import MediaPreview from '../components/MediaPreview.vue'
import MediaInfo from '../components/MediaInfo.vue'
import MediaRelated from '../components/MediaRelated.vue'

const bemm = useBemm('media-detail-view')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { getImageVariants } = useImageUrl()
const { imageList, loadImages: loadAllImages } = useImages(true) // Use public mode
const toastService = inject<ToastService>('toastService')

// State
const loading = ref(true)
const media = ref<MediaItem | null>(null)

// Download image in specific format
async function downloadImage(format: { key: string; label: string }) {
  if (!media.value) return

  const variants = getImageVariants(media.value.original_url)
  const url = variants[format.key as keyof typeof variants]

  // Create temporary link and trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = `${media.value.title || media.value.original_filename}_${format.key}`
  link.click()

  toastService?.show({
    message: t('media.detail.downloadStarted', `Download started: ${format.label}`, { format: format.label }),
    type: 'success'
  })
}

// Download original image
async function downloadOriginal() {
  if (!media.value) return

  const link = document.createElement('a')
  link.href = media.value.original_url
  link.download = media.value.original_filename
  link.click()

  toastService?.show({
    message: t('media.detail.downloadStarted', 'Download started: Original', { format: 'Original' }),
    type: 'success'
  })
}

// Copy link to clipboard
async function copyLink() {
  const url = window.location.href
  await navigator.clipboard.writeText(url)

  toastService?.show({
    message: t('media.detail.linkCopied', 'Link copied to clipboard'),
    type: 'success'
  })
}

// Copy embed code to clipboard
async function copyEmbed() {
  if (!media.value) return

  const embedCode = `<img src="${media.value.original_url}" alt="${media.value.title || media.value.original_filename}" />`
  await navigator.clipboard.writeText(embedCode)

  toastService?.show({
    message: t('media.detail.embedCopied', 'Embed code copied to clipboard'),
    type: 'success'
  })
}

// Navigate to library with filter
function navigateToLibraryWithFilter(type: 'category' | 'tag', value: string) {
  router.push({
    path: '/library',
    query: {
      [type]: value
    }
  })
}

// Load media details
async function loadMedia() {
  loading.value = true

  try {
    const mediaId = route.params.id as string
    const result = await mediaService.getMediaById(mediaId)
    media.value = result
    
    // Load all images for related items
    if (result) {
      await loadAllImages()
    }
  } catch (error) {
    console.error('[MediaDetail] Failed to load media:', error)
    media.value = null
  } finally {
    loading.value = false
  }
}

// Watch for route changes to reload media when navigating between detail pages
watch(() => route.params.id, (newId) => {
  if (newId) {
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
    loadMedia()
  }
})

onMounted(() => {
  loadMedia()
})
</script>

<style lang="scss">
.media-detail-view {
  padding: var(--spacing);
  margin: 0 auto;

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-2xl);
  }

  &__not-found {
    padding: var(--space-2xl);
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin-bottom: var(--space-lg);
    color: var(--color-foreground-secondary);

    a {
      color: var(--color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__main {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: var(--space-xl);

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
