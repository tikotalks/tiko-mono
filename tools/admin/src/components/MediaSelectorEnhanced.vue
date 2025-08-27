<template>
  <div :class="bemm()">
    <!-- Header with Tabs -->
    <div :class="bemm('header')">
      <h2>{{ t('admin.media.selectMedia', 'Select Media') }}</h2>

      <!-- Source Tabs -->
      <div :class="bemm('tabs')">
        <button
          v-for="source in availableSources"
          :key="source.key"
          :class="[
            bemm('tab'),
            activeSource === source.key ? bemm('tab', 'active') : ''
          ]"
          @click="activeSource = source.key"
        >
          <TIcon :name="source.icon" size="small" />
          {{ source.label }}
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div :class="bemm('toolbar')">
      <div :class="bemm('toolbar-left')">
        <TInputText
          v-model="searchQuery"
          :placeholder="t('common.search')"
          :icon="Icons.SEARCH_M"
          @input="handleSearch"
        />

        <TInputSelect
          v-if="activeSource === 'public'"
          v-model="categoryFilter"
          :options="categoryOptions"
          :placeholder="t('admin.media.filterByCategory', 'Filter by category')"
          :clearable="true"
          @update:model-value="loadMedia"
        />

        <TInputSelect
          v-model="tagFilter"
          :options="tagOptions"
          :placeholder="t('admin.media.filterByTag', 'Filter by tag')"
          :clearable="true"
          @update:model-value="loadMedia"
        />
      </div>

      <div :class="bemm('toolbar-right')">
        <TInputSelect
          v-model="sortBy"
          :options="sortOptions"
          :placeholder="t('common.sortByLabel')"
          @update:model-value="loadMedia"
        />

        <TViewToggle
          v-model="viewMode"
          :tiles-label="t('common.tiles')"
          :list-label="t('common.list')"
        />
      </div>
    </div>

    <!-- Content -->
    <div :class="bemm('content')">
      <!-- Loading state -->
      <div v-if="loading" :class="bemm('loading')">
        <TSpinner size="large" />
      </div>

      <!-- Empty state -->
      <TEmptyState
        v-else-if="filteredMedia.length === 0"
        :icon="Icons.IMAGE"
        :title="getEmptyStateTitle()"
        :description="getEmptyStateDescription()"
      >
        <TButton
          v-if="searchQuery"
          type="outline"
          @click="clearSearch"
        >
          {{ t('common.clearSearch') }}
        </TButton>
      </TEmptyState>

      <!-- Grid view -->
      <TVirtualGrid
        v-else-if="viewMode === 'tiles'"
        :items="filteredMedia"
        :min-item-width="200"
        :gap="16"
        :aspect-ratio="'3:2'"
      >
        <template #default="{ item }">
          <div
            :class="[
              bemm('media-item'),
              isSelected(item) ? bemm('media-item', 'selected') : ''
            ]"
            @click="toggleSelection(item)"
          >
            <TMediaTile
              :media="{ ...item, original_url: getResolvedUrl(item) }"
              :get-image-variants="getImageVariantsForTile"
            />
            <div
              v-if="isSelected(item)"
              :class="bemm('selection-indicator')"
            >
              <TIcon :name="Icons.CHECK_M" />
            </div>
            <div :class="bemm('source-badge', activeSource)">
              {{ getSourceLabel(activeSource) }}
            </div>
          </div>
        </template>
      </TVirtualGrid>

      <!-- List view -->
      <TList
        v-else
        :columns="listColumns"
        :striped="true"
        :hover="true"
      >
        <TListItem
          v-for="item in filteredMedia"
          :key="item.id"
          :clickable="true"
          :selected="isSelected(item)"
          @click="toggleSelection(item)"
        >
          <TListCell
            type="image"
            :src="getImageVariantsForTile(getResolvedUrl(item)).thumbnail"
            :alt="item.title || item.filename"
          />
          <TListCell
            type="text"
            :content="item.title || item.filename"
          />
          <TListCell
            type="text"
            :content="item.filename"
          />
          <TListCell
            type="size"
            :bytes="item.file_size"
          />
          <TListCell
            type="text"
            :content="getSourceLabel(activeSource)"
            :class="bemm('source-cell', activeSource)"
          />
          <TListCell
            v-if="item.categories?.length"
            type="chips"
            :chips="item.categories"
            chip-color="secondary"
          />
          <TListCell
            v-else
            type="text"
            content="-"
          />
        </TListItem>
      </TList>
    </div>

    <!-- Footer -->
    <div :class="bemm('footer')">
      <div :class="bemm('selection-info')">
        <span v-if="selectedMediaWithSource.length > 0">
          {{ t('admin.media.selectedCount', `${selectedMediaWithSource.length} selected`) }}
        </span>
      </div>

      <div :class="bemm('actions')">
        <TButton
          type="ghost"
          @click="handleCancel"
        >
          {{ t('common.cancel') }}
        </TButton>

        <TButton
          color="primary"
          :disabled="selectedMediaWithSource.length === 0 || (!multiple && selectedMediaWithSource.length !== 1)"
          @click="handleConfirm"
        >
          {{ t('common.select') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBemm } from 'bemm'
import {
  TButton,
  TInputText,
  TInputSelect,
  TViewToggle,
  TList,
  TListItem,
  TListCell,
  TMediaTile,
  TEmptyState,
  TSpinner,
  TIcon,
  TVirtualGrid,
} from '@tiko/ui'
import { useI18n, useAuthStore, mediaSourceService, useImageResolver } from '@tiko/core'
import { Icons } from 'open-icon'
import type { MediaItem, MediaSourceType, MediaFieldValue } from '@tiko/core'
import { useImageUrl } from '@tiko/core'

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

interface MediaItemWithSource extends MediaItem {
  source: MediaSourceType
}

interface Props {
  multiple?: boolean
  selectedIds?: string[]
  allowedSources?: MediaSourceType[]
  onConfirm: (selectedItems: MediaFieldValue[]) => void
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  selectedIds: () => [],
  allowedSources: () => ['public', 'assets', 'personal']
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('media-selector-enhanced')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const { resolveImageUrl } = useImageResolver()
const authStore = useAuthStore()

// Source configuration
const allSources = [
  {
    key: 'public' as MediaSourceType,
    label: t('admin.media.sourcePublic', 'Public Library'),
    icon: Icons.ADD
  },
  {
    key: 'assets' as MediaSourceType,
    label: t('admin.media.sourceAssets', 'Assets'),
    icon: Icons.ADD
  },
  {
    key: 'personal' as MediaSourceType,
    label: t('admin.media.sourcePersonal', 'My Library'),
    icon: Icons.ADD
  }
]

// Filter sources based on allowed
const availableSources = computed(() =>
  allSources.filter(s => props.allowedSources.includes(s.key))
)

// State
const activeSource = ref<MediaSourceType>(availableSources.value[0]?.key || 'public')
const loading = ref(false)
const media = ref<MediaItem[]>([])
const selectedMediaWithSource = ref<MediaFieldValue[]>([])
const searchQuery = ref('')
const categoryFilter = ref<string>('')
const tagFilter = ref<string>('')
const sortBy = ref('upload_date_desc')
const viewMode = ref<'tiles' | 'list'>('tiles')

// Sort options
const sortOptions = [
  { value: 'upload_date_desc', label: t('admin.media.sort.newestFirst', 'Newest first') },
  { value: 'upload_date_asc', label: t('admin.media.sort.oldestFirst', 'Oldest first') },
  { value: 'filename_asc', label: t('admin.media.sort.filenameAZ', 'Filename A-Z') },
  { value: 'filename_desc', label: t('admin.media.sort.filenameZA', 'Filename Z-A') },
  { value: 'title_asc', label: t('admin.media.sort.titleAZ', 'Title A-Z') },
  { value: 'title_desc', label: t('admin.media.sort.titleZA', 'Title Z-A') },
  { value: 'file_size_asc', label: t('admin.media.sort.sizeSmallest', 'Size (smallest)') },
  { value: 'file_size_desc', label: t('admin.media.sort.sizeLargest', 'Size (largest)') },
]

// List columns - added source column
const listColumns = [
  { key: 'thumbnail', label: '', width: '60px' },
  { key: 'title', label: t('common.title'), width: '20%' },
  { key: 'filename', label: t('admin.media.filename', 'Filename'), width: '20%' },
  { key: 'size', label: t('admin.media.size', 'Size'), width: '100px' },
  { key: 'source', label: t('admin.media.source', 'Source'), width: '120px' },
  { key: 'categories', label: t('admin.media.categories', 'Categories'), width: '20%' },
]

// Get source label
function getSourceLabel(source: MediaSourceType): string {
  const sourceConfig = allSources.find(s => s.key === source)
  return sourceConfig?.label || source
}

// Empty state helpers
function getEmptyStateTitle() {
  if (searchQuery.value) {
    return t('admin.media.noSearchResults', 'No search results')
  }
  return t(`admin.media.noMedia.${activeSource.value}`, `No ${activeSource.value} media found`)
}

function getEmptyStateDescription() {
  if (searchQuery.value) {
    return t('admin.media.noSearchResultsDescription', 'Try adjusting your search or filters')
  }
  return t(`admin.media.noMediaDescription.${activeSource.value}`, 'Upload some media files to get started')
}

// Computed
const filteredMedia = computed(() => {
  let filtered = [...media.value]

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => {
      const searchableText = [
        item.title,
        item.filename,
        item.description,
        ...(item.tags || []),
        ...(item.categories || [])
      ].filter(Boolean).join(' ').toLowerCase()

      return searchableText.includes(query)
    })
  }

  // Apply category filter
  if (categoryFilter.value) {
    filtered = filtered.filter(item =>
      item.categories?.includes(categoryFilter.value)
    )
  }

  // Apply tag filter
  if (tagFilter.value) {
    filtered = filtered.filter(item =>
      item.tags?.includes(tagFilter.value)
    )
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'upload_date_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'upload_date_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'filename_asc':
        return (a.filename || '').localeCompare(b.filename || '')
      case 'filename_desc':
        return (b.filename || '').localeCompare(a.filename || '')
      case 'title_asc':
        return (a.title || a.filename || '').localeCompare(b.title || b.filename || '')
      case 'title_desc':
        return (b.title || b.filename || '').localeCompare(a.title || a.filename || '')
      case 'file_size_asc':
        return a.file_size - b.file_size
      case 'file_size_desc':
        return b.file_size - a.file_size
      default:
        return 0
    }
  })

  return filtered
})

