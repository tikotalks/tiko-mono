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
        :icon="Icons.CHEVRON_LEFT"
        type="outline"
        color="primary"
        @click="handleBack"
        :aria-label="t('common.back')"
      >{{ t('common.back') }}</TButton>

      <!-- Edit mode toggle (only visible in parent mode) -->
      <TButton
        v-if="isParentModeUnlocked"
        :icon="isEditMode ? Icons.EDIT_M : Icons.EDIT_LINE"
        :type="isEditMode ? 'default' : 'outline'"
        :color="isEditMode ? 'primary' : 'secondary'"
        @click="toggleEditMode"
        :tooltip="isEditMode ? t('common.exitEditMode') : t('common.enterEditMode')"
        :tooltip-settings="{delay: 0.5, position: ToolTipPosition.BOTTOM}"
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
        v-if="isParentModeUnlocked"
        :icon="Icons.SETTINGS"
        type="outline"
        color="secondary"
        @click="handleAppSettings"
        :aria-label="t('cards.cardsSettings')"
      />

      <!-- Dev only: Clear cache button -->
      <TButton
        v-if="isParentModeUnlocked && isDev"
        :icon="Icons.REFRESH"
        type="outline"
        color="warning"
        @click="handleClearCacheAndReload"
        :aria-label="'Clear cache and reload (Dev only)'"
        :tooltip="'Clear cache and reload all cards'"
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
        <TCardGrid
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
  useParentMode,
  ToolTipPosition,
  ConfirmDialog,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import { useCardStore } from '../stores/cards';
import CardsSettingsForm from '../components/CardsSettingsForm.vue';
import { TCardGrid, TCardGhostTile } from '@tiko/ui';
import CardForm from '../components/CardForm.vue';
import GroupSelector from '../components/GroupSelector.vue';
import BulkCardCreator from '../components/BulkCardCreator.vue';
import AddCardsModal from '../components/AddCardsModal.vue';
import { useEditMode } from '../composables/useEditMode';
import { useSpeak, useEventBus, useAuthStore, useTextToSpeech } from '@tiko/core';
import { cardsService } from '../services/cards.service';
import { ItemTranslationService } from '../services/item-translation.service';
import type { ItemTranslation } from '../models/ItemTranslation.model';
import { Icons } from 'open-icon';
import type { TCardTile } from '@tiko/ui';
import { itemService } from '@tiko/core';

// Extend TCardTile interface to include additional properties
interface CardTile extends TCardTile {
  ownerId?: string;
  user_id?: string;
  speak?: string;
}

const bemm = useBemm('cards-view');
const route = useRoute();
const router = useRouter();
const yesNoStore = useCardStore();
const authStore = useAuthStore();
const { t, currentLocale } = useI18n();
const parentMode = useParentMode();

// Initialize settings from store
const settings = computed(() => yesNoStore.settings || {
  buttonSize: 'large' as 'small' | 'medium' | 'large',
  autoSpeak: true,
  hapticFeedback: true,
  buttonStyle: 'icons' as 'hands' | 'icons' | 'text',
});

// Parent mode computed state
const isParentModeUnlocked = computed(() => {
  return parentMode.isUnlocked?.value || false;
});

const { hasPermission, requestPermission } = useTextToSpeech();
const { speak, preloadAudio } = useSpeak();
const { isEditMode, toggleEditMode, disableEditMode, enableEditMode } = useEditMode();

// Inject the popup service from TFramework
const popupService = inject<any>('popupService');
const toastService = inject<any>('toastService');

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

// Track if initial load is complete - declare early to avoid reference errors
const isInitialLoadComplete = ref(false);

