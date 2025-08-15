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
        :tooltip="isEditMode ? t('common.exitEditMode') : t('common.enterEditMode')"
        :aria-label="isEditMode ? t('common.exitEditMode') : t('common.enterEditMode')"
      />

      <!-- Bulk Add button (only in edit mode) -->
      <TButton
        v-if="isEditMode"
        :icon="Icons.ADD_FAT"
        type="icon-only"
        color="secondary"
        @click="openBulkAddMode"
        :aria-label="t('cards.bulkAdd')"
        :tooltip="t('cards.bulkAdd')"
      />

      <!-- Selection mode toggle (only in edit mode) -->
      <TButton
        v-if="isEditMode && cards.length > 0"
        :icon="Icons.CHECK_M"
        :type="selectionMode ? 'default' : 'outline'"
        :color="selectionMode ? 'accent' : 'secondary'"
        @click="toggleSelectionMode"
        :aria-label="selectionMode ? t('cards.exitSelectionMode') : t('cards.enterSelectionMode')"
      >
        {{ selectionMode ? t('cards.selectTiles') : t('common.select') }}
        <span v-if="selectedTileIds.size > 0">({{ selectedTileIds.size }})</span>
      </TButton>

      <!-- Select All button (only in selection mode) -->
      <TButton
        v-if="selectionMode"
        :icon="Icons.CHECK_FAT"
        type="ghost"
        size="small"
        @click="toggleSelectAll"
        :aria-label="isAllSelected ? t('common.deselectAll') : t('common.selectAll')"
      >
        {{ isAllSelected ? t('common.deselectAll') : t('common.selectAll') }}
      </TButton>
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

    <div :class="bemm('container')">
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
      <div :class="bemm('main')">
        <CardGrid
          :cards="cards"
          :show-arrows="true"
          :edit-mode="isEditMode"
          :tiles-with-children="tilesWithChildren"
          :tile-children-map="tileChildrenMap"
          :is-tile-dragging="isTileDragging"
          :selection-mode="selectionMode"
          :selected-tile-ids="selectedTileIds"
          :is-loading="isLoading"
          :get-context-menu="isEditMode ? getCardContextMenu : undefined"
          @card-click="handleCardClick"
          @card-drop="handleCardDrop"
          @card-reorder="handleCardReorder"
          @cards-drop="handleMultiCardDrop"
          @cards-reorder="handleMultiCardReorder"
          @update:tile-dragging="isTileDragging = $event"
        />
      </div>
    </div>

    <!-- Selection Status Bar -->
    <TStatusBar :show="selectedTileIds.size > 0 && selectionMode">
      <div :class="bemm('selection-status')">
        <div :class="bemm('selection-info')">
          <TIcon :name="Icons.CHECK_M" />
          <span>
            {{ selectedTileIds.size }} {{ selectedTileIds.size === 1 ? 'card' : 'cards' }} selected
          </span>
        </div>

        <div :class="bemm('selection-actions')">
          <TButtonGroup>
            <TButton
              size="small"
              type="outline"
              :icon="Icons.FOLDER_PLUS"
              @click="moveSelectedToGroup"
            >
              Move to Group
            </TButton>

            <TButton
              size="small"
              type="outline"
              :icon="Icons.PALETTE"
              @click="changeSelectedColor"
            >
              Change Color
            </TButton>

            <TButton
              size="small"
              type="outline"
              color="error"
              :icon="Icons.TRASH"
              @click="deleteSelected"
            >
              Delete
            </TButton>

            <TButton
              size="small"
              type="ghost"
              @click="clearSelection"
            >
              Clear Selection
            </TButton>
          </TButtonGroup>
        </div>
      </div>
    </TStatusBar>
  </TAppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, watch, inject, ref, computed } from 'vue';
