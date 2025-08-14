<template>
  <TAppLayout
    :title="t('cards.cardsTitle')"
    :show-header="true"
    @profile="handleProfile"
    @settings="handleSettings"
    @logout="handleLogout"
  >
    <template #app-controls>
      <!-- Back button when in sub-level -->
      <TButton
        v-if="currentGroupId"
        :icon="Icons.ARROW_LEFT"
        type="outline"
        color="primary"
        @click="handleBack"
        :aria-label="t('common.back')"
      >{{ t('common.back') }}</TButton>
      
      <!-- Edit mode toggle -->
      <TButton
        :icon="isEditMode ? Icons.EDIT_M : Icons.EDIT_LINE"
        :type="isEditMode ? 'default' : 'outline'"
        :color="isEditMode ? 'primary' : 'secondary'"
        @click="toggleEditMode"
        :aria-label="isEditMode ? t('common.exitEditMode') : t('common.enterEditMode')"
      >{{ isEditMode ? t('common.exitEditMode') : t('common.enterEditMode') }}</TButton>
      <!-- App settings button (only visible in parent mode) -->
      <TButton
        v-if="parentMode.isUnlocked.value"
        :icon="Icons.SETTINGS"
        type="outline"
        color="secondary"
        @click="handleAppSettings"
        :aria-label="t('cards.cardsSettings')"
      />
    </template>

    <div :class="bemm('')">
      <!-- Breadcrumb navigation -->
      <nav v-if="breadcrumbs.length > 0" :class="bemm('breadcrumbs')">
        <button
          v-for="(crumb, index) in breadcrumbs"
          :key="crumb.id || 'root'"
          :class="bemm('breadcrumb')"
          @click="navigateToBreadcrumb(index)"
        >
          <TIcon v-if="index > 0" name="chevron-right" size="small" />
          {{ crumb.title }}
        </button>
      </nav>

      <!-- Main question display -->
      <main :class="bemm('main')">
        <CardGrid
          :cards="cards"
          :show-arrows="true"
          :edit-mode="isEditMode"
          :tiles-with-children="tilesWithChildren"
          :tile-children-map="tileChildrenMap"
          :is-tile-dragging="isTileDragging"
          @card-click="handleCardClick"
          @card-drop="handleCardDrop"
          @card-reorder="handleCardReorder"
          @update:tile-dragging="isTileDragging = $event"
        />
      </main>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch, inject, ref } from 'vue';
import { useBemm } from 'bemm';
import {
  TButton,
  TAppLayout,
  TIcon,
  useI18n,
  useParentMode,
  useTextToSpeech,
} from '@tiko/ui';
import { useCardStore } from '../stores/cards';
import CardsSettingsForm from '../components/CardsSettingsForm.vue';
import CardGrid from '../components/CardGrid.vue';
import CardForm from '../components/CardForm.vue';
import { CardTile,mockCardTile } from '../components/CardTile/CardTile.model';
import { useEditMode } from '../composables/useEditMode';
import { cardsService } from '../services/cards.service';
import { Icons } from 'open-icon';

const bemm = useBemm('cards-view');
const settings = ref();
const yesNoStore = useCardStore();
const { t, keys } = useI18n();
const parentMode = useParentMode('cards');
const { hasPermission, requestPermission, speak } = useTextToSpeech();
const { isEditMode, toggleEditMode } = useEditMode();

// Inject the popup service from TFramework
const popupService = inject<any>('popupService');

// Local settings copy for immediate UI updates
const localSettings = reactive({
  buttonSize: 'large' as 'small' | 'medium' | 'large',
  autoSpeak: true,
  hapticFeedback: true,
  buttonStyle: 'icons' as 'hands' | 'icons' | 'text',
});

const cards = ref<CardTile[]>([]);
const currentGroupId = ref<string | undefined>(undefined);
const breadcrumbs = ref<Array<{ id?: string; title: string }>>([]);

const loadCards = async () => {
  // First try to load from Supabase
  const savedCards = await cardsService.loadCards(currentGroupId.value);

  if (savedCards.length > 0) {
    cards.value = savedCards;

    // Check which tiles have children and load them for preview
    const newTilesWithChildren = new Set<string>();
    const newTileChildrenMap = new Map<string, CardTile[]>();
    
    for (const card of savedCards) {
      if (!card.id.startsWith('empty-')) {
        const children = await cardsService.loadCards(card.id);
        if (children.length > 0) {
          newTilesWithChildren.add(card.id);
          newTileChildrenMap.set(card.id, children);
        }
      }
    }
    
    tilesWithChildren.value = newTilesWithChildren;
    tileChildrenMap.value = newTileChildrenMap;
  } else {
    // Start with empty board - no mock data
    cards.value = [];
    tilesWithChildren.value.clear();
    tileChildrenMap.value.clear();
  }
};
// Computed

// Watch settings and update local copy
watch(
  settings,
  (newSettings) => {
    Object.assign(localSettings, newSettings);
  },
  { immediate: true },
);

