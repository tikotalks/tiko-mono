<template>
  <div :class="bemm()">
    <h2 :class="bemm('title')">{{ t('radio.editAudioTrack') }}</h2>
    <form @submit.prevent="handleSubmit" :class="bemm('form')">
      <div :class="bemm('field')">
        <TInputText
          v-model="form.title"
          :label="t('radio.title')"
          :placeholder="t('radio.audioTrackTitle')"
          required
          :error="errors.title"
          :class="bemm('input')"
        />
      </div>

      <!-- Description Input -->
      <div :class="bemm('field')">
        <TTextArea
          v-model="form.description"
          :label="t('radio.description')"
          :placeholder="t('radio.descriptionPlaceholder')"
          :class="bemm('textarea')"
          :error="errors.description"
        />
      </div>

      <!-- Custom Thumbnail URL -->
      <div :class="bemm('field')">
        <TInputText
          v-model="form.customThumbnailUrl"
          :label="t('radio.customThumbnailUrl')"
          :placeholder="t('radio.thumbnailPlaceholder')"
          type="url"
          :error="errors.customThumbnailUrl"
          :class="bemm('input')"
        />
        <p :class="bemm('help')">
          {{ t('radio.leaveEmptyThumbnail') }}
        </p>
      </div>

      <!-- Tags Input -->
      <div :class="bemm('field')">
        <label :class="bemm('label')">{{ t('radio.tags') }}</label>
        <div :class="bemm('tags-input')">
          <TInputText
            v-model="tagInput"
            :label="t('radio.tags')"
            :placeholder="t('radio.addTag')"
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
            {{ t('radio.add') }}
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

      <!-- Favorite Toggle -->
      <div :class="bemm('field')">
        <label :class="bemm('checkbox-label')">
          <input
            type="checkbox"
            v-model="form.isFavorite"
            :class="bemm('checkbox')"
          />
          <TIcon
            :name="form.isFavorite ? 'heart' : 'heart'"
            :class="bemm('checkbox-icon', { active: form.isFavorite })"
          />
          {{ t('radio.markAsFavorite') }}
        </label>
      </div>

      <!-- Preview Section -->
      <div :class="bemm('preview')">
        <h3 :class="bemm('preview-title')">{{ t('common.preview') }}</h3>
        <div :class="bemm('preview-content')">
          <img
            :src="previewThumbnail"
            :alt="form.title"
            :class="bemm('preview-thumbnail')"
            @error="handleThumbnailError"
          />
          <div :class="bemm('preview-info')">
            <h4 :class="bemm('preview-name')">{{ form.title || t('radio.untitled') }}</h4>
            <p v-if="form.description" :class="bemm('preview-description')">
              {{ form.description }}
            </p>
            <div :class="bemm('preview-meta')">
              <span :class="bemm('preview-type')">
                {{ item.videoType.toUpperCase() }}
              </span>
              <span v-if="item.durationSeconds" :class="bemm('preview-duration')">
                {{ formatDuration(item.durationSeconds) }}
              </span>
              <span :class="bemm('preview-plays')">
                {{ formatPlayCount(item.playCount) }}
              </span>
              <span v-if="form.isFavorite" :class="bemm('preview-favorite')">
                <TIcon name="heart" /> {{ t('radio.favorite') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Video URL Display (Read-only) -->
      <div :class="bemm('field')">
        <label :class="bemm('label')">{{ t('radio.videoUrlReadonly') }}</label>
        <div :class="bemm('readonly-url')">
          <span :class="bemm('url-text')">{{ item.videoUrl }}</span>
          <TButton
            type="ghost"
            size="small"
            icon="external-link"
            @click="openUrl(item.videoUrl)"
          >
            {{ t('radio.openUrl') }}
          </TButton>
        </div>
        <p :class="bemm('help')">
          {{ t('radio.videoUrlCannotChange') }}
        </p>
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
          {{ t('common.cancel') }}
        </TButton>

        <TButton
          color="primary"
          :loading="submitting"
          :disabled="!isFormValid || !hasChanges"
        >
          {{ t('common.saveChanges') }}
        </TButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBemm } from 'bemm'
import { TInputText, TButton, TIcon, TTextArea } from '@tiko/ui'
import { useI18n } from '@tiko/core';

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
import type { RadioItem, UpdateRadioItemPayload } from '../types/radio.types'

interface Props {
  item: RadioItem
  onSubmit?: (itemId: string, updates: Partial<RadioItem>) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [itemId: string, updates: UpdateRadioItemPayload]
}>()

const bemm = useBemm('edit-item-modal')
const { t, keys } = useI18n()

// Form state
const form = ref({
  title: '',
  description: '',
  customThumbnailUrl: '',
  tags: [] as string[],
  isFavorite: false
})

const originalForm = ref({ ...form.value })
const tagInput = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)

// Form validation
const errors = ref<Partial<Record<keyof typeof form.value, string>>>({})

// Computed properties
const isFormValid = computed(() => {
  return form.value.title.trim() && !Object.keys(errors.value).length
})

