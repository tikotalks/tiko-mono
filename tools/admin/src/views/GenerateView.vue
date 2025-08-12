<template>
  <TAppLayout>
    <template #default>
      <div :class="bemm()">
        <!-- Header -->
        <div :class="bemm('header')">
          <h1>{{ t('admin.generate.title', 'AI Image Generation') }}</h1>
          <p>{{ t('admin.generate.description', 'Generate images using AI and manage your generation queue') }}</p>
        </div>

        <!-- Main Content -->
        <div :class="bemm('content')">
          <!-- Left Panel: Queue Management -->
          <div :class="bemm('panel', 'queue')">
            <h2 :class="bemm('panel-title')">{{ t('admin.generate.queue', 'Generation Queue') }}</h2>
            
            <!-- Scope Selector -->
            <div :class="bemm('scope-selector')">
              <TButtonGroup fluid>
                <TButton
                  v-for="scopeOption in scopeOptions"
                  :key="scopeOption.value"
                  :type="generationScope === scopeOption.value ? 'primary' : 'outline'"
                  @click="generationScope = scopeOption.value"
                  size="small"
                >
                  <TIcon :name="scopeOption.icon" />
                  {{ scopeOption.label }}
                </TButton>
              </TButtonGroup>
            </div>

            <!-- Add Items Form -->
            <div :class="bemm('add-form')">
              <div :class="bemm('form-row')">
                <TInputText
                  v-model="newItem.name"
                  :placeholder="t('admin.generate.imageName', 'Image name')"
                  @keydown.enter="addToQueue"
                />
                <TInputText
                  v-model="newItem.prompt"
                  :placeholder="t('admin.generate.prompt', 'Describe the image...')"
                  @keydown.enter="addToQueue"
                />
                <TButton
                  icon="plus"
                  @click="addToQueue"
                  :disabled="!newItem.name || !newItem.prompt"
                />
              </div>
              
              <!-- Additional fields for global scope -->
              <div v-if="generationScope === 'global'" :class="bemm('form-row')">
                <TInputText
                  v-model="newItem.category"
                  :placeholder="t('admin.generate.category', 'Category')"
                  size="small"
                />
                <TInputText
                  v-model="newItem.tags"
                  :placeholder="t('admin.generate.tags', 'Tags (comma separated)')"
                  size="small"
                />
              </div>
              
              <!-- Bulk Import -->
              <div :class="bemm('bulk-actions')">
                <TButton
                  type="outline"
                  icon="upload"
                  size="small"
                  @click="showBulkImport = !showBulkImport"
                >
                  {{ t('admin.generate.bulkImport', 'Bulk Import') }}
                </TButton>
              </div>
              
              <div v-if="showBulkImport" :class="bemm('bulk-import')">
                <TInputTextarea
                  v-model="bulkImportText"
                  :placeholder="t('admin.generate.bulkFormat', 'Format: name | prompt (one per line)')"
                  :rows="5"
                />
                <TButton
                  type="primary"
                  @click="processBulkImport"
                  :disabled="!bulkImportText"
                >
                  {{ t('admin.generate.importItems', 'Import Items') }}
                </TButton>
              </div>
            </div>

            <!-- Queue List -->
            <div :class="bemm('queue-list')">
              <div
                v-for="(item, index) in queue"
                :key="index"
                :class="bemm('queue-item')"
              >
                <div :class="bemm('queue-item-info')">
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.prompt }}</span>
                </div>
                <TButton
                  type="ghost"
                  icon="x"
                  size="small"
                  @click="removeFromQueue(index)"
                />
              </div>
              
              <div v-if="queue.length === 0" :class="bemm('empty-state')">
                {{ t('admin.generate.emptyQueue', 'No items in queue') }}
              </div>
            </div>

            <!-- Queue Actions -->
            <div v-if="queue.length > 0" :class="bemm('queue-actions')">
              <TButton
                type="primary"
                icon="play"
                :loading="isProcessing"
                @click="startGeneration"
              >
                {{ t('admin.generate.startGeneration', `Generate ${queue.length} Images`) }}
              </TButton>
              <TButton
                type="ghost"
                @click="clearQueue"
              >
                {{ t('admin.generate.clearQueue', 'Clear Queue') }}
              </TButton>
            </div>
          </div>

          <!-- Right Panel: Generated Images -->
          <div :class="bemm('panel', 'results')">
            <div :class="bemm('panel-header')">
              <h2 :class="bemm('panel-title')">{{ t('admin.generate.results', 'Generated Images') }}</h2>
              
              <!-- Filter Tabs -->
              <div :class="bemm('tabs')">
                <button
                  v-for="tab in tabs"
                  :key="tab.value"
                  :class="bemm('tab', { active: activeTab === tab.value })"
                  @click="activeTab = tab.value"
                >
                  {{ tab.label }}
                  <span v-if="tab.count > 0" :class="bemm('tab-count')">{{ tab.count }}</span>
                </button>
              </div>
            </div>

            <!-- Progress Indicators -->
            <div v-if="generatingItems.length > 0" :class="bemm('progress')">
              <div
                v-for="item in generatingItems"
                :key="item.id"
                :class="bemm('progress-item')"
              >
                <TSpinner size="small" />
                <span>{{ t('admin.generate.generating', 'Generating') }} {{ item.original_filename }}...</span>
              </div>
            </div>

            <!-- Results Grid -->
            <div :class="bemm('grid')">
              <div
                v-for="media in filteredMedia"
                :key="media.id"
                :class="bemm('media-item', [media.status])"
              >
                <div :class="bemm('media-preview')">
                  <img
                    v-if="media.url"
                    :src="media.thumbnail_url || media.url"
                    :alt="media.original_filename"
                  />
                  <div v-else :class="bemm('media-placeholder')">
                    <TIcon name="image" />
                  </div>
                  
                  <!-- Status Overlay -->
                  <div :class="bemm('media-status')">
                    <TChip :type="getStatusType(media.status)" size="small">
                      {{ media.status }}
                    </TChip>
                  </div>
                </div>
                
                <div :class="bemm('media-info')">
                  <h4>{{ media.original_filename }}</h4>
                  <p v-if="media.generation_data?.prompt">{{ media.generation_data.prompt }}</p>
                  <p v-if="media.error_message" :class="bemm('error')">{{ media.error_message }}</p>
                </div>
                
                <div :class="bemm('media-actions')">
                  <TButton
                    v-if="media.status === 'generated'"
                    type="primary"
                    size="small"
                    icon="check"
                    @click="approveMedia(media.id)"
                  >
                    {{ t('admin.generate.approve', 'Approve') }}
                  </TButton>
                  <TButton
                    v-if="media.status === 'generated'"
                    type="outline"
                    size="small"
                    icon="x"
                    @click="rejectMedia(media.id)"
                  >
                    {{ t('admin.generate.reject', 'Reject') }}
                  </TButton>
                  <TButton
                    v-if="media.status === 'failed'"
                    type="outline"
                    size="small"
                    icon="rotate-cw"
                    @click="retryMedia(media)"
                  >
                    {{ t('admin.generate.retry', 'Retry') }}
                  </TButton>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredMedia.length === 0 && !isLoading" :class="bemm('empty-state')">
              <TIcon name="image" :class="bemm('empty-icon')" />
              <p>{{ getEmptyMessage() }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useBemm } from 'bemm'