const handleAppSettings = () => {
  popupService.open({
    component: CardsSettingsForm,
    title: t('cards.cardSettings'),
    props: {
      settings: settings.value,
      onApply: async (newSettings: any) => {
        Object.assign(localSettings, newSettings);
        await yesNoStore.updateSettings(newSettings);
        popupService.close();
      },
    },
  });
};

const updateSettings = async () => {
  await yesNoStore.updateSettings(localSettings);
};

const handleProfile = () => {
  console.log('Profile clicked');
  // TODO: Navigate to profile page or open profile modal
};

const handleSettings = () => {
  handleAppSettings();
};

const handleLogout = () => {
  console.log('User logged out');
  // The auth store handles the logout, this is just for any cleanup
};

const handleSpeechPermission = async () => {
  const granted = await requestPermission();
  if (granted) {
    console.log('Speech permission granted');
  } else {
    console.warn('Speech permission denied');
  }
};

const handleCardClick = (card: CardTile, index: number) => {
  if (isEditMode.value) {
    // In edit mode, open form to create/edit card
    const isNewCard = card.id.startsWith('empty-');

    popupService.open({
      component: CardForm,
      title: isNewCard ? 'Create New Tile' : 'Edit Tile',
      props: {
        card: card,
        index: index,
        onSubmit: async (cardData: Partial<CardTile>, cardIndex: number) => {
          try {
            if (isNewCard) {
              // Create new card in Supabase
              const savedId = await cardsService.saveCard(cardData, currentGroupId.value, index);
              if (savedId) {
                const newCard: CardTile = {
                  ...cardData,
                  id: savedId,
                  index: index,
                } as CardTile;
                cards.value = [...cards.value.filter(c => !c.id.startsWith('empty-')), newCard];
              }
            } else {
              // Update existing card in Supabase
              const updatedCard = { ...card, ...cardData };
              const savedId = await cardsService.saveCard(updatedCard, currentGroupId.value);
              if (savedId) {
                const updatedCards = [...cards.value];
                const existingIndex = updatedCards.findIndex(c => c.id === card.id);
                if (existingIndex >= 0) {
                  updatedCards[existingIndex] = updatedCard;
                  cards.value = updatedCards;
                }
              }
            }
            popupService.close();
          } catch (error) {
            console.error('Failed to save card:', error);
            // TODO: Show error toast
          }
        },
        onCancel: () => {
          popupService.close();
        },
      },
    });
  } else {
    // In view mode, check if tile has children
    if (!card.id.startsWith('empty-')) {
      handleTileAction(card);
    }
  }
};

const handleTileAction = async (tile: CardTile) => {
  // Check if this tile has children
  const hasChildren = await cardsService.hasChildren(tile.id);

  if (hasChildren) {
    // Navigate to children
    navigateToTile(tile);
  } else if (tile.speech) {
    // No children, speak the content with optimized settings
    speak(tile.speech, { 
      rate: 1.1, // Slightly faster for responsiveness
      volume: 1.0,
      pitch: 1.0 
    });
  }
};

const navigateToTile = async (tile: CardTile) => {
  // First time navigation - add Home
  if (breadcrumbs.value.length === 0) {
    breadcrumbs.value.push({
      id: undefined,
      title: 'Home',
    });
  }

  // Add current tile to breadcrumbs
  breadcrumbs.value.push({
    id: tile.id,
    title: tile.title,
  });

  // Navigate to the tile's children
  currentGroupId.value = tile.id;
  await loadCards();
};

const navigateToBreadcrumb = async (index: number) => {
  const crumb = breadcrumbs.value[index];
  currentGroupId.value = crumb.id;

  // Remove breadcrumbs after this one
  breadcrumbs.value = breadcrumbs.value.slice(0, index);

  await loadCards();
};

const handleBack = async () => {
  if (breadcrumbs.value.length > 0) {
    // Go to the parent level (previous breadcrumb)
    const parentIndex = breadcrumbs.value.length - 2;
    if (parentIndex >= 0) {
      await navigateToBreadcrumb(parentIndex);
    } else {
      // Go to root
      currentGroupId.value = undefined;
      breadcrumbs.value = [];
      await loadCards();
    }
  }
};

// Text-to-Speech is already initialized above with other composables

// Store which tiles have children for display purposes
const tilesWithChildren = ref<Set<string>>(new Set());
// Store actual children data for preview
const tileChildrenMap = ref<Map<string, CardTile[]>>(new Map());

// Track if any tile is being dragged
const isTileDragging = ref(false);

