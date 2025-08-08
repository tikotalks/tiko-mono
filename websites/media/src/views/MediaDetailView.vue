<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TSpinner />
    </div>
    
    <div v-else-if="!media" :class="bemm('not-found')">
      <TEmptyState
        :icon="Icons.IMAGE"
        :title="t('media.detail.notFound')"
        :description="t('media.detail.notFoundDescription')"
      >
        <TButton @click="router.push('/library')">
          {{ t('media.detail.backToLibrary') }}
        </TButton>
      </TEmptyState>
    </div>
    
    <div v-else :class="bemm('content')">
      <!-- Breadcrumb -->
      <nav :class="bemm('breadcrumb')">
        <router-link to="/library">{{ t('media.library.title') }}</router-link>
        <span>/</span>
        <span>{{ media.title || media.original_filename }}</span>
      </nav>
      
      <!-- Main Content -->
      <div :class="bemm('main')">
        <!-- Image Preview -->
        <div :class="bemm('preview')">
          <img 
            :src="getImageVariants(media.original_url).large" 
            :alt="media.original_filename"
            :class="bemm('image')"
          />
        </div>
        
        <!-- Info Panel -->
        <div :class="bemm('info')">
          <h1 :class="bemm('title')">{{ media.title || media.original_filename }}</h1>
          
          <div v-if="media.description" :class="bemm('description')">
            {{ media.description }}
          </div>
          
          <!-- Metadata -->
          <div :class="bemm('metadata')">
            <TKeyValue :items="metadataItems" />
          </div>
          
          <!-- Tags -->
          <div v-if="media.tags?.length" :class="bemm('tags')">
            <h3>{{ t('media.detail.tags') }}</h3>
            <TChipGroup>
              <TChip v-for="tag in media.tags" :key="tag">
                {{ tag }}
              </TChip>
            </TChipGroup>
          </div>
          
          <!-- Categories -->
          <div v-if="media.categories?.length" :class="bemm('categories')">
            <h3>{{ t('media.detail.categories') }}</h3>
            <TChipGroup>
              <TChip v-for="category in media.categories" :key="category" color="secondary">
                {{ category }}
              </TChip>
            </TChipGroup>
          </div>
          
          <!-- Download Options -->
          <div :class="bemm('downloads')">
            <h3>{{ t('media.detail.downloadOptions') }}</h3>
            <div :class="bemm('download-grid')">
              <TButton
                v-for="format in downloadFormats"
                :key="format.key"
                type="outline"
                :icon="Icons.DOWNLOAD"
                @click="downloadImage(format)"
                :class="bemm('download-button')"
              >
                <div :class="bemm('download-info')">
                  <span :class="bemm('download-label')">{{ format.label }}</span>
                  <span :class="bemm('download-size')">{{ format.dimensions }}</span>
                </div>
              </TButton>
            </div>
            
            <!-- Original Download -->
            <TButton
              color="primary"
              :icon="Icons.DOWNLOAD"
              @click="downloadOriginal"
              :class="bemm('download-original')"
              size="large"
            >
              {{ t('media.detail.downloadOriginal') }}
              <span :class="bemm('file-size')">{{ formatFileSize(media.file_size) }}</span>
            </TButton>
          </div>
          
          <!-- Share Options -->
          <div :class="bemm('share')">
            <h3>{{ t('media.detail.share') }}</h3>
            <div :class="bemm('share-buttons')">
              <TButton
                type="ghost"
                :icon="Icons.LINK"
                @click="copyLink"
                size="small"
              >
                {{ t('media.detail.copyLink') }}
              </TButton>
              <TButton
                type="ghost"
                :icon="Icons.CODE_BRACKETS"
                @click="copyEmbed"
                size="small"
              >
                {{ t('media.detail.copyEmbed') }}
              </TButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useImageUrl, mediaService } from '@tiko/core'
import type { MediaItem, ToastService } from '@tiko/ui'
import {
  useI18n,
  TButton,
  TSpinner,
  TEmptyState,
  TKeyValue,
  TChip,
  TChipGroup
} from '@tiko/ui'