import { useI18n, type ToastService } from '@tiko/ui'
import { useAuthStore, userMediaService, type UserMedia, type MediaStatus } from '@tiko/core'
import {
  TAppLayout,
  TButton,
  TButtonGroup,
  TInputText,
  TInputTextarea,
  TIcon,
  TSpinner,
  TChip
} from '@tiko/ui'

const bemm = useBemm('generate-view')
const { t } = useI18n()
const toastService = inject<ToastService>('toastService')
const authStore = useAuthStore()

// State
const generationScope = ref<'personal' | 'global'>('personal')
const queue = ref<Array<{ name: string; prompt: string; category?: string; tags?: string[] }>>([])
const newItem = ref({ name: '', prompt: '', category: '', tags: '' })
const showBulkImport = ref(false)
const bulkImportText = ref('')
const isProcessing = ref(false)
const isLoading = ref(false)
const activeTab = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')
const generatedMedia = ref<UserMedia[]>([])
let unsubscribe: (() => void) | null = null

// Scope options
const scopeOptions = [
  { value: 'personal', label: t('admin.generate.personalUse', 'Personal Use'), icon: 'user' },
  { value: 'global', label: t('admin.generate.tikoGlobal', 'Tiko Global'), icon: 'globe' }
]

// Computed
const userId = computed(() => authStore.user?.id)

