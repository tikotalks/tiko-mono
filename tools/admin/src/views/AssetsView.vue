<template>
  <div class="assets-view">
    <div class="assets-header">
      <h1>Assets</h1>
      <p>Manage your file assets - images, videos, audio, and documents</p>

      <div class="assets-actions">
        <TButton
          :icon="Icons.ARROW_UPLOAD"
          @click="openUploadDialog"
          color="primary"
        >
          Upload Asset
        </TButton>

        <TButton
          :icon="Icons.ARROW_RELOAD_DOWN_UP"
          @click="loadAssets"
          type="outline"
        >
          Refresh
        </TButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="assets-filters">
      <TInputText
        v-model="searchQuery"
        :icon="Icons.SEARCH_M"
        placeholder="Search assets..."
        @update:model-value="debouncedSearch"
      />

      <TInputSelect
        v-model="selectedMimeType"
        :options="mimeTypeOptions"
        placeholder="All File Types"
        @update:model-value="loadAssets"
      />

      <TInputSelect
        v-model="selectedCategory"
        :options="categoryOptions"
        placeholder="All Categories"
        @update:model-value="loadAssets"
      />

      <TInputSelect
        v-model="visibilityFilter"
        :options="visibilityOptions"
        placeholder="All Assets"
        @update:model-value="loadAssets"
      />
    </div>

    <!-- Assets Grid -->
    <div class="assets-grid" v-if="!loading && assets.length > 0">
      <TMediaTile
        v-for="asset in assets"
        :key="asset.id"
        :media="convertToMediaItem(asset)"
        :show-overlay="true"
        :context-menu-items="getContextMenuItems(asset)"
        @click="openAssetDetail(asset)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <TSpinner size="large" />
      <p>Loading assets...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && assets.length === 0" class="empty-state">
      <TIcon :name="Icons.IMAGE" size="xl" />
      <h3>No assets found</h3>
      <p v-if="hasFilters">Try adjusting your filters or search query</p>
      <p v-else>Upload your first asset to get started</p>
      <TButton
        v-if="!hasFilters"
        :icon="Icons.ARROW_UPLOAD"
        @click="openUploadDialog"
        color="primary"
      >
        Upload Asset
      </TButton>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="pagination">
      <TButton
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        type="outline"
      >
        Previous
      </TButton>

      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }} ({{ totalAssets }} total)
      </span>

      <TButton
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        type="outline"
      >
        Next
      </TButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { TButton, TInput, TIcon, TSpinner, TInputText, TInputSelect, TMediaTile, type PopupService } from '@tiko/ui'
import { Icons } from 'open-icon'
import { assetsService, type Asset } from '../services/assets.service'
import AssetUploadDialog from '../components/AssetUploadDialog.vue'
import AssetDetailDialog from '../components/AssetDetailDialog.vue'

const { t } = useI18n()
const popupService = inject<PopupService>('popupService')

// State
const assets = ref<Asset[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedMimeType = ref('')
const selectedCategory = ref('')
const visibilityFilter = ref('')
const categories = ref<string[]>([])
const currentPage = ref(1)
const totalAssets = ref(0)
const itemsPerPage = 20

// UI State
const selectedAsset = ref<Asset | null>(null)

// Computed
const totalPages = computed(() => Math.ceil(totalAssets.value / itemsPerPage))
const hasFilters = computed(() =>
  searchQuery.value || selectedMimeType.value || selectedCategory.value || visibilityFilter.value
)

// Options for select inputs
const mimeTypeOptions = computed(() => [
  { value: '', label: 'All File Types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'application', label: 'Documents' }
])

const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...categories.value.map(cat => ({ value: cat, label: cat }))
])

const visibilityOptions = computed(() => [
  { value: '', label: 'All Assets' },
  { value: 'public', label: 'Public Only' },
  { value: 'private', label: 'Private Only' }
])

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadAssets()
  }, 500)
}

// Methods
const loadAssets = async () => {
  loading.value = true
  try {
    const options = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchQuery.value || undefined,
      mimeType: selectedMimeType.value || undefined,
      category: selectedCategory.value || undefined,
      isPublic: visibilityFilter.value === 'public' ? true :
                visibilityFilter.value === 'private' ? false : undefined
    }

    const response = await assetsService.listAssets(options)
    assets.value = response.assets
    totalAssets.value = response.total
  } catch (error) {
    console.error('Failed to load assets:', error)
    // TODO: Show error notification
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await assetsService.getCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadAssets()
}

