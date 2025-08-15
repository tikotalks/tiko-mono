<template>
  <div :class="bemm()">
    <TForm @submit.prevent="handleSubmit" :class="bemm('form')">
      <div :class="bemm('columns')">
        <!-- Left Column: Main Form Fields -->
        <div :class="bemm('column', ['', 'main'])">
          <TFormGroup>

            <!-- Title -->
            <TFormField :label="t('common.title')" name="title" required>
              <TInputText v-model="form.title" :placeholder="t('cards.enterCardTitle')" max="50" />
            </TFormField>

            <!-- Color Selection -->
            <TFormField :label="t('common.color')" name="color">
              <TColorPicker v-model="form.color" :colors="availableColors" />
            </TFormField>

            <!-- Image Selection -->
            <TFormField :label="t('common.image')" name="image">
              <div :class="bemm('image-field')">
                <div v-if="form.image" :class="bemm('image-preview')">
                  <img :src="form.image" :alt="form.title || 'Selected image'" />
                  <div :class="bemm('image-actions')">
                    <TButton :icon="Icons.IMAGE" size="small" type="outline" color="primary" @click="openImageSelector"
                      :aria-label="'Change image'" />
                    <TButton :icon="Icons.MULTIPLY_M" size="small" type="ghost" color="error"
                      @click="() => { form.image = ''; searchForSuggestions(form.title); }"
                      :aria-label="'Remove image'" />
                  </div>
                </div>
                <div v-else>
                  <TButton icon="image" type="outline" color="secondary" @click="openImageSelector">
                    {{ t('common.selectImage') }}
                  </TButton>

                  <!-- Image suggestions based on title -->
                  <div v-if="imageSuggestions.length > 0 && form.title && !form.image" :class="bemm('suggestions')">
                    <p :class="bemm('suggestions-label')">Suggested images based on "{{ form.title }}":</p>
                    <div :class="bemm('suggestions-grid')">
                      <div v-for="suggestion in imageSuggestions" :key="suggestion.id" :class="bemm('suggestion')"
                        @click="selectSuggestion(suggestion)">
                        <img :src="suggestion.thumbnail" :alt="suggestion.title" />
                        <span>{{ suggestion.title }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TFormField>

            <!-- Speech Text -->
            <TFormField label="Speech Text" name="speech" help="Text to be spoken when the tile is clicked">
              <TTextarea v-model="form.speech" placeholder="Enter text to be spoken" rows="3" max="500"
                @input="speechManuallyEdited = true" />
            </TFormField>

          </TFormGroup>

        </div>

        <!-- Right Column: Translations -->
        <div v-if="showTranslations" :class="bemm('column', ['', 'translations'])">
          <div :class="bemm('translations-header')">
            <h3 :class="bemm('section-title')">{{ t('cards.translations') }}</h3>
          </div>

          <div :class="bemm('translations-content')">
            <CardTranslations v-model="form.translations" :item-id="props.card?.id" :base-title="form.title"
              :base-speech="form.speech" :base-locale="currentLocale.value" />
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <TFormActions :class="bemm('actions')">


        <TButtonGroup :class="bemm('main-actions')">
          <!-- Left side: Translations toggle -->
          <TButton type="outline" color="primary" :icon="Icons.SPEECH_BALLOON" @click="toggleTranslations">
            {{ showTranslations ? t('common.hide') : t('common.show') }} {{ t('cards.translations') }}
            <span v-if="form.translations.length > 0" :class="bemm('translations-count')">
              ({{ form.translations.length }})
            </span>
          </TButton>

          <TButton v-if="isEditing" icon="trash" :type="ButtonType.ICON_ONLY" :tooltip="t('common.delete')"
            color="error" @click="handleDelete" :class="bemm('delete-button')">
            {{ t('common.delete') }}
          </TButton>
          <TButton type="outline" color="secondary" @click="handleCancel">
            {{ t('common.cancel') }}
          </TButton>
          <TButton type="default" color="primary" htmlButtonType="submit" :disabled="!isValid">
            {{ isEditing ? t('common.saveChanges') : t('common.createCard') }}
          </TButton>
        </TButtonGroup>
      </TFormActions>
    </TForm>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch, inject, ref, onMounted } from 'vue';
import { useBemm } from 'bemm';
import {
  TForm,
  TFormField,
  TFormActions,
  TTextarea,
  TButton,
  TButtonGroup,
  TColorPicker,
  BaseColors,
  TInputText,
  TMediaSelector,
  debounce,
  useI18n,
  ButtonType,
  TFormGroup,
} from '@tiko/ui';
import { CardTile } from './CardTile/CardTile.model';
import { mediaService, useImages, useImageUrl, useAuthStore } from '@tiko/core';
import CardTranslations from './CardTranslations/CardTranslations.vue';
import type { ItemTranslation } from '../models/ItemTranslation.model';
import { Icons } from 'open-icon';

const bemm = useBemm('card-form');
const popupService = inject<any>('popupService');
const { imageList, filteredImages, searchImages, loadImages } = useImages();
const { getImageVariants } = useImageUrl();
const { t, currentLocale } = useI18n();
const authStore = useAuthStore();

const props = defineProps<{
  card?: CardTile;
  index?: number;
  hasChildren?: boolean;
  translations?: ItemTranslation[];
}>();

