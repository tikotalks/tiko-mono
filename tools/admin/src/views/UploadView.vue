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
          <TIcon :name="Icons.ARROW_HEADED_UP" size="large" />
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

      <div v-if="queue.length > 0" :class="bemm('queue')">
        <h3>{{ t('admin.upload.uploadQueue') }}</h3>
        <div :class="bemm('queue-items')">
          <div
            v-for="item in queue"
            :key="item.id"
            :class="bemm('queue-item',['', item.status, item.isDuplicate ? 'duplicate': ''])"
          >
            <img v-if="item.preview" :src="item.preview" :alt="item.file.name" />
            <div :class="bemm('queue-item-info')">
              <p :class="bemm('queue-item-name')">{{ item.file.name }}</p>
              <p :class="bemm('queue-item-size')">{{ formatBytes(item.file.size) }}</p>
              <p v-if="item.isDuplicate" :class="bemm('queue-item-warning')">
                <TIcon :name="Icons.EXCLAMATION_MARK_M" size="small" />
                {{ item.duplicateWarning }}
              </p>
            </div>
            <div :class="bemm('queue-item-actions')">
              <div :class="bemm('queue-item-status')">
                <TSpinner v-if="item.status === 'uploading'" size="small" />
                <TActionIcon v-else-if="item.status === 'success'" :name="Icons.CHECK_M" color="success" />
                <TActionIcon v-else-if="item.status === 'pending'" :name="Icons.THREE_DOTS_HORIZONTAL" color="primary" />
                <TActionIcon v-else-if="item.status === 'error'" :name="Icons.CLOSE" color="error" />
              </div>
              <TButton
                v-if="item.status === 'pending' || item.status === 'error'"
                type="ghost"
                size="small"
                :icon="Icons.MULTIPLY_M"
                @click="removeFromQueue(item.id)"
                :title="t('common.remove')"
              />
            </div>
          </div>
        </div>
        <div :class="bemm('actions')">
          <TButton
            color="primary"
            :disabled="isUploading || pendingItems.length === 0"
            @click="startUpload()"
          >
            {{ t('admin.upload.startUpload') }}
          </TButton>
          <TButton
            v-if="successItems.length > 0"
            color="success"
            @click="clearSuccessful()"
          >
            {{ t('admin.upload.clearSuccessful') }}
          </TButton>
          <TButton
            v-if="hasDuplicates"
            color="warning"
            :icon="Icons.EXCLAMATION_MARK_M"
            @click="removeDuplicates()"
          >
            {{ t('admin.upload.removeDuplicates') }} ({{ duplicateCount }})
          </TButton>
          <TButton
            color="secondary"
            @click="clearAll()"
          >
            {{ t('admin.upload.clearQueue') }}
          </TButton>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, computed } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'
import { TCard, TButton, TIcon, TActionIcon, TSpinner } from '@tiko/ui'
import { Icons } from 'open-icon'
import { useImages, useUpload } from '@tiko/core'
import type { ToastService } from '@tiko/ui'
import { uploadService } from '../services/upload.service'

const bemm = useBemm('upload-view')
const { t } = useI18n()
const toastService = inject<ToastService>('toastService')
const { imageList, loadImages } = useImages()
const {
  queue,
  addToQueue,
  removeFromQueue,
  startUpload,
  clearSuccessful,
  clearAll,
  removeDuplicates,
  isUploading,
  pendingItems,
  successItems,
  duplicateItems
} = useUpload(uploadService, toastService)

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

// Computed for safe duplicate item access
const duplicateCount = computed(() => duplicateItems?.value?.length || 0)
const hasDuplicates = computed(() => duplicateCount.value > 0)

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
    addToQueue(Array.from(input.files), checkForDuplicates)
    // Reset input so same file can be selected again
    input.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (imageFiles.length > 0) {
    addToQueue(imageFiles, checkForDuplicates)
  } else {
    toastService?.show({
      message: t('admin.upload.onlyImages'),
      type: 'error'
    })
  }
}

const checkForDuplicates = (filename: string): boolean => {
  return imageList.value.some(media =>
    media.original_filename?.toLowerCase() === filename.toLowerCase()
  )
}

// Load existing images on mount to check for duplicates
onMounted(() => {
  loadImages()
})
</script>

<style lang="scss">
.upload-view {
  padding: var(--space);
  padding-bottom: 200px;

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
      opacity: 0.7;
    }
    &--uploading {
      opacity: 1;
      border-color: var(--color-primary);
      background-color: var(--color-primary-alpha-10);
    }
    &--success {
      opacity: 1;
     border-color: var(--color-success)
    }
    &--error {
      opacity: 1;
     border-color: var(--color-error)
    }
    &--duplicate {
      border-color: var(--color-warning);
      background-color: var(--color-warning-alpha-10);
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

  &__queue-item-actions {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  &__queue-item-info {
    flex: 1;
  }

  &__queue-item-warning {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-warning);
    font-size: var(--font-size-s);
    margin-top: var(--space-xs);
  }

  &__queue-item-name {
    font-weight: 500;
  }

  &__queue-item-size {
    font-size: var(--font-size-s);
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    gap: var(--space);
  }
}
</style>
