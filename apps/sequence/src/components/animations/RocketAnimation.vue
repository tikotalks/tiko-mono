<template>
  <div :class="bemm()" :style="containerStyle" @click="handleClick">
    <!-- No click message needed - auto-starts -->

    <!-- Fullscreen space background -->
    <div :class="bemm('background')" :style="backgroundStyle">
      <TImage
        :class="bemm('bg-image')"
        :src="IMAGE.background"
        media="assets"
        alt="Space background"
        size="full"
        @error="handleBackgroundError"
        @load="handleBackgroundLoad" />
    </div>

    <!-- Rocket -->
    <div :class="bemm('rocket')" :style="rocketStyle">
      <TImage
        :class="bemm('rocket-image')"
        :src="IMAGE.rocket"
        media="public"
        alt="Rocket"
        size="full"
        @error="handleRocketError"
        @load="handleRocketLoad" />
    </div>

    <!-- Debug info hidden -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TImage } from '@tiko/ui'
import { usePlaySound, SOUNDS, useImageResolver } from '@tiko/core'
import type { AnimationImage } from './types'

const emit = defineEmits<{
  completed: []
}>()


const IMAGE = {
  background: '651585d8-2210-4b8c-8fe0-c1404ee19796',
  rocket: 'ec501b1c-4a9a-465c-b32b-609369e7a87a'
}

// Define images needed by this animation
const ANIMATION_IMAGES: AnimationImage[] = [
  { id: IMAGE.background, options: { media: 'assets' } },
  { id: IMAGE.rocket, options: { media: 'public' } }
]

// Expose the images for parent components
defineExpose({
  images: ANIMATION_IMAGES
})

const bemm = useBemm('rocket-animation')
const { playSound } = usePlaySound()
const { preloadImages } = useImageResolver()

// State
const animationStarted = ref(false)
const backgroundLoaded = ref(false)
const rocketLoaded = ref(false)

// Image loading handlers
const handleBackgroundError = (error: Event) => {
  console.error('Failed to load space background:', error)
  backgroundLoaded.value = false
}

const handleBackgroundLoad = () => {
  console.log('Space background loaded successfully')
  backgroundLoaded.value = true
}

const handleRocketError = (error: Event) => {
  console.error('Failed to load rocket image:', error)
  rocketLoaded.value = false
}

const handleRocketLoad = () => {
  console.log('Rocket image loaded successfully')
  rocketLoaded.value = true
}

// Click handler
const handleClick = () => {
  if (!animationStarted.value) {
    animationStarted.value = true
    startAnimation()
  }
}

// Animation state
const animationPhase = ref<'entering' | 'bouncing' | 'flying' | 'exiting' | 'finished'>('entering')
const rocketY = ref(120) // Start below screen (percentage)
const rocketRotation = ref(0)
const backgroundY = ref(0) // Background starts at 0
const opacity = ref(0) // For fade in/out

// Computed styles
const rocketStyle = computed(() => {
  return {
    transform: `translate(-50%, ${-rocketY.value}%) rotate(${rocketRotation.value}deg)`,
    transition: animationPhase.value === 'entering' ? 'transform 1.5s ease-out' :
                animationPhase.value === 'bouncing' ? 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' :
                'none'
  }
})

const backgroundStyle = computed(() => ({
  transform: `translateY(${backgroundY.value}px)`
  // No transition - handle animation in JavaScript for smooth control
}))

const containerStyle = computed(() => ({
  opacity: opacity.value
}))