const emit = defineEmits<{
  submit: [card: Partial<CardTile>, index: number, translations: ItemTranslation[]];
  cancel: [];
  delete: [];
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
  translations: props.translations || [] as ItemTranslation[],
});

// Track if user has manually edited speech
const speechManuallyEdited = ref(false);

// Translations visibility toggle
const showTranslations = ref(false);

// Toggle translations visibility
const toggleTranslations = () => {
  showTranslations.value = !showTranslations.value;
};


// Auto-populate speech field when title changes
watch(() => form.title, (newTitle) => {
  // Only auto-populate if we're creating a new card and user hasn't manually edited speech
  if (!isEditing.value && !speechManuallyEdited.value) {
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
    // Set the search query
    searchImages(searchTerm);

    // Wait a bit for the reactive search to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get the filtered results and find best matches
    if (filteredImages.value.length > 0) {
      const searchTermLower = searchTerm.toLowerCase();
      const results = [...filteredImages.value];

      // Sort by relevance
      results.sort((a, b) => {
        const aTitle = ((a as any).title || (a as any).original_filename || '').toLowerCase();
        const bTitle = ((b as any).title || (b as any).original_filename || '').toLowerCase();

        // Exact matches first
        if (aTitle === searchTermLower && bTitle !== searchTermLower) return -1;
        if (bTitle === searchTermLower && aTitle !== searchTermLower) return 1;

        // Then word boundary matches
        const aWordMatch = new RegExp(`\\b${searchTermLower}\\b`).test(aTitle);
        const bWordMatch = new RegExp(`\\b${searchTermLower}\\b`).test(bTitle);
        if (aWordMatch && !bWordMatch) return -1;
        if (bWordMatch && !aWordMatch) return 1;

        // Then by title length (shorter is better for partial matches)
        return aTitle.length - bTitle.length;
      });

      // Take top 6 suggestions
      imageSuggestions.value = results.slice(0, 6).map(img => ({
        id: img.id,
        title: (img as any).title || (img as any).original_filename || 'Untitled',
        thumbnail: getImageVariants(img.original_url || (img as any).url).thumbnail || img.original_url || (img as any).url,
        url: img.original_url || (img as any).url
      }));
    } else {
      imageSuggestions.value = [];
    }
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
    base_locale: currentLocale.value, // Store the base locale
  };

  emit('submit', cardData, props.index || 0, form.translations);
};

const handleCancel = () => {
  emit('cancel');
};

const handleDelete = () => {
  const message = props.hasChildren
    ? 'Are you sure you want to delete this group? This will also delete all cards inside it.'
    : 'Are you sure you want to delete this card?';

  if (confirm(message)) {
    emit('delete');
  }
};

// Load images when component mounts
onMounted(async () => {
  await loadImages();
});

const openImageSelector = async () => {
  popupService.open({
    component: TMediaSelector,
    title: 'Select Image from Tiko Library',
    props: {
      multiple: false,
      selectedIds: form.image ? [form.image] : [],
      onConfirm: (selectedItems: any[]) => {
        if (selectedItems.length > 0) {
          const item = selectedItems[0];
          console.log('Selected item:', item); // Debug log
          // Handle both MediaItem (original_url) and UserMedia (url) types
          const imageUrl = item.original_url || item.url || '';
          console.log('Setting image to:', imageUrl); // Debug log
          form.image = imageUrl;
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

const openTranslationsPanel = () => {
  popupService.open({
    component: CardTranslations,
    title: t('cards.manageTranslations'),
    size: 'large',
    position: 'right', // Show as sidepanel
    props: {
      modelValue: form.translations,
      itemId: props.card?.id,
      baseTitle: form.title,
      baseSpeech: form.speech,
      baseLocale: currentLocale.value,
      'onUpdate:modelValue': (translations: ItemTranslation[]) => {
        form.translations = translations;
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
    // Reset manual edit flag when loading a new card
    speechManuallyEdited.value = isEditing.value;
  }
}, { immediate: true });

// Watch for translation prop changes
watch(() => props.translations, (newTranslations) => {
  if (newTranslations) {
    form.translations = [...newTranslations];
  }
}, { immediate: true });
</script>

<style lang="scss">
.card-form {
  width: 100%;

  &__form {
    width: 100%;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-l);
    width: fit-content;

    @media (min-width: 960px) {

      &:has(.card-form__column:nth-child(2)) {
        width: fit-content;

        grid-template-columns: 1fr 1fr;
      }
    }
  }

  &__column {
    &--main {
      // Main form column styles
    }

    &--translations {
      background: var(--color-background-secondary);
      padding: var(--space);
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
    }
  }

  &__section-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  &__translations-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space);
  }

  &__translations-content {
    // Content styles
  }

  &__translations-count {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-left: var(--space-xs);
  }

  &__actions {
    margin-top: var(--space-lg);
    padding-top: var(--space);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  &__image-actions {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    gap: var(--space-xs);
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
    margin: 0 0 var(--space-s) 0;
  }

  &__suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--space-s);
  }

  &__suggestion {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs);
    background: var(--color-background);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--border-radius-xs);
    }

    span {
      font-size: var(--font-size-xs);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      max-width: 90px;
    }
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

  &__main-actions {
    display: flex;
    gap: var(--space);
  }

  &__delete-button {
    margin-right: auto;
  }
}
</style>