const generatingItems = computed(() => 
  generatedMedia.value.filter(m => m.status === 'generating')
)

const tabs = computed(() => [
  {
    value: 'all',
    label: t('admin.generate.allImages', 'All Images'),
    count: generatedMedia.value.length
  },
  {
    value: 'pending',
    label: t('admin.generate.pending', 'Pending Review'),
    count: generatedMedia.value.filter(m => m.status === 'generated').length
  },
  {
    value: 'approved',
    label: t('admin.generate.approved', 'Approved'),
    count: generatedMedia.value.filter(m => m.status === 'published').length
  },
  {
    value: 'rejected',
    label: t('admin.generate.rejected', 'Rejected'),
    count: generatedMedia.value.filter(m => m.status === 'rejected').length
  }
])

const filteredMedia = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return generatedMedia.value.filter(m => m.status === 'generated')
    case 'approved':
      return generatedMedia.value.filter(m => m.status === 'published')
    case 'rejected':
      return generatedMedia.value.filter(m => m.status === 'rejected')
    default:
      return generatedMedia.value
  }
})

// Methods
const addToQueue = () => {
  if (newItem.value.name && newItem.value.prompt) {
    const item: any = {
      name: newItem.value.name,
      prompt: newItem.value.prompt
    }
    
    // Add global-specific fields
    if (generationScope.value === 'global') {
      item.category = newItem.value.category || 'generated'
      item.tags = newItem.value.tags ? newItem.value.tags.split(',').map(t => t.trim()) : []
    }
    
    queue.value.push(item)
    newItem.value = { name: '', prompt: '', category: '', tags: '' }
    
    // Save queue to localStorage with scope
    localStorage.setItem(`generation-queue-${generationScope.value}`, JSON.stringify(queue.value))
  }
}

const removeFromQueue = (index: number) => {
  queue.value.splice(index, 1)
  localStorage.setItem(`generation-queue-${generationScope.value}`, JSON.stringify(queue.value))
}

const clearQueue = () => {
  queue.value = []
  localStorage.removeItem(`generation-queue-${generationScope.value}`)
}

const processBulkImport = () => {
  const lines = bulkImportText.value.trim().split('\n')
  
  lines.forEach(line => {
    const [name, prompt] = line.split('|').map(s => s.trim())
    if (name && prompt) {
      queue.value.push({ name, prompt })
    }
  })
  
  bulkImportText.value = ''
  showBulkImport.value = false
  localStorage.setItem(`generation-queue-${generationScope.value}`, JSON.stringify(queue.value))
  
  toastService?.show({
    message: t('admin.generate.itemsImported', `${lines.length} items imported`),
    type: 'success'
  })
}

const startGeneration = async () => {
  if (!userId.value || queue.value.length === 0) return
  
  isProcessing.value = true
  
  try {
    const result = await userMediaService.queueImageGeneration(
      userId.value,
      generationScope.value,
      queue.value
    )
    
    toastService?.show({
      message: t('admin.generate.generationStarted', `${result.queued} images queued for generation`),
      type: 'success'
    })
    
    clearQueue()
    await loadGeneratedMedia()
  } catch (error) {
    console.error('Failed to start generation:', error)
    toastService?.show({
      message: t('admin.generate.generationFailed', 'Failed to start generation'),
      type: 'error'
    })
  } finally {
    isProcessing.value = false
  }
}

