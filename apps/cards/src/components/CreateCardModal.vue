<template>
  <div :class="bemm()" @click.self="$emit('close')">
    <div :class="bemm('dialog')" role="dialog" aria-labelledby="modal-title">
      <!-- Header -->
      <header :class="bemm('header')">
        <h2 id="modal-title" :class="bemm('title')">Create New Card</h2>
        <TButton
          :class="bemm('close-button')"
          color="secondary"
          icon="x"
          @click="$emit('close')"
          aria-label="Close modal"
        />
      </header>

      <!-- Form -->
      <form :class="bemm('form')" @submit.prevent="handleSubmit">
        <!-- Card Preview -->
        <div :class="bemm('preview-section')">
          <h3 :class="bemm('section-title')">Preview</h3>
          <div :class="bemm('preview')">
            <TCardCommunication
              :card="previewCard"
              :show-label="true"
              size="medium"
            />
          </div>
        </div>

        <!-- Basic Information -->
        <div :class="bemm('section')">
          <h3 :class="bemm('section-title')">Basic Information</h3>

          <TInput
            v-model="form.label"
            label="Card Label"
            placeholder="e.g., Water, Happy, Help"
            required
            :class="bemm('field')"
          />

          <TInput
            v-model="form.audioText"
            label="Audio Text"
            placeholder="What should be spoken when tapped"
            required
            :class="bemm('field')"
          />

          <TInput
            v-model="tagInput"
            label="Tags"
            placeholder="e.g., food, emotion, need (comma separated)"
            :class="bemm('field')"
            @blur="updateTags"
          />

          <div v-if="form.tags.length" :class="bemm('tags')">
            <span
              v-for="tag in form.tags"
              :key="tag"
              :class="bemm('tag')"
            >
              {{ tag }}
              <button
                type="button"
                :class="bemm('tag-remove')"
                @click="removeTag(tag)"
                aria-label="Remove tag"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <!-- Image -->
        <div :class="bemm('section')">
          <h3 :class="bemm('section-title')">Image</h3>

          <div :class="bemm('image-options')">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleImageUpload"
            />

            <TButton
              type="button"
              color="secondary"
              icon="upload"
              @click="$refs.fileInput?.click()"
            >
              Upload Image
            </TButton>

            <TButton
              type="button"
              color="secondary"
              icon="link"
              @click="showUrlInput = !showUrlInput"
            >
              Use URL
            </TButton>
          </div>

          <TInput
            v-if="showUrlInput"
            v-model="form.imageUrl"
            label="Image URL"
            placeholder="https://example.com/image.jpg"
            :class="bemm('field')"
          />
        </div>

        <!-- Styling -->
        <div :class="bemm('section')">
          <h3 :class="bemm('section-title')">Styling</h3>

          <div :class="bemm('color-picker')">
            <label :class="bemm('color-label')">Background Color</label>
            <div :class="bemm('color-options')">
              <button
                v-for="color in colorOptions"
                :key="color.value"
                type="button"
                :class="bemm('color-option', {
                  selected: form.backgroundColor === color.value
                })"
                :style="{ backgroundColor: color.value }"
                :aria-label="color.name"
                @click="form.backgroundColor = color.value"
              />

              <input
                v-model="form.backgroundColor"
                type="color"
                :class="bemm('color-input')"
                aria-label="Custom color"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <footer :class="bemm('actions')">
          <TButton
            type="button"
            color="secondary"
            @click="$emit('close')"
          >
            Cancel
          </TButton>

          <TButton
            type="submit"
            color="primary"
            icon="plus"
            :disabled="!isFormValid"
            :loading="isCreating"
          >
            Create Card
          </TButton>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInput, TCardCommunication, type Card } from '@tiko/ui'
import { useCardsStore } from '../stores/cards'

interface Emits {
  (e: 'close'): void
  (e: 'created', card: Card): void
}

const emit = defineEmits<Emits>()

const bemm = useBemm('create-card-modal')
const { createCard } = useCardsStore()

// Form state
const form = reactive({
  label: '',
  audioText: '',
  imageUrl: '',
  backgroundColor: '#E3F2FD',
  tags: [] as string[]
})

const tagInput = ref('')
const showUrlInput = ref(false)
const isCreating = ref(false)

// Color options
const colorOptions = [
  { name: 'Light Blue', value: '#E3F2FD' },
  { name: 'Light Green', value: '#E8F5E8' },
  { name: 'Light Orange', value: '#FFF3E0' },
  { name: 'Light Pink', value: '#FCE4EC' },
  { name: 'Light Purple', value: '#F3E5F5' },
  { name: 'Light Yellow', value: '#FFFDE7' },
  { name: 'Light Red', value: '#FFEBEE' },
  { name: 'Light Cyan', value: '#E0F2F1' }
]

// Computed
const isFormValid = computed(() => {
  return form.label.trim() && form.audioText.trim()
})

const previewCard = computed<Card>(() => ({
  id: 'preview',
  label: form.label || 'Card Label',
  audioText: form.audioText || 'Audio text',
  imageUrl: form.imageUrl,
  backgroundColor: form.backgroundColor,
  tags: form.tags,
  createdAt: new Date(),
  updatedAt: new Date()
}))

// Methods
const updateTags = () => {
  if (!tagInput.value.trim()) return

  const newTags = tagInput.value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag && !form.tags.includes(tag))

  form.tags.push(...newTags)
  tagInput.value = ''
}

const removeTag = (tagToRemove: string) => {
  const index = form.tags.indexOf(tagToRemove)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Create object URL for preview
  const imageUrl = URL.createObjectURL(file)
  form.imageUrl = imageUrl

  // TODO: Upload to storage service and get permanent URL
  // For now, we'll use the object URL (will work until page reload)
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isCreating.value = true

  try {
    const newCard = await createCard({
      label: form.label.trim(),
      audioText: form.audioText.trim(),
      imageUrl: form.imageUrl || undefined,
      backgroundColor: form.backgroundColor,
      tags: form.tags
    })

    emit('created', newCard)
  } catch (error) {
    console.error('Error creating card:', error)
    // TODO: Show error notification
  } finally {
    isCreating.value = false
  }
}
</script>

<style lang="scss">
.create-card-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  &__dialog {
    background: white;
    border-radius: 1rem;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__close-button {
    flex-shrink: 0;
  }

  &__form {
    padding: 1.5rem;
  }

  &__preview-section {
    margin-bottom: 2rem;
  }

  &__section {
    margin-bottom: 2rem;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  &__section-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary-text);
  }

  &__preview {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: var(--color-background);
    border-radius: 0.5rem;
  }

  &__field {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__image-options {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  &__tag-remove {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0;
    width: 1rem;
    height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }

  &__color-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__color-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-primary-text);
  }

  &__color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  &__color-option {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }

    &--selected {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }
  }

  &__color-input {
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: none;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .create-card-modal {
    padding: 0.5rem;

    &__dialog {
      max-height: 95vh;
    }

    &__header,
    &__form {
      padding: 1rem;
    }

    &__actions {
      flex-direction: column-reverse;
    }

    &__image-options {
      flex-direction: column;
    }

    &__color-options {
      justify-content: center;
    }
  }
}
</style>
