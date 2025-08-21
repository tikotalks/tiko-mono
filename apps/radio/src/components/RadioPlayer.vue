<template>
  <div :class="bemm()">
    <!-- Hidden video element for audio extraction -->
    <video
      ref="videoElement"
      :src="currentItem?.videoUrl"
      style="position: absolute; visibility: hidden; width: 1px; height: 1px;"
      preload="metadata"
      @loadedmetadata="handleMetadataLoaded"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
      @canplay="handleCanPlay"
      @error="handleError"
      @loadstart="handleLoadStart"
    />

    <!-- Visual Display -->
    <div :class="bemm('visual')">
      <div :class="bemm('thumbnail-container')">
        <img
          :src="displayThumbnail"
          :alt="currentItem?.title || t('radio.noAudioSelected')"
          :class="bemm('thumbnail', { spinning: isPlaying })"
          @error="handleImageError"
        />

        <!-- Audio Visualizer Overlay -->
        <div v-if="isPlaying" :class="bemm('visualizer')">
          <div
            v-for="bar in 12"
            :key="bar"
            :class="bemm('visualizer-bar')"
            :style="{ animationDelay: `${bar * 0.1}s` }"
          />
        </div>
      </div>

      <!-- Track Info -->
      <div v-if="currentItem" :class="bemm('track-info')">
        <h2 :class="bemm('track-title')">{{ currentItem.title }}</h2>
        <p v-if="currentItem.description" :class="bemm('track-description')">
          {{ currentItem.description }}
        </p>
        <div v-if="currentItem.tags.length > 0" :class="bemm('track-tags')">
          <span
            v-for="tag in currentItem.tags"
            :key="tag"
            :class="bemm('track-tag')"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Player Controls -->
    <div :class="bemm('controls')">
      <!-- Previous/Next/Play Controls -->
      <div :class="bemm('main-controls')">
        <TButton
          icon="skip-back"
          type="ghost"
          size="large"
          :disabled="!hasPrevious"
          @click="previousTrack"
          :class="bemm('control-button')"
        />

        <TButton
          :icon="isPlaying ? 'pause' : 'play'"
          type="default"
          size="large"
          color="primary"
          :disabled="!canPlay || loading"
          :loading="loading"
          @click="togglePlay"
          :class="bemm('play-button')"
        />

        <TButton
          icon="skip-forward"
          type="ghost"
          size="large"
          :disabled="!hasNext"
          @click="nextTrack"
          :class="bemm('control-button')"
        />
      </div>

      <!-- Progress Bar -->
      <div :class="bemm('progress-section')">
        <div :class="bemm('progress-container')">
          <span :class="bemm('time-current')">{{ formatTime(currentTime) }}</span>

          <div :class="bemm('progress-bar')" @click="handleProgressClick">
            <div
              :class="bemm('progress-track')"
              :style="{ width: progressPercentage + '%' }"
            />
            <div
              :class="bemm('progress-handle')"
              :style="{ left: progressPercentage + '%' }"
            />
          </div>

          <span :class="bemm('time-total')">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Secondary Controls -->
      <div :class="bemm('secondary-controls')">
        <!-- Volume Control -->
        <div :class="bemm('volume-control')">
          <TButton
            :icon="volumeIcon"
            type="ghost"
            size="medium"
            @click="toggleMute"
            :class="bemm('volume-button')"
          />
          <div :class="bemm('volume-slider')">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              :value="isMuted ? 0 : volume"
              @input="handleVolumeChange"
              :class="bemm('volume-input')"
            />
          </div>
        </div>

        <!-- Shuffle & Repeat -->
        <TButton
          icon="shuffle"
          type="ghost"
          size="medium"
          :color="shuffleMode ? 'primary' : 'secondary'"
          @click="toggleShuffle"
          :class="bemm('mode-button')"
        />

        <TButton
          :icon="repeatIcon"
          type="ghost"
          size="medium"
          :color="repeatMode !== 'none' ? 'primary' : 'secondary'"
          @click="toggleRepeat"
          :class="bemm('mode-button')"
        />

        <!-- Back to Grid -->
        <TButton
          icon="grid"
          type="ghost"
          size="medium"
          @click="$emit('back-to-grid')"
          :class="bemm('back-button')"
        >
          {{ t('common.back') }}
        </TButton>
      </div>

      <!-- Sleep Timer -->
      <div v-if="sleepTimer.isActive" :class="bemm('sleep-timer')">
        <TIcon name="moon" :class="bemm('sleep-icon')" />
        <span :class="bemm('sleep-text')">
          {{ t('radio.sleepIn', { minutes: sleepTimer.remainingMinutes }) }}
        </span>
        <TButton
          icon="x"
          type="ghost"
          size="small"
          @click="cancelSleepTimer"
          :class="bemm('sleep-cancel')"
        />
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" :class="bemm('error')">
      <TIcon name="alert-circle" :class="bemm('error-icon')" />
      <span :class="bemm('error-text')">{{ error }}</span>
      <TButton
        type="ghost"
        size="small"
        @click="clearError"
        :class="bemm('error-dismiss')"
      >
        {{ t('common.dismiss') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon } from '@tiko/ui'
import { useI18n } from '@tiko/core';
import { formatDuration } from '@tiko/ui'
import type { RadioItem, SleepTimer } from '../types/radio.types'

interface Props {
  currentItem: RadioItem | null
  playlist: RadioItem[]
  currentIndex: number
  shuffleMode: boolean
  repeatMode: 'none' | 'one' | 'all'
  sleepTimer: SleepTimer
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:current-time': [time: number]
  'update:duration': [duration: number]
  'update:is-playing': [playing: boolean]
  'update:volume': [volume: number]
  'track-ended': []
  'previous-track': []
  'next-track': []
  'toggle-shuffle': []
  'toggle-repeat': []
  'back-to-grid': []
  'cancel-sleep-timer': []
  'error': [error: string]
}>()

const bemm = useBemm('radio-player')
const { t, keys } = useI18n()

// Refs
const videoElement = ref<HTMLVideoElement | null>(null)

// Local state
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const isMuted = ref(false)
const loading = ref(false)
const canPlay = ref(false)
const error = ref<string | null>(null)

// Computed properties
const displayThumbnail = computed(() =>
  props.currentItem?.customThumbnailUrl ||
  props.currentItem?.thumbnailUrl ||
  '/assets/default-radio-thumbnail.svg'
)

const progressPercentage = computed(() =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
)

const hasPrevious = computed(() =>
  props.currentIndex > 0 || props.repeatMode === 'all'
)

const hasNext = computed(() =>
  props.currentIndex < props.playlist.length - 1 || props.repeatMode === 'all'
)

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'volume-x'
  if (volume.value < 0.3) return 'volume'
  if (volume.value < 0.7) return 'volume-1'
  return 'volume-2'
})

