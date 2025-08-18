<template>
  <div class="asset-upload-dialog">

        <!-- File Drop Zone -->
        <div
          class="file-drop-zone"
          :class="{
            'drag-over': isDragging,
            'has-file': selectedFile
          }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            @change="handleFileSelect"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            hidden
          />

          <div v-if="!selectedFile" class="drop-zone-content">
            <TIcon :name="Icons.UPLOAD" size="xl" />
            <h3>Drop your file here</h3>
            <p>Or click to browse files</p>
            <small>Supports images, videos, audio, and documents</small>
          </div>

          <div v-else class="selected-file">
            <div class="file-preview">
              <img
                v-if="filePreview && selectedFile.type.startsWith('image/')"
                :src="filePreview"
                :alt="selectedFile.name"
              />
              <TIcon
                v-else
                :name="getFileTypeIcon(selectedFile.type)"
                size="xl"
              />
            </div>

            <div class="file-info">
              <h4>{{ selectedFile.name }}</h4>
              <p>{{ formatFileSize(selectedFile.size) }} • {{ selectedFile.type }}</p>
            </div>

            <TButton
              :icon="Icons.X"
              type="ghost"
              size="small"
              @click.stop="clearFile"
            />
          </div>
        </div>

        <!-- File Metadata Form -->
        <form v-if="selectedFile" @submit.prevent="handleUpload" class="metadata-form">
          <div class="form-group">
            <label>Title *</label>
            <TInputText
              v-model="form.title"
              placeholder="Enter a descriptive title"
              required
            />
          </div>

            <TInputTextArea
              label="Description"
              v-model="form.description"
              placeholder="Optional description for this asset"
              :rows="3"
            />

          <div class="form-row">
              <TInputText
              label="Categories"
                v-model="categoriesInput"
                @input="updateCategories"
                placeholder="e.g., icons, backgrounds"
                :description="'Separate multiple categories with commas'"
              />
              <TInputText
                label="Tags"
                v-model="tagsInput"
                @input="updateTags"
                placeholder="e.g., blue, nature, button"
                :description="'Separate multiple tags with commas'"
              />

          </div>

            <TInputCheckbox
              v-model="form.isPublic"
              label="Make this asset publicly accessible"
              description="Public assets can be used by anyone in your organization"
            />


          <!-- Submit button -->
          <div class="form-actions">
            <TButton
              htmlButtonType="submit"
              color="primary"
              :icon="Icons.ARROW_UPLOAD"
              :status="uploading"
              :disabled="!selectedFile || !form.title"
            >
              Upload Asset
            </TButton>
          </div>
        </form>
      </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TButton, TInput, TIcon, TSpinner, TInputText, TInputTextArea, TInputCheckbox, Status } from '@tiko/ui'
import { Icons } from 'open-icon'
import { assetsService, type Asset } from '../services/assets.service'

const props = defineProps<{
  onUploaded?: (asset: Asset) => void
}>()

// State
const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)
const isDragging = ref(false)
const uploading = ref<Status>(Status.IDLE)
const fileInput = ref<HTMLInputElement>()

const form = ref({
  title: '',
  description: '',
  categories: [] as string[],
  tags: [] as string[],
  isPublic: true
})

const categoriesInput = ref('')
const tagsInput = ref('')

// Methods
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    setSelectedFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    setSelectedFile(file)
  }
}

const setSelectedFile = (file: File) => {
  selectedFile.value = file

  // Set default title from filename
  if (!form.value.title) {
    form.value.title = file.name.replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  // Generate preview for images
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    filePreview.value = null
  }
}

const clearFile = () => {
  selectedFile.value = null
  filePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  form.value = {
    title: '',
    description: '',
    categories: [],
    tags: [],
    isPublic: true
  }
  categoriesInput.value = ''
  tagsInput.value = ''
}

const updateCategories = () => {
  form.value.categories = categoriesInput.value
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0)
}

const updateTags = () => {
  form.value.tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
}

const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return Icons.IMAGE
  if (mimeType.startsWith('video/')) return Icons.FILM
  if (mimeType.startsWith('audio/')) return Icons.MUSIC
  if (mimeType.includes('pdf')) return 'file-pdf'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-document'
  return Icons.FILE
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (!selectedFile.value || !form.value.title) return

  uploading.value = Status.LOADING

  try {
    const asset = await assetsService.uploadAsset({
      file: selectedFile.value,
      title: form.value.title,
      description: form.value.description || undefined,
      categories: form.value.categories,
      tags: form.value.tags,
      isPublic: form.value.isPublic
    })

    props.onUploaded?.(asset)
  } catch (error) {
    console.error('Upload failed:', error)
    // TODO: Show error notification
  } finally {
    uploading.value = Status.IDLE
  }
}
</script>

<style scoped>
.asset-upload-dialog {
  padding: 1.5rem;
}

.file-drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.file-drop-zone.has-file {
  border-style: solid;
  padding: 1rem;
}

.drop-zone-content h3 {
  margin: 1rem 0 0.5rem;
  color: var(--color-text-primary);
}

.drop-zone-content p {
  margin: 0 0 1rem;
  color: var(--color-text-secondary);
}

.drop-zone-content small {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.file-preview {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: var(--color-gray-50);
  overflow: hidden;
  flex-shrink: 0;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-info h4 {
  margin: 0 0 0.25rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.metadata-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-family: inherit;
}

.form-group small {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.checkbox-label {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

</style>
