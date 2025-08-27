<template>
  <div class="asset-detail-dialog">

        <div class="asset-preview">
          <img
            v-if="asset.mime_type.startsWith('image/')"
            :src="getAssetUrl()"
            :alt="asset.title"
          />
          <div v-else class="file-icon">
            <TIcon
              :name="getFileTypeIcon(asset.mime_type)"
              size="xl"
            />
          </div>
        </div>

        <div class="asset-details">
          <form @submit.prevent="handleUpdate" class="edit-form">
              <TInputText
                label="Title *"
                v-model="form.title"
                placeholder="Enter a descriptive title"
                required
              />

              <TInputTextArea
              label="Description"
                v-model="form.description"
                placeholder="Optional description for this asset"
                :rows="3"
              />

                <TInputText
                  :label="'Categories'"
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


                <TInputCheckbox
                  type="checkbox"
                  v-model="form.isPublic"
                  :label="' Make this asset publicly accessible'"
                  :description="'Public assets can be used by anyone in your organization'"
                />

            <!-- Submit button -->
            <div class="form-actions">
              <TButton
                htmlButtonType="submit"
                color="primary"
                :icon="Icons.CHECK_M"
                :loading="updating"
              >
                Save Changes
              </TButton>
            </div>
          </form>

          <!-- File Information -->
          <div class="file-info">
            <h3>File Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Filename</label>
                <span>{{ asset.filename }}</span>
              </div>
              <div class="info-item">
                <label>Original Name</label>
                <span>{{ asset.original_filename }}</span>
              </div>
              <div class="info-item">
                <label>File Size</label>
                <span>{{ formatFileSize(asset.file_size) }}</span>
              </div>
              <div class="info-item">
                <label>Type</label>
                <span>{{ asset.mime_type }}</span>
              </div>
              <div v-if="asset.width && asset.height" class="info-item">
                <label>Dimensions</label>
                <span>{{ asset.width }} × {{ asset.height }}px</span>
              </div>
              <div v-if="asset.duration" class="info-item">
                <label>Duration</label>
                <span>{{ formatDuration(asset.duration) }}</span>
              </div>
              <div class="info-item">
                <label>Created</label>
                <span>{{ formatDate(asset.created_at) }}</span>
              </div>
              <div class="info-item">
                <label>Updated</label>
                <span>{{ formatDate(asset.updated_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Asset URL -->
          <div class="asset-urls">
            <h3>Asset URLs</h3>
            <div class="url-group">
              <label>Direct URL</label>
              <div class="url-input">
                <input
                  :value="getAssetUrl()"
                  readonly
                  @click="$event.target.select()"
                />
                <TButton
                  :icon="Icons.COPY"
                  type="ghost"
                  size="small"
                  @click="copyToClipboard(getAssetUrl())"
                />
              </div>
            </div>

            <div v-if="asset.mime_type.startsWith('image/')" class="url-group">
              <label>Optimized URL (300px)</label>
              <div class="url-input">
                <input
                  :value="getOptimizedUrl()"
                  readonly
                  @click="$event.target.select()"
                />
                <TButton
                  :icon="Icons.COPY"
                  type="ghost"
                  size="small"
                  @click="copyToClipboard(getOptimizedUrl())"
                />
              </div>
            </div>

            <div class="url-group">
              <label>Asset ID</label>
              <div class="url-input">
                <input
                  :value="asset.id"
                  readonly
                  @click="$event.target.select()"
                />
                <TButton
                  :icon="Icons.COPY"
                  type="ghost"
                  size="small"
                  @click="copyToClipboard(asset.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TButton, TInput, TIcon, TSpinner, TInputText, TInputTextArea, TInputCheckbox } from '@tiko/ui'
import { Icons } from 'open-icon'
import { assetsService, type Asset } from '../services/assets.service'
import { formatDate, formatDuration, formatFileSize } from '@tiko/core';

const props = defineProps<{
  asset: Asset
  onUpdated?: (asset: Asset) => void
  onDeleted?: (asset: Asset) => void
}>()

// State
const updating = ref(false)
const deleting = ref(false)

const form = ref({
  title: '',
  description: '',
  categories: [] as string[],
  tags: [] as string[],
  isPublic: false
})

const categoriesInput = ref('')
const tagsInput = ref('')

// Methods
const getAssetUrl = () => {
  return assetsService.getAssetUrl(props.asset)
}

const getOptimizedUrl = () => {
  return assetsService.getOptimizedUrl(props.asset, { width: 300, format: 'webp' })
}

const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return Icons.IMAGE
  if (mimeType.startsWith('video/')) return Icons.FILM
  if (mimeType.startsWith('audio/')) return Icons.MUSIC
  if (mimeType.includes('pdf')) return 'file-pdf'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-document'
  return Icons.FILE
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // TODO: Show success notification
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

const handleUpdate = async () => {
  updating.value = true

  try {
    const updatedAsset = await assetsService.updateAsset(props.asset.id, {
      title: form.value.title,
      description: form.value.description || undefined,
      categories: form.value.categories,
      tags: form.value.tags,
      isPublic: form.value.isPublic
    })

    props.onUpdated?.(updatedAsset)
  } catch (error) {
    console.error('Update failed:', error)
    // TODO: Show error notification
  } finally {
    updating.value = false
  }
}

const handleDelete = async () => {
  if (!confirm(`Are you sure you want to delete "${props.asset.title}"? This action cannot be undone.`)) {
    return
  }

  deleting.value = true

  try {
    await assetsService.deleteAsset(props.asset.id)
    props.onDeleted?.(props.asset)
  } catch (error) {
    console.error('Delete failed:', error)
    // TODO: Show error notification
  } finally {
    deleting.value = false
  }
}

// Initialize form
onMounted(() => {
  form.value = {
    title: props.asset.title,
    description: props.asset.description || '',
    categories: [...(props.asset.categories || [])],
    tags: [...(props.asset.tags || [])],
    isPublic: props.asset.is_public
  }

  categoriesInput.value = props.asset.categories?.join(', ') || ''
  tagsInput.value = props.asset.tags?.join(', ') || ''
})
</script>

<style scoped>
.asset-detail-dialog {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  padding: 1.5rem;
}

.asset-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-50);
  border-radius: 0.75rem;
  min-height: 200px;
}

.asset-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 0.5rem;
}

.file-icon {
  color: var(--color-text-secondary);
}

.asset-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.edit-form {
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

.file-info h3,
.asset-urls h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.info-item span {
  font-size: 0.875rem;
  word-break: break-all;
}

.url-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.url-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.url-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.url-input input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  background: var(--color-gray-50);
}


@media (max-width: 768px) {
  .dialog-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .form-row,
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
