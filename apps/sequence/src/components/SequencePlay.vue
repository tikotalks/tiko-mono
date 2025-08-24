<template>
  <div :class="bemm()">
    <!-- Play area with shuffled items -->
    <div :class="bemm('play-area')">
      <TCardFlowGrid
        :cards="visibleItems"
        :edit-mode="props.editMode"
        :selection-mode="false"
        :selected-tile-ids="new Set()"
        :is-loading="false"
        :scroll-direction="'vertical'"
        :min-tile-size="120"
        :max-tile-size="400"
        :gap="16"
        :center-items="true"
        :show-status="false"
        :get-context-menu="props.editMode ? getItemContextMenu : undefined"
        @card-click="handleCardClick"
      />
    </div>

    <!-- Bottom order board showing selected items -->
    <BottomOrderBoard
      :items="selectedItems"
      :total-items="playState.shuffledItems.length"
      :class="bemm('order-board')"
    />

    <!-- Complete overlay -->
    <RewardOverlay v-if="showRewardOverlay" @restart="$emit('restart')" @close="$emit('close')" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { TCardTile, TButton, TCardFlowGrid } from '@tiko/ui'
import type { TCardTile as CardTileType } from '@tiko/ui'
import { useSequenceStore } from '../stores/sequence'
import { usePlaySound, SOUNDS } from '@tiko/core'
import BottomOrderBoard from './BottomOrderBoard.vue'
import RewardOverlay from './RewardOverlay.vue'
import { Icons } from 'open-icon'

const props = defineProps<{
  sequenceId: string
  editMode?: boolean
}>()

const emit = defineEmits<{
  restart: []
  close: []
}>()

const bemm = useBemm('sequence-play')
const sequenceStore = useSequenceStore()
const { t } = useI18n()
const { playSound } = usePlaySound()

// State for error animation
const wrongItemId = ref<string | null>(null)

// State for hint animation
const hintTimerRef = ref<number | null>(null)
const showHintAnimation = ref(false)
const lastActionTime = ref(Date.now())

// Computed properties
const playState = computed(() => {
  const state = sequenceStore.currentPlayState
  console.log('[SequencePlay] Current play state:', state)
  return state
})
const visibleItems = computed(() => {
  // Return all shuffled items with their custom state
  const items = playState.value.shuffledItems.map(item => {
    const isItemSelected = sequenceStore.currentPlayState.selectedItems.some(s => s.id === item.id)
    const isNext = sequenceStore.isItemNext(item.id)
    let customState = undefined

    if (isItemSelected) {
      customState = 'sequence-selected'
    } else if (wrongItemId.value === item.id) {
      customState = 'sequence-wrong'
    } else if (isNext && showHints.value && showHintAnimation.value) {
      customState = 'sequence-hint'
    }

    return {
      ...item,
      customState
    }
  })
  console.log(`[SequencePlay] All items with state:`, items.map((item, idx) => ({
    position: idx,
    id: item.id,
    title: item.title,
    customState: item.customState,
    correctOrder: item.index
  })))
  return items
})
const selectedItems = computed(() => playState.value.selectedItems)
const isComplete = computed(() => {
  const complete = playState.value.isComplete
  console.log('[SequencePlay] isComplete computed:', complete)
  return complete
})
const showRewardOverlay = computed(() => {
  const shouldShow = playState.value.isComplete && !props.editMode
  console.log('[SequencePlay] showRewardOverlay:', shouldShow, 'isComplete:', playState.value.isComplete, 'editMode:', props.editMode)
  return shouldShow
})
const showHints = computed(() => sequenceStore.settings.showHints)

// Check if item is selected
const isItemSelected = (itemId: string) => {
  return playState.value.selectedItems.some(item => item.id === itemId)
}

// Check if item is next in sequence
const isItemNext = (itemId: string) => {
  return sequenceStore.isItemNext(itemId)
}

// Hint timer management
const resetHintTimer = () => {
  if (hintTimerRef.value) {
    clearTimeout(hintTimerRef.value)
    hintTimerRef.value = null
  }
  showHintAnimation.value = false
  lastActionTime.value = Date.now()
}

const startHintTimer = () => {
  if (!showHints.value || playState.value.isComplete) return
  
  resetHintTimer()
  
  // Schedule hint every 5 seconds
  const scheduleHint = () => {
    hintTimerRef.value = window.setTimeout(() => {
      if (!showHints.value || playState.value.isComplete) return
      
      showHintAnimation.value = true
      
      // Hide hint after 1 second (bump animation duration)
      setTimeout(() => {
        showHintAnimation.value = false
        // Recursively schedule next hint
        scheduleHint()
      }, 1000)
    }, 5000) // 5 seconds between hints
  }
  
  // Start the first hint
  scheduleHint()
}

