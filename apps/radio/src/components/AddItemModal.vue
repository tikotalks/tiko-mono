<template>
  <div :class="bemm()">
    <h2 :class="bemm('title')">Add Audio Track</h2>
    <form @submit.prevent="handleSubmit" :class="bemm('form')">
      <div :class="bemm('field')">
        <TInputText
          label="Video URL"
          v-model="form.videoUrl"
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          type="url"
          required
          :error="errors.videoUrl"
          :class="bemm('input')"
          @blur="extractMetadata"
        />
        <p :class="bemm('help')">
          Paste a YouTube, Vimeo, or direct video URL. Audio will be extracted for playback.
        </p>
      </div>

      <!-- Title Input -->
      <div :class="bemm('field')">
        <TInputText
          label="title"
          v-model="form.title"
          placeholder="My awesome audio track"
          required
          :error="errors.title"
          :class="bemm('input')"
        />
      </div>

      <!-- Description Input -->
      <div :class="bemm('field')">
        <TTextArea
          v-model="form.description"
          label="Description"
          placeholder="Optional description..."
          :class="bemm('textarea')"
          :error="errors.description"
        />
      </div>

      <!-- Custom Thumbnail URL -->
      <div :class="bemm('field')">
        <TInputText
          label="Custom Thumbnail URL"
          v-model="form.customThumbnailUrl"
          placeholder="https://example.com/thumbnail.jpg"
          type="url"
          :class="bemm('input')"
        />
        <p :class="bemm('help')">
          Leave empty to use automatically detected thumbnail
        </p>
      </div>

      <!-- Tags Input -->
      <div :class="bemm('field')">
        <div :class="bemm('tags-input')">
          <TInputText
            label="Tags"
            v-model="tagInput"
            placeholder="Add a tag and press Enter"
            @keydown.enter.prevent="addTag"
            :class="bemm('tag-input')"
          />
          <TButton
            type="ghost"
            size="small"
            icon="plus"
            @click="addTag"
            :disabled="!tagInput.trim()"
          >
            Add
          </TButton>
        </div>

        <!-- Tag Pills -->
        <div v-if="form.tags.length > 0" :class="bemm('tags')">
          <span
            v-for="(tag, index) in form.tags"
            :key="`${tag}-${index}`"
            :class="bemm('tag')"
          >
            {{ tag }}
            <TButton
              type="ghost"
              size="small"
              icon="x"
              @click="removeTag(index)"
              :class="bemm('tag-remove')"
            />
          </span>
        </div>
      </div>

      <!-- Preview Section -->
      <div v-if="showPreview" :class="bemm('preview')">
        <h3 :class="bemm('preview-title')">Preview</h3>
        <div :class="bemm('preview-content')">
          <img
            v-if="previewThumbnail"
            :src="previewThumbnail"
            :alt="form.title"
            :class="bemm('preview-thumbnail')"
            @error="handleThumbnailError"
          />
          <div :class="bemm('preview-info')">
            <h4 :class="bemm('preview-name')">{{ form.title || 'Untitled' }}</h4>
            <p v-if="form.description" :class="bemm('preview-description')">
              {{ form.description }}
            </p>
            <div v-if="detectedMetadata" :class="bemm('preview-meta')">
              <span v-if="detectedMetadata.videoType" :class="bemm('preview-type')">
                {{ detectedMetadata.videoType.toUpperCase() }}
              </span>
              <span v-if="detectedMetadata.durationSeconds" :class="bemm('preview-duration')">
                {{ formatDuration(detectedMetadata.durationSeconds) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="submitError" :class="bemm('error')">
        <TIcon name="alert-circle" :class="bemm('error-icon')" />
        <span>{{ submitError }}</span>
      </div>

      <!-- Action Buttons -->
      <div :class="bemm('actions')">
        <TButton
          type="ghost"
          @click="emit('close')"
          :disabled="submitting"
        >
          Cancel
        </TButton>

        <TButton
          color="primary"
          htmlButtonType="submit"
          :loading="submitting"
          :disabled="!isFormValid"
        >
          Add Audio Track
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { TInputText, TButton, TIcon, TTextArea } from '@tiko/ui'

// Local utility function for formatting duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
import type { AddRadioItemForm, VideoMetadata, RadioItem } from '../types/radio.types'

interface Props {
  onSubmit?: (data: Partial<RadioItem>) => void
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
  close: []
  submit: [data: Partial<RadioItem>]
}>()

const bemm = useBemm('add-item-modal')

// Form state
const form = ref<AddRadioItemForm>({
  title: '',
  description: '',
  videoUrl: '',
  customThumbnailUrl: '',
  tags: []
})

const tagInput = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)
const extractingMetadata = ref(false)
const detectedMetadata = ref<VideoMetadata | null>(null)

// Form validation
const errors = ref<Partial<Record<keyof AddRadioItemForm, string>>>({})

// Computed properties
const isFormValid = computed(() => {
  return form.value.title.trim() && form.value.videoUrl.trim() && !Object.keys(errors.value).length
})

const showPreview = computed(() => {
  return form.value.title.trim() && form.value.videoUrl.trim()
})

const previewThumbnail = computed(() => {
  return form.value.customThumbnailUrl || detectedMetadata.value?.thumbnailUrl
})

/**
 * Add tag to the list
 */
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagInput.value = ''
  }
}

