<template>
  <TAppLayout :title="t('sequence.sequenceTitle')" :show-header="true" app-name="sequence" @profile="handleProfile"
    @settings="handleSettings" @logout="handleLogout">
    <template #app-controls>
      <!-- Back button when in sub-level or play mode -->
      <TButton v-if="currentGroupId || isPlayMode" :icon="Icons.CHEVRON_LEFT" type="outline" color="primary"
        @click="handleBack" :aria-label="t('common.back')">{{ t('common.back') }}</TButton>

      <!-- Edit mode toggle (only visible in parent mode) -->
      <TButton v-if="isParentModeUnlocked" :icon="isEditMode ? Icons.EDIT_M : Icons.EDIT_LINE"
        :type="isEditMode ? 'default' : 'outline'" :color="isEditMode ? 'primary' : 'secondary'" @click="toggleEditMode"
        :tooltip="isEditMode ? t('common.exitEditMode') : t('common.enterEditMode')"
        :aria-label="isEditMode ? t('common.exitEditMode') : t('common.enterEditMode')" />

      <!-- Bulk Add button (only in edit mode) -->
      <TButton v-if="isEditMode" :icon="Icons.ADD_FAT" type="icon-only" color="secondary" @click="openBulkAddMode"
        :aria-label="t('sequence.bulkAdd')" :tooltip="t('sequence.bulkAdd')" />

      <!-- App settings button (only visible in parent mode) -->
      <TButton v-if="isParentModeUnlocked" :icon="Icons.SETTINGS" type="outline" color="secondary"
        @click="handleAppSettings" :aria-label="t('sequence.sequenceSettings')" />

      <!-- Admin button (only visible to admins) -->
      <TButton v-if="isAdmin" :icon="Icons.SHIELD" type="outline" color="warning" @click="goToAdminPanel"
        :tooltip="t('admin.managePublicItems')" :aria-label="t('admin.managePublicItems')" />
    </template>

    <div :class="bemm('container')">
      <!-- Breadcrumb navigation -->
      <nav v-if="breadcrumbs.length > 0" :class="bemm('breadcrumbs')">
        <button v-for="(crumb, index) in breadcrumbs" :key="crumb.id || 'root'" :class="bemm('breadcrumb')"
          @click="navigateToBreadcrumb(index)">
          <TIcon v-if="index > 0" name="chevron-right" size="small" />
          {{ crumb.title }}
        </button>
      </nav>

      <!-- Main display - either grid or play mode -->
      <div :class="bemm('main')">
        <SequencePlay v-if="isPlayMode && currentSequenceId" :sequence-id="currentSequenceId" :edit-mode="isEditMode"
          @restart="restartPlay" @close="exitPlayMode" />
        <TCardGrid v-else :cards="sequence" :show-arrows="true" :edit-mode="isEditMode"
          :tiles-with-children="tilesWithChildren" :tile-children-map="tileChildrenMap"
          :is-tile-dragging="isTileDragging" :selection-mode="selectionMode" :selected-tile-ids="selectedTileIds"
          :is-loading="isLoading" :get-context-menu="isEditMode ? getCardContextMenu : undefined"
          @card-click="handleCardClick" @card-drop="handleCardDrop" @card-reorder="handleCardReorder"
          @sequence-drop="handleMultiCardDrop" @sequence-reorder="handleMultiCardReorder"
          @update:tile-dragging="isTileDragging = $event" />
      </div>
    </div>

    <!-- Selection Status Bar -->
    <TStatusBar :show="selectedTileIds.size > 0 && selectionMode">
      <div :class="bemm('selection-status')">
        <div :class="bemm('selection-info')">
          <TIcon :name="Icons.CHECK_M" />
          <span>
            {{ selectedTileIds.size }} {{ selectedTileIds.size === 1 ? 'card' : 'sequence' }} selected
          </span>
        </div>

        <div :class="bemm('selection-actions')">
          <TButtonGroup>
            <TButton size="small" type="outline" :icon="Icons.FOLDER_ADD" @click="moveSelectedToGroup">
              Move to Group
            </TButton>

            <TButton size="small" type="outline" :icon="Icons.COLOR_PALLETTE" @click="changeSelectedColor">
              Change Color
            </TButton>

            <TButton size="small" type="outline" color="error" :icon="Icons.TRASH" @click="deleteSelected">
              Delete
            </TButton>

            <TButton size="small" type="ghost" @click="clearSelection">
              Clear Selection
            </TButton>
          </TButtonGroup>
        </div>
      </div>
    </TStatusBar>
  </TAppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, watch, inject, ref, computed, nextTick } from 'vue';
import { useBemm } from 'bemm';
import { useRoute, useRouter } from 'vue-router';
import {
  TButton,
  TAppLayout,
  TIcon,
  TStatusBar,
  TButtonGroup,
  TColorPicker,
  BaseColors,
  useParentMode,
  type PopupAction,
  popupRefs,
  Status,
} from '@tiko/ui';
import { useI18n } from '@tiko/core';
import { useSequenceStore } from '../stores/sequence';
import SequenceSettingsForm from '../components/SequenceSettingsForm.vue';
import { TCardGrid } from '@tiko/ui';
import SequenceForm from '../components/SequenceForm.vue';
import CuratedItemActions from '../components/CuratedItemActions.vue';
import GroupSelector from '../components/GroupSelector.vue';
import AddSequenceModal from '../components/AddSequenceModal.vue';
import SequencePlay from '../components/SequencePlay.vue';
import type { TCardTile } from '@tiko/ui';
import { useEditMode } from '../composables/useEditMode';
import { useSpeak, useEventBus, useAuthStore, useTextToSpeech } from '@tiko/core';
import { sequenceService } from '../services/sequence.service';
import { ItemTranslationService } from '../services/item-translation.service';
import type { ItemTranslation } from '../models/ItemTranslation.model';
import { Icons } from 'open-icon';

