<template>
  <div :class="bemm()">
    <!-- Header -->
    <div :class="bemm('header')">
      <p>
        {{
          multiple
            ? t('admin.media.selectMultipleDescription', 'Select one or more media items')
            : t('admin.media.selectSingleDescription', 'Select a media item')
        }}
      </p>
    </div>

    <!-- Toolbar -->
    <div :class="bemm('toolbar')">
      <div :class="bemm('toolbar-column', ['', 'left'])">

        <TInputText v-model="searchQuery" :placeholder="t('common.search')" :icon="Icons.SEARCH_M"
          @input="handleSearch" />

        <TButton :class="bemm('action', ['', 'show-filter-toggle'])" :icon="Icons.CHEVRON_DOWN" :type="'icon-only'"
          @click="showFilters = !showFilters" />
      </div>

      <div :class="bemm('toolbar-column', ['', 'middle',showFilters ? 'show' : 'hide'])" >
        <TInputSelect v-if="libraryType === ImageLibraryType.PUBLIC" v-model="categoryFilter" :options="categoryOptions"
          :placeholder="t('admin.media.filterByCategory', 'Filter by category')" :clearable="true" allow-empty
          @update:model-value="loadMedia" />

        <TInputSelect v-model="tagFilter" :options="tagOptions"
          :placeholder="t('admin.media.filterByTag', 'Filter by tag')" :clearable="true" allow-empty
          @update:model-value="loadMedia" />
      </div>

      <div :class="bemm('toolbar-column', ['', 'right',showFilters ? 'show' : 'hide'])" v-if="showFilters">

        <!-- Library switcher -->
        <TInputSelect v-model="libraryType" :options="libraryOptions" :clearable="false"
          @update:model-value="loadMedia" />

        <TInputSelect v-model="sortBy" :options="sortOptions" :placeholder="t('common.sortByLabel')"
          @update:model-value="loadMedia" />

        <TViewToggle v-model="viewMode" :tiles-label="t('common.tiles')" :list-label="t('common.list')"/>
      </div>
    </div>

    <!-- Content -->
    <div :class="bemm('content')">
      <!-- Loading state -->
      <div v-if="loading" :class="bemm('loading')">
        <TSpinner size="large" />
      </div>

      <!-- Empty state -->
      <TEmptyState v-else-if="filteredMedia.length === 0" :icon="Icons.IMAGE_M"
        :title="searchQuery ? t('admin.media.noSearchResults', 'No search results') : t('admin.media.noMedia', 'No media found')"
        :description="searchQuery
          ? t('admin.media.noSearchResultsDescription', 'Try adjusting your search or filters')
          : t('admin.media.noMediaDescription', 'Upload some media files to get started')
          ">
        <TButton v-if="searchQuery" type="outline" @click="clearSearch">
          {{ t('common.clearSearch') }}
        </TButton>
      </TEmptyState>

      <!-- Grid view -->
      <TVirtualGrid v-else-if="viewMode === 'tiles'" :items="filteredMedia" :min-item-width="200" :gap="16"
        :aspect-ratio="'3:2'">
        <template #default="{ item }">
          <div :class="[
            bemm('media-item'),
            { [bemm('media-item', 'selected')]: isSelected(item) }
          ]" @click="toggleSelection(item)">
            <TMediaTile :media="item" :get-image-variants="getImageVariants" />
            <div v-if="isSelected(item)" :class="bemm('selection-indicator')">
              <TIcon :name="Icons.CHECK_M" />
            </div>
          </div>
        </template>
      </TVirtualGrid>

      <!-- List view -->
      <TList v-else :columns="listColumns" :striped="true" :hover="true">
        <TListItem v-for="item in filteredMedia" :key="item.id" :clickable="true" :selected="isSelected(item)"
          @click="toggleSelection(item)">
          <TListCell type="image" :src="getImageVariants(item.original_url).thumbnail"
            :alt="item.title || item.filename" />
          <TListCell type="text" :content="item.title || item.filename" />
          <TListCell type="text" :content="item.filename" />
          <TListCell type="size" :bytes="item.file_size" />
          <TListCell v-if="item.categories?.length" type="chips" :chips="item.categories" chip-color="secondary" />
          <TListCell v-else type="text" content="-" />
          <TListCell v-if="item.tags?.length" type="chips" :chips="item.tags" />
          <TListCell v-else type="text" content="-" />
        </TListItem>
      </TList>
    </div>

    <!-- Footer -->
    <div :class="bemm('footer')">
      <div :class="bemm('selection-info')">
        <span v-if="selectedMedia.length > 0">
          {{ t('admin.media.selectedCount', `${selectedMedia.length} selected`, { count: selectedMedia.length }) }}
        </span>
      </div>

      <div :class="bemm('actions')">
        <TButton type="ghost" @click="handleCancel">
          {{ t('common.cancel') }}
        </TButton>

        <TButton color="primary" :disabled="selectedMedia.length === 0 || (!multiple && selectedMedia.length !== 1)"
          @click="handleConfirm">
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
  debounce,
} from '@tiko/ui'
import { useI18n } from "@tiko/core";
import { Icons } from 'open-icon'
import { useAuthStore, useImageUrl, ImageLibraryType, useImages, type MediaItem, type UserMedia } from '@tiko/core'