const loadCards = async () => {
  try {
    isLoading.value = true;

    // Load from store (which handles caching)
    const savedCards = await yesNoStore.loadCards(currentGroupId.value, currentLocale.value);

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

      // Check which tiles have children - use has_children flag for optimization
      const newTilesWithChildren = new Set<string>();
      const newTileChildrenMap = new Map<string, CardTile[]>();

      // Debug: Log all cards and their has_children status
      console.log('[CardsView] All loaded cards:', savedCards.map(c => ({
        id: c.id,
        title: c.title,
        has_children: c.has_children,
        parentId: c.parentId
      })));

      // Only check cards that are marked as having children
      const cardsWithChildren = savedCards.filter(card =>
        !card.id.startsWith('empty-') && card.has_children === true
      );

      console.log(`[CardsView] Loading children for ${cardsWithChildren.length} cards marked with has_children`);
      console.log('[CardsView] Cards with has_children flag:', cardsWithChildren.map(c => ({ id: c.id, title: c.title, has_children: c.has_children })));

      // Load children in parallel with a limit to avoid overwhelming the API
      const BATCH_SIZE = 5;

      for (let i = 0; i < cardsWithChildren.length; i += BATCH_SIZE) {
        const batch = cardsWithChildren.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(cardsWithChildren.length / BATCH_SIZE);

        console.log(`[CardsView] Processing batch ${batchNumber} of ${totalBatches} (${batch.length} cards)`);

        await Promise.all(batch.map(async (card) => {
          try {
            // Always load children to ensure fresh data
            // The store will handle caching internally
            const children = await yesNoStore.loadCards(card.id, currentLocale.value);
            if (children.length > 0) {
              newTilesWithChildren.add(card.id);
              // Ensure we have unique children by filtering out duplicates based on ID
              const uniqueChildren = children.filter((child, index, self) => 
                index === self.findIndex(c => c.id === child.id)
              );
              newTileChildrenMap.set(card.id, uniqueChildren);
              console.log(`[CardsView] Loaded ${uniqueChildren.length} unique children for card ${card.id} (${card.title})`);
            } else {
              // If has_children is true but no children found, it might need fixing
              console.warn(`[CardsView] Card ${card.id} (${card.title}) marked as has_children but no children found`);
            }
          } catch (error) {
            console.warn(`Failed to load children for card ${card.id}:`, error);
            // Continue with other cards even if one fails
          }
        }));

        console.log(`[CardsView] Completed batch ${batchNumber} of ${totalBatches}`);
      }

      // Additionally, for cards not marked with has_children but that might be new groups,
      // we can check a small subset (like recently modified cards) to catch any missed updates
      const recentlyModified = savedCards
        .filter(card => !card.id.startsWith('empty-') && !card.has_children)
        .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
        .slice(0, 3); // Only check the 3 most recently modified cards

      if (recentlyModified.length > 0) {
        console.log(`[CardsView] Checking ${recentlyModified.length} recently modified cards for children`);
        await Promise.all(recentlyModified.map(async (card) => {
          try {
            const children = await yesNoStore.loadCards(card.id, currentLocale.value);
            if (children.length > 0) {
              newTilesWithChildren.add(card.id);
              // Only add if not already in the map to avoid duplicates
              if (!newTileChildrenMap.has(card.id)) {
                // Ensure we have unique children by filtering out duplicates based on ID
                const uniqueChildren = children.filter((child, index, self) => 
                  index === self.findIndex(c => c.id === child.id)
                );
                newTileChildrenMap.set(card.id, uniqueChildren);
                console.log(`Found ${uniqueChildren.length} unique children for card ${card.id} - has_children flag may need updating`);
              }
            }
          } catch (error) {
            // Ignore errors for this verification check
          }
        }));
      }

      tilesWithChildren.value = newTilesWithChildren;
      tileChildrenMap.value = newTileChildrenMap;

      console.log(`[CardsView] Final state: ${tilesWithChildren.value.size} cards have children`);
      console.log('[CardsView] tileChildrenMap:', Array.from(tileChildrenMap.value.entries()).map(([id, children]) => ({ id, childCount: children.length })));
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
      },
    },
  });
};

const updateSettings = async () => {
  await yesNoStore.updateSettings(localSettings);
};