// Category and tag options from loaded media
const categoryOptions = computed(() => {
  const categories = new Set<string>()
  media.value.forEach(item => {
    item.categories?.forEach(cat => categories.add(cat))
  })
  return Array.from(categories).map(cat => ({ value: cat, label: cat }))
})

const tagOptions = computed(() => {
  const tags = new Set<string>()
  media.value.forEach(item => {
    item.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).map(tag => ({ value: tag, label: tag }))
})

// Reactive state for resolved URLs
const resolvedUrls = ref<Record<string, string>>({})

// Image URL resolver that handles different sources synchronously
function getResolvedUrl(item: MediaItem): string {
  const key = `${item.id}-${activeSource.value}`
  return resolvedUrls.value[key] || item.original_url || ''
}

// Async function to resolve and cache URLs
async function resolveAndCacheUrl(item: MediaItem) {
  const key = `${item.id}-${activeSource.value}`

  // Skip if already resolved
  if (resolvedUrls.value[key]) return

  let resolvedUrl = ''

  // If the item has a full URL already, use it
  if (item.original_url?.startsWith('http://') || item.original_url?.startsWith('https://')) {
    resolvedUrl = item.original_url
  }
  // For assets source, we need to handle the ID
  else if (activeSource.value === 'assets' && item.id) {
    try {
      resolvedUrl = await resolveImageUrl(item.id, { media: 'assets' })
    } catch (error) {
      console.error(`Failed to resolve asset URL for ${item.id}:`, error)
      resolvedUrl = item.original_url || ''
    }
  }
  // For public media, construct the URL
  else if (activeSource.value === 'public') {
    // Check if it has a filename
    if (item.filename) {
      resolvedUrl = `https://media.tikocdn.org/${item.filename}`
    }
    // Fallback to using ID
    else {
      resolvedUrl = `https://media.tikocdn.org/${item.id}`
    }
  }
  // For personal media
  else if (activeSource.value === 'personal') {
    resolvedUrl = `https://user-media.tikocdn.org/${item.id}`
  }
  // Fallback
  else {
    resolvedUrl = item.original_url || ''
  }

  // Cache the resolved URL
  resolvedUrls.value[key] = resolvedUrl
}

// Enhanced getImageVariants function for TMediaTile
const getImageVariantsForTile = (url: string) => {
  // For assets that might be UUIDs, we need to resolve them first
  if (activeSource.value === 'assets' && !url.startsWith('http')) {
    // This is handled by the TMediaTile component itself
    return {
      thumbnail: url,
      medium: url,
      large: url,
      original: url
    }
  }

  // For already resolved URLs, use the getImageVariants utility
  return getImageVariants(url)
}

// Methods
async function loadMedia() {
  loading.value = true

  try {
    const userId = authStore.user?.id
    const loadedMedia = await mediaSourceService.loadMediaFromSource(
      activeSource.value,
      {
        userId,
        search: searchQuery.value || undefined
      }
    )

    media.value = loadedMedia

    // Resolve URLs for all loaded media
    await Promise.all(loadedMedia.map(item => resolveAndCacheUrl(item)))
  } catch (error) {
    console.error('Failed to load media:', error)
    media.value = []
  } finally {
    loading.value = false
  }
}

function isSelected(item: MediaItem): boolean {
  return selectedMediaWithSource.value.some(
    selected => selected.id === item.id && selected.source === activeSource.value
  )
}

function toggleSelection(item: MediaItem) {
  const mediaValue: MediaFieldValue = {
    id: item.id,
    source: activeSource.value,
    metadata: {
      alt: item.title || item.filename,
      caption: item.description
    }
  }

  const existingIndex = selectedMediaWithSource.value.findIndex(
    selected => selected.id === item.id && selected.source === activeSource.value
  )

  if (existingIndex >= 0) {
    // Deselect
    selectedMediaWithSource.value.splice(existingIndex, 1)
  } else if (props.multiple || selectedMediaWithSource.value.length === 0) {
    // Select
    if (!props.multiple) {
      selectedMediaWithSource.value = [mediaValue]
    } else {
      selectedMediaWithSource.value.push(mediaValue)
    }
  } else if (!props.multiple) {
    // Replace selection in single mode
    selectedMediaWithSource.value = [mediaValue]
  }
}

function clearSearch() {
  searchQuery.value = ''
  categoryFilter.value = ''
  tagFilter.value = ''
}

const handleSearch = debounce(loadMedia, 300)

function handleConfirm() {
  props.onConfirm(selectedMediaWithSource.value)
  emit('close')
}

function handleCancel() {
  props.onCancel?.()
  emit('close')
}

// Watch source changes
watch(activeSource, () => {
  // Clear resolved URLs when source changes
  resolvedUrls.value = {}
  loadMedia()
})

// Initialize
onMounted(() => {
  // Pre-select items if IDs provided
  if (props.selectedIds.length > 0) {
    // TODO: Load pre-selected items from their respective sources
  }

  loadMedia()
})
</script>

<style lang="scss">
.media-selector-enhanced {
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-height: 800px;
  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-accent);

    h2 {
      margin: 0 0 var(--space);
      font-size: var(--font-size-lg);
    }
  }

  &__tabs {
    display: flex;
    gap: var(--space-xs);
    border-bottom: 2px solid var(--color-accent);
    margin: 0 calc(-1 * var(--space-lg));
    padding: 0 var(--space-lg);
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-s) var(--space);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-foreground-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: -2px;

    &:hover {
      color: var(--color-foreground);
      background: var(--color-background-secondary);
    }

    &--active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      background: var(--color-primary-light);
    }
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    gap: var(--space);
    padding: var(--space);
    border-bottom: 1px solid var(--color-accent);

    &-left,
    &-right {
      display: flex;
      gap: var(--space);
      align-items: center;
    }
  }

  &__content {
    flex: 1;
    padding: var(--space);
    overflow: auto;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  &__media-item {
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    border-radius: var(--radius);
    overflow: hidden;

    &:hover {
      transform: scale(1.02);
    }

    &--selected {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px var(--color-primary-light);
    }
  }

  &__selection-indicator {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    width: 24px;
    height: 24px;
    background: var(--color-primary);
    color: var(--color-background);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__source-badge {
    position: absolute;
    bottom: var(--space-s);
    left: var(--space-s);
    padding: var(--space-xs) var(--space-s);
    background: var(--color-background);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    opacity: 0.9;

    &--public {
      background: var(--color-info);
      color: var(--color-info-contrast);
    }

    &--assets {
      background: var(--color-warning);
      color: var(--color-warning-contrast);
    }

    &--personal {
      background: var(--color-success);
      color: var(--color-success-contrast);
    }
  }

  &__source-cell {
    font-weight: 600;
    font-size: var(--font-size-sm);

    &--public {
      color: var(--color-info);
    }

    &--assets {
      color: var(--color-warning);
    }

    &--personal {
      color: var(--color-success);
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space);
    border-top: 1px solid var(--color-accent);
    background: var(--color-background-secondary);
  }

  &__selection-info {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-sm);
  }

  &__actions {
    display: flex;
    gap: var(--space);
  }
}
</style>