const repeatIcon = computed(() => {
  switch (props.repeatMode) {
    case 'one': return 'repeat-1'
    case 'all': return 'repeat'
    default: return 'repeat'
  }
})

/**
 * Toggle play/pause
 */
const togglePlay = async () => {
  if (!videoElement.value || !canPlay.value) return

  try {
    if (isPlaying.value) {
      await videoElement.value.pause()
    } else {
      await videoElement.value.play()
    }
  } catch (err) {
    console.error('Playback error:', err)
    error.value = 'Failed to play audio'
  }
}

/**
 * Seek to specific time
 */
const seekTo = (time: number) => {
  if (videoElement.value && canPlay.value) {
    videoElement.value.currentTime = Math.max(0, Math.min(time, duration.value))
  }
}

/**
 * Handle progress bar click
 */
const handleProgressClick = (event: MouseEvent) => {
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const newTime = percentage * duration.value
  seekTo(newTime)
}

/**
 * Handle volume change
 */
const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newVolume = parseFloat(target.value)

  volume.value = newVolume
  isMuted.value = newVolume === 0

  if (videoElement.value) {
    videoElement.value.volume = newVolume
  }

  emit('update:volume', newVolume)
}

/**
 * Toggle mute
 */
const toggleMute = () => {
  isMuted.value = !isMuted.value

  if (videoElement.value) {
    videoElement.value.muted = isMuted.value
  }
}