const handleProfile = () => {
  console.log('Profile clicked');
  // This is now handled by TUserMenu - it will show parent mode setup/unlock if needed
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
    // Only show create option if parent mode is unlocked
    if (!parentMode.isUnlocked.value) {
      return [];
    }
    return [
      {
        id: 'create',
        label: t('cards.createCard'),
        icon: Icons.PLUS,
        action: () => openCardEditForm(card, index)
      }
    ];
  }

  const hasChildren = tilesWithChildren.value.has(card.id);

  const items: any[] = [
    {
      id: 'view',
      label: hasChildren ? t('common.view') : t('common.speak'),
      icon: hasChildren ? Icons.EYE : Icons.VOLUME_III,
      action: () => handleTileAction(card)
    }
  ];

  // Check ownership and curation status
  const isOwner = card.ownerId === authStore.user?.id || card.user_id === authStore.user?.id;
  const isCurated = card.isCurated || false;

  // Show edit actions if user owns the item and parent mode is unlocked
  if (isOwner && parentMode.isUnlocked.value) {
    items.push(
      {
        id: 'edit',
        label: t('common.edit'),
        icon: Icons.EDIT_M,
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
    );
  }

  // Show hide/show options based on item state
  const isHidden = yesNoStore.settings.hiddenItems.includes(card.id);

  if (isHidden) {
    // Show option for hidden items
    items.push({
      id: 'show',
      label: t('cards.showThisItem'),
      icon: Icons.EYE,
      action: () => showItem(card.id)
    });
  } else if (isCurated) {
    // Hide option for curated items (only if not already hidden)
    items.push({
      id: 'hide',
      label: t('cards.hideThisItem'),
      icon: Icons.EYE_OFF,
      action: () => hideItem(card.id)
    });
  }

  // Show duplicate option for curated items that user doesn't own
  if (isCurated && !isOwner) {
    items.push({
      id: 'duplicate',
      label: t('cards.duplicateToEdit'),
      icon: Icons.COPY,
      action: () => duplicateItem(card)
    });
  }

  return items;
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

  // Create refs to store the component instance and save loading state
  let formComponentRef: any = null;
  const isSaving = ref(false);

  // Calculate ownership
  const isOwner = isNewCard ? true : (card.ownerId === authStore.user?.id || card.user_id === authStore.user?.id);

  // Check if this is a top-level card (no parent) - visibility toggle only for top-level items
  const isTopLevelCard = !isNewCard && !card.parentId && !currentGroupId.value;

  // Define actions for the popup
  const actions = computed(() => [
    {
      id: 'cancel',
      label: t('common.cancel'),
      type: 'outline',
      color: 'secondary',
      action: () => popupService.close(),
    },
    {
      id: 'save',
      label: isNewCard ? t('common.create') : t('common.save'),
      type: 'default',
      color: 'primary',
      status: isSaving.value ? 'loading' : 'default',
      action: async () => {
        if (formComponentRef?.triggerSave) {
          formComponentRef.triggerSave();
        } else {
          console.error('No triggerSave method available on component', formComponentRef);
        }
      },
    },
  ]);

  popupService.open({
    component: CardForm,
    title: isNewCard ? 'Create New Tile' : 'Edit Tile',
    actions: actions,
      props: {
        card: card,
        index: index,
        hasChildren: tilesWithChildren.value.has(card.id),
        translations: translations,
        showVisibilityToggle: isTopLevelCard, // Only show for top-level cards
        isOwner: isOwner,
        onMounted: (instance: any) => {
          formComponentRef = instance;
        },
        onTranslationsGenerated: async () => {
          // Reload cards when translations are generated
          await loadCards();
        },
        onSubmit: async (cardData: Partial<CardTile>, cardIndex: number, newTranslations: ItemTranslation[]) => {
          isSaving.value = true;
          if (isNewCard) {
            // For new cards, we need to save first to get the ID
            try {
              const savedId = await cardsService.saveCard(cardData, currentGroupId.value, index, newTranslations);
              if (savedId) {
                const newCard: CardTile = {
                  ...cardData,
                  id: savedId,
                  index: index,
                } as CardTile;

                // Update local state
                cards.value = [...cards.value.filter(c => !c.id.startsWith('empty-')), newCard];

                // Update store cache
                await yesNoStore.addCardToCache(newCard, currentGroupId.value, currentLocale.value);
              }
              popupService.close();
            } catch (error) {
              console.error('Failed to create card:', error);
              toastService?.show({
                message: t('cards.failedToCreateCard'),
                type: 'error'
              });
            } finally {
              isSaving.value = false;
            }
          } else {
            // For existing cards, use optimistic update
            const originalCard = { ...card };
            const originalCardsArray = [...cards.value];
            const originalChildrenMap = card.parentId && tileChildrenMap.value.has(card.parentId)
              ? [...tileChildrenMap.value.get(card.parentId)!]
              : null;

            try {
              // Optimistic update - update UI immediately
              const updatedCard = { ...card, ...cardData };
              const updatedCards = [...cards.value];
              const existingIndex = updatedCards.findIndex(c => c.id === card.id);
              if (existingIndex >= 0) {
                updatedCards[existingIndex] = updatedCard;
                cards.value = updatedCards;
              }

              // Update store cache optimistically
              await yesNoStore.updateCardInCache(updatedCard, currentGroupId.value, currentLocale.value);

              // If this card has a parent, also update it in the parent's children map
              if (updatedCard.parentId && tileChildrenMap.value.has(updatedCard.parentId)) {
                const parentChildren = tileChildrenMap.value.get(updatedCard.parentId);
                if (parentChildren) {
                  const childIndex = parentChildren.findIndex(c => c.id === updatedCard.id);
                  if (childIndex >= 0) {
                    const updatedChildren = [...parentChildren];
                    updatedChildren[childIndex] = updatedCard;
                    tileChildrenMap.value.set(updatedCard.parentId, updatedChildren);
                    console.log(`Updated child card ${updatedCard.id} in parent ${updatedCard.parentId} children map`);
                  }
                }
              }

              // Close popup immediately for better UX
              popupService.close();

              // Save to database in background
              const savedId = await cardsService.saveCard(updatedCard, currentGroupId.value, undefined, newTranslations);

              if (!savedId) {
                throw new Error('Failed to save card');
              }

              // Success - no need to do anything, UI is already updated
              console.log('Card saved successfully:', savedId);

            } catch (error) {
              console.error('Failed to save card:', error);

              // Rollback on failure
              cards.value = originalCardsArray;
              await yesNoStore.updateCardInCache(originalCard, currentGroupId.value, currentLocale.value);

              // Rollback children map if needed
              if (originalChildrenMap && originalCard.parentId) {
                tileChildrenMap.value.set(originalCard.parentId, originalChildrenMap);
              }

              // Show error toast
              toastService?.show({
                message: t('cards.failedToSaveCard'),
                type: 'error'
              });
            } finally {
              isSaving.value = false;
            }
          }
        },
        onCancel: () => {
          popupService.close();
        }
      },
    });
};