/**
 * Remove tag from the list
 */
const removeTag = (index: number) => {
  form.value.tags.splice(index, 1)
}

/**
 * Extract metadata from video URL
 */
const extractMetadata = async () => {
  if (!form.value.videoUrl.trim()) {
    detectedMetadata.value = null
    return
  }

  extractingMetadata.value = true

  try {
    const metadata = await extractVideoMetadata(form.value.videoUrl)
    detectedMetadata.value = metadata

    // Auto-fill title if empty and metadata has title
    if (!form.value.title.trim() && metadata.title) {
      form.value.title = metadata.title
    }
  } catch (err) {
    console.warn('Failed to extract metadata:', err)
  } finally {
    extractingMetadata.value = false
  }
}

/**
 * Extract video metadata from URL
 */
const extractVideoMetadata = async (url: string): Promise<VideoMetadata> => {
  const metadata: VideoMetadata = {
    videoType: 'url'
  }

  try {
    // YouTube URL detection
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      metadata.videoType = 'youtube'
      const videoId = youtubeMatch[1]
      metadata.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

      // Try to get title from YouTube API or page scraping
      // For now, we'll leave it empty and let user fill it
    }

    // Vimeo URL detection
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      metadata.videoType = 'vimeo'
      // In a real implementation, you'd use Vimeo API
    }

    // Local file detection
    if (url.startsWith('file://') || url.includes('localhost') || url.includes('127.0.0.1')) {
      metadata.videoType = 'local'
    }

  } catch (err) {
    console.warn('Failed to extract video metadata:', err)
  }

  return metadata
}

/**
 * Handle thumbnail load error
 */
const handleThumbnailError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/assets/default-radio-thumbnail.svg'
}

/**
 * Validate form fields
 */
const validateForm = (): boolean => {
  errors.value = {}

  // Validate title
  if (!form.value.title.trim()) {
    errors.value.title = 'Title is required'
  }

  // Validate video URL
  if (!form.value.videoUrl.trim()) {
    errors.value.videoUrl = 'Video URL is required'
  } else {
    try {
      new URL(form.value.videoUrl)
    } catch {
      errors.value.videoUrl = 'Please enter a valid URL'
    }
  }

  // Validate custom thumbnail URL if provided
  if (form.value.customThumbnailUrl?.trim()) {
    try {
      new URL(form.value.customThumbnailUrl)
    } catch {
      errors.value.customThumbnailUrl = 'Please enter a valid thumbnail URL'
    }
  }

  return Object.keys(errors.value).length === 0
}

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  submitting.value = true
  submitError.value = null

  try {
    const itemData: Partial<RadioItem> = {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
      videoUrl: form.value.videoUrl.trim(),
      customThumbnailUrl: form.value.customThumbnailUrl?.trim() || undefined,
      tags: form.value.tags,
      // Add detected metadata if available
      ...(detectedMetadata.value && {
        videoType: detectedMetadata.value.videoType,
        thumbnailUrl: detectedMetadata.value.thumbnailUrl,
        durationSeconds: detectedMetadata.value.durationSeconds
      })
    }

    if (props.onSubmit) {
      props.onSubmit(itemData)
    } else {
      emit('submit', itemData)
    }
  } catch (err) {
    console.error('Failed to submit form:', err)
    submitError.value = 'Failed to add audio track. Please try again.'
  } finally {
    submitting.value = false
  }
}

