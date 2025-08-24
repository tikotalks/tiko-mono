<template>
  <div :class="bemm()">
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

    <!-- Animation Layer -->
    <div :class="bemm('animation')" v-if="!animationCompleted">
      <RocketCanvasAnimation
        v-if="selectedAnimation === 'rocket'"
        ref="animationRef"
        @completed="onAnimationCompleted"
      />
      <AliensCanvasAnimation
        v-else-if="selectedAnimation === 'alien'"
        ref="animationRef"
        @completed="onAnimationCompleted"
      />
      <ReefCanvasAnimation
        v-else-if="selectedAnimation === 'reef'"
        ref="animationRef"
        @completed="onAnimationCompleted"
      />
      <DeepSeaCanvasAnimation
        v-else-if="selectedAnimation === 'deepsea'"
        ref="animationRef"
        @completed="onAnimationCompleted"
      />
      <FruitCatcherCanvasAnimation
        v-else-if="selectedAnimation === 'fruitcatcher'"
        ref="animationRef"
        @completed="onAnimationCompleted"
      />
      <SolarSystemCanvasAnimation
        v-else-if="selectedAnimation === 'solarsystem'"
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeMount } from 'vue'
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { useImageResolver, useI18n } from '@tiko/core'
import RocketCanvasAnimation from './animations/RocketCanvasAnimation.vue'
import AliensCanvasAnimation from './animations/AliensCanvasAnimation.vue'
import ReefCanvasAnimation from './animations/ReefCanvasAnimation.vue'
import DeepSeaCanvasAnimation from './animations/DeepSeaCanvasAnimation.vue'
import FruitCatcherCanvasAnimation from './animations/FruitCatcherCanvasAnimation.vue'
import SolarSystemCanvasAnimation from './animations/SolarSystemCanvasAnimation.vue'
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
const animationRef = ref<InstanceType<typeof RocketCanvasAnimation> | InstanceType<typeof AliensCanvasAnimation> | InstanceType<typeof ReefCanvasAnimation> | InstanceType<typeof DeepSeaCanvasAnimation> | InstanceType<typeof FruitCatcherCanvasAnimation> | InstanceType<typeof SolarSystemCanvasAnimation> | null>(null)

const onAnimationCompleted = () => {
  animationCompleted.value = true
  // Show content after a brief delay
  setTimeout(() => {
    showContent.value = true
  }, 200) // Reduced delay for snappier feel
}

const skipAnimation = () => {
  // Skip the animation and show content immediately
  animationCompleted.value = true
  showContent.value = true
}

// Preload animation images before component mounts
onBeforeMount(async () => {
  try {
    if (selectedAnimation.value === 'rocket') {
      const { animationImages } = await import('./animations/RocketCanvasAnimation.vue')

      if (animationImages && animationImages.length > 0) {
        await preloadImages(
          animationImages.map((img: AnimationImage) => ({
            src: img.id,
            options: img.options
          }))
        )
        console.log('Rocket animation images preloaded successfully')
      }
    } else if (selectedAnimation.value === 'alien') {
      const { animationImages } = await import('./animations/AliensCanvasAnimation.vue')

      if (animationImages && animationImages.length > 0) {
        await preloadImages(
          animationImages.map((img: AnimationImage) => ({
            src: img.id,
            options: img.options
          }))
        )
        console.log('Aliens animation images preloaded successfully')
      }
    } else if (selectedAnimation.value === 'reef') {
      const { animationImages } = await import('./animations/ReefCanvasAnimation.vue')

      if (animationImages && animationImages.length > 0) {
        await preloadImages(
          animationImages.map((img: AnimationImage) => ({
            src: img.id,
            options: img.options
          }))
        )
        console.log('Reef animation images preloaded successfully')
      }
    } else if (selectedAnimation.value === 'deepsea') {
      const { animationImages } = await import('./animations/DeepSeaCanvasAnimation.vue')

      if (animationImages && animationImages.length > 0) {
        await preloadImages(
          animationImages.map((img: AnimationImage) => ({
            src: img.id,
            options: img.options
          }))
        )
        console.log('Deep Sea animation images preloaded successfully')
      }
    } else if (selectedAnimation.value === 'fruitcatcher') {
      const { animationImages } = await import('./animations/FruitCatcherCanvasAnimation.vue')

      if (animationImages && animationImages.length > 0) {
        await preloadImages(
          animationImages.map((img: AnimationImage) => ({
            src: img.id,
            options: img.options
          }))
        )
        console.log('Fruit Catcher animation images preloaded successfully')
      }
    } else if (selectedAnimation.value === 'solarsystem') {
      const { animationImages } = await import('./animations/SolarSystemCanvasAnimation.vue')

      if (animationImages && animationImages.length > 0) {
        await preloadImages(
          animationImages.map((img: AnimationImageConfig) => ({
            src: img.id,
            options: img.options
          }))
        )
        console.log('Solar System animation images preloaded successfully')
      }
    }
  } catch (error) {
    console.warn('Failed to preload some animation images:', error)
  }
})

onMounted(() => {
  console.log(`[RewardOverlay] Component mounted! Using ${selectedAnimation.value} animation`)
  // Trigger haptic feedback when overlay appears
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200])
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
    position: fixed;
    top: 2rem;
    right: 2rem;
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