/**
 * Toggle shuffle mode
 */
const toggleShuffle = () => {
  emit('toggle-shuffle')
}

/**
 * Toggle repeat mode
 */
const toggleRepeat = () => {
  emit('toggle-repeat')
}

/**
 * Previous track
 */
const previousTrack = () => {
  emit('previous-track')
}

/**
 * Next track
 */
const nextTrack = () => {
  emit('next-track')
}

/**
 * Cancel sleep timer
 */
const cancelSleepTimer = () => {
  emit('cancel-sleep-timer')
}

/**
 * Clear error
 */
const clearError = () => {
  error.value = null
}

/**
 * Format time for display
 */
const formatTime = (seconds: number): string => {
  return formatDuration(Math.floor(seconds))
}

/**
 * Handle image error
 */
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/assets/default-radio-thumbnail.svg'
}

// Video event handlers
const handleMetadataLoaded = () => {
  if (videoElement.value) {
    duration.value = videoElement.value.duration || 0
    emit('update:duration', duration.value)
  }
}

const handleTimeUpdate = () => {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
    emit('update:current-time', currentTime.value)
  }
}

const handleEnded = () => {
  isPlaying.value = false
  emit('update:is-playing', false)
  emit('track-ended')
}

const handleCanPlay = () => {
  canPlay.value = true
  loading.value = false
}

const handleError = () => {
  error.value = 'Failed to load audio'
  loading.value = false
  canPlay.value = false
  emit('error', error.value)
}

const handleLoadStart = () => {
  loading.value = true
  canPlay.value = false
}

// Watch for current item changes
watch(() => props.currentItem, (newItem) => {
  if (newItem && videoElement.value) {
    loading.value = true
    canPlay.value = false
    currentTime.value = 0
    duration.value = 0
    error.value = null

    videoElement.value.src = newItem.videoUrl
    videoElement.value.load()
  }
})

// Watch for play state changes
watch(isPlaying, (playing) => {
  emit('update:is-playing', playing)
})

// Set up video element event listeners
onMounted(() => {
  if (videoElement.value) {
    videoElement.value.volume = volume.value

    // Listen for play/pause events
    videoElement.value.addEventListener('play', () => {
      isPlaying.value = true
    })

    videoElement.value.addEventListener('pause', () => {
      isPlaying.value = false
    })
  }
})

// Cleanup
onUnmounted(() => {
  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.src = ''
  }
})
</script>