import { useBemm } from 'bemm';
import { useRoute, useRouter } from 'vue-router';
import {
  TButton,
  TAppLayout,
  TIcon,
  TStatusBar,
  TButtonGroup,
  TColorPicker,
  TContextMenu,
  BaseColors,
  useI18n,
  useParentMode,
  useTextToSpeech,
} from '@tiko/ui';
import { useCardStore } from '../stores/cards';
import CardsSettingsForm from '../components/CardsSettingsForm.vue';
import CardGrid from '../components/CardGrid.vue';
import CardForm from '../components/CardForm.vue';
import GroupSelector from '../components/GroupSelector.vue';
import BulkCardCreator from '../components/BulkCardCreator.vue';
import { CardGhostTile } from '../components/CardGhostTile';
import { CardTile,mockCardTile } from '../components/CardTile/CardTile.model';
import { useEditMode } from '../composables/useEditMode';
import { useSpeak, useEventBus } from '@tiko/core';
import { cardsService } from '../services/cards.service';
import { ItemTranslationService } from '../services/item-translation.service';
import type { ItemTranslation } from '../models/ItemTranslation.model';
import { Icons } from 'open-icon';

const bemm = useBemm('cards-view');
const settings = ref();
const route = useRoute();
const router = useRouter();
const yesNoStore = useCardStore();
const { t, keys, currentLocale } = useI18n();
const parentMode = useParentMode('cards');
const { hasPermission, requestPermission } = useTextToSpeech();
const { speak, preloadAudio } = useSpeak();
const { isEditMode, toggleEditMode, disableEditMode, enableEditMode } = useEditMode();

// Inject the popup service from TFramework
const popupService = inject<any>('popupService');

// Event bus for keyboard shortcuts
const eventBus = useEventBus();

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

// Multi-select state
const selectionMode = ref(false);
const selectedTileIds = ref<Set<string>>(new Set());

// Loading state
const isLoading = ref(false);

// Check if all non-empty tiles are selected
const isAllSelected = computed(() => {
  const realCards = cards.value.filter(card => !card.id.startsWith('empty-'));
  return realCards.length > 0 && realCards.every(card => selectedTileIds.value.has(card.id));
});

// Toggle selection mode
const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedTileIds.value.clear();
  }
};

// Toggle individual tile selection
const toggleTileSelection = (tileId: string) => {
  const newSet = new Set(selectedTileIds.value);
  if (newSet.has(tileId)) {
    newSet.delete(tileId);
  } else {
    newSet.add(tileId);
  }
  selectedTileIds.value = newSet;

  // Exit selection mode if no tiles selected
  if (newSet.size === 0 && selectionMode.value) {
    selectionMode.value = false;
  }
};

// Clear all selections
const clearSelection = () => {
  selectedTileIds.value.clear();
  selectionMode.value = false;
};

// Toggle select all visible tiles
const toggleSelectAll = () => {
  const realCards = cards.value.filter(card => !card.id.startsWith('empty-'));
  const allSelected = realCards.every(card => selectedTileIds.value.has(card.id));

  if (allSelected) {
    // Deselect all
    selectedTileIds.value = new Set<string>();
  } else {
    // Select all
    const newSet = new Set<string>();
    realCards.forEach(card => {
      newSet.add(card.id);
    });
    selectedTileIds.value = newSet;
  }
};

// Create empty card placeholder
const createEmptyCard = (index: number): CardTile => ({
  id: `empty-${index}`,
  title: '',
  icon: 'plus' as any,
  color: 'gray' as any,
  type: 'empty' as any,
  image: '',
  speech: '',
  index: index,
});

// Generate ghost cards for loading state
const generateGhostCards = (): CardTile[] => {
  // Generate a random number of ghost cards (between 8 and 16)
  const count = Math.floor(Math.random() * 9) + 8;
  const ghostCards: CardTile[] = [];

  for (let i = 0; i < count; i++) {
    ghostCards.push({
      id: `ghost-${i}`,
      title: '',
      icon: 'ghost' as any,
      color: 'gray' as any,
      type: 'ghost' as any,
      image: '',
      speech: '',
      index: i,
    });
  }

  return ghostCards;
};

