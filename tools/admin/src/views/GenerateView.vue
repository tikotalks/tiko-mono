<template>

      <div :class="bemm()">
        <!-- Header -->
        <div :class="bemm('header')">
          <h1>{{ t('admin.generate.title') }}</h1>
          <p>{{ t('admin.generate.description') }}</p>
        </div>

        <!-- Main Content -->
        <div :class="bemm('content')">
          <!-- Left Panel: Queue Management -->
          <div :class="bemm('panel', 'queue')">
            <h2 :class="bemm('panel-title')">{{ t('admin.generate.queue') }}</h2>

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
                  :placeholder="t('admin.generate.prompt')"
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
                  :placeholder="t('common.category', 'Category')"
                  size="small"
                />
                <TInputText
                  v-model="newItem.tags"
                  :placeholder="t('admin.generate.tags')"
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
                  {{ t('common.bulkImport') }}
                </TButton>
              </div>

              <div v-if="showBulkImport" :class="bemm('bulk-import')">
                <TInputTextArea
                  v-model="bulkImportText"
                  :placeholder="t('admin.generate.bulkFormat')"
                  :rows="5"
                />
                <TButton
                  type="primary"
                  @click="processBulkImport"
                  :disabled="!bulkImportText"
                >
                  {{ t('common.importItems') }}
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
                {{ t('admin.generate.startGeneration', {total: queue.length}) }}
              </TButton>
              <TButton
                type="outline"
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

              <!-- View Personal Library Button -->
              <TButton
                v-if="generationScope === 'personal'"
                type="outline"
                size="small"
                icon="arrow-right"
                @click="router.push('/personal-library')"
              >
                {{ t('admin.generate.viewPersonalLibrary', 'View Personal Library') }}
              </TButton>

              <!-- Filter Tabs -->
              <TButtonGroup fluid :class="bemm('tabs')">
                <TButton
                  v-for="tab in tabs"
                  :key="tab.value"
                  :type="activeTab == tab.value  ? 'default' : 'outline'"
                  :class="bemm('tab', ['', activeTab == tab.value  ? 'active' : ''])"
                  @click="activeTab = tab.value"
                >
                  {{ tab.label }}
                  <span v-if="tab.count > 0" :class="bemm('tab-count')">{{ tab.count }}</span>
                </TButton>
              </TButtonGroup>
            </div>

            <!-- Progress Indicators -->
            <div v-if="generatingItems.length > 0" :class="bemm('progress')">
              <div
                v-for="item in generatingItems"
                :key="item.id"
                :class="bemm('progress-item')"
              >
                <TSpinner size="small" />
                <span>{{ t('admin.generate.generating') }} {{ item.original_filename }}...</span>
              </div>
            </div>

            <!-- Results Grid -->
            <TVirtualGrid
              :items="filteredMedia"
              :min-item-width="250"
              :gap="16"
              :aspect-ratio="'1:1'"
            >
              <template #default="{ item }">
                <div :class="bemm('media-wrapper')">
                  <TMediaTile
                    :media="item"
                    :get-image-variants="getImageVariants"
                  >
                    <template #overlay>
                      <!-- Status Badge -->
                      <div :class="bemm('media-status')">
                        <TChip :type="getStatusType(item.status)" size="small">
                          {{ item.status }}
                        </TChip>
                      </div>
                    </template>

                    <template #details>
                      <div :class="bemm('media-details')">
                        <p v-if="item.generation_data?.prompt" :class="bemm('prompt')">
                          {{ item.generation_data.prompt }}
                        </p>
                        <p v-if="item.error_message" :class="bemm('error')">
                          {{ item.error_message }}
                        </p>
                      </div>
                    </template>
                  </TMediaTile>

                  <!-- Action Buttons -->
                  <div :class="bemm('media-actions')">
                    <TButton
                      v-if="item.status === 'generated'"
                      type="primary"
                      size="small"
                      icon="check"
                      fluid
                      @click="approveMedia(item.id)"
                    >
                      {{ t('common.approve') }}
                    </TButton>
                    <TButton
                      v-if="item.status === 'generated'"
                      type="outline"
                      size="small"
                      icon="x"
                      fluid
                      @click="rejectMedia(item.id)"
                    >
                      {{ t('common.reject') }}
                    </TButton>
                    <TButton
                      v-if="item.status === 'failed'"
                      type="outline"
                      size="small"
                      icon="rotate-cw"
                      fluid
                      @click="retryMedia(item)"
                    >
                      {{ t('common.retry') }}
                    </TButton>
                  </div>
                </div>
              </template>
            </TVirtualGrid>

            <!-- Empty State -->
            <div v-if="filteredMedia.length === 0 && !isLoading" :class="bemm('empty-state')">
              <TIcon name="image" :class="bemm('empty-icon')" />
              <p>{{ getEmptyMessage() }}</p>
            </div>
          </div>
        </div>
      </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { type ToastService } from '@tiko/ui'
import { useAuthStore, userMediaService, type UserMedia, type MediaStatus } from '@tiko/core'
import {
  TAppLayout,
  TButton,
  TButtonGroup,
  TInputText,
  TInputTextArea,
  TIcon,
  TSpinner,
  TChip,
  TMediaTile,
  TVirtualGrid
} from '@tiko/ui'
import { useImageUrl } from '@tiko/core'

const bemm = useBemm('generate-view')
const { t } = useI18n()
const toastService = inject<ToastService>('toastService')
const authStore = useAuthStore()
const { getImageVariants } = useImageUrl()
const router = useRouter()

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
    // Log the request for debugging
    console.log('Sending generation request:', {
      userId: userId.value,
      scope: generationScope.value,
      items: queue.value
    })

    // Call the image generation worker directly
    const response = await fetch('https://generate.tikocdn.org/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId.value,
        scope: generationScope.value,
        items: queue.value
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Generation API error:', response.status, errorText)
      throw new Error(`Failed to queue image generation: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    console.log('Generation response:', result)

    if (result.success && result.queued > 0) {
      toastService?.show({
        message: t('admin.generate.generationStarted', `${result.queued} images queued for generation`),
        type: 'success'
      })

      clearQueue()
      await loadGeneratedMedia()
    } else {
      throw new Error(result.error || 'No items were queued')
    }
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
   display: flex; flex-direction: column;
    gap: var(--space-xl);
    height: calc(100vh - 200px);
  }

  &__panel {
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
    padding: var(--space);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &--queue {
    }

    &--results {
    }
  }

  &__panel-header {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    margin-bottom: var(--space);
  }

  &__panel-title {
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
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-s);
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
    border: 1px solid var(--color-accent);
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

  &__media-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
  }

  &__media-status {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    z-index: 1;
  }

  &__media-details {
    padding: var(--space-s);
  }

  &__prompt {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__media-actions {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
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