<style lang="scss" scoped>
.radio-player {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl, 2em);
  padding: var(--space-xl, 2em);
  background: var(--color-background);
  min-height: 100vh;

  &__visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xl, 2em);
  }

  &__thumbnail-container {
    position: relative;
    width: 20em;
    height: 20em;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 8px 32px color-mix(in srgb, var(--color-foreground), transparent 80%);
  }

  &__thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.3s ease;

    &--spinning {
      animation: spin 20s linear infinite;
    }
  }

  &__visualizer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: color-mix(in srgb, var(--color-primary), transparent 85%);
    border-radius: 50%;
  }

  &__visualizer-bar {
    width: 3px;
    background: var(--color-background);
    border-radius: 2px;
    animation: visualize 1.5s ease-in-out infinite alternate;
  }

  &__track-info {
    text-align: center;
    max-width: 40em;
  }

  &__track-title {
    font-size: 1.75em;
    font-weight: 700;
    color: var(--color-foreground);
    margin: 0 0 var(--space-s, 0.5em) 0;
    line-height: 1.2;
  }

  &__track-description {
    font-size: 1em;
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    line-height: 1.5;
    margin: 0 0 var(--space-md, 1em) 0;
  }

  &__track-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs, 0.5em);
    justify-content: center;
  }

  &__track-tag {
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
    color: color-mix(in srgb, var(--color-primary), var(--color-foreground) 20%);
    padding: var(--space-xs, 0.5em) var(--space-md, 1em);
    border-radius: var(--radius-lg, 1em);
    font-size: 0.875em;
    font-weight: 500;
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg, 1.5em);
    align-items: center;
  }

  &__main-controls {
    display: flex;
    align-items: center;
    gap: var(--space-lg, 1.5em);
  }

  &__play-button {
    width: 4em;
    height: 4em;
    border-radius: 50%;
    font-size: 1.5em;
  }

  &__control-button {
    width: 3em;
    height: 3em;
    border-radius: 50%;
  }

  &__progress-section {
    width: 100%;
    max-width: 50em;
  }

  &__progress-container {
    display: flex;
    align-items: center;
    gap: var(--space-md, 1em);
  }

  &__progress-bar {
    flex: 1;
    height: 0.5em;
    background: color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-radius: var(--radius-lg, 1em);
    position: relative;
    cursor: pointer;
  }

  &__progress-track {
    height: 100%;
    background: var(--color-primary);
    border-radius: inherit;
    transition: width 0.1s ease;
  }

  &__progress-handle {
    position: absolute;
    top: 50%;
    width: 1em;
    height: 1em;
    background: var(--color-primary);
    border: 2px solid var(--color-background);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.1s ease;
  }

  &__time-current,
  &__time-total {
    font-size: 0.875em;
    color: color-mix(in srgb, var(--color-foreground), transparent 30%);
    font-weight: 500;
    min-width: 3em;
    text-align: center;
  }

  &__secondary-controls {
    display: flex;
    align-items: center;
    gap: var(--space-lg, 1.5em);
    flex-wrap: wrap;
    justify-content: center;
  }

  &__volume-control {
    display: flex;
    align-items: center;
    gap: var(--space-s, 0.75em);
  }

  &__volume-slider {
    width: 6em;
  }

  &__volume-input {
    width: 100%;
    height: 0.25em;
    background: color-mix(in srgb, var(--color-foreground), transparent 85%);
    border-radius: var(--radius-lg, 1em);
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 1em;
      height: 1em;
      background: var(--color-primary);
      border-radius: 50%;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 1em;
      height: 1em;
      background: var(--color-primary);
      border-radius: 50%;
      border: none;
      cursor: pointer;
    }
  }

  &__sleep-timer {
    display: flex;
    align-items: center;
    gap: var(--space-s, 0.75em);
    padding: var(--space-s, 0.75em) var(--space-md, 1em);
    background: color-mix(in srgb, var(--color-tertiary), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-tertiary), transparent 70%);
    border-radius: var(--radius-lg, 1em);
    font-size: 0.875em;
    color: color-mix(in srgb, var(--color-tertiary), var(--color-foreground) 20%);
  }

  &__sleep-icon {
    color: var(--color-tertiary);
  }

  &__error {
    display: flex;
    align-items: center;
    gap: var(--space-s, 0.75em);
    padding: var(--space-md, 1em);
    background: color-mix(in srgb, var(--color-error), transparent 90%);
    border: 1px solid color-mix(in srgb, var(--color-error), transparent 70%);
    border-radius: var(--border-radius, 0.75em);
    color: color-mix(in srgb, var(--color-error), var(--color-foreground) 20%);
  }

  &__error-icon {
    color: var(--color-error);
  }
}

// Animations
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes visualize {
  0% { height: 10px; }
  100% { height: 40px; }
}

// Responsive design
@media (max-width: 768px) {
  .radio-player {
    padding: var(--space-lg, 1.5em);

    &__thumbnail-container {
      width: 15em;
      height: 15em;
    }

    &__track-title {
      font-size: 1.5em;
    }

    &__secondary-controls {
      gap: var(--space-md, 1em);
    }

    &__volume-slider {
      width: 4em;
    }
  }
}

@media (max-width: 480px) {
  .radio-player {
    padding: var(--space-md, 1em);

    &__thumbnail-container {
      width: 12em;
      height: 12em;
    }

    &__main-controls {
      gap: var(--space-md, 1em);
    }

    &__play-button {
      width: 3.5em;
      height: 3.5em;
    }

    &__control-button {
      width: 2.5em;
      height: 2.5em;
    }

    &__secondary-controls {
      flex-direction: column;
      gap: var(--space-s, 0.75em);
    }
  }
}
</style>
