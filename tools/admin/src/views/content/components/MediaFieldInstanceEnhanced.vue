<template>
  <div :class="bemm()">
    <label :class="bemm('label')">{{ label }}</label>

    <!-- Single media selection -->
    <div v-if="!multiple" :class="bemm('single')">
      <div v-if="selectedMedia" :class="bemm('preview')">
        <img
          :src="getPreviewUrl(selectedMedia)"
          :alt="selectedMedia.metadata?.alt || getMediaTitle(selectedMedia)"
          :class="bemm('preview-image')"
        />
        <div :class="bemm('preview-info')">
          <span :class="bemm('preview-title')">
            {{ getMediaTitle(selectedMedia) }}
          </span>
          <span :class="bemm('preview-source', selectedMedia.source)">
            {{ getSourceLabel(selectedMedia.source) }}
          </span>
          <div :class="bemm('preview-actions')">
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.EDIT_M"
              @click="selectMedia"
            />
            <TButton
              type="ghost"
              size="small"
              :icon="Icons.MULTIPLY_M"
              color="error"
              @click="removeMedia()"
            />
          </div>
        </div>
      </div>
      <TButton
        v-else
        type="outline"
        :icon="Icons.IMAGE"
        @click="selectMedia"
      >
        {{ t('admin.media.selectMedia', 'Select Media') }}
      </TButton>
    </div>

    <!-- Multiple media selection -->
    <div v-else :class="bemm('multiple')">
      <div
        v-if="selectedMediaList.length > 0"
        :class="bemm('media-list')"
      >
        <div
          v-for="(item, index) in selectedMediaList"
          :key="`${item.source}-${item.id}`"
          :class="bemm('list-item')"
        >
          <img
            :src="getPreviewUrl(item)"
            :alt="item.metadata?.alt || getMediaTitle(item)"
            :class="bemm('list-item-image')"
          />
          <div :class="bemm('list-item-info')">
            <span :class="bemm('list-item-title')">
              {{ getMediaTitle(item) }}
            </span>
            <span :class="bemm('list-item-source', item.source)">
              {{ getSourceLabel(item.source) }}
            </span>
          </div>
          <TButton
            type="ghost"
            size="small"
            :icon="Icons.MULTIPLY_M"
            color="error"
            @click="removeMedia(index)"
          />
        </div>
      </div>

      <TButton
        type="outline"
        :icon="Icons.ADD_M"
        @click="selectMedia"
        :disabled="maxItems > 0 && selectedMediaList.length >= maxItems"
      >
        {{ t('admin.media.addMedia', 'Add Media') }}
      </TButton>

      <p v-if="maxItems > 0" :class="bemm('help-text')">
        {{ t('admin.media.maxItemsHelp', `${selectedMediaList.length} of ${maxItems} items selected`, { max: maxItems, current: selectedMediaList.length }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { Icons } from 'open-icon'
import { type MediaItem, type MediaFieldValue, type MediaSourceType, useI18n, useImageUrl, useImageResolver, mediaSourceService } from '@tiko/core'
import { useMediaSelector } from '../../../composables/useMediaSelector'
import { normalizeMediaValue } from '../../../types/media-field'

interface Props {
  modelValue: any // Can be string, array, or MediaFieldValue format
  label: string
  multiple?: boolean
  required?: boolean
  maxItems?: number
  allowedSources?: MediaSourceType[] // Restrict which sources can be selected
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  required: false,
  maxItems: 0,
  allowedSources: () => ['public', 'assets', 'personal']
})

const emit = defineEmits<{
  'update:modelValue': [value: MediaFieldValue | MediaFieldValue[] | null]
}>()

const bemm = useBemm('media-field-enhanced')
const { t } = useI18n()
const { getImageUrl } = useImageUrl()
const { resolveImageUrl } = useImageResolver()
const { openMediaSelector } = useMediaSelector()

// Helper to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// State for storing enhanced media objects
const selectedMedia = ref<MediaFieldValue | null>(null)
const selectedMediaList = ref<MediaFieldValue[]>([])

// Map to store loaded MediaItem objects by source and ID
const mediaItemsMap = ref<Map<string, MediaItem>>(new Map())

// Map to store resolved image URLs
const resolvedImageUrls = ref<Map<string, string>>(new Map())

// Load initial data on mount
onMounted(async () => {
  // Process modelValue if present
  if (props.modelValue) {
    await processModelValue(props.modelValue)
  }
})

// Function to get source label
function getSourceLabel(source: MediaSourceType): string {
  const labels: Record<MediaSourceType, string> = {
    public: t('admin.media.sourcePublic', 'Public Library'),
    assets: t('admin.media.sourceAssets', 'Assets'),
    personal: t('admin.media.sourcePersonal', 'My Library'),
    url: t('admin.media.sourceUrl', 'External URL')
  }
  return labels[source] || source
}

// Function to get media title
function getMediaTitle(media: MediaFieldValue): string {
  if (media.metadata?.alt) return media.metadata.alt

  // Try to get title from loaded MediaItem
  const cacheKey = `${media.source}-${media.id}`
  const mediaItem = mediaItemsMap.value.get(cacheKey)
  if (mediaItem) {
    return mediaItem.title || mediaItem.filename || media.id
  }

  return media.id
}

// Function to get preview URL (synchronous - returns cached or placeholder)
function getPreviewUrl(media: MediaFieldValue): string {
  const cacheKey = `${media.source}-${media.id}`

  // Return cached resolved URL if available
  if (resolvedImageUrls.value.has(cacheKey)) {
    return resolvedImageUrls.value.get(cacheKey)!
  }

  // If external URL, return it directly
  if (media.source === 'url' && media.url) {
    return media.url
  }

  // Try to get URL from loaded MediaItem
  const mediaItem = mediaItemsMap.value.get(cacheKey)
  if (mediaItem?.original_url) {
    // Handle assets with UUID resolution
    if (media.source === 'assets' && isValidUUID(mediaItem.original_url)) {
      // Resolve async and cache
      resolveImageAsync(mediaItem.original_url, cacheKey)
      return '/assets/placeholder.png' // Temporary placeholder
    }
    // Handle other sources with regular image URL
    const url = getImageUrl(mediaItem.original_url, { width: 200, height: 200 })
    resolvedImageUrls.value.set(cacheKey, url)
    return url
  }

  // For assets, try to resolve the ID directly if it's a UUID
  if (media.source === 'assets' && isValidUUID(media.id)) {
    resolveImageAsync(media.id, cacheKey)
    return '/assets/placeholder.png' // Temporary placeholder
  }

  // Fallback to URL if provided
  return media.url || '/assets/placeholder.png'
}

// Async function to resolve and cache image URLs
async function resolveImageAsync(uuid: string, cacheKey: string) {
  try {
    const url = await resolveImageUrl(uuid, { media: 'assets' })
    resolvedImageUrls.value.set(cacheKey, url)
  } catch (error) {
    console.error('Failed to resolve image:', error)
    resolvedImageUrls.value.set(cacheKey, '/assets/placeholder.png')
  }
}

// Function to process model value
async function processModelValue(newValue: any) {
  const normalized = normalizeMediaValue(newValue)

  if (props.multiple) {
    if (Array.isArray(normalized)) {
      selectedMediaList.value = normalized
      // Load media items for each
      for (const item of normalized) {
        await loadMediaItem(item)
      }
    } else {
      selectedMediaList.value = []
    }
  } else {
    if (normalized && !Array.isArray(normalized)) {
      selectedMedia.value = normalized
      await loadMediaItem(normalized)
    } else {
      selectedMedia.value = null
    }
  }
}

// Function to load a media item
async function loadMediaItem(mediaValue: MediaFieldValue) {
  const cacheKey = `${mediaValue.source}-${mediaValue.id}`

  // Skip if already loaded
  if (mediaItemsMap.value.has(cacheKey)) {
    return
  }

  try {
    const mediaItem = await mediaSourceService.getMediaBySource(mediaValue)
    if (mediaItem) {
      mediaItemsMap.value.set(cacheKey, mediaItem)

      // For assets, trigger image URL resolution
      if (mediaValue.source === 'assets' && mediaItem.original_url && isValidUUID(mediaItem.original_url)) {
        resolveImageAsync(mediaItem.original_url, cacheKey)
      } else if (mediaItem.original_url) {
        // Cache regular image URLs
        const url = getImageUrl(mediaItem.original_url, { width: 200, height: 200 })
        resolvedImageUrls.value.set(cacheKey, url)
      }
    }
  } catch (error) {
    console.error('Failed to load media item:', error)
  }
}

// Initialize from modelValue
watch(() => props.modelValue, async (newValue) => {
  await processModelValue(newValue)
}, { immediate: true })

// Methods
async function selectMedia() {
  const currentIds = props.multiple
    ? selectedMediaList.value.map(m => m.id)
    : selectedMedia.value ? [selectedMedia.value.id] : []

  const selected = await openMediaSelector({
    multiple: props.multiple,
    selectedIds: currentIds,
    enhanced: true,
    allowedSources: props.allowedSources
  }) as MediaFieldValue[]

  if (selected.length > 0) {
    if (props.multiple) {
      // Add to existing selection
      const newItems = selected.filter(item =>
        !selectedMediaList.value.some(existing =>
          existing.id === item.id && existing.source === item.source
        )
      )

      selectedMediaList.value = [...selectedMediaList.value, ...newItems]
      emitUpdate()
    } else {
      // Replace single selection
      selectedMedia.value = selected[0]
      emit('update:modelValue', selectedMedia.value)
    }
  }
}

function removeMedia(index?: number) {
  if (props.multiple && index !== undefined) {
    selectedMediaList.value.splice(index, 1)
    emitUpdate()
  } else {
    selectedMedia.value = null
    emit('update:modelValue', null)
  }
}

function emitUpdate() {
  // Emit the full MediaFieldValue objects
  emit('update:modelValue', selectedMediaList.value)
}
</script>

<style lang="scss">
.media-field-enhanced {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__single {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__preview {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    background: var(--color-secondary);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
  }

  &__preview-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--border-radius);
    background-image:
      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  &__preview-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__preview-title {
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__preview-source {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);

    &--public {
      color: var(--color-info);
    }

    &--assets {
      color: var(--color-warning);
    }

    &--personal {
      color: var(--color-success);
    }

    &--url {
      color: var(--color-foreground-secondary);
    }
  }

  &__preview-actions {
    display: flex;
    gap: var(--space-xs);
    margin-left: auto;
  }

  &__multiple {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__media-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__list-item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space-s);
    background: var(--color-secondary);
    border: 1px solid var(--color-accent);
    border-radius:  var(--border-radius);
  }

  &__list-item-image {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: var(--border-radius);
    background-image:
      linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  &__list-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__list-item-title {
    font-size: var(--font-size-sm);
    color: var(--color-foreground);
  }

  &__list-item-source {
    font-size: var(--font-size-xs);
    color: var(--color-foreground-secondary);

    &--public {
      color: var(--color-info);
    }

    &--assets {
      color: var(--color-warning);
    }

    &--personal {
      color: var(--color-success);
    }

    &--url {
      color: var(--color-foreground-secondary);
    }
  }

  &__help-text {
    font-size: var(--font-size-sm);
    color: var(--color-foreground-secondary);
    margin: 0;
  }
}
</style>