// Confirm delete card action
const confirmDeleteCard = async (card: CardTile) => {
  const hasChildren = tilesWithChildren.value.has(card.id);
  const message = hasChildren
    ? t('cards.deleteThisCard') + ' ' + t('cards.deleteGroupWarning')
    : t('cards.deleteThisCard');

  popupService.open({
    component: ConfirmDialog,
    props: {
      title: t('cards.deleteCard'),
      message: message,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      confirmColor: 'error',
      onConfirm: async () => {
        // Store original state for rollback
        const originalCards = [...cards.value];
        const originalHasChildren = tilesWithChildren.value.has(card.id);
        const originalChildren = tileChildrenMap.value.get(card.id);

        try {
          // Optimistic update - remove from UI immediately
          cards.value = cards.value.filter(c => c.id !== card.id);
          tilesWithChildren.value.delete(card.id);
          tileChildrenMap.value.delete(card.id);

          // Remove from store cache
          await yesNoStore.removeCardFromCache(card.id, currentGroupId.value, currentLocale.value);

          // Delete from database in background
          const success = await cardsService.deleteCard(card.id);

          if (!success) {
            throw new Error('Failed to delete card');
          }

          // Success - no need to do anything, UI is already updated
          console.log('Card deleted successfully:', card.id);

          popupService.close();
        } catch (error) {
          console.error('Failed to delete card:', error);

          // Rollback on failure
          cards.value = originalCards;
          if (originalHasChildren) {
            tilesWithChildren.value.add(card.id);
          }
          if (originalChildren) {
            tileChildrenMap.value.set(card.id, originalChildren);
          }

          // Re-add to cache
          await yesNoStore.updateCardInCache(card, currentGroupId.value, currentLocale.value);

          // Show error toast
          toastService?.show({
            message: t('cards.failedToDeleteCard'),
            type: 'error'
          });

          popupService.close();
        }
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
};

// Hide item from user's view
const hideItem = async (itemId: string) => {
  try {
    const currentSettings = yesNoStore.settings;
    const hiddenItems = [...(currentSettings.hiddenItems || []), itemId];

    await yesNoStore.updateSettings({ hiddenItems });

    // Remove from current view
    cards.value = cards.value.filter(c => c.id !== itemId);

    toastService?.show({
      message: t('cards.itemHidden'),
      type: 'success'
    });
    popupService.close();
  } catch (error) {
    console.error('Failed to hide item:', error);
    toastService?.show({
      message: 'Failed to hide item',
      type: 'error'
    });
  }
};

// Show previously hidden item
const showItem = async (itemId: string) => {
  try {
    const currentSettings = yesNoStore.settings;
    const hiddenItems = (currentSettings.hiddenItems || []).filter(id => id !== itemId);

    await yesNoStore.updateSettings({ hiddenItems });

    // Refresh the current view to show the item
    await loadCardsFromStore(currentGroupId.value);

    toastService?.show({
      message: t('cards.itemShown'),
      type: 'success'
    });
    popupService.close();
  } catch (error) {
    console.error('Failed to show item:', error);
    toastService?.show({
      message: 'Failed to show item',
      type: 'error'
    });
  }
};

// Duplicate item and mark original as hidden
const duplicateItem = async (originalCard: CardTile) => {
  try {
    // Create the duplicate with reference to original
    const duplicateData = {
      title: `${originalCard.title} (Copy)`,
      color: originalCard.color,
      image: originalCard.image,
      speech: originalCard.speech,
      isPublic: false, // Duplicated items are private by default
      type: originalCard.type,
      parentId: originalCard.parentId
    };

    // Create the duplicate card
    const cardId = await cardsService.saveCard(duplicateData, originalCard.parentId, originalCard.index);

    if (cardId) {
      // Hide the original item
      const currentSettings = yesNoStore.settings;
      const hiddenItems = [...(currentSettings.hiddenItems || []), originalCard.id];
      await yesNoStore.updateSettings({ hiddenItems });

      // Remove original from view and add duplicate
      cards.value = cards.value.filter(c => c.id !== originalCard.id);

      const newCard: CardTile = {
        id: cardId,
        title: duplicateData.title,
        color: duplicateData.color,
        image: duplicateData.image || '',
        speech: duplicateData.speech || '',
        type: duplicateData.type as any,
        index: originalCard.index,
        parentId: originalCard.parentId,
        isPublic: false,
        isCurated: false,
        ownerId: authStore.user?.id,
        user_id: authStore.user?.id
      };

      cards.value.push(newCard);

      toastService?.show({
        message: t('cards.itemDuplicated'),
        type: 'success'
      });
      popupService.close();
    }
  } catch (error) {
    console.error('Failed to duplicate item:', error);
    toastService?.show({
      message: 'Failed to duplicate item',
      type: 'error'
    });
  }
};

const handleCardClick = async (card: CardTile, index: number) => {
  // In selection mode, toggle selection instead of normal behavior
  if (selectionMode.value && !card.id.startsWith('empty-')) {
    toggleTileSelection(card.id);
    return;
  }

  if (isEditMode.value) {
    // For empty cards, directly open the edit form
    if (card.id.startsWith('empty-')) {
      openCardEditForm(card, index);
    }
    // For existing cards, do nothing - let the context menu handle interactions
    return;
  } else {
    // In view mode, check if tile has children
    if (!card.id.startsWith('empty-')) {
      handleTileAction(card);
    }
  }
};

const handleTileAction = async (tile: CardTile) => {
  // Check if this tile has children (include curated items based on settings)
  const showCurated = settings.value.showCuratedItems;
  const hasChildren = await cardsService.hasChildren(tile.id, showCurated);

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
    // Extract language code for metadata (e.g., 'nl-NL' -> 'nl')
    const speakLanguage = speakLocale.split('-')[0];
    console.log(`[TTS] Speaking text in locale: ${speakLocale}, language code: ${speakLanguage}`);

    // Pass both the language code and the speech text
    // The TTS service will handle adding language hints if needed
    await speak(tile.speech, { language: speakLanguage });
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

// Dev mode check
const isDev = computed(() => {
  return import.meta.env.DEV || window.location.hostname === 'localhost';
});

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
    // Ensure no duplicates by filtering based on ID
    const allChildren = [...existingChildren, droppedCard].filter((child, index, self) => 
      index === self.findIndex(c => c.id === child.id)
    );
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
  // Don't do anything if the card is already at this position
  if (card.index === newIndex) return;

  // Store original state for rollback
  const originalCards = [...cards.value];

  // Create new array and remove the card from its current position
  const newCards = cards.value.filter(c => c.id !== card.id);

  // Update the card's index
  const movedCard = { ...card, index: newIndex };

  // Insert the card at the new position in the array
  newCards.splice(newIndex, 0, movedCard);

  // Update UI instantly - card should appear in new position immediately
  cards.value = newCards;

  // Save to database
  try {
    await cardsService.saveCard(movedCard, currentGroupId.value, newIndex);
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
    // Ensure no duplicates by filtering based on ID
    const allChildren = [...existingChildren, ...sortedDroppedCards].filter((child, index, self) => 
      index === self.findIndex(c => c.id === child.id)
    );
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

  // Optimistic update - immediately update UI
  // Remove the cards being moved
  const remainingCards = cards.value.filter(c => !reorderedCards.some(rc => rc.id === c.id));

  // Insert the moved cards at the target position
  const newCards = [...remainingCards];
  newCards.splice(targetIndex, 0, ...reorderedCards);

  // Update all indices to be sequential
  newCards.forEach((card, index) => {
    card.index = index;
  });

  // Update UI immediately
  cards.value = newCards;

  try {
    // Save all cards with their new indices
    const cardIds = newCards
      .filter(c => !c.id.startsWith('empty-'))
      .map(c => c.id);

    await cardsService.reorderCards(cardIds);

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
      toastService?.show({
        message: 'No cards selected',
        type: 'warning'
      });
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
          console.log(`[CardsView] Moving ${selectedCards.length} cards to group ${group.id} (${group.title})`);

          // Get existing children to find the next available index
          const existingChildren = await cardsService.loadCards(group.id);
          let nextIndex = existingChildren.length;
          console.log(`[CardsView] Target group has ${existingChildren.length} existing children`);

          // Move all selected cards to the target group with sequential indices
          for (const card of selectedCards) {
            console.log(`[CardsView] Moving card ${card.id} (${card.title}) to parent ${group.id} at index ${nextIndex}`);

            const result = await cardsService.saveCard({
              ...card,
              parentId: group.id,  // Set the new parent
              index: nextIndex     // Set the sequential index
            }, group.id, nextIndex);  // Pass both parentId and index parameters

            console.log(`[CardsView] Save result for ${card.id}:`, result);

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
          toastService?.show({
            message: 'Failed to move cards. Please try again.',
            type: 'error'
          });
        }
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
  } catch (error) {
    console.error('[CardsView] Error in moveSelectedToGroup:', error);
    toastService?.show({
      message: 'Failed to load groups. Please try again.',
      type: 'error'
    });
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
          toastService?.show({
            message: 'Failed to update colors. Please try again.',
            type: 'error'
          });
        }
      }
    }
  });
};

const deleteSelected = () => {
  const selectedCount = selectedTileIds.value.size;
  const hasGroups = Array.from(selectedTileIds.value).some(id => tilesWithChildren.value.has(id));

  const message = hasGroups
    ? t('cards.confirmDeleteMultiple', { count: selectedCount }) + ' ' + t('cards.deleteGroupsWarning')
    : t('cards.confirmDeleteMultiple', { count: selectedCount });

  popupService.open({
    component: ConfirmDialog,
    props: {
      title: t('cards.deleteSelectedCards'),
      message: message,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      confirmColor: 'error',
      onConfirm: async () => {
        await deleteSelectedCards();
        popupService.close();
      },
      onCancel: () => {
        popupService.close();
      }
    }
  });
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
    toastService?.show({
      message: 'Failed to delete some cards. Please try again.',
      type: 'error'
    });
  }
};