const openUploadDialog = () => {
  if (!popupService) return

  popupService.open({
    component: AssetUploadDialog,
    title: 'Upload Asset',
    props: {
      onUploaded: handleAssetUploaded
    }
  })
}

const openAssetDetail = (asset: Asset) => {
  if (!popupService) return

  popupService.open({
    component: AssetDetailDialog,
    title: 'Asset Details',
    props: {
      asset,
      onUpdated: handleAssetUpdated,
      onDeleted: handleAssetDeleted
    }
  })
}

const getAssetThumbnail = (asset: Asset) => {
  return assetsService.getOptimizedUrl(asset, { width: 300, height: 300, format: 'webp' })
}

const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return Icons.IMAGE
  if (mimeType.startsWith('video/')) return Icons.FILM
  if (mimeType.startsWith('audio/')) return Icons.MUSIC
  if (mimeType.includes('pdf')) return 'file-pdf'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-document'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'file-spreadsheet'
  return Icons.FILE
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Convert Asset to MediaItem format for TMediaTile
const convertToMediaItem = (asset: Asset) => {
  return {
    id: asset.id,
    title: asset.title,
    original_filename: asset.original_filename,
    original_url: assetsService.getAssetUrl(asset),
    file_size: asset.file_size,
    tags: asset.tags,
    categories: asset.categories,
    description: asset.description,
    created_at: asset.created_at,
    updated_at: asset.updated_at,
    type: asset.mime_type,
    width: asset.width,
    height: asset.height
  }
}

// Get context menu items for an asset
const getContextMenuItems = (asset: Asset) => {
  return [
    {
      label: 'View Details',
      icon: Icons.INFO_M,
      action: () => openAssetDetail(asset)
    },
    {
      label: 'Copy URL',
      icon: Icons.FILE_MULTIPLY,
      action: () => {
        navigator.clipboard.writeText(assetsService.getAssetUrl(asset))
        // TODO: Show toast notification
      }
    },
    {
      label: 'Copy ID',
      icon: Icons.FILE_CODE,
      action: () => {
        navigator.clipboard.writeText(asset.id)
        // TODO: Show toast notification
      }
    },
    {
      label: 'Delete',
      icon: Icons.TRASH,
      action: () => {
        if (confirm(`Are you sure you want to delete "${asset.title}"?`)) {
          handleAssetDeleted(asset)
        }
      },
      danger: true
    }
  ]
}

const handleAssetUploaded = (asset: Asset) => {
  assets.value.unshift(asset)
  totalAssets.value++
  popupService?.close()
  loadCategories() // Refresh categories in case new ones were added
}

const handleAssetUpdated = (updatedAsset: Asset) => {
  const index = assets.value.findIndex(a => a.id === updatedAsset.id)
  if (index >= 0) {
    assets.value[index] = updatedAsset
  }
  popupService?.close()
  loadCategories() // Refresh categories
}

const handleAssetDeleted = (deletedAsset: Asset) => {
  assets.value = assets.value.filter(a => a.id !== deletedAsset.id)
  totalAssets.value--
  popupService?.close()
}

// Lifecycle
onMounted(() => {
  loadAssets()
  loadCategories()
})
</script>

<style scoped>
.assets-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.assets-header {
  margin-bottom: 2rem;
}

.assets-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 600;
}

.assets-header p {
  margin: 0 0 1.5rem;
  color: var(--color-text-secondary);
}

.assets-actions {
  display: flex;
  gap: 1rem;
}

.assets-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}



.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.asset-card {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  overflow: hidden;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.asset-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.asset-preview {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-50);
}

.asset-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-secondary);
}

.asset-info {
  padding: 1rem;
}

.asset-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-meta {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.public-badge {
  background: var(--color-success);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.asset-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.category-tag,
.asset-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--color-gray-100);
  color: var(--color-text-secondary);
}

.category-tag {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-state p,
.empty-state h3 {
  margin: 1rem 0 0.5rem;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-info {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>
