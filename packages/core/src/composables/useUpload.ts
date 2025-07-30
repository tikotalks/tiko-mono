import { ref, computed } from 'vue'
import { useEventBus } from './useEventBus'

export interface ToastService {
  show(options: { 
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    duration?: number 
  }): void
}

export interface UploadItem {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
  isDuplicate?: boolean
  duplicateWarning?: string
  uploadedUrl?: string
  mediaId?: string
}

interface UploadServiceInterface {
  uploadFile: (file: File) => Promise<{
    success: boolean
    url?: string
    mediaId?: string
    error?: string
    aiAnalysisMessage?: string
  }>
}

// Shared state outside the function
const queue = ref<UploadItem[]>([])
const isUploading = ref(false)
const currentUploadId = ref<string | null>(null)
const isProcessing = ref(false)

export function useUpload(
  uploadService?: UploadServiceInterface,
  toastService?: ToastService
) {
  // Event bus for communicating with media library
  const eventBus = useEventBus()

  // Computed
  const pendingItems = computed(() =>
    queue.value.filter(item => item.status === 'pending')
  )

  const uploadingItems = computed(() =>
    queue.value.filter(item => item.status === 'uploading')
  )

  const successItems = computed(() =>
    queue.value.filter(item => item.status === 'success')
  )

  const errorItems = computed(() =>
    queue.value.filter(item => item.status === 'error')
  )

  const totalProgress = computed(() => {
    const total = queue.value.length
    if (total === 0) return 0

    const completed = successItems.value.length
    const inProgress = uploadingItems.value.length * 0.5

    return Math.round(((completed + inProgress) / total) * 100)
  })

  const currentItem = computed(() =>
    currentUploadId.value
      ? queue.value.find(item => item.id === currentUploadId.value)
      : null
  )

  const hasItems = computed(() => queue.value.length > 0)

  const hasActiveUploads = computed(() =>
    isUploading.value || pendingItems.value.length > 0
  )

  const duplicateItems = computed(() =>
    queue.value.filter(item => item.isDuplicate)
  )

  // Actions
  const addToQueue = (files: File[], checkDuplicates?: (filename: string) => boolean) => {
    files.forEach(file => {
      const id = `${Date.now()}-${Math.random()}`
      const isDuplicate = checkDuplicates ? checkDuplicates(file.name) : false

      const item: UploadItem = {
        id,
        file,
        status: 'pending',
        isDuplicate,
        duplicateWarning: isDuplicate ? `A file named "${file.name}" already exists` : undefined
      }

      // Generate preview for images
      const reader = new FileReader()
      reader.onload = (e) => {
        const existingItem = queue.value.find(i => i.id === id)
        if (existingItem) {
          existingItem.preview = e.target?.result as string
        }
      }
      reader.readAsDataURL(file)

      queue.value.push(item)
    })
  }

  const removeFromQueue = (itemId: string) => {
    const index = queue.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      queue.value.splice(index, 1)
    }
  }

  const updateItemStatus = (itemId: string, status: UploadItem['status'], error?: string) => {
    const item = queue.value.find(i => i.id === itemId)
    if (item) {
      item.status = status
      if (error) {
        item.error = error
      }
    }
  }

  const updateItemProgress = (itemId: string, progress: number) => {
    const item = queue.value.find(i => i.id === itemId)
    if (item) {
      item.progress = progress
    }
  }

  const clearSuccessful = () => {
    queue.value = queue.value.filter(item => item.status !== 'success')
  }

  const clearAll = () => {
    queue.value = []
    currentUploadId.value = null
    isUploading.value = false
  }

  const clearErrors = () => {
    queue.value = queue.value.filter(item => item.status !== 'error')
  }

  const retryErrors = () => {
    errorItems.value.forEach(item => {
      item.status = 'pending'
      item.error = undefined
    })
  }

  const removeDuplicates = () => {
    queue.value = queue.value.filter(item => !item.isDuplicate)
  }

  // Upload processing
  const processQueue = async () => {
    if (!uploadService) {
      console.error('[useUpload] No upload service provided')
      return
    }

    if (isProcessing.value || !pendingItems.value.length) {
      return
    }

    isProcessing.value = true
    isUploading.value = true

    while (pendingItems.value.length > 0 && isUploading.value) {
      const item = pendingItems.value[0]
      if (!item) break

      currentUploadId.value = item.id
      updateItemStatus(item.id, 'uploading')

      try {
        const result = await uploadService.uploadFile(item.file)

        if (result.success) {
          updateItemStatus(item.id, 'success')

          // Store the uploaded URL and media ID
          const uploadedItem = queue.value.find(i => i.id === item.id)
          if (uploadedItem) {
            uploadedItem.uploadedUrl = result.url
            uploadedItem.mediaId = result.mediaId
          }

          // Emit event to refresh media library
          eventBus.emit('media:refresh', {})

          // Show success toast
          toastService?.show({
            message: `${item.file.name} uploaded successfully`,
            type: 'success'
          })

          // Show AI analysis warning if present
          if (result.aiAnalysisMessage) {
            setTimeout(() => {
              toastService?.show({
                message: result.aiAnalysisMessage || '',
                type: 'warning',
                duration: 6000
              })
            }, 500)
          }
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateItemStatus(item.id, 'error', errorMessage)

        console.error('[Upload] Error uploading file:', item.file.name, error)

        // Show error toast
        toastService?.show({
          message: `Failed to upload ${item.file.name}: ${errorMessage}`,
          type: 'error',
          duration: 5000
        })
      }
    }

    currentUploadId.value = null
    isUploading.value = false
    isProcessing.value = false

    // Auto-clear successful uploads after a delay
    setTimeout(() => {
      if (!hasActiveUploads.value) {
        clearSuccessful()
      }
    }, 3000)
  }

  // Public API
  const startUpload = () => {
    if (!isUploading.value) {
      processQueue()
    }
  }

  const pauseUpload = () => {
    isUploading.value = false
  }

  const stopUpload = () => {
    isUploading.value = false
    // Reset all uploading items back to pending
    uploadingItems.value.forEach(item => {
      updateItemStatus(item.id, 'pending')
    })
    currentUploadId.value = null
  }

  return {
    // State
    queue: computed(() => queue.value),
    isUploading: computed(() => isUploading.value),
    currentItem,

    // Computed stats
    pendingItems,
    uploadingItems,
    successItems,
    errorItems,
    duplicateItems,
    totalProgress,
    hasItems,
    hasActiveUploads,

    // Actions
    addToQueue,
    removeFromQueue,
    clearSuccessful,
    clearAll,
    clearErrors,
    retryErrors,
    removeDuplicates,

    // Upload controls
    startUpload,
    pauseUpload,
    stopUpload
  }
}