// Animation sequence
const startAnimation = async () => {
  console.log('Starting rocket animation...')

  // Fade in animation
  const fadeInDuration = 1000 // 1 second fade in
  const fadeInStartTime = Date.now()
  
  const fadeIn = () => {
    const elapsed = Date.now() - fadeInStartTime
    const progress = Math.min(elapsed / fadeInDuration, 1)
    opacity.value = progress
    
    if (progress < 1) {
      requestAnimationFrame(fadeIn)
    }
  }
  
  requestAnimationFrame(fadeIn)

  // Phase 1: Rocket enters from bottom
  animationPhase.value = 'entering'
  rocketY.value = 50 // Move to center of screen

  // Wait for entrance animation
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Phase 2: Bouncing animation (rocket bounces in place)
  animationPhase.value = 'bouncing'

  // Create bouncing effect with multiple bounces
  const bounces = [
    { y: 45, rotation: -5, duration: 600 },
    { y: 52, rotation: 2, duration: 500 },
    { y: 48, rotation: -2, duration: 400 },
    { y: 51, rotation: 1, duration: 300 },
    { y: 50, rotation: 0, duration: 200 }
  ]

  for (const bounce of bounces) {
    rocketY.value = bounce.y
    rocketRotation.value = bounce.rotation
    await new Promise(resolve => setTimeout(resolve, bounce.duration))
  }

    // Play rocket sound
    playSound({
    id: SOUNDS.ROCKET,
    volume: 0.7
  })
  // Phase 3: Flying animation
  animationPhase.value = 'flying'

  // Start flying up with background scrolling
  const flyDuration = 4000 // 4 seconds
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / flyDuration, 1)

    // Easing function for smooth acceleration
    const easeIn = progress * progress

    // Rocket flies up from center to above screen
    rocketY.value = 50 + (easeIn * 120) // From 50% (center) to 170% (off screen)
    rocketRotation.value = Math.sin(elapsed * 0.002) * 3 // Gentle wobble

    // Background scrolls up as rocket goes up
    backgroundY.value = easeIn * window.innerHeight * 2 // Translate down by 200vh (moves image up)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Phase 4: Exit animation with slow background and fade out
      animationPhase.value = 'exiting'

      // Continue animation with slowing background and fade out
      const exitDuration = 3000 // 3 seconds for exit
      const exitStartTime = Date.now()
      const initialBackgroundY = backgroundY.value

      const exitAnimate = () => {
        const exitElapsed = Date.now() - exitStartTime
        const exitProgress = Math.min(exitElapsed / exitDuration, 1)

        // Easing function for deceleration (ease-out)
        const easeOut = 1 - Math.pow(1 - exitProgress, 3)

        // Continue moving rocket up
        rocketY.value = 170 + (exitProgress * 50) // Move further off screen

        // Slow down background movement (only move an additional 20% of viewport)
        backgroundY.value = initialBackgroundY + (easeOut * window.innerHeight * 0.2)

        // Fade out during the last half of the exit animation
        if (exitProgress > 0.5) {
          const fadeProgress = (exitProgress - 0.5) * 2 // Map 0.5-1 to 0-1
          opacity.value = 1 - fadeProgress
        }

        if (exitProgress < 1) {
          requestAnimationFrame(exitAnimate)
        } else {
          // Animation completed
          animationPhase.value = 'finished'
          opacity.value = 0
          setTimeout(() => {
            emit('completed')
          }, 100)
        }
      }

      requestAnimationFrame(exitAnimate)
    }
  }

  requestAnimationFrame(animate)
}

onMounted(() => {
  // Auto-start the animation after a small delay
  // Images should be preloaded by parent component
  setTimeout(() => {
    animationStarted.value = true
    startAnimation()
  }, 100)
})
</script>

<script lang="ts">
// Static export for parent components to access before instantiation
export const animationImages: AnimationImage[] = [
  { id: '651585d8-2210-4b8c-8fe0-c1404ee19796', options: { media: 'assets' } },
  { id: 'ec501b1c-4a9a-465c-b32b-609369e7a87a', options: { media: 'public' } }
]
</script>

<style lang="scss">
.rocket-animation {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: hidden;
  background-color: var(--color-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease-out;

  &__background {
    position: absolute;
    bottom: 0; // Position at bottom
    left: 0;
    width: 100vw;
    height: 300vh; // Triple height as requested
    z-index: 999;
  }

  &__bg-image {
    width: 100%;
    height: 100%;
    position: relative;

    // Force the wrapper div to have dimensions
    & > div {
      width: 100%;
      height: 100%;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      position: absolute;
      top: 0;
      left: 0;
    }
  }

  &__rocket {
    position: fixed;
    z-index: 1005;
    width: auto;
    height: 50vh;
    left: 50%;
    bottom: 0;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  &__rocket-image {
    width: auto;
    height: 50vh;
    position: relative;

    // Force the wrapper div to have dimensions
    & > div {
      width: 100%;
      height: 100%;
    }

    img {
      width: auto;
      height: 50vh;
      display: block;
      object-fit: contain;
    }
  }

  &__click-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    z-index: 1010;
    background: rgba(0, 0, 0, 0.7);
    padding: 20px 40px;
    border-radius: 10px;
    cursor: pointer;
  }

  &__debug {
    position: absolute;
    top: 20px;
    right: 20px;
    color: white;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 14px;
    z-index: 1010;

    div {
      margin-bottom: 5px;
    }
  }
}
</style>