const hasChanges = computed(() => {
  return (
    form.value.title !== originalForm.value.title ||
    form.value.description !== originalForm.value.description ||
    form.value.customThumbnailUrl !== originalForm.value.customThumbnailUrl ||
    form.value.isFavorite !== originalForm.value.isFavorite ||
    JSON.stringify(form.value.tags) !== JSON.stringify(originalForm.value.tags)
  )
})

const previewThumbnail = computed(() => {
  return form.value.customThumbnailUrl || props.item.thumbnailUrl || '/assets/default-radio-thumbnail.svg'
})

/**
 * Initialize form with item data
 */
const initializeForm = () => {
  form.value = {
    title: props.item.title,
    description: props.item.description || '',
    customThumbnailUrl: props.item.customThumbnailUrl || '',
    tags: [...props.item.tags],
    isFavorite: props.item.isFavorite
  }

  originalForm.value = { ...form.value }
}

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
 * Format play count for display
 */
const formatPlayCount = (count: number): string => {
  if (count === 0) return t('radio.neverPlayed')
  if (count === 1) return t('radio.onePlay')
  if (count < 1000) return `${count} ${t('radio.plays')}`
  if (count < 1000000) return `${Math.floor(count / 100) / 10}K ${t('radio.plays')}`
  return `${Math.floor(count / 100000) / 10}M ${t('radio.plays')}`
}

/**
 * Open URL in new tab
 */
const openUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
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
    errors.value.title = t('radio.titleRequired')
  }

  // Validate custom thumbnail URL if provided
  if (form.value.customThumbnailUrl?.trim()) {
    try {
      new URL(form.value.customThumbnailUrl)
    } catch {
      errors.value.customThumbnailUrl = t('radio.pleaseEnterValidThumbnailUrl')
    }
  }

  return Object.keys(errors.value).length === 0
}

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  if (!validateForm() || !hasChanges.value) return

  submitting.value = true
  submitError.value = null

  try {
    const updates: UpdateRadioItemPayload = {}

    // Only include changed fields
    if (form.value.title !== originalForm.value.title) {
      updates.title = form.value.title.trim()
    }

    if (form.value.description !== originalForm.value.description) {
      updates.description = form.value.description.trim()
    }

    if (form.value.customThumbnailUrl !== originalForm.value.customThumbnailUrl) {
      updates.custom_thumbnail_url = form.value.customThumbnailUrl?.trim() || null
    }

    if (form.value.isFavorite !== originalForm.value.isFavorite) {
      updates.is_favorite = form.value.isFavorite
    }

    if (JSON.stringify(form.value.tags) !== JSON.stringify(originalForm.value.tags)) {
      updates.tags = form.value.tags
    }

    if (props.onSubmit) {
      props.onSubmit(props.item.id, updates)
    } else {
      emit('submit', props.item.id, updates)
    }
  } catch (err) {
    console.error('Failed to submit form:', err)
    submitError.value = t('radio.failedToSaveChanges')
  } finally {
    submitting.value = false
  }
}

// Initialize form on mount
onMounted(() => {
  initializeForm()
})
</script>

<style lang="scss">
.edit-item-modal {
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

  &__textarea {
    width: 100%;
    padding: var(--space-md, 1em);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-radius: var(--border-radius, 0.75em);
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: inherit;
    font-size: 1em;
    line-height: 1.4;
    resize: vertical;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    &::placeholder {
      color: color-mix(in srgb, var(--color-foreground), transparent 60%);
    }
  }

  &__checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-s, 0.75em);
    cursor: pointer;
    font-weight: 500;
    color: var(--color-foreground);
  }

  &__checkbox {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__checkbox-icon {
    color: color-mix(in srgb, var(--color-foreground), transparent 60%);
    transition: color 0.2s ease;

    &--active {
      color: var(--color-error);
    }
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

  &__readonly-url {
    display: flex;
    align-items: center;
    gap: var(--space-md, 1em);
    padding: var(--space-md, 1em);
    background: color-mix(in srgb, var(--color-foreground), transparent 95%);
    border: 1px solid color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-radius: var(--border-radius, 0.75em);
  }

  &__url-text {
    flex: 1;
    font-family: monospace;
    font-size: 0.875em;
    color: color-mix(in srgb, var(--color-foreground), transparent 20%);
    word-break: break-all;
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
    border-radius: var(--border-radius, 0.25em);
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
    flex-wrap: wrap;
    gap: var(--space-md, 1em);
    font-size: 0.8em;
  }

  &__preview-type {
    background: color-mix(in srgb, var(--color-secondary), transparent 90%);
    color: color-mix(in srgb, var(--color-secondary), var(--color-foreground) 20%);
    padding: var(--space-xs, 0.25em) var(--space-s, 0.5em);
    border-radius: var(--border-radius, 0.25em);
    font-weight: 600;
    text-transform: uppercase;
  }

  &__preview-duration,
  &__preview-plays {
    color: color-mix(in srgb, var(--color-foreground), transparent 40%);
  }

  &__preview-favorite {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.25em);
    color: var(--color-error);
    font-weight: 500;
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
  .edit-item-modal {
    &__tags-input {
      flex-direction: column;
      align-items: stretch;
    }

    &__readonly-url {
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