// Find first empty position in the grid
const findFirstEmptyPosition = (): number => {
  // Get all occupied positions
  const occupiedPositions = new Set(
    cards.value
      .filter(c => !c.id.startsWith('empty-'))
      .map(c => c.index)
  );

  // Find first missing index
  for (let i = 0; i < cards.value.length; i++) {
    if (!occupiedPositions.has(i)) {
      return i;
    }
  }

  // If all positions are filled, return next position
  return cards.value.length;
};

// We'll just ensure the card is visible by reloading if needed
// The CardGrid component will handle pagination internally

// Clear cache and reload all cards (dev only)
const handleClearCacheAndReload = async () => {
  console.log('[CardsView] Clearing cache and reloading all cards...');

  // Show loading state
  isLoading.value = true;

  try {
    // Clear the cache
    await yesNoStore.clearCache();

    // Also run has_children verification
    console.log('[CardsView] Running has_children verification...');
    const verifyResult = await yesNoStore.verifyHasChildrenFlags();
    if (verifyResult) {
      console.log('[CardsView] Verification result:', verifyResult);
      toastService?.show({
        message: `Cache cleared. Fixed ${verifyResult.fixed} has_children flags out of ${verifyResult.total} items.`,
        type: 'success'
      });
    }

    // Force reload all cards
    await yesNoStore.loadAllCards(currentLocale.value);

    // Reload current view
    await loadCards();

    console.log('[CardsView] Cache cleared and cards reloaded');
  } catch (error) {
    console.error('[CardsView] Failed to clear cache and reload:', error);
    toastService?.show({
      message: 'Failed to clear cache and reload',
      type: 'error'
    });
  } finally {
    isLoading.value = false;
  }
};

