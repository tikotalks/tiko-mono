<template>
  <TAppLayout
    :title="currentSequence?.title || t('sequence.loading')"
    :show-back="true"
    :custom-actions="customActions"
    @back="handleBack"
  >
    <div :class="bemm()">
      <!-- Loading state -->
      <div v-if="isLoading" :class="bemm('loading')">
        <TSpinner size="large" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" :class="bemm('error')">
        <TEmpty
          :title="t('common.error')"
          :description="error"
          icon="exclamation-triangle"
        >
          <TButton type="secondary" @click="router.push('/')">
            {{ t('common.backToHome') }}
          </TButton>
        </TEmpty>
      </div>

      <!-- Play content -->
      <div v-else-if="currentSequence" :class="bemm('content')">
        <!-- Progress bar -->
        <div :class="bemm('progress')">
          <div
            :class="bemm('progress-bar')"
            :style="{ width: `${playProgress * 100}%` }"
          />
        </div>

        <!-- Instructions -->
        <div :class="bemm('instructions')">
          <h2>{{ t('sequence.tapInOrder') }}</h2>
          <p>{{ currentInstructions }}</p>
        </div>

        <!-- Items grid -->
        <div :class="bemm('grid', { complete: isPlayComplete })">
          <div
            v-for="item in shuffledPlayItems"
            :key="item.id"
            :class="bemm('item', {
              completed: isItemCompleted(item.id),
              next: isNextItem(item.id),
              incorrect: incorrectItemId === item.id
            })"
            :style="{
              '--item-color': `var(--color-${item.color || 'primary'})`
            }"
            @click="handleItemTap(item)"
          >
            <!-- Item content -->
            <div :class="bemm('item-content')">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.title"
                :class="bemm('item-image')"
              >
              <div v-else :class="bemm('item-text')">
                {{ item.title }}
              </div>
            </div>

            <!-- Completed overlay -->
            <div v-if="isItemCompleted(item.id)" :class="bemm('item-overlay')">
              <TIcon name="check" size="large" />
            </div>
          </div>
        </div>

        <!-- Completion screen -->
        <div v-if="isPlayComplete" :class="bemm('completion')">
          <div :class="bemm('completion-content')">
            <TIcon name="trophy" size="xlarge" :class="bemm('completion-icon')" />
            <h2>{{ t('sequence.wellDone') }}</h2>
            <p>{{ t('sequence.completedIn', { time: completionTime }) }}</p>

            <div :class="bemm('completion-actions')">
              <TButton
                type="primary"
                size="large"
                @click="handlePlayAgain"
              >
                {{ t('sequence.playAgain') }}
              </TButton>
              <TButton
                type="secondary"
                size="large"
                @click="router.push('/')"
              >
                {{ t('common.backToHome') }}
              </TButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import {
  TAppLayout,
  TButton,
  TEmpty,
  TSpinner,
  TIcon,
  useI18n,
  useSpeech
} from '@tiko/ui'
import { useAppStore, useEventBus } from '@tiko/core'
import { useSequenceStore } from '../stores/sequence'

const bemm = useBemm('sequence-play')
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { speak } = useSpeech()
const appStore = useAppStore()
const sequenceStore = useSequenceStore()
const eventBus = useEventBus()

// Props from route
const sequenceId = computed(() => route.params.id as string)

// State
const isLoading = computed(() => sequenceStore.isLoading)
const error = ref<string | null>(null)
const incorrectItemId = ref<string | null>(null)
const startTime = ref(Date.now())

// Computed from store
const currentSequence = computed(() => sequenceStore.getSequence.value(sequenceId.value))
const currentPlayItems = computed(() => sequenceStore.currentPlayItems)
const shuffledPlayItems = computed(() => sequenceStore.shuffledPlayItems)
const completedPlayItems = computed(() => sequenceStore.completedPlayItems)
const isPlayComplete = computed(() => sequenceStore.isPlayComplete)
const playProgress = computed(() => sequenceStore.playProgress)

// Settings
const settings = computed(() => appStore.getAppSettings('sequence') || {
  soundEnabled: true,
  animationsEnabled: true,
  autoAdvance: false,
  difficulty: 'medium'
})

// Custom actions
const customActions = computed(() => [
  {
    icon: 'redo',
    label: t('sequence.restart'),
    onClick: handleRestart
  }
])

// Current instructions
const currentInstructions = computed(() => {
  if (isPlayComplete.value) {
    return t('sequence.sequenceComplete')
  }

  const nextItem = currentPlayItems.value[completedPlayItems.value.length]
  if (!nextItem) return ''

  // Show different hints based on difficulty
  switch (settings.value.difficulty) {
    case 'easy':
      return t('sequence.tapItem', { item: nextItem.title })
    case 'medium':
      return t('sequence.tapNextItem', {
        current: completedPlayItems.value.length + 1,
        total: currentPlayItems.value.length
      })
    case 'hard':
      return t('sequence.findNextItem')
    default:
      return ''
  }
})

// Completion time
const completionTime = computed(() => {
  if (!isPlayComplete.value) return ''

  const duration = Date.now() - startTime.value
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) {
    return t('sequence.minutesSeconds', {
      minutes,
      seconds: seconds % 60
    })
  }

  return t('sequence.seconds', { seconds })
})

// Methods
const isItemCompleted = (itemId: string) => {
  return completedPlayItems.value.some(item => item.id === itemId)
}