// Watch for URL changes to auto-extract metadata
watch(() => form.value.videoUrl, extractMetadata, { debounce: 500 })
</script>

<style lang="scss" scoped>
.add-item-modal {
  width: 100%;
  max-width: 600px;
  padding: var(--space-lg, 1.5em);

  &__title {
    font-size: 1.5em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-lg, 1.5em) 0;
    text-align: center;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 1.5em);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-s, 0.75em);
  }

  &__label {
    font-weight: 600;
    color: var(--color-foreground);
    font-size: 0.875em;
  }

  &__help {
    font-size: 0.8em;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
    margin: 0;
    line-height: 1.4;
  }

  &__tags-input {
    display: flex;
    gap: var(--space-s, 0.75em);
    align-items: flex-end;
  }

  &__tag-input {
    flex: 1;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s, 0.75em);
    margin-top: var(--space-s, 0.75em);
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.5em);
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
    color: color-mix(in srgb, var(--color-primary), var(--color-foreground) 20%);
    padding: var(--space-xs, 0.5em) var(--space-s, 0.75em);
    border-radius: var(--border-radius, 0.75em);
    font-size: 0.875em;
    font-weight: 500;
  }

  &__tag-remove {
    width: 1.25em;
    height: 1.25em;
    min-width: auto;
    min-height: auto;
    padding: 0;
  }

  &__preview {
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-radius: var(--border-radius, 0.75em);
    padding: var(--space-lg, 1.5em);
    background: color-mix(in srgb, var(--color-foreground), transparent 97%);
  }

  &__preview-title {
    font-size: 1em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-md, 1em) 0;
  }

  &__preview-content {
    display: flex;
    gap: var(--space-md, 1em);
    align-items: flex-start;
  }

  &__preview-thumbnail {
    width: 6em;
    height: 6em;
    object-fit: cover;
    border-radius: var(--radius-sm, 0.25em);
    flex-shrink: 0;
  }

  &__preview-info {
    flex: 1;
    min-width: 0;
  }

  &__preview-name {
    font-size: 1em;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-s, 0.75em) 0;
    line-height: 1.3;
  }

  &__preview-description {
    font-size: 0.875em;
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    line-height: 1.4;
    margin: 0 0 var(--space-s, 0.75em) 0;
  }

  &__preview-meta {
    display: flex;
    gap: var(--space-md, 1em);
    font-size: 0.8em;
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__preview-type {
    background: color-mix(in srgb, var(--color-secondary), transparent 90%);
    color: color-mix(in srgb, var(--color-secondary), var(--color-foreground) 20%);
    padding: var(--space-xs, 0.25em) var(--space-s, 0.5em);
    border-radius: var(--radius-sm, 0.25em);
    font-weight: 600;
    text-transform: uppercase;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: var(--space-s, 0.75em);
    padding: var(--space-md, 1em);
    background: color-mix(in srgb, var(--color-error), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
    border-radius: var(--border-radius, 0.75em);
    color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
    font-size: 0.875em;
  }

  &__error-icon {
    color: var(--color-error);
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    gap: var(--space-md, 1em);
    justify-content: flex-end;
    padding-top: var(--space-lg, 1.5em);
    border-top: 1px solid color-mix(in srgb, var(--color-foreground), transparent 90%);
  }
}

// Responsive design
@media (max-width: 768px) {
  .add-item-modal {
    &__tags-input {
      flex-direction: column;
      align-items: stretch;
    }

    &__preview-content {
      flex-direction: column;
    }

    &__preview-thumbnail {
      width: 100%;
      height: 8em;
      align-self: center;
    }

    &__actions {
      flex-direction: column-reverse;
    }
  }
}
</style>