const bemm = useBemm('media-detail-view')
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { getImageVariants } = useImageUrl()
const toastService = inject<ToastService>('toastService')

// State
const loading = ref(true)
const media = ref<MediaItem | null>(null)

// Download formats
const downloadFormats = computed(() => [
  { key: 'thumbnail', label: 'Thumbnail', dimensions: '200x200' },
  { key: 'small', label: 'Small', dimensions: '400x400' },
  { key: 'medium', label: 'Medium', dimensions: '800x800' },
  { key: 'large', label: 'Large', dimensions: '1600x1600' }
])

// Metadata items
const metadataItems = computed(() => {
  if (!media.value) return []
  
  return [
    { key: t('media.detail.filename'), value: media.value.original_filename },
    { key: t('media.detail.fileSize'), value: formatFileSize(media.value.file_size) },
    { key: t('media.detail.uploadDate'), value: formatDate(media.value.created_at) },
    { key: t('media.detail.dimensions'), value: `${media.value.width || 'N/A'} × ${media.value.height || 'N/A'}` },
    { key: t('media.detail.format'), value: media.value.mime_type || 'N/A' }
  ]
})

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

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
    message: t('media.detail.downloadStarted', { format: format.label }),
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
    message: t('media.detail.downloadStarted', { format: 'Original' }),
    type: 'success'
  })
}

// Copy link to clipboard
async function copyLink() {
  const url = window.location.href
  await navigator.clipboard.writeText(url)
  
  toastService?.show({
    message: t('media.detail.linkCopied'),
    type: 'success'
  })
}

// Copy embed code to clipboard
async function copyEmbed() {
  if (!media.value) return
  
  const embedCode = `<img src="${media.value.original_url}" alt="${media.value.title || media.value.original_filename}" />`
  await navigator.clipboard.writeText(embedCode)
  
  toastService?.show({
    message: t('media.detail.embedCopied'),
    type: 'success'
  })
}

// Load media details
async function loadMedia() {
  loading.value = true
  
  try {
    const mediaId = route.params.id as string
    const result = await mediaService.getMediaItem(mediaId)
    media.value = result
  } catch (error) {
    console.error('[MediaDetail] Failed to load media:', error)
    media.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMedia()
})
</script>

<style lang="scss">
.media-detail-view {
  padding: var(--space-lg);
  max-width: var(--max-width);
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
  
  &__preview {
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    
    // Checkerboard pattern for transparent images
    --dot-color: color-mix(in srgb, var(--color-foreground), transparent 95%);
    background-image:
      linear-gradient(45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(-45deg, var(--dot-color) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--dot-color) 75%),
      linear-gradient(-45deg, transparent 75%, var(--dot-color) 75%);
    background-size: 30px 30px;
    background-position: 0 0, 0 15px, 15px -15px, -15px 0px;
  }
  
  &__image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }
  
  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
  
  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin: 0;
  }
  
  &__description {
    color: var(--color-foreground-secondary);
  }
  
  &__metadata {
    background: var(--color-background-secondary);
    padding: var(--space);
    border-radius: var(--border-radius);
  }
  
  &__tags,
  &__categories,
  &__downloads,
  &__share {
    h3 {
      font-size: var(--font-size);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--space-s) 0;
    }
  }
  
  &__download-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-s);
    margin-bottom: var(--space);
  }
  
  &__download-button {
    width: 100%;
    justify-content: flex-start;
  }
  
  &__download-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  &__download-label {
    font-weight: var(--font-weight-medium);
  }
  
  &__download-size {
    font-size: var(--font-size-s);
    color: var(--color-foreground-secondary);
  }
  
  &__download-original {
    width: 100%;
  }
  
  &__file-size {
    font-size: var(--font-size-s);
    color: var(--color-primary-text);
    opacity: 0.8;
  }
  
  &__share-buttons {
    display: flex;
    gap: var(--space-s);
  }
}
</style>