const bemm = useBemm('sequence-view');
const settings = computed(() => sequenceStore.settings);
const route = useRoute();
const router = useRouter();
const sequenceStore = useSequenceStore();
const authStore = useAuthStore();
const { t, currentLocale } = useI18n();
const parentMode = useParentMode();

// Parent mode computed state
const isParentModeUnlocked = computed(() => {
  return parentMode.isUnlocked?.value || false;
});

// Admin check
const isAdmin = computed(() => {
  const user = authStore.user;
  if (!user) return false;

  // Check for admin role - adjust based on your auth system
  return user.email?.endsWith('@admin.tiko.app') ||
    user.user_metadata?.role === 'admin' ||
    false;
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

type SequenceTile = TCardTile;

const sequence = ref<SequenceTile[]>([]);

// Debug watcher to track when sequence changes
if (import.meta.env.DEV) {
  watch(() => sequence.value.length, (newLength, oldLength) => {
    if (newLength !== oldLength) {
      console.log(`[SequenceView] Sequence length changed from ${oldLength} to ${newLength}`);
      if (newLength === 0 && oldLength > 0) {
        console.warn('[SequenceView] WARNING: Sequence was cleared!', new Error().stack);
      }
    }
  }, { immediate: true });
}
const currentGroupId = ref<string | undefined>(undefined);
const breadcrumbs = ref<Array<{ id?: string; title: string }>>([]);

// Multi-select state
const selectionMode = ref(false);
const selectedTileIds = ref<Set<string>>(new Set());

// Loading state - use store's loading state instead of local state
const isLoading = computed(() => sequenceStore.isLoadingSequence);

// Play mode state
const isPlayMode = ref(false);
const currentSequenceId = ref<string | null>(null);


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



// Generate ghost sequence for loading state
const generateGhostSequence = (): SequenceTile[] => {
  // Generate a random number of ghost sequence (between 8 and 16)
  const count = Math.floor(Math.random() * 9) + 8;
  const ghostSequence: SequenceTile[] = [];

  for (let i = 0; i < count; i++) {
    ghostSequence.push({
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

  return ghostSequence;
};

const loadSequence = async () => {
  console.log('[SequenceView] Starting loadSequence for groupId:', currentGroupId.value);

  // Load from store (which handles caching and loading state)
  const savedSequence = await sequenceStore.loadSequence(currentGroupId.value, currentLocale.value);

  console.log('[SequenceView] Loaded sequence from store:', savedSequence.length, 'items');

  // Only update if we got data or if we currently have ghost cards
  // This prevents clearing existing data with empty arrays
  if (savedSequence.length > 0 || sequence.value.some(c => c.id.startsWith('ghost-'))) {
    sequence.value = savedSequence;
  } else if (savedSequence.length === 0 && sequence.value.length > 0) {
    console.warn('[SequenceView] Received empty array but have existing data, keeping current sequence');
  }

  if (savedSequence.length > 0) {
    // Preload audio for sequence with speech
    const textsToPreload = savedSequence
      .filter(card => !card.id.startsWith('empty-') && card.speech)
      .map(card => ({
        text: card.speech || ''
      }));

    if (textsToPreload.length > 0) {
      preloadAudio(textsToPreload);
    }

    // Load children data in parallel in the background - don't await this
    // This ensures the data is in the cache for the computed properties to use
    const sequenceTiles = savedSequence.filter(card => card.type === 'sequence' && !card.id.startsWith('empty-'));

    if (sequenceTiles.length > 0) {
      console.log('[SequenceView] Loading children for', sequenceTiles.length, 'sequence tiles in background');
      // Load children data in parallel without blocking the UI
      Promise.all(
        sequenceTiles.map(card =>
          sequenceStore.loadSequence(card.id, currentLocale.value).catch(err => {
            console.error(`[SequenceView] Failed to load children for ${card.id}:`, err);
            return [];
          })
        )
      ).then(() => {
        console.log('[SequenceView] Finished loading all children data');
      });
    }
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
    component: SequenceSettingsForm,
    title: t('sequence.cardSettings'),
    props: {
      settings: settings.value,
      onApply: async (newSettings: any) => {
        Object.assign(localSettings, newSettings);
        await sequenceStore.updateSettings(newSettings);
      },
    },
  });
};

const goToAdminPanel = async () => {
  await router.push('/admin');
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


// Play mode functions
const startPlayMode = (sequenceId: string) => {
  currentSequenceId.value = sequenceId;
  isPlayMode.value = true;
};

const exitPlayMode = async () => {
  isPlayMode.value = false;
  currentSequenceId.value = null;
  sequenceStore.resetPlay();

  // Navigate back to home view
  if (currentGroupId.value) {
    await router.push('/');
  }
};

const restartPlay = () => {
  if (currentSequenceId.value) {
    sequenceStore.restartPlay();
  }
};

// Context menu configuration for sequence
const getCardContextMenu = (card: SequenceTile, index: number) => {
  const isNewCard = card.id.startsWith('empty-');

  if (isNewCard) {
    // Only show create option if parent mode is unlocked
    if (!parentMode.isUnlocked) {
      return [];
    }
    return [
      {
        id: 'create',
        label: t('sequence.createCard'),
        icon: Icons.PLUS,
        action: () => openCardEditForm(card, index)
      }
    ];
  }

  const hasChildren = tilesWithChildren.value.has(card.id);

  const items: Array<{ id: string; label: string; icon: string; action: () => void; type?: string }> = [
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
  if (isOwner && parentMode.isUnlocked) {
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

  // Show hide option for curated items (regardless of ownership)
  if (isCurated) {
    items.push({
      id: 'hide',
      label: t('sequence.hideThisItem'),
      icon: Icons.EYE_OFF,
      action: () => hideItem(card.id)
    });
  }

  // Show duplicate option for curated items that user doesn't own
  if (isCurated && !isOwner) {
    items.push({
      id: 'duplicate',
      label: t('sequence.duplicateToEdit'),
      icon: Icons.COPY,
      action: () => duplicateItem(card)
    });
  }

  return items;
};

// Handle save sequence logic
const handleSaveSequence = async (formData: any, card: SequenceTile, isNewCard: boolean, index: number) => {
  console.log('[SequenceView] Saving sequence with formData:', formData);
  try {
    if (isNewCard) {
      // Create new sequence at the specified position
      const sequenceId = await sequenceService.createSequence({
        title: formData.title,
        color: formData.color,
        image: formData.image,
        isPublic: formData.isPublic || false,
        items: formData.items
      }, currentGroupId.value, index);
      if (sequenceId) {
        // Optimistically add to cache
        const newSequence: SequenceTile = {
          id: sequenceId,
          title: formData.title,
          color: formData.color,
          image: formData.image?.url || null,
          type: 'sequence' as any,
          index: index,
          speech: '',
          icon: 'square',
          parentId: currentGroupId.value,
          isPublic: formData.isPublic || false
        };

        await sequenceStore.addCardToCache(newSequence, currentGroupId.value, currentLocale.value);

        // Update local sequence array immediately
        const updatedSequence = [...sequence.value];
        const emptyCardIndex = updatedSequence.findIndex(c => c.id.startsWith('empty-') && c.index === index);
        if (emptyCardIndex >= 0) {
          updatedSequence[emptyCardIndex] = newSequence;
        } else {
          updatedSequence.push(newSequence);
        }
        sequence.value = updatedSequence;

        // If the new sequence has items, update the children map
        if (formData.items && formData.items.length > 0) {
          const childrenTiles: SequenceTile[] = formData.items.map((item: any, idx: number) => ({
            id: `temp-${Date.now()}-${idx}`, // These will get real IDs after save
            title: item.title,
            color: item.color,
            image: item.image?.url || '',
            speech: item.speak || '',
            type: 'sequence-item' as any,
            icon: 'square',
            index: item.orderIndex,
            parentId: sequenceId
          }));

          tileChildrenMap.value.set(sequenceId, childrenTiles);
          tilesWithChildren.value.add(sequenceId);
        }

        popupService.close();
      }
    } else {
      // Update existing sequence
      await sequenceService.updateSequence(card.id, {
        title: formData.title,
        color: formData.color,
        image: formData.image,
        isPublic: formData.isPublic || false,
        items: formData.items
      });

      // Optimistically update cache and UI
      const updatedSequence: SequenceTile = {
        ...card,
        title: formData.title,
        color: formData.color,
        image: formData.image?.url || null,
        isPublic: formData.isPublic || false
      };

      await sequenceStore.updateCardInCache(updatedSequence, currentGroupId.value, currentLocale.value);

      // Update local sequence array immediately
      const updatedSequenceArray = [...sequence.value];
      const existingIndex = updatedSequenceArray.findIndex(c => c.id === card.id);
      if (existingIndex >= 0) {
        updatedSequenceArray[existingIndex] = updatedSequence;
        sequence.value = updatedSequenceArray;
      }

      // Update the children map with the new items
      if (formData.items && formData.items.length > 0) {
        const childrenTiles: SequenceTile[] = formData.items.map((item: any, idx: number) => ({
          id: item.id || `temp-${Date.now()}-${idx}`,
          title: item.title,
          color: item.color,
          image: item.image?.url || '',
          speech: item.speak || '',
          type: 'sequence-item' as any,
          icon: 'square',
          index: item.orderIndex,
          parentId: card.id
        }));

        // Replace the entire cache for this sequence's children
        await sequenceStore.replaceCacheForParent(childrenTiles, card.id, currentLocale.value);
      } else if (formData.items && formData.items.length === 0) {
        // Clear the cache for this sequence's children
        await sequenceStore.replaceCacheForParent([], card.id, currentLocale.value);
      }

      popupService.close();

      // Force reload to ensure images are displayed correctly
      await loadSequence();
    }
  } catch (error) {
    console.error('Failed to save sequence:', error);
    // TODO: Show error notification
  }
};

// Hide item from user's view
const hideItem = async (itemId: string) => {
  try {
    const currentSettings = settings.value;
    const hiddenItems = [...currentSettings.hiddenItems, itemId];

    await sequenceStore.updateSettings({ hiddenItems });

    // Remove from current view
    sequence.value = sequence.value.filter(c => c.id !== itemId);

    toastService.success(t('sequence.itemHidden'));
    popupService.close();
  } catch (error) {
    console.error('Failed to hide item:', error);
    toastService.error('Failed to hide item');
  }
};

// Duplicate item and mark original as hidden
const duplicateItem = async (originalCard: SequenceTile) => {
  try {
    // Force load the full sequence with items directly from the service (bypass cache for curated items)
    console.log('[SequenceView] Loading items for curated sequence:', {
      id: originalCard.id,
      title: originalCard.title,
      type: originalCard.type,
      isCurated: originalCard.isCurated,
      user_id: originalCard.user_id,
      ownerId: originalCard.ownerId
    });

    const items = originalCard.type === 'sequence'
      ? await sequenceService.loadSequence(originalCard.id)
      : [];

    console.log('[SequenceView] Loaded', items.length, 'items for duplication');
    if (items.length === 0) {
      console.warn('[SequenceView] WARNING: No items found for curated sequence. This means children are not loading!');
    } else {
      console.log('[SequenceView] Items loaded:', items.map(item => ({ id: item.id, title: item.title, type: item.type })));
    }

    // Create the duplicate with reference to original
    const duplicateData = {
      title: `${originalCard.title} (Copy)`,
      color: originalCard.color,
      image: originalCard.image ? { url: originalCard.image, alt: originalCard.title } : null,
      isPublic: false, // Duplicated items are private by default
      items: items.map((item, idx) => ({
        id: `temp-${Date.now()}-${idx}`,
        title: item.title,
        color: item.color || originalCard.color,
        image: item.image ? { url: item.image, alt: item.title } : null,
        speak: item.speech || '',
        orderIndex: idx
      })),
      // Add metadata about the original item
      originalItemId: originalCard.id,
      originalOwnerId: originalCard.user_id || originalCard.ownerId
    };

    // Find position to insert
    const targetIndex = findFirstEmptyPosition();

    // Create the sequence
    const sequenceId = await sequenceService.createSequence(
      duplicateData,
      currentGroupId.value,
      targetIndex
    );

    if (sequenceId) {
      // Hide the original item
      const currentSettings = settings.value;
      const hiddenItems = [...currentSettings.hiddenItems, originalCard.id];
      await sequenceStore.updateSettings({ hiddenItems });

      // Remove original from view and add duplicate
      sequence.value = sequence.value.filter(c => c.id !== originalCard.id);

      const newSequence: SequenceTile = {
        id: sequenceId,
        title: duplicateData.title,
        color: duplicateData.color,
        image: duplicateData.image?.url || null,
        type: 'sequence' as any,
        index: targetIndex,
        speech: '',
        icon: 'square',
        parentId: currentGroupId.value,
        isPublic: false,
        user_id: authStore.user?.id,
        // Store reference to original
        originalItemId: originalCard.id
      };

      // Add to sequence
      const updatedSequence = [...sequence.value];
      const emptyCardIndex = updatedSequence.findIndex(c => c.id.startsWith('empty-') && c.index === targetIndex);
      if (emptyCardIndex >= 0) {
        updatedSequence[emptyCardIndex] = newSequence;
      } else {
        updatedSequence.push(newSequence);
      }
      sequence.value = updatedSequence.sort((a, b) => a.index - b.index);

      await sequenceStore.addCardToCache(newSequence, currentGroupId.value, currentLocale.value);

      // If the duplicated sequence has items, add them to the cache with correct parentId
      if (duplicateData.items && duplicateData.items.length > 0) {
        console.log('[SequenceView] Adding', duplicateData.items.length, 'child items to cache');
        const childrenTiles: SequenceTile[] = duplicateData.items.map((item: any, idx: number) => ({
          id: item.id, // Keep the temp ID for now, will get real ID after save
          title: item.title,
          color: item.color,
          image: item.image?.url || '',
          speech: item.speak || '',
          type: 'sequence-item' as any,
          icon: 'square',
          index: item.orderIndex,
          parentId: sequenceId, // IMPORTANT: Set the new sequence ID as parent
          user_id: authStore.user?.id
        }));

        // Add children to cache
        await sequenceStore.replaceCacheForParent(childrenTiles, sequenceId, currentLocale.value);

        // Update the tilesWithChildren tracking
        tilesWithChildren.value.add(sequenceId);
        tileChildrenMap.value.set(sequenceId, childrenTiles);
      }

      toastService.success(t('sequence.itemDuplicated'));
      popupService.close();
    }
  } catch (error) {
    console.error('Failed to duplicate item:', error);
    toastService.error('Failed to duplicate item');
  }
};

// Open the card edit form
const openCardEditForm = async (card: SequenceTile, index: number) => {
  const isNewCard = card.id.startsWith('empty-');

  console.log('[SequenceView] openCardEditForm - isNewCard:', isNewCard, 'card:', card);
  console.log('[SequenceView] authStore.user?.id:', authStore.user?.id);

  // Load translations if editing existing card (for potential future use)
  if (!isNewCard) {
    try {
      await ItemTranslationService.getTranslations(card.id);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  // Calculate ownership
  const isOwner = isNewCard ? true : (card.ownerId === authStore.user?.id || card.user_id === authStore.user?.id);
  const isCurated = card.isCurated || false;

  console.log('[SequenceView] Calculated isOwner:', isOwner, 'isCurated:', isCurated);

  // If it's a curated item that the user doesn't own, show curated actions instead
  if (!isOwner && isCurated) {
    popupService.open({
      component: CuratedItemActions,
      title: t('sequence.curatedSequence'),
      actions: [
        {
          id: 'close',
          label: t('common.close'),
          type: 'outline',
          color: 'secondary',
          action: () => popupService.close()
        }
      ],
      props: {
        sequence: card,
        onHide: hideItem,
        onDuplicate: duplicateItem
      }
    });
    return;
  }

  // Create refs to store the component instance and save loading state
  let formComponentRef = null;
  const isSaving = ref(false);

  console.log('[SequenceView] showVisibilityToggle will be:', true);

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
          console.log('Calling triggerSave on component');
          formComponentRef.triggerSave();
        } else {
          console.error('No triggerSave method available on component', formComponentRef);
        }
      },
    },
  ]);


  popupService.open({
    component: SequenceForm,
    title: isNewCard ? t('sequence.createSequence') : t('sequence.editSequence'),
    actions: actions,
    props: {
      sequence: card,
      isNew: isNewCard,
      isOwner: isOwner,
      showVisibilityToggle: true,
      // Pass a ref callback to get the component instance
      onMounted: (componentInstance: any) => {
        console.log('Form component mounted with instance:', componentInstance);
        formComponentRef = componentInstance;
      },
      onSave: async (formData: any) => {
        try {
          isSaving.value = true;
          await handleSaveSequence(formData, card, isNewCard, index);
          popupService.close();
        } catch (error) {
          console.error('Failed to save sequence:', error);
          // Don't close popup on error so user can retry
        } finally {
          isSaving.value = false;
        }
      }
    }
  });
};

// Confirm delete card action
const confirmDeleteCard = async (card: SequenceTile) => {
  const hasChildren = tilesWithChildren.value.has(card.id);
  const message = hasChildren
    ? t('sequence.deleteThisCard') + ' ' + 'This will also delete all contents in this group.'
    : t('sequence.deleteThisCard');

  if (confirm(message)) {
    // Store original state for rollback
    const originalSequence = [...sequence.value];

    try {
      // Optimistic update - remove from UI immediately
      sequence.value = sequence.value.filter(c => c.id !== card.id);

      // Remove from store cache
      await sequenceStore.removeCardFromCache(card.id, currentGroupId.value, currentLocale.value);

      // Delete from database in background
      const success = await sequenceService.deleteCard(card.id);

      if (!success) {
        throw new Error('Failed to delete card');
      }

      // Success - no need to do anything, UI is already updated
      console.log('Card deleted successfully:', card.id);

    } catch (error) {
      console.error('Failed to delete card:', error);

      // Rollback on failure
      sequence.value = originalSequence;

      // Re-add to cache
      await sequenceStore.updateCardInCache(card, currentGroupId.value, currentLocale.value);

      // Show error toast
      toastService.error(t('sequence.failedToDeleteCard'));
    }
  }
};

const handleCardClick = async (card: SequenceTile, index: number) => {
  // In selection mode, toggle selection instead of normal behavior
  if (selectionMode.value && !card.id.startsWith('empty-')) {
    toggleTileSelection(card.id);
    return;
  }

  if (isEditMode.value) {
    // For empty sequence, directly open the edit form
    if (card.id.startsWith('empty-')) {
      openCardEditForm(card, index);
    }
    // For existing cards in edit mode, do nothing - let TCardGrid handle the context menu
    return;
  } else {
    // In view mode, handle based on whether it's a sequence or has children
    if (!card.id.startsWith('empty-')) {
      // Check if this is a sequence (has children) - check both the loaded children and card type
      const hasChildren = tilesWithChildren.value.has(card.id) || card.type === 'sequence';

      if (hasChildren && !currentGroupId.value) {
        // We're at the home screen and clicked a sequence - start play mode
        startPlayMode(card.id);
      } else if (hasChildren) {
        // We're already inside a group, navigate deeper
        handleTileAction(card);
      } else if (currentGroupId.value) {
        // We're inside a sequence and clicked an item, just speak it
        handleTileAction(card);
      } else if (card.type === 'sequence') {
        // Fallback: if it's a sequence type but children weren't loaded, try to navigate anyway
        console.warn(`[SequenceView] Sequence ${card.id} clicked but children not loaded, attempting to start play mode`);
        startPlayMode(card.id);
      }
    }
  }
};

const handleTileAction = async (tile: SequenceTile) => {
  // Check if this tile has children
  const hasChildren = await sequenceService.hasChildren(tile.id);

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
    const speakLocale = (tile as any).effective_locale || (tile as any).base_locale || currentLocale.value;
    // Extract language code for metadata (e.g., 'nl-NL' -> 'nl')
    const speakLanguage = speakLocale.split('-')[0];
    console.log(`[TTS] Speaking text in locale: ${speakLocale}, language code: ${speakLanguage}`);

    // Pass both the language code and the speech text
    // The TTS service will handle adding language hints if needed
    if (tile.speech) {
      await speak(tile.speech, { language: speakLanguage });
    }
  }
};

const navigateToTile = async (tile: SequenceTile) => {
  // Show ghost sequence immediately
  sequence.value = generateGhostSequence();
  isLoading.value = true;

  // Navigate immediately
  await router.push(`/${tile.id}`);

  // The watch on route params will trigger loadSequence automatically
};

const navigateToBreadcrumb = async (index: number) => {
  const crumb = breadcrumbs.value[index];

  // Show ghost sequence immediately
  sequence.value = generateGhostSequence();
  isLoading.value = true;

  if (crumb.id) {
    await router.push(`/${crumb.id}`);
  } else {
    // Navigate to home
    await router.push('/');
  }
};

const handleBack = async () => {
  // If in play mode, exit play mode
  if (isPlayMode.value) {
    await exitPlayMode();
    return;
  }

  // Show ghost sequence immediately
  sequence.value = generateGhostSequence();
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

// Use computed properties to get children data from the store's cache
const tilesWithChildren = computed(() => {
  const hasChildren = new Set<string>();
  sequence.value.forEach(card => {
    if (card.type === 'sequence' && !card.id.startsWith('empty-')) {
      // Check if this sequence has children in the store cache
      const children = sequenceStore.getSequenceForParent(card.id, currentLocale.value);
      if (children && children.length > 0) {
        hasChildren.add(card.id);
      }
    }
  });
  return hasChildren;
});

// Store actual children data for preview - computed from store cache
const tileChildrenMap = computed(() => {
  const childrenMap = new Map<string, SequenceTile[]>();
  sequence.value.forEach(card => {
    if (card.type === 'sequence' && !card.id.startsWith('empty-')) {
      const children = sequenceStore.getSequenceForParent(card.id, currentLocale.value);
      if (children && children.length > 0) {
        childrenMap.set(card.id, children);
      }
    }
  });
  return childrenMap;
});

// Track if any tile is being dragged
const isTileDragging = ref(false);

const handleCardDrop = async (droppedCard: SequenceTile, targetCard: SequenceTile) => {
  if (droppedCard.id === targetCard.id) return;

  // Don't allow dropping on empty sequence - this should be handled by handleCardReorder
  if (targetCard.id.startsWith('empty-')) {
    console.log('Cannot drop on empty placeholder');
    return;
  }

  // Don't allow dropping a parent into its own child (prevent circular references)
  // TODO: Implement proper recursive check through the database
  // For now, just prevent the most obvious case

  // Optimistic update - immediately update UI
  const originalSequence = [...sequence.value];

  // Remove the card from current view immediately
  sequence.value = sequence.value.filter(c => c.id !== droppedCard.id);

  // Don't update the children map here - wait for the actual save to succeed

  try {
    // Get existing children to find the next available index
    const existingChildren = await sequenceService.loadSequence(targetCard.id);
    const nextIndex = existingChildren.length;

    // When dropping on an existing tile, always move it INTO that tile as a child
    const updatedCard = {
      ...droppedCard,
      parentId: targetCard.id,
      parent_id: targetCard.id, // Make sure we use the correct field name
      index: nextIndex, // Use next available index instead of always 0
    };

    await sequenceService.saveCard(updatedCard, targetCard.id, nextIndex);

    // Update the store cache with the moved card
    await sequenceStore.addCardToCache(updatedCard, targetCard.id, currentLocale.value);

    console.log(`Moved "${droppedCard.title}" into group "${targetCard.title}" at index ${nextIndex}`);
  } catch (error) {
    console.error('Failed to move card:', error);
    // Rollback on error
    sequence.value = originalSequence;
  }
};

const handleCardReorder = async (card: SequenceTile, newIndex: number) => {
  // Don't do anything if the card is already at this position
  if (card.index === newIndex) return;

  // Store original state for rollback
  const originalSequence = [...sequence.value];

  // Create new array and remove the card from its current position
  const newSequence = sequence.value.filter(c => c.id !== card.id);

  // Update the card's index
  const movedCard = { ...card, index: newIndex };

  // Insert the card at the new position in the array
  newSequence.splice(newIndex, 0, movedCard);

  // Update UI instantly - card should appear in new position immediately
  sequence.value = newSequence;

  // Save to database
  try {
    await sequenceService.saveCard(movedCard, currentGroupId.value, newIndex);
    console.log(`Moved "${card.title}" to position ${newIndex}`);
  } catch (error) {
    console.error('Failed to reorder card:', error);
    // Rollback on error
    sequence.value = originalSequence;
  }
};


// Multi-card drop handler
const handleMultiCardDrop = async (droppedSequence: SequenceTile[], targetCard: SequenceTile) => {
  if (targetCard.id.startsWith('empty-')) {
    console.log('Cannot drop multiple sequence on empty placeholder');
    return;
  }

  // Move all selected sequence into the target group
  const originalSequence = [...sequence.value];

  try {
    // First, get existing children in the target group to find the next available index
    const existingChildren = await sequenceService.loadSequence(targetCard.id);
    const nextIndex = existingChildren.length;

    // Remove all dropped sequence from current view
    sequence.value = sequence.value.filter(c => !droppedSequence.some(dc => dc.id === c.id));

    // Sort dropped sequence by their current index to maintain order
    const sortedDroppedSequence = [...droppedSequence].sort((a, b) => a.index - b.index);

    // Update parent_id and index for all dropped sequence
    for (let i = 0; i < sortedDroppedSequence.length; i++) {
      const card = sortedDroppedSequence[i];
      const updatedCard = {
        ...card,
        parent_id: targetCard.id,
        index: nextIndex + i, // Ensure each card gets a unique sequential index
      };
      await sequenceService.saveCard(updatedCard, targetCard.id, updatedCard.index);
    }

    // Mark target as having children and update the preview
    tilesWithChildren.value.add(targetCard.id);

    // Update the children preview for the target tile
    const allChildren = [...existingChildren, ...sortedDroppedSequence];
    tileChildrenMap.value.set(targetCard.id, allChildren);

    // Clear selection after successful drop
    clearSelection();

    console.log(`Moved ${droppedSequence.length} sequence into "${targetCard.title}" starting at index ${nextIndex}`);
  } catch (error) {
    console.error('Failed to move multiple sequence:', error);
    sequence.value = originalSequence;
  }
};

// Multi-card reorder handler
const handleMultiCardReorder = async (reorderedSequence: SequenceTile[], targetIndex: number) => {
  const originalSequence = [...sequence.value];

  // Optimistic update - immediately update UI
  // Remove the sequence being moved
  const remainingSequence = sequence.value.filter(c => !reorderedSequence.some(rc => rc.id === c.id));

  // Insert the moved sequence at the target position
  const newSequence = [...remainingSequence];
  newSequence.splice(targetIndex, 0, ...reorderedSequence);

  // Update all indices to be sequential
  newSequence.forEach((card, index) => {
    card.index = index;
  });

  // Update UI immediately
  sequence.value = newSequence;

  try {
    // Save all sequence with their new indices
    const cardIds = newSequence
      .filter(c => !c.id.startsWith('empty-'))
      .map(c => c.id);

    await sequenceService.reorderSequence(cardIds);

    // Clear selection after successful reorder
    clearSelection();

    console.log(`Reordered ${reorderedSequence.length} sequence to position ${targetIndex}`);
  } catch (error) {
    console.error('Failed to reorder multiple sequence:', error);
    sequence.value = originalSequence;
  }
};

// Load all groups hierarchically from root level
const loadAllGroupsHierarchically = async (): Promise<SequenceTile[]> => {
  console.log('[SequenceView] loadAllGroupsHierarchically called');
  const allGroups: SequenceTile[] = [];

  const loadGroupsRecursively = async (parentId: string | null, depth = 0) => {
    try {
      console.log(`[SequenceView] Loading sequence for parent: ${parentId}, depth: ${depth}`);
      const sequence = await sequenceService.loadSequence(parentId);
      console.log(`[SequenceView] Found ${sequence.length} sequence for parent ${parentId}`);

      for (const card of sequence) {
        if (!card.id.startsWith('empty-')) {
          console.log(`[SequenceView] Processing card: ${card.title} (depth ${depth})`);

          // Check if this card has children (is actually a group)
          try {
            const children = await sequenceService.loadSequence(card.id);
            const hasChildren = children.some(child => !child.id.startsWith('empty-'));

            if (hasChildren) {
              console.log(`[SequenceView] Card ${card.title} is a group with children`);

              // Add only sequence that are actual groups
              const groupWithPath = {
                ...card,
                displayTitle: '  '.repeat(depth) + card.title, // Indent based on depth
                depth
              };
              allGroups.push(groupWithPath);
              console.log(`[SequenceView] Added group: ${card.title} (depth ${depth})`);

              // Recursively load children groups
              await loadGroupsRecursively(card.id, depth + 1);
            } else {
              console.log(`[SequenceView] Card ${card.title} has no children, skipping`);
            }
          } catch (childError) {
            console.log(`[SequenceView] Could not load children for ${card.title}:`, childError);
          }
        }
      }
    } catch (error) {
      console.error(`[SequenceView] Error loading groups for parent ${parentId}:`, error);
    }
  };

  // Start from root level (null parent)
  console.log('[SequenceView] Starting recursive load from root');
  await loadGroupsRecursively(null);
  console.log(`[SequenceView] Finished loading all groups. Total: ${allGroups.length}`);
  return allGroups;
};

// Bulk action handlers
const moveSelectedToGroup = async () => {
  console.log('[SequenceView] moveSelectedToGroup called - START');

  try {
    const selectedSequence = sequence.value.filter(c => selectedTileIds.value.has(c.id));
    console.log('[SequenceView] Selected sequence:', selectedSequence.length);

    if (selectedSequence.length === 0) {
      alert('No sequence selected');
      return;
    }

    // Try to load all groups hierarchically, with a timeout and fallback
    console.log('[SequenceView] Starting hierarchical load...');
    let availableGroups;

    try {
      // Set a shorter timeout for the hierarchical loading
      const hierarchicalPromise = loadAllGroupsHierarchically();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Hierarchical loading timeout after 3 seconds')), 3000)
      );

      const allGroups = await Promise.race([hierarchicalPromise, timeoutPromise]);
      console.log('[SequenceView] Hierarchical load completed:', allGroups.length, 'groups');

      // Filter out selected sequence from available groups
      availableGroups = allGroups.filter(g => !selectedTileIds.value.has(g.id));
      console.log('[SequenceView] Available groups after filtering:', availableGroups.length);

    } catch (hierarchicalError) {
      console.error('[SequenceView] Hierarchical loading failed, using fallback:', hierarchicalError);

      // More comprehensive fallback: try to find groups from different sources
      console.log('[SequenceView] Trying comprehensive fallback...');

      // Check if we have cached information about which sequence have children
      const potentialGroups = [];

      // 1. Use sequence from tilesWithChildren cache
      for (const cardId of tilesWithChildren.value) {
        const card = sequence.value.find(c => c.id === cardId);
        if (card && !selectedTileIds.value.has(card.id)) {
          potentialGroups.push(card);
        }
      }

      // 2. Add current level sequence that might be groups (any card can become a group)
      const currentLevelSequence = sequence.value.filter(c =>
        !c.id.startsWith('empty-') && !selectedTileIds.value.has(c.id)
      );

      // 3. Try to load some sequence from parent levels if we're in a nested view
      let parentLevelSequence = [];
      if (currentGroupId.value) {
        try {
          // Load sequence from root level as additional options
          const rootSequence = await sequenceService.loadSequence(null);
          parentLevelSequence = rootSequence.filter(c =>
            !c.id.startsWith('empty-') &&
            !selectedTileIds.value.has(c.id) &&
            c.id !== currentGroupId.value
          );
        } catch (e) {
          console.log('[SequenceView] Could not load root sequence for fallback');
        }
      }

      // Combine and deduplicate all potential destinations
      const allPotentialGroups = [...potentialGroups];
      [...currentLevelSequence, ...parentLevelSequence].forEach(card => {
        if (!allPotentialGroups.some(g => g.id === card.id)) {
          allPotentialGroups.push(card);
        }
      });

      availableGroups = allPotentialGroups;
      console.log('[SequenceView] Using comprehensive fallback groups:', availableGroups.length);
    }

    console.log('[SequenceView] Opening popup with groups:', availableGroups.length);
    popupService.open({
      component: GroupSelector,
      title: 'Move to Group',
      props: {
        groups: availableGroups,
        selectedCount: selectedSequence.length,
        onSelect: async (group: SequenceTile) => {
          try {
            // Get existing children to find the next available index
            const existingChildren = await sequenceService.loadSequence(group.id);
            let nextIndex = existingChildren.length;

            // Move all selected sequence to the target group with sequential indices
            for (const card of selectedSequence) {
              await sequenceService.saveCard({
                ...card,
                parentId: group.id,  // Set the new parent
                index: nextIndex     // Set the sequential index
              }, group.id, nextIndex);  // Pass both parentId and index parameters

              nextIndex++; // Increment for next card
            }

            // Remove moved sequence from current view
            sequence.value = sequence.value.filter(c => !selectedTileIds.value.has(c.id));

            // Clear selection
            clearSelection();

            // Update target group cache
            tilesWithChildren.value.add(group.id);

            popupService.close();

            // Navigate to the target group to show the moved sequence
            console.log(`[SequenceView] Navigating to target group: ${group.id}`);
            await navigateToTile(group);
          } catch (error) {
            console.error('Failed to move sequence:', error);
            alert('Failed to move sequence. Please try again.');
          }
        },
        onCancel: () => {
          popupService.close();
        }
      }
    });
  } catch (error) {
    console.error('[SequenceView] Error in moveSelectedToGroup:', error);
    alert('Failed to load groups. Please try again.');
  }
};

const changeSelectedColor = () => {
  // Show color picker for bulk color change
  popupService.open({
    component: TColorPicker,
    title: 'Change Color for Selected Sequence',
    props: {
      colors: Object.values(BaseColors),
      modelValue: 'primary',
      onUpdate: async (color: string) => {
        try {
          const selectedSequence = sequence.value.filter(c => selectedTileIds.value.has(c.id));

          // Update color for all selected sequence
          for (const card of selectedSequence) {
            const updatedCard = { ...card, color: color as any };
            await sequenceService.saveCard(updatedCard, currentGroupId.value);

            // Update in UI
            const index = sequence.value.findIndex(c => c.id === card.id);
            if (index >= 0) {
              sequence.value[index] = updatedCard;
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
    deleteSelectedSequence();
  }
};

const deleteSelectedSequence = async () => {
  try {
    const selectedIds = Array.from(selectedTileIds.value);

    // Delete all selected sequence
    for (const cardId of selectedIds) {
      await sequenceService.deleteCard(cardId);

      // Clear from cache
    }

    // Remove from UI
    sequence.value = sequence.value.filter(c => !selectedTileIds.value.has(c.id));

    // Clear selection
    clearSelection();
  } catch (error) {
    console.error('Failed to delete sequence:', error);
    alert('Failed to delete some sequence. Please try again.');
  }
};

// Find first empty position in the grid
const findFirstEmptyPosition = (): number => {
  // Get all occupied positions
  const occupiedPositions = new Set(
    sequence.value
      .filter(c => !c.id.startsWith('empty-'))
      .map(c => c.index)
  );

  // Find first missing index
  for (let i = 0; i < sequence.value.length; i++) {
    if (!occupiedPositions.has(i)) {
      return i;
    }
  }

  // If all positions are filled, return next position
  return sequence.value.length;
};

// We'll just ensure the card is visible by reloading if needed
// The CardGrid component will handle pagination internally

// Add sequence modal (unified single/bulk)
const openBulkAddMode = () => {
  popupService.open({
    component: AddSequenceModal,
    title: t('sequence.addSequence'),
    size: 'large',
    props: {
      // For single card save
      onSave: async (cardData: Partial<SequenceTile>) => {
        try {
          // Find first empty position
          const targetIndex = findFirstEmptyPosition();

          const savedId = await sequenceService.saveCard(
            { ...cardData, index: targetIndex },
            currentGroupId.value,
            targetIndex
          );

          if (savedId) {
            const newCard: SequenceTile = {
              ...cardData,
              id: savedId,
              index: targetIndex,
            } as SequenceTile;

            // Replace empty card or add to list
            const emptyIndex = sequence.value.findIndex(c => c.index === targetIndex && c.id.startsWith('empty-'));
            if (emptyIndex !== -1) {
              sequence.value[emptyIndex] = newCard;
            } else {
              sequence.value.push(newCard);
            }

            // Sort sequence by index
            sequence.value.sort((a, b) => a.index - b.index);

            // Update store cache
            await sequenceStore.addCardToCache(newCard, currentGroupId.value, currentLocale.value);

            // The CardGrid will automatically handle showing the new card
          }
        } catch (error) {
          console.error('Failed to create card:', error);
          alert('Failed to create card. Please try again.');
        }
      },
      // For bulk create
      onCreate: async (newSequence: Partial<SequenceTile>[]) => {
        try {
          let firstNewCardIndex = -1;

          // Create all sequence
          for (const cardData of newSequence) {
            const targetIndex = findFirstEmptyPosition();

            if (firstNewCardIndex === -1) {
              firstNewCardIndex = targetIndex;
            }

            const savedId = await sequenceService.saveCard(
              { ...cardData, index: targetIndex },
              currentGroupId.value,
              targetIndex
            );

            if (savedId) {
              const newCard: SequenceTile = {
                ...cardData,
                id: savedId,
                index: targetIndex,
              } as SequenceTile;

              // Replace empty card or add to list
              const emptyIndex = sequence.value.findIndex(c => c.index === targetIndex && c.id.startsWith('empty-'));
              if (emptyIndex !== -1) {
                sequence.value[emptyIndex] = newCard;
              } else {
                sequence.value.push(newCard);
              }

              // Update store cache
              await sequenceStore.addCardToCache(newCard, currentGroupId.value, currentLocale.value);
            }
          }

          // Sort sequence by index
          sequence.value.sort((a, b) => a.index - b.index);

          // The CardGrid will automatically handle showing the new sequence

          popupService.close();
        } catch (error) {
          console.error('Failed to create sequence:', error);
          alert('Failed to create some sequence. Please try again.');
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
    const cardPath = await sequenceService.getCardPath(cardId);

    // Build breadcrumbs with Home as root
    const path: Array<{ id?: string; title: string }> = [
      { id: undefined, title: 'Home' }
    ];

    // Add all sequence in the path
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
  console.log('[SequenceView] Route changed to cardId:', cardId);

  // Show loading state while loading
  if (!isLoading.value) {
    console.log('[SequenceView] Setting ghost sequence while loading');
    sequence.value = generateGhostSequence();
  }

  // Update breadcrumbs (this also sets currentGroupId)
  await buildBreadcrumbs(cardId);

  // Load the sequence
  await loadSequence();

  console.log('[SequenceView] Route change handling complete');
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

// Watch for locale changes and reload sequence with new translations
watch(() => currentLocale.value, async (newLocale, oldLocale) => {
  if (newLocale !== oldLocale && newLocale) {
    console.log('[SequenceView] Locale changed from', oldLocale, 'to', newLocale, '- reloading sequence...');

    // Clear the cache for the old locale to force fresh load
    await sequenceStore.clearCacheForLocale(oldLocale);

    // Load all sequence with new locale
    await sequenceStore.loadAllSequence(newLocale);

    // Reload current view with new translations
    await loadSequence();
  }
});

// Initialize
onMounted(async () => {
  console.log('[SequenceView] Component mounted, loading sequence...');
  try {
    // Initialize parent mode
    if (parentMode.initialize) {
      console.log('[SequenceView] Initializing parent mode...');
      await parentMode.initialize();
    }

    // Pre-request speech permission to avoid delay on first click
    if (!hasPermission.value) {
      await requestPermission();
    }

    await sequenceStore.loadState();

    // Load ALL sequence initially in single API call
    console.log('[SequenceView] Loading all sequence on app initialization...');
    await sequenceStore.loadAllSequence(currentLocale.value);
    console.log('[SequenceView] All sequence loaded into cache');

    // Listen for edit mode keyboard shortcuts
    eventBus.on('app:editModeShortcut', handleEditModeShortcut);

    // Don't load sequence here - the route watcher with immediate: true will handle it
    console.log('[SequenceView] Initialization complete');
  } catch (error) {
    console.error('[SequenceView] Failed to initialize:', error);
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

.sequence-view {
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
</style>