const loadCards = async () => {
  try {
    isLoading.value = true;

    // First try to load from Supabase
    const savedCards = await cardsService.loadCards(currentGroupId.value);

    if (savedCards.length > 0) {
      cards.value = savedCards;

      // Preload audio for cards with speech
      const textsToPreload = savedCards
        .filter(card => !card.id.startsWith('empty-') && card.speech)
        .map(card => ({
          text: card.speech || ''
        }));

      if (textsToPreload.length > 0) {
        preloadAudio(textsToPreload);
      }

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
  } finally {
    isLoading.value = false;
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

// Context menu configuration for cards
const getCardContextMenu = (card: CardTile, index: number) => {
  const isNewCard = card.id.startsWith('empty-');
  
  if (isNewCard) {
    return [
      {
        id: 'create',
        label: t('cards.createCard'),
        icon: Icons.PLUS,
        action: () => openCardEditForm(card, index)
      }
    ];
  }
  
  return [
    {
      id: 'view',
      label: t('common.view'),
      icon: Icons.EYE,
      action: () => handleTileAction(card)
    },
    {
      id: 'edit', 
      label: t('common.edit'),
      icon: Icons.EDIT,
      action: () => openCardEditForm(card, index)
    },
    {
      id: 'select',
      label: t('common.select'),
      icon: Icons.CHECK_M,
      action: () => {
        if (!selectionMode.value) {
          selectionMode.value = true;
        }
        toggleTileSelection(card.id);
      }
    },
    {
      id: 'separator',
      type: 'separator'
    },
    {
      id: 'delete',
      label: t('common.delete'),
      icon: Icons.TRASH,
      action: () => confirmDeleteCard(card)
    }
  ];
};

// Open the card edit form
const openCardEditForm = async (card: CardTile, index: number) => {
  const isNewCard = card.id.startsWith('empty-');

  // Load translations if editing existing card
  let translations: ItemTranslation[] = [];
  if (!isNewCard) {
    try {
      translations = await ItemTranslationService.getTranslations(card.id);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  popupService.open({
    component: CardForm,
    title: isNewCard ? 'Create New Tile' : 'Edit Tile',
      props: {
        card: card,
        index: index,
        hasChildren: tilesWithChildren.value.has(card.id),
        translations: translations,
        onSubmit: async (cardData: Partial<CardTile>, cardIndex: number, newTranslations: ItemTranslation[]) => {
          try {
            if (isNewCard) {
              // Create new card in Supabase
              const savedId = await cardsService.saveCard(cardData, currentGroupId.value, index, newTranslations);
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
              const savedId = await cardsService.saveCard(updatedCard, currentGroupId.value, undefined, newTranslations);
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
        onDelete: async () => {
          try {
            const success = await cardsService.deleteCard(card.id);
            if (success) {
              // Remove from UI
              cards.value = cards.value.filter(c => c.id !== card.id);
              // Clear from cache
              tilesWithChildren.value.delete(card.id);
              tileChildrenMap.value.delete(card.id);
              popupService.close();
            } else {
              alert('Failed to delete card. Please try again.');
            }
          } catch (error) {
            console.error('Failed to delete card:', error);
            alert('Failed to delete card. Please try again.');
          }
        },
      },
    });
};

// Confirm delete card action
const confirmDeleteCard = async (card: CardTile) => {
  const hasChildren = tilesWithChildren.value.has(card.id);
  const message = hasChildren
    ? t('cards.deleteThisCard') + ' ' + 'This will also delete all contents in this group.'
    : t('cards.deleteThisCard');
    
  if (confirm(message)) {
    try {
      const success = await cardsService.deleteCard(card.id);
      if (success) {
        // Remove from UI
        cards.value = cards.value.filter(c => c.id !== card.id);
        // Clear from cache
        tilesWithChildren.value.delete(card.id);
        tileChildrenMap.value.delete(card.id);
      } else {
        alert('Failed to delete card. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('Failed to delete card. Please try again.');
    }
  }
};

const handleCardClick = async (card: CardTile, index: number) => {
  // In selection mode, toggle selection instead of normal behavior
  if (selectionMode.value && !card.id.startsWith('empty-')) {
    toggleTileSelection(card.id);
    return;
  }

  if (isEditMode.value) {
    // In edit mode, directly open edit form (context menu is on right-click)
    openCardEditForm(card, index);
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
    // Request TTS permission on first interaction (especially important on iOS)
    if (!hasPermission.value) {
      await requestPermission();
    }
    
    // No children, speak the content
    // Use the effective locale (the locale of the content being displayed)
    // This ensures that if we're showing a translated card, we speak in that language
    // If we're showing the base card because no translation exists, we use the base locale
    const speakLocale = tile.effective_locale || tile.base_locale || currentLocale.value;
    await speak(tile.speech, { locale: speakLocale });
  }
};

const navigateToTile = async (tile: CardTile) => {
  // Show ghost cards immediately
  cards.value = generateGhostCards();
  isLoading.value = true;

  // Navigate immediately
  await router.push(`/${tile.id}`);

  // The watch on route params will trigger loadCards automatically
};

const navigateToBreadcrumb = async (index: number) => {
  const crumb = breadcrumbs.value[index];

  // Show ghost cards immediately
  cards.value = generateGhostCards();
  isLoading.value = true;

  if (crumb.id) {
    await router.push(`/${crumb.id}`);
  } else {
    // Navigate to home
    await router.push('/');
  }
};

const handleBack = async () => {
  // Show ghost cards immediately
  cards.value = generateGhostCards();
  isLoading.value = true;

  if (breadcrumbs.value.length > 1) {
    // Go to the parent level (previous breadcrumb)
    const parentIndex = breadcrumbs.value.length - 2;
    await navigateToBreadcrumb(parentIndex);
  } else {
    // Go to root
    await router.push('/');
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

  // Don't update the children map here - wait for the actual save to succeed

  try {
    // Get existing children to find the next available index
    const existingChildren = await cardsService.loadCards(targetCard.id);
    const nextIndex = existingChildren.length;

    // When dropping on an existing tile, always move it INTO that tile as a child
    const updatedCard = {
      ...droppedCard,
      parentId: targetCard.id,
      parent_id: targetCard.id, // Make sure we use the correct field name
      index: nextIndex, // Use next available index instead of always 0
    };

    await cardsService.saveCard(updatedCard, targetCard.id, nextIndex);

    // Update the children map after successful save
    const allChildren = [...existingChildren, droppedCard];
    tileChildrenMap.value.set(targetCard.id, allChildren);

    console.log(`Moved "${droppedCard.title}" into group "${targetCard.title}" at index ${nextIndex}`);
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

// Multi-card drop handler
const handleMultiCardDrop = async (droppedCards: CardTile[], targetCard: CardTile) => {
  if (targetCard.id.startsWith('empty-')) {
    console.log('Cannot drop multiple cards on empty placeholder');
    return;
  }

  // Move all selected cards into the target group
  const originalCards = [...cards.value];

  try {
    // First, get existing children in the target group to find the next available index
    const existingChildren = await cardsService.loadCards(targetCard.id);
    const nextIndex = existingChildren.length;

    // Remove all dropped cards from current view
    cards.value = cards.value.filter(c => !droppedCards.some(dc => dc.id === c.id));

    // Sort dropped cards by their current index to maintain order
    const sortedDroppedCards = [...droppedCards].sort((a, b) => a.index - b.index);

    // Update parent_id and index for all dropped cards
    for (let i = 0; i < sortedDroppedCards.length; i++) {
      const card = sortedDroppedCards[i];
      const updatedCard = {
        ...card,
        parent_id: targetCard.id,
        index: nextIndex + i, // Ensure each card gets a unique sequential index
      };
      await cardsService.saveCard(updatedCard, targetCard.id, updatedCard.index);
    }

    // Mark target as having children and update the preview
    tilesWithChildren.value.add(targetCard.id);

    // Update the children preview for the target tile
    const allChildren = [...existingChildren, ...sortedDroppedCards];
    tileChildrenMap.value.set(targetCard.id, allChildren);

    // Clear selection after successful drop
    clearSelection();

    console.log(`Moved ${droppedCards.length} cards into "${targetCard.title}" starting at index ${nextIndex}`);
  } catch (error) {
    console.error('Failed to move multiple cards:', error);
    cards.value = originalCards;
  }
};

// Multi-card reorder handler
const handleMultiCardReorder = async (reorderedCards: CardTile[], targetIndex: number) => {
  const originalCards = [...cards.value];

  try {
    // Create a working array with all cards (including empty slots)
    const maxIndex = Math.max(
      ...cards.value.map(c => c.index),
      targetIndex
    );

    // Create array with all positions
    const allCards: (CardTile | null)[] = new Array(maxIndex + 1).fill(null);

    // Place existing cards in their positions (excluding the ones being moved)
    cards.value.forEach(card => {
      if (!reorderedCards.some(rc => rc.id === card.id)) {
        allCards[card.index] = card;
      }
    });

    // Find the actual target position accounting for gaps
    let actualTargetIndex = targetIndex;

    // If we're moving to a position that's beyond current cards,
    // we need to ensure the cards go to that exact position
    if (targetIndex > cards.value.length - reorderedCards.length) {
      actualTargetIndex = targetIndex;
    }

    // Place the reordered cards starting at the target index
    reorderedCards.forEach((card, i) => {
      allCards[actualTargetIndex + i] = card;
    });

    // Compact the array and update indices
    const updatedCards: CardTile[] = [];
    allCards.forEach((card, index) => {
      if (card) {
        updatedCards.push({
          ...card,
          index
        });
      }
    });

    // Add empty cards if needed
    const highestIndex = updatedCards.length > 0
      ? Math.max(...updatedCards.map(c => c.index))
      : -1;

    // Fill any gaps with empty cards
    for (let i = 0; i <= highestIndex; i++) {
      if (!updatedCards.some(c => c.index === i)) {
        updatedCards.push(createEmptyCard(i));
      }
    }

    // Sort by index
    updatedCards.sort((a, b) => a.index - b.index);
    cards.value = updatedCards;

    // Save all updated indices
    for (const card of updatedCards) {
      if (!card.id.startsWith('empty-')) {
        await cardsService.saveCard(card, currentGroupId.value, card.index);
      }
    }

    // Clear selection after successful reorder
    clearSelection();

    console.log(`Reordered ${reorderedCards.length} cards to position ${targetIndex}`);
  } catch (error) {
    console.error('Failed to reorder multiple cards:', error);
    cards.value = originalCards;
  }
};

// Load all groups hierarchically from root level
const loadAllGroupsHierarchically = async (): Promise<CardTile[]> => {
  console.log('[CardsView] loadAllGroupsHierarchically called');
  const allGroups: CardTile[] = [];
  
  const loadGroupsRecursively = async (parentId: string | null, depth = 0) => {
    try {
      console.log(`[CardsView] Loading cards for parent: ${parentId}, depth: ${depth}`);
      const cards = await cardsService.loadCards(parentId);
      console.log(`[CardsView] Found ${cards.length} cards for parent ${parentId}`);
      
      for (const card of cards) {
        if (!card.id.startsWith('empty-')) {
          console.log(`[CardsView] Processing card: ${card.title} (depth ${depth})`);
          
          // Check if this card has children (is actually a group)
          try {
            const children = await cardsService.loadCards(card.id);
            const hasChildren = children.some(child => !child.id.startsWith('empty-'));
            
            if (hasChildren) {
              console.log(`[CardsView] Card ${card.title} is a group with children`);
              
              // Add only cards that are actual groups
              const groupWithPath = {
                ...card,
                displayTitle: '  '.repeat(depth) + card.title, // Indent based on depth
                depth
              };
              allGroups.push(groupWithPath);
              console.log(`[CardsView] Added group: ${card.title} (depth ${depth})`);
              
              // Recursively load children groups
              await loadGroupsRecursively(card.id, depth + 1);
            } else {
              console.log(`[CardsView] Card ${card.title} has no children, skipping`);
            }
          } catch (childError) {
            console.log(`[CardsView] Could not load children for ${card.title}:`, childError);
          }
        }
      }
    } catch (error) {
      console.error(`[CardsView] Error loading groups for parent ${parentId}:`, error);
    }
  };
  
  // Start from root level (null parent)
  console.log('[CardsView] Starting recursive load from root');
  await loadGroupsRecursively(null);
  console.log(`[CardsView] Finished loading all groups. Total: ${allGroups.length}`);
  return allGroups;
};

// Bulk action handlers  
const moveSelectedToGroup = async () => {
  console.log('[CardsView] moveSelectedToGroup called - START');
  
  try {
    const selectedCards = cards.value.filter(c => selectedTileIds.value.has(c.id));
    console.log('[CardsView] Selected cards:', selectedCards.length);
    
    if (selectedCards.length === 0) {
      alert('No cards selected');
      return;
    }
    
    // Try to load all groups hierarchically, with a timeout and fallback
    console.log('[CardsView] Starting hierarchical load...');
    let availableGroups;
    
    try {
      // Set a shorter timeout for the hierarchical loading
      const hierarchicalPromise = loadAllGroupsHierarchically();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Hierarchical loading timeout after 3 seconds')), 3000)
      );
      
      const allGroups = await Promise.race([hierarchicalPromise, timeoutPromise]);
      console.log('[CardsView] Hierarchical load completed:', allGroups.length, 'groups');
      
      // Filter out selected cards from available groups
      availableGroups = allGroups.filter(g => !selectedTileIds.value.has(g.id));
      console.log('[CardsView] Available groups after filtering:', availableGroups.length);
      
    } catch (hierarchicalError) {
      console.error('[CardsView] Hierarchical loading failed, using fallback:', hierarchicalError);
      
      // More comprehensive fallback: try to find groups from different sources
      console.log('[CardsView] Trying comprehensive fallback...');
      
      // Check if we have cached information about which cards have children
      const potentialGroups = [];
      
      // 1. Use cards from tilesWithChildren cache
      for (const cardId of tilesWithChildren.value) {
        const card = cards.value.find(c => c.id === cardId);
        if (card && !selectedTileIds.value.has(card.id)) {
          potentialGroups.push(card);
        }
      }
      
      // 2. Add current level cards that might be groups (any card can become a group)
      const currentLevelCards = cards.value.filter(c => 
        !c.id.startsWith('empty-') && !selectedTileIds.value.has(c.id)
      );
      
      // 3. Try to load some cards from parent levels if we're in a nested view
      let parentLevelCards = [];
      if (currentGroupId.value) {
        try {
          // Load cards from root level as additional options
          const rootCards = await cardsService.loadCards(null);
          parentLevelCards = rootCards.filter(c => 
            !c.id.startsWith('empty-') && 
            !selectedTileIds.value.has(c.id) && 
            c.id !== currentGroupId.value
          );
        } catch (e) {
          console.log('[CardsView] Could not load root cards for fallback');
        }
      }
      
      // Combine and deduplicate all potential destinations
      const allPotentialGroups = [...potentialGroups];
      [...currentLevelCards, ...parentLevelCards].forEach(card => {
        if (!allPotentialGroups.some(g => g.id === card.id)) {
          allPotentialGroups.push(card);
        }
      });
      
      availableGroups = allPotentialGroups;
      console.log('[CardsView] Using comprehensive fallback groups:', availableGroups.length);
    }

    console.log('[CardsView] Opening popup with groups:', availableGroups.length);
    popupService.open({
      component: GroupSelector,
      title: 'Move to Group',
      props: {
        groups: availableGroups,
        selectedCount: selectedCards.length,
      onSelect: async (group: CardTile) => {
        try {
          // Get existing children to find the next available index
          const existingChildren = await cardsService.loadCards(group.id);
          let nextIndex = existingChildren.length;
          
          // Move all selected cards to the target group with sequential indices
          for (const card of selectedCards) {
            await cardsService.saveCard({
              ...card,
              parentId: group.id,  // Set the new parent
              index: nextIndex     // Set the sequential index
            }, group.id, nextIndex);  // Pass both parentId and index parameters
            
            nextIndex++; // Increment for next card
          }

          // Remove moved cards from current view
          cards.value = cards.value.filter(c => !selectedTileIds.value.has(c.id));

          // Clear selection
          clearSelection();

          // Update target group cache
          tilesWithChildren.value.add(group.id);

          popupService.close();
          
          // Navigate to the target group to show the moved cards
          console.log(`[CardsView] Navigating to target group: ${group.id}`);
          await navigateToTile(group);
        } catch (error) {
          console.error('Failed to move cards:', error);
          alert('Failed to move cards. Please try again.');
        }
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
  } catch (error) {
    console.error('[CardsView] Error in moveSelectedToGroup:', error);
    alert('Failed to load groups. Please try again.');
  }
};

const changeSelectedColor = () => {
  // Show color picker for bulk color change
  popupService.open({
    component: TColorPicker,
    title: 'Change Color for Selected Cards',
    props: {
      colors: Object.values(BaseColors),
      modelValue: 'primary',
      onUpdate: async (color: string) => {
        try {
          const selectedCards = cards.value.filter(c => selectedTileIds.value.has(c.id));

          // Update color for all selected cards
          for (const card of selectedCards) {
            const updatedCard = { ...card, color: color as any };
            await cardsService.saveCard(updatedCard, currentGroupId.value);

            // Update in UI
            const index = cards.value.findIndex(c => c.id === card.id);
            if (index >= 0) {
              cards.value[index] = updatedCard;
            }
          }

          // Clear selection
          clearSelection();
          popupService.close();
        } catch (error) {
          console.error('Failed to update colors:', error);
          alert('Failed to update colors. Please try again.');
        }
      }
    }
  });
};

const deleteSelected = () => {
  const selectedCount = selectedTileIds.value.size;
  const hasGroups = Array.from(selectedTileIds.value).some(id => tilesWithChildren.value.has(id));

  const message = hasGroups
    ? `Are you sure you want to delete ${selectedCount} card(s)? Some are groups and will delete all their contents.`
    : `Are you sure you want to delete ${selectedCount} card(s)?`;

  if (confirm(message)) {
    deleteSelectedCards();
  }
};

const deleteSelectedCards = async () => {
  try {
    const selectedIds = Array.from(selectedTileIds.value);

    // Delete all selected cards
    for (const cardId of selectedIds) {
      await cardsService.deleteCard(cardId);

      // Clear from cache
      tilesWithChildren.value.delete(cardId);
      tileChildrenMap.value.delete(cardId);
    }

    // Remove from UI
    cards.value = cards.value.filter(c => !selectedTileIds.value.has(c.id));

    // Clear selection
    clearSelection();
  } catch (error) {
    console.error('Failed to delete cards:', error);
    alert('Failed to delete some cards. Please try again.');
  }
};

// Bulk add mode
const openBulkAddMode = () => {
  popupService.open({
    component: BulkCardCreator,
    title: 'Bulk Add Cards',
    size: 'large',
    props: {
      onCreate: async (newCards: Partial<CardTile>[]) => {
        try {
          // Find the next available index
          const maxIndex = cards.value.reduce((max, card) => Math.max(max, card.index), -1);
          let nextIndex = maxIndex + 1;

          // Create all cards
          for (const cardData of newCards) {
            const savedId = await cardsService.saveCard(
              { ...cardData, index: nextIndex },
              currentGroupId.value,
              nextIndex
            );

            if (savedId) {
              const newCard: CardTile = {
                ...cardData,
                id: savedId,
                index: nextIndex,
              } as CardTile;
              cards.value.push(newCard);
              nextIndex++;
            }
          }

          // Sort cards by index
          cards.value.sort((a, b) => a.index - b.index);

          popupService.close();
        } catch (error) {
          console.error('Failed to create cards:', error);
          alert('Failed to create some cards. Please try again.');
        }
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
};

// Build breadcrumbs from current card
const buildBreadcrumbs = async (cardId: string | undefined) => {
  if (!cardId) {
    breadcrumbs.value = [];
    currentGroupId.value = undefined;
    return;
  }

  try {
    // Get the full path from root to current card
    const cardPath = await cardsService.getCardPath(cardId);

    // Build breadcrumbs with Home as root
    const path: Array<{ id?: string; title: string }> = [
      { id: undefined, title: 'Home' }
    ];

    // Add all cards in the path
    path.push(...cardPath);

    breadcrumbs.value = path;
    currentGroupId.value = cardId;
  } catch (error) {
    console.error('Failed to build breadcrumbs:', error);
    // Fallback to just showing current card
    breadcrumbs.value = [
      { id: undefined, title: 'Home' },
      { id: cardId, title: 'Loading...' }
    ];
    currentGroupId.value = cardId;
  }
};

// Watch for route changes
watch(() => route.params.cardId as string | undefined, async (cardId) => {
  // If we're not already loading (ghost cards not shown), show them now
  if (!isLoading.value) {
    cards.value = generateGhostCards();
    isLoading.value = true;
  }

  await buildBreadcrumbs(cardId);
  await loadCards();
}, { immediate: true });

// Watch edit mode changes - clear selection when edit mode is disabled
watch(() => isEditMode.value, (newEditMode) => {
  if (!newEditMode && selectionMode.value) {
    // When edit mode is turned off, automatically turn off selection mode
    clearSelection();
  }
});

// Handle keyboard shortcuts for edit mode
const handleEditModeShortcut = (data: { key: string }) => {
  if (data.key === 'Escape' && isEditMode.value) {
    // Exit edit mode on Escape
    disableEditMode();
    // Also clear selection if in selection mode
    if (selectionMode.value) {
      clearSelection();
    }
  } else if (data.key === 'e' && !isEditMode.value) {
    // Enter edit mode on 'e'
    enableEditMode();
  }
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
    
    // Listen for edit mode keyboard shortcuts
    eventBus.on('app:editModeShortcut', handleEditModeShortcut);
    
    // Don't load cards here - the route watcher with immediate: true will handle it
    console.log('[CardsView] Initialization complete');
  } catch (error) {
    console.error('[CardsView] Failed to initialize:', error);
  }
});

// Cleanup
onUnmounted(() => {
  // Remove keyboard shortcut listener
  eventBus.off('app:editModeShortcut', handleEditModeShortcut);
});
</script>

<style lang="scss" scoped>
// Override TAppLayout's problematic styles
:deep(.app-layout) {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-overflow-scrolling: touch;
}

:deep(.app-layout--is-app) {
  overflow: hidden; // Override the auto
}

:deep(.app-layout--is-app .app-layout__header) {
  position: static; // Override fixed positioning
  width: 100%;
  left: 0;
}

:deep(.app-layout--is-app .app-layout__content) {
  // Calculate height minus header
  height: calc(100vh - var(--top-bar-height, 60px));
  overflow: hidden;
}

:deep(.app-layout__content) {
  display: flex;
  flex-direction: column;
}

// Prevent body/html scrolling on mobile devices
:global(html, body) {
  overflow: hidden;
  height: 100vh;
  -webkit-overflow-scrolling: touch;
  -webkit-user-select: none;
  user-select: none;
  
  // Prevent pull-to-refresh and overscroll effects on iOS
  overscroll-behavior: none;
  -webkit-overscroll-behavior: none;
}

.cards-view {
  &__container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  &__main {
    flex: 1;
    min-height: 0; // Important for flex children
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

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

  &__selection-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__selection-info {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-weight: 500;
  }

  &__selection-actions {
    display: flex;
    gap: var(--space);
  }
}

.yes-no {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  width: 100%;
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