const isNextItem = (itemId: string) => {
  if (isPlayComplete.value) return false
  const nextItem = currentPlayItems.value[completedPlayItems.value.length]
  return nextItem?.id === itemId
}

const handleItemTap = async (item: any) => {
  if (isPlayComplete.value) return
  if (isItemCompleted(item.id)) return

  const isCorrect = sequenceStore.checkTap(item.id)

  if (isCorrect) {
    // Play success sound/feedback
    if (settings.value.soundEnabled) {
      playSuccessSound()
    }

    // Speak the item if it has speech
    if (item.speech) {
      speak(item.speech)
    }

    // Clear any incorrect indicator
    incorrectItemId.value = null

    // Check if sequence is complete
    if (isPlayComplete.value) {
      handleCompletion()
    }
  } else {
    // Play error sound/feedback
    if (settings.value.soundEnabled) {
      playErrorSound()
    }

    // Show incorrect feedback
    incorrectItemId.value = item.id
    setTimeout(() => {
      incorrectItemId.value = null
    }, 1000)
  }
}

const handleRestart = () => {
  sequenceStore.resetPlay()
  startTime.value = Date.now()
  incorrectItemId.value = null
}

const handlePlayAgain = () => {
  handleRestart()
}

const handleBack = () => {
  // Clean up play state
  sequenceStore.endPlay()
  router.push('/')
}

const handleCompletion = () => {
  // Play completion sound
  if (settings.value.soundEnabled) {
    playCompletionSound()
  }

  // Log completion event
  console.log('[SequencePlay] Sequence completed!', {
    sequenceId: sequenceId.value,
    time: completionTime.value,
    attempts: completedPlayItems.value.length
  })
}

// Sound functions (simplified - would use actual audio in production)
const playSuccessSound = () => {
  // Simple beep using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  oscillator.frequency.value = 523.25 // C5
  oscillator.connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.1)
}

const playErrorSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  oscillator.frequency.value = 200 // Lower frequency for error
  oscillator.connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.2)
}

const playCompletionSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const notes = [523.25, 659.25, 783.99] // C5, E5, G5

  notes.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator()
    oscillator.frequency.value = freq
    oscillator.connect(audioContext.destination)
    oscillator.start(audioContext.currentTime + index * 0.15)
    oscillator.stop(audioContext.currentTime + index * 0.15 + 0.1)
  })
}

// Lifecycle
onMounted(async () => {
  try {
    // Load the sequence if needed
    await sequenceStore.loadSequences()

    // Start play mode
    await sequenceStore.startPlay(sequenceId.value)

    // Initialize start time
    startTime.value = Date.now()
  } catch (err) {
    console.error('[SequencePlay] Failed to start play:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load sequence'
  }
})

onUnmounted(() => {
  // Clean up play state if still active
  if (!isPlayComplete.value) {
    sequenceStore.endPlay()
  }
})

// Auto-advance to next sequence if enabled
watch(isPlayComplete, (complete) => {
  if (complete && settings.value.autoAdvance) {
    setTimeout(() => {
      // Find next sequence
      const sequences = sequenceStore.allSequences
      const currentIndex = sequences.findIndex(s => s.id === sequenceId.value)

      if (currentIndex < sequences.length - 1) {
        const nextSequence = sequences[currentIndex + 1]
        router.push(`/play/${nextSequence.id}`)
      }
    }, 3000)
  }
})
</script>

<style lang="scss" scoped>
.sequence-play {
  height: 100%;

  &__loading,
  &__error {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--space);
  }

  &__progress {
    height: 8px;
    background-color: var(--color-background-secondary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--space-lg);
  }

  &__progress-bar {
    height: 100%;
    background-color: var(--color-success);
    transition: width 0.3s ease;
  }

  &__instructions {
    text-align: center;
    margin-bottom: var(--space-xl);

    h2 {
      font-size: var(--font-size-xl);
      color: var(--color-text);
      margin-bottom: var(--space-xs);
    }

    p {
      font-size: var(--font-size-lg);
      color: var(--color-text-muted);
    }
  }

  &__grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space);
    align-content: center;

    &--complete {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &__item {
    position: relative;
    aspect-ratio: 1;
    background-color: var(--item-color, var(--color-primary));
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;

    &:hover:not(&--completed) {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &--completed {
      opacity: 0.6;
      cursor: default;
    }

    &--next {
      animation: pulse 2s infinite;
    }

    &--incorrect {
      animation: shake 0.5s;
      background-color: var(--color-danger) !important;
    }
  }

  &__item-content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space);
  }

  &__item-image {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
  }

  &__item-text {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: white;
    text-align: center;
    word-break: break-word;
  }

  &__item-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
  }

  &__completion {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  &__completion-content {
    background-color: var(--color-background);
    padding: var(--space-xl);
    border-radius: var(--border-radius-xl);
    text-align: center;
    max-width: 400px;

    h2 {
      font-size: var(--font-size-xxl);
      color: var(--color-text);
      margin: var(--space) 0;
    }

    p {
      font-size: var(--font-size-lg);
      color: var(--color-text-muted);
      margin-bottom: var(--space-lg);
    }
  }

  &__completion-icon {
    color: var(--color-warning);
    animation: bounce 1s ease infinite;
  }

  &__completion-actions {
    display: flex;
    gap: var(--space);
    justify-content: center;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
</style>
