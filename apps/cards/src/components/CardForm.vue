<template>
  <div :class="bemm()">
    <TForm @submit.prevent="handleSubmit">
      <!-- Title -->
      <TFormField
        label="Title"
        name="title"
        required
      >
        <TInputText
          v-model="form.title"
          placeholder="Enter card title"
          maxlength="50"
        />
      </TFormField>

      <!-- Color Selection -->
      <TFormField
        label="Color"
        name="color"
      >
        <TColorPicker
          v-model="form.color"
          :colors="availableColors"
        />
      </TFormField>

      <!-- Image Selection -->
      <TFormField
        label="Image"
        name="image"
      >
        <div :class="bemm('image-field')">
          <div v-if="form.image" :class="bemm('image-preview')">
            <img :src="form.image" :alt="form.title || 'Selected image'" />
            <TButton
              icon="xmark"
              size="small"
              type="ghost"
              color="error"
              :class="bemm('image-remove')"
              @click="() => { form.image = ''; searchForSuggestions(form.title); }"
              :aria-label="'Remove image'"
            />
          </div>
          <div v-else>
            <TButton
              icon="image"
              type="outline"
              color="secondary"
              @click="openImageSelector"
            >
              Select Image
            </TButton>
            
            <!-- Image suggestions based on title -->
            <div v-if="imageSuggestions.length > 0 && form.title && !form.image" :class="bemm('suggestions')">
              <p :class="bemm('suggestions-label')">Suggested images based on "{{ form.title }}":</p>
              <div :class="bemm('suggestions-grid')">
                <div
                  v-for="suggestion in imageSuggestions"
                  :key="suggestion.id"
                  :class="bemm('suggestion')"
                  @click="selectSuggestion(suggestion)"
                >
                  <img :src="suggestion.thumbnail" :alt="suggestion.title" />
                  <span>{{ suggestion.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TFormField>

      <!-- Speech Text -->
      <TFormField
        label="Speech Text"
        name="speech"
        help="Text to be spoken when the tile is clicked"
      >
        <TTextarea
          v-model="form.speech"
          placeholder="Enter text to be spoken"
          rows="3"
          maxlength="500"
        />
      </TFormField>

      <!-- Form Actions -->
      <TFormActions>
        <TButton
          type="outline"
          color="secondary"
          @click="handleCancel"
        >
          Cancel
        </TButton>
        <TButton
          type="default"
          color="primary"
          htmlButtonType="submit"
          :disabled="!isValid"
        >
          {{ isEditing ? 'Save Changes' : 'Create Card' }}
        </TButton>
      </TFormActions>
    </TForm>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, inject, ref } from 'vue';
import { useBemm } from 'bemm';
import {
  TForm,
  TFormField,
  TFormActions,
  TTextarea,
  TButton,
  TColorPicker,
  BaseColors,
  TInputText,
  TMediaSelector,
  debounce,
} from '@tiko/ui';
import { CardTile } from './CardTile/CardTile.model';
import { mediaService, useImages, useImageUrl } from '@tiko/core';

const bemm = useBemm('card-form');
const popupService = inject<any>('popupService');
const { searchImages } = useImages();
const { getImageVariants } = useImageUrl();

const props = defineProps<{
  card?: CardTile;
  index?: number;
}>();

const emit = defineEmits<{
  submit: [card: Partial<CardTile>, index: number];
  cancel: [];
}>();

const isEditing = computed(() => !!props.card && !props.card.id.startsWith('empty-'));

const availableColors = Object.values(BaseColors);

// Image suggestions state
const imageSuggestions = ref<any[]>([]);
const isLoadingSuggestions = ref(false);

const form = reactive({
  title: props.card?.title || '',
  color: props.card?.color || 'primary',
  image: props.card?.image || '',
  speech: props.card?.speech || '',
});

// Auto-populate speech field when title changes (only if speech is empty)
watch(() => form.title, (newTitle) => {
  // Only auto-populate if speech is empty and we're creating a new card
  if (!form.speech && !isEditing.value) {
    form.speech = newTitle;
  }
});

// Search for image suggestions based on title
const searchForSuggestions = debounce(async (searchTerm: string) => {
  if (!searchTerm || searchTerm.length < 2) {
    imageSuggestions.value = [];
    return;
  }

  isLoadingSuggestions.value = true;
  try {
    const results = await searchImages(searchTerm);
    // Take top 4 suggestions
    imageSuggestions.value = results.slice(0, 4).map(img => ({
      id: img.id,
      title: img.title || img.filename || 'Untitled',
      thumbnail: getImageVariants(img.original_url).thumbnail || img.original_url,
      url: img.original_url
    }));
  } catch (error) {
    console.error('Failed to load image suggestions:', error);
    imageSuggestions.value = [];
  } finally {
    isLoadingSuggestions.value = false;
  }
}, 500);

// Watch title changes to trigger image search
watch(() => form.title, (newTitle) => {
  if (!form.image) { // Only search if no image is already selected
    searchForSuggestions(newTitle);
  }
});

// Select a suggested image
const selectSuggestion = (suggestion: any) => {
  form.image = suggestion.url;
  imageSuggestions.value = []; // Clear suggestions after selection
};

const isValid = computed(() => {
  return form.title.trim().length > 0;
});

const handleSubmit = () => {
  if (!isValid.value) return;

  const cardData: Partial<CardTile> = {
    title: form.title?.trim() || '',
    color: form.color as any,
    image: form.image?.trim() || '',
    speech: form.speech?.trim() || '',
    icon: 'square',
  };

  emit('submit', cardData, props.index || 0);
};

const handleCancel = () => {
  emit('cancel');
};

const openImageSelector = async () => {
  popupService.open({
    component: TMediaSelector,
    title: 'Select Image from Tiko Library',
    props: {
      multiple: false,
      selectedIds: form.image ? [form.image] : [],
      searchTerm: form.title || '', // Use title as default search term
      onConfirm: (selectedItems: any[]) => {
        if (selectedItems.length > 0) {
          const item = selectedItems[0];
          // Handle both MediaItem (original_url) and UserMedia (url) types
          form.image = item.original_url || item.url || '';
          imageSuggestions.value = []; // Clear suggestions after selection
        }
        popupService.close();
      },
      onCancel: () => {
        popupService.close();
      },
    },
  });
};

// Watch for prop changes
watch(() => props.card, (newCard) => {
  if (newCard) {
    form.title = newCard.title || '';
    form.color = newCard.color || 'primary';
    form.image = newCard.image || '';
    form.speech = newCard.speech || '';
  }
}, { immediate: true });
</script>

<style lang="scss">
.card-form {
  padding: var(--space);
  min-width: 400px;

  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
  }

  &__image-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__image-preview {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: var(--border-radius);
    overflow: hidden;
    border: 1px solid var(--color-border);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__image-remove {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
  }

  &__suggestions {
    margin-top: var(--space);
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
  }

  &__suggestions-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: var(--space-xs);
  }

  &__suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: var(--space-xs);
  }

  &__suggestion {
    cursor: pointer;
    text-align: center;
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.05);
    }

    img {
      width: 100%;
      height: 60px;
      object-fit: cover;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--color-border);
      margin-bottom: var(--space-xs);
    }

    span {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