interface Props {
  multiple?: boolean
  selectedIds?: string[]
  onConfirm: (selectedItems: MediaItem[]) => void
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  selectedIds: () => [],
})

const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('t-media-selector')
const { t } = useI18n()
const { getImageVariants } = useImageUrl()
const authStore = useAuthStore()

// State
const selectedMedia = ref<(MediaItem | UserMedia)[]>([])
const searchQuery = ref('')
const categoryFilter = ref<string>('')
const tagFilter = ref<string>('')
const sortBy = ref('upload_date_desc')
const viewMode = ref<'tiles' | 'list'>('tiles')
const libraryType = ref<string>(ImageLibraryType.PUBLIC)

const showFilters = ref(false);

// Use the cached images composable
const publicImages = useImages({ libraryType: ImageLibraryType.PUBLIC })
const userImages = useImages({ libraryType: ImageLibraryType.USER })

// Computed to get current library
const currentLibrary = computed(() => {
  return libraryType.value === ImageLibraryType.USER ? userImages : publicImages
})

// Loading state from current library
const loading = computed(() => currentLibrary.value.loading.value)

// Media items from current library
const media = computed(() => currentLibrary.value.imageList.value)

// Library options
const libraryOptions = [
  { value: ImageLibraryType.PUBLIC, label: t('admin.media.tikoLibrary', 'Tiko Library') },
  { value: ImageLibraryType.USER, label: t('admin.media.myLibrary', 'My Library') },
]

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

// List columns
const listColumns = [
  { key: 'thumbnail', label: '', width: '60px' },
  { key: 'title', label: t('common.title'), width: '25%' },
  { key: 'filename', label: t('admin.media.filename', 'Filename'), width: '25%' },
  { key: 'size', label: t('admin.media.size', 'Size'), width: '100px' },
  { key: 'categories', label: t('admin.media.categories', 'Categories'), width: '20%' },
  { key: 'tags', label: t('admin.media.tags', 'Tags'), width: '20%' },
]