// Add cards modal (unified single/bulk)
const openBulkAddMode = () => {
  popupService.open({
    component: AddCardsModal,
    title: t('cards.addCards'),
    size: 'large',
    props: {
      // For single card save
      onSave: async (cardData: Partial<CardTile>, _index: number) => {
        try {
          // Find first empty position
          const targetIndex = findFirstEmptyPosition();

          const savedId = await cardsService.saveCard(
            { ...cardData, index: targetIndex },
            currentGroupId.value,
            targetIndex
          );

          if (savedId) {
            const newCard: CardTile = {
              ...cardData,
              id: savedId,
              index: targetIndex,
            } as CardTile;

            // Replace empty card or add to list
            const emptyIndex = cards.value.findIndex(c => c.index === targetIndex && c.id.startsWith('empty-'));
            if (emptyIndex !== -1) {
              cards.value[emptyIndex] = newCard;
            } else {
              cards.value.push(newCard);
            }

            // Sort cards by index
            cards.value.sort((a, b) => a.index - b.index);

            // Update store cache
            await yesNoStore.addCardToCache(newCard, currentGroupId.value, currentLocale.value);

            // The CardGrid will automatically handle showing the new card
          }
        } catch (error) {
          console.error('Failed to create card:', error);
          alert('Failed to create card. Please try again.');
        }
      },
      // For bulk create
      onCreate: async (newCards: Partial<CardTile>[]) => {
        try {
          let firstNewCardIndex = -1;

          console.log('[CardsView] Creating bulk cards:', newCards);
          console.log('[CardsView] Current group ID:', currentGroupId.value);

          // Create all cards
          for (const cardData of newCards) {
            const targetIndex = findFirstEmptyPosition();

            if (firstNewCardIndex === -1) {
              firstNewCardIndex = targetIndex;
            }

            const parentIdToUse = cardData.parentId || currentGroupId.value;
            console.log(`[CardsView] Creating card "${cardData.title}" with parent:`, parentIdToUse);

            const savedId = await cardsService.saveCard(
              { ...cardData, index: targetIndex },
              parentIdToUse,
              targetIndex
            );

            if (savedId) {
              const newCard: CardTile = {
                ...cardData,
                id: savedId,
                index: targetIndex,
              } as CardTile;

              // Replace empty card or add to list
              const emptyIndex = cards.value.findIndex(c => c.index === targetIndex && c.id.startsWith('empty-'));
              if (emptyIndex !== -1) {
                cards.value[emptyIndex] = newCard;
              } else {
                cards.value.push(newCard);
              }

              // Update store cache
              await yesNoStore.addCardToCache(newCard, currentGroupId.value, currentLocale.value);
            }
          }

          // Sort cards by index
          cards.value.sort((a, b) => a.index - b.index);

          // The CardGrid will automatically handle showing the new cards

          popupService.close();
        } catch (error) {
          console.error('Failed to create cards:', error);
          toastService?.show({
            message: 'Failed to create some cards. Please try again.',
            type: 'error'
          });
        }
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

// Watch for route changes (not immediate - initial load handled in onMounted)
watch(() => route.params.cardId as string | undefined, async (cardId) => {
  try {
    console.log('[CardsView] Route changed to:', cardId);

    // Show loading state
    if (!isLoading.value) {
      cards.value = generateGhostCards();
      isLoading.value = true;
    }

    await buildBreadcrumbs(cardId);
    await loadCards();
  } catch (error) {
    console.error('[CardsView] Error in route watcher:', error);
    // Still try to load cards even if there's an error
    isLoading.value = false;
    cards.value = [];
  }
});

// Watch edit mode changes - clear selection when edit mode is disabled
watch(() => isEditMode.value, (newEditMode) => {
  if (!newEditMode && selectionMode.value) {
    // When edit mode is turned off, automatically turn off selection mode
    clearSelection();
  }
});

// Handle keyboard shortcuts for edit mode
const handleEditModeShortcut = (data: { key: string }) => {
  if (data.key === 'Escape') {
    if (selectionMode.value) {
      // Exit selection mode first
      clearSelection();
    } else if (isEditMode.value) {
      // Then exit edit mode
      disableEditMode();
    }
  } else if (data.key === 'e' && !isEditMode.value && parentMode.isUnlocked?.value) {
    // Enter edit mode on 'e' (only if parent mode is unlocked)
    enableEditMode();
  } else if (data.key === 's' && isEditMode.value) {
    // Toggle selection mode on 's' (only works in edit mode)
    toggleSelectionMode();
  } else if (data.key === 'a' && isEditMode.value) {
    // Open bulk add modal on 'a' (only works in edit mode)
    openBulkAddMode();
  }
};

// Watch parent mode status and disable edit mode if locked
watch(() => parentMode.isUnlocked?.value, (isUnlocked) => {
  if (!isUnlocked && isEditMode.value) {
    disableEditMode();
    clearSelection();
  }
});

// Watch for locale changes and reload cards with new translations
watch(() => currentLocale.value, async (newLocale, oldLocale) => {
  if (newLocale !== oldLocale && newLocale) {
    console.log('[CardsView] Locale changed from', oldLocale, 'to', newLocale, '- reloading cards...');

    // Clear the cache for the old locale to force fresh load
    await yesNoStore.clearCacheForLocale(oldLocale);

    // Load all cards with new locale
    await yesNoStore.loadAllCards(newLocale);

    // Reload current view with new translations
    await loadCards();
  }
});

// Initialize
onMounted(async () => {
  console.log('[CardsView] Component mounted, loading cards...');
  try {
    // Initialize parent mode
    if (parentMode.initialize) {
      console.log('[CardsView] Initializing parent mode...');
      await parentMode.initialize();
    }

    // Pre-request speech permission to avoid delay on first click
    if (!hasPermission.value) {
      await requestPermission();
    }

    await yesNoStore.loadState();

    // Load ALL cards initially in single API call
    console.log('[CardsView] Loading all cards on app initialization...');
    await yesNoStore.loadAllCards(currentLocale.value);
    console.log('[CardsView] All cards loaded into cache');

    // Mark initial load as complete
    isInitialLoadComplete.value = true;

    // Listen for edit mode keyboard shortcuts
    eventBus.on('app:editModeShortcut', handleEditModeShortcut);

    // Now trigger the initial load if route watcher hasn't run yet
    if (cards.value.length === 0 || cards.value.every(c => c.id.startsWith('ghost-'))) {
      console.log('[CardsView] Triggering initial card load...');
      await buildBreadcrumbs(route.params.cardId as string | undefined);
      await loadCards();
    }

    console.log('[CardsView] Initialization complete');
  } catch (error) {
    console.error('[CardsView] Failed to initialize:', error);
    // Even on error, mark as complete to prevent hanging
    isInitialLoadComplete.value = true;
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
    font-size: 10vh;
    border: 2px solid red;
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