// Handle card click from TCardGrid
const handleCardClick = async (card: CardTileType, index: number) => {
  // In edit mode, don't play the game
  if (props.editMode) {
    return
  }

  // Reset hint timer on any interaction
  resetHintTimer()

  const isCorrect = await sequenceStore.selectItem(card.id)

  if (isCorrect) {
    // Play success sound
    // if (sequenceStore.settings.soundEffects) {
      playSound({
        id: SOUNDS.WIN,
        volume: 0.5
      })
    // }

    if (sequenceStore.settings.hapticFeedback) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  } else {
    // Play error sound
    // if (sequenceStore.settings.soundEffects) {
      // Play the wrong item sound from assets
      playSound({
        id: SOUNDS.WRONG_ITEM,
        volume: 0.5
      })
    // }

    // Add haptic feedback for errors
    if (sequenceStore.settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]) // Double vibration for error
    }

    // Update the item's custom state to show error
    const itemIndex = visibleItems.value.findIndex(item => item.id === card.id)
    if (itemIndex >= 0) {
      // We need to trigger a re-render with the error state
      // Since we can't directly modify the computed property, we'll use a reactive approach
      wrongItemId.value = card.id

      // Remove the error state after animation
      setTimeout(() => {
        wrongItemId.value = null
      }, 600)
    }
  }
  
  // Restart hint timer after action
  startHintTimer()
}

// Context menu for editing items in play mode
const getItemContextMenu = (card: CardTileType, index: number) => {
  return [
    {
      id: 'edit',
      label: t('common.edit'),
      icon: Icons.EDIT_M,
      action: () => openItemEditForm(card, index)
    }
  ]
}

// Open edit form for individual sequence items
const openItemEditForm = (card: CardTileType, index: number) => {
  // TODO: Implement item editing
  console.log('Edit item:', card.title)
}

// Watch for completion
watch(isComplete, (newVal) => {
  console.log('[SequencePlay] isComplete changed to:', newVal)
  if (newVal) {
    console.log('[SequencePlay] Sequence completed! RewardOverlay should show')
  }
})

// Start play when component mounts
watch(() => props.sequenceId, async (newId) => {
  console.log(`[SequencePlay] Sequence ID changed to:`, newId)
  if (newId) {
    console.log(`[SequencePlay] Starting play for sequence:`, newId)
    await sequenceStore.startPlay(newId)
    console.log(`[SequencePlay] Play started, current play state:`, sequenceStore.currentPlayState)
    
    // Start hint timer when play starts
    startHintTimer()
  }
}, { immediate: true })

// Watch for showHints setting changes
watch(showHints, (newValue) => {
  if (newValue) {
    startHintTimer()
  } else {
    resetHintTimer()
  }
})

// Watch for game completion
watch(() => playState.value.isComplete, (isComplete) => {
  if (isComplete) {
    resetHintTimer()
  }
})

// Clean up on unmount
onUnmounted(() => {
  resetHintTimer()
})
</script>

<style lang="scss">
.sequence-play {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  // Style for selected items in the sequence game
  .t-card-tile__wrapper--sequence-selected {
    opacity: 0.5;
    pointer-events: none;

    transform: scale(0.75);
    .t-card-tile {
      transform: scale(0.75);
      box-shadow: none;
      filter: grayscale(50%);
    }
  }

  // Style for wrong selections with shake animation
  .t-card-tile__wrapper--sequence-wrong {
    animation: shake-error 0.6s !important;

    .t-card-tile {
      background-color: rgba(255, 0, 0, 0.2) !important;
      border: 2px solid var(--color-error) !important;
    }
  }

  // Style for hint animation with bump effect
  .t-card-tile__wrapper--sequence-hint {
    animation: bump-hint 1s ease-in-out !important;

    .t-card-tile {
      box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.5) !important;
    }
  }

  &__play-area {
    flex: 1;
    min-height: 0; // Important for proper flex sizing
    position: relative;
    overflow: hidden; // Prevent double scrollbars

    // The flow grid will handle its own scrolling and sizing
    .t-card-flow-grid {
      height: 100%;
      min-height: 100%;
    }
  }

  &__order-board {
    // flex-shrink: 0;
    // z-index: 10; // Ensure it stays above the grid
    // background: var(--color-background);
    // border-top: 1px solid var(--color-border);
    // padding-top: var(--space-m);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

@keyframes shake-error {
  0%, 100% {
    transform: translateX(0) scale(1);
  }
  10% {
    transform: translateX(-10px) rotate(-2deg) scale(1.05);
  }
  20% {
    transform: translateX(10px) rotate(2deg) scale(1.05);
  }
  30% {
    transform: translateX(-8px) rotate(-2deg) scale(1.03);
  }
  40% {
    transform: translateX(8px) rotate(2deg) scale(1.03);
  }
  50% {
    transform: translateX(-5px) rotate(-1deg) scale(1.02);
  }
  60% {
    transform: translateX(5px) rotate(1deg) scale(1.02);
  }
  70% {
    transform: translateX(-3px) scale(1.01);
  }
  80% {
    transform: translateX(3px) scale(1.01);
  }
  90% {
    transform: translateX(0) scale(1);
  }
}

@keyframes bump-hint {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.05);
  }
}
</style>
