<template>
  <div :class="bemm()">
      <div
        :class="bemm('upload-area', { dragging: isDragging })"
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
      >
        <TCard>
          <TIcon :name="Icons.ARROW_UPLOAD" size="large" />
          <h3>{{ t('admin.upload.dragDrop') }}</h3>
          <p>{{ t('admin.upload.or') }}</p>
          <TButton color="primary" @click="selectFiles">
            {{ t('admin.upload.selectFiles') }}
          </TButton>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            :class="bemm('file-input')"
            @change="handleFileSelect"
          />
        </TCard>
      </div>

      <div v-if="uploadQueue.length > 0" :class="bemm('queue')">
        <h3>{{ t('admin.upload.uploadQueue') }}</h3>
        <div :class="bemm('queue-items')">
          <div
            v-for="item in uploadQueue"
            :key="item.id"
            :class="bemm('queue-item',['', item.status])"
          >
            <img v-if="item.preview" :src="item.preview" :alt="item.file.name" />
            <div :class="bemm('queue-item-info')">
              <p :class="bemm('queue-item-name')">{{ item.file.name }}</p>
              <p :class="bemm('queue-item-size')">{{ formatBytes(item.file.size) }}</p>
            </div>
            <div :class="bemm('queue-item-status')">
              <TSpinner v-if="item.status === 'uploading'" size="small" />
              <TIcon v-else-if="item.status === 'success'" :name="Icons.CHECK_M" color="success" />
              <TIcon v-else-if="item.status === 'pending'" :name="Icons.THREE_DOTS_HORIZONTAL" color="success" />
              <TIcon v-else-if="item.status === 'error'" :name="Icons.CLOSE" color="error" />
            </div>
          </div>
        </div>
        <div :class="bemm('actions')">
          <TButton
            color="primary"
            :disabled="isUploading"
            @click="startUpload"
          >
            {{ t('admin.upload.startUpload') }}
          </TButton>
          <TButton
            v-if="hasSuccessfulUploads"
            color="success"
            @click="clearSuccessful"
          >
            {{ t('admin.upload.clearSuccessful') }}
          </TButton>
          <TButton
            color="secondary"
            @click="clearQueue"
          >
            {{ t('admin.upload.clearQueue') }}
          </TButton>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'
import { TCard, TButton, TIcon, TSpinner } from '@tiko/ui'
import { Icons } from 'open-icon'
import { uploadService } from '../services/upload.service'
import type { ToastService } from '@tiko/ui'

const bemm = useBemm('upload-view')
const { t } = useI18n()
const router = useRouter()
const toastService = inject<ToastService>('toastService')

interface UploadItem {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const uploadQueue = ref<UploadItem[]>([])
const isUploading = ref(false)

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const selectFiles = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFilesToQueue(Array.from(input.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (imageFiles.length > 0) {
    addFilesToQueue(imageFiles)
  } else {
    toastService?.show({
      message: t('admin.upload.onlyImages'),
      type: 'error'
    })
  }
}

const addFilesToQueue = (files: File[]) => {
  files.forEach(file => {
    const reader = new FileReader()
    const id = `${Date.now()}-${Math.random()}`

    const item: UploadItem = {
      id,
      file,
      status: 'pending'
    }

    reader.onload = (e) => {
      item.preview = e.target?.result as string
    }

    reader.readAsDataURL(file)
    uploadQueue.value.push(item)
  })
}

const startUpload = async () => {
  isUploading.value = true

  for (const item of uploadQueue.value) {
    if (item.status !== 'pending') continue

    item.status = 'uploading'

    try {
      const result = await uploadService.uploadFile(item.file)

      item.status = 'success'

      // Show success message
      toastService?.show({
        message: t('admin.upload.uploadSuccess', { name: item.file.name }),
        type: 'success'
      })

      // If there's an AI analysis warning, show it separately
      if (result.aiAnalysisMessage) {
        setTimeout(() => {
          toastService?.show({
            message: result.aiAnalysisMessage || '',
            type: 'warning',
            duration: 6000
          })
        }, 500) // Small delay so both toasts don't overlap
      }
    } catch (error) {
      item.status = 'error'
      item.error = error instanceof Error ? error.message : 'Unknown error'

      console.error('[Upload] Error uploading file:', item.file.name, error)

      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      toastService?.show({
        message: `${t('admin.upload.uploadError', { name: item.file.name })}: ${errorMessage}`,
        type: 'error',
        duration: 5000
      })
    }
  }

  isUploading.value = false

  // Auto-clear successful uploads after a delay
  setTimeout(() => {
    uploadQueue.value = uploadQueue.value.filter(item => item.status !== 'success')
  }, 2000)
}

const hasSuccessfulUploads = computed(() =>
  uploadQueue.value.some(item => item.status === 'success')
)

const clearSuccessful = () => {
  uploadQueue.value = uploadQueue.value.filter(item => item.status !== 'success')
}

const clearQueue = () => {
  uploadQueue.value = []
}
</script>

<style lang="scss">
.upload-view {
  padding: var(--space);

  &__upload-area {
    max-width: 600px;
    margin: 0 auto var(--space-lg);

    &--dragging {
      .t-card {
        border-color: var(--color-primary);
        background-color: var(--color-primary-alpha-10);
      }
    }

    .t-card {
      text-align: center;
      padding: var(--space-xl);
      border: 2px dashed var(--color-border);
      transition: all 0.2s;
    }

    h3 {
      margin: var(--space) 0;
    }

    p {
      color: var(--color-text-secondary);
      margin-bottom: var(--space);
    }
  }

  &__file-input {
    display: none;
  }

  &__queue {
    max-width: 800px;
    margin: 0 auto;

    h3 {
      margin-bottom: var(--space);
    }
  }

  &__queue-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space);
  }

  &__queue-item {
    display: flex;
    align-items: center;
    gap: var(--space);
    padding: var(--space-s);
    background: var(--color-background);
    border-radius: var(--border-radius);
    border:1px solid var(--color-primary);


    &--pending {
      opacity: 0.5;
    }
    &--uploading {
      opacity: 1;
    }
    &--success {
      opacity: 1;
     border-color: var(--color-foreground)
    }
    &--error {
      opacity: 1;
     border-color: var(--color-error)
    }

    img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: var(--radius-sm);
    }
  }

  &__queue-item-status{
    width: 3em;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  &__queue-item-info {
    flex: 1;
  }

  &__queue-item-name {
    font-weight: 500;
  }

  &__queue-item-size {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    gap: var(--space);
  }
}
</style>
