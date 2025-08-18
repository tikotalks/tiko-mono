<template>
  <div :class="bemm()" @click="handleClick">
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

    <!-- Debug info -->
    <div :class="bemm('debug')">
      <div>Animation Phase: {{ animationPhase }}</div>
      <div>Animation Started: {{ animationStarted }}</div>
      <div>Rocket Y: {{ rocketY.toFixed(2) }}%</div>
      <div>Background loaded: {{ backgroundLoaded }}</div>
      <div>Rocket loaded: {{ rocketLoaded }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useBemm } from 'bemm'
import { TImage } from '@tiko/ui'
import { usePlaySound, SOUNDS } from '@tiko/core'

const emit = defineEmits<{
  completed: []
}>()


const IMAGE = {
  background: '651585d8-2210-4b8c-8fe0-c1404ee19796',
  rocket: 'ec501b1c-4a9a-465c-b32b-609369e7a87a'
}
const bemm = useBemm('rocket-animation')
const { playSound } = usePlaySound()

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
const backgroundY = ref(0) // Background scroll position

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

// Animation sequence
const startAnimation = async () => {
  console.log('Starting rocket animation...')



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

    // Background scrolls down as rocket goes up
    backgroundY.value = easeIn * (window.innerHeight * 0.8) // Scroll background down

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Phase 4: Exit animation
      animationPhase.value = 'exiting'

      // Continue moving rocket further off screen
      const exitDuration = 1000
      const exitStartTime = Date.now()

      const exitAnimate = () => {
        const exitElapsed = Date.now() - exitStartTime
        const exitProgress = Math.min(exitElapsed / exitDuration, 1)

        // Continue moving up
        rocketY.value = 170 + (exitProgress * 50) // Move further off screen
        
        // Continue scrolling background smoothly
        const currentBgY = window.innerHeight * 0.8
        backgroundY.value = currentBgY + (exitProgress * 200) // Continue scrolling down

        if (exitProgress < 1) {
          requestAnimationFrame(exitAnimate)
        } else {
          // Animation completed
          animationPhase.value = 'finished'
          setTimeout(() => {
            emit('completed')
          }, 300)
        }
      }

      requestAnimationFrame(exitAnimate)
    }
  }

  requestAnimationFrame(animate)
}

onMounted(() => {
  // Auto-start the animation
  animationStarted.value = true
  startAnimation()
})
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

  &__background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 200vh; // Double height for scrolling
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