// Computed
const filteredMedia = computed(() => {
  let filtered = [...media.value]

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => {
      // Handle both MediaItem and UserMedia types
      if ('original_filename' in item) {
        // UserMedia type
        const userMedia = item as UserMedia
        const searchableText = [
          userMedia.original_filename,
          userMedia.usage_type,
          ...(userMedia.metadata?.tags || [])
        ].filter(Boolean).join(' ').toLowerCase()
        return searchableText.includes(query)
      } else {
        // MediaItem type
        const mediaItem = item as MediaItem
        const searchableText = [
          mediaItem.title,
          mediaItem.filename,
          mediaItem.description,
          ...(mediaItem.tags || []),
          ...(mediaItem.categories || [])
        ].filter(Boolean).join(' ').toLowerCase()
        return searchableText.includes(query)
      }
    })
  }

  // Apply category filter (only for MediaItem)
  if (categoryFilter.value && libraryType.value === ImageLibraryType.PUBLIC) {
    filtered = filtered.filter(item => {
      if ('categories' in item) {
        return item.categories?.includes(categoryFilter.value)
      }
      return false
    })
  }

  // Apply tag filter
  if (tagFilter.value) {
    filtered = filtered.filter(item => {
      if ('tags' in item) {
        // MediaItem type
        return item.tags?.includes(tagFilter.value)
      } else if ('metadata' in item) {
        // UserMedia type
        return (item as UserMedia).metadata?.tags?.includes(tagFilter.value)
      }
      return false
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    // Helper to get filename
    const getFilename = (item: MediaItem | UserMedia): string => {
      return 'filename' in item ? item.filename : item.original_filename
    }

    // Helper to get title
    const getTitle = (item: MediaItem | UserMedia): string => {
      if ('title' in item) return item.title || item.filename
      return item.original_filename
    }

    switch (sortBy.value) {
      case 'upload_date_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'upload_date_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'filename_asc':
        return getFilename(a).localeCompare(getFilename(b))
      case 'filename_desc':
        return getFilename(b).localeCompare(getFilename(a))
      case 'title_asc':
        return getTitle(a).localeCompare(getTitle(b))
      case 'title_desc':
        return getTitle(b).localeCompare(getTitle(a))
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

// Get unique categories and tags for filters
const categoryOptions = computed(() => {
  // Categories only exist for MediaItem (public library)
  if (libraryType.value !== ImageLibraryType.PUBLIC) return []

  const categories = new Set<string>()
  media.value.forEach(item => {
    if ('categories' in item) {
      item.categories?.forEach(cat => categories.add(cat))
    }
  })
  return Array.from(categories).map(cat => ({
    value: cat,
    label: cat
  }))
})

const tagOptions = computed(() => {
  const tags = new Set<string>()
  media.value.forEach(item => {
    if ('tags' in item) {
      // MediaItem type
      item.tags?.forEach(tag => tags.add(tag))
    } else if ('metadata' in item) {
      // UserMedia type
      (item as UserMedia).metadata?.tags?.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).map(tag => ({
    value: tag,
    label: tag
  }))
})

// Methods
async function loadMedia() {
  // Use the cached loadImages from the composable
  await currentLibrary.value.loadImages()

  // Initialize selected items based on props
  if (props.selectedIds.length > 0 && media.value.length > 0) {
    selectedMedia.value = media.value.filter(item =>
      props.selectedIds.includes(item.id)
    )
  }
}

function isSelected(item: MediaItem): boolean {
  return selectedMedia.value.some(selected => selected.id === item.id)
}

function toggleSelection(item: MediaItem) {
  const index = selectedMedia.value.findIndex(selected => selected.id === item.id)

  if (index > -1) {
    // Deselect
    selectedMedia.value.splice(index, 1)
  } else {
    // Select
    if (props.multiple) {
      selectedMedia.value.push(item)
    } else {
      // Single selection - replace
      selectedMedia.value = [item]
    }
  }
}

function clearSearch() {
  searchQuery.value = ''
}

const handleSearch = debounce(() => {
  // Search is handled reactively by computed property
}, 300)

function handleCancel() {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('close')
}

function handleConfirm() {
  props.onConfirm(selectedMedia.value)
  emit('close')
}

// Clear filters when switching library
watch(libraryType, () => {
  categoryFilter.value = ''
  tagFilter.value = ''
  searchQuery.value = ''
  selectedMedia.value = []
})

// Lifecycle
onMounted(() => {
  loadMedia()
})
</script>

<style lang="scss">
.t-media-selector {
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-height: 800px;
  width: 100%;
  max-width: 1200px;
  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__header {
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);

    h2 {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space-xs) 0;
    }

    p {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }
  }

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space);
    padding: var(--space);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-background-secondary);

    @media screen and (max-width: 960px) {
      flex-direction: column;
    }

  }

  &__toolbar-column {
    display: flex;
    align-items: center;
    gap: var(--space);

    &--hide{
      @media screen and (max-width: 960px) {
        display: none;
      }
    }
  }

  &__action {
    &--show-filter-toggle {
      display: none;

      @media screen and (max-width: 960px) {
        display: block;
      }
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space);
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
    border-radius: var(--radius-md);
    overflow: hidden;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &--selected {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  &__selection-indicator {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    width: 24px;
    height: 24px;
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
    border-top: 1px solid var(--color-border);
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
