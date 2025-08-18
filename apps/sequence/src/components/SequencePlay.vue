<template>
  <div :class="bemm()">
    <!-- Play area with shuffled items -->
    <div :class="bemm('play-area')">
      <TCardGrid
        :cards="visibleItems"
        :show-arrows="false"
        :edit-mode="props.editMode"
        :tiles-with-children="new Set()"
        :tile-children-map="new Map()"
        :is-tile-dragging="false"
        :selection-mode="false"
        :selected-tile-ids="new Set()"
        :is-loading="false"
        :auto-arrange="true"
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
    <RewardOverlay v-if="isComplete" @restart="$emit('restart')" @close="$emit('close')" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import { useBemm } from 'bemm'
import { TCardTile, TButton, TCardGrid, useI18n } from '@tiko/ui'
import type { TCardTile as CardTileType } from '@tiko/ui'
import { useSequenceStore } from '../stores/sequence'
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

// State for error animation
const wrongItemId = ref<string | null>(null)

// Computed properties
const playState = computed(() => sequenceStore.currentPlayState)
const visibleItems = computed(() => {
  // Return all shuffled items with their custom state
  const items = playState.value.shuffledItems.map(item => {
    const isItemSelected = sequenceStore.currentPlayState.selectedItems.some(s => s.id === item.id)
    let customState = undefined

    if (isItemSelected) {
      customState = 'sequence-selected'
    } else if (wrongItemId.value === item.id) {
      customState = 'sequence-wrong'
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
const isComplete = computed(() => playState.value.isComplete)
const showHints = computed(() => sequenceStore.settings.showHints)

// Check if item is selected
const isItemSelected = (itemId: string) => {
  return playState.value.selectedItems.some(item => item.id === itemId)
}

// Check if item is next in sequence
const isItemNext = (itemId: string) => {
  return sequenceStore.isItemNext(itemId)
}

// Handle card click from TCardGrid
const handleCardClick = async (card: CardTileType, index: number) => {
  // In edit mode, don't play the game
  if (props.editMode) {
    return
  }

  const isCorrect = await sequenceStore.selectItem(card.id)

  if (isCorrect) {
    // Play success sound
    if (sequenceStore.settings.soundEffects) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 440 // Higher frequency for success (A4 note)
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }

    if (sequenceStore.settings.hapticFeedback) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  } else {
    // Play error sound
    if (sequenceStore.settings.soundEffects) {
      // Play a simple error beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 200 // Low frequency for error
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2) // Short beep
    }

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

// Start play when component mounts
watch(() => props.sequenceId, async (newId) => {
  console.log(`[SequencePlay] Sequence ID changed to:`, newId)
  if (newId) {
    console.log(`[SequencePlay] Starting play for sequence:`, newId)
    await sequenceStore.startPlay(newId)
    console.log(`[SequencePlay] Play started, current play state:`, sequenceStore.currentPlayState)
  }
}, { immediate: true })
</script>

<style lang="scss">
.sequence-play {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
  padding: 1rem;

  // Style for selected items in the sequence game
  .t-card-tile__wrapper--sequence-selected {
    opacity: 0.5;
    pointer-events: none;

    .t-card-tile {
      transform: scale(0.95);
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

  &__play-area {
    flex: 1;
    overflow-y: auto;
  }

  &__order-board {
    flex-shrink: 0;
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
</style>
