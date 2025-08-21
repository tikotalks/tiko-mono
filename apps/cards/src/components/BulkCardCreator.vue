<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3>{{ t('cards.bulkAddTitle', 'Bulk Add Cards') }}</h3>
      <p>{{ t('cards.bulkAddDescription', 'Enter titles one per line. We\'ll automatically generate speech, find matching images, and select appropriate colors.') }}</p>
    </div>

    <div :class="bemm('input-section')">
      <TFormField
        label="Card Titles"
        name="titles"
        help="Enter one title per line"
      >
        <TTextarea
          v-model="titlesInput"
          placeholder="Apple&#10;Banana&#10;Car&#10;Dog"
          rows="10"
          @input="handleTitlesChange"
        />
      </TFormField>

      <div :class="bemm('stats')">
        <span>{{ cardPreviews.length }} cards will be created</span>
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="cardPreviews.length > 0" :class="bemm('preview-section')">
      <h4>Preview</h4>
      <div :class="bemm('preview-grid')">
        <div
          v-for="(preview, index) in cardPreviews"
          :key="index"
          :class="bemm('preview-tile')"
          @click="openEditPreview(preview, index)"
        >
          <TCardTile
            :card="getPreviewCard(preview, index)"
            :edit-mode="false"
            :show-image="true"
            :show-title="true"
          />
          <div v-if="preview.loading" :class="bemm('preview-overlay')">
            <TSpinner size="small" />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
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
        :disabled="cardPreviews.length === 0 || isProcessing"
        @click="handleCreateAll"
      >
        <TSpinner v-if="isProcessing" size="small" />
        <span v-else>Create {{ cardPreviews.length }} Cards</span>
      </TButton>
    </TFormActions>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, inject } from 'vue';
import { useBemm } from 'bemm';
import {
  TFormField,
  TFormActions,
  TTextarea,
  TButton,
  TSpinner,
  TIcon,
  BaseColors,
  debounce,
} from '@tiko/ui';
import {
  useI18n, useImages, useImageUrl } from '@tiko/core';
import type { TCardTile as CardTileType } from '@tiko/ui';
import { TCardTile } from '@tiko/ui';
import CardForm from './CardForm.vue';

const bemm = useBemm('bulk-card-creator');
const { t } = useI18n();
const { imageList, filteredImages, searchImages, loadImages } = useImages();
const { getImageVariants } = useImageUrl();
const popupService = inject<any>('popupService');

const emit = defineEmits<{
  create: [cards: Partial<CardTileType>[]];
  cancel: [];
}>();

interface CardPreview {
  title: string;
  speech: string;
  color: string;
  image: string;
  loading: boolean;
  editing?: boolean;
}

const titlesInput = ref('');
const cardPreviews = ref<CardPreview[]>([]);
const isProcessing = ref(false);

// Cache for images to avoid repeated searches
const imageCache = new Map<string, string>();

// Color palette that works well with different themes
const smartColors = [
  'primary', 'secondary', 'accent',
  'blue', 'green', 'orange', 'purple', 'pink', 'teal'
];

// Get a color based on the title content
const getSmartColor = (title: string): string => {
  // Simple hash function to get consistent color for same title
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use specific colors for common categories
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('food') || lowerTitle.includes('fruit') || lowerTitle.includes('vegetable')) {
    return 'green';
  }
  if (lowerTitle.includes('animal') || lowerTitle.includes('pet')) {
    return 'orange';
  }
  if (lowerTitle.includes('water') || lowerTitle.includes('ocean') || lowerTitle.includes('sky')) {
    return 'blue';
  }
  if (lowerTitle.includes('love') || lowerTitle.includes('heart')) {
    return 'pink';
  }

  // Otherwise use hash to pick a color
  return smartColors[Math.abs(hash) % smartColors.length];
};