const handleCardDrop = async (droppedCard: CardTile, targetCard: CardTile) => {
  if (droppedCard.id === targetCard.id) return;

  // Don't allow dropping on empty cards - this should be handled by handleCardReorder
  if (targetCard.id.startsWith('empty-')) {
    console.log('Cannot drop on empty placeholder');
    return;
  }

  // Don't allow dropping a parent into its own child (prevent circular references)
  if (await isDescendantOf(targetCard.id, droppedCard.id)) {
    console.error('Cannot move a tile into its own descendant');
    return;
  }

  // Optimistic update - immediately update UI
  const originalCards = [...cards.value];
  const originalTilesWithChildren = new Set(tilesWithChildren.value);
  
  // Remove the card from current view immediately
  cards.value = cards.value.filter(c => c.id !== droppedCard.id);
  
  // Mark the target as having children immediately
  tilesWithChildren.value.add(targetCard.id);
  
  // Update the children map for immediate preview
  const currentChildren = tileChildrenMap.value.get(targetCard.id) || [];
  tileChildrenMap.value.set(targetCard.id, [...currentChildren, droppedCard]);

  try {
    // When dropping on an existing tile, always move it INTO that tile as a child
    const updatedCard = {
      ...droppedCard,
      parentId: targetCard.id,
      index: 0, // Reset index when moving to a new parent
    };

    await cardsService.saveCard(updatedCard, targetCard.id, 0);

    console.log(`Moved "${droppedCard.title}" into group "${targetCard.title}"`);
  } catch (error) {
    console.error('Failed to move card:', error);
    // Rollback on error
    cards.value = originalCards;
    tilesWithChildren.value = originalTilesWithChildren;
  }
};

const handleCardReorder = async (card: CardTile, newIndex: number) => {
  // Optimistic update - immediately update UI
  const originalCards = [...cards.value];
  
  // Simply update the card's index to the new position
  const newCards = cards.value.map(c => {
    if (c.id === card.id) {
      return { ...c, index: newIndex };
    }
    return c;
  });
  
  // Update the UI immediately
  cards.value = newCards;
  
  try {
    // Save to database with the new index
    const updatedCard = {
      ...card,
      index: newIndex,
    };
    
    await cardsService.saveCard(updatedCard, currentGroupId.value, newIndex);
    console.log(`Moved "${card.title}" to position ${newIndex}`);
  } catch (error) {
    console.error('Failed to reorder card:', error);
    // Rollback on error
    cards.value = originalCards;
  }
};

// Helper function to check if a tile is a descendant of another
const isDescendantOf = async (tileId: string, potentialAncestorId: string): Promise<boolean> => {
  // TODO: Implement proper recursive check through the database
  // For now, just prevent the most obvious case
  return false;
};

// Initialize
onMounted(async () => {
  console.log('[CardsView] Component mounted, loading cards...');
  try {
    // Pre-request speech permission to avoid delay on first click
    if (!hasPermission.value) {
      await requestPermission();
    }
    
    await yesNoStore.loadState();
    await loadCards();
    console.log('[CardsView] Cards loaded successfully');
  } catch (error) {
    console.error('[CardsView] Failed to load cards:', error);
  }
});
</script>

<style lang="scss" scoped>
.cards-view {
  &__breadcrumbs {
    display: flex;
    align-items: center;
    padding: var(--space) var(--space);
    background-color: var(--color-background-secondary);
    border-bottom: 2px solid var(--color-border);
    gap: var(--space-xs);
    overflow-x: auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &::-webkit-scrollbar {
      height: 4px;
    }
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-muted);
    font-size: var(--font-size);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      color: var(--color-text);
      background-color: var(--color-background-alt);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:last-child {
      color: var(--color-text);
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
      font-weight: 600;
    }
    
    .icon {
      opacity: 0.5;
    }
  }
}

.yes-no {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  &::before {
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background-color: var(
      --layout-background-color,
      color-mix(in srgb, var(--color-primary), transparent 75%)
    );
    transition: background-color 0.3s ease;
    opacity: 1;
    z-index: 0;
    pointer-events: none;
  }

  &--yes {
    --layout-background-color: color-mix(
      in srgb,
      var(--color-success),
      var(--color-background) 50%
    );
  }
  &--no {
    --layout-background-color: color-mix(
      in srgb,
      var(--color-error),
      var(--color-background) 50%
    );
  }

  &__header {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    position: relative;
    z-index: 10;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 3rem;
    z-index: 8;
  }

  &__answers {
    display: flex;
    // gap: var(--space-s);
    width: 100%;
    justify-content: center;
    font-size: 20vmin;
  }

  &__question {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--space);
    cursor: pointer;
    padding: var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &-text {
      font-size: 2em;
      text-align: center;
    }

    &-controls {
      display: flex;
      gap: var(--space-s);

      .yes-no__question:hover & {
        opacity: 1;
      }
    }
  }

  // Feedback overlay
  &__feedback {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    pointer-events: none;
    animation: feedbackPulse 1.5s ease-in-out;

    &__text {
      font-size: 2rem;
      font-weight: 700;
    }

    &--yes {
      color: var(--color-green);
    }

    &--no {
      color: var(--color-green);
    }
  }
}

@keyframes feedbackPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
  80% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .yes-no-question__button {
    transition: none;

    &:hover:not(:disabled) {
      transform: none;
    }
  }

  .yes-no-feedback {
    animation: none;
  }
}
</style>