const loadGeneratedMedia = async () => {
  if (!userId.value) return
  
  isLoading.value = true
  
  try {
    if (generationScope.value === 'personal') {
      const media = await userMediaService.getGeneratedMedia(userId.value)
      generatedMedia.value = media
    } else {
      // For global scope, we need to import mediaService
      const { mediaService } = await import('@tiko/core')
      const media = await mediaService.getGeneratedMedia(undefined, userId.value)
      generatedMedia.value = media as any
    }
  } catch (error) {
    console.error('Failed to load generated media:', error)
  } finally {
    isLoading.value = false
  }
}

const approveMedia = async (mediaId: string) => {
  try {
    if (generationScope.value === 'personal') {
      await userMediaService.updateMediaStatus(mediaId, 'published')
    } else {
      const { mediaService } = await import('@tiko/core')
      await mediaService.updateMediaStatus(mediaId, 'published')
    }
    toastService?.show({
      message: t('admin.generate.imageApproved', 'Image approved'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to approve media:', error)
    toastService?.show({
      message: t('admin.generate.approveFailed', 'Failed to approve image'),
      type: 'error'
    })
  }
}

const rejectMedia = async (mediaId: string) => {
  try {
    if (generationScope.value === 'personal') {
      await userMediaService.updateMediaStatus(mediaId, 'rejected')
    } else {
      const { mediaService } = await import('@tiko/core')
      await mediaService.updateMediaStatus(mediaId, 'rejected')
    }
    toastService?.show({
      message: t('admin.generate.imageRejected', 'Image rejected'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to reject media:', error)
    toastService?.show({
      message: t('admin.generate.rejectFailed', 'Failed to reject image'),
      type: 'error'
    })
  }
}

const retryMedia = async (media: UserMedia) => {
  if (media.generation_data) {
    queue.value.push({
      name: media.original_filename.replace('.png', ''),
      prompt: media.generation_data.prompt
    })
    localStorage.setItem(`generation-queue-${generationScope.value}`, JSON.stringify(queue.value))
    
    toastService?.show({
      message: t('admin.generate.addedToQueue', 'Added to queue for retry'),
      type: 'info'
    })
  }
}

const getStatusType = (status?: MediaStatus) => {
  switch (status) {
    case 'published':
      return 'success'
    case 'generated':
      return 'info'
    case 'failed':
    case 'rejected':
      return 'error'
    case 'generating':
      return 'warning'
    default:
      return 'default'
  }
}

const getEmptyMessage = () => {
  switch (activeTab.value) {
    case 'pending':
      return t('admin.generate.noPending', 'No images pending review')
    case 'approved':
      return t('admin.generate.noApproved', 'No approved images')
    case 'rejected':
      return t('admin.generate.noRejected', 'No rejected images')
    default:
      return t('admin.generate.noImages', 'No generated images yet')
  }
}

// Subscribe to realtime updates
const subscribeToUpdates = async () => {
  if (!userId.value) return
  
  if (generationScope.value === 'personal') {
    unsubscribe = userMediaService.subscribeToGenerationUpdates(
      userId.value,
      (payload) => {
        console.log('Realtime update:', payload)
        
        // Update local state based on the change
        if (payload.eventType === 'INSERT') {
          generatedMedia.value.unshift(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = generatedMedia.value.findIndex(m => m.id === payload.new.id)
          if (index >= 0) {
            generatedMedia.value[index] = payload.new
          }
        } else if (payload.eventType === 'DELETE') {
          generatedMedia.value = generatedMedia.value.filter(m => m.id !== payload.old.id)
        }
      }
    )
  } else {
    const { mediaService } = await import('@tiko/core')
    unsubscribe = mediaService.subscribeToGenerationUpdates(
      userId.value,
      (payload) => {
        console.log('Realtime update (global):', payload)
        
        // Update local state based on the change
        if (payload.eventType === 'INSERT') {
          generatedMedia.value.unshift(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = generatedMedia.value.findIndex(m => m.id === payload.new.id)
          if (index >= 0) {
            generatedMedia.value[index] = payload.new
          }
        } else if (payload.eventType === 'DELETE') {
          generatedMedia.value = generatedMedia.value.filter(m => m.id !== payload.old.id)
        }
      }
    )
  }
}

// Watch for scope changes
watch(generationScope, async () => {
  // Unsubscribe from previous scope
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  
  // Load queue for new scope
  const savedQueue = localStorage.getItem(`generation-queue-${generationScope.value}`)
  if (savedQueue) {
    queue.value = JSON.parse(savedQueue)
  } else {
    queue.value = []
  }
  
  // Reload media and resubscribe
  await loadGeneratedMedia()
  await subscribeToUpdates()
})

// Lifecycle
onMounted(() => {
  // Load queue from localStorage
  const savedQueue = localStorage.getItem(`generation-queue-${generationScope.value}`)
  if (savedQueue) {
    queue.value = JSON.parse(savedQueue)
  }
  
  loadGeneratedMedia()
  subscribeToUpdates()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style lang="scss" scoped>
.generate-view {
  padding: var(--space-xl);
  
  &__header {
    margin-bottom: var(--space-xl);
    
    h1 {
      margin: 0 0 var(--space-xs) 0;
      font-size: 2rem;
    }
    
    p {
      margin: 0;
      color: var(--color-text-secondary);
    }
  }
  
  &__content {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: var(--space-xl);
    height: calc(100vh - 200px);
  }
  
  &__panel {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: var(--space);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    &--queue {
      max-height: 100%;
    }
    
    &--results {
      overflow-y: auto;
    }
  }
  
  &__panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }
  
  &__panel-title {
    margin: 0 0 var(--space) 0;
    font-size: 1.25rem;
  }
  
  &__scope-selector {
    margin-bottom: var(--space);
  }
  
  &__add-form {
    margin-bottom: var(--space);
  }
  
  &__form-row {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: var(--space-s);
    margin-bottom: var(--space-s);
  }
  
  &__bulk-actions {
    margin-top: var(--space);
  }
  
  &__bulk-import {
    margin-top: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    
    button {
      margin-top: var(--space-s);
    }
  }
  
  &__queue-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: var(--space);
  }
  
  &__queue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    margin-bottom: var(--space-s);
    
    &:hover {
      background: var(--color-background-secondary);
    }
  }
  
  &__queue-item-info {
    flex: 1;
    min-width: 0;
    
    strong {
      display: block;
      margin-bottom: var(--space-xs);
    }
    
    span {
      display: block;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  &__queue-actions {
    display: flex;
    gap: var(--space-s);
  }
  
  &__tabs {
    display: flex;
    gap: var(--space-s);
  }
  
  &__tab {
    padding: var(--space-xs) var(--space);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--color-background-secondary);
    }
    
    &--active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
  }
  
  &__tab-count {
    margin-left: var(--space-xs);
    padding: 0 var(--space-xs);
    background: rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius-sm);
    font-size: 0.75rem;
  }
  
  &__progress {
    margin-bottom: var(--space);
    padding: var(--space);
    background: var(--color-info-bg);
    border-radius: var(--border-radius);
  }
  
  &__progress-item {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    margin-bottom: var(--space-s);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space);
  }
  
  &__media-item {
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &--failed {
      border-color: var(--color-error);
    }
  }
  
  &__media-preview {
    position: relative;
    aspect-ratio: 1;
    background: var(--color-background-secondary);
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  &__media-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: 3rem;
  }
  
  &__media-status {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
  }
  
  &__media-info {
    padding: var(--space);
    
    h4 {
      margin: 0 0 var(--space-xs) 0;
      font-size: 0.875rem;
    }
    
    p {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  &__media-actions {
    padding: 0 var(--space) var(--space);
    display: flex;
    gap: var(--space-s);
  }
  
  &__error {
    color: var(--color-error);
  }
  
  &__empty-state {
    text-align: center;
    padding: var(--space-xl);
    color: var(--color-text-secondary);
  }
  
  &__empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space);
    opacity: 0.5;
  }
}

@media (max-width: 1200px) {
  .generate-view__content {
    grid-template-columns: 1fr;
    
    .generate-view__panel--queue {
      max-height: 400px;
    }
  }
}
</style>