// Search for the best matching image
const findBestImage = async (title: string): Promise<string> => {
  // Check cache first
  if (imageCache.has(title)) {
    return imageCache.get(title)!;
  }

  try {
    // Set the search query
    searchImages(title);

    // Wait a bit for the reactive search to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get the filtered results
    if (filteredImages.value.length > 0) {
      const searchTerm = title.toLowerCase();

      // First, try to find exact matches in title/filename
      let bestMatch = filteredImages.value.find(img => {
        const imgTitle = ((img as any).title || (img as any).original_filename || '').toLowerCase();
        return imgTitle === searchTerm;
      });

      // If no exact match, look for images where the search term is a complete word
      if (!bestMatch) {
        bestMatch = filteredImages.value.find(img => {
          const imgTitle = ((img as any).title || (img as any).original_filename || '').toLowerCase();
          // Check if the search term appears as a complete word (not part of another word)
          const wordBoundaryRegex = new RegExp(`\\b${searchTerm}\\b`);
          return wordBoundaryRegex.test(imgTitle);
        });
      }

      // If still no match, check tags for exact matches
      if (!bestMatch) {
        bestMatch = filteredImages.value.find(img => {
          const tags = (img as any).tags || [];
          return tags.some((tag: string) => tag.toLowerCase() === searchTerm);
        });
      }

      // If still no match, use the first result
      if (!bestMatch) {
        bestMatch = filteredImages.value[0];
      }

      const imageUrl = bestMatch.original_url || (bestMatch as any).url || '';
      // Cache the result
      imageCache.set(title, imageUrl);
      return imageUrl;
    }
  } catch (error) {
    console.error(`Failed to find image for "${title}":`, error);
  }

  // Cache empty result too
  imageCache.set(title, '');
  return ''; // No image found
};

// Process titles and create previews
const processCards = debounce(async () => {
  const titles = titlesInput.value
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  // Create a map of existing previews for preservation
  const existingPreviews = new Map<string, CardPreview>();
  cardPreviews.value.forEach(preview => {
    existingPreviews.set(preview.title, preview);
  });

  // Create or update previews
  const newPreviews: CardPreview[] = [];

  for (const title of titles) {
    // Check if we already have this preview
    const existing = existingPreviews.get(title);
    if (existing) {
      // Keep existing preview (with its image, color, etc.)
      newPreviews.push(existing);
    } else {
      // Create new preview
      const newPreview: CardPreview = {
        title,
        speech: title, // Use title as speech
        color: getSmartColor(title),
        image: '',
        loading: true,
        editing: false
      };
      newPreviews.push(newPreview);

      // Load image asynchronously for new previews only
      findBestImage(title).then(imageUrl => {
        newPreview.image = imageUrl;
        newPreview.loading = false;
      });
    }
  }

  cardPreviews.value = newPreviews;
}, 500);

const handleTitlesChange = () => {
  processCards();
};

const handleCreateAll = async () => {
  if (cardPreviews.value.length === 0) return;

  isProcessing.value = true;

  try {
    const cards: Partial<CardTileType>[] = cardPreviews.value.map((preview, index) => ({
      title: preview.title,
      speech: preview.speech,
      color: preview.color as any,
      image: preview.image,
      icon: 'square',
      type: 'card' as any,
      index
    }));

    emit('create', cards);
  } finally {
    isProcessing.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
};

// Convert preview to CardTile format for display
const getPreviewCard = (preview: CardPreview, index: number): CardTileType => {
  return {
    id: `preview-${index}`,
    title: preview.title,
    speech: preview.speech,
    color: preview.color as any,
    image: preview.image,
    icon: 'square' as any,
    type: 'card' as any,
    index: index
  };
};

// Open edit dialog for a preview card
const openEditPreview = (preview: CardPreview, index: number) => {
  popupService.open({
    component: CardForm,
    title: 'Edit Card',
    props: {
      card: {
        title: preview.title,
        speech: preview.speech,
        color: preview.color,
        image: preview.image,
        icon: 'square',
        type: 'card',
      },
      onSave: (updatedCard: Partial<CardTileType>) => {
        // Update the preview with the edited values
        preview.title = updatedCard.title || preview.title;
        preview.speech = updatedCard.speech || preview.speech;
        preview.color = updatedCard.color || preview.color;
        preview.image = updatedCard.image || preview.image;

        // Update the titles input to reflect the new title
        const titles = titlesInput.value.split('\n');
        titles[index] = preview.title;
        titlesInput.value = titles.join('\n');

        popupService.close();
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
};

// Load images when component mounts
onMounted(async () => {
  await loadImages();
});
</script>

<style lang="scss">
.bulk-card-creator {
  padding: var(--space);
  max-width: 800px;
  width: 100%;

  &__header {
    margin-bottom: var(--space-l);

    h3 {
      margin: 0 0 var(--space-xs) 0;
    }

    p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
  }

  &__input-section {
    margin-bottom: var(--space-l);
  }

  &__stats {
    margin-top: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  &__preview-section {
    margin-bottom: var(--space-l);

    h4 {
      margin: 0 0 var(--space) 0;
    }
  }

  &__preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space);
    max-height: 400px;
    overflow-y: auto;
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius);
  }

  &__preview-tile {
    position: relative;
    width: 120px;
    height: 120px;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
  }
}
</style>
