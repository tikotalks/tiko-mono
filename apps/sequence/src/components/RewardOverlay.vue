<template>
  <div :class="bemm()">


    <!-- Animation Layer -->
    <div :class="bemm('animation')" v-if="!animationCompleted">
      <component
        :is="animationComponent"
        v-if="animationComponent"
        ref="animationRef"
        @completed="onAnimationCompleted"
      />
    </div>

    <!-- Content overlay (shows after animation) -->
    <div :class="bemm('content')" :style="{ opacity: showContent ? 1 : 0 }">
      <div>
        <h2 :class="bemm('title')">{{ t('sequence.greatJob') }}</h2>
        <p :class="bemm('message')">{{ t('sequence.completedSequence') }}</p>

        <div :class="bemm('actions')">
          <TButton
            color="primary"
            size="large"
            :icon="Icons.ARROW_RELOAD_DOWN_UP"
            @click="$emit('restart')"
          >
            {{ t('sequence.playAgain') }}
          </TButton>

          <TButton
            color="secondary"
            type="outline"
            size="large"
            :icon="Icons.ARROW_THICK_LEFT"
            @click="$emit('close')"
          >
            {{ t('common.done') }}
          </TButton>
        </div>
      </div>
    </div>
      <!-- Close button -->
      <TButton
      v-if="!animationCompleted"
      :class="bemm('close-button')"
      :icon="Icons.MULTIPLY_M"
      size="large"
      type="ghost"
      @click="skipAnimation"
      :aria-label="t('common.close')"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeMount, defineAsyncComponent, shallowRef, onBeforeUnmount } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { useImageResolver, useI18n } from '@tiko/core'
import type { AnimationImageConfig, AnimationImage } from './animations/types'
import { Icons } from 'open-icon';

const emit = defineEmits<{
  restart: []
  close: []
}>()

const bemm = useBemm('reward-overlay')
const { t } = useI18n()
const { preloadImages } = useImageResolver()

// Animation types
const animations = ['rocket', 'alien', 'reef', 'deepsea', 'fruitcatcher', 'solarsystem'] as const
type AnimationType = typeof animations[number]
// Select random animation
const selectedAnimation = ref<AnimationType>(animations[Math.floor(Math.random() * animations.length)])

// State
const animationCompleted = ref(false)
const showContent = ref(false)
const animationRef = ref<any>(null)

// Define lazy-loaded animation components
const animationComponents = {
  rocket: defineAsyncComponent(() => import('./animations/RocketCanvasAnimation.vue')),
  alien: defineAsyncComponent(() => import('./animations/AliensCanvasAnimation.vue')),
  reef: defineAsyncComponent(() => import('./animations/ReefCanvasAnimation.vue')),
  deepsea: defineAsyncComponent(() => import('./animations/DeepSeaCanvasAnimation.vue')),
  fruitcatcher: defineAsyncComponent(() => import('./animations/FruitCatcherCanvasAnimation.vue')),
  solarsystem: defineAsyncComponent(() => import('./animations/SolarSystemCanvasAnimation.vue'))
}

// Current animation component
const animationComponent = shallowRef(animationComponents[selectedAnimation.value])

const onAnimationCompleted = () => {
  animationCompleted.value = true
  // Show content after a brief delay
  setTimeout(() => {
    showContent.value = true
  }, 200) // Reduced delay for snappier feel
}

const skipAnimation = () => {
  // Stop the animation and any sounds it's playing
  if (animationRef.value) {
    // Call cleanup method if available
    if (typeof animationRef.value.cleanup === 'function') {
      animationRef.value.cleanup()
    }
    
    // Stop any audio/sounds
    if (animationRef.value.audio) {
      animationRef.value.audio.pause()
      animationRef.value.audio.currentTime = 0
    }
    
    // Stop animation loop if available
    if (typeof animationRef.value.stopAnimation === 'function') {
      animationRef.value.stopAnimation()
    }
  }
  
  // Skip the animation and show content immediately
  animationCompleted.value = true
  showContent.value = true
}

// Helper function to get the correct file name for each animation
function getAnimationFileName(animation: AnimationType): string {
  const fileNames: Record<AnimationType, string> = {
    rocket: 'RocketCanvasAnimation',
    alien: 'AliensCanvasAnimation',
    reef: 'ReefCanvasAnimation',
    deepsea: 'DeepSeaCanvasAnimation',
    fruitcatcher: 'FruitCatcherCanvasAnimation',
    solarsystem: 'SolarSystemCanvasAnimation'
  }
  return fileNames[animation]
}

// Preload animation images before component mounts
onBeforeMount(async () => {
  try {
    // Dynamically import only the selected animation module
    const animationModule = await import(`./animations/${getAnimationFileName(selectedAnimation.value)}.vue`)
    const { animationImages } = animationModule

    if (animationImages && animationImages.length > 0) {
      await preloadImages(
        animationImages.map((img: AnimationImage | AnimationImageConfig) => ({
          src: img.id,
          options: img.options
        }))
      )
      console.log(`${selectedAnimation.value} animation images preloaded successfully`)
    }
  } catch (error) {
    console.warn('Failed to preload animation images:', error)
  }
})

onMounted(() => {
  console.log(`[RewardOverlay] Component mounted! Using ${selectedAnimation.value} animation`)
  // Trigger haptic feedback when overlay appears
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200])
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  // Ensure animation is properly cleaned up
  if (animationRef.value) {
    if (typeof animationRef.value.cleanup === 'function') {
      animationRef.value.cleanup()
    }
    if (animationRef.value.audio) {
      animationRef.value.audio.pause()
      animationRef.value.audio.currentTime = 0
    }
    if (typeof animationRef.value.stopAnimation === 'function') {
      animationRef.value.stopAnimation()
    }
  }
})
</script>

<style lang="scss">
.reward-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  &__animation {
    position: fixed;
    inset: 0;
    z-index: 1001;
  }

  &__content {
    position: fixed;
    inset: 0;
    z-index: 1002;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    transition: opacity 0.5s ease-in-out;

    > div {
      background: var(--color-surface);
      border-radius: 2rem;
      padding: 3rem 2rem;
      text-align: center;
      max-width: 90%;
      width: 400px;
      animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  &__title {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    color: var(--color-primary);
  }

  &__message {
    font-size: 1.125rem;
    color: var(--color-text-secondary);
    margin: 0 0 2rem;
  }

  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  &__close-button {
    position: fixed !important;
    top: var(--space);
    font-size: 1.5em;
    right: var(--space);
    z-index: 3000; // Higher than any animation elements
    pointer-events: auto !important; // Ensure it's clickable

    // Add background for better visibility
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>