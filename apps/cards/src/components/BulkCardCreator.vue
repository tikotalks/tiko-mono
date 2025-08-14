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
        >
          <CardTile
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
import { ref, watch } from 'vue';
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
  useI18n,
} from '@tiko/ui';
import { useImages, useImageUrl } from '@tiko/core';
import type { CardTile as CardTileType } from './CardTile/CardTile.model';
import CardTile from './CardTile/CardTile.vue';

const bemm = useBemm('bulk-card-creator');
const { t } = useI18n();
const { searchImages } = useImages();
const { getImageVariants } = useImageUrl();

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
}

const titlesInput = ref('');
const cardPreviews = ref<CardPreview[]>([]);
const isProcessing = ref(false);

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
  try {
    const results = await searchImages(title);
    if (results.length > 0) {
      // Return the first result's URL
      return results[0].original_url;
    }
  } catch (error) {
    console.error(`Failed to find image for "${title}":`, error);
  }
  return ''; // No image found
};

// Process titles and create previews
const processCards = debounce(async () => {
  const titles = titlesInput.value
    .split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  // Create initial previews
  cardPreviews.value = titles.map(title => ({
    title,
    speech: title, // Use title as speech
    color: getSmartColor(title),
    image: '',
    loading: true
  }));
  
  // Load images asynchronously
  for (let i = 0; i < cardPreviews.value.length; i++) {
    const preview = cardPreviews.value[i];
    preview.image = await findBestImage(preview.title);
    preview.loading = false;
  }
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